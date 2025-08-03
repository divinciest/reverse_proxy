// Define types for the admin interface
import {
  FeedSource,
  Tag,
  TagCategory,
  User,
  Person,
  TagNetworkData,
  PaginationInfo,
  BackendPaginationInfo,
  ReactSelectOption,
  CompanySource,
  AuthorSource,
  TopicSource,
  Topic,
  Firm,
} from '@/types/shared';

// Re-export all types for backward compatibility
export type {
  FeedSource,
  Tag,
  TagCategory,
  User,
  Person,
  TagNetworkData,
  PaginationInfo,
  BackendPaginationInfo,
  ReactSelectOption,
  CompanySource,
  AuthorSource,
  TopicSource,
  Topic,
  Firm,
};

export interface Tag {
  _id: string;
  tag_name: string;
  aliases: string[];
  category: TagCategory;
  parentTag?: string | null;
  childTags?: string[];
  createdAt: string;
  lastModified: string;
  trendable: boolean;
  trending?: boolean;
  explorable: boolean;
  humanReviewed: boolean;
  finance_approved: boolean;
  alias_match_eligible?: boolean;
  contents_count: number;
  visit_count?: number;
  event_count_30d?: number;
  source_icons?: string[];
  wallpaper?: string | null; // URL to wallpaper image
}
