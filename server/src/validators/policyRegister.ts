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

const rate = z.preprocess((value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim();
}, z.string().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a rate.' });
    return;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid rate.' });
    return;
  }
  if (Number(value) > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a rate up to 100.' });
}).transform((value) => Number(value)));

const optionalDay = z.string().trim().superRefine((value, ctx) => {
  if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid date.' });
});

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
  netCommissionRate: rate,
  rccCommissionRate: rate,
  tcCommissionRate: rate,
  insuranceCompany: textField(1, 160),
  salesPerson: optionalText(120),
  agentCode: optionalText(80),
  special: z.enum(['ren', 'new', 'refund', 'additional'], { errorMap: () => ({ message: 'Choose a policy status.' }) }),
  commissionReceived: z.boolean().optional().default(false),
  commissionReference: optionalText(40),
  commissionReceivedDate: optionalDay,
  telephone: z.string().trim().superRefine((value, ctx) => {
    if (!value) return;
    if (!/^\+?[0-9]{9,15}$/.test(value.replace(/[\s()-]/g, ''))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid telephone number.' });
    }
  }).transform((value) => value.replace(/[\s()-]/g, '')),
  unSalesPerson: optionalText(120),
}).superRefine((value, ctx) => {
  if (!value.commissionReceived) return;
  if (!value.commissionReference?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the BR or NIC.', path: ['commissionReference'] });
  if (!value.commissionReceivedDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the received date.', path: ['commissionReceivedDate'] });
}).transform((value) => ({
  ...value,
  debitNoteNo: value.debitNoteNo ?? '',
  salesPerson: value.salesPerson ?? '',
  agentCode: value.agentCode ?? '',
  unSalesPerson: value.unSalesPerson ?? '',
  commissionReceived: value.commissionReceived === true,
  commissionReference: value.commissionReceived ? (value.commissionReference ?? '').trim() : '',
  commissionReceivedDate: value.commissionReceived ? value.commissionReceivedDate : null,
  basicCommission: percent(value.premiumNet, value.netCommissionRate),
  rccCommission: percent(value.premiumRcc, value.rccCommissionRate),
  tcCommission: percent(value.premiumTc, value.tcCommissionRate),
}));

export type PolicyRegisterBody = z.infer<typeof policyRegisterSchema>;
