import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Person } from '@/types/admin';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PersonGridViewProps {
  persons: Person[];
  onDelete: (id: string) => void;
  onEdit: (person: Person) => void;
  allPersons: Person[];
}

function PersonGridView({
  persons, onDelete, onEdit, allPersons,
}: PersonGridViewProps) {
  const getPersonNameById = (id: string) => allPersons.find((f) => f._id === id)?.personName || id;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {persons.map((person) => (
        <Card key={person._id} className="overflow-hidden">
          <CardContent className="p-4">
            <h3 className="font-medium text-base truncate">{person.personName}</h3>
          </CardContent>
          <CardFooter className="p-4 pt-0 justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(person)}
              className="px-2 text-blue-500 hover:text-blue-700"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(person._id)}
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

export default PersonGridView;
