import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { TagLinkType } from '@/utils/services/tagLinksTypesService';
import { Button } from '@/components/ui/button';

interface TagLinkTypeListViewProps {
  types: TagLinkType[];
  onDelete: (id: string) => void;
  onEdit: (type: TagLinkType) => void;
}

function TagLinkTypeListView({ types, onDelete, onEdit }: TagLinkTypeListViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Complementary Link</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {types.map((type) => (
            <tr key={type._id}>
              <td className="px-4 py-3 text-sm font-medium">{type.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {type.description || 'No description'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {type.complementary_link_name || 'None'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(type)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(type._id)}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TagLinkTypeListView;
