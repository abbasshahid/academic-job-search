export type RoleType =
  | 'phd'
  | 'postdoc'
  | 'professor'
  | 'lecturer'
  | 'researcher'
  | 'assistant'
  | 'faculty'
  | 'other';

export interface SourceMetadata {
  url: string;
  institution: string;
  countryName: string;
  countryCode: string;
  platform: string;
  tags: string[];
}

export interface Job {
  id: string;
  title: string;
  url: string;
  source: string;
  normalizedTitle: string;
  searchableText: string;
  keywordTokens: string[];
  roleTypes: RoleType[];
  sourceMeta: SourceMetadata;
  department: string | null;
  location: string | null;
  employmentType: string | null;
  deadline: string | null;
  scrapedAt: string | null;
  discoveredAt: string | null;
}

export interface JobStats {
  generatedAt: string;
  jobCount: number;
  sourceCount: number;
}

export interface PrebuiltJobPayload {
  generatedAt: string;
  jobs: Job[];
  sources: SourceMetadata[];
  stats: JobStats;
}

export interface SavedSearch {
  id: string;
  name: string;
  keywords: string;
  matchMode: 'any' | 'all';
  country: string;
  institution: string;
  roleTypes: RoleType[];
  sortBy: SearchSort;
  onlyFavorites: boolean;
  onlyNew: boolean;
  onlyWithDeadline: boolean;
}

export type SearchSort =
  | 'relevance'
  | 'deadline-asc'
  | 'deadline-desc'
  | 'title-asc'
  | 'country-asc'
  | 'institution-asc'
  | 'recent';
