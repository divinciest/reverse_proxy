import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { X } from 'lucide-react'; // Added for removing links
import Select_RS from 'react-select'; // For searchable selects
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TagCategory, Tag as TagType, ReactSelectOption } from '@/types/admin'; // Import types
import { Checkbox } from '@/components/ui/checkbox';
import { TagLinkType as AdminTagLinkType } from '@/utils/services/tagLinksTypesService'; // Added

interface LinkToAdd {
  id: string; // Client-side temporary ID for list management
  targetTagName: string;
  relationship: string;
}

interface AddTagFormProps {
  onAddTag: (
    tagName: string,
    aliases: string[],
    category: TagCategory,
    trendable: boolean,
    explorable: boolean,
    humanReviewed: boolean,
    financeApproved: boolean,
    aliasMatchEligible: boolean,
    wallpaper: string | undefined,
    initialLinks: Array<{ targetTagName: string; relationship: string }> // Updated
  ) => Promise<void>;
  icon?: React.ReactNode;
  allowedCategories?: TagCategory[];
  defaultCategory?: TagCategory | string;
  alltag_names?: string[];
  allTags: TagType[]; // Used for selecting target tags for links
  tagLinkTypes: AdminTagLinkType[]; // Used for selecting relationship types
}

// Define customSelectStyles here or import from a shared location
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
    ...base,
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    zIndex: 50,
  }),
  option: (base: any, { isDisabled, isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isDisabled
      ? undefined
      : isSelected
        ? 'hsl(var(--primary))'
        : isFocused
          ? 'hsl(var(--accent))'
          : undefined,
    color: isDisabled
      ? 'hsl(var(--muted-foreground))'
      : isSelected
        ? 'hsl(var(--primary-foreground))'
        : isFocused
          ? 'hsl(var(--accent-foreground))'
          : 'hsl(var(--foreground))',
    cursor: isDisabled ? 'not-allowed' : 'default',
    '&:active': {
      backgroundColor: !isDisabled && (isSelected ? undefined : 'hsl(var(--primary)/0.9)'),
    },
  }),
  dropdownIndicator: (base: any, { isDisabled }: any) => ({
    ...base, padding: '0.5rem', color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))', '&:hover': { color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' },
  }),
  clearIndicator: (base: any, { isDisabled }: any) => ({
    ...base, padding: '0.5rem', color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))', '&:hover': { color: isDisabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))' },
  }),
};

