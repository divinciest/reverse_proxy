import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, CalendarDays, Newspaper, Tag as TagIcon, RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns'; // Import date-fns functions
import api from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/data/types';
import OptImage from '@/components/common/OptImage';

// Helper function to format date string safely
const formatDateSafe = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    // Attempt to parse potentially different date formats
    const date = parseISO(dateString); // Handles ISO 8601 format like "2025-04-15T12:00:00Z"
    return format(date, 'MMM d, yyyy'); // Format as "Apr 15, 2025"
  } catch (e) {
    console.warn(`Failed to parse date: ${dateString}`, e);
    // Fallback for potentially non-ISO formats or simple strings
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'MMM d, yyyy');
      }
    } catch (fallbackError) {
      // Ignore fallback error
    }
    return dateString; // Return original string if parsing fails
  }
};

// Define props for the component
interface TrendingContentSectionProps {
    tag_name?: string; // Optional tag name prop
}

// Use the props in the component definition
const TrendingContentSection: React.FC<TrendingContentSectionProps> = ({ tag_name }) => {
  const [trendingContents, setTrendingContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const fetchTrendingContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let contents: Content[] = [];
        // Choose endpoint based on whether tag_name is provided
        if (tag_name) {
          console.log(`Fetching trending content for tag: ${tag_name}`);
          // Use the tag-specific endpoint
          const response = await api.get<{ contents: Content[] }>(`/trending_content_by_tag?tag_name=${encodeURIComponent(tag_name)}`);
          // The by_tag endpoint returns { contents: [...] }
          contents = response.data.contents || [];
        } else {
          console.log('Fetching general trending content');
          // Use the general endpoint
          const response = await api.get<{ trending: Content[]; count: number }>('/trending_content');
          // The general endpoint returns { trending: [...], count: ... }
          contents = response.data.trending || [];
        }
        // Set state with the fetched contents (no extra processing needed here if API returns correct Content structure)
        setTrendingContents(contents);
      } catch (err: any) {
        console.error('Error fetching trending content:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load trending content.');
        setTrendingContents([]); // Clear contents on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingContent();
    // Add tag_name and refreshCount to dependency array
  }, [refreshCount, tag_name]);

  // Conditionally set the title
  const title = tag_name ? `Trending in "${tag_name}"` : 'Trending News';

  // Per requirements, the component should be invisible until there is content to show.
  if (isLoading || trendingContents.length === 0) {
    return null;
  }

  // If there was an error, log it but still render nothing.
  if (error) {
    console.error(`Error fetching trending content for ${tag_name || 'all tags'}:`, error);
    return null;
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium flex items-center text-foreground">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            {title}
          </h2>
          <button
            onClick={() => setRefreshCount((c) => c + 1)}
            className="text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-0.5 rounded-sm hover:bg-orange-100 dark:hover:bg-orange-900/20 ml-auto"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <ul className="space-y-2">
          {trendingContents.slice(0, 3).map((content, index) => (
            <li key={content.id || index} className="bg-muted/50 text-card-foreground rounded-md overflow-hidden border border-border hover:shadow-sm transition-all duration-200">
              <div className="block hover:bg-muted transition-colors">
                <div className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <a
                        href={content.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 className="text-sm font-semibold leading-tight mb-1 line-clamp-2 text-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                          {content.title || 'Untitled Content'}
                        </h3>
                        <div className="min-h-[2rem]">
                          {content.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                              {content.summary}
                            </p>
                          )}
                        </div>
                      </a>
                      <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
                        {(() => {
                          const tagsToShow = Array.isArray(content.tags) && content.source
                            ? content.tags.filter((tag) => typeof tag === 'string'
                                && typeof content.source === 'string'
                                && tag.toLowerCase() !== content.source.toLowerCase())
                            : (Array.isArray(content.tags) ? content.tags.filter((tag) => typeof tag === 'string') : []);

                          const tagsToDisplay = tagsToShow.slice(0, 3);
                          const hasMoreTags = tagsToShow.length > 3;

                          if (tagsToDisplay.length === 0) {
                            return <span className="text-xs text-muted-foreground italic">No relevant tags</span>;
                          }

                          return (
                            <>
                              {tagsToDisplay.map((tag) => (
                                <Link
                                  key={`${content.id}-${tag}`}
                                  to={`/tags/${encodeURIComponent(tag)}`}
                                  className="inline-block flex-shrink-0"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="px-1 py-0.5 text-xs font-medium capitalize cursor-pointer hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors whitespace-nowrap bg-secondary text-secondary-foreground"
                                  >
                                    {tag}
                                  </Badge>
                                </Link>
                              ))}
                              {hasMoreTags && (
                                <span className="text-xs text-muted-foreground">...</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground pt-1">
                        <div className="flex-shrink-0">
                          {content.sourceLogo ? (
                            <OptImage src={content.sourceLogo} alt={`${content.source} logo`} className="h-3 w-3 rounded-full" width={12} height={12} />
                          ) : <Newspaper className="h-3 w-3" />}
                        </div>
                        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium" title={content.source}>
                          {content.source}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                          <CalendarDays className="h-3 w-3" />
                          <span>{formatDateSafe(content.date)}</span>
                        </div>
                      </div>
                    </div>
                    {content.featuredImage && (
                      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden hidden sm:block shadow-sm">
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TrendingContentSection;
