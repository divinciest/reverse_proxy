import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ExternalLink, Inspect } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/data/types';

interface ContentListViewProps {
  contents: Content[];
  onInspect: (content: Content) => void;
  // Add handlers for actions if needed in the future
  // onDelete: (id: string) => void;
  // onEdit: (content: Content) => void;
}

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

const formatDateForTitle = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return date.toLocaleString();
  } catch (e) {
    console.error('Error formatting date for title:', e);
    return 'Invalid date';
  }
};

const ContentListView: React.FC<ContentListViewProps> = ({ contents, onInspect }) => {
  if (!contents || contents.length === 0) {
    // This message might be handled by the parent component, but added here for robustness
    return <p className="text-center text-muted-foreground py-6">No contents to display.</p>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Title</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Publish Date</TableHead>
            <TableHead>Crawl Date</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contents.map((content) => (
            <TableRow key={content._id}>
              <TableCell className="font-medium max-w-xs truncate">
                {content.sourceUrl ? (
                  <a
                    href={content.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                    title={content.title}
                  >
                    {content.title}
                  </a>
                ) : (
                  <span title={content.title}>{content.title}</span>
                )}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {content.aggregatorUrl ? (
                  <a
                    href={content.aggregatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-muted-foreground"
                    title={`Feed: ${content.aggregatorUrl}`}
                  >
                    {content.source}
                  </a>
                ) : (
                  <span title={content.source}>{content.source}</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap" title={formatDateForTitle(content.date)}>
                {formatDate(content.date)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap" title={content.createdAt ? formatDateForTitle(content.createdAt) : 'N/A'}>
                {content.createdAt ? formatDate(content.createdAt) : <span className="text-muted-foreground">N/A</span>}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                  {content.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="truncate" title={tag}>{tag}</Badge>
                  ))}
                  {content.tags && content.tags.length > 2 && (
                    <Badge variant="outline">
                      +
                      {content.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-1"
                  title="Inspect Content Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(content);
                  }}
                >
                  <Inspect className="h-4 w-4" />
                </Button>
                {content.sourceUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={content.sourceUrl} target="_blank" rel="noopener noreferrer" title="Open Original Content">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContentListView;
