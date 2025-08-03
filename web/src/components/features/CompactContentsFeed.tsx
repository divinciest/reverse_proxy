import React, {
  useMemo, useState, useEffect, useCallback,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle, Newspaper, CalendarDays, Tag as TagIcon, Filter,
} from 'lucide-react';
import {
  format, parseISO, compareDesc, compareAsc,
} from 'date-fns';
import { useContents } from '@/hooks/useContents';
import { Tag as TagType } from '@/types/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { tagService } from '@/utils/services/tagService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import OptImage from '@/components/common/OptImage';

// Reusable date formatting function
const formatDateSafe = (dateString: string | undefined, formatString: string = 'MMM d, yyyy'): string => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date parsed');
    return format(date, formatString);
  } catch (e) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return format(date, formatString);
    } catch (fallbackError) { /* ignore */ }
    return dateString || 'Invalid Date';
  }
};

// Helper to parse date for sorting, returning Date object or null
const parseDateForSort = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime()) ? date : null;
  } catch (e) {
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) ? date : null;
    } catch (fallbackError) {
      return null;
    }
  }
};

interface CompactContentsFeedProps {
    className?: string;
    maxContents?: number;
}

const CompactContentsFeed: React.FC<CompactContentsFeedProps> = ({
  className,
  maxContents = 5,
}) => {
  const { tag_name: encodedtag_name } = useParams<{ tag_name: string }>();
  const tag_name = useMemo(() => (encodedtag_name ? decodeURIComponent(encodedtag_name) : undefined), [encodedtag_name]);

  // Memoize the options for the useContents hook to prevent infinite loops
  const contentHookOptions = useMemo(() => ({ tagName: tag_name }), [tag_name]);
  const { contents, isLoading: isLoadingContents, error: contentsError } = useContents(contentHookOptions);

  // State for tag details and filtering/sorting
  const [currentTagDetails, setCurrentTagDetails] = useState<TagType | null>(null);
  const [isLoadingTag, setIsLoadingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedChildTags, setSelectedChildTags] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<string>('date-desc');

  // Fetch tag details
  const fetchTagDetails = useCallback(async () => {
    if (!tag_name) return;
    setIsLoadingTag(true);
    setTagError(null);
    try {
      tagService.registerTagVisit(tag_name);
      const details = await tagService.getTagByName(tag_name);
      setCurrentTagDetails(details);
      setSelectedChildTags(new Set());
    } catch (err: any) {
      console.error('Error fetching tag details:', err);
      setTagError(err.message || 'Failed to load tag details.');
      setCurrentTagDetails(null);
    } finally {
      setIsLoadingTag(false);
    }
  }, [tag_name]);

  useEffect(() => {
    fetchTagDetails();
  }, [fetchTagDetails]);

  // Handle child tag filter changes
  const handleChildTagChange = (childtag_name: string, isChecked: boolean) => {
    setSelectedChildTags((prev) => {
      const next = new Set(prev);
      const lowerCaseChild = childtag_name.toLowerCase();
      if (isChecked) {
        next.add(lowerCaseChild);
      } else {
        next.delete(lowerCaseChild);
      }
      return next;
    });
  };

  // Sort the filtered contents
  const sortedContents = useMemo(() => {
    const contentsToSort = [...contents];

    contentsToSort.sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc': {
          const dateA = parseDateForSort(a.date);
          const dateB = parseDateForSort(b.date);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return compareAsc(dateA, dateB);
        }
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'date-desc':
        default: {
          const dateA = parseDateForSort(a.date);
          const dateB = parseDateForSort(b.date);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return compareDesc(dateA, dateB);
        }
      }
    });
    return contentsToSort.slice(0, maxContents);
  }, [contents, sortOrder, maxContents]);

  const contentCount = useMemo(() => contents.length, [contents]);
  const isLoading = isLoadingContents || isLoadingTag;
  const error = contentsError || tagError;

  const childTags = useMemo(() => currentTagDetails?.childTags?.filter(Boolean) || [], [currentTagDetails]);

  if (isLoading && contents.length === 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3">
            <div className="flex items-start space-x-3">
              <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error && contents.length === 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="text-xs">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && !error && contentCount === 0 && tag_name) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        <Newspaper className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">
          No contents found for "
          {tag_name}
          "
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Standardized Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700 px-3 py-2 rounded-t-lg mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
            <TagIcon className="mr-1.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            Contents
            {tag_name && (
            <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">
              (
              {contentCount}
              )
            </span>
            )}
          </h3>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[120px] h-5 text-xs ml-auto">
              <SelectValue placeholder="Sort..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Child Tags Filter */}
      {childTags.length > 0 && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Filter by related tags:
          </Label>
          <div className="flex flex-wrap gap-2">
            {childTags.map((childTag) => (
              <div key={childTag} className="flex items-center space-x-1">
                <Checkbox
                  id={`child-${childTag}`}
                  checked={selectedChildTags.has(childTag.toLowerCase())}
                  onCheckedChange={(checked) => handleChildTagChange(childTag, checked as boolean)}
                  className="h-3 w-3"
                />
                <Label htmlFor={`child-${childTag}`} className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  {childTag}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sortedContents.map((content) => {
          const filteredTags = Array.isArray(content.tags) && content.source
            ? content.tags.filter((tag) => typeof tag === 'string' && typeof content.source === 'string' && tag.toLowerCase() !== content.source.toLowerCase())
            : (Array.isArray(content.tags) ? content.tags : []);
          const tagsToDisplay = filteredTags.slice(0, 2);

          return (
            <Card key={content.id} className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.005]">
              <a
                href={content.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2 min-w-0">
                        <h4 className="text-sm font-semibold leading-tight line-clamp-2 text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                            {content.title || 'Untitled Content'}
                          </h4>

                        {content.summary && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {content.summary}
                            </p>
                          )}

                        {tagsToDisplay.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tagsToDisplay.map((tag, tagIndex) => (
                                    <Link
                                      key={tagIndex}
                                      to={`/tags/${encodeURIComponent(tag)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-block"
                                    >
                                      <Badge
                                            variant="secondary"
                                            className="px-1 py-0.5 text-xs font-medium capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                          >
                                            {tag}
                                          </Badge>
                                    </Link>
                                  ))}
                            </div>
                          )}

                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                            <div className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                <span>{formatDateSafe(content.date)}</span>
                              </div>
                            {content.source && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span className="truncate">{content.source}</span>
                                </>
                              )}
                          </div>
                      </div>
                    {content.featuredImage && (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm">
                          <OptImage
                                src={content.featuredImage}
                                alt=""
                                className="w-full h-full object-cover"
                                width={64}
                                height={64}
                              />
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
  );
};

export default CompactContentsFeed;
