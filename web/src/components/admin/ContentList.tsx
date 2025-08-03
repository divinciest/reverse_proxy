import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import SortFilter from '@/components/common/SortFilter'; import ViewToggle from '@/components/common/ViewToggle'; import { SearchInput } from '@/components/common/SearchInput';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SortOption {
  value: string;
  label: string;
}

interface ContentListProps<T> {
  title: string;
  icon?: React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  viewType: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  renderGridView: () => React.ReactNode;
  renderListView: () => React.ReactNode;
  onGridItemClick?: (item: T) => void;
  onListItemClick?: (item: T) => void;
  searchPlaceholder?: string;
  noItemsMessage?: string;
  debounceDelay?: number;
}

function ContentList<T extends { _id?: string; id?: string }>({
  title,
  icon,
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  viewType,
  onViewChange,
  renderGridView,
  renderListView,
  onGridItemClick,
  onListItemClick,
  searchPlaceholder,
  noItemsMessage,
  debounceDelay,
}: ContentListProps<T>) {
  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
        <h3 className="text-lg font-semibold flex items-center text-foreground">
          {icon}
          {title}
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <SearchInput
              placeholder={searchPlaceholder || 'Search...'}
              value={searchValue}
              onSearchChange={onSearchChange}
              debounceDelay={debounceDelay}
              className="w-full sm:w-[250px]"
            />
          </div>
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted">
            <Button
              variant={viewType === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('grid')}
              className={`px-2 py-1 h-auto ${viewType === 'grid' ? 'shadow-sm' : ''}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('list')}
              className={`px-2 py-1 h-auto ${viewType === 'list' ? 'shadow-sm' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        {viewType === 'grid' ? renderGridView() : renderListView()}
        {noItemsMessage && (
          <div className="text-center text-muted-foreground py-6">
            {noItemsMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentList;
