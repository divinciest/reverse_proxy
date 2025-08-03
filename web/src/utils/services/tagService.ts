import { Tag, TagCategory, TagNetworkData, WorldHeatmapResponse } from "@/types/shared";
import { TagLink } from "./tagLinksService";
import api from '../api'; // Import the axios instance
import axios from 'axios'; // To use axios.isAxiosError for type checking
import { RadarDataPoint } from '@/components/widgets/RadarChart';

// Helper function to ensure tag defaults, now including finance_approved
const ensureTagDefaults = (tag: any): Tag => ({
  ...tag,
  _id: tag._id || tag.tag_name, // Fallback _id if needed
  tag_name: tag.tag_name,
  aliases: tag.aliases || [],
  category: tag.category || 'topic', // Consider using a fetched default
  parentTag: tag.parentTag ?? null,
  childTags: tag.childTags ?? [],
  trendable: tag.trendable ?? false,
  explorable: tag.explorable ?? false,
  humanReviewed: tag.humanReviewed ?? false,
  finance_approved: tag.finance_approved ?? false, // <-- Add default
  createdAt: tag.createdAt,
  lastModified: tag.lastModified,
  contents_count: tag.contents_count ?? 0, // Ensure contents_count is present
  source_icons: tag.source_icons || [],
  // Backend might send link creation summary/errors, not part of Tag type itself
});

// Define a more specific payload type for adding tags
export interface AddTagPayload {
  tag_name: string;
  aliases: string[];
  category: TagCategory;
  trendable: boolean;
  explorable: boolean;
  humanReviewed: boolean;
  finance_approved: boolean;
  alias_match_eligible?: boolean;
  wallpaper?: string; // Optional wallpaper URL
  trending?: boolean; // This is often calculated by backend or based on other factors
  initial_links?: { targetTagName: string, relationship: string }[];
}

export interface UpdateTagPayload extends Partial<Omit<Tag, '_id' | 'createdAt' | 'lastModified' | 'contents_count'>> {
  links?: Array<{ targetTagName: string; relationship: string }>;
}

export interface TagWithDetails extends Tag {
  links: TagLink[];
}

export interface VisNode {
  id: string | number;
  label: string;
  title?: string;
  group?: string;
  level?: number;
  [key: string]: any; // Allow other vis.js node options
}

export interface VisEdge {
  from: string | number;
  to: string | number;
  label?: string;
  arrows?: string | object;
  title?: string;
  [key: string]: any; // Allow other vis.js edge options
}

export interface TagVisitStat {
  tag_name: string;
  visit_count: number;
}

export interface TagContentResponse {
  contents: any[]; // Consider replacing 'any' with a proper Content type
  count: number;
}

// Corresponds to the recursive node structure sent by the backend
export interface TopicHierarchyNode extends Tag {
  children: TopicHierarchyNode[];
}

// This is the actual shape of the API response
export interface ExplorableTopicsHierarchyResponse {
  hierarchies: TopicHierarchyNode[];
  orphan_tags: Tag[];
}

// Recursive helper to apply defaults to the hierarchy
const ensureHierarchyNodeDefaults = (node: TopicHierarchyNode): TopicHierarchyNode => {
  const defaultedNode = ensureTagDefaults(node) as TopicHierarchyNode;
  defaultedNode.children = (node.children || []).map(ensureHierarchyNodeDefaults);
  return defaultedNode;
};

// Define interfaces for getAllTags parameters and response based on backend capabilities
export interface GetAllTagsParams {
  search?: string;
  categories?: string; // Assuming comma-separated if supported by backend
  trending?: 'all' | 'true' | 'false';
  explorable?: 'all' | 'true' | 'false';
  sortBy?: string; // New sort parameter
  sortOrder?: 'asc' | 'desc'; // New sort direction
  limit?: number;
  offset?: number;
}

export interface AllTagsResponse {
  tags: Tag[];
  total_count: number;
}

export interface BrowseDataResponse {
  companies: Tag[];
  financial_topics: Tag[];
  economic_sectors: Tag[];
  events: any[]; // Event type from eventService
}

