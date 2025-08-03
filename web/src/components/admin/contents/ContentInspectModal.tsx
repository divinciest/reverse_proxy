import React from 'react';
import {
  Inspect, Link as LinkIcon, Calendar, Tag, Globe, Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/data/types';
import OptImage from '@/components/common/OptImage';

// Define Content type matching the one in AdminContentsTab

interface ContentInspectModalProps {
  content: Content | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true })} (${date.toLocaleString()})`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

const ContentInspectModal: React.FC<ContentInspectModalProps> = ({ content, isOpen, onClose }) => {
  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        {' '}
        {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inspect size={20} className="text-green-600" />
            Inspect Content:
          </DialogTitle>
          <DialogDescription className="pt-1 line-clamp-2" title={content.title}>
            {content.title}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 grid grid-cols-3 gap-x-4 gap-y-3 text-sm max-h-[65vh] overflow-y-auto pr-2">
          {/* Core Info */}
          <div className="col-span-1 font-medium text-muted-foreground">Title</div>
          <div className="col-span-2">{content.title}</div>

          <div className="col-span-1 font-medium text-muted-foreground">Source</div>
          <div className="col-span-2 flex items-center gap-1">
            <Globe size={14} />
            {' '}
            {content.source}
          </div>

          <div className="col-span-1 font-medium text-muted-foreground">Date</div>
          <div className="col-span-2 flex items-center gap-1">
            <Calendar size={14} />
            {' '}
            {formatDate(content.date)}
          </div>

          {/* Links */}
          {content.sourceUrl && (
            <>
              <div className="col-span-1 font-medium text-muted-foreground">Source URL</div>
              <div className="col-span-2 truncate">
                <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1" title={content.sourceUrl}>
                  <LinkIcon size={14} />
                  {' '}
                  {content.sourceUrl}
                </a>
              </div>
            </>
          )}
          {content.aggregatorUrl && (
            <>
              <div className="col-span-1 font-medium text-muted-foreground">Aggregator URL</div>
              <div className="col-span-2 truncate">
                <a href={content.aggregatorUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1" title={content.aggregatorUrl}>
                  <LinkIcon size={14} />
                  {' '}
                  {content.aggregatorUrl}
                </a>
              </div>
            </>
          )}

          {/* Image */}
          <div className="col-span-1 font-medium text-muted-foreground">Image URL</div>
          <div className="col-span-2 flex items-center gap-2">
            <ImageIcon size={14} />
            {content.featuredImage ? (
              <a href={content.featuredImage} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={content.featuredImage}>
                {content.featuredImage}
              </a>
            ) : (
              <span className="text-muted-foreground italic">No image URL</span>
            )}
          </div>
          {content.imageUrl && (
          <div className="col-span-3 mt-1">
            <OptImage src={content.imageUrl} alt="Content visual" className="max-h-40 w-auto rounded border" onError={(e) => e.currentTarget.style.display = 'none'} />
          </div>
          )}

          {/* Tags */}
          <div className="col-span-1 font-medium text-muted-foreground">Tags</div>
          <div className="col-span-2">
            {content.tags && content.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                <Tag size={14} className="text-muted-foreground mr-1 mt-0.5" />
                {content.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No tags</p>
            )}
          </div>

          {/* Tags */}
          <div className="col-span-1 font-medium text-muted-foreground">Finance Approved Tags</div>
          <div className="col-span-2">
            {content.financeApprovedTags && content.financeApprovedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                <Tag size={14} className="text-muted-foreground mr-1 mt-0.5" />
                {content.financeApprovedTags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            ) : (
              <p className="text-muted-foreground italic">No tags</p>
            )}
          </div>

          {/* Technical Details */}
          <div className="col-span-1 font-medium text-muted-foreground">Content ID</div>
          <div className="col-span-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{content._id}</div>

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

export default ContentInspectModal;
