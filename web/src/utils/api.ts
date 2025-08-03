import axios, { AxiosRequestConfig } from 'axios';
import { toast } from 'sonner'; // Optional: for global error handling
import { authService } from './auth'; // Or directly access localStorage
import { setupCache, buildMemoryStorage, buildWebStorage } from 'axios-cache-interceptor';

// FIFO localStorage Management System
class FIFOLocalStorageManager {
  private readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
  private readonly CACHE_PREFIX = 'axios-cache:';
  private readonly PROTECTED_KEYS = ['authToken', 'userData']; // Keys that should never be removed

  constructor() {
    this.ensureStorageSpace();
  }

  // Calculate the size of a string in bytes
  private getStringSize(str: string): number {
    return new Blob([str]).size;
  }

  // Get all cache entries with their sizes and timestamps
  private getCacheEntries(): Array<{key: string, value: string, size: number, timestamp: number}> {
    const entries: Array<{key: string, value: string, size: number, timestamp: number}> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = this.getStringSize(value);
            const timestamp = this.extractTimestamp(key) || Date.now();
            entries.push({ key, value, size, timestamp });
          }
        }
      }
    } catch (error) {
      console.warn('[FIFO] Error reading localStorage entries:', error);
    }
    
    return entries;
  }

  // Extract timestamp from cache key
  private extractTimestamp(key: string): number | null {
    try {
      const parts = key.split(':');
      const timestamp = parts[parts.length - 1];
      const parsed = parseInt(timestamp, 10);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }

  // Calculate total size of cache entries
  private getTotalCacheSize(): number {
    const entries = this.getCacheEntries();
    return entries.reduce((total, entry) => total + entry.size, 0);
  }

  // Remove oldest cache entries until we have enough space
  private removeOldestEntries(requiredSpace: number): void {
    const entries = this.getCacheEntries();
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    let removedSize = 0;
    const removedKeys: string[] = [];
    
    for (const entry of entries) {
      const isProtected = this.PROTECTED_KEYS.some(protectedKey => 
        entry.key.includes(protectedKey) || entry.key.includes('authToken') || entry.key.includes('userData')
      );
      
      if (isProtected) continue;
      
      if (removedSize >= requiredSpace) break;
      
      try {
        localStorage.removeItem(entry.key);
        removedSize += entry.size;
        removedKeys.push(entry.key);
      } catch (error) {
        console.warn('[FIFO] Error removing cache entry:', entry.key, error);
      }
    }
    
    if (removedKeys.length > 0) {
      console.log(`[FIFO] Removed ${removedKeys.length} oldest cache entries (${removedSize} bytes) to free space`);
    }
  }

  // Ensure we have enough space before storing new data
  public ensureStorageSpace(additionalSize: number = 0): void {
    try {
      const currentSize = this.getTotalCacheSize();
      const availableSpace = this.MAX_SIZE - currentSize;
      
      if (availableSpace < additionalSize) {
        const requiredSpace = additionalSize - availableSpace;
        console.log(`[FIFO] Storage space low. Current: ${currentSize}, Required: ${additionalSize}, Available: ${availableSpace}`);
        this.removeOldestEntries(requiredSpace);
      }
    } catch (error) {
      console.warn('[FIFO] Error ensuring storage space:', error);
    }
  }

  // Custom setItem that implements FIFO
  public setItem(key: string, value: string): void {
    try {
      const valueSize = this.getStringSize(value);
      this.ensureStorageSpace(valueSize);
      
      const currentSize = this.getTotalCacheSize();
      if (currentSize + valueSize > this.MAX_SIZE) {
        console.warn('[FIFO] Still insufficient space after cleanup, skipping storage');
        return;
      }
      
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[FIFO] Error setting item:', key, error);
    }
  }

  // Custom getItem
  public getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[FIFO] Error getting item:', key, error);
      return null;
    }
  }

  // Custom removeItem
  public removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[FIFO] Error removing item:', key, error);
    }
  }

  // Custom clear (only cache entries)
  public clear(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`[FIFO] Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.warn('[FIFO] Error clearing cache:', error);
    }
  }

  // Get storage info
  public getStorageInfo(): {currentSize: number, maxSize: number, usagePercent: number} {
    const currentSize = this.getTotalCacheSize();
    const usagePercent = (currentSize / this.MAX_SIZE) * 100;
    
    return {
      currentSize,
      maxSize: this.MAX_SIZE,
      usagePercent
    };
  }
}

const __alert = (message: string) => {

};

// Get the base URL from environment variables, fallback to the one used in auth.ts
// we are already adding the /api to the base url in the backend
// code calling the api should not add the /api to the base url
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.advisorassist.ai/api';

console.log('API Base URL being used:', API_BASE_URL);

// --- Caching Configuration ---
// Caching is enabled by default. Set VITE_API_CACHING_ENABLED=false in your .env file to disable.
const API_CACHING_ENABLED = true; //! (import.meta.env.VITE_API_CACHING_ENABLED === 'false');

// Choose storage type: 'localStorage', 'sessionStorage', or 'memory'
const CACHE_STORAGE_TYPE = import.meta.env.VITE_CACHE_STORAGE_TYPE || 'localStorage';

if (API_CACHING_ENABLED) {
  console.log('[API CACHE] Client-side API caching is ENABLED.');
  console.log('[API CACHE] Using storage type:', CACHE_STORAGE_TYPE);
} else {
  console.log('[API CACHE] Client-side API caching is DISABLED.');
}

// Update the exclusion list to match actual API paths
const EXCLUDED_CACHE_PATHS = [
  '/users/login',
  '/users/register',
  '/users/refresh_token',
  '/admin/logs',
  '/admin/', // Now matches any admin path including /admin/backups
  '/admin/backups', // Explicitly exclude backup listing
  '/admin/backups/create', // Explicitly exclude backup creation
  '/admin/backups/upload', // Explicitly exclude backup upload
  '/admin/backups/restore', // Explicitly exclude backup restore
  '/admin/backups/download', // Explicitly exclude backup download
  '/admin/backups/delete', // Explicitly exclude backup deleti
  '/admin/config/llm-settings', // Explicitly exclude LLM settings
];

// FIFO localStorage Management System
const FIFO_MANAGER = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB limit
  CACHE_PREFIX: 'axios-cache:',
  PROTECTED_KEYS: ['authToken', 'userData'], // Keys that should never be removed

  // Calculate the size of a string in bytes
  getStringSize(str: string): number {
    return new Blob([str]).size;
  },

  // Get all cache entries with their sizes and timestamps
  getCacheEntries(): Array<{key: string, value: string, size: number, timestamp: number}> {
    const entries: Array<{key: string, value: string, size: number, timestamp: number}> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = this.getStringSize(value);
            const timestamp = this.extractTimestamp(key) || Date.now();
            entries.push({ key, value, size, timestamp });
          }
        }
      }
    } catch (error) {
      console.warn('[FIFO] Error reading localStorage entries:', error);
    }
    
    return entries;
  },

  // Extract timestamp from cache key
  extractTimestamp(key: string): number | null {
    try {
      const parts = key.split(':');
      const timestamp = parts[parts.length - 1];
      const parsed = parseInt(timestamp, 10);
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  },

  // Calculate total size of cache entries
  getTotalCacheSize(): number {
    const entries = this.getCacheEntries();
    return entries.reduce((total, entry) => total + entry.size, 0);
  },

  // Remove oldest cache entries until we have enough space
  removeOldestEntries(requiredSpace: number): void {
    const entries = this.getCacheEntries();
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    let removedSize = 0;
    const removedKeys: string[] = [];
    
    for (const entry of entries) {
      const isProtected = this.PROTECTED_KEYS.some(protectedKey => 
        entry.key.includes(protectedKey) || entry.key.includes('authToken') || entry.key.includes('userData')
      );
      
      if (isProtected) continue;
      
      if (removedSize >= requiredSpace) break;
      
      try {
        localStorage.removeItem(entry.key);
        removedSize += entry.size;
        removedKeys.push(entry.key);
      } catch (error) {
        console.warn('[FIFO] Error removing cache entry:', entry.key, error);
      }
    }
    
    if (removedKeys.length > 0) {
      console.log(`[FIFO] Removed ${removedKeys.length} oldest cache entries (${removedSize} bytes) to free space`);
    }
  },

  // Ensure we have enough space before storing new data
  ensureStorageSpace(additionalSize: number = 0): void {
    try {
      const currentSize = this.getTotalCacheSize();
      const availableSpace = this.MAX_SIZE - currentSize;
      
      if (availableSpace < additionalSize) {
        const requiredSpace = additionalSize - availableSpace;
        console.log(`[FIFO] Storage space low. Current: ${currentSize}, Required: ${additionalSize}, Available: ${availableSpace}`);
        this.removeOldestEntries(requiredSpace);
      }
    } catch (error) {
      console.warn('[FIFO] Error ensuring storage space:', error);
    }
  },



  // Custom getItem
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('[FIFO] Error getting item:', key, error);
      return null;
    }
  },

  // Custom removeItem
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[FIFO] Error removing item:', key, error);
    }
  },

  // Custom clear (only cache entries)
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`[FIFO] Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.warn('[FIFO] Error clearing cache:', error);
    }
  },

  // Get storage info
  getStorageInfo(): {currentSize: number, maxSize: number, usagePercent: number} {
    const currentSize = this.getTotalCacheSize();
    const usagePercent = (currentSize / this.MAX_SIZE) * 100;
    
    return {
      currentSize,
      maxSize: this.MAX_SIZE,
      usagePercent
    };
  }
};