export const tagService = {
  // getAllTags now handles search and other params, expects {tags: [], total_count: X} response
  async getAllTags(params?: GetAllTagsParams): Promise<AllTagsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.search) queryParams.append('search', params.search);
        if (params.categories) queryParams.append('categories', params.categories);
        if (params.trending && params.trending !== 'all') queryParams.append('trending', params.trending);
        if (params.explorable && params.explorable !== 'all') queryParams.append('explorable', params.explorable);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/tags?${queryString}` : '/tags';

      const response = await api.get<AllTagsResponse>(url); // Expect AllTagsResponse structure
      const { data } = response;
      return {
        tags: (data?.tags || []).map(ensureTagDefaults),
        total_count: data?.total_count || 0,
      };
    } catch (error) {
      console.error(`Error fetching tags with params (${JSON.stringify(params)}):`, error);
      // Return a default error structure compatible with AllTagsResponse
      return { tags: [], total_count: 0 };
    }
  },

  // New optimized method for Browse page
  async getBrowseData(): Promise<BrowseDataResponse> {
    try {
      const response = await api.get<BrowseDataResponse>('/browse-data');
      const { data } = response;
      return {
        companies: (data?.companies || []).map(ensureTagDefaults),
        financial_topics: (data?.financial_topics || []).map(ensureTagDefaults),
        economic_sectors: (data?.economic_sectors || []).map(ensureTagDefaults),
        events: data?.events || [],
      };
    } catch (error) {
      console.error('Error fetching browse data:', error);
      return {
        companies: [],
        financial_topics: [],
        economic_sectors: [],
        events: [],
      };
    }
  },

  // getAllTags now handles search and other params, expects {tags: [], total_count: X} response
  async getAllTagsAdmin(params?: GetAllTagsParams): Promise<AllTagsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        if (params.search) queryParams.append('search', params.search);
        if (params.categories) queryParams.append('categories', params.categories);
        if (params.trending && params.trending !== 'all') queryParams.append('trending', params.trending);
        if (params.explorable && params.explorable !== 'all') queryParams.append('explorable', params.explorable);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
        if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
      }

      const queryString = queryParams.toString();
      const url = queryString ? `/admin/tags?${queryString}` : '/admin/tags';

      const response = await api.get<AllTagsResponse>(url); // Expect AllTagsResponse structure
      const { data } = response;
      return {
        tags: (data?.tags || []).map(ensureTagDefaults),
        total_count: data?.total_count || 0,
      };
    } catch (error) {
      console.error(`Error fetching tags with params (${JSON.stringify(params)}):`, error);
      // Return a default error structure compatible with AllTagsResponse
      return { tags: [], total_count: 0 };
    }
  },

  async getAllTagsLimited(limit: number): Promise<Tag[]> { // Kept for non-search initial/limited loads
    try {
      // This route might return {'tags': []} or just [] based on backend implementation.
      // The user's reverted tags.py get_tags_limited returns {'tags': []}
      const response = await api.get<{tags: Tag[]}>(`/admin/tags/limited/${limit}`);
      const { data } = response;
      return (data?.tags || []).map(ensureTagDefaults);
    } catch (error) {
      console.error(`Error fetching limited tags (limit: ${limit}):`, error);
      throw error;
    }
  },

  async getTrendingTags(): Promise<Tag[]> {
    try {
      const response = await api.get('/trending_tags');
      const { data } = response; // Axios provides data directly
      return (data || []).map(ensureTagDefaults);
    } catch (error) {
      console.error('Error fetching trending tags:', error);
      throw error; // Re-throw for global error handler and caller
    }
  },

  async getTagByName(tag_name: string): Promise<Tag | null> {
    try {
      const encodedtag_name = encodeURIComponent(tag_name);
      // The api instance handles headers (including auth if configured)
      const response = await api.get(`/tags/${encodedtag_name}`);

      // If response.data exists, process it
      if (response.data) {
        return ensureTagDefaults(response.data);
      }
      // If API returns 2xx with no data, treat as not found or handle as appropriate
      return null;
    } catch (error) {
      // Check if it's an Axios error and specifically a 404
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        // The global interceptor in api.ts likely already toasted/logged.
        // This function's contract is to return null on 404.
        return null;
      }
      console.error(`Error fetching tag by name "${tag_name}":`, error);
      // Re-throw other errors for global handler and caller
      throw error;
    }
  },

  async getTagWithDetails(tagId: string): Promise<TagWithDetails | null> {
    try {
      const response = await api.get<TagWithDetails>(`/admin/tags/${tagId}/detailed`);
      if (response.data) {
        // Assuming ensureTagDefaults is suitable for the main tag part
        // and links are already in the correct format from backend
        return {
          ...ensureTagDefaults(response.data),
          links: response.data.links || [],
        };
      }
      return null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
        return null;
      }
      console.error(`Error fetching detailed tag by ID "${tagId}":`, error);
      throw error;
    }
  },

  async getTagNetwork(tagName: string, degree: number): Promise<TagNetworkData> {
    try {
      const encodedTagName = encodeURIComponent(tagName);
      const response = await api.get<TagNetworkData>(`/tags/${encodedTagName}/network/${degree}`);
      return response.data || { nodes: [], edges: [] };
    } catch (error) {
      console.error(`Error fetching tag network for "${tagName}" with degree ${degree}:`, error);
      throw error; // Re-throw for caller to handle
    }
  },

  async addTag(tagData: AddTagPayload): Promise<Tag> { // Use the new payload type
    try {
      // The backend now handles initial_links.
      // finance_approved is part of AddTagPayload, ensure it's set.
      // The tagData already includes initial_links if provided by AddTagForm
      const response = await api.post<{
        tag: Tag,
        message: string,
        created_links_summary?: any,
        link_creation_errors?: string[]
      }>('/admin/tags/add', tagData);

      // Log any link creation errors or summary from backend if needed
      if (response.data.link_creation_errors && response.data.link_creation_errors.length > 0) {
        console.warn('Tag added, but some initial links had issues:', response.data.link_creation_errors);
        // Optionally, throw a custom error or attach this info to the returned tag object
        // for the UI to display. For now, the primary tag object is returned.
      }
      if (response.data.created_links_summary) {
        console.log('Initial links processing summary:', response.data.created_links_summary);
      }

      return ensureTagDefaults(response.data.tag);
    } catch (error: any) {
      console.error('Error adding tag in service:', error);
      // The error.response.data might contain more specific messages from the backend,
      // including link_creation_errors if the whole request failed at that stage.
      throw error;
    }
  },

  async updateTag(tagId: string, updates: UpdateTagPayload): Promise<Tag> {
    try {
      // The api instance handles headers
      // The 'updates' payload will now include the 'links' array if provided
      const response = await api.put(`/admin/tags/${tagId}`, updates);
      const { data } = response; // Axios provides data directly
      return ensureTagDefaults(data.tag);
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error; // Re-throw for global error handler and caller
    }
  },

  async deleteTag(tagId: string): Promise<void> {
    try {
      // The api instance handles headers
      await api.delete(`/admin/tags/${tagId}`);
      // No explicit return for void, success is implied if no error thrown
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error; // Re-throw for global error handler and caller
    }
  },

  async getTagVisitStats(from?: string, to?: string): Promise<TagVisitStat[]> {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const response = await api.get(`/admin/statistics/tag-visits?${params.toString()}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tag visit statistics:', error);
      throw error;
    }
  },

  async registerTagVisit(tagName: string): Promise<void> {
    try {
      const encodedTagName = encodeURIComponent(tagName);
      // This is a fire-and-forget call, we don't need the response
      await api.put(`/tags/visit/${encodedTagName}`);
    } catch (error) {
      // We can log this, but we don't want to bother the user if it fails.
      console.warn(`Failed to register visit for tag "${tagName}":`, error);
    }
  },

  async getContentByTag(tagName: string): Promise<TagContentResponse> {
    try {
      const response = await api.get('/get_content_by_tag', {
        params: { tag_name: tagName },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching content for tag ${tagName}:`, error);
      throw error;
    }
  },

  async getExplorableTags(): Promise<Tag[]> {
    try {
      const response = await api.get('/explorable_tags');
      const { data } = response;
      return (data || []).map(ensureTagDefaults);
    } catch (error) {
      console.error('Error fetching explorable tags:', error);
      throw error;
    }
  },

  async getExplorableTopicsHierarchy(): Promise<ExplorableTopicsHierarchyResponse> {
    try {
      const response = await api.get<ExplorableTopicsHierarchyResponse>('/explorable-topics-hierarchy');
      // Ensure defaults are applied to all nested tags using the recursive helper
      const hierarchies = (response.data?.hierarchies || []).map(ensureHierarchyNodeDefaults);
      const orphans = (response.data?.orphan_tags || []).map(ensureTagDefaults);

      return { hierarchies, orphan_tags: orphans };
    } catch (error) {
      console.error('Error fetching explorable topics hierarchy:', error);
      throw error;
    }
  },

  async getRadarChartData(tagName: string): Promise<RadarDataPoint[]> {
    try {
      const response = await api.get<RadarDataPoint[]>('/insights/radar_chart', {
        params: { tag_name: tagName },
      });
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching radar chart data for tag ${tagName}:`, error);
      throw error;
    }
  },
};

export const getWorldHeatmap = async (): Promise<WorldHeatmapResponse> => {
  const response = await api.get<WorldHeatmapResponse>('/get_world_heat_map');
  return response.data;
};

export const getWorldHeatmapByTag = async (tagName: string): Promise<WorldHeatmapResponse> => {
  const response = await api.get<WorldHeatmapResponse>('/get_world_heat_map_by_tag', {
    params: { tag_name: tagName },
  });
  return response.data;
};
