import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { tagService, TagVisitStat } from '@/utils/services/tagService';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import TabContent from '@/components/admin/TabContent';
import TopStoriesTable from '@/components/admin/TopStoriesTable';
import WealthTopicsTable from '@/components/admin/WealthTopicsTable';

type SortKey = 'tag_name' | 'visit_count';
type SortDirection = 'asc' | 'desc';

const AdminStatisticsTab: React.FC = () => {
  const [stats, setStats] = useState<TagVisitStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const [sortKey, setSortKey] = useState<SortKey>('visit_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromISO = date?.from ? date.from.toISOString() : undefined;
      const toISO = date?.to ? date.to.toISOString() : undefined;
      const result = await tagService.getTagVisitStats(fromISO, toISO);
      setStats(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch statistics.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const sortedStats = React.useMemo(() => {
    const sorted = [...stats].sort((a, b) => {
      if (sortKey === 'tag_name') {
        return a.tag_name.localeCompare(b.tag_name);
      }
      // visit_count
      return a.visit_count - b.visit_count;
    });

    if (sortDirection === 'desc') {
      return sorted.reverse();
    }
    return sorted;
  }, [stats, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  return (
    <TabContent title="Tag Visit Statistics" description="Analyze tag popularity based on user visits over time.">
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
          <CardDescription>Select a date range to view tag visit statistics. Defaults to the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                        {format(date.from, 'LLL dd, y')}
                        {' '}
                        -
                                  {' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={fetchStats} disabled={loading}>
            {loading ? 'Fetching...' : 'Fetch Statistics'}
          </Button>
        </CardContent>
      </Card>

      {error && <div className="text-red-500 mt-4">{error}</div>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top Visited Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('tag_name')} className="cursor-pointer">
                  Tag Name 
{' '}
<ArrowDownUp className="inline h-4 w-4" />
                </TableHead>
                <TableHead onClick={() => handleSort('visit_count')} className="cursor-pointer text-right">
                  Visit Count 
{' '}
<ArrowDownUp className="inline h-4 w-4" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={2} className="text-center">Loading...</TableCell></TableRow>
              ) : sortedStats.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center">No data for the selected period.</TableCell></TableRow>
              ) : (
                sortedStats.map((stat) => (
                  <TableRow key={stat.tag_name}>
                    <TableCell className="font-medium">{stat.tag_name}</TableCell>
                    <TableCell className="text-right">{stat.visit_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <WealthTopicsTable />
      <TopStoriesTable />
    </TabContent>
  );
};

export default AdminStatisticsTab;