// Initialize FIFO manager
FIFO_MANAGER.ensureStorageSpace();

// Create an axios instance
const baseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Function to create the appropriate storage based on configuration
const createStorage = () => {
  if (!API_CACHING_ENABLED) {
    return false;
  }

  switch (CACHE_STORAGE_TYPE) {
    case 'localStorage':
      try {
        // Test if localStorage is available and working
        const testKey = '__axios_cache_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        
        // Use localStorage with FIFO management
        // The FIFO logic will be handled by overriding localStorage methods
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key: string, value: string) {
          if (key.startsWith('axios-cache:')) {
            // Use the original setItem to avoid infinite loop
            const valueSize = FIFO_MANAGER.getStringSize(value);
            FIFO_MANAGER.ensureStorageSpace(valueSize);
            
            const currentSize = FIFO_MANAGER.getTotalCacheSize();
            if (currentSize + valueSize > FIFO_MANAGER.MAX_SIZE) {
              console.warn('[FIFO] Still insufficient space after cleanup, skipping storage');
              return;
            }
            
            originalSetItem.call(localStorage, key, value);
          } else {
            originalSetItem.call(localStorage, key, value);
          }
        };
        
        return buildWebStorage(localStorage, 'axios-cache:');
      } catch (error) {
        console.warn('[API CACHE] localStorage not available, falling back to memory storage:', error);
        return buildMemoryStorage();
      }
    
    case 'sessionStorage':
      try {
        // Test if sessionStorage is available and working
        const testKey = '__axios_cache_test__';
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
        
        // Use sessionStorage with a prefix to avoid collisions
        return buildWebStorage(sessionStorage, 'axios-cache:');
      } catch (error) {
        console.warn('[API CACHE] sessionStorage not available, falling back to memory storage:', error);
        return buildMemoryStorage();
      }
    
    case 'memory':
    default:
      return buildMemoryStorage();
  }
};

