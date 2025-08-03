import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { toast } from 'sonner';
import {
  AlertCircle, FileText, Loader2, ChevronLeft, ChevronRight, Search, Filter, Inspect, Tags, ChevronDown,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import TabContent from '@/components/admin/TabContent';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { ContentCard } from '@/components/admin/cards';
import ContentListView from '@/components/admin/contents/ContentListView';
import api from '@/utils/api';
import { Label } from '@/components/ui/label';
import ContentInspectModal from '@/components/admin/contents/ContentInspectModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FeedSource, CompanyMetadata } from '@/types/shared';
import { Tag, PaginationInfo } from '@/types/admin';
import { Content } from '@/data/types';

// This is a temporary interface to match the backend response for contents
// before they are transformed into the main `Content` type from feedService.
interface BackendContent {
  _id: string;
  title: string;
  source: string;
  date: string;
  createdAt?: string;
  sourceUrl?: string;
  tags?: string[];
  companies?: string[];
  aggregatorUrl?: string;
  imageUrl?: string;
  featuredImage?: string;
  author?: { name: string; image?: string };
  summary?: string;
  sourceLogo?: string;
  sourceColor?: string;
  hoursAgo?: number;
}

interface ApiResponse {
  contents: BackendContent[];
  pagination: PaginationInfo;
}

// Define Sort Type
type ContentSortType =
  'date-desc' | 'date-asc' |
  'createdAt-desc' | 'createdAt-asc' | // New types for crawling date
  'title-az' | 'title-za' |
  'source-az' | 'source-za';

// --- Helper Function to Group Contents by Source ---
const groupContentsBySource = (contents: Content[]): Record<string, Content[]> => contents.reduce((acc, content) => {
  const sourceKey = content.source || 'Unknown Source'; // Group contents with no source
  if (!acc[sourceKey]) {
    acc[sourceKey] = [];
  }
  acc[sourceKey].push(content);
  return acc;
}, {} as Record<string, Content[]>);
// --- End Helper Function ---

// +++ NEW: Helper Function to Group Contents by Tag +++
const groupContentsByTag = (contents: Content[]): Record<string, Content[]> => {
  const grouped: Record<string, Content[]> = {};
  const untaggedKey = 'Untagged'; // Key for contents with no tags

  contents.forEach((content) => {
    const { tags } = content;
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        // Avoid adding the same content multiple times to the same tag group if duplicates exist in content.tags
        if (!grouped[tag].some((a) => a._id === content._id)) {
          grouped[tag].push(content);
        }
      });
    } else {
      // Handle untagged contents
      if (!grouped[untaggedKey]) {
        grouped[untaggedKey] = [];
      }
      grouped[untaggedKey].push(content);
    }
  });

  // Optional: Sort tags alphabetically, keeping 'Untagged' potentially last or first
  const sortedGrouped: Record<string, Content[]> = {};
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === untaggedKey) return 1; // Push Untagged to the end
    if (b === untaggedKey) return -1;
    return a.localeCompare(b); // Sort other tags alphabetically
  });

  sortedKeys.forEach((key) => {
    sortedGrouped[key] = grouped[key];
  });

  return sortedGrouped; // Return sorted groups
};
// +++ End NEW Helper Function +++

