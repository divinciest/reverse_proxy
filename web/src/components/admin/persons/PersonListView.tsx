import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Person } from '@/types/admin';
import { Button } from '@/components/ui/button';

interface PersonListViewProps {
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (person: Person) => void;
  allPersons: Person[];
}

function PersonListView({
  persons, onDelete, onEdit, allPersons,
}: PersonListViewProps) {
  const getPersonNameById = (id: string) => allPersons.find((f) => f._id === id)?.personName || id;

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Person Name</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {persons.map((person) => (
            <tr key={person._id}>
              <td className="px-4 py-3 text-sm font-medium">{person.personName}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(person)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(person._id)}
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

export default PersonListView;
