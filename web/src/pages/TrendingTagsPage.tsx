import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Tag as TagIcon, ArrowLeft } from 'lucide-react';
import HeaderEx from '@/components/layout/HeaderEx';
import Footer from '@/components/layout/Footer';
import { Tag } from '@/types/admin';
import { tagService } from '@/utils/services/tagService';
import { useContents } from '@/hooks/useContents';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const TrendingTagsPage: React.FC = () => {
  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(true);
  const [errorTags, setErrorTags] = useState<string | null>(null);

  const { contents, isLoading: isLoadingContents, error: errorContents } = useContents({});

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true);
      setErrorTags(null);
      try {
        const tags = await tagService.getTrendingTags();
        setTrendingTags(tags);
      } catch (err: any) {
        setErrorTags(err.message || 'Failed to load trending tags.');
        console.error('Error fetching trending tags:', err);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const tagCounts = useMemo(() => {
    if (isLoadingContents || !Array.isArray(contents) || contents.length === 0) {
      return {};
    }
    const counts: { [key: string]: number } = {};
    for (const content of contents) {
      if (Array.isArray(content.tags)) {
        for (const tag of content.tags) {
          if (typeof tag === 'string') {
            const lowerTag = tag.toLowerCase();
            counts[lowerTag] = (counts[lowerTag] || 0) + 1;
          }
        }
      }
    }
    return counts;
  }, [contents, isLoadingContents]);

  const isLoading = isLoadingTags || isLoadingContents;
  const error = errorTags || errorContents;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <HeaderEx />
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to News Feed
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TagIcon className="mr-2 h-5 w-5" />
              Trending Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-1/3 rounded-md" />
              ))}
            </div>
            )}

            {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            )}

            {!isLoading && !error && trendingTags.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No trending tags found at the moment.
            </p>
            )}

            {!isLoading && !error && trendingTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => {
                const count = tagCounts[tag.tag_name.toLowerCase()] || 0;
                return (
                  <Link
                        key={tag._id || tag.tag_name}
                        to={`/tags/${encodeURIComponent(tag.tag_name)}`}
                        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-800 rounded-full"
                      >
                        <Badge
                          variant="secondary"
                          className="text-sm px-3 py-1 capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {tag.tag_name}
                          {!isLoadingContents && count > 0 && (
                              <span className="ml-1.5 text-xs font-normal opacity-75">
                                (
                                    {count}
                                )
                                  </span>
                              )}
                        </Badge>
                      </Link>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TrendingTagsPage;
