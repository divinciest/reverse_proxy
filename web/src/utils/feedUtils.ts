/**
 * Utility functions for managing feed sources
 */

import { getBestFaviconUrl } from '@/utils/favicon';

/**
 * Checks if a feed needs to be refreshed based on the last fetch time
 */
export const isFetchNeeded = (lastFetched: string | undefined): boolean => {
  if (!lastFetched) return true;

  const lastFetchDate = new Date(lastFetched);
  const currentDate = new Date();

  const hoursDifference = (currentDate.getTime() - lastFetchDate.getTime()) / (1000 * 60 * 60);

  return hoursDifference >= 24;
};

/**
 * Updates feed logos using the favicon service
 */
export const updateFeedLogos = (feeds: FeedSource[]): FeedSource[] => feeds.map((feed) => {
  if (!feed.logo && feed._id !== 'all') {
    let domain = '';
    try {
      if (feed.url) {
        const url = new URL(feed.url);
        domain = url.hostname;
      }
    } catch (e) {
      console.error('Invalid URL:', feed.url);
    }

    return {
      ...feed,
      logo: getBestFaviconUrl(feed.name, domain),
    };
  }
  return feed;
});

/**
 * Formats a date for display
 */
export const formatLastFetch = (date: Date | null): string => {
  if (!date) return 'Not yet';
  return date.toLocaleString();
};

/**
 * Formats a date string for display
 */
export const formatLastFetchFromString = (dateString: string | null): string => {
  if (!dateString) return 'Not yet';

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (e) {
    console.error('Invalid date string:', dateString);
    return 'Unknown';
  }
};
