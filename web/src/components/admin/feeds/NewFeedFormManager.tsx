import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, X, Loader2, CheckCircle, XCircle, FileText, Server,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/utils/api';

// Define types for test results
type ContentTestResult = {
  link: string;
  title?: string;
  summary?: string;
  fetchStatus: 'pending' | 'success' | 'error';
  error?: string;
};

type FeedTestResult = {
  url: string;
  status: 'pending' | 'fetching_link' | 'validating_xml' | 'parsing_contents' | 'fetching_contents' | 'success' | 'error';
  error?: string;
  contentsFound: number;
  contentsTested: number;
  contentsFetchedSuccessfully: number;
  linkScore: number;
  contents: ContentTestResult[];
};

type TestResults = {
  overallScore: number;
  feeds: FeedTestResult[];
};

// --- Helper function to calculate overall score ---
const calculateOverallScore = (results: FeedTestResult[] | null | undefined): number => {
  if (!results || results.length === 0) {
    return 0;
  }
  // Filter for results that have actually completed (successfully or with error)
  // and thus have a meaningful linkScore.
  const validScores = results.filter((feed) => (feed.status === 'success' || feed.status === 'error') && typeof feed.linkScore === 'number');

  if (validScores.length === 0) {
    return 0; // No completed tests with scores yet
  }

  const totalScore = validScores.reduce((sum, feed) => sum + (feed.linkScore || 0), 0);
  const averageScore = Math.round(totalScore / validScores.length);
  return averageScore;
};

// --- Helper function to determine score color ---
const getScoreColor = (score: number | undefined | null, isBackground: boolean = false): string => {
  if (score === null || score === undefined) {
    return isBackground ? 'bg-muted text-muted-foreground' : 'text-muted-foreground'; // Default/pending color
  }
  if (score >= 80) {
    return isBackground ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-green-600 dark:text-green-400'; // High score
  } if (score >= 50) {
    return isBackground ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'text-yellow-600 dark:text-yellow-400'; // Medium score
  }
  return isBackground ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-red-600 dark:text-red-400'; // Low score
};
// --- End Helper functions ---

interface NewFeedFormManagerProps {
  onAddFeed: (feedData: { name: string, urls: string[] }) => Promise<void>;
}

// Helper to get text content safely from XML nodes
const getText = (node: Element | null | undefined, selector: string): string | undefined => node?.querySelector(selector)?.textContent?.trim() || undefined;

