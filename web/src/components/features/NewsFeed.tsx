import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  AlertCircle, Newspaper, CalendarDays, Loader2, RefreshCw, Tag as TagIcon, XCircle,
} from 'lucide-react';
import {
  format, parseISO, startOfDay, isValid,
} from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Content } from '@/data/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContents } from '@/hooks/useContents';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import CategoryFilters from '@/components/common/CategoryFilters';
import { Tag, TagCategory } from '@/types/admin';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { configService } from '@/utils/services/configService';
import OptImage from '@/components/common/OptImage';

interface NewsFeedProps {
  className?: string;
  contentDisplayStyle?: 'default' | 'compact';
}

const formatDateSafe = (dateString: string | undefined, formatString: string = 'MMM d, yyyy'): string => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date parsed');
    }
    return format(date, formatString);
  } catch (e) {
    console.warn(`Failed to parse or format date: ${dateString}`, e);
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, formatString);
      }
    } catch (fallbackError) {
      // Ignore fallback error
    }
    return dateString || 'Invalid Date';
  }
};

const getSafeDate = (content: Content): Date => {
  const dateString = content.date || content.publishDate;
  if (!dateString) return new Date(0);
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return parsedDate;
    }
    const genericDate = new Date(dateString);
    if (isValid(genericDate)) {
      return genericDate;
    }
    console.warn(`Could not parse date string: ${dateString}`);
    return new Date(0);
  } catch (e) {
    console.error(`Error parsing date string: ${dateString}`, e);
    return new Date(0);
  }
};

