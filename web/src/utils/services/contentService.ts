import api from '../api';
import { Content } from '@/types/shared';

export interface GetAllContentsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    sources?: string; // comma-separated
    tags?: string; // comma-separated
}

export interface AllContentsResponse {
    contents: Content[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalContents: number;
        limit: number;
    };
}

export const contentService = {
  async getAllContents(params: GetAllContentsParams): Promise<AllContentsResponse> {
    try {
      const response = await api.get<AllContentsResponse>('/admin/contents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching contents:', error);
      throw error;
    }
  },

  async getContentsByIds(ids: string[]): Promise<Content[]> {
    if (ids.length === 0) {
      return [];
    }
    try {
      const response = await api.post<Content[]>('/admin/contents/by_ids', { ids });
      return response.data;
    } catch (error) {
      console.error('Error fetching contents by IDs:', error);
      throw error;
    }
  },
};
