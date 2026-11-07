#!/usr/bin/env python3
"""Let's Encrypt certificate management for the reverse proxy.

Issuance and renewal use certbot's webroot authenticator: nginx serves
/.well-known/acme-challenge/ from ACME_WEBROOT on port 80, so certbot never
edits nginx configs. Renewal timing is left to `certbot renew`, which renews
when Let's Encrypt's ARI window opens or 1/3 of the lifetime remains.
"""
import logging
import os
import re
import subprocess
import sys
from typing import Dict, List, Optional

import yaml

CONFIG_FILE = os.environ.get("CONFIG_FILE", "/app/config/hosts.yaml")
LETSENCRYPT_DIR = "/etc/letsencrypt"
ACME_WEBROOT = "/var/www/acme"
DEPLOY_HOOK = "/app/scripts/reload-nginx.sh"

# RFC 1123 hostname: labels of letters/digits/hyphens, no leading/trailing hyphen
DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$"
)
PLACEHOLDER_EMAIL_DOMAINS = ("example.com", "example.org", "example.net")


def is_valid_domain(domain: str) -> bool:
    return bool(DOMAIN_RE.match(domain or ""))


def is_localhost_domain(domain: str) -> bool:
    return domain == "localhost" or domain.endswith(".localhost")


def email_args(email: Optional[str]) -> List[str]:
    """Let's Encrypt rejects placeholder addresses and no longer sends expiry
    mail, so a missing or placeholder email registers without one."""
    email = (email or "").strip()
    if not email or email.lower().endswith(PLACEHOLDER_EMAIL_DOMAINS):
        return ["--register-unsafely-without-email"]
    return ["--email", email]


def parse_authenticator(renewal_conf_text: str) -> Optional[str]:
    match = re.search(r"^\s*authenticator\s*=\s*(\S+)", renewal_conf_text, re.MULTILINE)
    return match.group(1) if match else None


def live_cert_path(domain: str) -> str:
    return os.path.join(LETSENCRYPT_DIR, "live", domain, "fullchain.pem")


def renewal_conf_path(domain: str) -> str:
    return os.path.join(LETSENCRYPT_DIR, "renewal", f"{domain}.conf")


def run(cmd: List[str]) -> bool:
    logging.info("running: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    output = (result.stdout + result.stderr).strip()
    if output:
        logging.log(logging.INFO if result.returncode == 0 else logging.ERROR, "%s", output)
    return result.returncode == 0


class CertificateManager:
    def __init__(self, config_path: str = CONFIG_FILE):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f) or {}
        settings = self.config.get("settings") or {}
        self.email = settings.get("email")
        self.certbot = settings.get("certbot_path") or "certbot"
        self.staging = bool(settings.get("staging", False))

    def domains(self) -> List[str]:
        result = []
        for host in self.config.get("hosts") or []:
            domain = str(host.get("domain", "")).strip()
            if not is_valid_domain(domain):
                logging.error("skipping invalid domain in config: %r", domain)
                continue
            if not is_localhost_domain(domain):
                result.append(domain)
        return result

    def _common_args(self) -> List[str]:
        args = ["--non-interactive", "--agree-tos"]
        if self.staging:
            args.append("--staging")
        return args

    def issue(self, domain: str) -> bool:
        os.makedirs(ACME_WEBROOT, exist_ok=True)
        return run([
            self.certbot, "certonly", *self._common_args(),
            *email_args(self.email),
            "--webroot", "--webroot-path", ACME_WEBROOT,
            "--cert-name", domain, "--domains", domain,
            "--deploy-hook", DEPLOY_HOOK,
        ])

    def migrate_to_webroot(self, domain: str) -> bool:
        """Lineages created with --nginx (older versions of this repo) would
        keep renewing through the nginx plugin, which is not installed any
        more. `certbot reconfigure` switches them to webroot after a
        successful staging test."""
        try:
            with open(renewal_conf_path(domain), "r") as f:
                authenticator = parse_authenticator(f.read())
        except OSError as e:
            logging.error("cannot read renewal config for %s: %s", domain, e)
            return False
        if authenticator == "webroot":
            return True
        logging.info("migrating %s from %s to webroot authenticator", domain, authenticator)
        return run([
            self.certbot, "reconfigure", "--non-interactive",
            "--cert-name", domain,
            "--webroot", "--webroot-path", ACME_WEBROOT,
            "--deploy-hook", DEPLOY_HOOK,
        ])

    def obtain_all(self) -> Dict[str, bool]:
        results = {}
        for domain in self.domains():
            if os.path.exists(live_cert_path(domain)):
                results[domain] = self.migrate_to_webroot(domain)
            else:
                results[domain] = self.issue(domain)
        if not results:
            logging.info("no public domains configured; nothing to obtain")
        return results

    def renew_all(self) -> bool:
        # certbot decides per certificate whether it is due; the deploy hook
        # reloads nginx only when something was actually renewed.
        return run([self.certbot, "renew", "--non-interactive", "--deploy-hook", DEPLOY_HOOK])

    def status(self) -> bool:
        return run([self.certbot, "certificates"])


def main(argv: List[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s cert-manager %(levelname)s %(message)s")
    commands = ("obtain-certificates", "renew-certificates", "status")
    if len(argv) != 2 or argv[1] not in commands:
        print(f"Usage: cert-manager.py [{'|'.join(commands)}]")
        return 2

    manager = CertificateManager()
    command = argv[1]
    if command == "obtain-certificates":
        results = manager.obtain_all()
        print(f"Certificate results: {results}")
        return 0 if all(results.values()) else 1
    if command == "renew-certificates":
        return 0 if manager.renew_all() else 1
    return 0 if manager.status() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
