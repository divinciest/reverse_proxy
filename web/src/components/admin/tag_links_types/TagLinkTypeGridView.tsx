import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { TagLinkType } from '@/utils/services/tagLinksTypesService';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TagLinkTypeGridViewProps {
  types: TagLinkType[];
  onDelete: (id: string) => void;
  onEdit: (type: TagLinkType) => void;
}

function TagLinkTypeGridView({ types, onDelete, onEdit }: TagLinkTypeGridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {types.map((type) => (
        <Card key={type._id} className="overflow-hidden">
          <CardContent className="p-4">
            <h3 className="font-medium text-base truncate">{type.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-3">
              {type.description || 'No description'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complementary:
              {' '}
              {type.complementary_link_name || 'None'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
              Direction:
              {' '}
              {type.direction}
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(type)}
              className="px-2 text-blue-500 hover:text-blue-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(type._id)}
              className="px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default TagLinkTypeGridView;
