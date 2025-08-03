import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { feedService } from '@/utils/services/feedService';
import { FeedSource } from '@/types/shared';
// Define the API response type
interface AdminFeedsResponse {
  feeds: FeedSource[];
}

export function useFeeds() {
  const [allFeeds, setAllFeeds] = useState<FeedSource[]>([]);
  const [feedSearch, setFeedSearch] = useState('');
  const [feedSort, setFeedSort] = useState('name');
  const [isFetching, setIsFetching] = useState(false);
  const [lastAutoFetch, setLastAutoFetch] = useState<Date | null>(null);

  // Load feeds from the admin endpoint
  const loadFeeds = useCallback(async () => {
    try {
      setIsFetching(true);
      console.log('Fetching feeds from admin endpoint');

      // Use the admin feeds endpoint for the admin panel
      const feeds = await feedService.getAdminFeeds();

      console.log('Admin feeds fetched:', feeds);
      setAllFeeds(feeds);
      setLastAutoFetch(new Date());
    } catch (error) {
      console.error('Error loading feeds:', error);
      toast.error('Failed to load feed sources');
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  // Filter and sort feeds
  const filteredSortedFeeds = useCallback(() => {
    // Filter by search term
    let result = [...allFeeds];

    if (feedSearch.trim()) {
      const searchLower = feedSearch.toLowerCase();
      result = result.filter(
        (feed) => feed.name.toLowerCase().includes(searchLower),
      );
    }

    // Sort by selected field
    if (feedSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (feedSort === 'count') {
      result.sort((a, b) => (b.count || 0) - (a.count || 0));
    }

    return result;
  }, [allFeeds, feedSearch, feedSort]);

  // Function to add a new feed
  const handleAddFeed = async (feedData: { name: string, urls: string[] }) => {
    try {
      setIsFetching(true);

      // Call the feedService to add a feed
      const updatedFeeds = await feedService.addFeedSource(feedData);

      setAllFeeds(updatedFeeds);
      toast.success('Feed source added successfully');
      return updatedFeeds;
    } catch (error) {
      console.error('Error adding feed:', error);
      toast.error('Failed to add feed source');
      throw error;
    } finally {
      setIsFetching(false);
    }
  };

  // Function to delete a feed by ID
  const handleDeleteFeed = async (feedId: string) => {
    try {
      setIsFetching(true);

      // Call the deleteFeedSource method with a single ID
      const updatedFeeds = await feedService.deleteFeedSource(feedId);

      setAllFeeds(updatedFeeds);
      toast.success('Feed source deleted successfully');
      return updatedFeeds;
    } catch (error) {
      console.error('Error deleting feed:', error);
      toast.error('Failed to delete feed source');
      throw error;
    } finally {
      setIsFetching(false);
    }
  };

  // Function to refresh content counts
  const refreshContentCounts = async (showToast = true) => {
    try {
      setIsFetching(true);
      if (showToast) {
        toast.info('Refreshing feed content counts...');
      }

      // Call the refresh endpoint
      const updatedFeeds = await feedService.refreshContentCounts();

      // Update state with the refreshed data
      setAllFeeds(updatedFeeds);
      setLastAutoFetch(new Date());

      if (showToast) {
        toast.success('Feed content counts refreshed');
      }
      return updatedFeeds;
    } catch (error) {
      console.error('Error refreshing content counts:', error);
      if (showToast) {
        toast.error('Failed to refresh content counts');
      }
      throw error;
    } finally {
      setIsFetching(false);
    }
  };

  // Additional utility function for logo generation
  const handleAddLogo = async (feedId: string) => {
    // Implement if needed
    console.log('Generate logo for feed:', feedId);
    toast.info('Logo generation feature not implemented');
  };

  return {
    allFeeds,
    filteredSortedFeeds: filteredSortedFeeds(),
    feedSearch,
    setFeedSearch,
    feedSort,
    setFeedSort,
    isFetching,
    lastAutoFetch,
    refreshContentCounts,
    handleAddFeed,
    handleDeleteFeed,
    handleAddLogo,
    loadFeeds,
  };
}
