# Generic Reverse Proxy
# nginx 1.30 on Alpine 3.24 ships certbot 5.x, which supports ACME Renewal
# Information (ARI) and lifetime-relative renewal windows (needed for the
# shorter Let's Encrypt certificate lifetimes rolling out from 2027).
FROM nginx:1.30.6-alpine

RUN apk add --no-cache \
    certbot \
    openssl \
    python3 \
    py3-yaml \
    py3-jinja2 \
    py3-requests \
    netcat-openbsd

# ACME HTTP-01 challenge files are written here by certbot --webroot
RUN mkdir -p /etc/letsencrypt /var/www/html /var/www/acme /app/config /app/scripts /app/templates /var/log/nginx

COPY config/ /app/config/
COPY scripts/ /app/scripts/
COPY templates/ /app/templates/

COPY nginx.conf /etc/nginx/nginx.conf
COPY options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf

RUN chmod +x /app/scripts/*.py /app/scripts/*.sh

EXPOSE 80 443

COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
ENTRYPOINT ["/startup.sh"]
