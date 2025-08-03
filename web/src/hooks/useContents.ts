import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Content } from '@/data/types';
import { FeedSource, CompanyMetadata } from '@/types/shared';
import { feedService } from '@/utils/services/feedService';
import api from '@/utils/api';

/**
 * CRITICAL WARNING - ZERO TOLERANCE POLICY FOR MOCK DATA
 *
 * ABSOLUTELY NO MOCK DATA IS ALLOWED IN THIS HOOK, UNDER ANY CIRCUMSTANCES.
 *
 * This file MUST only fetch data EXCLUSIVELY from real API calls.
 * Even in the case of errors, testing, or development, NO HARDCODED DATA
 * or FALLBACK VALUES are permitted.
 *
 * Violation of this policy is strictly forbidden.
 *
 * If API calls fail:
 * - Return empty arrays
 * - Set appropriate error states
 * - Log the error
 * - But NEVER fall back to sample/mock/hardcoded data
 *
 * NO EXCEPTIONS. NO TEMPORARY SOLUTIONS.
 */

// Define types for content counts
export type ContentCounts = { [key: string]: number };

// Define the structure for hook options
interface UseContentsOptions {
  sourceIds?: string[];
  companyIds?: string[];
  initialDays?: number;
  fetchMode?: 'all' | 'filtered';
  tagName?: string;
}

// Define TagContentResponse interface
interface TagContentResponse {
  contents: any[];
  count: number;
}

// Helper function to map API response content to our canonical Content type
const mapApiContentToCanonical = (apiContent: any): Content => {
  // Basic validation/check
  if (!apiContent || typeof apiContent._id !== 'string') {
    console.warn('Received invalid content data from API:', apiContent);
    // Return a minimal valid structure or throw an error, depending on desired handling
    // For now, let's return null and filter out later, or return a placeholder
    return null as any; // Or throw new Error('Invalid content data');
  }
  return {
    _id: apiContent._id, // Map _id to _id
    title: apiContent.title ?? 'Untitled Content',
    source: apiContent.source ?? 'Unknown Source',
    author: apiContent.author ?? { name: 'Unknown', image: null },
    date: apiContent.date, // Keep date string
    hoursAgo: apiContent.hoursAgo || 0,
    summary: apiContent.summary ?? '',
    tags: Array.isArray(apiContent.tags) ? apiContent.tags : [],
    companies: Array.isArray(apiContent.companies) ? apiContent.companies : [],
    sourceUrl: apiContent.sourceUrl ?? '#',
    sourceLogo: apiContent.sourceLogo || '',
    sourceColor: apiContent.sourceColor || '',
    featuredImage: apiContent.featuredImage,
    countryMentions: apiContent.countryMentions ?? {},
    trend_score: typeof apiContent.trend_score === 'number' ? apiContent.trend_score : undefined,
    trendingTags: Array.isArray(apiContent.trendingTags) ? apiContent.trendingTags : [],
    // Map other fields as necessary
  };
};

export function useContents({
  sourceIds,
  companyIds,
  initialDays = 7,
  fetchMode = 'all', // Default fetchMode to 'all'
  tagName,
}: UseContentsOptions = {}) {
  const [contents, setContents] = useState<Content[]>([]);
  const [allFeedSources, setAllFeedSources] = useState<FeedSource[]>([]);
  const [companies, setCompanies] = useState<CompanyMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sourcesContentCounts, setSourcesContentCounts] = useState<ContentCounts>({});
  const [companiesContentCounts, setCompaniesContentCounts] = useState<ContentCounts>({});

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log(`Fetching contents with mode: ${fetchMode}`, {
      sourceIds,
      companyIds,
      initialDays,
      tagName,
    });

    try {
      let fetchedContentsRaw: any[] = [];
      const fetchedCompanies: CompanyMetadata[] = [];
      const fetchedSources: FeedSource[] = [];

      if (tagName) {
        // New tag-based fetching
        const response = await api.get<TagContentResponse>('/get_content_by_tag', {
          params: { tag_name: tagName },
        });
        if (response?.data?.contents) {
          fetchedContentsRaw = response.data.contents;
          console.log(`Fetched ${response.data.count} contents via /get_content_by_tag`);
        }
      } else if (fetchMode === 'all') {
        const response = await api.get<{ contents: any[], count: number }>('/get_all_contents');
        if (response && Array.isArray(response.data.contents)) {
          fetchedContentsRaw = response.data.contents;
          console.log(`Fetched ${response.data.count} contents via /get_all_contents`);
        } else {
          throw new Error('Invalid response structure from /get_all_contents');
        }
      } else {
        const result = await feedService.getFeedsContents(sourceIds || [], initialDays);
        fetchedContentsRaw = result.contents;
        console.log(`Fetched ${fetchedContentsRaw.length} contents via feedService.getFeedsContents`);
      }

      const mappedContents = fetchedContentsRaw.map(mapApiContentToCanonical).filter(Boolean) as Content[];

      setContents(mappedContents);

      const sourcesCounts: ContentCounts = {};
      const companiesCounts: ContentCounts = {};

      mappedContents.forEach((content) => {
        if (content.source) {
          sourcesCounts[content.source] = (sourcesCounts[content.source] || 0) + 1;
        }
        if (Array.isArray(content.companies)) {
          content.companies.forEach((companyName) => {
            companiesCounts[companyName] = (companiesCounts[companyName] || 0) + 1;
          });
        }
      });

      setSourcesContentCounts(sourcesCounts);

      if (fetchedCompanies.length > 0) {
        const companiesWithCounts = fetchedCompanies.map((c) => ({
          ...c,
          content_count: companiesCounts[c.name] || 0,
        }));
        setCompanies(companiesWithCounts);
      } else {
        const companiesFromCounts = Object.entries(companiesCounts).map(([name, count]) => ({
          _id: name,
          name,
          domain: name.toLowerCase().replace(/\s+/g, ''),
          aliases: [],
          favicon: '',
          color: '#000000',
          enabled: true,
          content_count: count,
        }));
        setCompanies(companiesFromCounts);
      }
      setCompaniesContentCounts(companiesCounts);
    } catch (err: any) {
      console.error('Error fetching contents:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch contents';
      setError(errorMessage);
      setContents([]);
      setSourcesContentCounts({});
      setCompaniesContentCounts({});
      toast.error(`Error fetching contents: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [sourceIds, companyIds, initialDays, fetchMode, tagName]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents, tagName]);

  const refreshContents = useCallback(() => {
    fetchContents();
  }, [fetchContents]);

  return {
    contents,
    isLoading,
    error,
    refreshContents,
    sourcesContentCounts,
    companiesContentCounts,
    companies,
  };
}
