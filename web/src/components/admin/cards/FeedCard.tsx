import React from 'react';
import {
  Trash2, ExternalLink, RefreshCw, Inspect,
} from 'lucide-react';
import { FeedSource } from '@/types/shared';
import {
  Card, CardFooter, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

interface FeedCardProps {
  feed: FeedSource;
  onDelete: (feed: FeedSource) => void;
  onUpdateCount?: (id: string) => void;
  onCardClick: (feed: FeedSource) => void;
  onInspect: (feed: FeedSource) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ feed, onDelete, onUpdateCount, onCardClick, onInspect }) => {
  return (
    <Card
      className="flex flex-col justify-between hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onCardClick(feed)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-grow min-w-0">
            {feed.favicon && (
              <OptImage
                src={feed.favicon}
                alt=""
                width={20}
                height={20}
                className="rounded flex-shrink-0 object-contain"
                loading="lazy"
              />
            )}
            <CardTitle className="text-sm font-semibold truncate" title={feed.name}>
              {feed.name}
            </CardTitle>
          </div>
          {feed.url && (
            <a
              href={feed.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-primary p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label={`Visit ${feed.name} website (opens in new tab)`}
              title="Visit website"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <CardDescription className="text-xs truncate pt-1" title={feed.domain || 'No domain'}>
          {feed.domain || 'No domain'}
          {' '}
          -
          {feed.count ?? 0}
          {' '}
          contents
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end gap-1 pt-2 border-t mt-auto">
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
      </CardFooter>
    </Card>
  );
};

export default FeedCard; 