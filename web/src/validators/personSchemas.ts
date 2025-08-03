import { z } from 'zod';

export const personFormSchema = z.object({
  personName: z.string()
    .min(1, 'Person name is required')
    .max(100, 'Person name must be less than 100 characters'),
});

export type PersonFormValues = z.infer<typeof personFormSchema>;
