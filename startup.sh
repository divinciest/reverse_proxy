#!/bin/sh
set -eu

CONFIG_FILE="${CONFIG_FILE:-/app/config/hosts.yaml}"
export CONFIG_FILE

# Renewal schedule: certbot only renews certificates that are due (ARI window
# or 1/3 of lifetime remaining), so running often is safe. Twice a day with a
# random delay is what certbot's own packaging recommends.
RENEW_INTERVAL_SECONDS="${RENEW_INTERVAL_SECONDS:-43200}"
RENEW_MAX_JITTER_SECONDS="${RENEW_MAX_JITTER_SECONDS:-3600}"

log() {
    echo "$(date -u '+%Y-%m-%dT%H:%M:%SZ') startup: $*"
}

wait_for_nginx() {
    while ! nc -z localhost 80; do
        log "waiting for nginx to listen on :80"
        sleep 1
    done
}

wait_for_nginx_exit() {
    while [ -f /var/run/nginx.pid ] && kill -0 "$(cat /var/run/nginx.pid)" 2>/dev/null; do
        sleep 0.2
    done
}

random_jitter() {
    # od reads 2 random bytes as an unsigned integer (0..65535)
    echo $(( $(od -An -N2 -tu2 /dev/urandom | tr -d ' ') % (RENEW_MAX_JITTER_SECONDS + 1) ))
}

renewal_loop() {
    while true; do
        python3 /app/scripts/cert-manager.py renew-certificates || log "renewal run failed; will retry next cycle"
        sleep "$RENEW_INTERVAL_SECONDS"
        sleep "$(random_jitter)"
        # Retry domains that still have no certificate (e.g. DNS was not
        # pointing here yet) and publish their HTTPS config once issued.
        # Twice a day stays far below Let's Encrypt's failed-validation limit.
        python3 /app/scripts/cert-manager.py obtain-certificates || log "some certificates are still missing"
        python3 /app/scripts/config-generator.py generate || log "config generation failed; keeping previous config"
    done
}

main() {
    # 1. Write configs for what exists now: HTTP challenge servers for every
    #    domain, HTTPS servers only for domains that already have a certificate.
    python3 /app/scripts/config-generator.py write

    # 2. Start nginx so the HTTP-01 challenge can be answered.
    nginx
    wait_for_nginx

    # 3. Issue missing certificates and migrate old lineages to webroot.
    python3 /app/scripts/cert-manager.py obtain-certificates || log "some certificates could not be obtained"

    # 4. Regenerate with the new certificates, validate and reload.
    python3 /app/scripts/config-generator.py generate || log "config generation failed; keeping previous config"

    # 5. Hand nginx over to the foreground so the container exits (and Docker
    #    restarts it) if nginx dies.
    nginx -s quit
    wait_for_nginx_exit

    renewal_loop &

    log "starting nginx in the foreground"
    exec nginx -g 'daemon off;'
}

main
