import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import CreatableSelect from 'react-select/creatable';
import {
  Link as LinkIcon, X, PlusCircle, Loader2, Share2Icon,
} from 'lucide-react';
import Select_RS from 'react-select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'; import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, TagCategory, ReactSelectOption } from '@/types/admin';
import { TagLinkType } from '@/utils/services/tagLinksTypesService';
import { tagService, UpdateTagPayload } from '@/utils/services/tagService';
import TagNetworkGraphDialog from './TagNetworkGraphDialog';
import { TagLink } from '@/utils/services/tagLinksService';

interface LinkToAdd {
  id: string; // Client-side temporary ID for list management
  targetTagName: string;
  relationship: string;
}

interface EditTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onSave: (tagId: string, updates: UpdateTagPayload) => Promise<void>;
  allowedCategories: TagCategory[];
  alltag_names: string[];
  allTags: Tag[];
  tagLinkTypes: TagLinkType[];
  allTagLinks: TagLink[];
}

interface ManagedLink {
  clientId: string;
  linkId?: string;
  targetTagName: string;
  relationship: string;
}

const customSelectStyles = {
  control: (base: any, { isDisabled, isFocused }: any) => ({
    ...base,
    minHeight: '38px',
    backgroundColor: isDisabled ? 'hsl(var(--muted))' : 'hsl(var(--input))',
    borderColor: isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
    '&:hover': {
      borderColor: !isDisabled ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    },
    boxShadow: isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
    borderRadius: 'var(--radius)',
    paddingLeft: '0.25rem',
  }),
  input: (base: any) => ({
    ...base, color: 'hsl(var(--foreground))', margin: '0px', paddingTop: '0px', paddingBottom: '0px',
  }),
  valueContainer: (base: any) => ({ ...base, paddingTop: '2px', paddingBottom: '2px' }),
  singleValue: (base: any) => ({ ...base, color: 'hsl(var(--foreground))', margin: '0px' }),
  placeholder: (base: any) => ({ ...base, color: 'hsl(var(--muted-foreground))', margin: '0px' }),
  menu: (base: any) => ({
    ...base, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderWidth: '1px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50,
  }),
  option: (base: any, { isDisabled, isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isDisabled ? undefined : isSelected ? 'hsl(var(--primary))' : isFocused ? 'hsl(var(--accent))' : 'hsl(var(--popover))',
    color: isDisabled ? 'hsl(var(--muted-foreground))' : isSelected ? 'hsl(var(--primary-foreground))' : isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
    cursor: isDisabled ? 'not-allowed' : 'default',
    padding: '0.5rem 0.75rem',
    ':active': { ...base[':active'], backgroundColor: !isDisabled && !isSelected ? 'hsl(var(--primary))' : undefined, color: !isDisabled && !isSelected ? 'hsl(var(--primary-foreground))' : undefined },
  }),
  dropdownIndicator: (base: any, { isDisabled }: any) => ({
    ...base, padding: '0.5rem', color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))', '&:hover': { color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' },
  }),
  clearIndicator: (base: any, { isDisabled }: any) => ({
    ...base, padding: '0.5rem', color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))', '&:hover': { color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' },
  }),
};

