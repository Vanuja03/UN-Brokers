import { z } from 'zod';
import { INSURANCE_TYPES } from '../config/constants.js';
import { campaignSchema, emailSchema, optionalAmount, optionalText, phoneSchema, positiveAmount, textField } from './common.js';

const currentYear = new Date().getFullYear();

const vehicleType = z.enum(['private-car', 'motorcycle', 'three-wheeler', 'van', 'lorry', 'bus', 'other']);
const fuelType = z.enum(['petrol', 'diesel', 'electric', 'phev', 'hybrid', 'other']);
const usage = z.enum(['private', 'business', 'commercial-passenger', 'goods-transport', 'other']);
const ownership = z.enum(['owned', 'financed', 'leased', 'other']);

const vehicleBase = {
  vehicleType,
  vehicleMake: textField(1, 80),
  vehicleModel: textField(1, 80),
  yearOfManufacture: z.coerce.number().int().min(1980).max(currentYear + 1),
  registrationAvailable: z.enum(['yes', 'no']),
  registrationNumber: z.string().optional().transform((value) => (value ? value.replace(/<[^>]*>/g, '').trim() : '')),
  ownershipStatus: ownership,
  estimatedMarketValue: positiveAmount,
  vehicleUsage: usage,
  fuelType,
  preferredCoverage: z.enum(['full-insurance', 'third-party', 'unsure', 'comprehensive', 'third-party-fire-theft']),
  existingPolicyRenewal: optionalText(500),
  existingPolicyRenewalDate: z
    .string()
    .optional()
    .transform((value) => (value ?? '').trim())
    .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Enter a valid date.')
    .transform((value) => value || undefined),
  additionalNotes: optionalText(2000),
};

function withRegistration<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const record = data as { registrationAvailable?: string; registrationNumber?: string };
    if (record.registrationAvailable === 'yes' && !record.registrationNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationNumber'],
        message: 'Enter the registration number, or choose No if it is not available.',
      });
    }
  });
}

const motorDetails = withRegistration({ ...vehicleBase });

const motorThirdPartyDetails = withRegistration({
  ...vehicleBase,
  liabilityNotes: optionalText(1000),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');

const travelDetails = z
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
    const departure = new Date(`${data.departureDate}T00:00:00Z`);
    const returning = new Date(`${data.returnDate}T00:00:00Z`);
    const today = new Date();
    const earliest = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30));
    if (departure < earliest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureDate'], message: 'Departure date is too far in the past.' });
    }
    if (returning < departure) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Return date must be on or after the departure date.' });
    }
    const days = Math.round((returning.getTime() - departure.getTime()) / 86_400_000) + 1;
    if (days > 366) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'For trips longer than a year, contact the team directly.' });
    }
  })
  .transform((data) => {
    const departure = new Date(`${data.departureDate}T00:00:00Z`);
    const returning = new Date(`${data.returnDate}T00:00:00Z`);
    const tripDurationDays = Math.round((returning.getTime() - departure.getTime()) / 86_400_000) + 1;
    return { ...data, tripDurationDays };
  });

const fireDetails = z
  .object({
    propertyType: z.enum(['commercial', 'industrial', 'warehouse', 'office', 'mixed-use', 'other']),
    location: textField(3, 240),
    coverBuilding: z.boolean().default(false),
    coverContents: z.boolean().default(false),
    estimatedInsuredValue: positiveAmount,
    occupancy: textField(2, 160),
    riskDetails: optionalText(1500),
  })
  .superRefine((data, ctx) => {
    if (!data.coverBuilding && !data.coverContents) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['coverBuilding'],
        message: 'Choose building, contents, or both.',
      });
    }
  });

const dwellingDetails = z
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['buildingValue'],
        message: 'Enter a building value, a contents value, or both.',
      });
    }
  });

const workersDetails = z.object({
  businessActivity: textField(2, 200),
  employeeCount: z.coerce.number().int().min(1).max(100000),
  employeeCategories: textField(2, 300),
  estimatedAnnualPayroll: optionalAmount,
  workplaceRiskDetails: optionalText(1500),
});

const moneyDetails = z.object({
  businessType: textField(2, 160),
  typicalAmountCarried: positiveAmount,
  transitFrequency: z.enum(['daily', 'weekly', 'occasional', 'other']),
  securityArrangements: textField(2, 500),
  collectionDeliveryDetails: textField(2, 500),
  additionalNotes: optionalText(1500),
});

const accidentDetails = z.object({
  occupation: textField(2, 120),
  desiredCoverageAmount: positiveAmount,
  benefitPreferences: optionalText(400),
  additionalInformation: optionalText(1500),
});

const titleDetails = z.object({
  propertyLocation: textField(3, 240),
  propertyType: textField(2, 120),
  transactionType: z.enum(['purchase', 'sale', 'refinance', 'other']),
  estimatedPropertyValue: positiveAmount,
  applicantRole: z.enum(['buyer', 'seller', 'lender', 'other']),
  additionalInformation: optionalText(1500),
});

export const detailSchemas = {
  motor: motorDetails,
  'motor-third-party': motorThirdPartyDetails,
  travel: travelDetails,
  fire: fireDetails,
  'dwelling-fire': dwellingDetails,
  'workers-compensation': workersDetails,
  'money-in-transit': moneyDetails,
  'personal-accident': accidentDetails,
  'title-insurance': titleDetails,
} as const;

export const quoteBodySchema = z
  .object({
    customerName: textField(2, 120),
    phone: phoneSchema,
    email: emailSchema,
    preferredContactMethod: z.enum(['phone', 'email', 'either']),
    insuranceType: z.enum(INSURANCE_TYPES),
    insuranceDetails: z.custom<Record<string, unknown>>(
      (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
      'Add the details for this type of insurance.',
    ),
    message: optionalText(2000),
    consent: z.literal(true, { errorMap: () => ({ message: 'Consent to the privacy notice is required.' }) }),
    sourcePage: z.string().trim().max(300).optional().default(''),
    campaignSource: campaignSchema,
    website: z.string().max(0).optional().default(''),
  })
  .superRefine((data, ctx) => {
    const schema = detailSchemas[data.insuranceType];
    const result = schema.safeParse(data.insuranceDetails);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ['insuranceDetails', ...issue.path],
        });
      }
    }
  })
  .transform((data) => {
    const schema = detailSchemas[data.insuranceType];
    const details = schema.parse(data.insuranceDetails);
    return { ...data, insuranceDetails: details, message: data.message ?? '' };
  });

export type QuoteBody = z.infer<typeof quoteBodySchema>;

export const quoteUpdateSchema = z
  .object({
    status: z.enum(['new', 'contacted', 'awaiting-information', 'quote-in-progress', 'quotation-sent', 'converted', 'not-converted', 'archived']).optional(),
    assignedTo: z.string().trim().nullable().optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((data) => data.status || data.assignedTo !== undefined || data.note, {
    message: 'Provide a status, assignment, or note.',
  });

export const quoteStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'awaiting-information', 'quote-in-progress', 'quotation-sent', 'converted', 'not-converted', 'archived']),
  note: z.string().trim().max(500).optional(),
});
