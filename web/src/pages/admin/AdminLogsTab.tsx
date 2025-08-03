import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import {
  AlertCircle, ScrollText, ArrowUp, ArrowDown, FileDown, Copy, Crosshair, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import TabContent from '@/components/admin/TabContent';
import api from '@/utils/api';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/common/SearchInput';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import copy from 'copy-to-clipboard';

interface LogLine {
    content: string;
    number: number; // Actual line number from backend
}

function AdminLogsTab() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linesToLoad, setLinesToLoad] = useState(100);
  const [direction, setDirection] = useState<'head' | 'tail'>('tail');
  const [totalLines, setTotalLines] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();
  const [currentViewMode, setCurrentViewMode] = useState<'tail' | 'head' | 'search' | 'context'>('tail');
  const isFetchingContextRef = useRef(false); // Ref to track if a context fetch is in progress
  const [highlightLineNumber, setHighlightLineNumber] = useState<number | null>(null); // New state for highlighted line

  const fetchLogs = useCallback(async (
    lines: number,
    directionParam: 'head' | 'tail' | 'context' | 'search',
    searchQueryParam: string,
    caseSensitiveParam: boolean,
    wholeWordParam: boolean,
    contextLine?: number,
  ) => {
    if (directionParam === 'context' && contextLine) {
      isFetchingContextRef.current = true;
      setHighlightLineNumber(contextLine);
    } else {
      setHighlightLineNumber(null);
    }
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/admin/logs?lines=${lines}&direction=${directionParam}`
                + `&search=${encodeURIComponent(searchQueryParam)}`
                + `&case_sensitive=${caseSensitiveParam}`
                + `&whole_word=${wholeWordParam}${
                  contextLine ? `&context_line=${contextLine}` : ''}`,
      );

      setLogs(response.data.logs.map((line: any) => ({
        content: line.content || line.line || '',
        number: line.number || 0,
      })));
      setCurrentViewMode(response.data.direction as 'tail' | 'head' | 'search' | 'context');
      setTotalLines(response.data.total_lines || 0);
      setMatchCount(response.data.match_count || 0);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to fetch logs');
      if (directionParam === 'context') {
        setHighlightLineNumber(null);
      }
    } finally {
      setIsLoading(false);
      if (directionParam === 'context') {
        isFetchingContextRef.current = false;
      }
    }
  }, []);

  // Initial fetch: Use a fixed initial number or the initial state of linesToLoad.
  // This useEffect should run ONCE on mount.
  useEffect(() => {
    // Fetch initial logs with the default linesToLoad value
    fetchLogs(linesToLoad, 'tail', '', false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLogs]); // fetchLogs is stable due to useCallback. linesToLoad here refers to its initial state.

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);



  // Effect for fetching based on debounced search query
  useEffect(() => {
    if (isFetchingContextRef.current) {
      return;
    }

    if (debouncedSearchQuery) {
      fetchLogs(linesToLoad, 'search', debouncedSearchQuery, caseSensitive, wholeWord);
    } else if (!debouncedSearchQuery && currentViewMode === 'search') {
      // If search was cleared FROM search mode
      if (searchQuery === '') {
        fetchLogs(linesToLoad, 'tail', '', caseSensitive, wholeWord);
      }
    }
    // This effect re-runs if linesToLoad changes AND a search is active or was just cleared.
  }, [debouncedSearchQuery, caseSensitive, wholeWord, currentViewMode, searchQuery, linesToLoad, fetchLogs]);

  const handleChangeLinesToLoad = useCallback((numLines: number) => {
    setLinesToLoad(numLines); // Update the state

    // Determine the appropriate direction and search query for the fetch
    let directionForFetch: 'head' | 'tail' | 'search' = 'tail'; // Default to tail
    let searchQueryForFetch = '';

    if (debouncedSearchQuery) { // If a search is active (or was just active)
      directionForFetch = 'search';
      searchQueryForFetch = debouncedSearchQuery;
    } else if (currentViewMode === 'head' || currentViewMode === 'tail') {
      // If no search, but in head or tail mode, maintain that direction
      directionForFetch = currentViewMode;
    }
    // If currentViewMode was 'context', changing linesToLoad will switch
    // to 'tail' (or 'search' if debouncedSearchQuery had a value).
    // fetchLogs will handle clearing highlightLineNumber if direction is not 'context'.

    fetchLogs(numLines, directionForFetch, searchQueryForFetch, caseSensitive, wholeWord);
  }, [debouncedSearchQuery, currentViewMode, caseSensitive, wholeWord, fetchLogs]);

  // Add regex escape function
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const getHighlightedText = (text: string) => {
    if (!searchQuery || typeof text !== 'string') return text;

    const escapedQuery = escapeRegExp(searchQuery);
    let regexPattern: string;

    if (wholeWord) {
      // Use word boundary detection that works with special characters
      regexPattern = `(?<!\\w)${escapedQuery}(?!\\w)`;
    } else {
      regexPattern = escapedQuery;
    }

    const regex = new RegExp(`(${regexPattern})`, caseSensitive ? 'g' : 'gi');

    return text.replace(regex, '<span class="highlight-match bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">$1</span>');
  };

  // Add click handler to log lines
  const handleLogLineClick = useCallback((lineNumber: number) => {
    // Explicitly clear all search-related states
    setSearchQuery('');
    setDebouncedSearchQuery(''); // Also clear debounced query immediately
    setCaseSensitive(false);
    setWholeWord(false);

    // Directly call fetchLogs for context with an EMPTY searchQueryParam
    fetchLogs(100, 'context', '', false, false, lineNumber);
  }, [fetchLogs]);

  const handleShowErrorsClick = useCallback(() => {
    setSearchQuery('stack trace'); // Set the desired search term for errors
    setCaseSensitive(false); // Typically, error searches are case-insensitive
    // setWholeWord(false;    // Adjust if needed

    // The existing useEffect that watches debouncedSearchQuery
    // will automatically trigger a fetch with direction 'search'.
    // No need to call fetchLogs directly here.
  }, []);

  const handleDownloadLogs = async () => {
    toast.info('Preparing log file for download...');
    try {
      const response = await api.get('/admin/logs?download=true', {
        responseType: 'blob', // Important to get the file content as a blob
      });

      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;

      // Generate filename: window.origin + _ + logs + _ + date and hour . log
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const origin = window.location.origin.replace(/https?:\/\//, '').replace(/[:.]/g, '_');
      const filename = `${origin}_logs_${dateStr}_${timeStr}.log`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Log file download started as ${filename}`);
    } catch (err: any) {
      console.error('Error downloading logs:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to download logs');
    }
  };

  return (
    <TabContent
      title="System Logs"
      description="View recent application logs for debugging and monitoring"
      icon={<ScrollText className="h-5 w-5 text-primary" />}
    >
      <div className="p-6 border border-border rounded-lg bg-card shadow-sm">
        {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Search logs..."
                value={searchQuery}
                onSearchChange={setSearchQuery}
                debounceDelay={500}
                className="flex-1 border-border bg-background text-foreground placeholder:text-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowErrorsClick}
                className="border-border bg-background hover:bg-muted"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Show Errors
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                      id="case-sensitive"
                      checked={caseSensitive}
                      onCheckedChange={(checked) => {
                          setCaseSensitive(checked);
                          fetchLogs(linesToLoad, direction, searchQuery, checked, wholeWord, highlightLineNumber);
                        }}
                      className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                  <Label htmlFor="case-sensitive" className="text-sm text-foreground">
                      Match Case
                                    </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                      id="whole-word"
                      checked={wholeWord}
                      onCheckedChange={(checked) => {
                          setWholeWord(checked);
                          fetchLogs(linesToLoad, direction, searchQuery, caseSensitive, checked, highlightLineNumber);
                        }}
                      className="border-border bg-background text-primary focus:ring-primary focus:ring-offset-background"
                    />
                  <Label htmlFor="whole-word" className="text-sm text-foreground">
                      Whole Word
                                    </Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                      if (window.confirm('Clear all logs? This cannot be undone.')) {
                        try {
                          await api.delete('/admin/logs');
                          setLogs([]);
                          setTotalLines(0);
                          toast.success('Logs cleared successfully');
                        } catch (err) {
                          toast.error('Failed to clear logs');
                        }
                      }
                    }}
                  variant="destructive"
                  size="sm"
                  className="bg-destructive hover:bg-destructive/90"
                >
                                  Clear Logs
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-stretch gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={linesToLoad === 100 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleChangeLinesToLoad(100)}
                className={linesToLoad === 100 ? 'bg-secondary text-secondary-foreground' : 'border-border bg-background hover:bg-muted'}
              >
                100 Lines
              </Button>
              <Button
                variant={linesToLoad === 500 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleChangeLinesToLoad(500)}
                className={linesToLoad === 500 ? 'bg-secondary text-secondary-foreground' : 'border-border bg-background hover:bg-muted'}
              >
                500 Lines
              </Button>
              <Button
                variant={linesToLoad === 1000 ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleChangeLinesToLoad(1000)}
                className={linesToLoad === 1000 ? 'bg-secondary text-secondary-foreground' : 'border-border bg-background hover:bg-muted'}
              >
                1000 Lines
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={direction}
                onValueChange={(val: 'head' | 'tail') => setDirection(val)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px] border-border bg-background">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tail">
                      <div className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          End of File (Most Recent)
                                        </div>
                    </SelectItem>
                  <SelectItem value="head">
                      <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4" />
                          Start of File (Oldest)
                                        </div>
                    </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => fetchLogs(linesToLoad, direction, searchQuery, caseSensitive, wholeWord, highlightLineNumber)}
                disabled={isLoading}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                                    </>
                ) : (
                  'Refresh'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
                disabled={isLoading}
                className="flex-1 sm:flex-none border-border bg-background hover:bg-muted"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download Logs
              </Button>
            </div>
          </div>
        </div>

        {totalLines > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          Showing
          {' '}
          {logs.length}
          {' '}
          lines from
          {direction === 'tail' ? 'end' : 'start'}
          {' '}
          of
          {totalLines}
          {' '}
          total lines
        </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="font-mono text-sm bg-muted p-4 rounded-md max-h-[70vh] overflow-auto border border-border">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs found</p>
            ) : (
              logs.map((line, index) => (
                <div
                    key={index}
                    className={`
                                        flex justify-between items-start group
                                        py-1 px-2 rounded-sm
                                        ${line.content === '....'
                        ? 'text-muted-foreground italic text-xs my-1'
                        : index % 2 === 0
                          ? 'bg-muted/50'
                          : 'bg-background'
                                        }
                                        ${currentViewMode === 'context' && line.number === highlightLineNumber
                                          ? 'bg-yellow-200 dark:bg-yellow-800 font-semibold' // Highlight style
                                          : ''
                                        }
                                    `}
                  >
                    {line.content === '....' ? (
                        '....'
                      ) : (
                          <>
                              <div className="flex-grow mr-2 min-w-0">
                                <span className="text-muted-foreground mr-4">
                                    #
{line.number}
                                  </span>
                                <span
                                    className="text-foreground whitespace-pre-wrap break-words"
                                    dangerouslySetInnerHTML={{
                                        __html: getHighlightedText(line.content),
                                      }}
                                  />
                              </div>
                              <div className="flex items-center shrink-0">
                                <button
                                    className="ml-2 p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 focus:opacity-100 text-muted-foreground hover:text-foreground"
                                    title="Copy log line"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const success = copy(line.content, {
                                          format: 'text/plain',
                                          onCopy: () => {
                                            toast.success('Log line copied!');
                                          }
                                        });
                                        
                                        if (!success) {
                                          toast.error('Failed to copy log line');
                                        }
                                      }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                <button
                                    className="ml-1 p-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 focus:opacity-100 text-muted-foreground hover:text-foreground"
                                    title="Show context"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (line.content !== '....' && line.number > 0) {
                                          handleLogLineClick(line.number);
                                        }
                                      }}
                                  >
                                    <Crosshair className="h-4 w-4" />
                                  </button>
                              </div>
                            </>
                      )}
                  </div>
              ))
            )}
          </div>
        )}
      </div>
    </TabContent>
  );
}

export default AdminLogsTab;
