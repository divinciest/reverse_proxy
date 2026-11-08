"""Unit tests for scripts/cert-manager.py and scripts/config-generator.py.

Run inside the image (has jinja2 and yaml):
  docker run --rm -v "$PWD:/src" -w /src --entrypoint python3 reverse_proxy-reverse-proxy -m unittest discover -s tests -v
"""
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(os.environ.get("SCRIPTS_DIR", ROOT / "scripts"))
TEMPLATES = Path(os.environ.get("TEMPLATES_DIR", ROOT / "templates"))


def load(name: str):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


cert_manager = load("cert-manager")
config_generator = load("config-generator")


class EmailArgsTest(unittest.TestCase):
    def test_registers_without_email_when_empty(self):
        self.assertEqual(cert_manager.email_args(""), ["--register-unsafely-without-email"])
        self.assertEqual(cert_manager.email_args(None), ["--register-unsafely-without-email"])

    def test_registers_without_email_for_placeholder(self):
        self.assertEqual(cert_manager.email_args("admin@example.com"), ["--register-unsafely-without-email"])

    def test_passes_real_email(self):
        self.assertEqual(cert_manager.email_args(" ops@source1.io "), ["--email", "ops@source1.io"])


class DomainValidationTest(unittest.TestCase):
    def test_accepts_hostnames(self):
        for d in ("source1.io", "www.source1.io", "a-b.example.co.uk", "localhost"):
            self.assertTrue(cert_manager.is_valid_domain(d), d)

    def test_rejects_injection_and_malformed(self):
        for d in ("", "-bad.com", "bad-.com", "a b.com", "x.com; rm -rf /", "x.com\nserver {", "a/../b"):
            self.assertFalse(cert_manager.is_valid_domain(d), repr(d))


class ParseAuthenticatorTest(unittest.TestCase):
    def test_reads_authenticator_from_renewal_conf(self):
        text = "version = 1.16.0\n[renewalparams]\nauthenticator = nginx\ninstaller = nginx\n"
        self.assertEqual(cert_manager.parse_authenticator(text), "nginx")

    def test_missing_authenticator(self):
        self.assertIsNone(cert_manager.parse_authenticator("[renewalparams]\n"))


class ObtainAllTest(unittest.TestCase):
    def make_manager(self, hosts):
        manager = cert_manager.CertificateManager.__new__(cert_manager.CertificateManager)
        manager.config = {"hosts": hosts}
        manager.email, manager.certbot, manager.staging = "", "certbot", False
        return manager

    def test_issues_missing_and_migrates_existing_skipping_localhost(self):
        manager = self.make_manager([
            {"domain": "new.example.org"}, {"domain": "old.example.org"}, {"domain": "app.localhost"},
        ])
        exists = lambda p: "old.example.org" in p
        with mock.patch.object(cert_manager.os.path, "exists", side_effect=exists), \
                mock.patch.object(manager, "issue", return_value=True) as issue, \
                mock.patch.object(manager, "migrate_to_webroot", return_value=True) as migrate:
            results = manager.obtain_all()
        issue.assert_called_once_with("new.example.org")
        migrate.assert_called_once_with("old.example.org")
        self.assertEqual(results, {"new.example.org": True, "old.example.org": True})

    def test_issue_uses_webroot_and_deploy_hook(self):
        manager = self.make_manager([])
        with mock.patch.object(cert_manager, "run", return_value=True) as run, \
                mock.patch.object(cert_manager.os, "makedirs"):
            manager.issue("source1.io")
        cmd = run.call_args[0][0]
        self.assertIn("--webroot", cmd)
        self.assertIn(cert_manager.ACME_WEBROOT, cmd)
        self.assertEqual(cmd[cmd.index("--deploy-hook") + 1], cert_manager.DEPLOY_HOOK)
        self.assertNotIn("--nginx", cmd)

    def test_renew_lets_certbot_decide(self):
        manager = self.make_manager([])
        with mock.patch.object(cert_manager, "run", return_value=True) as run:
            manager.renew_all()
        cmd = run.call_args[0][0]
        self.assertEqual(cmd[1], "renew")
        self.assertNotIn("--force-renewal", cmd)
        self.assertIn("--deploy-hook", cmd)


class ConfigGeneratorTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        le = Path(self.tmp.name)
        (le / "live" / "has.example.org").mkdir(parents=True)
        (le / "live" / "has.example.org" / "fullchain.pem").write_text("x")
        self.patches = [
            mock.patch.object(config_generator, "LETSENCRYPT_DIR", le),
            mock.patch.object(config_generator, "TEMPLATES_DIR", TEMPLATES),
        ]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def generate(self):
        return config_generator.generate_all_configs({"hosts": [
            {"domain": "has.example.org", "type": "frontend", "static_path": "/var/www/html/a"},
            {"domain": "none.example.org", "type": "frontend", "static_path": "/var/www/html/b"},
            {"domain": "api.example.org", "type": "backend", "backend_port": "not-a-port"},
            {"domain": "bad domain", "type": "frontend", "static_path": "/x"},
        ]})

    def test_https_only_for_domains_with_certificate(self):
        configs = self.generate()
        self.assertIn("dynamic-has_example_org.conf", configs)
        self.assertNotIn("dynamic-none_example_org.conf", configs)
        self.assertIn("http2 on;", configs["dynamic-has_example_org.conf"])

    def test_http_redirects_only_when_certificate_exists(self):
        challenges = self.generate()["http-challenges.conf"]
        blocks = challenges.split("server {")
        has_block = next(b for b in blocks if "server_name has.example.org;" in b)
        none_block = next(b for b in blocks if "server_name none.example.org;" in b)
        self.assertIn("return 301 https://$host$request_uri;", has_block)
        self.assertNotIn("return 301", none_block)
        for block in (has_block, none_block):
            self.assertIn("/.well-known/acme-challenge/", block)
            self.assertIn("root /var/www/acme;", block)

    def test_invalid_hosts_are_skipped(self):
        configs = self.generate()
        self.assertFalse(any("bad" in name for name in configs))
        self.assertNotIn("dynamic-api_example_org.conf", configs)

    def test_frontend_proxy_paths_route_to_local_ports(self):
        configs = config_generator.generate_all_configs({"hosts": [
            {"domain": "has.example.org", "type": "frontend", "static_path": "/var/www/html/a",
             "proxy_paths": [{"path": "/llm/", "port": 8790}]},
        ]})
        conf = configs["dynamic-has_example_org.conf"]
        self.assertIn("location ^~ /llm/ {", conf)
        self.assertIn("proxy_pass http://127.0.0.1:8790/;", conf)
        self.assertLess(conf.index("location ^~ /llm/"), conf.index("location / {"))

    def test_invalid_proxy_paths_are_rejected(self):
        for bad in ({"path": "/llm", "port": 8790}, {"path": "/a b/", "port": 1},
                    {"path": "/x/", "port": 70000}, {"path": "/x/;", "port": 1}, {"path": "/x/"}):
            configs = config_generator.generate_all_configs({"hosts": [
                {"domain": "has.example.org", "type": "frontend", "static_path": "/a", "proxy_paths": [bad]},
            ]})
            self.assertNotIn("dynamic-has_example_org.conf", configs, bad)

    def test_failed_validation_restores_previous_configs(self):
        with tempfile.TemporaryDirectory() as conf:
            conf_dir = Path(conf)
            (conf_dir / "dynamic-old.conf").write_text("old")
            with mock.patch.object(config_generator, "CONF_DIR", conf_dir), \
                    mock.patch.object(config_generator, "load_config", return_value={"hosts": []}), \
                    mock.patch.object(config_generator, "nginx", return_value=False):
                self.assertFalse(config_generator.generate_and_reload())
            self.assertEqual((conf_dir / "dynamic-old.conf").read_text(), "old")


if __name__ == "__main__":
    unittest.main()
