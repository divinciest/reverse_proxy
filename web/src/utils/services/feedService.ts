import api from '../api'; // Import the configured axios instance
import {
  FeedSource,
  CompanyMetadata,
  Content,
  UserProfile,
  FeedInfo,
} from '@/types/shared';

// Remove the API_BASE_URL definition here, it's handled in api.ts
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.advisorassist.ai/api';

// Remove FALLBACK_RSS_FEEDS if not used elsewhere
// const FALLBACK_RSS_FEEDS = [ ... ];

// Remove fetch-related helpers if no longer needed
// const getAuthToken = ...
// const createHeaders = ...
// async function fetchFromApi<T>(...) { ... }

// Define the structure expected from /get_feeds_contents
interface FeedsContentsResponse {
    contents: Content[];
    companies: CompanyMetadata[];
    // Add other potential fields if the API returns them
}

// Define the structure expected from /get_company_contents
interface CompanyContentsResponse {
    company: string; // Assuming company name or ID
    contents: Content[];
    feeds_sourced: any[]; // Use specific type if known
    companies_metadata: CompanyMetadata[];
}

interface TaskStatus {
  active_tasks: number;
  running_tasks: number;
  max_workers: number;
  queue_size: number;
  timestamp: string;
}

export const feedService = {
  // Fetch popular feeds
  async getPopularFeeds(): Promise<FeedSource[]> {
    const endpoint = '/popular_feeds';
    try {
      // Assuming popular feeds might still return the old structure or needs adjustment
      // For admin, we'll use getAdminFeeds
      const response = await api.get<{ feeds: FeedSource[] }>(endpoint);
      // Adapt response if necessary, maybe filter/map if structure differs
      return response.data.feeds || [];
    } catch (error) {
      console.error(`Error fetching popular feeds from ${endpoint}:`, error);
      throw error;
    }
  },

  // Fetch popular feeds
  async getActiveFeeds(): Promise<FeedSource[]> {
    const endpoint = '/active_feeds';
    try {
      // Assuming popular feeds might still return the old structure or needs adjustment
      // For admin, we'll use getAdminFeeds
      const response = await api.get<{ feeds: FeedSource[] }>(endpoint);
      // Adapt response if necessary, maybe filter/map if structure differs
      return response.data.feeds || [];
    } catch (error) {
      console.error(`Error fetching popular feeds from ${endpoint}:`, error);
      throw error;
    }
  },

  // Fetch contents from multiple feed URLs (or default)
  async getFeedsContents(urls: string[], days: number = 7): Promise<FeedsContentsResponse> {
    // Construct query parameters
    const params = new URLSearchParams();
    urls.forEach((url) => params.append('urls', url)); // Add each URL as a separate 'urls' parameter
    params.append('since', days.toString()); // Backend expects 'since'

    const endpoint = `/get_feeds_contents?${params.toString()}`;
    try {
      // Changed from api.post to api.get, no request body needed
      const response = await api.get<FeedsContentsResponse>(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching feed contents from ${endpoint}:`, error);
      throw error;
    }
  },

  // Fetch contents for a specific company
  async getCompanyContents(companyId: string): Promise<CompanyContentsResponse> {
    // Assuming this endpoint still uses GET with query param
    const endpoint = `/get_company_contents?company_id=${companyId}`;
    try {
      const response = await api.get<CompanyContentsResponse>(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error fetching company contents from ${endpoint}:`, error);
      throw error;
    }
  },

  // Fetch companies metadata
  async getCompaniesMetadata(): Promise<CompanyMetadata[]> {
    // Corrected endpoint based on app.py route '/api/platform_companies'
    const endpoint = '/platform_companies'; // Use the correct route name
    console.log(`Attempting to fetch companies from endpoint: ${endpoint}`);
    try {
      // Uses GET method via api.get
      const response = await api.get<{ companies: CompanyMetadata[] } | CompanyMetadata[]>(endpoint);

      // Check the structure of response.data
      console.log('Raw companies response data:', response.data);

      // Handle both { companies: [...] } and [...] structures
      // Assuming the backend route '/api/platform_companies' returns { companies: [...] }
      const companiesData = Array.isArray(response.data)
        ? response.data // Handle direct array just in case
        : response.data?.companies; // Primarily expect the nested structure

      if (!Array.isArray(companiesData)) {
        console.error('Companies data received is not an array:', companiesData);
        return []; // Return empty array if data is invalid
      }

      return companiesData;
    } catch (error: any) {
      // Log the full error details
      console.error(`Error fetching companies metadata from ${endpoint}:`, error.response?.status, error.response?.data, error);
      throw error; // Re-throw the error to be caught by the calling hook
    }
  },

  // --- Admin Functions (Refactored) ---

  // NEW: Fetch all feed sources for the admin panel
  async getAdminFeeds(): Promise<FeedSource[]> {
    const endpoint = '/admin/feeds'; // GET endpoint
    try {
      console.log('============ FEED SERVICE LOG (Get Admin Feeds) ============');
      const response = await api.get<{ feeds: FeedSource[] }>(endpoint); // Expects an object with feeds array
      console.log('Response from API (Get Admin Feeds):', response.data);
      return response.data.feeds || []; // Return the feeds array
    } catch (error) {
      console.error(`Error fetching admin feeds from ${endpoint}:`, error);
      throw error;
    }
  },

  // UPDATED: Add feed source(s) - Expects urls as an array
  async addFeedSource(feedData: { name: string, urls: string[] }): Promise<FeedSource[]> { // Expects updated list
    const endpoint = '/admin/feeds'; // POST endpoint
    try {
      console.log('============ FEED SERVICE LOG (Add Feed) ============');
      console.log('Sending data to endpoint:', endpoint);
      // Payload is now { name: string, urls: string[] }
      console.log('Request payload:', feedData);

      // Backend expects { name: string, urls: string[] } and returns the full updated list
      const response = await api.post<FeedSource[]>(endpoint, feedData);

      console.log('Response from API (Add Feed):', response.data);
      return response.data; // Return the updated list
    } catch (error) {
      console.error(`Error adding feed source at ${endpoint}:`, error);
      console.error('Request payload that caused error:', feedData);
      throw error;
    }
  },

  // UPDATED: Delete feed source by ID
  async deleteFeedSource(idToDelete: string): Promise<FeedSource[]> { // Expects updated list
    const endpoint = '/admin/feeds'; // DELETE endpoint
    try {
      console.log('============ FEED SERVICE LOG (Delete Feed) ============');
      console.log('Sending DELETE request to endpoint:', endpoint);
      console.log('Request payload:', { id: idToDelete }); // Payload is now { id: string }

      // Use api.delete and send data in the 'data' property for the body
      // Backend now expects { id: string } and returns the full updated list
      const response = await api.delete<FeedSource[]>(endpoint, {
        data: { id: idToDelete }, // Send payload in 'data' for DELETE
      });

      console.log('Response from API (Delete Feed):', response.data);
      return response.data; // Return the updated list
    } catch (error) {
      console.error(`Error deleting feed ID ${idToDelete} at ${endpoint}:`, error);
      console.error('Request payload that caused error:', { id: idToDelete });
      throw error;
    }
  },

  // Clear RSS Cache (Keep as is)
  async clearRssCache(): Promise<void> {
    const endpoint = '/clear_rss_cache';
    try {
      await api.post(endpoint);
      console.log('RSS cache cleared via API.');
    } catch (error) {
      console.error(`Error clearing RSS cache at ${endpoint}:`, error);
      throw error;
    }
  },

  // Refresh content counts for all feeds
  async refreshContentCounts(): Promise<FeedSource[]> {
    const endpoint = '/admin/feeds/refresh_counts'; // Create this endpoint on the backend
    try {
      console.log('============ FEED SERVICE LOG (Refresh Counts) ============');
      const response = await api.post<FeedSource[]>(endpoint);
      console.log('Response from API (Refresh Counts):', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error refreshing content counts from ${endpoint}:`, error);
      throw error;
    }
  },
};
