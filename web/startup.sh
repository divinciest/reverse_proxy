#!/bin/sh

mkdir -p /etc/letsencrypt

cat <<'EOF' > /etc/letsencrypt/options-ssl-nginx.conf
# This file contains important security parameters. If you modify this file
# manually, Certbot will be unable to automatically provide future security
# updates. Instead, Certbot will print and log an error message with a path to
# the up-to-date file that you will need to refer to when manually updating
# this file. Contents are based on https://ssl-config.mozilla.org

ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF


ls -la /etc/letsencrypt/
# Function to obtain or renew certificate using certbot for a particular domain
obtain_certificate() {
    DOMAIN=$1
    EMAIL="hassenmohameddhia@gmail.com"
    
    # Remove any existing certificates for this domain
    # rm -rf "/etc/letsencrypt/live/$DOMAIN"*
    # rm -rf "/etc/letsencrypt/archive/$DOMAIN"*
    # rm -rf "/etc/letsencrypt/renewal/$DOMAIN"*
    
    # Force new certificate without versioning
    certbot certonly --non-interactive --nginx \
        --agree-tos --email "$EMAIL" \
        --domains "$DOMAIN" \
        --cert-name "$DOMAIN" \
        --key-type rsa \
        --rsa-key-size 2048
}

apk add --no-cache certbot certbot-nginx

# user nginx;
# worker_processes auto; # it should match the number of CPU cores on your server


# events {
#     worker_connections 1024;
# }

# http {
#     include       /etc/nginx/mime.types;
#     default_type  application/octet-stream;

#     # Gzip Settings
#     # Add other settings here...

#     sendfile        on;
#     keepalive_timeout  65;

#     # Include server definitions
#      include /etc/nginx/conf.d/nginx-http.conf;
# }

cat <<'EOF' > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    include /etc/nginx/conf.d/*.conf;
}
EOF

nginx 

# Initial delay to give nginx a chance to start
sleep 5

# Now loop until nginx successfully starts
while ! nc -z localhost 80; do
  echo "$(date) - Waiting for NGINX to start"

  # Test nginx configuration and log the result
  nginx_status=$(nginx -t 2>&1)
  echo "${nginx_status}"

  sleep 1  # wait for 1 second before checking again
done

echo "Nginx has started as basic http server ."

obtain_certificate "www.advisorassist.ai"
obtain_certificate "advisorassist.ai"
obtain_certificate "api.advisorassist.ai"
obtain_certificate "agent.advisorassist.ai"


# --- DIAGNOSTIC STEP ---
echo "--- Nginx Configuration Final State ---"
ls -laR /etc/nginx/
echo "--- End of Directory Listing ---"
echo "--- Contents of conf.d ---"
cat /etc/nginx/conf.d/*.conf
echo "--- End of conf.d Contents ---"
# --- END DIAGNOSTIC STEP ---


# Perform other actions if needed. Since Nginx is running in the background,
# additional commands can be added here before waiting on Nginx to finish.
#echo "dXNlciBuZ2lueDsKd29ya2VyX3Byb2Nlc3NlcyBhdXRvOyAjIGl0IHNob3VsZCBtYXRjaCB0aGUgbnVtYmVyIG9mIENQVSBjb3JlcyBvbiB5b3VyIHNlcnZlcgoKCmV2ZW50cyB7CiAgICB3b3JrZXJfY29ubmVjdGlvbnMgMTAyNDsKfQoKaHR0cCB7CiAgICBpbmNsdWRlICAgICAgIC9ldGMvbmdpbngvbWltZS50eXBlczsKICAgIGRlZmF1bHRfdHlwZSAgYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtOwoKICAgICMgR3ppcCBTZXR0aW5ncwogICAgIyBBZGQgb3RoZXIgc2V0dGluZ3MgaGVyZS4uLgoKICAgIHNlbmRmaWxlICAgICAgICBvbjsKICAgIGtlZXBhbGl2ZV90aW1lb3V0ICA2NTsKCiAgICAjIEluY2x1ZGUgc2VydmVyIGRlZmluaXRpb25zCiAgICAgaW5jbHVkZSAvZXRjL25naW54L2NvbmYuZC9uZ2lueC1odHRwLmNvbmY7Cn0K" | base64 -d |  tee  /etc/nginx/nginx.conf > /dev/null




# # user nginx;
# worker_processes auto; # it should match the number of CPU cores on your server
# events {
#     worker_connections 1024;
# }
# http {
#     include       /etc/nginx/mime.types;
#     default_type  application/octet-stream;
#     # Gzip Settings
#     # Add other settings here...
#     sendfile        on;
#     keepalive_timeout  999999;
#     # Include server definitions
#     include /etc/nginx/conf.d/frontend.conf;
#     include /etc/nginx/conf.d/backend.conf.conf;
# }
  


cat <<'EOF' > /etc/nginx/nginx.conf
# user nginx;
worker_processes auto; # it should match the number of CPU cores on your server


events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip Settings
    # Add other settings here...

    sendfile        on;
    keepalive_timeout  999999;

    # Include server definitions
    include /etc/nginx/conf.d/frontend.conf;
    include /etc/nginx/conf.d/backend.conf;
}
EOF

# Now, keep this script running by waiting on the Nginx process
nginx -s reload

# Keep the script running by waiting indefinitely
# One way to keep the container running is to use a tail command on a dummy file
tail -f /dev/null