const AddTagForm: React.FC<AddTagFormProps> = ({
  onAddTag,
  icon,
  allowedCategories = [],
  defaultCategory = '',
  alltag_names = [], // Keep for local validation before submit
  allTags,
  tagLinkTypes,
}) => {
  const [tag_name, settag_name] = useState('');
  const [aliases, setAliases] = useState(''); // Use a simple string for comma-separated aliases
  const [category, setCategory] = useState<TagCategory | string>(defaultCategory || (allowedCategories.length > 0 ? allowedCategories[0] : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trendable, setTrendable] = useState(false);
  const [explorable, setExplorable] = useState(false);
  const [humanReviewed, setHumanReviewed] = useState(false);
  const [financeApproved, setFinanceApproved] = useState(false);
  const [aliasMatchEligible, setAliasMatchEligible] = useState(true);
  const [wallpaper, setWallpaper] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // --- State for Links to Add ---
  const [linksToAdd, setLinksToAdd] = useState<LinkToAdd[]>([]);
  const [currentLinkTarget, setCurrentLinkTarget] = useState<string>('');
  const [currentLinkRelationship, setCurrentLinkRelationship] = useState<string>('');
  const [isProcessingLinks, setIsProcessingLinks] = useState(false);
  // --- End State for Links to Add ---

  useEffect(() => {
    setCategory(defaultCategory || (allowedCategories.length > 0 ? allowedCategories[0] : ''));
  }, [defaultCategory, allowedCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedtag_name = tag_name.trim();
    if (!trimmedtag_name) {
      setError('Tag name cannot be empty.');
      toast.error('Tag name cannot be empty.');
      return;
    }
    // Client-side check (backend will do the definitive check)
    if (alltag_names.map((name) => name.toLowerCase()).includes(trimmedtag_name.toLowerCase())) {
      setError(`Tag "${trimmedtag_name}" already exists or is a common alias. Please check existing tags.`);
      toast.error(`Tag "${trimmedtag_name}" already exists or is a common alias.`);
      return;
    }
    if (!category) {
      setError('Please select a category.');
      toast.error('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const aliasesArray = aliases.split(',').map((alias) => alias.trim()).filter((alias) => alias.length > 0);

    const initialLinksPayload = linksToAdd.map((link) => ({
      targetTagName: link.targetTagName,
      relationship: link.relationship,
    }));

    try {
      await onAddTag(
        trimmedtag_name,
        aliasesArray,
        category as TagCategory,
        trendable,
        explorable,
        humanReviewed,
        financeApproved,
        aliasMatchEligible,
        wallpaper.trim() || undefined,
        initialLinksPayload,
      );
      toast.success(`Tag "${trimmedtag_name}" added successfully${initialLinksPayload.length > 0 ? ` with ${initialLinksPayload.length} link(s)` : ''}.`);

      // Reset main form fields
      settag_name('');
      setAliases('');
      setCategory(defaultCategory || (allowedCategories.length > 0 ? allowedCategories[0] : ''));
      setTrendable(false);
      setExplorable(false);
      setHumanReviewed(false);
      setFinanceApproved(false);
      setAliasMatchEligible(true);
      setLinksToAdd([]); // Clear links from the list
      setCurrentLinkTarget('');
      setCurrentLinkRelationship('');

      // The separate link processing loop is removed.
      // if (linksToAdd.length > 0) { ... }
    } catch (err: any) {
      console.error('Add tag failed:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add tag.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLinkToList = () => {
    if (!currentLinkTarget || !currentLinkRelationship) {
      toast.error('Please select both a target tag and a relationship type for the link.');
      return;
    }
    if (linksToAdd.some((l) => l.targetTagName === currentLinkTarget && l.relationship === currentLinkRelationship)) {
      toast.warning('This specific link (target and relationship) has already been added to the list.');
      return;
    }
    setLinksToAdd((prev) => [...prev, { id: Date.now().toString(), targetTagName: currentLinkTarget, relationship: currentLinkRelationship }]);
    setCurrentLinkTarget('');
    setCurrentLinkRelationship('');
  };

  const handleRemoveLinkFromList = (idToRemove: string) => {
    setLinksToAdd((prev) => prev.filter((link) => link.id !== idToRemove));
  };

  const availableTargetTagsForNewLinkOptions = useMemo(() => allTags.map((t) => ({ value: t.tag_name, label: t.tag_name })), [allTags]);

  const tagLinkTypeOptions = useMemo(() => tagLinkTypes.map((type) => ({ value: type.name, label: `${type.name} (${type.description || 'No description'})` })), [tagLinkTypes]);

  return (
    <div className="bg-card text-card-foreground p-4 rounded-md border space-y-4">
      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
        {icon}
        Add New Tag
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-destructive text-sm mb-3">{error}</p>}
        <div className="space-y-1">
          <Label htmlFor="tag_name">Tag Name *</Label>
          <Input
            id="tag_name"
            value={tag_name}
            onChange={(e) => settag_name(e.target.value)}
            placeholder="e.g., artificial intelligence"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="aliases">Aliases (comma-separated)</Label>
          <Input
            id="aliases"
            type="text"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            placeholder="e.g. alt name 1, alt name 2"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">Alternative names for this tag.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="wallpaper">Wallpaper URL (optional)</Label>
          <Input
            id="wallpaper"
            type="url"
            value={wallpaper}
            onChange={(e) => setWallpaper(e.target.value)}
            placeholder="https://example.com/wallpaper.jpg"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">URL to a wallpaper image for this tag. Leave empty to auto-generate.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="category">Category *</Label>
          <ShadcnSelect
            value={category}
            onValueChange={(value) => setCategory(value as TagCategory)}
            disabled={allowedCategories.length === 0 || isSubmitting}
            required
          >
            <SelectTrigger id="category">
              <SelectValue placeholder={allowedCategories.length > 0 ? 'Select category' : 'Loading categories...'} />
            </SelectTrigger>
            <SelectContent>
              {allowedCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="capitalize">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </ShadcnSelect>
          {allowedCategories.length === 0 && <p className="text-xs text-destructive">No categories available. Please configure them in settings.</p>}
        </div>

        <div className="mt-4 space-y-2">
          <Label className="block text-sm font-medium mb-1">Flags:</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-trendable"
              checked={trendable}
              onCheckedChange={(checked) => setTrendable(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="add-trendable" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Trendable (Show in Topic Bar)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-explorable"
              checked={explorable}
              onCheckedChange={(checked) => setExplorable(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="add-explorable" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Explorable (Show in 'More Topics')
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-humanReviewed"
              checked={humanReviewed}
              onCheckedChange={(checked) => setHumanReviewed(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="add-humanReviewed" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Human Reviewed
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-financeApproved"
              checked={financeApproved}
              onCheckedChange={(checked) => setFinanceApproved(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="add-financeApproved" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Finance Approved
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-aliasMatchEligible"
              checked={aliasMatchEligible}
              onCheckedChange={(checked) => setAliasMatchEligible(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="add-aliasMatchEligible" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Alias Match Eligible (Use aliases for content matching)
            </Label>
          </div>
        </div>

        {/* --- Section for Adding Links --- */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-medium mb-3">Initial Links (Optional)</h4>
          {linksToAdd.length > 0 && (
            <div className="mb-3 space-y-2">
              <Label>Links to be created with this tag:</Label>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {linksToAdd.map((link) => (
                  <li key={link.id} className="flex justify-between items-center">
                    <span>
                      Target:
                      {' '}
                      <span className="font-semibold">{link.targetTagName}</span>
                      , Relationship:
                      {' '}
                      <span className="font-semibold">{link.relationship}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLinkFromList(link.id)}
                      disabled={isSubmitting || isProcessingLinks}
                      className="text-destructive hover:text-destructive/80 px-1 py-0 h-auto"
                    >
                      <X size={14} />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="new-link-relationship-addform">Relationship Type</Label>
              <Select_RS<ReactSelectOption>
                inputId="new-link-relationship-addform"
                options={tagLinkTypeOptions}
                value={tagLinkTypeOptions.find((opt) => opt.value === currentLinkRelationship) || null}
                onChange={(option) => setCurrentLinkRelationship(option ? option.value : '')}
                isDisabled={isSubmitting || isProcessingLinks || tagLinkTypes.length === 0}
                placeholder={tagLinkTypes.length > 0 ? 'Select relationship' : 'No link types'}
                isClearable
                isSearchable
                styles={customSelectStyles}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-link-target-addform">Target Tag</Label>
              <Select_RS<ReactSelectOption>
                inputId="new-link-target-addform"
                options={availableTargetTagsForNewLinkOptions}
                value={availableTargetTagsForNewLinkOptions.find((opt) => opt.value === currentLinkTarget) || null}
                onChange={(option) => setCurrentLinkTarget(option ? option.value : '')}
                isDisabled={isSubmitting || isProcessingLinks || availableTargetTagsForNewLinkOptions.length === 0}
                placeholder={availableTargetTagsForNewLinkOptions.length > 0 ? 'Select target' : 'No tags available'}
                isClearable
                isSearchable
                styles={customSelectStyles}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddLinkToList}
              disabled={isSubmitting || isProcessingLinks || !currentLinkTarget || !currentLinkRelationship}
              className="w-full md:w-auto"
            >
              Add Link to List
            </Button>
          </div>
        </div>
        {/* --- End Section for Adding Links --- */}

        <Button
          type="submit"
          className="w-full md:w-auto mt-6"
          disabled={isSubmitting || isProcessingLinks || allowedCategories.length === 0 || !tag_name.trim() || !category}
        >
          <Plus size={16} className="mr-1" />
          {isSubmitting ? 'Adding Tag...' : (linksToAdd.length > 0 ? 'Add Tag & Links' : 'Add Tag')}
        </Button>
      </form>
    </div>
  );
};

export default AddTagForm;
