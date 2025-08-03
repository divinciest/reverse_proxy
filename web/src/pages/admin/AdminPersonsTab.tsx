import React, {
  useState, useMemo, useEffect, useCallback,
} from 'react';
import { toast } from 'sonner';
import { Users, UserPlus } from 'lucide-react';
import { Person as PersonType } from '@/types/admin';
import TabContent from '@/components/admin/TabContent';
import AddPersonForm from '@/components/admin/persons/AddPersonForm';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { PersonCard } from '@/components/admin/cards';
import PersonListView from '@/components/admin/persons/PersonListView';
import EditPersonDialog from '@/components/admin/persons/EditPersonDialog';
import personService from '@/utils/services/personService';
import { SearchInput } from '@/components/common/SearchInput';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Person = PersonType;

function AdminPersonsTab() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [personsError, setPersonsError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'default' | 'az' | 'za'>('default');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    setLoadingPersons(true);
    setPersonsError(null);
    try {
      const fetchedPersons = await personService.getAllPersons();
      setPersons(fetchedPersons);
    } catch (err: any) {
      console.error('Error fetching persons:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load persons.';
      setPersonsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingPersons(false);
    }
  }, []);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const handleAddPerson = async (personName: string) => {
    try {
      await personService.addPerson({ personName });
      await fetchPersons();
    } catch (err: any) {
      console.error('Error adding person:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add person';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleEditPerson = (person: Person) => {
    setCurrentPerson(person);
    setEditDialogOpen(true);
  };

  const handleSavePerson = async (personId: string, personName: string) => {
    if (!currentPerson) return;
    try {
      await personService.updatePerson(personId, { personName });
      await fetchPersons();
      setEditDialogOpen(false);
      toast.success('Person updated successfully');
    } catch (err: any) {
      console.error('Error updating person:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update person';
      toast.error(errorMessage);
      throw err;
    }
  };

  const confirmDeletePerson = (personId: string) => {
    setPersonToDelete(personId);
    setDeleteDialogOpen(true);
  };

  const handleDeletePerson = async () => {
    if (!personToDelete) return;
    try {
      await personService.deletePerson(personToDelete);
      toast.success('Person deleted successfully.');
      setPersonToDelete(null);
      setDeleteDialogOpen(false);
      await fetchPersons();
    } catch (err: any) {
      console.error('Error deleting person:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete person.';
      toast.error(errorMessage);
    }
  };

  const filteredSortedPersons = useMemo(() => {
    const items = persons.filter((p) => p.personName.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sort === 'az') {
      items.sort((a, b) => a.personName.localeCompare(b.personName));
    } else if (sort === 'za') {
      items.sort((a, b) => b.personName.localeCompare(a.personName));
    }
    return items;
  }, [persons, searchQuery, sort]);

  if (loadingPersons) {
    return (
      <TabContent
        title="Manage Persons"
        description="Add, edit or remove persons."
        icon={<Users className="h-6 w-6 mb-1 text-purple-600" />}
      >
        <div className="flex justify-center items-center h-32">
          <p>Loading persons...</p>
        </div>
      </TabContent>
    );
  }

  if (personsError) {
    return (
      <TabContent
        title="Manage Persons"
        description="Add, edit or remove persons."
        icon={<Users className="h-6 w-6 mb-1 text-purple-600" />}
      >
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md">
          Error:
          {' '}
          {personsError}
        </div>
      </TabContent>
    );
  }

  return (
    <TabContent
      title="Manage Persons"
      description="Add, edit or remove persons from the system."
      icon={<Users className="h-6 w-6 mb-1 text-purple-600" />}
    >
      <AddPersonForm
        onAddPerson={handleAddPerson}
        icon={<UserPlus className="h-4 w-4 mr-1" />}
      />

      <ContentList
        title={`Current Persons (${filteredSortedPersons.length})`}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        debounceDelay={500}
        sortValue={sort}
        onSortChange={(value) => setSort(value as any)}
        sortOptions={[
          { value: 'default', label: 'Default' },
          { value: 'az', label: 'Name (A-Z)' },
          { value: 'za', label: 'Name (Z-A)' },
        ]}
        viewType={activeView}
        onViewChange={setActiveView}
        renderGridView={() => (
          <ContentGrid
            items={filteredSortedPersons}
            renderCard={(person) => (
              <PersonCard
                person={person}
                onDelete={confirmDeletePerson}
                onEdit={handleEditPerson}
                allPersons={persons}
              />
            )}
            gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
            gap="gap-4"
            emptyMessage="No persons found."
            getItemKey={(person) => person._id}
          />
        )}
        renderListView={() => (
          <PersonListView
            persons={filteredSortedPersons}
            onDelete={confirmDeletePerson}
            onEdit={handleEditPerson}
            allPersons={persons}
          />
        )}
        icon={<Users className="h-4 w-4 mr-2 text-purple-500" />}
      />

      <EditPersonDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        person={currentPerson}
        onSave={handleSavePerson}
        allPersonNames={persons.map((p) => p.personName)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the person and update all related relationships.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabContent>
  );
}

export default AdminPersonsTab;
