import React from 'react';
import { ExternalLink, ImageOff, Inspect } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/data/types';
import OptImage from '@/components/common/OptImage';

interface ContentCardProps {
  content: Content;
  onInspect: (content: Content) => void;
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

const ContentCard: React.FC<ContentCardProps> = ({ content, onInspect }) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-none">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {content.title}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center text-sm text-muted-foreground">
              <span>{content.source}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(content.date)}</span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onInspect(content)}
            className="ml-2 flex-shrink-0"
          >
            <Inspect className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          {content.featuredImage ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              <OptImage
                src={content.featuredImage}
                alt={content.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.classList.add('bg-muted');
                    parent.innerHTML = `
                      <div class="flex items-center justify-center w-full h-full">
                        <svg class="h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-video w-full bg-muted rounded-md">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {content.summary}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex-none border-t pt-3">
        <div className="flex flex-wrap gap-2 w-full">
          {content.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {content.companies?.map((company) => (
            <Badge key={company.name} variant="outline" className="text-xs">
              {company.name}
            </Badge>
          ))}
        </div>
        {content.sourceUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => window.open(content.sourceUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Source
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContentCard; 