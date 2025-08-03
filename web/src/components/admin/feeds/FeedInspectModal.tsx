import React from 'react';
import {
  CheckCircle, XCircle, Link as LinkIcon, Globe, Rss, Palette, Hash, Inspect,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeedSource } from '@/types/shared';
import OptImage from '@/components/common/OptImage';

interface FeedInspectModalProps {
  feed: FeedSource | null;
  isOpen: boolean;
  onClose: () => void;
}

const FeedInspectModal: React.FC<FeedInspectModalProps> = ({ feed, isOpen, onClose }) => {
  if (!feed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inspect size={20} className="text-blue-600" />
            Inspect Feed:
            {' '}
            {feed.name}
          </DialogTitle>
          <DialogDescription>
            Detailed information for the feed source "
            {feed.name}
            ".
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 grid grid-cols-3 gap-x-4 gap-y-3 text-sm max-h-[60vh] overflow-y-auto pr-2">
          <div className="col-span-1 font-medium text-muted-foreground">Name</div>
          <div className="col-span-2">{feed.name}</div>

          <div className="col-span-1 font-medium text-muted-foreground">Domain</div>
          <div className="col-span-2 flex items-center gap-1">
            <Globe size={14} />
            {feed.domain}
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Website Link</div>
          <div className="col-span-2 truncate">
            <a href={feed.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1" title={feed.link}>
              <LinkIcon size={14} />
              {' '}
              {feed.link}
            </a>
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Enabled</div>
          <div className="col-span-2">
            {feed.enabled ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={14} className="mr-1" />
                {' '}
                Enabled
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle size={14} className="mr-1" />
                {' '}
                Disabled
              </Badge>
            )}
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Feed ID</div>
          <div className="col-span-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{feed._id}</div>

          <div className="col-span-1 font-medium text-muted-foreground">Content Count</div>
          <div className="col-span-2 flex items-center gap-1">
            <Hash size={14} />
            {' '}
            {feed.count ?? 'N/A'}
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Favicon</div>
          <div className="col-span-2">
            <OptImage src={feed.favicon} alt="Favicon" className="h-6 w-6 rounded border" onError={(e) => e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} />
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Color</div>
          <div className="col-span-2 flex items-center gap-2">
            <div className="h-5 w-5 rounded border" style={{ backgroundColor: feed.color }} />
            <span className="font-mono text-xs">{feed.color}</span>
            <Palette size={14} />
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Feed URLs</div>
          <div className="col-span-2 space-y-1">
            {feed.urls && feed.urls.length > 0 ? (
              feed.urls.map((url, index) => (
                <div key={index} className="flex items-center gap-1 truncate">
                  <Rss size={14} className="text-orange-500 flex-shrink-0" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    title={url}
                  >
                    {url}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">No specific feed URLs found.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedInspectModal;
