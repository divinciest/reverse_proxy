import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Combobox from '@/components/ui/combobox'; import { personFormSchema, type PersonFormValues } from '@/validators/personSchemas';

interface AddPersonFormProps {
  onAddPerson: (personName: string) => Promise<void>;
  icon?: React.ReactNode;
}

function AddPersonForm({ onAddPerson, icon }: AddPersonFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      personName: '',
    },
  });

  const onSubmit = async (values: PersonFormValues) => {
    try {
      setLoading(true);
      await onAddPerson(values.personName);
      form.reset();
      toast.success('Person added successfully');
    } catch (error) {
      toast.error('Failed to add person');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-lg font-semibold">Add New Person</h3>
          </div>

          <FormField
            control={form.control}
            name="personName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Person Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter person name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Adding...' : 'Add Person'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default AddPersonForm;
