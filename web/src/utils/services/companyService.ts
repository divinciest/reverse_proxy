import { authService } from '../auth';
import { CompanyMetadata, Content, FeedInfo } from '@/types/shared';
import api from '../api';

export const companyService = {
  async getPlatformCompanies(): Promise<CompanyMetadata[]> {
    try {
      const response = await api.get('/platform_companies');
      console.log('API response for companies:', response);

      if (!response.data.companies) {
        console.warn("No 'companies' field in API response:", response.data);
        return Array.isArray(response.data) ? response.data : [];
      }

      return response.data.companies;
    } catch (error) {
      console.error('Error fetching platform companies:', error);
      throw error;
    }
  },
  async getPlatformCompaniesForAdmin(): Promise<CompanyMetadata[]> {
    try {
      const response = await api.get('/admin/platform_companies');
      return response.data.companies;
    } catch (error) {
      console.error('Error fetching platform companies:', error);
      throw error;
    }
  },
  async getCompanyContents(companyName: string): Promise<{
    company: string;
    contents: Content[];
    feeds_sourced: FeedInfo[];
    companies_metadata: CompanyMetadata[];
  }> {
    try {
      const response = await api.get(`/company_contents/${encodeURIComponent(companyName)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contents for company ${companyName}:`, error);
      throw error;
    }
  },

  // Admin operations
  addCompany: async (name: string, domain: string, aliases: string[] = []) => {
    const response = await api.post('/admin/company/add', {
      name,
      domain,
      aliases,
    });
    return response.data.company;
  },

  // Update company status (enable/disable)
  updateCompanyStatus: async (company_id: string, enabled: boolean) => {
    const response = await api.post('/admin/company/update_status', {
      company_id,
      enabled,
    });
    return response.data;
  },

  // Delete a company
  deleteCompany: async (company_id: string) => {
    const response = await api.delete(`/admin/company/delete/${company_id}`);
    return response.data;
  },
};

// Admin-specific operations for companies
export const adminCompanyService = {
  async addCompany(name: string, domain: string, isFirm: boolean, aliases?: string[]): Promise<CompanyMetadata> {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.post('/admin/company/add', {
        name,
        domain,
        aliases,
        is_firm: isFirm,
      });
      return response.data.company;
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  },

  async updateCompany(companyId: string, data: { is_firm: boolean }): Promise<CompanyMetadata> {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.put(`/admin/company/update/${companyId}`, data);
      return response.data.company;
    } catch (error) {
      console.error(`Error updating company with ID ${companyId}:`, error);
      throw error;
    }
  },

  async updateCompanyStatus(companyId: string, enabled: boolean): Promise<void> {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.post('/admin/company/update_status', {
        company_id: companyId,
        enabled,
      });
      if (!response.data) {
        throw new Error('Failed to update company status');
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      throw error;
    }
  },

  async deleteCompany(companyId: string): Promise<void> {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await api.delete(`/admin/company/delete/${companyId}`);
      if (!response.data) {
        throw new Error('Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },
};
