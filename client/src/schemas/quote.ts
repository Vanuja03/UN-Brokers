import { z } from 'zod';
import { INSURANCE_TYPES, type InsuranceType } from '../types';

const currentYear = new Date().getFullYear();

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine((value) => /^\+?[0-9]{9,15}$/.test(value), 'Enter a valid telephone number.');

export const emailSchema = z.string().trim().email('Enter a valid email address.').max(254);

export const nicSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => /^\d{9}[VX]$/.test(value) || /^\d{12}$/.test(value), 'Enter a valid NIC number.');

const textField = (min: number, max: number) => z.string().trim().min(min, 'This field is required.').max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.').or(z.literal('')).optional();
const positiveAmount = z.coerce.number({ invalid_type_error: 'Enter a valid amount.' }).positive('Enter an amount greater than zero.');
const lkrAmount = z.preprocess((value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  return Number(trimmed);
}, z.number({ invalid_type_error: 'Enter a valid amount.', required_error: 'Enter a valid amount.' }).positive('Enter an amount greater than zero.').max(1_000_000_000_000, 'Amount is too large.'));

const moneyTransferSchema = z.object({
  transferAmount: lkrAmount,
  startLocation: textField(2, 160),
  endLocation: textField(2, 160),
  transferTimes: z.coerce.number({ invalid_type_error: 'Enter the transfer times.' }).int().min(1, 'Enter the transfer times.').max(100000),
});

const employeeClassSchema = z.object({
  employeeClass: textField(1, 120),
  duties: textField(2, 300),
  estimatedNumber: z.coerce.number({ invalid_type_error: 'Enter the estimated number.' }).int().min(1, 'Enter the estimated number.').max(100000),
  monthlyIncome: lkrAmount,
});

const insuredLineSchema = z.object({
  item: textField(1, 120),
  quantity: z.coerce.number().int().min(1, 'Choose 1, 2, or 3.').max(3, 'Choose 1, 2, or 3.'),
  values: z.array(lkrAmount).min(1).max(3),
}).superRefine((line, ctx) => {
  if (line.values.length !== line.quantity) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['values'], message: 'Enter a value for each item or building.' });
  }
});
const vehicleBase = {
  vehicleType: z.enum(['private-car', 'motorcycle', 'three-wheeler', 'van', 'lorry', 'bus', 'prime-mover', 'other']),
  vehicleMake: textField(1, 80),
  vehicleModel: textField(1, 80),
  yearOfManufacture: z.coerce.number().int().min(1980, 'Enter a valid year.').max(currentYear + 1),
  registrationAvailable: z.enum(['yes', 'no']),
  registrationNumber: z.string().trim().max(20).optional().or(z.literal('')),
  ownershipStatus: z.enum(['owned', 'financed', 'leased', 'other']),
  estimatedMarketValue: positiveAmount,
  vehicleUsage: z.enum(['private', 'hiring', 'rent-a-car', 'business', 'commercial-passenger', 'goods-transport', 'other']),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'phev', 'hybrid', 'other']),
  preferredCoverage: z.enum(['full-insurance', 'third-party', 'unsure', 'comprehensive', 'third-party-fire-theft']),
  existingPolicyRenewal: optionalText(500),
  existingPolicyRenewalDate: optionalDate,
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
  motor: withRegistration({ ...vehicleBase }),
  'motor-third-party': withRegistration({ ...vehicleBase, liabilityNotes: optionalText(1000) }),
  travel: z
    .object({
      nicNo: nicSchema,
      destination: textField(2, 160),
      departureDate: isoDate,
      returnDate: isoDate,
      dependents: z.coerce.number().int().min(0, 'Enter 0 or more.').max(20),
      purpose: z.enum(['holiday', 'business', 'study', 'family', 'medical', 'other']),
      additionalNotes: optionalText(2000),
    })
    .superRefine((data, ctx) => {
      if (data.returnDate < data.departureDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Arrival date must be on or after the departure date.' });
      }
    }),
  fire: z.object({
    propertyType: z.enum(['commercial', 'industrial', 'warehouse', 'office', 'mixed-use', 'other']),
    location: textField(3, 240),
    insuredItems: z.array(insuredLineSchema).min(1, 'Add at least one item.').max(12),
    occupancy: textField(2, 160),
    riskDetails: optionalText(1500),
  }),
  'dwelling-fire': z.object({
    propertyAddress: textField(3, 240),
    occupantStatus: z.enum(['owner', 'tenant', 'landlord', 'other']),
    insuredItems: z.array(insuredLineSchema).min(1, 'Add at least one item.').max(12),
  }),
  'workers-compensation': z.object({
    businessActivity: textField(2, 200),
    employeeClasses: z.array(employeeClassSchema).min(1, 'Add at least one class of employees.').max(12),
  }),
  'money-in-transit': z.object({
    businessType: textField(2, 160),
    transfers: z.array(moneyTransferSchema).min(1, 'Add at least one transfer.').max(12),
  }),
  'personal-accident': z.object({
    occupation: textField(2, 120),
    desiredCoverageAmount: positiveAmount,
    benefitPreferences: optionalText(400),
    additionalInformation: optionalText(1500),
  }),
  'title-insurance': z.object({}),
} satisfies Record<InsuranceType, z.ZodTypeAny>;

const contactObject = z.object({
  customerType: z.enum(['private', 'company'], { errorMap: () => ({ message: 'Choose private or company.' }) }),
  customerName: textField(2, 120),
  nic: nicSchema,
  companyName: z.string().trim().max(160, 'Enter 160 characters or fewer.').optional().or(z.literal('')),
  designation: z.string().trim().max(80, 'Enter 80 characters or fewer.').optional().or(z.literal('')),
  phone: phoneSchema,
  email: emailSchema,
  preferredContactMethod: z.enum(['phone', 'email', 'either']),
  insuranceType: z.enum(INSURANCE_TYPES),
});

function checkCustomer(data: { customerType?: string; companyName?: string; designation?: string }, ctx: z.RefinementCtx) {
  if (data.customerType !== 'company') return;
  if (!data.companyName || data.companyName.trim().length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companyName'], message: 'Enter the company name.' });
  }
  if (!data.designation || data.designation.trim().length < 2) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['designation'], message: 'Enter the designation.' });
  }
}

export const contactSchema = contactObject.superRefine(checkCustomer);

export function buildQuoteSchema(type: InsuranceType) {
  return contactObject
    .extend({
      insuranceDetails: detailSchemas[type],
      message: optionalText(2000),
      consent: z.literal(true, { errorMap: () => ({ message: 'Consent to the privacy notice is required.' }) }),
      website: z.string().max(0).optional().or(z.literal('')),
    })
    .superRefine(checkCustomer)
    .transform((data) => ({
      ...data,
      companyName: data.customerType === 'company' ? (data.companyName ?? '').trim() : '',
      designation: data.customerType === 'company' ? (data.designation ?? '').trim() : '',
      message: data.message ?? '',
    }));
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
