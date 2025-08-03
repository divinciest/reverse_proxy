import api from '../api';

export interface TagLinkType {
  _id: string;
  name: string;
  description: string;
  direction: 'up' | 'down' | 'horizontal' | 'unset';
  createdAt: string;
  lastModified: string;
  complementary_link_name?: string;
}

export interface UpdateTagLinkTypeData {
  description?: string;
  complementary_link_name?: string | null;
  direction?: 'up' | 'down' | 'horizontal' | 'unset';
  actions?: {
    create_complement_for_current?: boolean;
    create_current_for_complement?: boolean;
    remove_complement_for_current?: boolean;
    remove_current_for_complement?: boolean;
  }
}

const tagLinksTypesService = {
  getAllLinkTypes: async (): Promise<TagLinkType[]> => {
    const response = await api.get<{ link_types: TagLinkType[] }>('/admin/link_types');
    return response.data.link_types;
  },

  addLinkType: async (linkTypeData: { name: string, description?: string, complementary_link_name?: string, direction?: 'up' | 'down' | 'horizontal' | 'unset' }) => {
    const response = await api.post<{ link_type: TagLinkType }>(
      '/admin/link_types',
      linkTypeData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data.link_type;
  },

  updateLinkType: async (typeId: string, updateData: UpdateTagLinkTypeData) => {
    await api.put(`/admin/link_types/${typeId}`, updateData);
  },

  deleteLinkType: async (typeId: string) => {
    await api.delete(`/admin/link_types/${typeId}`);
  },
};

export default tagLinksTypesService;
