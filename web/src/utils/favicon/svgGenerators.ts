import { stringToHashCode } from './utils';

/**
 * Generate a basic favicon URL from a name
 */
export const generateFaviconUrl = (name: string): string => {
  // Clean up the name by removing special characters and spaces
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Use the first letter if available
  const firstChar = cleanName.charAt(0) || 'x';

  // Generate a deterministic color based on the name
  const hash = stringToHashCode(name);
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs((hash >> 8) % 20));
  const lightness = 45 + (Math.abs((hash >> 16) % 10));

  // Create a data URL for an SVG favicon
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="hsl(${hue}, ${saturation}%, ${lightness}%)" />
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="50" 
            font-weight="bold" fill="white" text-anchor="middle" 
            dominant-baseline="central" text-transform="uppercase">
        ${firstChar}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Generate a more sophisticated SVG logo for companies
 */
export const generateCompanyLogo = (name: string): string => {
  // Generate initials for the company
  const initials = name
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');

  // Generate a deterministic color based on the name
  const hash = stringToHashCode(name);
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs((hash >> 8) % 20));
  const lightness = 45 + (Math.abs((hash >> 16) % 10));

  // Create a data URL for an SVG logo with a more professional look
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue}, ${saturation}%, ${lightness}%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 60) % 360}, ${saturation}%, ${Math.max(30, lightness - 20)}%)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#gradient)" />
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="${initials.length > 1 ? '35' : '40'}" 
            font-weight="bold" fill="white" text-anchor="middle" 
            dominant-baseline="central">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
