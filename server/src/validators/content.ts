import { z } from 'zod';
import { INSURANCE_TYPES } from '../config/constants.js';
import { httpsUrl, textField } from './common.js';

export const partnerSchema = z.object({
  name: textField(2, 120),
  logoUrl: httpsUrl,
  description: z.string().trim().max(500).optional().default(''),
  websiteUrl: httpsUrl,
  active: z.boolean().optional().default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isDemo: z.boolean().optional().default(false),
});

export const testimonialSchema = z.object({
  customerDisplayName: textField(2, 120),
  review: textField(10, 1000),
  insuranceType: z.enum(INSURANCE_TYPES).optional().or(z.literal('')).default(''),
  avatarUrl: httpsUrl,
  verified: z.boolean().optional().default(false),
  approved: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isDemo: z.boolean().optional().default(false),
});

export const teamSchema = z.object({
  name: textField(2, 120),
  jobTitle: textField(2, 120),
  biography: textField(10, 1500),
  imageUrl: httpsUrl,
  qualifications: z.array(z.string().trim().min(1).max(160)).max(12).optional().default([]),
  linkedinUrl: httpsUrl,
  active: z.boolean().optional().default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isDemo: z.boolean().optional().default(false),
});

export const faqSchema = z.object({
  question: textField(8, 300),
  answer: textField(10, 3000),
  category: z.string().trim().min(1).max(80).default('general'),
  displayOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const insuranceContentSchema = z.object({
  name: textField(2, 160),
  shortDescription: textField(10, 400),
  overview: textField(20, 4000),
  metaTitle: z.string().trim().max(160).optional().default(''),
  metaDescription: z.string().trim().max(300).optional().default(''),
});

const valueSchema = z.object({
  title: textField(2, 80),
  description: textField(2, 300),
});

export const settingsSchema = z.object({
  companyName: textField(2, 160),
  logoUrl: httpsUrl,
  tagline: z.string().trim().max(240).optional().default(''),
  telephone: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().max(254).optional().default(''),
  address: z.string().trim().max(400).optional().default(''),
  officeHours: z.string().trim().max(240).optional().default(''),
  socialLinks: z
    .object({
      facebook: httpsUrl,
      instagram: httpsUrl,
      linkedin: httpsUrl,
      youtube: httpsUrl,
    })
    .partial()
    .optional()
    .default({}),
  whatsappNumber: z.string().trim().max(20).optional().default(''),
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  businessTimezone: z.string().trim().min(1).max(80),
  notificationEmail: z.string().trim().max(254).optional().default(''),
  aboutIntro: z.string().trim().max(2000).optional().default(''),
  mission: z.string().trim().max(1000).optional().default(''),
  vision: z.string().trim().max(1000).optional().default(''),
  values: z.array(valueSchema).max(8).optional().default([]),
});

export const staffCreateSchema = z.object({
  name: textField(2, 120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .max(128)
    .regex(/[A-Za-z]/, 'Include at least one letter.')
    .regex(/[0-9]/, 'Include at least one number.'),
  role: z.enum(['admin', 'staff']),
});

export const staffUpdateSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(['admin', 'staff']).optional(),
});
