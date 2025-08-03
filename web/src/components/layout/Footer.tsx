import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border py-6 mt-8">
      <div className="w-full px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Company</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors duration-200">About Us</Link></li>
              <li><Link to="/mission" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Mission</Link></li>
              <li><Link to="/careers" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Help</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Help Center</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors duration-200">FAQ</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Legal</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Cookie Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Connect</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Blog</Link></li>
              <li><Link to="/newsletter" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Newsletter</Link></li>
              <li><Link to="/social" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Social Media</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-3 text-center">
          <div className="mb-2">
            <p className="font-serif text-lg text-foreground mb-1">
              &copy;
              {new Date().getFullYear()}
              {' '}
              WealthManager.com
            </p>
            <p className="text-muted-foreground text-xs">Financial News Aggregator with AI-powered sentiment analysis</p>
          </div>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>Made with ❤️ for financial professionals</span>
            <span>•</span>
            <span>Data-driven insights</span>
            <span>•</span>
            <span>Real-time updates</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
