import { z } from 'zod';
import { optionalText, textField } from './common.js';

const day = z.string().trim().superRefine((value, ctx) => {
  if (!value) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.' });
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid date.' });
});

const requiredMoney = z.preprocess((value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().replace(/,/g, '').replace(/^(?:rs\.?|lkr)\s*/i, '');
}, z.string().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.' });
    return;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount.' });
    return;
  }
  if (Number(value) > 1_000_000_000) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is too large.' });
}).transform((value) => Number(value)));

export const policyRenewalSchema = z
  .object({
    policyNumber: textField(1, 60),
    vehicleNumber: textField(1, 30),
    fromDate: day,
    toDate: day,
    customerName: textField(1, 160),
    postalAddress: textField(1, 400),
    sumInsured: requiredMoney,
    lastYearPremium: requiredMoney,
    thisYearPremium: requiredMoney,
    insuranceCompany: textField(1, 160),
    salesPerson: optionalText(120),
    speciCo: optionalText(160),
    status: z.enum(['ren', 'new'], { errorMap: () => ({ message: 'Choose Ren or New.' }) }),
    renewalResult: z.enum(['', 'done', 'cancel', 'sold'], { errorMap: () => ({ message: 'Choose done, cancel, or sold.' }) }).default(''),
    contactNo: z.string().trim().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.' });
        return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(value.replace(/[\s()-]/g, ''))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid telephone number.' });
      }
    }).transform((value) => value.replace(/[\s()-]/g, '')),
    remarks: optionalText(1000),
  })
  .refine((value) => value.toDate >= value.fromDate, {
    message: 'The to date must be on or after the from date.',
    path: ['toDate'],
  });

export type PolicyRenewalBody = z.infer<typeof policyRenewalSchema>;
