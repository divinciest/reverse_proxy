import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';
import HeaderEx from '@/components/layout/HeaderEx';
import NewsFeed from '@/components/features/NewsFeed';
import Footer from '@/components/layout/Footer';
import TrendingContentSection from '@/components/features/TrendingContentSection';
import WorldHeatmapSection from '@/components/features/WorldHeatmapSection';
import { useAuth } from '@/hooks/useAuthHook';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FeedSource } from '@/types/shared';
import { feedService } from '@/utils/services/feedService';
import SourcesSection from '@/components/features/SourcesSection';
import TrendingCompanies from '@/components/features/TrendingCompanies';
import CurrentCountryDisplay from '@/components/features/CurrentCountryDisplay';
import EventsSection from '@/components/features/EventsSection';
import { useDarkMode } from '@/hooks/useDarkMode';
import EventsFeed from '@/components/features/EventsFeed';
import CompactNewsFeed from '@/components/features/CompactNewsFeed';

function Index() {
  const { isAuthenticated } = useAuth();
  const [apiCheckError, setApiCheckError] = useState<string | null>(null);
  const { isDarkMode } = useDarkMode();

  console.log('rendring index');
  const checkApi = useCallback(async () => {
    setApiCheckError(null);
    let popularFeeds: FeedSource[] = [];
    let checkUrlToUse: string | null = null;

    try {
      console.log('Performing initial API check...');
      popularFeeds = await feedService.getPopularFeeds();
      if (popularFeeds.length > 0 && popularFeeds[0].urls && popularFeeds[0].urls.length > 0) {
        checkUrlToUse = popularFeeds[0].urls[0];
      } else {
        console.warn('No popular feeds found for API check.');
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.warn('Initial API check timed out:', error.message);
        setApiCheckError('Initial API check timed out (30s).');
      } else {
        console.error('Initial API check failed:', error.response?.data || error.message);
        const backendError = error.response?.data?.error;
        setApiCheckError(`Initial API check failed: ${backendError || error.message || 'Could not connect'}`);
      }
    }
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeaderEx />

      <div className="w-full px-2 py-2">
        {apiCheckError && (
          <Alert variant="destructive" className="mb-3 mx-2 border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Connection Issue</AlertTitle>
            <AlertDescription>{apiCheckError}</AlertDescription>
          </Alert>
        )}

        {/* Main content grid with flipped layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
          {/* Left sidebar - Trending Content and World Heatmap */}
          <div className="xl:col-span-3 space-y-3">
            <TrendingContentSection />
            <WorldHeatmapSection darkMode={isDarkMode} />
          </div>

          {/* Main content area - Events Feed */}
          <main className="xl:col-span-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-3">
              <EventsFeed />
            </div>
          </main>

          {/* Right sidebar - News Feed, Current Country, Trending Companies, Sources */}
          <aside className="xl:col-span-3 space-y-3">
            <div className="bg-card rounded-lg shadow-sm border border-border p-3">
              <CompactNewsFeed maxContents={4} />
            </div>
            <CurrentCountryDisplay />
            <TrendingCompanies />
            <SourcesSection />
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Index;
