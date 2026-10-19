import { z } from 'zod';
import { stripTags } from '../utils/sanitize.js';
import { emailSchema, textField } from './common.js';

const blank = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => stripTags(value ?? ''))
    .pipe(z.string().max(max));

const benefitsSchema = z.object({
  totalPremium: blank(180),
  fireTheftAccident: blank(180),
  maliciousAct: blank(180),
  floodNaturalPerils: blank(180),
  airBagCover: blank(180),
  thirdPartyInjury: blank(180),
  thirdPartyProperty: blank(180),
  strikeRiot: blank(180),
  terrorism: blank(180),
  towing: blank(180),
  personalAccident: blank(180),
  windscreen: blank(180),
  taxiAllowance: blank(180),
  clickAndGo: blank(180),
});

export const motorComparisonSchema = z.object({
  customerName: textField(2, 120),
  quotationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a quotation date.'),
  vehicleNumber: textField(2, 20),
  leaseOrLoanNo: blank(40),
  usage: blank(40),
  yearOfManufacture: blank(10),
  sumInsured: blank(40),
  make: blank(60),
  model: blank(60),
  fuel: blank(40),
  preparedByName: blank(120),
  preparedByPhone: blank(20),
  preparedByEmail: z.union([z.literal(''), emailSchema]).optional().default(''),
  insurers: z
    .array(
      z.object({
        name: textField(2, 80),
        benefits: benefitsSchema,
      }),
    )
    .min(1, 'Add at least one insurer.')
    .max(8, 'A comparison can include up to 8 insurers.'),
});
