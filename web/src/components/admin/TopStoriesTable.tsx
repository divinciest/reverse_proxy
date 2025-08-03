import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowUpDown } from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { tagService } from '@/utils/services/tagService';
import { Tag } from '@/types/admin';
import { Button } from '@/components/ui/button';
import OptImage from '@/components/common/OptImage';

type SortConfig = {
    key: keyof Tag | null;
    direction: 'asc' | 'desc';
};

function TopStoriesTable() {
  const [stories, setStories] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'contents_count', direction: 'desc' });

  useEffect(() => {
    const fetchEventTags = async () => {
      try {
        setLoading(true);
        const response = await tagService.getAllTags({
          categories: 'event',
          sortBy: sortConfig.key || undefined,
          sortOrder: sortConfig.direction,
        });
        setStories(response.tags);
      } catch (error) {
        console.error('Failed to fetch event tags', error);
        toast.error('Failed to load top stories.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventTags();
  }, [sortConfig]);

  const requestSort = (key: keyof Tag) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortableHeader = (key: keyof Tag, label: string, className = '') => (
    <TableHead className={className}>
      <Button variant="ghost" onClick={() => requestSort(key)}>
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Top Stories (Event Tags)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {getSortableHeader('tag_name', 'Story (Event)')}
              <TableHead>Parent</TableHead>
              <TableHead>Sources</TableHead>
              {getSortableHeader('contents_count', 'Content Count', 'text-right')}
              {getSortableHeader('visit_count', 'Traffic (30d)', 'text-right')}
              {getSortableHeader('event_count_30d', 'Events (30d)', 'text-right')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : stories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No event tags found.</TableCell>
              </TableRow>
            ) : (
              stories.map((story) => (
                <TableRow key={story.tag_name}>
                  <TableCell className="font-medium">{story.tag_name}</TableCell>
                  <TableCell>{story.parentTag || '—'}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                          {(story.source_icons || []).slice(0, 5).map((icon, index) => (
                              <OptImage
                                  key={index}
                                  src={icon}
                                  alt="source icon"
                                  className="h-6 w-6 rounded-full object-contain"
                                  fallbackSrc={undefined}
                                  width={24}
                                  height={24}
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ))}
                        </div>
                    </TableCell>
                  <TableCell className="text-right">{story.contents_count}</TableCell>
                  <TableCell className="text-right">{story.visit_count ?? 0}</TableCell>
                  <TableCell className="text-right">{story.event_count_30d ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default TopStoriesTable;
