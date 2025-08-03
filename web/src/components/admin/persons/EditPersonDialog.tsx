import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Combobox from '@/components/ui/combobox';

interface Person {
  _id: string;
  personName: string;
}

interface EditPersonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onSave: (personId: string, personName: string) => Promise<void>;
  allPersonNames: string[];
}

interface FormValues {
  personName: string;
}

function EditPersonDialog({
  isOpen, onClose, person, onSave, allPersonNames,
}: EditPersonDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      personName: '',
    },
  });

  React.useEffect(() => {
    if (person) {
      form.reset({
        personName: person.personName,
      });
    }
  }, [person, form]);

  const validateForm = (values: FormValues): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!values.personName.trim()) {
      errors.personName = 'Person name is required';
    } else if (
      allPersonNames.some(
        (name) => name.toLowerCase() === values.personName.toLowerCase() && name !== person?.personName,
      )
    ) {
      errors.personName = 'Person name must be unique';
    }

    return errors;
  };

  const handleSubmit = async (values: FormValues) => {
    if (!person) return;
    await onSave(person._id, values.personName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Edit Person</h2>

              {form.formState.errors.root && (
                <p className="text-red-500 text-sm mb-2">
                  {form.formState.errors.root.message}
                </p>
              )}

              <FormField
                control={form.control}
                name="personName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter person name" />
                    </FormControl>
                    {form.formState.errors.personName && (
                      <FormMessage>{form.formState.errors.personName.message}</FormMessage>
                    )}
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditPersonDialog;
