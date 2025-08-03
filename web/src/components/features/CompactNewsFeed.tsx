import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  AlertCircle, Newspaper, CalendarDays, Loader2, RefreshCw, Tag as TagIcon,
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
import { useContents } from '@/hooks/useContents';
import { Badge } from '@/components/ui/badge';
import OptImage from '@/components/common/OptImage';

interface CompactNewsFeedProps {
  className?: string;
  maxContents?: number;
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

const CompactNewsFeed: React.FC<CompactNewsFeedProps> = ({
  className,
  maxContents = 5,
}: CompactNewsFeedProps) => {
  const {
    contents: rawContents,
    isLoading: isContentsLoading,
    error: contentsError,
    refreshContents,
  } = useContents({});

  const sortedContents = useMemo(() => {
    if (!Array.isArray(rawContents)) {
      console.warn('rawContents is not an array:', rawContents);
      return [];
    }

    const contents = [...rawContents];
    contents.sort((a, b) => getSafeDate(b).getTime() - getSafeDate(a).getTime());
    return contents.slice(0, maxContents);
  }, [rawContents, maxContents]);

  const isLoading = isContentsLoading;
  const displayError = contentsError;

  if (isLoading && rawContents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading news...</p>
      </div>
    );
  }

  if (displayError && rawContents.length === 0) {
    return (
      <Alert variant="destructive" className="mb-3">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="text-xs">
          <p>{displayError}</p>
          {contentsError && (
          <Button
            onClick={refreshContents}
            variant="secondary"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoading && !displayError && sortedContents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground bg-white dark:bg-gray-800 rounded-lg shadow">
        <Newspaper className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No contents available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-3 py-2 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium flex items-center text-foreground">
            <Newspaper className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Latest News
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshContents}
            disabled={isContentsLoading}
            className="ml-auto h-5 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isContentsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {isLoading && rawContents.length > 0 && (
      <div className="flex justify-center items-center py-3">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Updating...</span>
      </div>
      )}

      <div className="space-y-2">
        {sortedContents.map((content, index) => {
          const filteredTags = Array.isArray(content.tags) && content.source
            ? content.tags.filter((tag) => typeof tag === 'string' && typeof content.source === 'string' && tag.toLowerCase() !== content.source.toLowerCase())
            : (Array.isArray(content.tags) ? content.tags : []);
          const tagsToDisplay = filteredTags.slice(0, 2);

          return (
            <Card key={content.id || index} className="overflow-hidden bg-card shadow-sm hover:shadow-md border border-border transition-all duration-200 hover:scale-[1.005]">
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-2 min-w-0">
                    <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <h4 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground hover:text-primary transition-colors">
                        {content.title || 'Untitled Content'}
                      </h4>
                    </a>

                    {content.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {content.summary}
                      </p>
                    )}

                    {tagsToDisplay.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tagsToDisplay.map((tag, tagIndex) => (
                          <Link
                            key={tagIndex}
                            to={`/tags/${encodeURIComponent(tag)}`}
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

                    <div className="flex items-center text-xs text-muted-foreground space-x-2">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDateSafe(content.date)}</span>
                      </div>
                      {content.source && (
                        <>
                          <span className="text-border">•</span>
                          <span className="truncate">{content.source}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {content.featuredImage && (
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden shadow-sm">
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
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CompactNewsFeed;
