import { z } from 'zod';
import { INSURANCE_TYPES } from '../config/constants.js';
import { campaignSchema, emailSchema, lkrAmount, optionalText, phoneSchema, positiveAmount, textField } from './common.js';

const currentYear = new Date().getFullYear();

const vehicleType = z.enum(['private-car', 'motorcycle', 'three-wheeler', 'van', 'lorry', 'bus', 'other']);
const fuelType = z.enum(['petrol', 'diesel', 'electric', 'phev', 'hybrid', 'other']);
const usage = z.enum(['private', 'hiring', 'rent-a-car', 'business', 'commercial-passenger', 'goods-transport', 'other']);
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
    nicNo: z.string().trim().toUpperCase().refine((value) => /^\d{9}[VX]$/.test(value) || /^\d{12}$/.test(value), 'Enter a valid NIC number.'),
    destination: textField(2, 160),
    departureDate: isoDate,
    returnDate: isoDate,
    dependents: z.coerce.number().int().min(0).max(20),
    purpose: z.enum(['holiday', 'business', 'study', 'family', 'medical', 'other']),
    additionalNotes: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    const departure = new Date(`${data.departureDate}T00:00:00Z`);
    const arriving = new Date(`${data.returnDate}T00:00:00Z`);
    const today = new Date();
    const earliest = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30));
    if (departure < earliest) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureDate'], message: 'Departure date is too far in the past.' });
    }
    if (arriving < departure) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Arrival date must be on or after the departure date.' });
    }
    const days = Math.round((arriving.getTime() - departure.getTime()) / 86_400_000) + 1;
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

const insuredLineSchema = z.object({
  item: textField(1, 120),
  quantity: z.coerce.number().int().min(1).max(3),
  values: z.array(lkrAmount).min(1).max(3),
}).superRefine((line, ctx) => {
  if (line.values.length !== line.quantity) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['values'], message: 'Enter a value for each item or building.' });
  }
});

const fireDetails = z.object({
  propertyType: z.enum(['commercial', 'industrial', 'warehouse', 'office', 'mixed-use', 'other']),
  location: textField(3, 240),
  insuredItems: z.array(insuredLineSchema).min(1, 'Add at least one item.').max(12),
  occupancy: textField(2, 160),
  riskDetails: optionalText(1500),
});

const dwellingDetails = z.object({
  propertyAddress: textField(3, 240),
  occupantStatus: z.enum(['owner', 'tenant', 'landlord', 'other']),
  insuredItems: z.array(insuredLineSchema).min(1, 'Add at least one item.').max(12),
});

const employeeClassSchema = z.object({
  employeeClass: textField(1, 120),
  duties: textField(2, 300),
  estimatedNumber: z.coerce.number().int().min(1).max(100000),
  monthlyIncome: lkrAmount,
});

const workersDetails = z.object({
  businessActivity: textField(2, 200),
  employeeClasses: z.array(employeeClassSchema).min(1, 'Add at least one class of employees.').max(12),
});

const moneyTransferSchema = z.object({
  transferAmount: lkrAmount,
  startLocation: textField(2, 160),
  endLocation: textField(2, 160),
  transferTimes: z.coerce.number().int().min(1).max(100000),
});

const moneyDetails = z.object({
  businessType: textField(2, 160),
  transfers: z.array(moneyTransferSchema).min(1, 'Add at least one transfer.').max(12),
});

const accidentDetails = z.object({
  occupation: textField(2, 120),
  desiredCoverageAmount: positiveAmount,
  benefitPreferences: optionalText(400),
  additionalInformation: optionalText(1500),
});

const titleDetails = z.object({});

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
