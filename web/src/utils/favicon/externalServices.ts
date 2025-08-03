/**
 * Get favicon from external services
 */
export const getExternalFaviconUrl = (domain: string): string => {
  // Extract domain from URL or use the input if already a domain
  let cleanDomain = domain;
  if (domain.includes('://')) {
    cleanDomain = domain.split('://')[1].split('/')[0];
  }

  // Use Google's service - most reliable for widely-known sites
  return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
};
