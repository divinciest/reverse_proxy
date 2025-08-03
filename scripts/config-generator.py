#!/usr/bin/env python3
import yaml
import os
import subprocess
import logging
import sys
from pathlib import Path
from typing import Dict, List
from jinja2 import Template

class GenericReverseProxyConfigGenerator:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self.load_config()
        self.templates_dir = Path("/app/templates")
        
    def load_config(self) -> Dict:
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def load_template(self, template_name: str) -> Template:
        template_path = self.templates_dir / template_name
        return Template(template_path.read_text())
    
    def generate_frontend_config(self, host: Dict) -> str:
        """Generate nginx config for frontend host"""
        template = self.load_template("frontend.conf.template")
        
        return template.render(
            domain=host['domain'],
            static_path=host['static_path']
        )
    
    def generate_backend_config(self, host: Dict) -> str:
        """Generate nginx config for backend host"""
        template = self.load_template("backend.conf.template")
        
        return template.render(
            domain=host['domain'],
            backend_port=host['backend_port']
        )
    
    def generate_http_challenge_configs(self) -> str:
        """Generate HTTP challenge configs for all domains"""
        template = self.load_template("http-challenge.conf.template")
        
        configs = []
        for host in self.config.get('hosts', []):
            config = template.render(domain=host['domain'])
            configs.append(config)
        
        return '\n'.join(configs)
    
    def generate_all_configs(self) -> Dict[str, str]:
        """Generate all nginx configurations"""
        configs = {}
        
        # Generate HTTP challenge configs
        configs['http-challenges'] = self.generate_http_challenge_configs()
        
        # Generate host-specific configs
        hosts = self.config.get('hosts', [])
        if not hosts:
            logging.info("No hosts configured - generating empty configuration")
            return configs
            
        for host in hosts:
            host_type = host['type']
            domain = host['domain']
            
            if host_type == 'frontend':
                configs[domain] = self.generate_frontend_config(host)
            elif host_type == 'backend':
                configs[domain] = self.generate_backend_config(host)
            else:
                logging.warning(f"Unknown host type: {host_type} for domain: {domain}")
        
        return configs
    
    def write_configs(self, configs: Dict[str, str]) -> None:
        """Write generated configs to nginx conf.d directory"""
        conf_dir = Path("/etc/nginx/conf.d")
        
        # Clear existing dynamic configs
        for file in conf_dir.glob("dynamic-*.conf"):
            file.unlink()
        
        # Write new configs
        for name, config in configs.items():
            if name == 'http-challenges':
                config_file = conf_dir / "http-challenges.conf"
            else:
                config_file = conf_dir / f"dynamic-{name.replace('.', '_')}.conf"
            
            config_file.write_text(config)
            logging.info(f"Generated config for {name}: {config_file}")
    
    def validate_nginx_config(self) -> bool:
        """Validate nginx configuration"""
        try:
            result = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            logging.error(f"Error validating nginx config: {e}")
            return False
    
    def reload_nginx(self) -> bool:
        """Reload nginx configuration"""
        try:
            result = subprocess.run(['nginx', '-s', 'reload'], capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            logging.error(f"Error reloading nginx: {e}")
            return False
    
    def generate_and_deploy(self) -> bool:
        """Generate and deploy all configurations"""
        try:
            # Generate all configs
            configs = self.generate_all_configs()
            
            # Write configs
            self.write_configs(configs)
            
            # Validate config
            if not self.validate_nginx_config():
                logging.error("Nginx configuration validation failed")
                return False
            
            # Reload nginx
            if not self.reload_nginx():
                logging.error("Failed to reload nginx")
                return False
            
            logging.info("Configuration generation and deployment successful")
            return True
            
        except Exception as e:
            logging.error(f"Error in generate_and_deploy: {e}")
            return False

if __name__ == "__main__":
    generator = GenericReverseProxyConfigGenerator("/app/config/hosts.yaml")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "generate":
            success = generator.generate_and_deploy()
            sys.exit(0 if success else 1)
        elif command == "validate":
            valid = generator.validate_nginx_config()
            sys.exit(0 if valid else 1)
        else:
            print("Unknown command")
    else:
        print("Usage: config-generator.py [generate|validate]") 