// Centralized type definitions to eliminate duplicated interfaces

// Content interface - consolidated from multiple files
export interface Content {
  _id: string;
  id?: string;
  title: string;
  source: string;
  sourceUrl?: string;
  category?: string;
  summary: string;
  publishDate?: string;
  date: string;
  url?: string;
  sentiment?: 'bullish' | 'neutral' | 'bearish';
  leftCoverage?: number;
  rightCoverage?: number;
  centerCoverage?: number;
  sourceCount?: number;
  featuredImage?: string;
  topics?: string[];
  tags: string[];
  hoursAgo: number;
  author: { name: string; image: string | null };
  sourceLogo: string;
  sourceColor: string;
  companies: any[];
  trend_score?: number;
  trendingTags?: string[];
  financeApprovedTags?: string[];
  countryMentions?: Record<string, number>;
  body?: string;
  topic?: string;
  aggregatorUrl?: string;
  imageUrl?: string;
  createdAt?: string;
}

// FeedSource interface - consolidated from multiple files
export interface FeedSource {
  _id: string;
  name: string;
  domain: string;
  urls: string[];
  link: string;
  favicon: string;
  color: string;
  enabled: boolean;
  count: number;
  logo?: string | null;
  selected?: boolean;
  url?: string;
  lastFetched?: string;
  createdAt?: string;
}

// Person interface - consolidated from multiple files
export interface Person {
  _id: string;
  personName: string;
  createdAt?: string;
  lastModified?: string;
}

// User interface - consolidated from multiple files
export interface User {
  _id: string;
  email: string;
  username?: string;
  role: 'admin' | 'editor' | 'viewer' | 'user';
  profilePicture?: string;
  bio?: string;
  createdAt?: string;
}

// TagNetworkData interface - consolidated from multiple files
export interface TagNetworkData {
  nodes: Array<{
    id: string;
    label: string;
    value?: number;
    title?: string;
    group?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
    title?: string;
    arrows?: string;
    smooth?: {
      enabled: boolean;
      type: string;
      forceDirection?: string | boolean;
      roundness: number;
    };
  }>;
}

// CountryHeatmapData interface - consolidated from multiple files
export interface CountryHeatmapData {
  country: string;
  value: number;
  contents: number;
  tags: string[];
}

// WorldHeatmapResponse interface - consolidated from multiple files
export interface WorldHeatmapResponse {
  data: CountryHeatmapData[];
  total_contents: number;
  total_countries: number;
}

// State interface - consolidated from multiple files
export interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// LinkToAdd interface - consolidated from multiple files
export interface LinkToAdd {
  tag_name: string;
  category: string;
  aliases: string[];
  parentTag?: string;
  childTags?: string[];
}

// CompanyMetadata interface
export interface CompanyMetadata {
  _id: string;
  name: string;
  domain: string;
  aliases: string[];
  favicon: string;
  color: string;
  enabled: boolean;
  content_count?: number;
  createdAt?: string;
  is_firm?: boolean;
}

// FeedInfo interface
export interface FeedInfo {
  title: string;
  url: string;
  link: string;
  favicon: string;
  color: string;
  error?: string;
}

// UserProfile interface
export interface UserProfile {
  _id: string;
  email: string;
  username?: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  bio?: string;
  createdAt?: string;
}

// Source interface
export interface Source {
  id: string;
  name: string;
  url: string;
  category: string;
  logoUrl?: string;
}

// Tag interface
export interface Tag {
  _id: string;
  tag_name: string;
  aliases: string[];
  category: string;
  parentTag: string | null;
  childTags: string[];
  createdAt: string;
  count: number;
  lastModified: string;
  trendable?: boolean;
  trending?: boolean;
  explorable?: boolean;
  humanReviewed?: boolean;
  finance_approved: boolean;
  alias_match_eligible?: boolean;
  contents_count: number;
  visit_count?: number;
  event_count_30d?: number;
  source_icons?: string[];
  wallpaper?: string | null;
}

// TagCategory type
export type TagCategory = string;

// Pagination interfaces
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalContents?: number;
  totalBackups?: number;
  totalTasks?: number;
  totalItems?: number;
  limit: number;
  backupsPerPage?: number;
  tasksPerPage?: number;
}

export interface BackendPaginationInfo {
  currentPage: number;
  current_page?: number;
  totalPages: number;
  total_pages?: number;
  totalItems?: number;
  total_backups?: number;
  total_tasks?: number;
  limit: number;
  backups_per_page?: number;
  tasks_per_page?: number;
}

// UI utility types
export interface ReactSelectOption {
  value: string;
  label: string;
}

// CompanySource interface
export interface CompanySource {
  id: string;
  name: string;
  logo: string | null;
  count: number;
  selected: boolean;
  url: string;
  enabled?: boolean;
  is_firm: boolean;
}

// AuthorSource interface
export interface AuthorSource {
  _id: string;
  name: string;
  avatar: string;
  bio: string;
  contents: number;
  verified: boolean;
}

// TopicSource interface
export interface TopicSource {
  _id: string;
  name: string;
  contents: number;
  trending: boolean;
}

// Topic interface
export interface Topic {
  name: string;
  count: number;
  selected: boolean;
}

// Firm interface
export interface Firm {
  _id: string;
  firmName: string;
  createdAt?: string;
  lastModified?: string;
}
