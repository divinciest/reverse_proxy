#!/usr/bin/env python3
import yaml
import subprocess
import os
import sys
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional

class GenericCertificateManager:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self.load_config()
        self.email = self.config['settings']['email']
        self.certbot_path = self.config['settings']['certbot_path']
        
    def load_config(self) -> Dict:
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def is_localhost_domain(self, domain: str) -> bool:
        """Check if domain is localhost (development mode)"""
        return domain in ['localhost', 'app1.localhost', 'app2.localhost'] or domain.endswith('.localhost')
    
    def obtain_certificate(self, domain: str) -> bool:
        """Obtain SSL certificate for a domain"""
        # Skip certificate generation for localhost domains in development
        if self.is_localhost_domain(domain):
            logging.info(f"Skipping certificate generation for localhost domain: {domain}")
            return True
            
        try:
            cmd = [
                self.certbot_path, 'certonly', '--non-interactive', '--nginx',
                '--agree-tos', '--email', self.email,
                '--domains', domain,
                '--cert-name', domain,
                '--key-type', 'rsa',
                '--rsa-key-size', '2048'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logging.info(f"Certificate obtained successfully for {domain}")
                return True
            else:
                logging.error(f"Failed to obtain certificate for {domain}: {result.stderr}")
                return False
                
        except Exception as e:
            logging.error(f"Error obtaining certificate for {domain}: {e}")
            return False
    
    def obtain_all_certificates(self) -> Dict[str, bool]:
        """Obtain certificates for all domains"""
        results = {}
        
        hosts = self.config.get('hosts', [])
        if not hosts:
            logging.info("No hosts configured - skipping certificate generation")
            return results
            
        for host in hosts:
            domain = host['domain']
            results[domain] = self.obtain_certificate(domain)
                
        return results
    
    def check_certificate_expiry(self, domain: str) -> Optional[int]:
        """Check days until certificate expires"""
        cert_path = f"/etc/letsencrypt/live/{domain}/fullchain.pem"
        
        if not os.path.exists(cert_path):
            return None
            
        try:
            cmd = ['openssl', 'x509', '-in', cert_path, '-noout', '-enddate']
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Parse expiry date and calculate days remaining
                # Implementation details...
                return 30  # Placeholder
                
        except Exception as e:
            logging.error(f"Error checking certificate expiry for {domain}: {e}")
            
        return None
    
    def renew_expiring_certificates(self) -> None:
        """Renew certificates that are expiring soon"""
        renewal_threshold = self.config['settings']['certificate_renewal_days']
        
        hosts = self.config.get('hosts', [])
        if not hosts:
            logging.info("No hosts configured - skipping certificate renewal")
            return
            
        for host in hosts:
            domain = host['domain']
            # Skip localhost domains
            if self.is_localhost_domain(domain):
                continue
                
            days_until_expiry = self.check_certificate_expiry(domain)
            
            if days_until_expiry and days_until_expiry <= renewal_threshold:
                logging.info(f"Renewing certificate for {domain} (expires in {days_until_expiry} days)")
                self.obtain_certificate(domain)

if __name__ == "__main__":
    cert_manager = GenericCertificateManager("/app/config/hosts.yaml")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "obtain-certificates":
            results = cert_manager.obtain_all_certificates()
            print(f"Certificate generation results: {results}")
        elif command == "renew-certificates":
            cert_manager.renew_expiring_certificates()
        else:
            print("Unknown command")
    else:
        print("Usage: cert-manager.py [obtain-certificates|renew-certificates]") 