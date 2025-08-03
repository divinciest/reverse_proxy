import React, {
  useState, useMemo, useEffect, useCallback,
} from 'react';
import { toast } from 'sonner';
import {
  Tag as TagIcon, Hash, TrendingUp, Link as LinkIcon,
} from 'lucide-react';
import { Tag, TagCategory } from '@/types/admin';
import TabContent from '@/components/admin/TabContent';
import AddTagForm from '@/components/admin/tags/AddTagForm';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { TagCard } from '@/components/admin/cards';
import TagListView from '@/components/admin/tags/TagListView';
import EditTagDialog from '@/components/admin/tags/EditTagDialog';
import TagNetworkGraphDialog from '@/components/admin/tags/TagNetworkGraphDialog';
import {
  tagService, AddTagPayload, UpdateTagPayload, AllTagsResponse,
} from '@/utils/services/tagService';
import { configService } from '@/utils/services/configService';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/common/SearchInput';
import tagLinksService, { TagLink } from '@/utils/services/tagLinksService';
import tagLinksTypesService, { TagLinkType as AdminTagLinkType } from '@/utils/services/tagLinksTypesService';

const TAG_PAGE_SIZE = 50;
const BACKEND_SEARCH_PAGE_SIZE = 50;

const groupTagsByCategory = (tags: Tag[], categories: TagCategory[]): Record<TagCategory, Tag[]> => {
  const grouped: Record<TagCategory, Tag[]> = {} as Record<TagCategory, Tag[]>;
  categories.forEach((cat) => { grouped[cat] = []; });
  grouped.other_unlisted = [];

  tags.forEach((tag) => {
    const categoryKey = categories.includes(tag.category) ? tag.category : 'other_unlisted';
    if (!grouped[categoryKey]) {
      grouped[categoryKey] = [];
    }
    grouped[categoryKey].push(tag);
  });
  return grouped;
};

