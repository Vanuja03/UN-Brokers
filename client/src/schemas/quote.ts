import { z } from 'zod';
import { INSURANCE_TYPES, type InsuranceType } from '../types';

const currentYear = new Date().getFullYear();

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine((value) => /^\+?[0-9]{9,15}$/.test(value), 'Enter a valid telephone number.');

export const emailSchema = z.string().trim().email('Enter a valid email address.').max(254);

const textField = (min: number, max: number) => z.string().trim().min(min, 'This field is required.').max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const positiveAmount = z.coerce.number({ invalid_type_error: 'Enter a valid amount.' }).positive('Enter an amount greater than zero.');
const optionalAmount = z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), positiveAmount.optional());

const vehicleBase = {
  vehicleType: z.enum(['private-car', 'motorcycle', 'three-wheeler', 'van', 'lorry', 'bus', 'other']),
  vehicleMake: textField(1, 80),
  vehicleModel: textField(1, 80),
  yearOfManufacture: z.coerce.number().int().min(1980, 'Enter a valid year.').max(currentYear + 1),
  registrationAvailable: z.enum(['yes', 'no']),
  registrationNumber: z.string().trim().max(20).optional().or(z.literal('')),
  ownershipStatus: z.enum(['owned', 'financed', 'leased', 'other']),
  estimatedMarketValue: positiveAmount,
  vehicleUsage: z.enum(['private', 'business', 'commercial-passenger', 'goods-transport', 'other']),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric', 'other']),
  existingPolicyRenewal: optionalText(500),
  additionalNotes: optionalText(2000),
};

function withRegistration<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const record = data as { registrationAvailable?: string; registrationNumber?: string };
    if (record.registrationAvailable === 'yes' && !record.registrationNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['registrationNumber'], message: 'Enter the registration number, or choose No if it is not available.' });
    }
  });
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

export const detailSchemas = {
  motor: withRegistration({
    ...vehicleBase,
    preferredCoverage: z.enum(['comprehensive', 'third-party', 'third-party-fire-theft', 'unsure']),
  }),
  'motor-third-party': withRegistration({ ...vehicleBase, liabilityNotes: optionalText(1000) }),
  travel: z
    .object({
      destination: textField(2, 160),
      departureDate: isoDate,
      returnDate: isoDate,
      travelerCount: z.coerce.number().int().min(1).max(20),
      travelerAges: textField(1, 120),
      benefitPreferences: z.array(z.enum(['medical', 'baggage', 'cancellation', 'other'])).max(4).optional().default([]),
      additionalNotes: optionalText(2000),
    })
    .superRefine((data, ctx) => {
      if (data.returnDate < data.departureDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Return date must be on or after the departure date.' });
      }
    }),
  fire: z
    .object({
      propertyType: z.enum(['commercial', 'industrial', 'warehouse', 'office', 'mixed-use', 'other']),
      location: textField(3, 240),
      coverBuilding: z.boolean().optional().default(false),
      coverContents: z.boolean().optional().default(false),
      estimatedInsuredValue: positiveAmount,
      occupancy: textField(2, 160),
      riskDetails: optionalText(1500),
    })
    .superRefine((data, ctx) => {
      if (!data.coverBuilding && !data.coverContents) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['coverBuilding'], message: 'Choose building, contents, or both.' });
      }
    }),
  'dwelling-fire': z
    .object({
      propertyAddress: textField(3, 240),
      occupantStatus: z.enum(['owner', 'tenant', 'landlord', 'other']),
      buildingValue: optionalAmount,
      contentsValue: optionalAmount,
      constructionType: optionalText(80),
      riskDetails: optionalText(1500),
    })
    .superRefine((data, ctx) => {
      if (!data.buildingValue && !data.contentsValue) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['buildingValue'], message: 'Enter a building value, a contents value, or both.' });
      }
    }),
  'workers-compensation': z.object({
    businessActivity: textField(2, 200),
    employeeCount: z.coerce.number().int().min(1).max(100000),
    employeeCategories: textField(2, 300),
    estimatedAnnualPayroll: optionalAmount,
    workplaceRiskDetails: optionalText(1500),
  }),
  'money-in-transit': z.object({
    businessType: textField(2, 160),
    typicalAmountCarried: positiveAmount,
    transitFrequency: z.enum(['daily', 'weekly', 'occasional', 'other']),
    securityArrangements: textField(2, 500),
    collectionDeliveryDetails: textField(2, 500),
    additionalNotes: optionalText(1500),
  }),
  'personal-accident': z.object({
    occupation: textField(2, 120),
    desiredCoverageAmount: positiveAmount,
    benefitPreferences: optionalText(400),
    additionalInformation: optionalText(1500),
  }),
  'title-insurance': z.object({
    propertyLocation: textField(3, 240),
    propertyType: textField(2, 120),
    transactionType: z.enum(['purchase', 'sale', 'refinance', 'other']),
    estimatedPropertyValue: positiveAmount,
    applicantRole: z.enum(['buyer', 'seller', 'lender', 'other']),
    additionalInformation: optionalText(1500),
  }),
} satisfies Record<InsuranceType, z.ZodTypeAny>;

export const contactSchema = z.object({
  customerName: textField(2, 120),
  phone: phoneSchema,
  email: emailSchema,
  preferredContactMethod: z.enum(['phone', 'email', 'either']),
  insuranceType: z.enum(INSURANCE_TYPES),
});

export function buildQuoteSchema(type: InsuranceType) {
  return contactSchema.extend({
    insuranceDetails: detailSchemas[type],
    message: optionalText(2000),
    consent: z.literal(true, { errorMap: () => ({ message: 'Consent to the privacy notice is required.' }) }),
    website: z.string().max(0).optional().or(z.literal('')),
  });
}

export const contactFormSchema = z.object({
  name: textField(2, 120),
  email: emailSchema,
  phone: phoneSchema,
  subject: textField(3, 150),
  insuranceType: z.enum(INSURANCE_TYPES).optional().or(z.literal('')),
  message: textField(10, 5000),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consent to the privacy notice is required.' }) }),
  website: z.string().max(0).optional().or(z.literal('')),
});
