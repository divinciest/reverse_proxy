import api from '../api';

export interface TagLink {
  _id: string;
  sourceTag: string;
  targetTag: string;
  relationship: string;
  createdAt: string;
  lastModified: string;
}

const tagLinksService = {
  getAllTagLinks: async (): Promise<{ tag_links: TagLink[], link_types: Array<{ name: string, description: string }> }> => {
    const response = await api.get<{ tag_links: TagLink[], link_types: Array<{ name: string, description: string }> }>('/admin/tag_links');
    return response.data;
  },

  addTagLink: async (linkData: { sourceTag: string, targetTag: string, relationship: string }) => {
    const response = await api.post<{ link: TagLink }>('/admin/tag_links', linkData);
    return response.data.link;
  },

  updateTagLink: async (linkId: string, updateData: { sourceTag?: string, targetTag?: string, relationship?: string }) => {
    await api.put(`/admin/tag_links/${linkId}`, updateData);
  },

  deleteTagLink: async (linkId: string) => {
    await api.delete(`/admin/tag_links/${linkId}`);
  },
};

export default tagLinksService;
