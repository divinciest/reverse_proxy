/**
 * Helper function to guess a domain from a company name
 */
export function guessDomainFromName(name: string): string | null {
  const cleanName = name.trim().toLowerCase().replace(/\s+inc\.?$|\s+corp\.?$|\s+corporation$|\s+llc$|\s+ltd\.?$/i, '');

  // Map specific company names to their domains
  if (cleanName === 'nbc') return 'nbcnews.com';
  if (cleanName === 'financial times' || cleanName === 'ft') return 'ft.com';
  if (cleanName === 'forbes') return 'forbes.com';
  if (cleanName === 'all') return null; // Special case

  // Replace spaces and special chars with nothing for domain name format
  const domainName = cleanName
    .replace(/[^a-z0-9]/g, '')
    .toLowerCase();

  if (domainName.length < 3) {
    return null;
  }

  return `${domainName}.com`;
}

/**
 * Maps company/source names to known domains
 */
export function getKnownDomain(name: string): string | null {
  const lowerName = name.toLowerCase();

  // Companies with known domains
  if (lowerName === 'all') return null;
  if (lowerName.includes('apple')) return 'apple.com';
  if (lowerName.includes('tesla')) return 'tesla.com';
  if (lowerName.includes('general electric') || lowerName === 'ge' || lowerName.includes('ge ')) return 'ge.com';
  if (lowerName.includes('intel')) return 'intel.com';
  if (lowerName.includes('microsoft')) return 'microsoft.com';
  if (lowerName.includes('amazon')) return 'amazon.com';
  if (lowerName.includes('google')) return 'google.com';
  if (lowerName.includes('facebook') || lowerName.includes('meta')) return 'facebook.com';
  if (lowerName.includes('netflix')) return 'netflix.com';
  if (lowerName.includes('twitter') || lowerName === 'x') return 'twitter.com';
  if (lowerName.includes('walmart')) return 'walmart.com';
  if (lowerName.includes('disney')) return 'disney.go.com';
  if (lowerName.includes('nike')) return 'nike.com';
  if (lowerName.includes('mcdonalds') || lowerName.includes('mcdonald\'s')) return 'mcdonalds.com';
  if (lowerName.includes('cocacola') || lowerName.includes('coca-cola') || lowerName.includes('coca cola')) return 'coca-cola.com';
  if (lowerName.includes('pepsi')) return 'pepsi.com';

  // News sources
  if (lowerName.includes('forbes')) return 'forbes.com';
  if (lowerName.includes('cnbc')) return 'cnbc.com';
  if (lowerName.includes('financial times') || lowerName.includes('ft')) return 'ft.com';
  if (lowerName.includes('wall street') || lowerName.includes('wsj')) return 'wsj.com';
  if (lowerName.includes('yahoo')) return 'finance.yahoo.com';
  if (lowerName.includes('marketwatch')) return 'marketwatch.com';
  if (lowerName.includes('bloomberg')) return 'bloomberg.com';
  if (lowerName.includes('reuters')) return 'reuters.com';
  if (lowerName.includes('business insider') || lowerName.includes('businessinsider')) return 'businessinsider.com';
  if (lowerName.includes('nbc')) return 'nbcnews.com';

  return null;
}