function AdminTopicsTab() {
  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // State for limited loading (non-search)
  const [tagLimit, setTagLimit] = useState<number>(TAG_PAGE_SIZE);
  const [allServerTagsFetched, setAllServerTagsFetched] = useState<boolean>(false);

  // --- State for Backend Search ---
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isBackendSearchActive, setIsBackendSearchActive] = useState<boolean>(false);
  const [currentBackendSearchQuery, setCurrentBackendSearchQuery] = useState<string>('');
  const [backendSearchTotalCount, setBackendSearchTotalCount] = useState<number>(0);
  // --- End Backend Search State ---

  // --- State for Allowed Categories ---
  const [allowedCategories, setAllowedCategories] = useState<TagCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  // --- End Category State ---

  // --- State for Tag Links and Link Types ---
  const [allTagLinks, setAllTagLinks] = useState<TagLink[]>([]);
  const [loadingTagLinks, setLoadingTagLinks] = useState(false);
  const [tagLinksError, setTagLinksError] = useState<string | null>(null);

  const [tagLinkTypes, setTagLinkTypes] = useState<AdminTagLinkType[]>([]);
  const [loadingTagLinkTypes, setLoadingTagLinkTypes] = useState(false);
  const [tagLinkTypesError, setTagLinkTypesError] = useState<string | null>(null);
  // --- End Tag Links State ---

  // UI state for views, search (input value), and sort
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [tagSearch, setTagSearch] = useState('');
  const [tagSort, setTagSort] = useState<'default' | 'az' | 'za' | 'contentsAsc' | 'contentsDesc'>('default');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  // --- State for Category Filtering ---
  const [selectedCategories, setSelectedCategories] = useState<Set<TagCategory>>(new Set());
  // --- End State for Category Filtering ---

  // --- State for Trending Filter ---
  const [trendingFilter, setTrendingFilter] = useState<'all' | 'trending' | 'not_trending'>('all');
  // --- End State for Trending Filter ---

  // --- State for Explorable Filter ---
  const [explorableFilter, setExplorableFilter] = useState<'all' | 'explorable' | 'not_explorable'>('all');
  // --- End State for Explorable Filter ---

  // --- State for Network Graph Dialog ---
  const [isNetworkGraphOpen, setIsNetworkGraphOpen] = useState(false);
  const [networkGraphTargetTag, setNetworkGraphTargetTag] = useState<string | null>(null);
  // --- End State for Network Graph Dialog ---

  // --- Fetch Allowed Categories ---
  const fetchAllowedCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const fetchedCategories = await configService.getAllowedTagCategories();
      setAllowedCategories(fetchedCategories);
      setSelectedCategories(new Set(fetchedCategories));
    } catch (err: any) {
      console.error('Error fetching allowed categories:', err);
      const errorMessage = err.message || 'Failed to load tag categories.';
      setCategoriesError(errorMessage);
      toast.error(errorMessage);
      setAllowedCategories([]);
      setSelectedCategories(new Set());
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // --- Fetch Tag Link Types ---
  const fetchTagLinkTypes = useCallback(async () => {
    setLoadingTagLinkTypes(true);
    setTagLinkTypesError(null);
    try {
      const fetchedTypes = await tagLinksTypesService.getAllLinkTypes();
      setTagLinkTypes(fetchedTypes || []);
    } catch (err: any) {
      console.error('Error fetching tag link types:', err);
      const errorMessage = err.message || 'Failed to load tag link types.';
      setTagLinkTypesError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingTagLinkTypes(false);
    }
  }, []);

  // --- Fetch All Tag Links ---
  const fetchAllTagLinks = useCallback(async () => {
    setLoadingTagLinks(true);
    setTagLinksError(null);
    try {
      const response = await tagLinksService.getAllTagLinks();
      setAllTagLinks(response.tag_links || []);
    } catch (err: any) {
      console.error('Error fetching all tag links:', err);
      const errorMessage = err.message || 'Failed to load tag links.';
      setTagLinksError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingTagLinks(false);
    }
  }, []);

  // Load tags for non-search scenarios (initial, load next, load all)
  const fetchTags = useCallback(async (loadAll = false) => {
    setLoadingTags(true);
    setTagsError(null);
    setIsBackendSearchActive(false);
    setCurrentBackendSearchQuery('');

    try {
      if (loadAll) {
        const response: AllTagsResponse = await tagService.getAllTagsAdmin({});
        // Cast the tags to ensure they have the required properties
        const typedTags = response.tags.map((tag) => ({
          ...tag,
          trendable: tag.trendable ?? false,
          explorable: tag.explorable ?? false,
          humanReviewed: tag.humanReviewed ?? false,
          finance_approved: tag.finance_approved ?? false,
          contents_count: tag.contents_count ?? 0,
        })) as Tag[];
        setTags(typedTags);
        setAllServerTagsFetched(true);
        setTagLimit(response.tags.length);
      } else {
        const fetchedLimitedTags = await tagService.getAllTagsLimited(tagLimit);
        // Cast the tags to ensure they have the required properties
        const typedTags = fetchedLimitedTags.map((tag) => ({
          ...tag,
          trendable: tag.trendable ?? false,
          explorable: tag.explorable ?? false,
          humanReviewed: tag.humanReviewed ?? false,
          finance_approved: tag.finance_approved ?? false,
          contents_count: tag.contents_count ?? 0,
        })) as Tag[];
        setTags(typedTags);
        setAllServerTagsFetched(false);
      }
    } catch (err: any) {
      console.error('Error fetching non-search tags:', err);
      const errorMessage = err.message || 'Failed to load tags.';
      setTagsError(errorMessage);
      toast.error(errorMessage);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  }, [tagLimit]);

  // Perform Backend Search
  const performBackendSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setIsBackendSearchActive(false);
      setCurrentBackendSearchQuery('');
      setBackendSearchTotalCount(0);
      fetchTags();
      return;
    }

    setLoadingTags(true);
    setTagsError(null);
    setIsBackendSearchActive(true);
    setCurrentBackendSearchQuery(trimmedQuery);

    try {
      const response = await tagService.getAllTagsAdmin({ search: trimmedQuery, limit: BACKEND_SEARCH_PAGE_SIZE });
      // Cast the tags to ensure they have the required properties
      const typedTags = response.tags.map((tag) => ({
        ...tag,
        trendable: tag.trendable ?? false,
        explorable: tag.explorable ?? false,
        humanReviewed: tag.humanReviewed ?? false,
        finance_approved: tag.finance_approved ?? false,
        contents_count: tag.contents_count ?? 0,
      })) as Tag[];
      setTags(typedTags);
      setBackendSearchTotalCount(response.total_count || 0);
    } catch (err: any) {
      console.error('Error performing backend search:', err);
      const errorMessage = err.message || 'Failed to search tags.';
      setTagsError(errorMessage);
      toast.error(errorMessage);
      setTags([]);
      setBackendSearchTotalCount(0);
    } finally {
      setLoadingTags(false);
    }
  }, [fetchTags]);

  // Handle search input changes with debouncing
  useEffect(() => {
    if (tagSearch.trim()) {
      performBackendSearch(tagSearch);
    } else {
      setCurrentBackendSearchQuery('');
      setIsBackendSearchActive(false);
      setBackendSearchTotalCount(0);
    }
  }, [tagSearch, performBackendSearch]);

  // Load initial data
  useEffect(() => {
    fetchAllowedCategories();
    fetchTagLinkTypes();
    fetchAllTagLinks();
    fetchTags();
  }, [fetchAllowedCategories, fetchTagLinkTypes, fetchAllTagLinks, fetchTags]);

  // Filter and sort tags
  const filteredSortedTags = useMemo(() => {
    let result = [...tags];

    // Apply category filter
    if (selectedCategories.size > 0 && selectedCategories.size < allowedCategories.length) {
      result = result.filter((tag) => selectedCategories.has(tag.category));
    }

    // Apply trending filter
    if (trendingFilter === 'trending') {
      result = result.filter((tag) => tag.trendable === true);
    } else if (trendingFilter === 'not_trending') {
      result = result.filter((tag) => tag.trendable === false);
    }

    // Apply explorable filter
    if (explorableFilter === 'explorable') {
      result = result.filter((tag) => tag.explorable === true);
    } else if (explorableFilter === 'not_explorable') {
      result = result.filter((tag) => tag.explorable === false);
    }

    // Apply sort
    switch (tagSort) {
      case 'az':
        result.sort((a, b) => a.tag_name.localeCompare(b.tag_name));
        break;
      case 'za':
        result.sort((a, b) => b.tag_name.localeCompare(a.tag_name));
        break;
      case 'contentsAsc':
        result.sort((a, b) => (a.contents_count || 0) - (b.contents_count || 0));
        break;
      case 'contentsDesc':
        result.sort((a, b) => (b.contents_count || 0) - (a.contents_count || 0));
        break;
      default:
        // Keep original order
        break;
    }

    return result;
  }, [tags, selectedCategories, allowedCategories.length, trendingFilter, explorableFilter, tagSort]);

  // Group filtered tags by category
  const groupedFilteredSortedTags = useMemo(() => groupTagsByCategory(filteredSortedTags, allowedCategories), [filteredSortedTags, allowedCategories]);

  // Get all tag names for autocomplete
  const alltag_names = useMemo(() => tags.map((tag) => tag.tag_name), [tags]);

  // Error display
  const displayError = tagsError || categoriesError || tagLinksError || tagLinkTypesError;

  // Loading state
  const isLoading = loadingTags || loadingCategories || loadingTagLinks || loadingTagLinkTypes;

  // Sort options
  const tagSortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'az', label: 'Name (A-Z)' },
    { value: 'za', label: 'Name (Z-A)' },
    { value: 'contentsAsc', label: 'Contents (Low to High)' },
    { value: 'contentsDesc', label: 'Contents (High to Low)' },
  ];

  // Event handlers
  const handleEditTag = (tag: Tag) => {
    setCurrentTag(tag);
    setEditDialogOpen(true);
  };

  const handleSaveTag = async (tagId: string, updates: UpdateTagPayload) => {
    try {
      await tagService.updateTag(tagId, updates);
      setTags((prev) => prev.map((tag) => (tag._id === tagId ? { ...tag, ...updates } : tag)));
      toast.success('Tag updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    }
  };

  const confirmDeleteTag = (tagId: string) => {
    const tag = tags.find((t) => t._id === tagId);
    setTagToDelete(tag || null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await tagService.deleteTag(tagToDelete._id);
      setTags((prev) => prev.filter((tag) => tag._id !== tagToDelete._id));
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    } finally {
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  const handleCategoryChange = (category: TagCategory, isChecked: boolean) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(category);
      } else {
        newSet.delete(category);
      }
      return newSet;
    });
  };

  const handleSelectAllCategories = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedCategories(new Set(allowedCategories));
    } else {
      setSelectedCategories(new Set());
    }
  };

  const handleTagSortChange = (value: string) => {
    if (value === 'default' || value === 'az' || value === 'za' || value === 'contentsAsc' || value === 'contentsDesc') {
      setTagSort(value as 'default' | 'az' | 'za' | 'contentsAsc' | 'contentsDesc');
    }
  };

  const handleAddLinkToTag = async (sourceTagName: string, targetTagName: string, relationship: string) => {
    try {
      await tagLinksService.addTagLink({ sourceTag: sourceTagName, targetTag: targetTagName, relationship });
      await fetchAllTagLinks();
      toast.success('Tag link created successfully');
    } catch (error) {
      console.error('Error creating tag link:', error);
      toast.error('Failed to create tag link');
    }
  };

  const handleDeleteExistingLink = async (linkId: string) => {
    try {
      await tagLinksService.deleteTagLink(linkId);
      setAllTagLinks((prev) => prev.filter((link) => link._id !== linkId));
      toast.success('Tag link deleted successfully');
    } catch (error) {
      console.error('Error deleting tag link:', error);
      toast.error('Failed to delete tag link');
    }
  };

  const handleLoadNextTags = () => {
    setTagLimit((prev) => prev + TAG_PAGE_SIZE);
  };

  const handleLoadAllTags = () => {
    fetchTags(true);
  };

  const handleViewNetwork = (tagName: string) => {
    setNetworkGraphTargetTag(tagName);
    setIsNetworkGraphOpen(true);
  };

  // Handle adding a new tag
  const handleAddTag = async (
    tagName: string,
    aliases: string[],
    category: TagCategory,
    trendable: boolean,
    explorable: boolean,
    humanReviewed: boolean,
    financeApproved: boolean,
    aliasMatchEligible: boolean,
    wallpaper: string | undefined,
    initialLinks: Array<{ targetTagName: string; relationship: string }>,
  ) => {
    try {
      const payload = {
        tag_name: tagName,
        aliases,
        category,
        trendable,
        explorable,
        humanReviewed,
        finance_approved: financeApproved,
        alias_match_eligible: aliasMatchEligible,
        wallpaper,
        initial_links: initialLinks,
      };
      await tagService.addTag(payload);
      await fetchTags(allServerTagsFetched);
      if (initialLinks.length > 0) {
        await fetchAllTagLinks();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  };

  return (
    <TabContent
      title="Manage Topics"
      description="Add, edit or remove topics that appear on the home page."
      icon={<TagIcon className="h-5 w-5 text-primary" />}
    >
      <AddTagForm
        onAddTag={handleAddTag}
        allTags={tags}
        tagLinkTypes={tagLinkTypes}
        allowedCategories={allowedCategories}
        defaultCategory={allowedCategories.length > 0 ? allowedCategories[0] : ''}
        alltag_names={alltag_names}
      />

      {/* Filters Section */}
      <div className="space-y-4 mb-6 p-4 bg-card border border-border rounded-lg shadow-sm">
        <h3 className="text-lg font-display font-bold text-foreground">Filters</h3>

        {/* Category Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Filter by Category:</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAllCategories(selectedCategories.size < allowedCategories.length)}
              className="text-xs px-2 py-1 h-auto border-border bg-background hover:bg-muted"
            >
              {selectedCategories.size === allowedCategories.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allowedCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.has(category)}
                  onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                  className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                />
                <Label htmlFor={`category-${category}`} className="text-sm text-foreground capitalize">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground block mb-2">Filter by Trending Status:</Label>
          <RadioGroup
            value={trendingFilter}
            onValueChange={(value) => setTrendingFilter(value as 'all' | 'trending' | 'not_trending')}
            className="flex flex-wrap gap-x-4 gap-y-2 items-center"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="trending-all" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="trending-all" className="text-sm text-foreground">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trending" id="trending-yes" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="trending-yes" className="text-sm text-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-primary" />
                {' '}
                Trending
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_trending" id="trending-no" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="trending-no" className="text-sm text-foreground">Not Trending</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Explorable Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground block mb-2">Filter by Explorable Status:</Label>
          <RadioGroup
            value={explorableFilter}
            onValueChange={(value) => setExplorableFilter(value as 'all' | 'explorable' | 'not_explorable')}
            className="flex flex-wrap gap-x-4 gap-y-2 items-center"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="explorable-all" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="explorable-all" className="text-sm text-foreground">All</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="explorable" id="explorable-yes" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="explorable-yes" className="text-sm text-foreground flex items-center">
                <Hash className="h-3 w-3 mr-1 text-primary" />
                {' '}
                Explorable
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="not_explorable" id="explorable-no" className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background" />
              <Label htmlFor="explorable-no" className="text-sm text-foreground">Not Explorable</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {displayError && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-lg mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{displayError}</span>
        </div>
      )}

      {/* Tag Loading Controls */}
      <div className="mb-6 p-4 border border-border rounded-lg bg-card text-card-foreground space-y-3 shadow-sm">
        <div className="text-sm text-muted-foreground">
          {isBackendSearchActive ? (
            currentBackendSearchQuery
              ? `Found ${backendSearchTotalCount} tags matching "${currentBackendSearchQuery}". Displaying ${tags.length}.`
              : `Backend search active, but no query. Displaying ${tags.length} tags.`
          ) : (
            `Showing ${tags.length} tags. ${!allServerTagsFetched ? `(Loaded up to ${tagLimit} of potentially more)` : `(All ${tags.length} server tags loaded)`}`
          )}
        </div>
        {!isBackendSearchActive && !allServerTagsFetched && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleLoadNextTags} disabled={loadingTags} className="border-border bg-background hover:bg-muted">
              {loadingTags ? 'Loading...' : `Load Next ${TAG_PAGE_SIZE}`}
            </Button>
            <Button variant="default" onClick={handleLoadAllTags} disabled={loadingTags} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {loadingTags ? 'Loading All...' : 'Load All Tags'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <ContentList
          title={`Current Tags (${filteredSortedTags.length})`}
                  searchValue={tagSearch}
        onSearchChange={setTagSearch}
        debounceDelay={500}
          searchPlaceholder="Search tags..."
          sortValue={tagSort}
          onSortChange={handleTagSortChange}
          sortOptions={tagSortOptions}
          viewType={activeView}
          onViewChange={setActiveView}
          renderGridView={() => (
            <div className="space-y-6">
              {Object.entries(groupedFilteredSortedTags).map(([category, categoryTags]) => {
                if (!categoryTags || categoryTags.length === 0) return null;
                const isUnlisted = category === 'other_unlisted';
                const categoryTitle = isUnlisted
                  ? `Unlisted Category (${categoryTags.length})`
                  : `${category} (${categoryTags.length})`;
                return (
                  <div key={category}>
                    <h2 className={`text-lg font-display font-bold mb-3 capitalize border-b border-border pb-2 ${
                      isUnlisted ? 'text-destructive' : 'text-foreground'
                    }`}
                    >
                      {categoryTitle}
                    </h2>
                    <ContentGrid
                      items={categoryTags}
                      renderCard={(tag) => (
                        <TagCard
                          tag={tag}
                          onDelete={confirmDeleteTag}
                          onEdit={handleEditTag}
                          onViewNetwork={handleViewNetwork}
                          allTags={tags}
                        />
                      )}
                      gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                      gap="gap-4"
                      emptyMessage="No tags found."
                      getItemKey={(tag) => tag._id}
                    />
                  </div>
                );
              })}
              {filteredSortedTags.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-8">
                {isBackendSearchActive && currentBackendSearchQuery
                  ? `No tags match your search for "${currentBackendSearchQuery}".`
                  : 'No tags match the current filters.'}
              </p>
              )}
            </div>
          )}
          renderListView={() => (
            <div className="space-y-6">
              {Object.entries(groupedFilteredSortedTags).map(([category, categoryTags]) => {
                if (!categoryTags || categoryTags.length === 0) return null;
                const isUnlisted = category === 'other_unlisted';
                const categoryTitle = isUnlisted
                  ? `Unlisted Category (${categoryTags.length})`
                  : `${category} (${categoryTags.length})`;
                return (
                  <div key={category}>
                    <h2 className={`text-lg font-display font-bold mb-3 capitalize border-b border-border pb-2 ${
                      isUnlisted ? 'text-destructive' : 'text-foreground'
                    }`}
                    >
                      {categoryTitle}
                    </h2>
                    <TagListView
                      tags={categoryTags}
                      onDelete={confirmDeleteTag}
                      onEdit={handleEditTag}
                      onViewNetwork={handleViewNetwork}
                      allTags={tags}
                    />
                  </div>
                );
              })}
              {filteredSortedTags.length === 0 && !isLoading && (
              <p className="text-center text-muted-foreground py-8">
                {isBackendSearchActive && currentBackendSearchQuery
                  ? `No tags match your search for "${currentBackendSearchQuery}".`
                  : 'No tags match the current filters.'}
              </p>
              )}
            </div>
          )}
          icon={<Hash className="h-4 w-4 mr-2 text-primary" />}
        />
      )}

      <EditTagDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        tag={currentTag}
        onSave={handleSaveTag}
        allowedCategories={allowedCategories}
        alltag_names={alltag_names}
        allTags={tags}
        tagLinkTypes={tagLinkTypes}
        allTagLinks={allTagLinks}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tag, remove it from all associated content, and update parent/child relationships accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {networkGraphTargetTag && (
        <TagNetworkGraphDialog
          isOpen={isNetworkGraphOpen}
          onClose={() => {
            setIsNetworkGraphOpen(false);
            setNetworkGraphTargetTag(null);
          }}
          targetTagName={networkGraphTargetTag}
        />
      )}
    </TabContent>
  );
}

export default AdminTopicsTab;
