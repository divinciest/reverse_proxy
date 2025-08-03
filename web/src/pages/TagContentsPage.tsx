import React, {
  useMemo, useState, useEffect, useCallback,
} from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle, Newspaper, CalendarDays, Tag as TagIcon, ArrowLeft, Filter,
} from 'lucide-react';
import {
  format, parseISO, compareDesc, compareAsc,
} from 'date-fns';
import { useContents } from '@/hooks/useContents';
import HeaderEx from '@/components/layout/HeaderEx';
import Footer from '@/components/layout/Footer';
import { Tag as TagType } from '@/types/shared'; // Use Tag from shared types
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { tagService } from '@/utils/services/tagService'; // Import tag service
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
// Import components for the side columns
import TrendingContentSection from '@/components/features/TrendingContentSection';
import WorldHeatmapSection from '@/components/features/WorldHeatmapSection';
import SourcesSection from '@/components/features/SourcesSection';
// Import the new component
import TrendingCompanies from '@/components/features/TrendingCompanies';
import ExploreWidget from '@/components/features/ExploreWidget';
import RadarChartWidget, { RadarDataPoint } from '@/components/widgets/RadarChart';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import EventsSection from '@/components/features/EventsSection';
import TagNetworkSection from '@/components/features/TagNetworkSection';
import { useDarkMode } from '@/hooks/useDarkMode';
import OptImage from '@/components/common/OptImage';
import EventsFeed from '@/components/features/EventsFeed';
import CompactContentsFeed from '@/components/features/CompactContentsFeed';

// Reusable date formatting function (similar to NewsFeed)
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

const TagContentsPage: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  console.log('rendring tag page');
  const { tag_name: encodedtag_name } = useParams<{ tag_name: string }>();
  const tag_name = useMemo(() => (encodedtag_name ? decodeURIComponent(encodedtag_name) : undefined), [encodedtag_name]);

  // Memoize the options for the useContents hook to prevent infinite loops
  const contentHookOptions = useMemo(() => ({ tagName: tag_name }), [tag_name]);
  // Fetch ALL contents (client-side filtering approach)
  const { contents, isLoading: isLoadingContents, error: contentsError } = useContents(contentHookOptions);

  // State for tag details and filtering/sorting
  const [currentTagDetails, setCurrentTagDetails] = useState<TagType | null>(null);
  const [isLoadingTag, setIsLoadingTag] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [selectedChildTags, setSelectedChildTags] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<string>('date-desc'); // 'date-desc', 'date-asc', 'title-asc', 'title-desc'
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [isRadarLoading, setIsRadarLoading] = useState(true);

  // Fetch tag details
  const fetchTagDetails = useCallback(async () => {
    if (!tag_name) return;
    setIsLoadingTag(true);
    setTagError(null);
    try {
      // Register the visit (fire-and-forget)
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

  useEffect(() => {
    if (tag_name) {
      const fetchRadarData = async () => {
        setIsRadarLoading(true);
        try {
          const data = await tagService.getRadarChartData(tag_name);
          console.log('Fetched radar data:', data);
          console.log('Data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          if (Array.isArray(data)) {
            console.log('Data length:', data.length);
          }
          setRadarData(data);
        } catch (error) {
          console.error('Failed to fetch radar chart data', error);
          setRadarData([]);
        } finally {
          setIsRadarLoading(false);
        }
      };
      fetchRadarData();
    }
  }, [tag_name]);

  // Add debug logging for render
  console.log('Current radar data state:', radarData);
  console.log('Is loading:', isRadarLoading);
  console.log('Is array:', Array.isArray(radarData));
  if (Array.isArray(radarData)) {
    console.log('Data length:', radarData.length);
  }

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
    const contentsToSort = [...contents]; // Create a mutable copy

    contentsToSort.sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc': {
          const dateA = parseDateForSort(a.date);
          const dateB = parseDateForSort(b.date);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // Put contents without dates last
          if (!dateB) return -1; // Put contents without dates last
          return compareAsc(dateA, dateB);
        }
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'date-desc': // Default
        default: {
          const dateA = parseDateForSort(a.date);
          const dateB = parseDateForSort(b.date);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1; // Put contents without dates last
          if (!dateB) return -1; // Put contents without dates last
          return compareDesc(dateA, dateB); // Newest first
        }
      }
    });
    return contentsToSort;
  }, [contents, sortOrder]);

  // Calculate count based on filtered (before sorting)
  const contentCount = useMemo(() => contents.length, [contents]);
  const isLoading = isLoadingContents || isLoadingTag;
  const error = contentsError || tagError;

  const childTags = useMemo(() => currentTagDetails?.childTags?.filter(Boolean) || [], [currentTagDetails]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <HeaderEx />

        <div className="w-full px-2 py-2">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            {/* Left sidebar - Tag Network, Trending Content, World Heatmap */}
            <div className="xl:col-span-3 space-y-3">
              <TagNetworkSection tag_name={tag_name} />
              <TrendingContentSection tag_name={tag_name} />
              <WorldHeatmapSection tag_name={tag_name} darkMode={isDarkMode} />
            </div>

            {/* Main content area - Events Feed */}
            <main className="xl:col-span-6">
              <div className="bg-card rounded-lg shadow-sm border border-border p-3">
                <div className="mb-3">
                  <Button variant="outline" size="sm" asChild className="border-border bg-background hover:bg-muted">
                    <Link to="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to News Feed
                                        </Link>
                  </Button>
                </div>

                <h1 className="text-xl font-semibold mb-2 capitalize text-foreground">
                  Tag: "
{tag_name || '...'}
                  "
                </h1>

                <EventsFeed tag_name={tag_name} />
              </div>
            </main>

            {/* Right sidebar - Contents, Explore Widget, Radar Chart, Sources */}
            <aside className="xl:col-span-3 space-y-3">
              <div className="bg-card rounded-lg shadow-sm border border-border p-3">
                <CompactContentsFeed maxContents={4} />
              </div>
              <ExploreWidget tag_name={tag_name} />
              {Array.isArray(radarData) && radarData.length > 0 && (
                <Card className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-border p-3">
                    <CardTitle className="text-base font-semibold text-foreground text-center">
                      Market Sentiment Analysis for
                          {' '}
                      {tag_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <RadarChartWidget data={radarData} />
                  </CardContent>
                </Card>
              )}
              <SourcesSection />
            </aside>
          </div>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default TagContentsPage;
