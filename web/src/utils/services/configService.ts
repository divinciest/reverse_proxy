import { TagCategory } from '@/types/admin';
import api from '../api';

// Define the structure for Geographic Bias settings
export interface GeographicBiasSettings {
    enableGeographicBias: boolean;
    autoDetectLocation: boolean;
    defaultCountryTag: string;
}

// --- ADDED: Interface for Task Definition (matches backend structure) ---
export interface TaskDefinition {
  function_path: string;
  description: string;
  is_periodic: boolean;
  interval_seconds: number;
  timeout_seconds: number;
  retry_strategy: string;
  retry_coefficient: number;
  max_retries: number;
  retry_delay_seconds: number;
  enabled: boolean;
  last_run_at: string | null; // ISO string
  next_run_at: string | null; // ISO string
  created_at?: string;
  updated_at?: string;
}
// --- END ADDED ---

// --- ADDED: Interfaces for LLM Configuration ---
export interface LlmModel {
    provider: string;
    model_name: string;
    displayName: string;
  }

export interface LlmSettings {
    availableModels: LlmModel[];
    defaultModel: {
      provider: string;
      model_name: string;
    };
    operationModels: {
      [operation: string]: {
        provider: string;
        model_name: string;
      };
    };
  }

export interface LlmApiKey {
    id: string;
    provider: string;
    key: string; // Will be masked from the backend
    name: string;
    isDefault: boolean;
  }

export interface LlmTokenUsage {
    date: string; // "YYYY-MM-DD"
    provider: string;
    model_name: string;
    input_tokens: number;
    output_tokens: number;
    displayName: string; // To make it easier on the frontend
    api_key_id?: string;
  }
  // --- END ADDED ---

export interface ApiCacheConfig {
    apiCacheEnabled: boolean;
}

export interface CacheStats {
    hour: string;
    cache_hits: number;
    cache_misses: number;
}

export interface RouteStats {
    route: string;
    total_hits: number;
    total_misses: number;
    hit_rate: number;
}

export interface CacheStatsResponse {
    overall_stats: CacheStats[];
    route_stats: RouteStats[];
    cache_enabled: boolean;
}

export interface HealthStatus {
    timestamp: string;
    status: 'HEALTHY' | 'UNHEALTHY' | 'ASSUMED_HEALTHY';
    details: string;
}

interface AllowedCategoriesResponse {
    allowedTagCategories: TagCategory[];
}

interface SeedConfig {
    autoSeed: boolean;
    autoSeedDefault: boolean;
}