const groupContentsByDate = (contents: Content[]): { [key: string]: Content[] } => {
  console.log(`Grouping ${contents.length} contents by date...`);
  return contents.reduce((acc, content) => {
    const date = startOfDay(getSafeDate(content));
    const dateKey = format(date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(content);
    return acc;
  }, {} as { [key: string]: Content[] });
};

// Define constants for pagination
const GLOBAL_INITIAL_CONTENTS = 15;
const GLOBAL_INCREMENT = 10;
const TAG_SECTION_INITIAL_CONTENTS = 5;
const TAG_SECTION_INCREMENT = 5;

const NewsFeed: React.FC<NewsFeedProps> = ({
  className,
  contentDisplayStyle = 'default',
}: NewsFeedProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(['All']);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [filterableTags, setFilterableTags] = useState<Tag[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState<boolean>(true);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [requireAllTags, setRequireAllTags] = useState<boolean>(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [isTrendingTagsLoading, setIsTrendingTagsLoading] = useState<boolean>(true);
  const [trendingTagsError, setTrendingTagsError] = useState<string | null>(null);
  const [allowedCategories, setAllowedCategories] = useState<TagCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const {
    contents: rawContents,
    isLoading: isContentsLoading,
    error: contentsError,
    refreshContents,
  } = useContents({});

  const [globalVisibleContentCount, setGlobalVisibleContentCount] = useState(GLOBAL_INITIAL_CONTENTS);

  const [visibleCountsByTag, setVisibleCountsByTag] = useState<{ [tag_name: string]: number }>({});

  const fetchAllowedCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const fetchedCategories = await configService.getAllowedTagCategories();
      setAllowedCategories(fetchedCategories);
    } catch (err: any) {
      console.error('Error fetching allowed categories:', err);
      const errorMessage = err.message || 'Failed to load tag categories.';
      setCategoriesError(errorMessage);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchAllowedCategories();
  }, [fetchAllowedCategories]);

  useEffect(() => {
    const fetchAndProcessTags = async () => {
      setIsTagsLoading(true);
      setTagsError(null);
      try {
        const response = await api.get<{ tags: Tag[] }>('/tags');

        if (!response.data || !Array.isArray(response.data.tags)) {
          console.error('Invalid data structure received for tags:', response.data);
          throw new Error('Received invalid tag data from the server.');
        }

        const allTags = response.data.tags;

        const groupedByCategory: Record<string, Tag[]> = allTags.reduce((acc, tag) => {
          const categoryKey = tag.category || 'Uncategorized';
          if (!acc[categoryKey]) {
            acc[categoryKey] = [];
          }
          acc[categoryKey].push(tag);
          return acc;
        }, {} as Record<string, Tag[]>);

        for (const category in groupedByCategory) {
          groupedByCategory[category].sort((a, b) => (b.contents_count ?? 0) - (a.contents_count ?? 0));
        }

        const sortedCategories = Object.keys(groupedByCategory).sort();
        const processedTags = sortedCategories.flatMap((category) => groupedByCategory[category]);

        const allCategoryTag: Tag = {
          _id: 'all',
          tag_name: 'All',
          aliases: [],
          createdAt: '',
          lastModified: '',
          category: 'All',
          contents_count: 0,
          parentTag: null,
          childTags: [],
          count: 0,
          finance_approved: false,
          trending: false,
        };

        setFilterableTags([allCategoryTag, ...processedTags]);
      } catch (err: any) {
        console.error('Error fetching or processing tags:', err);
        setTagsError(err.message || 'Failed to load tags.');
        const allCategoryTag: Tag = {
          _id: 'all',
          tag_name: 'All',
          aliases: [],
          createdAt: '',
          lastModified: '',
          category: 'All',
          contents_count: 0,
          parentTag: null,
          childTags: [],
          count: 0,
          finance_approved: false,
          trending: false,
        };
        setFilterableTags([allCategoryTag]);
      } finally {
        setIsTagsLoading(false);
      }
    };

    fetchAndProcessTags();
  }, []);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      setIsTrendingTagsLoading(true);
      setTrendingTagsError(null);
      try {
        const response = await api.get<Tag[]>('/trending_tags');
        setTrendingTags(response.data.map((tag) => tag.tag_name));
      } catch (err: any) {
        console.error('Error fetching trending tags:', err);
        setTrendingTagsError(err.response?.data?.error || err.message || 'Failed to load trending tags.');
        setTrendingTags([]);
      } finally {
        setIsTrendingTagsLoading(false);
      }
    };

    fetchTrendingTags();
  }, []);

  useEffect(() => {
    if (trendingTags && trendingTags.length > 0) {
      const initialCounts = trendingTags.reduce((acc, tag) => {
        acc[tag] = TAG_SECTION_INITIAL_CONTENTS;
        return acc;
      }, {} as { [tag_name: string]: number });
      initialCounts.__OTHER__ = TAG_SECTION_INITIAL_CONTENTS;
      setVisibleCountsByTag(initialCounts);
    } else {
      setVisibleCountsByTag({ __OTHER__: TAG_SECTION_INITIAL_CONTENTS });
    }
  }, [trendingTags]);

  const handleTagToggle = (tag_name: string) => {
    if (tag_name === 'All') {
      setSelectedTags(['All']);
      setRequireAllTags(false);
      return;
    }

    const currentTags = selectedTags.includes('All') ? [] : selectedTags;
    const newSelectedTags = currentTags.includes(tag_name)
      ? currentTags.filter((t) => t !== tag_name)
      : [...currentTags, tag_name];

    if (newSelectedTags.length === 0) {
      setSelectedTags(['All']);
      setRequireAllTags(false);
    } else {
      setSelectedTags(newSelectedTags);
    }
  };

  const handleSortChange = (value: string) => {
    console.log('Selected Sort:', value);
    setSortOption(value);
  };

  const handleResetFilters = () => {
    setSelectedTags(['All']);
    setRequireAllTags(false);
    setSortOption('newest');
  };

  const isFiltersReset = useMemo(() => {
    const tagsReset = selectedTags.length === 0 || (selectedTags.length === 1 && selectedTags[0] === 'All');
    return tagsReset && !requireAllTags;
  }, [selectedTags, requireAllTags]);

  const filteredAndSortedContents = useMemo(() => {
    if (isFiltersReset) return [];

    if (!Array.isArray(rawContents)) {
      console.warn('rawContents is not an array:', rawContents);
      return [];
    }

    let processedContents = [...rawContents];

    processedContents = processedContents.filter((content) => {
      const contentTags = Array.isArray(content.tags) ? content.tags : [];
      const activeSelectedTags = selectedTags.filter((t) => t !== 'All');

      if (activeSelectedTags.length === 0) {
        return true;
      }

      if (requireAllTags) {
        return activeSelectedTags.every((selectedTag) => contentTags.includes(selectedTag));
      }
      return activeSelectedTags.some((selectedTag) => contentTags.includes(selectedTag));
    });

    switch (sortOption) {
      case 'newest':
        processedContents.sort((a, b) => getSafeDate(b).getTime() - getSafeDate(a).getTime());
        break;
      case 'oldest':
        processedContents.sort((a, b) => getSafeDate(a).getTime() - getSafeDate(b).getTime());
        break;
      case 'alphabetical':
        processedContents.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
        break;
      case 'trend_score':
        processedContents.sort((a, b) => (b.trend_score ?? -Infinity) - (a.trend_score ?? -Infinity));
        break;
      default:
        processedContents.sort((a, b) => getSafeDate(b).getTime() - getSafeDate(a).getTime());
    }

    return processedContents;
  }, [rawContents, selectedTags, sortOption, requireAllTags, isFiltersReset]);

  useEffect(() => {
    if (!isFiltersReset) {
      setGlobalVisibleContentCount(GLOBAL_INITIAL_CONTENTS);
    }
  }, [isFiltersReset, selectedTags, requireAllTags]);

  const contentsToDisplayFiltered = useMemo(() => {
    if (isFiltersReset) return [];
    return filteredAndSortedContents.slice(0, globalVisibleContentCount);
  }, [filteredAndSortedContents, globalVisibleContentCount, isFiltersReset]);

  const groupedContentsToDisplayFiltered = useMemo(() => {
    if (isFiltersReset) return {};
    return groupContentsByDate(contentsToDisplayFiltered);
  }, [contentsToDisplayFiltered, isFiltersReset]);

  const sortedDateKeysToDisplayFiltered = useMemo(() => {
    if (isFiltersReset) return [];
    const keys = Object.keys(groupedContentsToDisplayFiltered);
    return keys.sort((a, b) => {
      if (a === 'unknown-date') return 1;
      if (b === 'unknown-date') return -1;
      try {
        return parseISO(b).getTime() - parseISO(a).getTime();
      } catch (e) {
        return 0;
      }
    });
  }, [groupedContentsToDisplayFiltered, isFiltersReset]);

  const sectionedContentsData = useMemo(() => {
    if (!isFiltersReset) return { sections: [], otherContents: [] };

    const remainingContents = [...rawContents].sort((a, b) => getSafeDate(b).getTime() - getSafeDate(a).getTime());

    if (!trendingTags || trendingTags.length === 0) {
      return { sections: [], otherContents: remainingContents };
    }

    const sections: { tag: string; contents: Content[] }[] = [];
    const displayedContentIds = new Set<string>();

    trendingTags.forEach((tag) => {
      const contentsForTag = remainingContents.filter((content) => {
        const contentId = (content as any)._id ?? content.id;
        return !displayedContentIds.has(contentId) && Array.isArray(content.tags) && content.tags.includes(tag);
      });

      if (contentsForTag.length > 0) {
        sections.push({ tag, contents: contentsForTag });
        contentsForTag.forEach((content) => displayedContentIds.add((content as any)._id ?? content.id));
      }
    });

    const otherContents = remainingContents.filter((content) => !displayedContentIds.has((content as any)._id ?? content.id));

    return { sections, otherContents };
  }, [isFiltersReset, rawContents, trendingTags]);

  const handleGlobalShowMore = () => {
    setGlobalVisibleContentCount((prev) => Math.min(prev + GLOBAL_INCREMENT, filteredAndSortedContents.length));
  };
  const canShowMoreGlobal = globalVisibleContentCount < filteredAndSortedContents.length;

  const handleTagSectionShowMore = (tag_name: string) => {
    setVisibleCountsByTag((prev) => ({
      ...prev,
      [tag_name]: (prev[tag_name] || 0) + TAG_SECTION_INCREMENT,
    }));
  };

  const isLoading = isContentsLoading || isTagsLoading || isTrendingTagsLoading;
  const displayError = contentsError || tagsError || trendingTagsError;

  if (isLoading && rawContents.length === 0 && filterableTags.length <= 1) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading feed...</p>
      </div>
    );
  }

  if (displayError && rawContents.length === 0) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Feed</AlertTitle>
        <AlertDescription>
          <p>{displayError}</p>
          {contentsError && (
          <Button
            onClick={refreshContents}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Refreshing Contents
          </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const filtersAreDefault = selectedTags.length === 1 && selectedTags[0] === 'All' && !requireAllTags;

  // !isLoading && !displayError && rawContents.length > 0 && !isFiltersReset && filteredAndSortedContents.length === 0

  // we want to log the conditions above one by one and see if they are met
  console.log('isLoading', isLoading);
  console.log('displayError', displayError);
  console.log('rawContents.length', rawContents.length);
  console.log('isFiltersReset', isFiltersReset);
  console.log('filteredAndSortedContents.length', filteredAndSortedContents.length);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Compact filter section */}
      <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Content Filters</h3>
          {!filtersAreDefault && (
          <Button
            onClick={handleResetFilters}
            variant="ghost"
            size="sm"
            className="text-xs h-auto px-2 py-1 text-muted-foreground hover:text-foreground"
            title="Reset Filters"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Reset
          </Button>
          )}
        </div>

        {isTagsLoading && (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading filters...</span>
          </div>
        )}

        {tagsError && !isTagsLoading && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Filter Error</AlertTitle>
          <AlertDescription>{tagsError}</AlertDescription>
        </Alert>
        )}

        {!isTagsLoading && !tagsError && (
          <div className="space-y-3">
            <div className="flex items-center flex-wrap gap-2">
              <CategoryFilters
                allTags={filterableTags}
                selectedTags={selectedTags}
                onTagSelect={handleTagToggle}
                allowedCategories={allowedCategories}
              />
            </div>

            {filterableTags.length > 1 && (
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Checkbox
                  id="require-all-tags"
                  checked={requireAllTags}
                  onCheckedChange={(checked) => setRequireAllTags(Boolean(checked))}
                  disabled={selectedTags.length === 0 || selectedTags.includes('All')}
                />
                <Label
                  htmlFor="require-all-tags"
                  className={`text-sm font-normal ${(selectedTags.length === 0 || selectedTags.includes('All')) ? 'text-muted-foreground' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  Require all selected tags (strict filtering)
                </Label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compact controls section */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshContents}
            disabled={isContentsLoading}
            className="h-8 px-3"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isContentsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Select value={sortOption} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && rawContents.length > 0 && (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Updating contents...</span>
      </div>
      )}

      {contentsError && !isContentsLoading && rawContents.length > 0 && (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Updating Contents</AlertTitle>
        <AlertDescription>
          {contentsError}
          . Some contents may be outdated. Try
          <Button variant="link" className="p-0 h-auto ml-1" onClick={refreshContents}>
            refreshing
          </Button>
          .
        </AlertDescription>
      </Alert>
      )}

      {!isLoading && !displayError && rawContents.length === 0 && (
      <div className="text-center py-12 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        No contents found matching your current filters.
      </div>
      )}

      {!isLoading && !displayError && rawContents.length > 0 && !isFiltersReset && filteredAndSortedContents.length === 0 && (
      <div className="text-center py-12 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        No contents found matching your current filters.
      </div>
      )}

      {!isLoading && !displayError && rawContents.length > 0 && isFiltersReset && sectionedContentsData.sections.length === 0 && sectionedContentsData.otherContents.length === 0 && (
      <div className="text-center py-12 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        No contents found matching your current filters.
      </div>
      )}

      {!isLoading && !displayError && !isFiltersReset && filteredAndSortedContents.length > 0 && (
        <div className="space-y-4">
          {sortedDateKeysToDisplayFiltered.map((dateKey) => (
            <div key={dateKey}>
              <h2 className="text-base font-semibold mb-2 text-gray-600 dark:text-gray-400">
                {dateKey === 'unknown-date' ? 'Unsorted Date' : formatDateSafe(dateKey, 'MMMM d, yyyy')}
              </h2>
              <div className="space-y-2">
                {groupedContentsToDisplayFiltered[dateKey].map((content, index) => {
                  const contentKey = `${dateKey}-${content.id ?? 'no-id'}-${index}`;
                  const filteredTags = Array.isArray(content.tags) && content.source
                    ? content.tags.filter((tag) => typeof tag === 'string' && typeof content.source === 'string' && tag.toLowerCase() !== content.source.toLowerCase())
                    : (Array.isArray(content.tags) ? content.tags : []);
                  const tagsToDisplay = filteredTags.slice(0, 4);
                  const hasMoreTags = filteredTags.length > tagsToDisplay.length;

                  return (
                    <Card key={contentKey} className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.005]">
                      <a
                        href={content.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="text-lg font-semibold leading-tight mb-1 line-clamp-3 text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                                {content.title || 'Untitled Content'}
                              </h3>
                              <div className="min-h-[3.5rem]">
                                {content.summary && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                    {content.summary}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                                {tagsToDisplay.length > 0 ? (
                                  tagsToDisplay.map((tag, tagIndex) => (
                                    <Link
                                      key={tagIndex}
                                      to={`/tags/${encodeURIComponent(tag)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-block"
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="px-1.5 py-0.5 text-xs font-medium capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      >
                                        {tag}
                                      </Badge>
                                    </Link>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">No relevant tags</span>
                                )}
                                {hasMoreTags && (
                                  <span className="text-xs text-gray-400 dark:text-gray-600">...</span>
                                )}
                              </div>

                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-1 space-x-2">
                                {content.sourceLogo && (
                                <OptImage src={content.sourceLogo} alt={`${content.source} logo`} className="h-3 w-3 rounded-full" width={12} height={12} />
                                )}
                                {!content.sourceLogo && <Newspaper className="h-3 w-3" />}
                                <span className="font-medium">{content.source || 'Unknown Source'}</span>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  <span>{formatDateSafe(content.date || content.publishDate)}</span>
                                </div>
                              </div>
                            </div>
                            {content.featuredImage && (
                              <OptImage
                                src={content.featuredImage}
                                alt={`Featured image for ${content.title}`}
                                className="w-32 h-32 object-cover rounded-md flex-shrink-0 shadow-sm"
                                width={128}
                                height={128}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            {!content.featuredImage && (
                              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 shadow-sm">
                                <Newspaper className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </a>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {canShowMoreGlobal && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={handleGlobalShowMore}
                size="sm"
              >
                Show More Contents (
                {filteredAndSortedContents.length - globalVisibleContentCount}
                {' '}
                remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && !displayError && isFiltersReset && (
        <div className="space-y-4">
          {sectionedContentsData.sections.map(({ tag, contents }) => {
            const visibleCount = visibleCountsByTag[tag] || TAG_SECTION_INITIAL_CONTENTS;
            const contentsToShow = contents.slice(0, visibleCount);
            const canShowMoreForTag = visibleCount < contents.length;

            return (
              <div key={tag}>
                <h2 className="text-lg font-semibold mb-2 flex items-center">
                  <TagIcon className="h-4 w-4 mr-2 text-primary" />
                  {' '}
                  {tag}
                </h2>
                <div className="space-y-2">
                  {contentsToShow.map((content, index) => {
                    const contentKey = `${tag}-${content.id ?? 'no-id'}-${index}`;
                    const filteredDisplayTags = Array.isArray(content.tags) && content.source
                      ? content.tags.filter((t) => typeof t === 'string' && typeof content.source === 'string' && t.toLowerCase() !== content.source.toLowerCase())
                      : (Array.isArray(content.tags) ? content.tags : []);
                    const tagsToDisplay = filteredDisplayTags.slice(0, 4);
                    const hasMoreTags = filteredDisplayTags.length > tagsToDisplay.length;

                    return (
                      <Card key={contentKey} className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.005]">
                        <a
                          href={content.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-1 space-y-2">
                                <h3 className="text-lg font-semibold leading-tight mb-1 line-clamp-3 text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                                  {content.title || 'Untitled Content'}
                                </h3>
                                <div className="min-h-[3.5rem]">
                                  {content.summary && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                      {content.summary}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  {tagsToDisplay.length > 0 ? (
                                    tagsToDisplay.map((tag, tagIndex) => (
                                      <Link
                                        key={tagIndex}
                                        to={`/tags/${encodeURIComponent(tag)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-block"
                                      >
                                        <Badge
                                          variant="secondary"
                                          className="px-1.5 py-0.5 text-xs font-medium capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                        >
                                          {tag}
                                        </Badge>
                                      </Link>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No relevant tags</span>
                                  )}
                                  {hasMoreTags && (
                                    <span className="text-xs text-gray-400 dark:text-gray-600">...</span>
                                  )}
                                </div>

                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-1 space-x-2">
                                  {content.sourceLogo && (
                                  <OptImage src={content.sourceLogo} alt={`${content.source} logo`} className="h-3 w-3 rounded-full" width={12} height={12} />
                                  )}
                                  {!content.sourceLogo && <Newspaper className="h-3 w-3" />}
                                  <span className="font-medium">{content.source || 'Unknown Source'}</span>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>{formatDateSafe(content.date || content.publishDate)}</span>
                                  </div>
                                </div>
                              </div>
                              {content.featuredImage && (
                                <OptImage
                                  src={content.featuredImage}
                                  alt={`Featured image for ${content.title}`}
                                  className="w-32 h-32 object-cover rounded-md flex-shrink-0 shadow-sm"
                                  width={128}
                                  height={128}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              {!content.featuredImage && (
                                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 shadow-sm">
                                  <Newspaper className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </a>
                      </Card>
                    );
                  })}
                </div>
                {canShowMoreForTag && (
                  <div className="text-center pt-2 mt-2 border-t border-dashed">
                    <Button variant="outline" size="sm" onClick={() => handleTagSectionShowMore(tag)}>
                      Show More in
                      {' '}
                      {tag}
                      {' '}
                      (
                      {contents.length - visibleCount}
                      {' '}
                      remaining)
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {sectionedContentsData.otherContents.length > 0 && (
          <div key="__OTHER__">
            <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">Other Contents</h2>
            <div className="space-y-4">
              {sectionedContentsData.otherContents
                .slice(0, visibleCountsByTag.__OTHER__ || TAG_SECTION_INITIAL_CONTENTS)
                .map((content, index) => {
                  const contentKey = `other-${content.id ?? 'no-id'}-${index}`;
                  const filteredDisplayTags = Array.isArray(content.tags) && content.source
                    ? content.tags.filter((t) => typeof t === 'string' && typeof content.source === 'string' && t.toLowerCase() !== content.source.toLowerCase())
                    : (Array.isArray(content.tags) ? content.tags : []);
                  const tagsToDisplay = filteredDisplayTags.slice(0, 4);
                  const hasMoreTags = filteredDisplayTags.length > tagsToDisplay.length;

                  return (
                    <Card key={contentKey} className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.005]">
                      <a
                        href={content.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="text-lg font-semibold leading-tight mb-1 line-clamp-3 text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                                   {content.title || 'Untitled Content'}
                                 </h3>
                              <div className="min-h-[3.5rem]">
                                   {content.summary && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                       {content.summary}
                                     </p>
                                    )}
                                 </div>

                              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                                   {tagsToDisplay.length > 0 ? (
                                      tagsToDisplay.map((tag, tagIndex) => (
                                         <Link
                                             key={tagIndex}
                                             to={`/tags/${encodeURIComponent(tag)}`}
                                             onClick={(e) => e.stopPropagation()}
                                             className="inline-block"
                                           >
                                             <Badge
                                               variant="secondary"
                                               className="px-1.5 py-0.5 text-xs font-medium capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                             >
                                               {tag}
                                             </Badge>
                                           </Link>
                                      ))
                                    ) : (
                                       <span className="text-xs text-muted-foreground italic">No relevant tags</span>
                                    )}
                                   {hasMoreTags && (
                                    <span className="text-xs text-gray-400 dark:text-gray-600">...</span>
                                    )}
                                 </div>

                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-1 space-x-2">
                                   {content.sourceLogo && (
                                    <OptImage src={content.sourceLogo} alt={`${content.source} logo`} className="h-3 w-3 rounded-full" width={12} height={12} />
                                    )}
                                   {!content.sourceLogo && <Newspaper className="h-3 w-3" />}
                                   <span className="font-medium">{content.source || 'Unknown Source'}</span>
                                   <span className="text-gray-300 dark:text-gray-600">•</span>
                                   <div className="flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />
                                      <span>{formatDateSafe(content.date || content.publishDate)}</span>
                                    </div>
                                 </div>
                            </div>
                            {content.featuredImage && (
                            <OptImage
                                 src={content.featuredImage}
                                 alt={`Featured image for ${content.title}`}
                                 className="w-32 h-32 object-cover rounded-md flex-shrink-0 shadow-sm"
                                 width={128}
                                 height={128}
                                 onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                               />
                            )}
                            {!content.featuredImage && (
                            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 shadow-sm">
                                 <Newspaper className="w-8 h-8" />
                               </div>
                            )}
                          </div>
                        </CardContent>
                      </a>
                    </Card>
                  );
                })}
            </div>
            {(visibleCountsByTag.__OTHER__ || TAG_SECTION_INITIAL_CONTENTS) < sectionedContentsData.otherContents.length && (
            <div className="text-center pt-4 mt-4 border-t border-dashed">
              <Button variant="outline" size="sm" onClick={() => handleTagSectionShowMore('__OTHER__')}>
                Show More Other Contents (
                {sectionedContentsData.otherContents.length - (visibleCountsByTag.__OTHER__ || TAG_SECTION_INITIAL_CONTENTS)}
                {' '}
                remaining)
              </Button>
            </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