export function AdminContentsTab() {
  const [allContents, setAllContents] = useState<Content[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [sortOrder, setSortOrder] = useState<ContentSortType>('date-desc');
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list');
  const contentsPerPage = 20;

  // --- State for Source Filtering ---
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  // --- End State for Source Filtering ---

  // --- NEW: State for Tag Filtering ---
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  // --- END NEW: State for Tag Filtering ---

  // --- ADDED: State for Content Inspection Modal ---
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedContentForInspect, setSelectedContentForInspect] = useState<Content | null>(null);
  // --- END ADDED: State for Content Inspection Modal ---

  // --- BEGIN ADDED: State for all available feeds for filtering ---
  const [allAvailableFeeds, setAllAvailableFeeds] = useState<FeedSource[]>([]);
  const [isLoadingAllFeeds, setIsLoadingAllFeeds] = useState<boolean>(true);
  // --- END ADDED: State for all available feeds for filtering ---

  // +++ NEW: State for grouping method +++
  const [groupBy, setGroupBy] = useState<'source' | 'tag'>('source');
  // +++ End NEW State +++

  // --- NEW: State for all available tags for filtering ---
  const [allAvailableTags, setAllAvailableTags] = useState<Tag[]>([]);
  const [isLoadingAllTags, setIsLoadingAllTags] = useState<boolean>(true);
  // --- END NEW: State for all available tags for filtering ---

  // --- BEGIN ADDED: State for controlled source filter dropdown ---
  const [isSourceFilterOpen, setIsSourceFilterOpen] = useState(false);
  const [tempSelectedSources, setTempSelectedSources] = useState<Set<string>>(new Set());
  // --- END ADDED: State for controlled source filter dropdown ---

  // --- NEW: State for controlled tag filter dropdown ---
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [tempSelectedTags, setTempSelectedTags] = useState<Set<string>>(new Set());
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  // --- END NEW: State for controlled tag filter dropdown ---

  const fetchContents = useCallback(async (page: number, currentSortOrder: ContentSortType, currentSearchTerm: string, currentSelectedSources: Set<string>, currentSelectedTags: Set<string>) => {
    setLoading(true);
    setError(null);
    try {
      let sortByParam = 'date';
      let sortOrderParam = 'desc';

      const [fieldPart, orderPart] = currentSortOrder.split('-');

      if (fieldPart === 'date') {
        sortByParam = 'date';
        sortOrderParam = orderPart === 'asc' ? 'asc' : 'desc';
      } else if (fieldPart === 'title') {
        sortByParam = 'title'; // Assuming backend will support 'title'
        sortOrderParam = orderPart === 'az' ? 'asc' : 'desc';
      } else if (fieldPart === 'source') {
        sortByParam = 'source'; // Assuming backend will support 'source'
        sortOrderParam = orderPart === 'az' ? 'asc' : 'desc';
      } else if (fieldPart === 'createdAt') {
        sortByParam = 'createdAt';
        sortOrderParam = orderPart === 'asc' ? 'asc' : 'desc';
      }
      // Add more mappings if other sort types are fully supported by backend

      const params: any = {
        page,
        limit: contentsPerPage,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      };

      if (currentSearchTerm) {
        params.search = currentSearchTerm;
      }

      if (currentSelectedSources.size > 0) {
        params.sources = Array.from(currentSelectedSources).join(',');
      }

      if (currentSelectedTags.size > 0) {
        params.tags = Array.from(currentSelectedTags).join(',');
      }

      const response = await api.get<ApiResponse>('/admin/contents', { params });
      const { contents, pagination: paginationData } = response.data;

      // Debug: Log the first content to see what fields are available
      if (contents.length > 0) {
        console.log('First content from backend:', contents[0]);
        console.log('Available fields:', Object.keys(contents[0]));
      }

      // Transform BackendContent to Content type
      const transformedContents: Content[] = contents.map((backendContent) => ({
        _id: backendContent._id,
        id: backendContent._id, // Add id field for compatibility
        title: backendContent.title,
        source: backendContent.source,
        date: backendContent.date,
        createdAt: backendContent.createdAt || backendContent.date,
        sourceUrl: backendContent.sourceUrl || '',
        url: backendContent.sourceUrl || '', // Add url field for compatibility
        tags: backendContent.tags || [],
        companies: backendContent.companies || [],
        aggregatorUrl: backendContent.aggregatorUrl || '',
        imageUrl: backendContent.featuredImage || backendContent.imageUrl || '', // Use featuredImage first, fallback to imageUrl
        featuredImage: backendContent.featuredImage || backendContent.imageUrl || '', // Use featuredImage first, fallback to imageUrl
        author: {
          name: backendContent.author?.name || '',
          image: backendContent.author?.image || null, // Ensure image is null if not provided
        },
        summary: backendContent.summary || '',
        sourceLogo: backendContent.sourceLogo || '',
        sourceColor: backendContent.sourceColor || '',
        hoursAgo: backendContent.hoursAgo || 0,
        // Add missing required fields with defaults
        category: '',
        sentiment: 'neutral',
        trendingTags: [],
        financeApprovedTags: [],
        countryMentions: {},
      }));

      setAllContents(transformedContents);
      setPagination(paginationData);
    } catch (err: any) {
      console.error('Error fetching contents:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load contents';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contentsPerPage]);

  // Debounce search term
  // Fetch contents when dependencies change
  useEffect(() => {
    fetchContents(currentPage, sortOrder, searchTerm, selectedSources, selectedTags);
  }, [fetchContents, currentPage, sortOrder, searchTerm, selectedSources, selectedTags]);

  // Fetch all feed sources for filtering
  useEffect(() => {
    const fetchAllFeedSourcesForFilter = async () => {
      setIsLoadingAllFeeds(true);
      try {
        const response = await api.get<{ feeds: FeedSource[] }>('/admin/feeds');
        setAllAvailableFeeds(response.data.feeds || []);
      } catch (err: any) {
        console.error('Error fetching feed sources for filter:', err);
        toast.error('Failed to load feed sources for filtering');
      } finally {
        setIsLoadingAllFeeds(false);
      }
    };

    fetchAllFeedSourcesForFilter();
  }, []);

  // Fetch all tags for filtering
  useEffect(() => {
    const fetchAllTagsForFilter = async () => {
      setIsLoadingAllTags(true);
      try {
        const response = await api.get<{ tags: Tag[] }>('/admin/tags');
        setAllAvailableTags(response.data.tags || []);
      } catch (err: any) {
        console.error('Error fetching tags for filter:', err);
        toast.error('Failed to load tags for filtering');
      } finally {
        setIsLoadingAllTags(false);
      }
    };

    fetchAllTagsForFilter();
  }, []);

  // Filter available tags based on search term
  const filteredAvailableTags = useMemo(() => {
    if (!tagSearchTerm) return allAvailableTags;
    return allAvailableTags.filter((tag) => tag.tag_name.toLowerCase().includes(tagSearchTerm.toLowerCase()));
  }, [allAvailableTags, tagSearchTerm]);

  // Filter and sort contents
  const filteredSortedContents = useMemo(() => allContents, [allContents]);

  // Group contents based on selected method
  const groupedContents = useMemo(() => (groupBy === 'tag' ? groupContentsByTag(filteredSortedContents) : groupContentsBySource(filteredSortedContents)), [filteredSortedContents, groupBy]);

  // Sort options
  const sortOptions = [
    { value: 'date-desc', label: 'Date (Newest)' },
    { value: 'date-asc', label: 'Date (Oldest)' },
    { value: 'createdAt-desc', label: 'Crawled (Newest)' },
    { value: 'createdAt-asc', label: 'Crawled (Oldest)' },
    { value: 'title-az', label: 'Title (A-Z)' },
    { value: 'title-za', label: 'Title (Z-A)' },
    { value: 'source-az', label: 'Source (A-Z)' },
    { value: 'source-za', label: 'Source (Z-A)' },
  ];

  // Event handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleInspectContentClick = (content: Content) => {
    setSelectedContentForInspect(content);
    setIsInspectModalOpen(true);
  };

  const handleSourceFilterOpenChange = (open: boolean) => {
    setIsSourceFilterOpen(open);
    if (open) {
      setTempSelectedSources(new Set(selectedSources));
    }
  };

  const handleApplySourceFilter = () => {
    setSelectedSources(new Set(tempSelectedSources));
    setIsSourceFilterOpen(false);
  };

  const handleCancelSourceFilter = () => {
    setTempSelectedSources(new Set(selectedSources));
    setIsSourceFilterOpen(false);
  };

  const handleTagFilterOpenChange = (open: boolean) => {
    setIsTagFilterOpen(open);
    if (open) {
      setTempSelectedTags(new Set(selectedTags));
    }
  };

  const handleApplyTagFilter = () => {
    setSelectedTags(new Set(tempSelectedTags));
    setIsTagFilterOpen(false);
  };

  const handleCancelTagFilter = () => {
    setTempSelectedTags(new Set(selectedTags));
    setIsTagFilterOpen(false);
  };

  return (
    <TabContent
      title="Manage Contents"
      description="Browse, search, and inspect contents from all feeds."
      icon={<FileText className="h-5 w-5 text-primary" />}
    >
      {/* Grouping Method Selection */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm">
        <h3 className="text-lg font-display font-bold text-foreground mb-3">Grouping Method</h3>
        <RadioGroup value={groupBy} onValueChange={(value) => setGroupBy(value as 'source' | 'tag')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="source" id="group-source" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
            <Label htmlFor="group-source" className="text-sm text-foreground flex items-center">
              <FileText className="h-3 w-3 mr-1 text-primary" />
              {' '}
              By Source
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tag" id="group-tag" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
            <Label htmlFor="group-tag" className="text-sm text-foreground flex items-center">
              <Tags className="h-3 w-3 mr-1 text-primary" />
              {' '}
              By Tag
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm space-y-4">
        <h3 className="text-lg font-display font-bold text-foreground">Filters & Search</h3>

        {/* Source Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="source-filter-dropdown-trigger" className="text-sm font-medium text-foreground">Filter by Source:</Label>
          <DropdownMenu open={isSourceFilterOpen} onOpenChange={handleSourceFilterOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" id="source-filter-dropdown-trigger" className="w-[200px] justify-between border-border bg-background hover:bg-muted">
                {selectedSources.size === 0 ? 'All Sources'
                  : selectedSources.size === 1 ? `${Array.from(selectedSources)[0]}`
                    : `${selectedSources.size} Sources Selected`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[270px]" align="start">
              <DropdownMenuLabel>Select Sources</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {!isLoadingAllFeeds && allAvailableFeeds.length > 0 && (
                <div className="flex justify-between px-2 py-1.5 text-sm">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline"
                    onClick={() => setTempSelectedSources(new Set(allAvailableFeeds.map((feed) => feed.name)))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline"
                    onClick={() => setTempSelectedSources(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              )}

              <div className="max-h-[200px] overflow-y-auto px-1 py-1">
                {isLoadingAllFeeds ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading sources...</div>
                ) : allAvailableFeeds.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No sources available</div>
                ) : (
                  allAvailableFeeds.sort((a, b) => a.name.localeCompare(b.name)).map((feed) => (
                    <DropdownMenuCheckboxItem
                      key={feed._id}
                      checked={tempSelectedSources.has(feed.name)}
                      onCheckedChange={(checked) => {
                        const newTempSelected = new Set(tempSelectedSources);
                        if (checked) {
                          newTempSelected.add(feed.name);
                        } else {
                          newTempSelected.delete(feed.name);
                        }
                        setTempSelectedSources(newTempSelected);
                      }}
                      onSelect={(e) => e.preventDefault()} // Prevent closing
                    >
                      {feed.name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex justify-end gap-2 p-2">
                <Button variant="ghost" size="sm" onClick={handleCancelSourceFilter} className="border-border bg-background hover:bg-muted">Cancel</Button>
                <Button variant="default" size="sm" onClick={handleApplySourceFilter} className="bg-primary hover:bg-primary/90 text-primary-foreground">Apply</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="tag-filter-dropdown-trigger" className="text-sm font-medium text-foreground">Filter by Tag:</Label>
          <DropdownMenu open={isTagFilterOpen} onOpenChange={handleTagFilterOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" id="tag-filter-dropdown-trigger" className="w-[200px] justify-between border-border bg-background hover:bg-muted">
                {selectedTags.size === 0 ? 'All Tags'
                  : selectedTags.size === 1 ? `${Array.from(selectedTags)[0]}`
                    : `${selectedTags.size} Tags Selected`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[270px]" align="start">
              <DropdownMenuLabel>Select Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Search Input for Tags */}
              <div className="px-2 py-1.5">
                <Input
                  placeholder="Search tags..."
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                  className="w-full border-border bg-background"
                />
              </div>

              {!isLoadingAllTags && allAvailableTags.length > 0 && (
                <div className="flex justify-between px-2 py-1.5 text-sm">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline"
                    onClick={() => setTempSelectedTags(new Set(allAvailableTags.map((tag) => tag.tag_name)))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline"
                    onClick={() => setTempSelectedTags(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              )}

              <div className="max-h-[200px] overflow-y-auto px-1 py-1">
                {isLoadingAllTags ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading tags...</div>
                ) : allAvailableTags.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags available</div>
                ) : (
                  filteredAvailableTags.sort((a, b) => a.tag_name.localeCompare(b.tag_name)).map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag._id}
                      checked={tempSelectedTags.has(tag.tag_name)}
                      onCheckedChange={(checked) => {
                        const newTempSelected = new Set(tempSelectedTags);
                        if (checked) {
                          newTempSelected.add(tag.tag_name);
                        } else {
                          newTempSelected.delete(tag.tag_name);
                        }
                        setTempSelectedTags(newTempSelected);
                      }}
                      onSelect={(e) => e.preventDefault()} // Prevent closing
                    >
                      {tag.tag_name}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex justify-end gap-2 p-2">
                <Button variant="ghost" size="sm" onClick={handleCancelTagFilter} className="border-border bg-background hover:bg-muted">Cancel</Button>
                <Button variant="default" size="sm" onClick={handleApplyTagFilter} className="bg-primary hover:bg-primary/90 text-primary-foreground">Apply</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Contents</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading contents...</span>
        </div>
      )}

      {/* Use ContentList for search, sort, view switching */}
      {!loading && !error && (
      <ContentList<Content>
        title={`${groupBy === 'tag' ? 'Tags' : 'Sources'} (${Object.keys(groupedContents).length} groups, ${filteredSortedContents.length} contents shown)`}
        icon={groupBy === 'tag' ? <Tags className="h-4 w-4 mr-2 text-primary" /> : <FileText className="h-4 w-4 mr-2 text-primary" />}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        debounceDelay={500}
        sortValue={sortOrder}
        onSortChange={(value) => setSortOrder(value as ContentSortType)}
        sortOptions={sortOptions}
        viewType={activeView}
        onViewChange={setActiveView}
        renderGridView={() => (
          <div className="space-y-6">
            {Object.entries(groupedContents).map(([groupKey, contentsInGroup]) => (
              <div key={groupKey}>
                <h2 className="text-lg font-display font-bold mb-3 border-b border-border pb-2 capitalize text-foreground">
                  {groupKey}
                  {' '}
                  (
                  {contentsInGroup.length}
                  )
                </h2>
                <ContentGrid
                  items={contentsInGroup}
                  renderCard={(content) => (
                    <ContentCard
                      content={content}
                      onInspect={handleInspectContentClick}
                    />
                  )}
                  gridCols={{ sm: 1, md: 2, lg: 3 }}
                  gap="gap-3"
                  emptyMessage="No contents to display."
                  getItemKey={(content) => content._id}
                />
              </div>
            ))}
          </div>
        )}
        renderListView={() => (
          <div className="space-y-6">
            {Object.entries(groupedContents).map(([groupKey, contentsInGroup]) => (
              <div key={groupKey}>
                <h2 className="text-lg font-display font-bold mb-3 border-b border-border pb-2 capitalize text-foreground">
                  {groupKey}
                  {' '}
                  (
                  {contentsInGroup.length}
                  )
                </h2>
                <ContentListView
                  contents={contentsInGroup}
                  onInspect={handleInspectContentClick}
                />
              </div>
            ))}
          </div>
        )}
        noItemsMessage={
              searchTerm || selectedSources.size > 0 || (allAvailableFeeds.length > 0 && selectedSources.size !== allAvailableFeeds.length)
                ? 'No contents match your filters.'
                : 'No contents found on this page.'
            }
      />
      )}

      {/* Pagination Controls - Render outside ContentList if it applies to backend pages */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-card border border-border rounded-lg shadow-sm">
          <span className="text-sm text-muted-foreground">
            Page
            {' '}
            {pagination.currentPage}
            {' '}
            of
            {' '}
            {pagination.totalPages}
            {' '}
            (
            {pagination.totalContents}
            {' '}
            total contents)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pagination.currentPage === 1 || loading}
              className="border-border bg-background hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="border-border bg-background hover:bg-muted"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Inspection Modal */}
      <ContentInspectModal
        content={selectedContentForInspect}
        isOpen={isInspectModalOpen}
        onClose={() => setIsInspectModalOpen(false)}
      />

    </TabContent>
  );
}
