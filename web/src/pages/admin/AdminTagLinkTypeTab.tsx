import React, {
  useState, useMemo, useEffect, useCallback,
} from 'react';
import { toast } from 'sonner';
import {
  Link, ListTree, Loader2, AlertCircle,
} from 'lucide-react';
import tagLinksTypesService, { TagLinkType, UpdateTagLinkTypeData } from '@/utils/services/tagLinksTypesService';
import TabContent from '@/components/admin/TabContent';
import AddTagLinkTypeForm from '@/components/admin/tag_links_types/AddTagLinkTypeForm';
import ContentList from '@/components/admin/ContentList';
import ContentGrid from '@/components/admin/ContentGrid';
import { TagLinkTypeCard } from '@/components/admin/cards';
import TagLinkTypeListView from '@/components/admin/tag_links_types/TagLinkTypeListView';
import EditTagLinkTypeDialog from '@/components/admin/tag_links_types/EditTagLinkTypeDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/common/SearchInput';

function AdminTagLinkTypeTab() {
  const [types, setTypes] = useState<TagLinkType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'default' | 'az' | 'za'>('default');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState<TagLinkType | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);

  const [actionsDialogOpen, setActionsDialogOpen] = useState(false);
  const [complementarityChange, setComplementarityChange] = useState<{
    type: TagLinkType;
    updateData: UpdateTagLinkTypeData;
  } | null>(null);

  const [actions, setActions] = useState({
    create_complement_for_current: false,
    create_current_for_complement: false,
    remove_complement_for_current: false,
    remove_current_for_complement: false,
  });

  const fetchTypes = useCallback(async () => {
    setLoadingTypes(true);
    setTypesError(null);
    try {
      const fetchedTypes = await tagLinksTypesService.getAllLinkTypes();
      setTypes(fetchedTypes || []);
    } catch (err: any) {
      console.error('Error fetching link types:', err);
      const errorMessage = err.message || 'Failed to load link types.';
      setTypesError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleAddType = async (typeData: { name: string; description?: string; complementary_link_name?: string }) => {
    try {
      await tagLinksTypesService.addLinkType(typeData);
      await fetchTypes();
    } catch (err: any) {
      console.error('Error adding link type:', err);
      const backendError = err.response?.data?.error || err.message || 'Failed to add link type';
      toast.error(backendError);
      throw err;
    }
  };

  const handleUpdateType = async (typeId: string, data: UpdateTagLinkTypeData) => {
    const type = types.find((t) => t._id === typeId);
    if (!type) return;

    // If complement name is changed, show actions dialog
    if (data.complementary_link_name !== type.complementary_link_name) {
      setComplementarityChange({ type, updateData: data });
      setActionsDialogOpen(true);
      setEditDialogOpen(false);
    } else {
      // Otherwise, update directly
      try {
        await tagLinksTypesService.updateLinkType(typeId, data);
        await fetchTypes();
        toast.success('Link type updated successfully!');
        setEditDialogOpen(false);
        setCurrentType(null);
      } catch (err: any) {
        console.error('Error updating link type:', err);
        const backendError = err.response?.data?.error || err.message || 'Failed to update link type';
        toast.error(backendError);
        throw err;
      }
    }
  };

  const handleConfirmComplementarityChange = async () => {
    if (!complementarityChange) return;

    const { type, updateData } = complementarityChange;
    const payload = { ...updateData, actions };

    try {
      const response = await tagLinksTypesService.updateLinkType(type._id, payload);
      await fetchTypes();
      // @ts-expect-error - Response structure may vary
      const message = response?.data?.message || 'Link type updated successfully!';
      toast.success(message);
    } catch (err: any) {
      console.error('Error updating link type with actions:', err);
      const backendError = err.response?.data?.error || err.message || 'Failed to update link type';
      toast.error(backendError);
    } finally {
      setActionsDialogOpen(false);
      setComplementarityChange(null);
      setActions({
        create_complement_for_current: false,
        create_current_for_complement: false,
        remove_complement_for_current: false,
        remove_current_for_complement: false,
      });
    }
  };

  const handleEditClick = (type: TagLinkType) => {
    setCurrentType(type);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (typeId: string) => {
    setTypeToDelete(typeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (typeToDelete) {
      try {
        await tagLinksTypesService.deleteLinkType(typeToDelete);
        await fetchTypes();
        toast.success('Link type deleted successfully!');
        setDeleteDialogOpen(false);
        setTypeToDelete(null);
      } catch (err: any) {
        console.error('Error deleting link type:', err);
        const backendError = err.response?.data?.error || err.message || 'Failed to delete link type';
        toast.error(backendError);
      }
    }
  };

  const filteredAndSortedTypes = useMemo(() => {
    let result = types;
    if (searchQuery) {
      result = result.filter(
        (type) => type.name.toLowerCase().includes(searchQuery.toLowerCase())
          || type.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (sort === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'za') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }
    return result;
  }, [types, searchQuery, sort]);

  const viewOptions = useMemo(() => [
    { value: 'grid' as 'grid' | 'list', label: 'Grid View', icon: Link },
    { value: 'list' as 'grid' | 'list', label: 'List View', icon: ListTree },
  ], []);

  const sortOptions = useMemo(() => [
    { value: 'default' as 'default' | 'az' | 'za', label: 'Default' },
    { value: 'az' as 'default' | 'az' | 'za', label: 'A-Z' },
    { value: 'za' as 'default' | 'az' | 'za', label: 'Z-A' },
  ], []);

  const entityName = 'Link Types';

  if (loadingTypes && types.length === 0) {
    return (
      <TabContent
        title="Manage Tag Link Types"
        description="Create and manage tag link types for organizing relationships between tags"
        icon={<Link className="h-5 w-5 text-primary" />}
      >
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading
            {entityName.toLowerCase()}
            ...
          </span>
        </div>
      </TabContent>
    );
  }

  const renderActionsDialog = () => {
    if (!complementarityChange) return null;

    const { type, updateData } = complementarityChange;
    const oldComplementName = type.complementary_link_name || 'None';
    const newComplementName = updateData.complementary_link_name || 'None';
    const typeName = type.name;

    const isRemoving = type.complementary_link_name && type.complementary_link_name !== updateData.complementary_link_name;
    const isAdding = updateData.complementary_link_name && type.complementary_link_name !== updateData.complementary_link_name;

    return (
      <AlertDialog open={actionsDialogOpen} onOpenChange={setActionsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complementarity Change Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You are changing the complementary link for '
              {typeName}
              ' from '
              {oldComplementName}
              ' to '
              {newComplementName}
              '.
              Please specify how to handle existing tag links.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {isRemoving && (
              <div className="space-y-2 p-3 border border-border rounded-md bg-muted/50">
                <h4 className="font-semibold text-sm text-foreground">
                  Removal Options (for old complement: '
                  {oldComplementName}
                  ')
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove_complement_for_current"
                    checked={actions.remove_complement_for_current}
                    onCheckedChange={(checked) => setActions((prev) => ({ ...prev, remove_complement_for_current: !!checked }))}
                  />
                  <Label htmlFor="remove_complement_for_current" className="text-xs text-muted-foreground">
                    Remove every '
                    {oldComplementName}
                    ' link that has a corresponding '
                    {typeName}
                    ' inverse link.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remove_current_for_complement"
                    checked={actions.remove_current_for_complement}
                    onCheckedChange={(checked) => setActions((prev) => ({ ...prev, remove_current_for_complement: !!checked }))}
                  />
                  <Label htmlFor="remove_current_for_complement" className="text-xs text-muted-foreground">
                    Remove every '
                    {typeName}
                    ' link that has a corresponding '
                    {oldComplementName}
                    ' inverse link.
                  </Label>
                </div>
              </div>
            )}

            {isAdding && (
              <div className="space-y-2 p-3 border border-border rounded-md bg-muted/50">
                <h4 className="font-semibold text-sm text-foreground">
                  Creation Options (for new complement: '
                  {newComplementName}
                  ')
                </h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create_complement_for_current"
                    checked={actions.create_complement_for_current}
                    onCheckedChange={(checked) => setActions((prev) => ({ ...prev, create_complement_for_current: !!checked }))}
                  />
                  <Label htmlFor="create_complement_for_current" className="text-xs text-muted-foreground">
                    Create '
                    {newComplementName}
                    ' links for each existing '
                    {typeName}
                    ' link.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create_current_for_complement"
                    checked={actions.create_current_for_complement}
                    onCheckedChange={(checked) => setActions((prev) => ({ ...prev, create_current_for_complement: !!checked }))}
                  />
                  <Label htmlFor="create_current_for_complement" className="text-xs text-muted-foreground">
                    Create '
                    {typeName}
                    ' links for each existing '
                    {newComplementName}
                    ' link.
                  </Label>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setComplementarityChange(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplementarityChange} className="bg-primary hover:bg-primary/90">Confirm and Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  return (
    <TabContent
      title="Manage Tag Link Types"
      description="Create and manage tag link types for organizing relationships between tags"
      icon={<Link className="h-5 w-5 text-primary" />}
    >
      <AddTagLinkTypeForm onAddType={handleAddType} allLinkTypes={types} />

      <div className="mt-8">
        {loadingTypes && types.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading
                  {entityName.toLowerCase()}
                  ...
                </span>
              </div>
            </CardContent>
          </Card>
        ) : typesError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center text-destructive">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>
                  Error:
                  {typesError}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ContentList<TagLinkType>
            title="Current Tag Link Types"
                    searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        debounceDelay={500}
            sortValue={sort}
            onSortChange={(value) => setSort(value as 'default' | 'az' | 'za')}
            viewType={activeView}
            onViewChange={setActiveView}
            sortOptions={sortOptions}
            renderGridView={() => (
              <ContentGrid
                items={filteredAndSortedTypes}
                renderCard={(type) => (
                  <TagLinkTypeCard
                    type={type}
                    onDelete={handleDeleteClick}
                    onEdit={handleEditClick}
                  />
                )}
                gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
                gap="gap-4"
                emptyMessage="No tag link types found."
                getItemKey={(type) => type._id}
              />
            )}
            renderListView={() => (
              <TagLinkTypeListView
                types={filteredAndSortedTypes}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            )}
            icon={<Link className="h-4 w-4 mr-2 text-primary" />}
          />
        )}
      </div>

      {currentType && (
        <EditTagLinkTypeDialog
          isOpen={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setCurrentType(null);
          }}
          type={currentType}
          onSave={handleUpdateType}
          allLinkTypes={types}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the link type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renderActionsDialog()}
    </TabContent>
  );
}

export default AdminTagLinkTypeTab;
