import { z } from 'zod';
import { stripTags } from '../utils/sanitize.js';

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine((value) => /^\+?[0-9]{9,15}$/.test(value), 'Enter a valid telephone number.');

export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.')
  .max(254)
  .transform((value) => value.toLowerCase());

export const textField = (min: number, max: number) =>
  z
    .string()
    .transform(stripTags)
    .pipe(z.string().min(min, min === 1 ? 'This field is required.' : `Enter at least ${min} characters.`).max(max));

export const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => stripTags(value ?? ''))
    .transform((value) => value || undefined)
    .pipe(z.string().max(max).optional());

export const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || /^https:\/\/\S+$/i.test(value), 'Use a full https URL or leave this blank.')
  .optional()
  .default('');

export const campaignSchema = z
  .object({
    source: z.string().trim().max(120).optional(),
    medium: z.string().trim().max(120).optional(),
    campaign: z.string().trim().max(120).optional(),
    term: z.string().trim().max(120).optional(),
    content: z.string().trim().max(120).optional(),
  })
  .optional();

export const positiveAmount = z.coerce
  .number({ invalid_type_error: 'Enter a valid amount.' })
  .positive('Enter an amount greater than zero.')
  .max(1_000_000_000_000, 'Amount is too large.');

export const optionalAmount = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  positiveAmount.optional(),
);
