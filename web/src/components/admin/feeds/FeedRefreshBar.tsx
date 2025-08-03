import React from 'react';
import { Clock, Loader2, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatLastFetch } from '@/utils/feedUtils';

interface FeedRefreshBarProps {
  lastAutoFetch: Date | null;
  isFetching: boolean;
  onRefresh: () => void;
}

const FeedRefreshBar: React.FC<FeedRefreshBarProps> = ({
  lastAutoFetch,
  isFetching,
  onRefresh,
}) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center text-sm text-muted-foreground">
      <Clock className="h-4 w-4 mr-2" />
      <span>
        Last automatic fetch:
        {formatLastFetch(lastAutoFetch)}
      </span>
    </div>

    <Button
      onClick={onRefresh}
      disabled={isFetching}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isFetching ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Rss className="h-4 w-4" />
      )}
      Fetch Latest Contents
    </Button>
  </div>
);

export default FeedRefreshBar;
