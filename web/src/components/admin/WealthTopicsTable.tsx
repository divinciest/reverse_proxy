import React, { useState, useEffect, useMemo } from 'react';
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

function WealthTopicsTable() {
  const [topics, setTopics] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'contents_count', direction: 'desc' });

  useEffect(() => {
    const fetchWealthTopics = async () => {
      try {
        setLoading(true);
        const response = await tagService.getAllTags({
          categories: 'topic,sector',
          explorable: 'true',
          sortBy: sortConfig.key || undefined,
          sortOrder: sortConfig.direction,
        });
        setTopics(response.tags);
      } catch (error) {
        console.error('Failed to fetch wealth topics', error);
        toast.error('Failed to load wealth and investment topics.');
      } finally {
        setLoading(false);
      }
    };

    fetchWealthTopics();
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
        <CardTitle>Wealth and Investment Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {getSortableHeader('tag_name', 'Topic / Sector')}
              {getSortableHeader('category', 'Category')}
              {getSortableHeader('parentTag', 'Parent')}
              <TableHead>Sources</TableHead>
              {getSortableHeader('contents_count', 'Content Count', 'text-right')}
              {getSortableHeader('visit_count', 'Traffic (30d)', 'text-right')}
              {getSortableHeader('event_count_30d', 'Events (30d)', 'text-right')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">No explorable topics or sectors found.</TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow key={topic.tag_name}>
                  <TableCell className="font-medium">{topic.tag_name}</TableCell>
                  <TableCell>{topic.category}</TableCell>
                  <TableCell>{topic.parentTag || '—'}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                          {(topic.source_icons || []).slice(0, 5).map((icon, index) => (
                              <OptImage
                                  key={index}
                                  src={icon}
                                  alt="source icon"
                                  className="h-6 w-6 rounded-full object-contain"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ))}
                        </div>
                    </TableCell>
                  <TableCell className="text-right">{topic.contents_count}</TableCell>
                  <TableCell className="text-right">{topic.visit_count ?? 0}</TableCell>
                  <TableCell className="text-right">{topic.event_count_30d ?? 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default WealthTopicsTable;
