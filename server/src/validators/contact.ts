import { z } from 'zod';
import { CONTACT_STATUSES, INSURANCE_TYPES } from '../config/constants.js';
import { emailSchema, phoneSchema, textField } from './common.js';

export const contactBodySchema = z.object({
  name: textField(2, 120),
  email: emailSchema,
  phone: phoneSchema,
  subject: textField(3, 150),
  insuranceType: z.enum(INSURANCE_TYPES).optional().or(z.literal('')),
  message: textField(10, 5000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent to the privacy notice is required.' }) }),
  website: z.string().max(0).optional().default(''),
});

export const contactStatusSchema = z.object({
  status: z.enum(CONTACT_STATUSES),
});
