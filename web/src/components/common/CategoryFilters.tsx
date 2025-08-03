import { ChevronDown } from 'lucide-react';
import { Tag } from '@/types/admin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface CategoryFiltersProps {
  allTags: Tag[];
  selectedTags: string[];
  onTagSelect: (tag_name: string) => void;
  allowedCategories: string[];
}

function CategoryFilters({
  allTags, selectedTags, onTagSelect, allowedCategories,
}: CategoryFiltersProps) {
  // Map category names to display labels
  const categoryLabels: Record<string, string> = {
    topic: 'Topics',
    sector: 'Sectors',
    place: 'Places',
    company: 'Companies',
    aggregator: 'Sources',
    person: 'People',
    event: 'Events',
    other: 'Other',
    firm: 'Firms',
  };

  const getTagsByCategory = (category: string) =>
    // Ensure tag.category is treated as string for comparison
    allTags.filter((tag) => String(tag.category) === category);
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowedCategories.map((category) => {
        const categoryTags = getTagsByCategory(category);
        if (categoryTags.length === 0) return null; // Don't render dropdown if no tags for category

        const selectedCount = categoryTags.filter((t) => selectedTags.includes(t.tag_name)).length;
        const label = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <DropdownMenu key={category}>
            <DropdownMenuTrigger asChild>
              <Button
              variant="outline"
              className="flex items-center gap-1.5 h-7 px-2 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs"
            >
              <span className="text-xs font-medium">{label}</span>
              {selectedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs font-medium bg-primary text-primary-foreground">
                    {selectedCount}
                  </Badge>
                )}
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 max-h-48 overflow-y-auto">
              {categoryTags.map((tag) => (
              <DropdownMenuItem
                  key={tag.tag_name}
                  onSelect={() => onTagSelect(tag.tag_name)}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                >
                  <span className="capitalize">{tag.tag_name}</span>
                  {selectedTags.includes(tag.tag_name) && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </DropdownMenuItem>
            ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </div>
  );
}

export default CategoryFilters;
