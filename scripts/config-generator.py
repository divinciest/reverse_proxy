#!/usr/bin/env python3
"""Generates nginx server blocks from config/hosts.yaml.

- Port 80: every public domain answers ACME HTTP-01 challenges from
  ACME_WEBROOT; everything else redirects to HTTPS once a certificate exists.
- Port 443: written only for domains whose certificate exists, so a missing
  certificate never makes `nginx -t` fail for the other hosts.
- `generate` validates with `nginx -t` and restores the previous configs if
  validation fails.
"""
import logging
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List

import yaml
from jinja2 import Template

CONFIG_FILE = os.environ.get("CONFIG_FILE", "/app/config/hosts.yaml")
TEMPLATES_DIR = Path(os.environ.get("TEMPLATES_DIR", "/app/templates"))
CONF_DIR = Path(os.environ.get("NGINX_CONF_DIR", "/etc/nginx/conf.d"))
LETSENCRYPT_DIR = Path(os.environ.get("LETSENCRYPT_DIR", "/etc/letsencrypt"))
ACME_WEBROOT = "/var/www/acme"
MANAGED_GLOBS = ("dynamic-*.conf", "http-challenges.conf")

DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$"
)


def is_localhost_domain(domain: str) -> bool:
    return domain == "localhost" or domain.endswith(".localhost")


def has_certificate(domain: str) -> bool:
    return (LETSENCRYPT_DIR / "live" / domain / "fullchain.pem").exists()


def render(template_name: str, **context: object) -> str:
    return Template((TEMPLATES_DIR / template_name).read_text()).render(**context)


def valid_hosts(config: Dict) -> List[Dict]:
    hosts = []
    for host in config.get("hosts") or []:
        domain = str(host.get("domain", "")).strip()
        if not DOMAIN_RE.match(domain):
            logging.error("skipping invalid domain: %r", domain)
            continue
        hosts.append({**host, "domain": domain})
    return hosts


PROXY_PATH_RE = re.compile(r"^/[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*/$")


def validate_port(value: object, label: str) -> int:
    port = int(value)
    if not 0 < port < 65536:
        raise ValueError(f"invalid port {port} for {label}")
    return port


def proxy_paths(host: Dict) -> List[Dict]:
    """Optional path prefixes of a frontend that proxy to local services,
    e.g. [{"path": "/llm/", "port": 8790}]. The prefix is stripped."""
    routes = []
    for route in host.get("proxy_paths") or []:
        path = str(route.get("path", ""))
        if not PROXY_PATH_RE.match(path):
            raise ValueError(f"invalid proxy path {path!r} (must look like /name/)")
        routes.append({"path": path, "port": validate_port(route["port"], path)})
    return routes


def host_config(host: Dict) -> str:
    domain = host["domain"]
    host_type = host.get("type")
    if host_type == "frontend":
        return render("frontend.conf.template", domain=domain, static_path=host["static_path"],
                      proxy_paths=proxy_paths(host))
    if host_type == "backend":
        port = validate_port(host["backend_port"], domain)
        return render("backend.conf.template", domain=domain, backend_port=port)
    raise ValueError(f"unknown host type {host_type!r} for {domain}")


def generate_all_configs(config: Dict) -> Dict[str, str]:
    """Returns {file name: content} for every managed nginx config file."""
    hosts = valid_hosts(config)
    public = [h for h in hosts if not is_localhost_domain(h["domain"])]

    challenges = [
        render("http-challenge.conf.template", domain=h["domain"],
               has_cert=has_certificate(h["domain"]), acme_webroot=ACME_WEBROOT)
        for h in public
    ]
    configs = {"http-challenges.conf": "\n".join(challenges)}

    for host in hosts:
        domain = host["domain"]
        if not is_localhost_domain(domain) and not has_certificate(domain):
            logging.warning("no certificate yet for %s; serving HTTP challenge only", domain)
            continue
        try:
            configs[f"dynamic-{domain.replace('.', '_')}.conf"] = host_config(host)
        except (KeyError, ValueError) as e:
            logging.error("skipping %s: %s", domain, e)
    return configs


def snapshot() -> Dict[Path, str]:
    return {p: p.read_text() for g in MANAGED_GLOBS for p in CONF_DIR.glob(g)}


def replace_configs(configs: Dict[str, str]) -> None:
    for g in MANAGED_GLOBS:
        for p in CONF_DIR.glob(g):
            p.unlink()
    for name, content in configs.items():
        (CONF_DIR / name).write_text(content)
        logging.info("wrote %s", CONF_DIR / name)


def restore(previous: Dict[Path, str]) -> None:
    replace_configs({p.name: c for p, c in previous.items()})


def nginx(*args: str) -> bool:
    result = subprocess.run(["nginx", *args], capture_output=True, text=True)
    if result.returncode != 0:
        logging.error("nginx %s failed: %s", " ".join(args), result.stderr.strip())
    return result.returncode == 0


def load_config() -> Dict:
    with open(CONFIG_FILE, "r") as f:
        return yaml.safe_load(f) or {}


def write_only() -> bool:
    replace_configs(generate_all_configs(load_config()))
    return True


def generate_and_reload() -> bool:
    previous = snapshot()
    replace_configs(generate_all_configs(load_config()))
    if not nginx("-t"):
        logging.error("new config is invalid; restoring the previous config")
        restore(previous)
        return False
    return nginx("-s", "reload")


def main(argv: List[str]) -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s config-generator %(levelname)s %(message)s")
    commands = {"write": write_only, "generate": generate_and_reload, "validate": lambda: nginx("-t")}
    if len(argv) != 2 or argv[1] not in commands:
        print(f"Usage: config-generator.py [{'|'.join(commands)}]")
        return 2
    return 0 if commands[argv[1]]() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
