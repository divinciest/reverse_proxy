import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SortFilterProps {
  onSort: (sortType: string) => void;
  currentSort: string;
}

function SortFilter({ onSort, currentSort }: SortFilterProps) {
  const getSortText = () => {
    switch (currentSort) {
      case 'az':
        return 'A to Z';
      case 'za':
        return 'Z to A';
      case 'percentGain':
        return '% Gain';
      case 'percentLoss':
        return '% Loss';
      case 'marketCap':
        return 'Market Cap';
      default:
        return 'Sort';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          {getSortText()}
          {' '}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuItem
          onClick={() => onSort('default')}
          className={currentSort === 'default' ? 'bg-secondary' : ''}
        >
          Default
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort('az')}
          className={currentSort === 'az' ? 'bg-secondary' : ''}
        >
          A to Z
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort('za')}
          className={currentSort === 'za' ? 'bg-secondary' : ''}
        >
          Z to A
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort('percentGain')}
          className={currentSort === 'percentGain' ? 'bg-secondary' : ''}
        >
          % Gain
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort('percentLoss')}
          className={currentSort === 'percentLoss' ? 'bg-secondary' : ''}
        >
          % Loss
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSort('marketCap')}
          className={currentSort === 'marketCap' ? 'bg-secondary' : ''}
        >
          Market Cap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SortFilter;
