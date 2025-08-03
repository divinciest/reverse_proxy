import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Tag as TagIcon } from 'lucide-react';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from '@/types/admin';

interface TrendingTagsSectionProps {
  showTitle?: boolean;
}

function TrendingTagsSection({ showTitle = true }: TrendingTagsSectionProps) {
  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch tags from the backend API endpoint
        const response = await api.get<Tag[]>('/trending_tags');
        setTrendingTags(response.data || []); // Ensure it's an array
      } catch (err: any) {
        console.error('Error fetching trending tags:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load trending tags.');
        setTrendingTags([]); // Clear tags on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingTags();
  }, []); // Empty dependency array ensures this runs once on mount

  if (isLoading) {
    return (
      <div className="flex w-full h-16 overflow-hidden rounded-lg">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="flex-1 h-full" />
        ))}
      </div>
    );
  }

  if (error || trendingTags.length === 0) {
    return null; // Don't show anything if there's an error or no trending tags
  }

  // Limit to maximum 5 tags and take the first 5
  const displayTags = trendingTags.slice(0, 5);
  const tagCount = displayTags.length;

  return (
    <div className="w-full">
      {showTitle && (
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Trending Topics
        </div>
      )}

      {/* Merged trending tags with diagonal borders */}
      <div className="relative flex w-full h-24 md:h-16 overflow-hidden rounded-lg">
        {displayTags.map((tag, index) => (
          <div
            key={tag._id}
            className="relative flex-1 overflow-hidden group cursor-pointer transition-all duration-200 hover:scale-105"
            style={{
              backgroundImage: tag.wallpaper
                ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${tag.wallpaper})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: `${100 / tagCount}%`,
              // Create diagonal border effect
              clipPath: index === 0
                ? 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)'
                : index === tagCount - 1
                  ? 'polygon(5% 0, 100% 0, 100% 100%, 0% 100%)'
                  : 'polygon(5% 0, 100% 0, 95% 100%, 0% 100%)',
            }}
          >
            <Link to={`/tags/${encodeURIComponent(tag.tag_name)}`} className="block w-full h-full">
              <div className="flex flex-col justify-start items-end md:items-start h-full p-3">
                <span className="text-white text-sm font-semibold leading-tight truncate max-w-full">
                  {tag.tag_name}
                </span>
                <span className="text-white/80 text-xs mt-1">
                  {tag.event_count_30d || 0}
                  {' '}
                  events
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrendingTagsSection;
