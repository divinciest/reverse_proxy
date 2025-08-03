#!/usr/bin/env python3
import yaml
import requests
import time
import logging
import sys
from typing import Dict, List

class HealthChecker:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self.load_config()
        
    def load_config(self) -> Dict:
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def check_service_health(self, host: Dict) -> bool:
        """Check health of a service"""
        domain = host['domain']
        health_endpoint = host.get('health_check', '/health')
        
        try:
            url = f"https://{domain}{health_endpoint}"
            response = requests.get(url, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Health check failed for {domain}: {e}")
            return False
    
    def check_all_services(self) -> Dict[str, bool]:
        """Check health of all services"""
        results = {}
        
        hosts = self.config.get('hosts', [])
        if not hosts:
            logging.info("No hosts configured - skipping health checks")
            return results
        
        for host in hosts:
            domain = host['domain']
            results[domain] = self.check_service_health(host)
        
        return results
    
    def run_continuous_monitoring(self) -> None:
        """Run continuous health monitoring"""
        interval = self.config['settings']['health_check_interval']
        
        while True:
            results = self.check_all_services()
            
            if not results:
                logging.info("No hosts configured - monitoring paused")
                time.sleep(interval)
                continue
                
            for domain, healthy in results.items():
                status = "HEALTHY" if healthy else "UNHEALTHY"
                logging.info(f"{domain}: {status}")
            
            time.sleep(interval)

if __name__ == "__main__":
    health_checker = HealthChecker("/app/config/hosts.yaml")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "check":
            results = health_checker.check_all_services()
            print(f"Health check results: {results}")
        elif command == "monitor":
            health_checker.run_continuous_monitoring()
        else:
            print("Unknown command")
    else:
        print("Usage: health-checker.py [check|monitor]") 