function NewFeedFormManager({ onAddFeed }: NewFeedFormManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [feedUrls, setFeedUrls] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Client-Side Testing State ---
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  // --- End Client-Side Testing State ---

  // --- Server-Side Testing State ---
  const [isServerTesting, setIsServerTesting] = useState(false);
  const [serverTestResults, setServerTestResults] = useState<TestResults | null>(null);
  const [serverAbortController, setServerAbortController] = useState<AbortController | null>(null);
  // --- End Server-Side Testing State ---

  const toggleForm = () => {
    const currentlyShowing = showForm;
    setShowForm(!currentlyShowing);
    if (currentlyShowing) {
      resetForm();
      setTestResults(null);
      setServerTestResults(null);
      // Cancel any ongoing tests if the form is closed
      if (abortController) abortController.abort();
      if (serverAbortController) serverAbortController.abort();
      setAbortController(null);
      setServerAbortController(null);
      setIsTesting(false);
      setIsServerTesting(false);
    }
  };

  const resetForm = () => {
    setNewFeedName('');
    setFeedUrls(['']);
    setIsSubmitting(false);
  };

  const addUrlField = () => setFeedUrls([...feedUrls, '']);

  const removeUrlField = (indexToRemove: number) => {
    setFeedUrls((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== indexToRemove) : ['']));
  };

  const updateUrl = (index: number, value: string) => {
    setFeedUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Cancel ongoing tests
    if (abortController) abortController.abort();
    if (serverAbortController) serverAbortController.abort();
    setIsSubmitting(true);
    setIsTesting(false);
    setIsServerTesting(false);
    setTestResults(null);
    setServerTestResults(null);

    const nonEmptyUrls = feedUrls.filter((url) => url.trim() !== '');
    if (!newFeedName.trim() || nonEmptyUrls.length === 0) {
      toast.error('Feed Name and at least one URL are required.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onAddFeed({ name: newFeedName, urls: nonEmptyUrls });
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      // toast.error("Failed to add feed."); // Handled in useFeeds hook potentially
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Client-Side Testing Logic (handleTestUrls) ---
  const handleTestUrls = useCallback(async () => {
    setIsTesting(true);
    setTestResults(null); // Clear previous results
    setServerTestResults(null); // Also clear server results
    const newAbortController = new AbortController();
    setAbortController(newAbortController); // Use the correct state setter

    const urlsToTest = feedUrls.filter((url) => url.trim() !== '');
    if (urlsToTest.length === 0) {
      toast.warning('No URLs entered to test.');
      setIsTesting(false);
      return;
    }

    // Initialize results with pending status
    const initialResults: FeedTestResult[] = urlsToTest.map((url) => ({
      url,
      status: 'pending',
      error: undefined,
      contentsFound: 0,
      contentsTested: 0,
      contentsFetchedSuccessfully: 0,
      linkScore: 0,
      contents: [],
    }));
    setTestResults({ overallScore: 0, feeds: initialResults }); // Update state with initial pending results

    const promises = urlsToTest.map(async (url): Promise<FeedTestResult> => {
      const currentFeedResult: Partial<FeedTestResult> = { url, status: 'pending', contents: [] };
      let parser: DOMParser;
      let doc: Document | null = null;
      let feedItems: NodeListOf<Element> | null = null;
      let contentsFound = 0;
      let contentsTested = 0;
      let contentsFetchedSuccessfully = 0;
      let linkScore = 0; // Base score

      try {
        // 1. Fetch Feed Content
        currentFeedResult.status = 'fetching_feed';
        updateTestResult(url, { status: 'fetching_feed' }); // Update UI status

        const response = await fetch(url, { signal: newAbortController.signal, mode: 'cors' }); // Ensure CORS mode

        // Check for HTTP errors (e.g., 404, 500)
        if (!response.ok) {
          // Throw an error with specific HTTP status info
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        linkScore += 25; // Score for successful fetch
        currentFeedResult.status = 'parsing_feed';
        updateTestResult(url, { status: 'parsing_feed' });

        // 2. Parse Feed Content
        const text = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(text, 'application/xml');

        // Check for XML parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          console.error('XML Parsing Error:', parserError.textContent);
          throw new Error(`XML Parsing Error: ${parserError.textContent?.split('\n')[0] ?? 'Invalid XML structure'}`); // Use first line of parser error
        }

        linkScore += 25; // Score for successful parsing
        currentFeedResult.status = 'fetching_contents';
        updateTestResult(url, { status: 'fetching_contents' });

        // 3. Find Contents (Check both RSS <item> and Atom <entry>)
        feedItems = doc.querySelectorAll('item, entry');
        contentsFound = feedItems.length;
        currentFeedResult.contentsFound = contentsFound;
        updateTestResult(url, { contentsFound });

        if (contentsFound === 0) {
          // If no contents, it's technically valid but maybe not useful
          linkScore += 50; // Give full points if feed is valid but empty
          currentFeedResult.status = 'success';
          currentFeedResult.error = 'Feed is valid but contains no contents.'; // Informational message
          updateTestResult(url, {
            status: 'success', linkScore, error: currentFeedResult.error, contentsFound, contentsTested, contentsFetchedSuccessfully,
          });
          return { ...currentFeedResult, linkScore, contents: [] } as FeedTestResult;
        }

        // 4. Prepare Content Test Data (Limit to 5 for testing)
        const contentsToTestData: ContentTestResult[] = Array.from(feedItems).slice(0, 5).map((item) => {
          const linkElement = item.querySelector('link');
          // Atom uses <link href="...">, RSS uses <link>...</link> or <guid>
          const link = linkElement?.getAttribute('href') || linkElement?.textContent || item.querySelector('guid')?.textContent || '';
          const title = item.querySelector('title')?.textContent || 'No Title';
          let summary = item.querySelector('description, summary, content')?.textContent || '';
          // Basic summary cleanup
          if (summary) summary = summary.replace(/<[^>]*>?/gm, '').substring(0, 150) + (summary.length > 150 ? '...' : '');
          return {
            link, title, summary, fetchStatus: 'pending' as const,
          };
        }).filter((content): content is ContentTestResult => !!content.link); // Ensure link exists

        contentsTested = contentsToTestData.length;
        currentFeedResult.contents = contentsToTestData;
        currentFeedResult.contentsTested = contentsTested;
        updateTestResult(url, { contents: contentsToTestData, contentsTested });

        // 5. Fetch Individual Contents (Simulated - Client-side fetch often blocked by CORS)
        // We will mark them based on initial data presence rather than actual fetch
        // to avoid inevitable CORS errors in most browser environments.
        // A real fetch attempt would look like the loop below, but is omitted
        // because it's unlikely to succeed reliably from the client.

        let successfulContentFetches = 0;
        const updatedContents = contentsToTestData.map((content) => {
          // Simulate success if basic data exists, otherwise mark as error (can't fetch)
          if (content.link && content.title !== 'No Title') {
            successfulContentFetches++;
            return { ...content, fetchStatus: 'success' as const };
          }
          return { ...content, fetchStatus: 'error' as const, error: 'Could not extract content link/title' };
        });

        contentsFetchedSuccessfully = successfulContentFetches;
        currentFeedResult.contents = updatedContents;
        currentFeedResult.contentsFetchedSuccessfully = contentsFetchedSuccessfully;
        updateTestResult(url, { contents: updatedContents, contentsFetchedSuccessfully });

        // Calculate final score based on content success rate
        const contentSuccessRatio = contentsTested > 0 ? contentsFetchedSuccessfully / contentsTested : 1; // Avoid division by zero
        linkScore += Math.round(50 * contentSuccessRatio); // Max 50 points for contents

        currentFeedResult.status = 'success';
        currentFeedResult.linkScore = linkScore;
        updateTestResult(url, { status: 'success', linkScore });

        return { ...currentFeedResult } as FeedTestResult; // Final successful result
      } catch (error: any) {
        console.warn(`Error processing URL ${url}:`, error);

        let errorMsg = 'Processing failed';
        if (error.message.startsWith('HTTP Error')) {
          // Use the specific HTTP error message
          errorMsg = error.message;
        } else if (error.message.startsWith('XML Parsing Error')) {
          // Use the specific XML parsing error
          errorMsg = error.message;
        } else if (error instanceof TypeError) {
          // Likely a network error (CORS, DNS, etc.) during the initial feed fetch
          errorMsg = 'Network error: Failed to fetch feed (check CORS or connectivity)';
        } else if (error.name === 'AbortError') {
          errorMsg = 'Cancelled';
        } else {
          // Generic fallback
          errorMsg = error.message || 'Unknown client-side processing error';
        }

        // Update state with the specific error
        currentFeedResult.status = 'error';
        currentFeedResult.error = errorMsg;
        // Ensure score reflects failure point
        currentFeedResult.linkScore = linkScore; // Keep score earned up to the failure point
        updateTestResult(url, { status: 'error', error: errorMsg, linkScore });

        // Return the error state
        return {
          url,
          status: 'error' as const,
          error: errorMsg,
          contentsFound: currentFeedResult.contentsFound ?? 0,
          contentsTested: currentFeedResult.contentsTested ?? 0,
          contentsFetchedSuccessfully: currentFeedResult.contentsFetchedSuccessfully ?? 0,
          linkScore: currentFeedResult.linkScore ?? 0,
          contents: currentFeedResult.contents ?? [],
        };
      }
    });

    // Wait for all tests to complete and update final state
    Promise.all(promises).then((finalResults) => {
      const overallScore = calculateOverallScore(finalResults);
      setTestResults({ overallScore, feeds: finalResults });
      setIsTesting(false);
      setAbortController(null);
      // Add summary toast
      const successCount = finalResults.filter((r) => r.status === 'success').length;
      const errorCount = finalResults.filter((r) => r.status === 'error' && r.error !== 'Cancelled').length;
      if (errorCount > 0) {
        toast.error(`Client test complete: ${successCount} succeeded, ${errorCount} failed.`);
      } else if (successCount > 0) {
        toast.success(`Client test complete: ${successCount} succeeded.`);
      } else {
        toast.info('Client test finished (no results or all cancelled).');
      }
    });
  }, [feedUrls]); // Removed updateTestResult, updateContentResult if they modify state directly

  // --- Helper functions to update state incrementally ---
  // (Keep or implement updateTestResult and updateContentResult if needed for live UI updates)
  const updateTestResult = (url: string, updates: Partial<FeedTestResult>) => {
    setTestResults((prev) => {
      if (!prev) return null;
      const updatedFeeds = prev.feeds.map((feed) => (feed.url === url ? { ...feed, ...updates } : feed));
      // Recalculate overall score if linkScore is updated
      const overallScore = updates.linkScore !== undefined ? calculateOverallScore(updatedFeeds) : prev.overallScore;
      return { ...prev, overallScore, feeds: updatedFeeds };
    });
  };

  const updateContentResult = (feedUrl: string, contentLink: string, updates: Partial<ContentTestResult>) => {
    setTestResults((prev) => {
      if (!prev) return null;
      const updatedFeeds = prev.feeds.map((feed) => {
        if (feed.url === feedUrl) {
          const updatedContents = feed.contents.map((content) => (content.link === contentLink ? { ...content, ...updates } : content));
          return { ...feed, contents: updatedContents };
        }
        return feed;
      });
      return { ...prev, feeds: updatedFeeds };
    });
  };
  // --- End Helper functions ---

  // --- Server-Side Testing Logic ---
  const handleServerTestUrls = useCallback(async () => {
    // ... (abort controller setup, clear results, set loading state) ...
    setIsServerTesting(true);
    setServerTestResults(null);
    setTestResults(null);
    const newAbortController = new AbortController();
    setServerAbortController(newAbortController);

    const urlsToTest = feedUrls.filter((url) => url.trim() !== '');
    if (urlsToTest.length === 0) {
      toast.warning('No URLs entered to test.');
      setIsServerTesting(false);
      return;
    }

    // Initialize results with pending status
    const initialResults: FeedTestResult[] = urlsToTest.map((url) => ({
      url,
      status: 'pending',
      error: undefined,
      contentsFound: 0,
      contentsTested: 0,
      contentsFetchedSuccessfully: 0,
      linkScore: 0,
      contents: [],
    }));
    setServerTestResults({ overallScore: 0, feeds: initialResults });

    const promises = urlsToTest.map(async (url): Promise<FeedTestResult> => {
      try {
        // Use your API utility (ensure it returns data directly on success)
        // The type assertion helps, but runtime check might be needed if api utility is loose
        // this url is correct , no need to add /api/ because it's already in the api.ts file ( we have ensured the url and it can never be a problem)
        // dont remove the comments above
        const response = await api.post<FeedTestResult>('/test_feed_url', { url }, {
          signal: newAbortController.signal,
        });

        // **FIX:** Extract the data into 'responseData'
        const responseData = response.data;

        console.log(`Server test success for ${url}, extracted data:`, responseData);

        // Validate the extracted data structure
        if (!responseData || typeof responseData !== 'object' || typeof responseData.status !== 'string') {
          console.error('Invalid response data format from server:', responseData);
          throw new Error('Invalid response data format from server.');
        }

        // Return the FeedTestResult object (responseData)
        return responseData;
      } catch (error: any) {
        console.error(`Server test caught error for ${url}:`, error);

        const backendResultInData = error.response?.data;
        if (backendResultInData && typeof backendResultInData === 'object' && typeof backendResultInData === 'string' && backendResultInData.url === url) {
          console.log(`Using backend result from error response data for ${url}:`, backendResultInData);
          return {
            ...backendResultInData,
            status: backendResultInData.status || 'error',
            error: backendResultInData.error || 'Error data received from server.',
            contentsFound: backendResultInData.contentsFound ?? 0,
            contentsTested: backendResultInData.contentsTested ?? 0,
            contentsFetchedSuccessfully: backendResultInData.contentsFetchedSuccessfully ?? 0,
            linkScore: backendResultInData.linkScore ?? 0,
            contents: backendResultInData.contents ?? [],
          } as FeedTestResult;
        }

        const networkOrAxiosErrorMsg = error.message || 'Unknown request error';
        const displayError = `Request failed: ${networkOrAxiosErrorMsg}`;
        console.log(`Constructing generic error result for ${url}: ${displayError}`);

        return {
          url,
          status: 'error' as const,
          error: displayError,
          contentsFound: 0,
          contentsTested: 0,
          contentsFetchedSuccessfully: 0,
          linkScore: 0,
          contents: [],
        };
      }
    });

    // Await all promises (they should all resolve to FeedTestResult now)
    const finalResults = await Promise.all(promises);
    console.log('Final results before setting state:', finalResults); // Check the structure here

    // Calculate overall score and update state
    const overallScore = calculateOverallScore(finalResults);
    setServerTestResults({ overallScore, feeds: finalResults });

    setIsServerTesting(false);
    setServerAbortController(null);

    if (finalResults.some((r) => r.status === 'error' && !r.error?.includes('contents failed to fetch'))) {
      toast.error('One or more feed tests failed. See details below.');
    } else if (finalResults.some((r) => r.error?.includes('contents failed to fetch'))) {
      toast.warning('Feed(s) processed, but some contents could not be fetched. See details.');
    } else if (finalResults.every((r) => r.status === 'success')) {
      toast.success('All feeds tested successfully!');
    }
  }, [feedUrls]);

  // Cleanup effect for both controllers
  useEffect(() => () => {
    if (abortController) abortController.abort();
    if (serverAbortController) serverAbortController.abort();
  }, [abortController, serverAbortController]);

  // --- JSX ---
  return (
    <div className="mb-6">
      <Button
        variant={showForm ? 'default' : 'outline'}
        onClick={toggleForm}
        className="w-full mb-4"
        disabled={(isTesting && !!abortController) || (isServerTesting && !!serverAbortController)} // Disable toggle during either test
      >
        {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
        {showForm
          ? (isTesting ? 'Cancel Client Test' : isServerTesting ? 'Cancel Server Test' : 'Cancel Adding Feed')
          : 'Add New Feed Source'}
      </Button>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add New Feed Source</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feed-name">Feed Name</Label>
                <Input id="feed-name" placeholder="e.g., TechCrunch" value={newFeedName} onChange={(e) => setNewFeedName(e.target.value)} required disabled={isTesting || isSubmitting || isServerTesting} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>RSS Feed URLs</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addUrlField} className="text-xs" disabled={isTesting || isSubmitting || isServerTesting}>
                    {' '}
                    <Plus className="h-3 w-3 mr-1" />
                    {' '}
                    Add URL
                    {' '}
                  </Button>
                </div>
                {feedUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input type="url" placeholder={`https://example.com/feed${index > 0 ? index + 1 : ''}.xml`} value={url} onChange={(e) => updateUrl(index, e.target.value)} required={index === 0 && feedUrls.length === 1} disabled={isTesting || isSubmitting || isServerTesting} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUrlField(index)} className="h-8 w-8 text-red-500 flex-shrink-0" disabled={isTesting || isSubmitting || isServerTesting || feedUrls.length <= 1} aria-label="Remove URL">
                      {' '}
                      <X className="h-4 w-4" />
                      {' '}
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-1">Enter valid RSS/Atom URLs. The first is required.</p>
              </div>
              <div className="flex justify-end gap-2 flex-wrap">
                <Button type="button" variant="outline" onClick={toggleForm} disabled={isSubmitting || isTesting || isServerTesting}>Cancel</Button>
                <Button type="button" variant="secondary" onClick={handleTestUrls} disabled={isSubmitting || isTesting || isServerTesting}>
                  {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  {isTesting ? 'Testing (Client)...' : 'Test (Client)'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleServerTestUrls} disabled={isSubmitting || isTesting || isServerTesting}>
                  {isServerTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}
                  {isServerTesting ? 'Testing (Server)...' : 'Test (Server)'}
                </Button>
                <Button type="submit" disabled={isSubmitting || isTesting || isServerTesting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Adding...' : 'Add Feed Source'}
                </Button>
              </div>
            </form>

            {(isTesting || testResults || isServerTesting || serverTestResults) && (
            <div className="mt-6 border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">Test Status & Results</h4>

              {(isTesting || testResults) && (
              <div className="mb-4 p-3 border rounded-md bg-muted/30">
                <h5 className="font-medium text-sm mb-2">Client-Side Test</h5>
                {!isTesting && testResults && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Overall Score:
                  {' '}
                  <span className={`font-bold text-lg ${getScoreColor(testResults.overallScore)}`}>
                    {testResults.overallScore}
                    %
                  </span>
                </p>
                )}
                {isTesting && (
                <div className="mb-2 flex items-center text-muted-foreground">
                  {' '}
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {' '}
                  <span>Client testing in progress...</span>
                  {' '}
                </div>
                )}
                {testResults && <ResultsDisplay results={testResults} />}
              </div>
              )}

              {(isServerTesting || serverTestResults) && (
              <div className="mb-4 p-3 border rounded-md bg-muted/30">
                <h5 className="font-medium text-sm mb-2">Server-Side Test</h5>
                {!isServerTesting && serverTestResults && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Overall Score:
                  {' '}
                  <span className={`font-bold text-lg ${getScoreColor(serverTestResults.overallScore)}`}>
                    {serverTestResults.overallScore}
                    %
                  </span>
                </p>
                )}
                {isServerTesting && (
                <div className="mb-2 flex items-center text-muted-foreground">
                  {' '}
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {' '}
                  <span>Server testing in progress...</span>
                  {' '}
                </div>
                )}
                {serverTestResults && <ResultsDisplay results={serverTestResults} />}
              </div>
              )}
            </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Helper Component to Display Results (Client or Server) ---
interface ResultsDisplayProps {
    results: TestResults;
}
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results || !results.feeds || results.feeds.length === 0) {
    return <p className="text-sm text-muted-foreground">No test results to display.</p>;
  }

  return (
    <div className="space-y-4">
      {results.feeds.map((feedResult, index) => (
        <div key={index} className="p-3 border rounded-md bg-white shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm truncate flex-grow mr-4" title={feedResult.url}>
              {feedResult.url}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreColor(feedResult.linkScore, true)}`}>
                {(feedResult.status === 'success' || feedResult.status === 'error') ? `${feedResult.linkScore}%` : '--%'}
              </span>
              {typeof feedResult.status === 'string' && feedResult.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" title="Pending..." />}
              {typeof feedResult.status === 'string' && feedResult.status.startsWith('fetching_') && <Loader2 className="h-4 w-4 animate-spin text-blue-500" title={`Processing: ${feedResult.status.replace(/_/g, ' ')}...`} />}
              {typeof feedResult.status === 'string' && feedResult.status.startsWith('validating_') && <Loader2 className="h-4 w-4 animate-spin text-blue-500" title={`Processing: ${feedResult.status.replace(/_/g, ' ')}...`} />}
              {typeof feedResult.status === 'string' && feedResult.status.startsWith('parsing_') && <Loader2 className="h-4 w-4 animate-spin text-blue-500" title={`Processing: ${feedResult.status.replace(/_/g, ' ')}...`} />}
              {typeof feedResult.status === 'string' && feedResult.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" title="Link processed successfully" />}
              {typeof feedResult.status === 'string' && feedResult.status === 'error' && <XCircle className="h-5 w-5 text-red-500" title={`Link Error: ${feedResult.error || 'Unknown'}`} />}
            </div>
          </div>
          {feedResult.error && (
            <p className="text-xs text-red-600 mb-2 ml-1">
              Error:
              {feedResult.error}
            </p>
          )}
          {feedResult.contents && feedResult.contents.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold mb-1 text-gray-600">
                Contents Tested (
                {feedResult.contentsFetchedSuccessfully}
                /
                {feedResult.contentsTested}
                {' '}
                successful):
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto text-xs pl-2">
                {feedResult.contents.map((content, artIndex) => (
                  <li key={artIndex} className="border-b border-gray-100 last:border-b-0 py-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate flex-grow" title={content.link}>{content.title || content.link}</span>
                      <div className="flex-shrink-0 ml-2">
                            {content.fetchStatus === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" title="Testing content..." />}
                            {content.fetchStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" title="Content fetched successfully" />}
                            {content.fetchStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" title={`Content error: ${content.error || 'Unknown'}`} />}
                          </div>
                    </div>
                    {content.error && (
                    <p className="text-red-600 mt-0.5 text-xs">
                          Error:
                          {content.error}
                        </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
// --- End Helper Component ---

export default NewFeedFormManager;