const EditTagDialog: React.FC<EditTagDialogProps> = ({
  isOpen, onClose, tag, onSave, allowedCategories, alltag_names, allTags, tagLinkTypes, allTagLinks,
}) => {
  const [tag_name, settag_name] = useState('');
  const [aliases, setAliases] = useState<readonly ReactSelectOption[]>([]);
  const [category, setCategory] = useState<TagCategory | string>('');
  const [trendable, setTrendable] = useState(false);
  const [explorable, setExplorable] = useState(false);
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [financeApproved, setFinanceApproved] = useState(false);
  const [aliasMatchEligible, setAliasMatchEligible] = useState(true);
  const [wallpaper, setWallpaper] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLinkTargetTagName, setNewLinkTargetTagName] = useState<string>('');
  const [newLinkRelationship, setNewLinkRelationship] = useState<string>('');

  const [managedLinks, setManagedLinks] = useState<ManagedLink[]>([]);
  const [isNetworkViewOpen, setIsNetworkViewOpen] = useState(false);

  const tagOptions = useMemo(() => alltag_names.map((name) => ({ value: name, label: name })), [alltag_names]);

  useEffect(() => {
    const fetchTagDetails = async (tagId: string) => {
      setIsLoadingDetails(true);
      setError(null);
      try {
        const detailedTag = await tagService.getTagWithDetails(tagId);
        if (detailedTag) {
          settag_name(detailedTag.tag_name);
          setAliases(detailedTag.aliases?.map((a) => ({ value: a, label: a })) || []);
          setCategory(detailedTag.category || (allowedCategories.length > 0 ? allowedCategories[0] : ''));
          setTrendable(detailedTag.trendable || false);
          setExplorable(detailedTag.explorable || false);
          setHumanReviewed(detailedTag.humanReviewed || false);
          setFinanceApproved(detailedTag.finance_approved || false);
          setAliasMatchEligible(detailedTag.alias_match_eligible !== undefined ? detailedTag.alias_match_eligible : true);
          setWallpaper(detailedTag.wallpaper || '');

          const outgoingLinks = (detailedTag.links || []).map((link) => ({
            clientId: link._id || `client-${Date.now()}-${Math.random()}`,
            linkId: link._id,
            targetTagName: link.targetTag,
            relationship: link.relationship,
          }));
          setManagedLinks(outgoingLinks);
        } else {
          setError('Failed to load tag details.');
          toast.error('Failed to load tag details.');
          settag_name('');
          setAliases([]);
          setCategory(allowedCategories.length > 0 ? allowedCategories[0] : '');
          setTrendable(false);
          setExplorable(false);
          setHumanReviewed(false);
          setFinanceApproved(false);
          setAliasMatchEligible(true);
          setWallpaper('');
          setManagedLinks([]);
        }
      } catch (err: any) {
        console.error('Error fetching tag details:', err);
        setError(err.message || 'Failed to load tag details.');
        toast.error(err.message || 'Failed to load tag details.');
        settag_name('');
        setAliases([]);
        setCategory(allowedCategories.length > 0 ? allowedCategories[0] : '');
        setTrendable(false);
        setExplorable(false);
        setHumanReviewed(false);
        setFinanceApproved(false);
        setAliasMatchEligible(true);
        setWallpaper('');
        setManagedLinks([]);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (isOpen && tag) {
      fetchTagDetails(tag._id);
      setNewLinkTargetTagName('');
      setNewLinkRelationship('');
    } else if (!isOpen) {
      settag_name('');
      setAliases([]);
      setCategory(allowedCategories.length > 0 ? allowedCategories[0] : '');
      setTrendable(false);
      setExplorable(false);
      setHumanReviewed(false);
      setFinanceApproved(false);
      setAliasMatchEligible(true);
      setWallpaper('');
      setError(null);
      setNewLinkTargetTagName('');
      setNewLinkRelationship('');
      setManagedLinks([]);
      setIsLoadingDetails(false);
    }
  }, [tag, isOpen, allowedCategories]);

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!tag) return;
    const trimmedtag_name = tag_name.trim();
    if (!trimmedtag_name) {
      toast.error('Tag name cannot be empty.');
      return;
    }
    if (!category) {
      toast.error('Please select a category.');
      return;
    }

    setIsSaving(true);
    setError(null);
    const aliasList = aliases.map((option) => option.value.trim()).filter(Boolean);

    const updates: UpdateTagPayload = {
      tag_name: tag_name.trim(),
      aliases: aliasList,
      category: category as TagCategory,
      trendable,
      explorable,
      humanReviewed,
      finance_approved: financeApproved,
      alias_match_eligible: aliasMatchEligible,
      wallpaper: wallpaper.trim() || null,
      links: managedLinks.map((link) => ({
        targetTagName: link.targetTagName,
        relationship: link.relationship,
      })),
    };

    try {
      await onSave(tag._id, updates);
      toast.success(`Tag "${tag_name.trim()}" updated successfully.`);
      handleClose();
    } catch (err: any) {
      console.error('Save tag failed:', err);
      setError(err.message || 'Failed to save tag.');
      toast.error(err.message || 'Failed to save tag.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLinkToList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTargetTagName || !newLinkRelationship) {
      toast.error('Please select a target tag and a relationship type.');
      return;
    }
    if (managedLinks.some((l) => l.targetTagName === newLinkTargetTagName && l.relationship === newLinkRelationship)) {
      toast.warning(`This link (Target: ${newLinkTargetTagName}, Relationship: ${newLinkRelationship}) is already in the list.`);
      return;
    }

    setManagedLinks((prevLinks) => [
      ...prevLinks,
      {
        clientId: `new-${Date.now()}-${Math.random()}`,
        targetTagName: newLinkTargetTagName,
        relationship: newLinkRelationship,
      },
    ]);
    toast.success(`Link to "${newLinkTargetTagName}" added to list. Save changes to apply.`);
    setNewLinkTargetTagName('');
    setNewLinkRelationship('');
  };

  const handleDeleteLinkFromList = async (clientIdToDelete: string) => {
    setManagedLinks((prevLinks) => prevLinks.filter((link) => link.clientId !== clientIdToDelete));
    toast.info('Link removed from the list. Save changes to apply.');
  };

  const availableTargetTagsOptions = useMemo(() => {
    if (!tag) return [];
    return allTags
      .filter((t) => t.tag_name.toLowerCase() !== tag_name.trim().toLowerCase())
      .map((t) => ({ value: t.tag_name, label: t.tag_name }));
  }, [allTags, tag_name, tag]);

  const tagLinkTypeOptions = useMemo(() => tagLinkTypes.map((type) => ({ value: type.name, label: `${type.name} (${type.description || 'No description'})` })), [tagLinkTypes]);

  const handleOpenNetworkView = () => {
    if (tag) {
      setIsNetworkViewOpen(true);
    }
  };

  if (!isOpen || !tag) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                Edit Tag:
                {tag?.tag_name}
              </DialogTitle>
              {tag && (
                <Button variant="outline" size="sm" onClick={handleOpenNetworkView} title="View Tag Network">
                  <Share2Icon className="h-4 w-4 mr-1" />
                  {' '}
                  Network
                </Button>
              )}
            </div>
            <DialogDescription>
              Modify the details for this tag. Changes will affect related content.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-destructive text-sm px-6 py-2">{error}</p>}
          {isLoadingDetails && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span>Loading tag details...</span>
            </div>
          )}

          {!isLoadingDetails && !error && (
            <>
              <div className="overflow-y-auto max-h-[70vh]">
                <div className="grid gap-4 py-4 px-6">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-tag_name" className="text-right">
                      Name *
                    </Label>
                    <Input
                      id="edit-tag_name"
                      value={tag_name}
                      onChange={(e) => settag_name(e.target.value)}
                      className="col-span-3"
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-category" className="text-right">
                      Category *
                    </Label>
                    <div className="col-span-3">
                      <ShadcnSelect
                        value={category}
                        onValueChange={(value) => setCategory(value as TagCategory)}
                        disabled={isSaving || allowedCategories.length === 0}
                      >
                        <SelectTrigger id="edit-category" className="w-full">
                          <SelectValue placeholder={allowedCategories.length > 0 ? 'Select category' : 'Loading...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedCategories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="capitalize">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </ShadcnSelect>
                      {allowedCategories.length === 0 && <p className="text-xs text-destructive mt-1">No categories available.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-aliases" className="text-right">
                      Aliases
                    </Label>
                    <div className="col-span-3">
                      <CreatableSelect<ReactSelectOption, true>
                        inputId="edit-aliases"
                        isMulti
                        options={tagOptions.filter((opt) => opt.value !== tag?.tag_name && !aliases.find((a) => a.value === opt.value))}
                        value={aliases}
                        onChange={(newValue) => setAliases(newValue)}
                        placeholder="Type or select aliases..."
                        isDisabled={isSaving}
                        classNamePrefix="react-select"
                        styles={customSelectStyles}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-wallpaper" className="text-right">
                      Wallpaper URL
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="edit-wallpaper"
                        value={wallpaper}
                        onChange={(e) => setWallpaper(e.target.value)}
                        placeholder="https://example.com/wallpaper.jpg"
                        className="col-span-3"
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        URL to a wallpaper image for this tag. Leave empty to auto-generate.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 pl-4 pr-4 md:pl-0 md:pr-0">
                    <Label className="block text-sm font-medium mb-1">Flags:</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-trendable"
                        checked={trendable}
                        onCheckedChange={(checked) => setTrendable(Boolean(checked))}
                        disabled={isSaving}
                      />
                      <Label htmlFor="edit-trendable" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Trendable (Show in Topic Bar)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-explorable"
                        checked={explorable}
                        onCheckedChange={(checked) => setExplorable(Boolean(checked))}
                        disabled={isSaving}
                      />
                      <Label htmlFor="edit-explorable" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Explorable (Show in 'More Topics')
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-humanReviewed"
                        checked={humanReviewed}
                        onCheckedChange={(checked) => setHumanReviewed(Boolean(checked))}
                        disabled={isSaving}
                      />
                      <Label htmlFor="edit-humanReviewed" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Human Reviewed
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-financeApproved"
                        checked={financeApproved}
                        onCheckedChange={(checked) => setFinanceApproved(Boolean(checked))}
                        disabled={isSaving}
                      />
                      <Label htmlFor="edit-financeApproved" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Finance Approved
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-aliasMatchEligible"
                        checked={aliasMatchEligible}
                        onCheckedChange={(checked) => setAliasMatchEligible(Boolean(checked))}
                        disabled={isSaving}
                      />
                      <Label htmlFor="edit-aliasMatchEligible" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Alias Match Eligible (Use aliases for content matching)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t">
                  <h3 className="text-lg font-semibold mb-3">Manage Tag Links</h3>

                  {managedLinks.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <Label className="block text-sm font-medium">Current Links for this tag:</Label>
                      <ul className="list-disc pl-5 space-y-1 text-sm max-h-40 overflow-y-auto">
                        {managedLinks.map((link) => {
                          const targetTagDetails = allTags.find((t) => t.tag_name === link.targetTagName);
                          return (
                            <li key={link.clientId} className="flex justify-between items-center group">
                              <span>
                                <span className="font-semibold">{link.relationship}</span>
                                {' '}
                                to
                                <span className="font-semibold">{link.targetTagName}</span>
                                {targetTagDetails?.category && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (
                                  {targetTagDetails.category}
                                  )
                                </span>
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLinkFromList(link.clientId)}
                                disabled={isSaving}
                                className="text-destructive hover:text-destructive/80 px-1 py-0 h-auto opacity-50 group-hover:opacity-100"
                              >
                                <X size={14} />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {managedLinks.length === 0 && !tag?.tag_name && (
                  <p className="text-sm text-muted-foreground mb-3">Save the tag first to manage links.</p>
                  )}
                  {managedLinks.length === 0 && tag?.tag_name && (
                  <p className="text-sm text-muted-foreground mb-3">No links defined for this tag yet.</p>
                  )}

                  <form onSubmit={handleAddLinkToList} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="edit-new-link-relationship">Relationship Type</Label>
                        <Select_RS<ReactSelectOption>
                          inputId="edit-new-link-relationship"
                          options={tagLinkTypeOptions}
                          value={tagLinkTypeOptions.find((opt) => opt.value === newLinkRelationship) || null}
                          onChange={(option) => setNewLinkRelationship(option ? option.value : '')}
                          isDisabled={isSaving || tagLinkTypes.length === 0}
                          placeholder={tagLinkTypes.length > 0 ? 'Select relationship' : 'No link types'}
                          isClearable
                          isSearchable
                          styles={customSelectStyles}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="edit-new-link-target">Target Tag</Label>
                        <Select_RS<ReactSelectOption>
                          inputId="edit-new-link-target"
                          options={availableTargetTagsOptions}
                          value={availableTargetTagsOptions.find((opt) => opt.value === newLinkTargetTagName) || null}
                          onChange={(option) => setNewLinkTargetTagName(option ? option.value : '')}
                          isDisabled={isSaving || availableTargetTagsOptions.length === 0}
                          placeholder={availableTargetTagsOptions.length > 0 ? 'Select target' : 'No other tags'}
                          isClearable
                          isSearchable
                          styles={customSelectStyles}
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSaving || !newLinkTargetTagName || !newLinkRelationship}
                        className="w-full md:w-auto"
                      >
                        <PlusCircle size={16} className="mr-1" />
                        Add Link to List
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={handleClose} disabled={isSaving || isLoadingDetails}>Cancel</Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isLoadingDetails || !tag_name.trim() || !category || (allowedCategories.length > 0 && !category)}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {' '}
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {tag && (
        <TagNetworkGraphDialog
          isOpen={isNetworkViewOpen}
          onClose={() => setIsNetworkViewOpen(false)}
          targetTagName={tag.tag_name}
        />
      )}
    </>
  );
};

export default EditTagDialog;
