import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, TrendingUp, RefreshCw, Building, Compass,
} from 'lucide-react';
import api from '@/utils/api';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/types/admin'; // Add Tag type import
import OptImage from '@/components/common/OptImage';
import { Badge } from '@/components/ui/badge';

// Update the interface to match explore content items
interface ExploreItem {
    tag_name: string;
    favicon?: string;
    description?: string;
    category?: string;
    url: string;
    contents_count?: number;
}

// Update component props
interface ExploreWidgetProps {
    tag_name?: string;
}

const ExploreWidget: React.FC<ExploreWidgetProps> = ({ tag_name }) => {
  const [exploreItems, setExploreItems] = useState<ExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [mainTag, setMainTag] = useState<Tag | null>(null);

  useEffect(() => {
    if (!tag_name) {
      setMainTag(null);
      return;
    }

    const fetchMainTag = async () => {
      try {
        const response = await api.get<Tag>(`/tags/${encodeURIComponent(tag_name)}`);
        setMainTag(response.data);
      } catch (err) {
        console.error(`Error fetching details for tag "${tag_name}":`, err);
        setMainTag(null);
      }
    };

    fetchMainTag();
  }, [tag_name]);

  useEffect(() => {
    const fetchExploreContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = tag_name ? { tag_name } : {};
        const response = await api.get<{ tags: ExploreItem[] }>('/get_immidiataly_relavent_tags', { params });
        setExploreItems(response.data.tags || []);
      } catch (err: any) {
        console.error('Error fetching explore content:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load explore content.');
        setExploreItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExploreContent();
  }, [refreshCount, tag_name]);

  const mainTagCategory = mainTag?.category;

  let displayedItems = exploreItems;
  let title: string;
  let emptyMessage: string;
  let icon: React.ReactNode = <TrendingUp className="mr-2 h-4 w-4 text-primary" />;

  if (tag_name && mainTagCategory) {
    if (mainTagCategory === 'company') {
      title = `Investor Firms in "${tag_name}"`;
      displayedItems = exploreItems.filter((item) => item.category === 'firm');
      emptyMessage = `No investor firms found for "${tag_name}".`;
      icon = <Building className="mr-2 h-4 w-4 text-primary" />;
    } else if (mainTagCategory === 'firm') {
      title = `Companies invested in by "${tag_name}"`;
      displayedItems = exploreItems.filter((item) => item.category === 'company');
      emptyMessage = `No companies found that "${tag_name}" is investing in.`;
      icon = <Building className="mr-2 h-4 w-4 text-primary" />;
    } else {
      title = `Explore Related to "${tag_name}"`;
      displayedItems = exploreItems.filter((item) => (item.contents_count ?? 0) > 0);
      emptyMessage = `No related topics found for "${tag_name}".`;
    }
  } else if (tag_name) {
    title = `Explore Related to "${tag_name}"`;
    displayedItems = exploreItems.filter((item) => (item.contents_count ?? 0) > 0);
    emptyMessage = `No related topics found for "${tag_name}".`;
  } else {
    title = 'Explore Trending Topics';
    displayedItems = exploreItems.filter((item) => (item.contents_count ?? 0) > 0);
    emptyMessage = 'No trending topics found.';
  }

  const shouldShowWidget = !isLoading && !error && displayedItems.length > 0;

  if (!shouldShowWidget) {
    return null;
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium flex items-center text-gray-900 dark:text-gray-100">
            <Compass className="mr-1.5 h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Explore Related Topics
            {tag_name && (
            <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-2">
              for "
              {tag_name}
              "
            </span>
            )}
          </h3>
        </div>
      </div>

      <CardContent className="p-3">
        {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        )}

        {error && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs font-medium">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
        )}

        {!isLoading && !error && displayedItems.length === 0 && (
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 py-4">
          {emptyMessage}
        </p>
        )}

        {!isLoading && !error && displayedItems.length > 0 && (
        <div className="space-y-2">
          {displayedItems.slice(0, 5).map((tag) => (
            <Link
              key={tag.tag_name}
              to={`/tags/${encodeURIComponent(tag.tag_name)}`}
              className="block p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {tag.tag_name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {tag.contents_count}
                  {' '}
                  contents
                    </Badge>
              </div>
            </Link>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExploreWidget;
