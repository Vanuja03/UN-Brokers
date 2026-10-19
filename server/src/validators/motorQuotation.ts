import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);

export const motorQuotationSchema = z
  .object({
    insuranceType: z.enum(['motor', 'motor-third-party']),
    quotationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a quotation date.'),
    customerName: z.string().trim().min(2).max(120),
    vehicleNumber: text(40).default(''),
    leaseOrLoanNo: text(60).default(''),
    usage: text(80).default(''),
    yearOfManufacture: text(10).default(''),
    sumInsured: text(40).default(''),
    make: text(80).default(''),
    model: text(80).default(''),
    fuel: text(40).default(''),
    preparedBy: text(120).default(''),
    preparedByPhone: text(40).default(''),
    preparedByEmail: z.string().trim().email().max(254).or(z.literal('')).default(''),
    insurers: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
    rows: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(120),
          values: z.array(z.string().trim().max(180)),
        }),
      )
      .min(1)
      .max(20),
    inquiryId: z.string().trim().optional().or(z.literal('')),
  })
  .superRefine((value, context) => {
    value.rows.forEach((row, index) => {
      if (row.values.length !== value.insurers.length) {
        context.addIssue({
          code: 'custom',
          message: 'Enter one figure for each insurer.',
          path: ['rows', index, 'values'],
        });
      }
    });
  });

export type MotorQuotationInput = z.infer<typeof motorQuotationSchema>;
