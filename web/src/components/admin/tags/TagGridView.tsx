import React from 'react';
import {
  Trash2, Edit, Link as LinkIcon, CheckCircle, Eye, TrendingUp, Banknote, Info, Share2Icon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tag } from '@/types/admin';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TagGridViewProps {
  tags: Tag[];
  onDelete: (id: string) => void;
  onEdit: (tag: Tag) => void;
  onViewNetwork: (tagName: string) => void;
  allTags: Tag[];
}

function TagGridView({
  tags, onDelete, onEdit, onViewNetwork, allTags,
}: TagGridViewProps) {
  if (!tags || tags.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No tags found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tags.map((tag) => {
        const selfContents = tag.contents_count || 0;
        const childrenContents = tag.childTags.reduce((sum, childName) => {
          const childTag = allTags.find((t) => t.tag_name === childName);
          return sum + (childTag?.contents_count || 0);
        }, 0);
        const totalContents = selfContents + childrenContents;

        return (
          <Card key={tag._id} className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
            <Link
              to={`/tags/${encodeURIComponent(tag.tag_name)}`}
              className="flex flex-col flex-grow hover:bg-accent/50 transition-colors rounded-t-lg"
              aria-label={`View contents for tag ${tag.tag_name}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex justify-between items-start">
                  <span>{tag.tag_name}</span>
                  {tag.finance_approved && (
                    <Banknote className="h-4 w-4 text-primary ml-2 flex-shrink-0" aria-label="Finance Approved" />
                  )}
                  <Badge variant="secondary" className="capitalize text-xs ml-2 whitespace-nowrap">
                    {tag.category || 'Uncategorized'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex-grow space-y-2 pb-3">
                {tag.aliases && tag.aliases.length > 0 && (
                  <div>
                    <span className="font-medium">Aliases:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tag.aliases.map((alias, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tag.parentTag && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon size={14} className="text-muted-foreground" />
                    <span className="font-medium">Parent:</span>
                    <span className="text-primary">{tag.parentTag}</span>
                  </div>
                )}

                {tag.childTags && tag.childTags.length > 0 && (
                  <div>
                    <span className="font-medium">
                      Children (
                      {tag.childTags.length}
                      ):
                    </span>
                    <span className="text-primary ml-1">{tag.childTags.join(', ')}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-1 text-xs text-muted-foreground">
                  {tag.trendable && (
                    <span className="flex items-center" title="Trendable">
                      <TrendingUp size={14} className="mr-1 text-primary" />
                      {' '}
                      Trendable
                    </span>
                  )}
                  {tag.explorable && (
                    <span className="flex items-center" title="Explorable">
                      <Eye size={14} className="mr-1 text-primary" />
                      {' '}
                      Explorable
                    </span>
                  )}
                  {tag.humanReviewed && (
                    <span className="flex items-center" title="Human Reviewed">
                      <CheckCircle size={14} className="mr-1 text-primary" />
                      {' '}
                      Reviewed
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2 text-sm">
                    <Info className="h-4 w-4 text-primary" />
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Contents:</span>
                      <Badge variant="outline" className="px-2">
                        {(tag.contents_count || 0).toLocaleString()}
                      </Badge>
                    </div>
                    {tag.childTags && tag.childTags.length > 0 && (
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <span>+</span>
                        <Badge variant="outline" className="px-2">
                          {tag.childTags.reduce((sum, child) => {
                            const childTag = allTags.find((t) => t.tag_name === child);
                            return sum + (childTag?.contents_count || 0);
                          }, 0).toLocaleString()}
                        </Badge>
                        <span className="text-xs">from children</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Link>
            <CardFooter className="flex justify-end space-x-1 border-t pt-3 pb-3 bg-card rounded-b-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (typeof onViewNetwork === 'function') {
                    onViewNetwork(tag.tag_name);
                  } else {
                    console.error('TagGridView: onViewNetwork prop is not a function or not provided.', { tag });
                  }
                }}
                title="View Network Graph"
              >
                <Share2Icon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(tag)} title="Edit Tag">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(tag._id)} className="text-destructive hover:text-destructive/80" title="Delete Tag">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export default TagGridView;
