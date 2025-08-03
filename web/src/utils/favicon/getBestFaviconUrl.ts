import { generateCompanyLogo } from './svgGenerators';
import { getExternalFaviconUrl } from './externalServices';
import { guessDomainFromName } from './domainUtils';
/**
 * Get the best possible favicon URL for a company or source
 */
export const getBestFaviconUrl = (name: string, url?: string): string => {
  console.log(`Getting favicon for: ${name}, URL: ${url || 'none'}`);
  
  // For specific companies, use direct known favicon URLs for better reliability
  const lowerName = name.toLowerCase();
  
  // Companies with direct favicon URLs
  if (lowerName === "all") {
    return generateCompanyLogo('All');
  } if (lowerName.includes('apple')) {
    return 'https://www.apple.com/favicon.ico';
  } if (lowerName.includes('tesla')) {
    return 'https://www.tesla.com/sites/all/themes/custom/tesla_theme/assets/img/icons/favicon.ico';
  } if (lowerName.includes('general electric') || lowerName === 'ge' || lowerName.includes('ge ')) {
    return 'https://www.ge.com/themes/custom/ge_com_theme/favicon.ico';
  } if (lowerName.includes('intel')) {
    return 'https://www.intel.com/favicon.ico';
  } if (lowerName.includes('microsoft')) {
    return 'https://www.microsoft.com/favicon.ico';
  } if (lowerName.includes('amazon')) {
    return 'https://www.amazon.com/favicon.ico';
  } if (lowerName.includes('google')) {
    return 'https://www.google.com/favicon.ico';
  } if (lowerName.includes('facebook') || lowerName.includes('meta')) {
    return 'https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZIVX-5C-b.ico';
  } if (lowerName.includes('netflix')) {
    return 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico';
  } if (lowerName.includes('twitter') || lowerName === 'x') {
    return 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png';
  } else if (lowerName.includes('walmart')) {
    return 'https://www.walmart.com/favicon.ico';
  } else if (lowerName.includes('disney')) {
    return 'https://static-mh.content.disney.io/matterhorn/assets/favicon-94e3862e7fb9.ico';
  } else if (lowerName.includes('nike')) {
    return 'https://www.nike.com/favicon.ico';
  } else if (lowerName.includes('mcdonalds') || lowerName.includes('mcdonald\'s')) {
    return 'https://www.mcdonalds.com/favicon.ico';
  } else if (lowerName.includes('cocacola') || lowerName.includes('coca-cola') || lowerName.includes('coca cola')) {
    return 'https://www.coca-cola.com/favicon.ico';
  } else if (lowerName.includes('pepsi')) {
    return 'https://www.pepsi.com/favicon.ico';
  }
  
  // News sources - improve these to more direct sources
  else if (lowerName.includes('forbes')) {
    return 'https://i.forbesimg.com/media/assets/forbes_favicon.ico';
  } else if (lowerName.includes('cnbc')) {
    return 'https://www.cnbc.com/favicon.ico';
  } else if (lowerName.includes('financial times') || lowerName.includes('ft')) {
    return 'https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1:brand?source=origami-registry&width=128&height=128&format=png';
  } else if (lowerName.includes('wall street') || lowerName.includes('wsj')) {
    return 'https://s.wsj.net/img/meta/wsj-social-share.png';
  } else if (lowerName.includes('yahoo')) {
    return 'https://s.yimg.com/rz/l/favicon.ico';
  } else if (lowerName.includes('marketwatch')) {
    return 'https://mw3.wsj.net/mw5/content/logos/favicon.ico';
  } else if (lowerName.includes('bloomberg')) {
    return 'https://assets.bwbx.io/s3/javelin/public/javelin/images/favicon-black-63fe5249d3.png';
  } else if (lowerName.includes('reuters')) {
    return 'https://www.reuters.com/pf/resources/images/reuters/favicon.ico?d=133';
  } else if (lowerName.includes('business insider') || lowerName.includes('businessinsider')) {
    return 'https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo-1200x1200.png';
  } else if (lowerName.includes('nbc')) {
    return 'https://www.nbcnews.com/sites/all/themes/nbcnews/favicon.ico';
  }
  
  // First, try to get a favicon from a URL if provided
  if (url && (url.includes('.com') || url.includes('.org') || url.includes('.net') || url.includes('.io'))) {
    try {
      console.log(`Using external favicon for ${name} with URL: ${url}`);
      return getExternalFaviconUrl(url);
    } catch (e) {
      console.error(`Error getting favicon for ${name}:`, e);
    }
  }
  
  // Try to guess the domain from the name
  const domainGuess = guessDomainFromName(name);
  if (domainGuess) {
    try {
      console.log(`Using guessed domain favicon for ${name}: ${domainGuess}`);
      return getExternalFaviconUrl(domainGuess);
    } catch (e) {
      console.error(`Error getting favicon for guessed domain ${domainGuess}:`, e);
    }
  }
  
  // For company names, use the more sophisticated logo generator
  if (name.length > 3) {
    console.log(`Generating company logo for ${name}`);
    return generateCompanyLogo(name);
  }
  
  // Fallback to the simple favicon generator (handled in the importing component's error handling)
  console.log(`Using simple favicon generator for ${name}`);
  return generateCompanyLogo(name);
};
