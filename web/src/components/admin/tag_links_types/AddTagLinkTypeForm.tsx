import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import tagLinksTypesService from '@/utils/services/tagLinksTypesService'; import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '_NONE_'; // Represents no selection

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  description: z.string().optional(),
  complementary_link_name: z.string().optional(), // Stays as string, will hold NONE_VALUE
  direction: z.enum(['unset', 'up', 'down', 'horizontal']),
});

interface AddTagLinkTypeFormProps {
  onAddType: (values: { name: string; description?: string; complementary_link_name?: string, direction?: 'up' | 'down' | 'horizontal' | 'unset' }) => Promise<void>;
  allLinkTypes: { _id: string, name: string }[];
}

function AddTagLinkTypeForm({ onAddType, allLinkTypes = [] }: AddTagLinkTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      complementary_link_name: NONE_VALUE, // Default to our "None" value
      direction: 'unset',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        complementary_link_name: values.complementary_link_name === NONE_VALUE ? undefined : values.complementary_link_name,
        direction: values.direction,
      };
      await onAddType(payload);
      form.reset({
        name: '', description: '', complementary_link_name: NONE_VALUE, direction: 'unset',
      });
      toast.success('Link type added successfully!');
    } catch (error: any) {
      let errorMessage = 'Failed to add link type';
      if (error && typeof error === 'object' && error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Link Type</h3>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter link type name" />
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
                  value={field.value} // Value will be NONE_VALUE by default
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a complementary link type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {allLinkTypes.map((type) => (
                      <SelectItem key={type._id} value={type.name}>
                        {type.name}
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

          <Button type="submit" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Adding...' : 'Add Link Type'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default AddTagLinkTypeForm;
