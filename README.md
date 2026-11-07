# Generic Reverse Proxy

nginx + Let's Encrypt in one container. Hosts are declared in `config/hosts.yaml`;
nginx server blocks are generated from `templates/`.

## Run

```sh
docker compose up -d --build
```

The container uses host networking so `backend` hosts can proxy to
`http://localhost:<port>` on the server.

## Hosts

```yaml
hosts:
  - domain: "example.com"          # static SPA from ./static/example
    type: "frontend"
    static_path: "/var/www/html/example"
  - domain: "api.example.com"      # proxied to a service on the host
    type: "backend"
    backend_port: 8080
```

After editing, restart the container (`docker compose restart`). It issues missing
certificates and regenerates the configs on startup. Domains whose certificate could
not be issued (for example, DNS not pointing here yet) are retried every 12 hours
and go live automatically once issuance succeeds.

## Certificates

- **Issuance:** `certbot certonly --webroot`. nginx answers
  `/.well-known/acme-challenge/` on port 80 from `/var/www/acme`, so certbot never
  edits nginx configs.
- **Renewal:** `certbot renew` runs at startup and then every 12 hours plus a random
  delay of up to 1 hour (`RENEW_INTERVAL_SECONDS`, `RENEW_MAX_JITTER_SECONDS`).
  certbot 5.x decides what is due, using Let's Encrypt's ACME Renewal Information
  (ARI) or 1/3 of lifetime remaining. That keeps working as Let's Encrypt lifetimes
  shrink (64 days from Feb 2027, 45 days from Feb 2028).
- **Reload:** `scripts/reload-nginx.sh` is the certbot `--deploy-hook`. It runs only
  after a certificate is actually renewed, and it reloads only if `nginx -t` passes.
- **HTTPS server blocks** are generated only for domains that already have a
  certificate, and port 80 redirects to HTTPS once one exists.
- **Lineages created by older versions with `--nginx`** are switched to webroot
  automatically with `certbot reconfigure`.
- **Email:** `settings.email` is optional. Empty or `example.com` addresses register
  without an email, since Let's Encrypt no longer sends expiry mail.
- **Testing:** `settings.staging: true` uses the Let's Encrypt staging CA.

Check renewal end to end without touching the real certificates:

```sh
docker compose exec reverse-proxy certbot renew --dry-run --run-deploy-hooks \
  --deploy-hook /app/scripts/reload-nginx.sh
docker compose exec reverse-proxy python3 /app/scripts/cert-manager.py status
```

`letsencrypt/` holds private keys at runtime. Its runtime directories are gitignored.

## Tests

```sh
docker compose build
docker run --rm -v "$PWD:/src" -w /src --entrypoint python3 reverse_proxy-reverse-proxy \
  -m unittest discover -s tests -v
```
