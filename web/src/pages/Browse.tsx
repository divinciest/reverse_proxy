import React, {
  useEffect, useState, useCallback, useRef, Suspense,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Database,
  Newspaper,
  Building2,
  Lightbulb,
  BriefcaseBusiness,
  Moon,
  Sun,
  Home,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { tagService } from '@/utils/services/tagService';
import { Tag } from '@/types/shared';
import { eventService, Event } from '@/utils/services/eventService';
import Footer from '@/components/layout/Footer';
import OptImage from '@/components/common/OptImage';
import api from '@/utils/api';

// Lazy load NetworkBackground
const LazyNetworkBackground = React.lazy(() => import('@/components/common/NetworkBackground'));

interface CategoryGroup {
  category: string;
  tags: Tag[];
  type: 'companies' | 'financial_topics' | 'economic_sectors' | 'financial_data' | 'financial_news';
}

// Minimal static data for immediate display
const staticCategories: CategoryGroup[] = [
  {
    category: 'Companies',
    type: 'companies',
    tags: [
      {
        tag_name: 'Apple Inc', _id: 'apple', category: 'company', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Microsoft', _id: 'microsoft', category: 'company', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Tesla', _id: 'tesla', category: 'company', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Amazon', _id: 'amazon', category: 'company', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
    ],
  },
  {
    category: 'Financial Topics',
    type: 'financial_topics',
    tags: [
      {
        tag_name: 'Cryptocurrency', _id: 'crypto', category: 'topic', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'AI & Technology', _id: 'ai-tech', category: 'topic', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'ESG Investing', _id: 'esg', category: 'topic', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Market Analysis', _id: 'market-analysis', category: 'topic', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
    ],
  },
  {
    category: 'Economic Sectors',
    type: 'economic_sectors',
    tags: [
      {
        tag_name: 'Technology', _id: 'tech-sector', category: 'sector', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Healthcare', _id: 'healthcare-sector', category: 'sector', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Finance', _id: 'finance-sector', category: 'sector', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'Energy', _id: 'energy-sector', category: 'sector', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
    ],
  },
  {
    category: 'Financial Data',
    type: 'financial_data',
    tags: [
      {
        tag_name: 'S&P 500', _id: 'sp500', category: 'data', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'US-Stocks', _id: 'us-stocks', category: 'data', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: 'World GDP', _id: 'world-gdp', category: 'data', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
      {
        tag_name: '13F Filings', _id: '13f', category: 'data', contents_count: 0, aliases: [], parentTag: null, childTags: [], createdAt: new Date().toISOString(), trendable: false, explorable: true, humanReviewed: true, finance_approved: true, count: 0, lastModified: new Date().toISOString(),
      },
    ],
  },
  {
    category: 'Financial News',
    type: 'financial_news',
    tags: [{
      tag_name: 'Latest News',
      _id: 'news',
      category: 'news',
      contents_count: 0,
      aliases: [],
      parentTag: null,
      childTags: [],
      createdAt: new Date().toISOString(),
      trendable: false,
      explorable: true,
      humanReviewed: true,
      finance_approved: true,
      count: 0,
      lastModified: new Date().toISOString(),
    }],
  },
];

const Browse: React.FC = () => {
  const [categories, setCategories] = useState<CategoryGroup[]>(staticCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagFavicons, setTagFavicons] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<Event[]>([]);
  const [paused, setPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const hasFetchedTags = useRef(false);
  const [showNetworkBackground, setShowNetworkBackground] = useState(false);

  // Simple dark mode toggle
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Function to fetch favicon for a tag
  const fetchTagFavicon = useCallback(async (tagName: string) => {
    try {
      const response = await api.get<{ favicon_url?: string }>(`/tags/${encodeURIComponent(tagName)}/favicon`);
      if (response.data && response.data.favicon_url) {
        setTagFavicons(prev => ({
          ...prev,
          [tagName]: response.data.favicon_url as string
        }));
      }
    } catch (error) {
      console.error(`Error fetching favicon for ${tagName}:`, error);
    }
  }, []);

  // Load data in background after initial render
  useEffect(() => {
    if (hasFetchedTags.current) return;

    const loadData = async () => {
      try {
        setIsEventsLoading(true);
        setIsCategoriesLoading(true);
        setError(null);

        // Load events first
        const loadEvents = async () => {
          try {
            const browseData = await tagService.getBrowseData();
            if (browseData.events && browseData.events.length > 0) {
              const eventsWithImages = browseData.events.filter((event: any) => event.content_images
                && event.content_images[0]
                && event.content_images[0].image_url);
              setEvents(eventsWithImages);
              if (eventsWithImages.length >= 3) {
                setVisibleEvents(eventsWithImages.slice(0, 3));
              }
            }
          } catch (err) {
            console.error('Error loading events:', err);
          } finally {
            setIsEventsLoading(false);
          }
        };

        // Load categories data
        const loadCategories = async () => {
          try {
            const browseData = await tagService.getBrowseData();

            const updatedCategories = staticCategories.map((category) => {
              switch (category.type) {
                case 'companies':
                  return { ...category, tags: browseData.companies || category.tags };
                case 'financial_topics':
                  return { ...category, tags: browseData.financial_topics || category.tags };
                case 'economic_sectors':
                  return { ...category, tags: browseData.economic_sectors || category.tags };
                case 'financial_news':
                  return { ...category, tags: category.tags };
                default:
                  return category;
              }
            });

            setCategories(updatedCategories);

            // Load favicons in background
            setTimeout(() => {
              const allTagsToFetch = [
                ...(browseData.companies || []),
                ...(browseData.financial_topics || []),
                ...(browseData.economic_sectors || []),
              ];
              allTagsToFetch.forEach((tag) => fetchTagFavicon(tag.tag_name));
            }, 500);
          } catch (err) {
            console.error('Error loading categories:', err);
            setError('Failed to load some data. Please try again later.');
          } finally {
            setIsCategoriesLoading(false);
          }
        };

        // Load both in parallel
        await Promise.allSettled([loadEvents(), loadCategories()]);

        hasFetchedTags.current = true;

        // After all content is loaded, trigger network background
        setTimeout(() => {
          setShowNetworkBackground(true);
        }, 2000); // Wait 2 seconds after content is ready
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
        setIsEventsLoading(false);
        setIsCategoriesLoading(false);
      }
    };

    // Start loading after a short delay to show static content first
    setTimeout(loadData, 100);
  }, [fetchTagFavicon]);

  // Event rotation logic
  useEffect(() => {
    if (paused || events.length === 0) return;

    const rotateEvents = async () => {
      const eventContainer = document.querySelector('.events-container') as HTMLElement;

      if (eventContainer) {
        // Define our positions
        const readingPosition = {
          transform: 'none',
          opacity: 1,
          zIndex: 20,
        };

        const spawnPosition = {
          transform: 'none',
          opacity: 0,
          zIndex: 20,
        };

        const fadeOutPosition = {
          transform: 'translateY(300px)',
          opacity: 0,
          zIndex: 0,
        };

        // Start fade out from current reading position
        Object.assign(eventContainer.style, {
          ...fadeOutPosition,
          transition: 'all 1s ease-in-out',
        });

        // After fade out completes, update events and fade in at reading position
        setTimeout(async () => {
          // Get current event IDs to exclude
          const currentIds = visibleEvents.map((event) => event._id);

          // Get the index of the last visible event
          const lastVisibleIndex = events.findIndex((event) => event._id === currentIds[currentIds.length - 1]);

          // Calculate the next starting index
          let nextStartIndex = (lastVisibleIndex + 1) % events.length;

          // Get the next set of events with image duplication prevention
          let nextEvents: Event[] = [];
          const usedImageUrls = new Set<string>();
          let attempts = 0;
          const maxAttempts = events.length; // Prevent infinite loops

          while (nextEvents.length < 3 && attempts < maxAttempts) {
            const currentEvent = events[nextStartIndex];
            const currentImageUrl = currentEvent.content_images?.[0]?.image_url;

            // Skip if no image or if image is already used
            if (!currentImageUrl || usedImageUrls.has(currentImageUrl)) {
              nextStartIndex = (nextStartIndex + 1) % events.length;
              attempts++;
              continue;
            }

            // Add event and its image URL
            nextEvents.push(currentEvent);
            usedImageUrls.add(currentImageUrl);
            nextStartIndex = (nextStartIndex + 1) % events.length;
          }

          // If we couldn't find enough unique events, fall back to the original sequence
          if (nextEvents.length < 3) {
            nextEvents = [];
            nextStartIndex = (lastVisibleIndex + 1) % events.length;
            for (let i = 0; i < 3; i++) {
              const index = (nextStartIndex + i) % events.length;
              nextEvents.push(events[index]);
            }
          }

          // Only proceed if we have 3 events
          if (nextEvents.length === 3) {
            // Set new events while invisible at spawn position
            Object.assign(eventContainer.style, {
              ...spawnPosition,
              transition: 'none',
            });

            setVisibleEvents(nextEvents);

            // Small delay to ensure DOM update, then fade in at reading position
            setTimeout(() => {
              Object.assign(eventContainer.style, {
                ...readingPosition,
                transition: 'opacity 1s ease-in-out',
              });
            }, 50);
          }
        }, 1000);
      }
    };

    const interval = setInterval(rotateEvents, 8000);
    return () => clearInterval(interval);
  }, [events, visibleEvents, paused]);

  const getCategoryIcon = (type: CategoryGroup['type']) => {
    const iconClass = 'h-4 w-4 text-gray-700 dark:text-gray-200';
    switch (type) {
      case 'companies':
        return <Building2 className={iconClass} />;
      case 'financial_topics':
        return <Lightbulb className={iconClass} />;
      case 'economic_sectors':
        return <BriefcaseBusiness className={iconClass} />;
      case 'financial_data':
        return <Database className={iconClass} />;
      case 'financial_news':
        return <Newspaper className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const getTagIcon = (type: CategoryGroup['type']) => {
    const iconClass = 'h-3 w-3 mr-1 text-gray-600 dark:text-gray-300';
    switch (type) {
      case 'companies':
        return <Building2 className={iconClass} />;
      case 'financial_topics':
        return <Lightbulb className={iconClass} />;
      case 'economic_sectors':
        return <BriefcaseBusiness className={iconClass} />;
      case 'financial_data':
        return <Database className={iconClass} />;
      case 'financial_news':
        return <Newspaper className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  // Base styling
  const baseContainerClasses = `
    min-h-screen flex flex-col font-sans text-gray-900 dark:text-gray-100
    bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-black dark:to-gray-950
    relative overflow-hidden
  `;

  // Show error if there's a critical error
  if (error) {
    return (
      <div className={baseContainerClasses}>
        <div className="container mx-auto px-6 py-8 relative z-10">
          <h1 className="text-3xl font-extrabold mb-10 text-center tracking-tight text-gray-800 dark:text-gray-100 opacity-90">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-500">
              Explore Financial Universe
            </span>
          </h1>

          <div className="bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-5 py-3 rounded-lg relative shadow-sm text-sm" role="alert">
            <strong className="font-bold text-base">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <p className="mt-1 text-xs">Please refresh the page or try again later.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Lazy Network Background - only loads after content is ready */}
      {showNetworkBackground && (
        <Suspense fallback={<div className="fixed inset-0 z-0 bg-muted/50" />}>
          <LazyNetworkBackground />
        </Suspense>
      )}

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `
            radial-gradient(circle at 15% 25%, rgba(255,255,255,0.1) 0%, transparent 40%),
            radial-gradient(circle at 85% 75%, rgba(255,255,255,0.1) 0%, transparent 40%)
          `,
            opacity: '0.6',
            filter: 'blur(80px)',
          }}
        />

        <div
          className="absolute inset-0 z-0 pointer-events-none hidden dark:block"
          style={{
            background: `
            radial-gradient(circle at 20% 80%, rgba(30,30,30,0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 10%, rgba(30,30,30,0.15) 0%, transparent 40%)
          `,
            opacity: '0.4',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 relative z-20">
        <div className="flex justify-between items-center mb-4">
          {/* Navigation Menu */}
          <div className="flex items-center gap-3">
            <Link
              to="/home"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/10 border border-border/20 hover:bg-card/20 transition-all duration-200 text-sm text-foreground"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-card/10 border border-border/20 hover:bg-card/20 transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>

        <h1
          className="text-4xl md:text-6xl font-extrabold mb-8 text-center tracking-tight text-foreground opacity-95"
          style={{
            fontFamily: 'Playfair Display, Times, serif',
            letterSpacing: '0.01em',
            lineHeight: 1.1,
            paddingBottom: '50px',
          }}
        >
          <span>
            Explore Financial Universe
          </span>
        </h1>

        {/* Loading Progress Indicator */}
        {(isEventsLoading || isCategoriesLoading) && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/10 border border-border/20">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-foreground">
                Loading...
              </span>
            </div>
          </div>
        )}

        {/* Events Cards */}
        <div className="relative mb-12">
          {isEventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  <div className="w-full h-48 bg-muted animate-pulse rounded-lg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                    <div className="h-6 bg-muted-foreground/20 rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-muted-foreground/20 rounded mb-1 animate-pulse" />
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleEvents.length > 0 ? (
            <div
              className="events-container grid grid-cols-1 md:grid-cols-3 gap-6"
              style={{
                position: 'relative',
                zIndex: 20,
                transition: 'all 1s ease-in-out',
                filter: 'none',
                willChange: 'transform, opacity',
                opacity: 1,
                transform: 'none',
              }}
            >
              {visibleEvents.map((event, index) => (
                <Link
                  key={`${event._id}-${index}`}
                  to={`/tags/${encodeURIComponent(event.tag_like_title)}`}
                  className="relative rounded-xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: `
                      0 8px 32px 0 rgba(31, 38, 135, 0.2),
                      inset 0 0 0 1px rgba(255, 255, 255, 0.1),
                      inset 0 0 32px rgba(255, 255, 255, 0.05)
                    `,
                    animation: 'fadeIn 0.5s ease-out forwards',
                  }}
                  onMouseEnter={() => {
                    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
                    setPaused(true);
                  }}
                  onMouseLeave={() => {
                    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
                    pauseTimeoutRef.current = setTimeout(() => setPaused(false), 3000);
                  }}
                  onTouchStart={() => {
                    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
                    setPaused(true);
                  }}
                  onTouchEnd={() => {
                    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
                    pauseTimeoutRef.current = setTimeout(() => setPaused(false), 3000);
                  }}
                >
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    {event.content_images && event.content_images[0] && (
                      <OptImage
                        src={event.content_images[0].image_url}
                        alt={event.event_title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                      <h3 className="text-white text-lg font-semibold mb-1 line-clamp-2">
                        {event.event_title}
                      </h3>
                      <div className="relative">
                        <div
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        />
                        <p className="text-white/90 text-sm line-clamp-2 relative z-10 p-2">
                          {event.event_summary}
                        </p>
                      </div>
                      <p className="text-white/50 text-xs mt-1">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* Main Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-30">
          {categories.map((category) => (
            <div
              key={category.type}
              className="relative rounded-xl p-4 overflow-hidden group transform transition-all duration-500 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(25px) saturate(200%)',
                WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `
                  0 8px 32px 0 rgba(31, 38, 135, 0.2),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.05)
                `,
                animation: 'fadeIn 0.5s ease-out forwards',
              }}
            >

              {/* Lighting effects */}
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none block dark:hidden"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)',
                }}
              />
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none hidden dark:block"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 50%)',
                }}
              />

              {/* Category header */}
              <div className="flex items-center gap-2 mb-3 relative z-10">
                {getCategoryIcon(category.type)}
                <h2 className="text-lg font-semibold text-foreground">
                  {category.category}
                </h2>
              </div>

              {/* Tags grid */}
              <div className="grid grid-cols-2 gap-2 relative z-10">
                {isCategoriesLoading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                  ))
                ) : category.tags.length > 0 ? (
                  category.tags.map((tag) => {
                    let linkTo = '/';
                    if (category.type === 'financial_data') linkTo = `/data/${tag._id}`;
                    else if (category.type !== 'financial_news') linkTo = `/tags/${encodeURIComponent(tag.tag_name)}`;

                    const faviconUrl = tagFavicons[tag.tag_name];

                    return (
                      <Link
                        key={tag._id}
                        to={linkTo}
                        className={`
                          flex items-center gap-1.5 px-3 py-2 rounded-lg
                          bg-card/3 border border-border/8
                          hover:bg-card/10 transition-all duration-300
                          text-sm text-foreground backdrop-blur-xl
                          hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]
                        `}
                      >
                        {faviconUrl ? (
                          <OptImage
                            src={faviconUrl}
                            alt={`${tag.tag_name} icon`}
                            className="w-4 h-4 object-contain"
                            width={16}
                            height={16}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          getTagIcon(category.type)
                        )}
                        <span className="truncate">{tag.tag_name}</span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center text-muted-foreground text-sm py-4">
                    No tags available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

const styles = `
  @keyframes slideDown {
    0% {
      opacity: 0;
      transform: translateY(-100px) scale(1);
    }
    20% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.1;
      transform: translateY(0) scale(0.95);
    }
  }

  @keyframes slideToBackground {
    0% {
      opacity: 1;
      transform: translateY(0);
      z-index: 20;
    }
    50% {
      opacity: 0.5;
      transform: translateY(100px);
      z-index: 20;
    }
    100% {
      opacity: 0.1;
      transform: translateY(200px);
      z-index: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    50% {
      transform: translateX(100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  @keyframes glassPulse {
    0% {
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
    50% {
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.3),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    100% {
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2),
                  inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
  }
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default Browse;
