import { z } from 'zod';
import { stripTags } from '../utils/sanitize.js';
import { textField } from './common.js';

export const debitAdviceSchema = z.object({
  confirmationType: z.enum(['renewal', 'new-business'], { errorMap: () => ({ message: 'Choose renewal or new business confirmation.' }) }),
  vehicleNumber: textField(1, 40),
  customerName: textField(1, 160),
  sumInsured: textField(1, 80),
  contactNo: z
    .string()
    .trim()
    .min(1, 'Enter a contact number.')
    .max(20, 'Enter 20 characters or fewer.')
    .refine((value) => /^[+0-9][0-9\s()-]{6,19}$/.test(value), 'Enter a valid contact number.'),
  notes: z.string().optional().transform((value) => stripTags(value ?? '').trim()).pipe(z.string().max(800, 'Enter 800 characters or fewer.')),
});

export type DebitAdviceInput = z.infer<typeof debitAdviceSchema>;
