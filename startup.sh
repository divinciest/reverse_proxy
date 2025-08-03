#!/bin/sh

# Load configuration
CONFIG_FILE="/app/config/hosts.yaml"

# Function to wait for nginx to be ready
wait_for_nginx() {
    while ! nc -z localhost 80; do
        echo "$(date) - Waiting for NGINX to start"
        nginx_status=$(nginx -t 2>&1)
        echo "${nginx_status}"
        sleep 1
    done
    echo "Nginx has started as basic http server"
}

# Function to obtain certificates
obtain_certificates() {
    echo "Obtaining SSL certificates..."
    python3 /app/scripts/cert-manager.py obtain-certificates
}

# Function to generate nginx configs
generate_nginx_configs() {
    echo "Generating nginx configurations..."
    python3 /app/scripts/config-generator.py generate
}

# Main startup sequence
main() {
    # Start nginx with basic config
    nginx
    
    # Wait for nginx to be ready
    wait_for_nginx
    
    # Obtain certificates
    obtain_certificates
    
    # Generate nginx configs
    generate_nginx_configs
    
    # Start certificate renewal monitoring in background
    while true; do
        python3 /app/scripts/cert-manager.py renew-certificates
        sleep 86400  # Check daily
    done &
    
    # Keep container running
    tail -f /dev/null
}

# Run main function
main 