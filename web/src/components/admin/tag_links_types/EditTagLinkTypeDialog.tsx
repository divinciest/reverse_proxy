import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import tagLinksTypesService, { TagLinkType } from '@/utils/services/tagLinksTypesService'; import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '_NONE_'; // Represents no selection

// Define the Zod schema for form validation
const formSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  complementary_link_name: z.string().optional(),
  direction: z.enum(['unset', 'up', 'down', 'horizontal']),
});

type FormData = z.infer<typeof formSchema>;

interface EditTagLinkTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: TagLinkType | null;
  onSave: (typeId: string, data: { description?: string, complementary_link_name?: string | null, direction?: 'up' | 'down' | 'horizontal' | 'unset' }) => Promise<void>;
  allLinkTypes: { _id: string, name: string }[];
}

function EditTagLinkTypeDialog({
  isOpen, onClose, type, onSave, allLinkTypes = [],
}: EditTagLinkTypeDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      complementary_link_name: NONE_VALUE,
      direction: 'unset',
    },
  });

  React.useEffect(() => {
    if (isOpen && type) {
      form.reset({
        name: type.name,
        description: type.description || '',
        complementary_link_name: type.complementary_link_name || NONE_VALUE,
        direction: type.direction || 'unset',
      });
    }
  }, [isOpen, type, form]);

  const handleSubmit = async (values: FormData) => {
    if (!type) return;
    try {
      const updatePayload: { description?: string; complementary_link_name?: string | null, direction?: 'up' | 'down' | 'horizontal' | 'unset' } = {};
      let changed = false;

      if (values.description !== (type.description || '')) {
        updatePayload.description = values.description;
        changed = true;
      }

      if (values.direction !== (type.direction || 'unset')) {
        updatePayload.direction = values.direction;
        changed = true;
      }

      const currentComplementaryInForm = type.complementary_link_name || NONE_VALUE;
      const newComplementaryName = values.complementary_link_name === NONE_VALUE ? null : values.complementary_link_name;

      if (newComplementaryName !== currentComplementaryInForm) {
        updatePayload.complementary_link_name = newComplementaryName;
        changed = true;
      }

      if (!changed) {
        toast.info('No changes to save.');
        onClose();
        return;
      }

      await onSave(type._id, updatePayload);
      onClose();
    } catch (error: any) {
      console.error('Error updating link type:', error);
      toast.error(error.message || 'Failed to update link type.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Link Type</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter description" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complementary_link_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complementary Link (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a complementary link type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>None</SelectItem>
                      {allLinkTypes
                        .filter((lt) => lt.name !== type?.name)
                        .map((lt) => (
                          <SelectItem key={lt._id} value={lt.name}>
                            {lt.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a direction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unset">Unset</SelectItem>
                      <SelectItem value="up">Up</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditTagLinkTypeDialog;
