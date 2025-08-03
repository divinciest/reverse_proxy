import React from 'react';
import {
  Trash2, ExternalLink, RefreshCw, Inspect,
} from 'lucide-react';
import { FeedSource } from '@/types/shared';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

interface FeedListViewProps {
  feeds: FeedSource[];
  onDelete: (feed: FeedSource) => void;
  onUpdateCount?: (id: string) => void;
  onItemClick: (feed: FeedSource) => void;
  onInspect: (feed: FeedSource) => void;
}

function FeedListView({
  feeds, onDelete, onUpdateCount, onItemClick, onInspect,
}: FeedListViewProps) {
  if (!feeds || feeds.length === 0) {
    return <p className="text-center text-muted-foreground py-6">No feed sources found.</p>;
  }

  return (
    <div className="border rounded-lg">
      <ul className="divide-y divide-border">
        {feeds.map((feed) => (
          <li
            key={feed._id}
            className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onItemClick(feed)}
          >
            <div className="flex items-center gap-3 flex-grow min-w-0">
              {feed.favicon && (
                <OptImage
                  src={feed.favicon}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded flex-shrink-0 object-contain"
                  loading="lazy"
                />
              )}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium truncate" title={feed.name}>{feed.name}</p>
                <p className="text-xs text-muted-foreground truncate" title={feed.domain || 'No domain'}>
                  {feed.domain || 'No domain'}
                  {' '}
                  -
                  {feed.count ?? 0}
                  {' '}
                  contents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              {feed.link && (
                <a
                  href={feed.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary p-1 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label={`Visit ${feed.name} website (opens in new tab)`}
                  title="Visit website"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect(feed);
                }}
                title="Inspect feed details"
              >
                <Inspect className="h-3 w-3 mr-1" />
                {' '}
                Inspect
              </Button>
              {onUpdateCount && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateCount(feed._id);
                  }}
                  title="Refresh content count"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {' '}
                  Count
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2 py-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(feed);
                }}
                title="Delete feed"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {' '}
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FeedListView;
