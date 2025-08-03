import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { FeedSource } from '@/types/shared';
import { feedService } from '@/utils/services/feedService';
import OptImage from '@/components/common/OptImage';

function SourcesSection() {
  // State for storing sources, loading status, and errors
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sources from the API when the component mounts
  useEffect(() => {
    const fetchSources = async () => {
      setIsLoading(true); // Start loading
      setError(null); // Reset error
      try {
        const feedSources = await feedService.getActiveFeeds();
        setSources(feedSources);
      } catch (err: any) {
        console.error('Error fetching sources:', err);
        setError(`Failed to load sources: ${err.message || 'Unknown error'}`);
        // Optional: Clear sources if fetch fails completely
        setSources([]);
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    };

    fetchSources();
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-serif font-bold border-b border-gray-800 pb-2">Featured Sources</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          {/* Simple loading spinner */}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  // --- Render Error State ---
  // Show error only if loading is finished and an error exists
  if (!isLoading && error) {
    return (
      <Card className="mb-6 border-destructive">
        <CardHeader>
          <CardTitle className="text-xl font-serif font-bold border-b border-gray-800 pb-2">Featured Sources</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-destructive text-center">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  // --- Render Empty State ---
  // Show message if loading is finished, no error, but no sources were found
  if (!isLoading && !error && sources.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-serif font-bold border-b border-gray-800 pb-2">Featured Sources</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-muted-foreground text-center">
          <p>No featured sources available.</p>
        </CardContent>
      </Card>
    );
  }

  // --- Render Sources Grid of Circles ---
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2 pt-3 px-3">
        {/* Section Title */}
        <CardTitle className="text-sm font-medium border-b border-gray-200 dark:border-gray-700 pb-2">Featured Sources</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6">
          {/* Map over the fetched sources */}
          {sources.map((source) => (
            // Container for each circle item, centered
            <div key={source._id} className="flex flex-col items-center text-center">
              {/* Link wraps the circle */}
              <Link
                to={`/tags/${encodeURIComponent(source.name)}`}
                title={`View contents tagged with "${source.name}"`}
                className="mb-1.5 block hover:opacity-80 transition-opacity"
              >
                {/* Display Favicon Circle or Placeholder Circle */}
                {source.favicon ? (
                  <OptImage
                    src={source.favicon}
                    alt={`${source.name} favicon`}
                    className="h-12 w-12 rounded-full object-contain border bg-white dark:bg-gray-700"
                    width={48}
                    height={48}
                  />
                ) : (
                  // Placeholder circle if no favicon
                  <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-full border">
                    <span className="text-lg font-bold font-serif text-muted-foreground">
                      {source.name.substring(0, 1)}
                    </span>
                  </div>
                )}
              </Link>
              {/* Source Name below the circle */}
              <Link
                to={`/tags/${encodeURIComponent(source.name)}`}
                title={`View contents tagged with "${source.name}"`}
                className="hover:underline max-w-full"
              >
                <span className="text-xs font-medium font-serif line-clamp-2 break-words leading-tight">
                  {source.name}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SourcesSection;
