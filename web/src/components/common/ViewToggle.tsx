import React from 'react';
import { List, Grid } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ViewToggleProps {
  activeView: 'list' | 'grid';
  onChange: (view: 'list' | 'grid') => void;
}

function ViewToggle({ activeView, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup type="single" value={activeView} onValueChange={(value) => value && onChange(value as 'list' | 'grid')} className="bg-muted border border-border rounded-md p-0.5">
      <ToggleGroupItem
        value="list"
        aria-label="List view"
        className="text-muted-foreground hover:text-foreground data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="grid"
        aria-label="Grid view"
        className="text-muted-foreground hover:text-foreground data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
      >
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export default ViewToggle;
