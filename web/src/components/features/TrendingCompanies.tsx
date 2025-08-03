import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Building } from 'lucide-react';
import api from '@/utils/api';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import OptImage from '@/components/common/OptImage';
// Define the Company type based on backend schema + potential count
interface Company {
    _id?: string; // Assuming MongoDB ID might be present
    id?: string; // Allow for either _id or id
    name: string;
    domain?: string;
    aliases?: string[];
    favicon?: string | null;
    color?: string;
    enabled?: boolean;
    content_count?: number; // Count might be added by the trending endpoint
}

// Define props for the component
interface TrendingCompaniesProps {
    tag_name?: string; // Optional tag name prop
}

const TrendingCompanies: React.FC<TrendingCompaniesProps> = ({ tag_name }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const fetchTrendingCompanies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        // Choose endpoint based on whether tag_name is provided
        if (tag_name) {
          console.log(`Fetching trending companies for tag: ${tag_name}`);
          // Use the tag-specific endpoint (adjust path as needed)
          // Assuming the API expects the tag name as part of the URL path
          response = await api.get<{ companies: Company[] }>(`/trending_companies_for_tag/${encodeURIComponent(tag_name)}`);
        } else {
          console.log('Fetching global trending companies');
          // Use the general endpoint
          response = await api.get<{ companies: Company[] }>('/trending_companies');
        }
        // Assuming both endpoints return an object with a 'companies' array
        setCompanies(response.data.companies || []);
      } catch (err: any) {
        console.error('Error fetching trending companies:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load trending companies.');
        setCompanies([]); // Clear companies on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingCompanies();
    // Add tag_name and refreshCount to dependency array
  }, [refreshCount, tag_name]);

  // Conditionally set the title
  const title = tag_name ? `Trending Companies in "${tag_name}"` : 'Trending Companies';

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Building className="mr-1.5 h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            {title}
          </CardTitle>
          <button
            onClick={() => setRefreshCount((c) => c + 1)}
            className="text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors p-0.5 rounded-sm hover:bg-green-100 dark:hover:bg-green-900/20 ml-auto"
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6">
          {/* Skeleton Loader */}
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <Skeleton className="h-12 w-12 rounded-full mb-1.5" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        )}

        {error && !isLoading && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertTitle className="text-xs font-medium">Error</AlertTitle>
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
        )}

        {!isLoading && !error && companies.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-4">
          No trending companies found
          {tag_name ? ` for "${tag_name}"` : ''}
          .
        </p>
        )}

        {!isLoading && !error && companies.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-6">
          {/* Display max 9 companies */}
          {companies.slice(0, 9).map((company) => (
            <div key={company._id || company.id || company.name} className="flex flex-col items-center text-center">
              {/* Link to the tag page for the company */}
              <Link
                to={`/tags/${encodeURIComponent(company.name)}`}
                title={`View contents tagged with "${company.name}"`}
                className="mb-1.5 block hover:opacity-80 transition-opacity"
              >
                {/* Display Favicon Circle or Placeholder Circle */}
                {company.favicon ? (
                  <OptImage
                        src={company.favicon}
                        alt={`${company.name} favicon`}
                                            // Added background color for better visibility if favicon is transparent
                        className="h-12 w-12 rounded-full object-contain border bg-white dark:bg-gray-700"
                        width={48}
                        height={48}
                                            // Handle image loading errors
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none'; // Hide broken image icon
                          // Optionally show a placeholder div instead
                          const placeholder = document.createElement('div');
                          placeholder.className = 'h-12 w-12 flex items-center justify-center bg-muted rounded-full border';
                          placeholder.innerHTML = `<span class="text-lg font-bold text-muted-foreground">${company.name.substring(0, 1)}</span>`;
                          target.parentNode?.insertBefore(placeholder, target);
                        }}
                      />
                ) : (
                // Placeholder circle if no favicon
                      <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-full border">
                        <span className="text-lg font-bold text-muted-foreground">
                              {company.name.substring(0, 1)}
                            </span>
                      </div>
                )}
              </Link>
              {/* Company Name below the circle */}
              <Link
                to={`/tags/${encodeURIComponent(company.name)}`}
                title={`View contents tagged with "${company.name}"`}
                className="hover:underline max-w-full"
              >
                <span className="text-xs font-medium line-clamp-2 break-words leading-tight">
                  {company.name}
                </span>
              </Link>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingCompanies;
