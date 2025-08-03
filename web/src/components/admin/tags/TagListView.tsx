import React from 'react';
import {
  Trash2, Edit, Link as LinkIcon, CheckCircle, Eye, TrendingUp, Banknote, Share2Icon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tag } from '@/types/admin';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagListViewProps {
  tags: Tag[];
  onDelete: (id: string) => void;
  onEdit: (tag: Tag) => void;
  onViewNetwork: (tagName: string) => void;
  allTags: Tag[];
}

function TagListView({
  tags, onDelete, onEdit, onViewNetwork, allTags,
}: TagListViewProps) {
  if (!tags || tags.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No tags found.</p>;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-[20%]">Tag Name</TableHead>
            <TableHead className="w-[15%]">Category</TableHead>
            <TableHead>Aliases</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Children</TableHead>
            <TableHead className="w-[15%]">Flags</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => (
            <TableRow key={tag._id} className="hover:bg-accent/50">
              <TableCell className="font-medium">
                <Link
                  to={`/tags/${encodeURIComponent(tag.tag_name)}`}
                  className="text-primary hover:underline"
                  title={`View contents for tag ${tag.tag_name}`}
                >
                  {tag.tag_name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize text-xs">
                  {tag.category || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {tag.aliases?.join(', ') || '-'}
              </TableCell>
              <TableCell className="text-xs text-primary">
                {tag.parentTag || '-'}
              </TableCell>
              <TableCell className="text-xs text-primary">
                {tag.childTags && tag.childTags.length > 0
                  ? `${tag.childTags.length}: ${tag.childTags.join(', ')}`
                  : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {tag.trendable && (
                    <span title="Trendable">
                      <TrendingUp size={14} className="text-primary" />
                    </span>
                  )}
                  {tag.explorable && (
                    <span title="Explorable">
                      <Eye size={14} className="text-primary" />
                    </span>
                  )}
                  {tag.humanReviewed && (
                    <span title="Human Reviewed">
                      <CheckCircle size={14} className="text-primary" />
                    </span>
                  )}
                  {tag.finance_approved && (
                    <span title="Finance Approved">
                      <Banknote className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    </span>
                  )}
                  {!tag.trendable && !tag.explorable && !tag.humanReviewed && !tag.finance_approved && (
                    <span>-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof onViewNetwork === 'function') {
                        onViewNetwork(tag.tag_name);
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TagListView;