export const configService = {
  /**
     * Gets the list of allowed tag categories.
     * Requires admin authentication.
     */
  async getAllowedTagCategories(): Promise<TagCategory[]> {
    try {
      const response = await api.get<{ allowedTagCategories: TagCategory[] }>('/admin/config/tag-categories');
      return response.data.allowedTagCategories;
    } catch (error: any) {
      console.error('API Error fetching allowed tag categories:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch allowed tag categories');
    }
  },

  /**
     * Updates the list of allowed tag categories.
     * Requires admin authentication.
     */
  async updateAllowedTagCategories(categories: TagCategory[]): Promise<TagCategory[]> {
    try {
      const response = await api.put<{ allowedTagCategories: TagCategory[] }>('/admin/config/tag-categories', {
        allowedTagCategories: categories,
      });
      return response.data.allowedTagCategories;
    } catch (error: any) {
      console.error('API Error updating allowed tag categories:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update allowed tag categories');
    }
  },

  /**
     * Gets the list of tag categories that cannot become trending.
     * Requires admin authentication.
     */
  async getCannotTrendTagCategories(): Promise<TagCategory[]> {
    try {
      const response = await api.get<{ cannotTrendTagsCategories: TagCategory[] }>('/admin/config/cannot-trend-tag-categories');
      return response.data.cannotTrendTagsCategories;
    } catch (error: any) {
      console.error('API Error fetching cannot trend tag categories:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch cannot trend tag categories');
    }
  },

  /**
     * Updates the list of tag categories that cannot become trending.
     * Requires admin authentication.
     */
  async updateCannotTrendTagCategories(categories: TagCategory[]): Promise<TagCategory[]> {
    try {
      const response = await api.put<{ cannotTrendTagsCategories: TagCategory[] }>('/admin/config/cannot-trend-tag-categories', {
        cannotTrendTagsCategories: categories,
      });
      return response.data.cannotTrendTagsCategories;
    } catch (error: any) {
      console.error('API Error updating cannot trend tag categories:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update cannot trend tag categories');
    }
  },

  /**
     * Fetches the geographic bias settings from the backend (admin).
     */
  async getGeographicBiasSettings(): Promise<GeographicBiasSettings> {
    try {
      const response = await api.get<GeographicBiasSettings>('/admin/config/geographic-bias');
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching geographic bias settings:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch geographic bias settings');
    }
  },

  /**
     * Updates the geographic bias settings on the backend (admin).
     * @param settings - The new geographic bias settings.
     */
  async updateGeographicBiasSettings(settings: GeographicBiasSettings): Promise<GeographicBiasSettings> {
    try {
      const response = await api.put<GeographicBiasSettings>('/admin/config/geographic-bias', settings);
      return response.data;
    } catch (error: any) {
      console.error('API Error updating geographic bias settings:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update geographic bias settings');
    }
  },

  /**
     * Fetches the geographic bias configuration for general client use.
     */
  async getClientGeographicBiasConfig(): Promise<GeographicBiasSettings> {
    try {
      const response = await api.get<GeographicBiasSettings>('/get_geographic_bias_config');
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching client geographic bias config:', error.response?.data || error.message);
      // Provide default or throw, depending on how critical this is for the client
      // For now, let's throw so the client knows something is wrong.
      throw new Error(error.response?.data?.error || 'Failed to fetch geographic bias configuration');
    }
  },

  /**
     * Fetches the seed configuration from the backend.
     */
  async getSeedConfig(): Promise<SeedConfig> {
    try {
      const response = await api.get<SeedConfig>('/admin/config/seed-settings');
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching seed config:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch seed configuration');
    }
  },

  /**
     * Updates the seed configuration on the backend.
     * @param autoSeed - The new autoSeed value.
     */
  async updateSeedConfig(autoSeed: boolean): Promise<SeedConfig> {
    try {
      const response = await api.put<SeedConfig>('/admin/config/seed-settings', {
        autoSeed, // Only send the mutable value
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error updating seed config:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update seed configuration');
    }
  },

  // --- ADDED: Methods for Scheduled Task Definitions ---
  /**
     * Fetches all scheduled task definitions from the backend.
     */
  async getTaskDefinitions(): Promise<TaskDefinition[]> {
    try {
      const response = await api.get<TaskDefinition[]>('/admin/scheduler/definitions');
      console.log('Response from /admin/scheduler/definitions:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('API Error fetching task definitions:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch task definitions');
    }
  },

  /**
     * Updates a specific task definition.
     * Requires admin authentication.
     */
  async updateTaskDefinition(functionPath: string, data: Partial<Pick<TaskDefinition, 'enabled' | 'interval_seconds' | 'timeout_seconds'>>): Promise<TaskDefinition> {
    try {
      const response = await api.put<TaskDefinition>(`/admin/scheduler/definitions/${functionPath}`, data);
      return response.data;
    } catch (error: any) {
      console.error('API Error updating task definition:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update task definition');
    }
  },

  async getLlmApiKeys(): Promise<LlmApiKey[]> {
    try {
      const response = await api.get<LlmApiKey[]>('/admin/config/llm-api-keys');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch LLM API keys');
    }
  },

  async addLlmApiKey(keyData: { provider: string; key: string; name: string; }): Promise<LlmApiKey[]> {
    try {
      const response = await api.post<LlmApiKey[]>('/admin/config/llm-api-keys', keyData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to add LLM API key');
    }
  },

  async setLlmApiKeyAsDefault(keyId: string): Promise<LlmApiKey[]> {
    try {
      const response = await api.put<LlmApiKey[]>(`/admin/config/llm-api-keys/${keyId}`, { isDefault: true });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to set default LLM API key');
    }
  },

  async deleteLlmApiKey(keyId: string): Promise<LlmApiKey[]> {
    try {
      const response = await api.delete<LlmApiKey[]>(`/admin/config/llm-api-keys/${keyId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete LLM API key');
    }
  },

  async getLlmSettings(): Promise<LlmSettings> {
    try {
      const response = await api.get<LlmSettings>('/admin/config/llm-settings');
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching LLM settings:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch LLM settings');
    }
  },

  async updateLlmSettings(settings: Partial<Pick<LlmSettings, 'defaultModel' | 'operationModels'>>): Promise<LlmSettings> {
    try {
      const response = await api.put<LlmSettings>('/admin/config/llm-settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('API Error updating LLM settings:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to update LLM settings');
    }
  },

  async getLlmTokenUsage(): Promise<LlmTokenUsage[]> {
    try {
      const response = await api.get<LlmTokenUsage[]>('/admin/config/llm-token-usage');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch LLM token usage');
    }
  },

  async getApiCacheConfig(): Promise<ApiCacheConfig> {
    try {
      const response = await api.get<ApiCacheConfig>('/admin/config/api-cache-settings');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch API cache config');
    }
  },

  async updateApiCacheConfig(apiCacheEnabled: boolean): Promise<ApiCacheConfig> {
    try {
      const response = await api.put<ApiCacheConfig>('/admin/config/api-cache-settings', { apiCacheEnabled });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update API cache config');
    }
  },

  async clearApiCache(): Promise<{ message: string, files_deleted: number }> {
    try {
      const response = await api.post<{ message: string, files_deleted: number }>('/admin/config/clear-api-cache');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to clear API cache');
    }
  },

  async resetConfigToDefault(): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/admin/config/reset');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to reset configuration');
    }
  },

  async getCacheStats(): Promise<CacheStatsResponse> {
    try {
      const response = await api.get<CacheStatsResponse>('/admin/config/cache-stats');
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching cache stats:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch cache stats');
    }
  },

  async getHealthStatus(day: string): Promise<HealthStatus[]> {
    try {
      const response = await api.get<HealthStatus[]>('/admin/health-status', { params: { day } });
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching health status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch health status');
    }
  },

  async getBugReports(startDate?: string, endDate?: string): Promise<string[]> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.get<string[]>('/admin/bug-reports', { params });
      return response.data;
    } catch (error: any) {
      console.error('API Error fetching bug reports:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to fetch bug reports');
    }
  },

  getBugReportDownloadUrl(filename: string): string {
    return `${api.defaults.baseURL}/admin/bug-reports/${filename}`;
  },

  async deleteBugReport(filename: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/admin/bug-reports/${filename}`);
      return response.data;
    } catch (error: any) {
      console.error(`API Error deleting bug report ${filename}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || `Failed to delete bug report ${filename}`);
    }
  },

  async deleteAllBugReports(startDate?: string, endDate?: string): Promise<{ success: boolean; message: string }> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.delete<{ success: boolean; message: string }>('/admin/bug-reports', { params });
      return response.data;
    } catch (error: any) {
      console.error('API Error deleting all bug reports:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to delete all bug reports');
    }
  },
};
