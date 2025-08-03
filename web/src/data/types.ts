import { Content } from '@/types/shared';

export interface Source {
  id: string;
  name: string;
  url: string;
  category: string;
  logoUrl?: string;
}

// Re-export Content for backward compatibility
export type { Content };
