import { z } from 'zod';
import { optionalText, textField } from './common.js';

const day = z.string().trim().superRefine((value, ctx) => {
  if (!value) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.' });
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid date.' });
});

const money = (required: boolean) => z.preprocess((value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().replace(/,/g, '').replace(/^(?:rs\.?|lkr)\s*/i, '');
}, z.string().superRefine((value, ctx) => {
  if (!value) {
    if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.' });
    return;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount.' });
    return;
  }
  if (Number(value) > 1_000_000_000) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is too large.' });
}).transform((value) => (value ? Number(value) : 0)));

function percent(amount: number, rate: number) {
  return Math.round((Math.round(amount * 100) * rate) / 100) / 100;
}

export const policyRegisterSchema = z.object({
  entryDate: day,
  riskDate: day,
  debitNoteNo: optionalText(80),
  customerName: textField(1, 160),
  postalAddress: textField(1, 400),
  sumInsured: money(true),
  policyNumber: textField(1, 60),
  renewalDate: day,
  vehicleNumber: textField(1, 30),
  premiumNet: money(true),
  premiumRcc: money(false),
  premiumTc: money(false),
  premiumIncludingTax: money(true),
  insuranceCompany: textField(1, 160),
  salesPerson: optionalText(120),
  agentCode: optionalText(80),
  special: z.enum(['ren', 'new'], { errorMap: () => ({ message: 'Choose Ren or New.' }) }),
  telephone: z.string().trim().superRefine((value, ctx) => {
    if (!value) return;
    if (!/^\+?[0-9]{9,15}$/.test(value.replace(/[\s()-]/g, ''))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid telephone number.' });
    }
  }).transform((value) => value.replace(/[\s()-]/g, '')),
  unSalesPerson: optionalText(120),
}).transform((value) => ({
  ...value,
  debitNoteNo: value.debitNoteNo ?? '',
  salesPerson: value.salesPerson ?? '',
  agentCode: value.agentCode ?? '',
  unSalesPerson: value.unSalesPerson ?? '',
  basicCommission: percent(value.premiumNet, 13),
  rccCommission: percent(value.premiumRcc, 5),
  tcCommission: percent(value.premiumTc, 5),
}));

export type PolicyRegisterBody = z.infer<typeof policyRegisterSchema>;