// Setup axios-cache-interceptor with ETag support built-in
const api = setupCache(baseApi, {
  ttl: 60 * 60 * 1000, // 1 hour cache TTL
  storage: createStorage() || buildMemoryStorage(), // Ensure we always have a storage
  methods: ['get'], // Only cache GET requests
  etag: true, // Enable ETag support (built into axios-cache-interceptor)
  modifiedSince: true, // Enable If-Modified-Since support
  cachePredicate: {
    statusCheck: (status) => status >= 200 && status < 300,
  },
  debug: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Request interceptor for authentication and cache exclusion
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Check if this request should be excluded from caching
    const requestUrl = config.url || '';
    const fullPath = requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`;
    const isExcluded = EXCLUDED_CACHE_PATHS.some((path) => fullPath.startsWith(path));
    
    if (isExcluded) {
      console.log('Excluding from cache:', fullPath);
      config.cache = false;
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API INTERCEPTOR] Response received:', {
      url: response.config.url,
      status: response.status,
      method: response.config.method,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.log('[API ERROR] Error received:', error);
    console.log('[API ERROR] Error response:', error.response);
    
    // Standard 401 handling
    if (error.response?.status === 401) {
      authService.logout();
      toast.error('Session expired or invalid. Please log in again.');
    }

    return Promise.reject(error);
  },
);

// Helper function to clear the entire cache
export const clearApiCache = () => {
  console.log('[CACHE] Clearing all API caches.');
  if (api.storage) {
    api.storage.clear();
  }
};

// Helper function to invalidate specific cache entries
export const invalidateCacheEntry = (urlPattern: string | RegExp) => {
  console.log('[CACHE] Invalidating cache entries matching pattern:', urlPattern);
  if (api.storage && typeof api.storage !== 'boolean') {
    // Get all cache keys and remove matching ones
    const keys = (api.storage as any).getKeys ? (api.storage as any).getKeys() : [];
    keys.forEach((key: string) => {
      const matches = typeof urlPattern === 'string'
        ? key.includes(urlPattern)
        : urlPattern.test(key);
      if (matches && api.storage && typeof api.storage !== 'boolean') {
        (api.storage as any).remove(key);
      }
    });
  }
};

// Helper function to get cache storage info
export const getCacheInfo = () => {
  const storageType = API_CACHING_ENABLED ? CACHE_STORAGE_TYPE : 'disabled';
  const storageAvailable = api.storage && typeof api.storage !== 'boolean';
  
  return {
    enabled: API_CACHING_ENABLED,
    storageType,
    storageAvailable,
    persistent: storageType === 'localStorage',
    fifoInfo: CACHE_STORAGE_TYPE === 'localStorage' ? FIFO_MANAGER.getStorageInfo() : null
  };
};

// Helper function to manually clear localStorage cache (for cleanup purposes)
export const clearLocalStorageCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('axios-cache:'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
    console.log(`[CACHE] Cleared ${cacheKeys.length} localStorage cache entries.`);
  } catch (error) {
    console.warn('[CACHE] Failed to clear localStorage cache:', error);
  }
};

// Export FIFO storage manager for external access
export { FIFO_MANAGER as fifoStorage };

export default api;