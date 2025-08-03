# Generic Reverse Proxy
FROM nginx:1.21.3-alpine

# Install required packages
RUN apk add --no-cache \
    certbot \
    certbot-nginx \
    python3 \
    py3-pip \
    py3-yaml \
    py3-jinja2 \
    py3-requests \
    netcat-openbsd

# Install Python dependencies
RUN pip3 install pyyaml jinja2 requests

# Create necessary directories
RUN mkdir -p /etc/letsencrypt /var/www/html /app/config /app/scripts /app/templates /var/log/nginx

# Copy configuration and scripts
COPY config/ /app/config/
COPY scripts/ /app/scripts/
COPY templates/ /app/templates/

# Copy nginx base configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf

# Set permissions
RUN chmod +x /app/scripts/*.py

# Expose ports
EXPOSE 80 443

# Use dynamic startup script
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
ENTRYPOINT ["/startup.sh"] 