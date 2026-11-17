import { z } from 'zod';
import { textField } from './common.js';
import { stripTags } from '../utils/sanitize.js';

export const fireCoverOptions = [
  ['fire', 'Fire'],
  ['riot', 'Riot & Strike'],
  ['terrorism', 'Terrorism Cover'],
  ['malicious', 'Malicious Damage'],
  ['explosion', 'Explosion'],
  ['impact', 'Impact Damage'],
  ['aircraft', 'Air Craft Damage'],
  ['bursting', 'Bursting & Overflowing'],
  ['spontaneous', 'Spontaneous Cover'],
  ['cyclone', 'Cyclone, Storm & Tempest'],
  ['flood', 'Flood'],
  ['earthquake', 'Earthquake'],
  ['natural', 'Other Natural Perils'],
  ['electrical-burn', 'Electrical Fire (With Burn Mark)'],
  ['electrical-no-burn', 'Electrical Fire (Without Burn Mark)'],
  ['other', 'Other Special Perils'],
] as const;

export const workmenCoverOptions = [
  ['riot', 'Riot & Strike Cover'],
  ['terrorism', 'Terrorism Cover'],
  ['three-day', '1st Three Day Cover'],
] as const;

export const accidentCoverOptions = [
  ['weekly', 'Weekly Benefit'],
  ['tppd', 'TPPD'],
  ['ttd', 'TTD'],
  ['funeral', 'Funeral Expenses'],
  ['riot', 'Riot & Strike Cover'],
  ['terrorism', 'Terrorism Cover'],
  ['motorcycle', 'Motor Cycle Cover'],
  ['natural-death', 'Natural Death Cover'],
] as const;

export const transitCoverOptions = [
  ['riot', 'Riot & Strike Cover'],
  ['terrorism', 'Terrorism Cover'],
  ['infidelity', 'Infidelity Cover'],
] as const;

export const goodsCoverOptions = [
  ['riot', 'Riot & Strike'],
  ['terrorism', 'Terrorism Cover'],
] as const;

export const marineCoverOptions = [
  ['institute-a', 'Institute "A" Clause'],
  ['war', 'Institute War Clause'],
  ['riot', 'Institute Riot Clause'],
  ['warehouse', 'Warehouse to Warehouse cover'],
  ['fcl', 'FCL'],
] as const;

export const erectionCoverOptions = [
  ['riot', 'Riot & Strike'],
  ['terrorism', 'Terrorism'],
  ['inland', 'Inland Transit'],
] as const;

export const medicalCoverOptions = [
  ['no-sub-limits', 'Premium Without Sub Limits'],
  ['sub-limits', 'Premium with sub limits'],
  ['family', 'Premium Family & Individual'],
  ['no-excess', 'With Out Excess'],
  ['eye-dental', 'Eye and Dental Cover'],
] as const;

const valuedAccidentCovers = new Set(['funeral', 'natural-death']);

const fireCoverKeys = new Set<string>(fireCoverOptions.map(([key]) => key));
const workmenCoverKeys = new Set<string>(workmenCoverOptions.map(([key]) => key));
const accidentCoverKeys = new Set<string>(accidentCoverOptions.map(([key]) => key));
const transitCoverKeys = new Set<string>(transitCoverOptions.map(([key]) => key));
const goodsCoverKeys = new Set<string>(goodsCoverOptions.map(([key]) => key));
const marineCoverKeys = new Set<string>(marineCoverOptions.map(([key]) => key));
const erectionCoverKeys = new Set<string>(erectionCoverOptions.map(([key]) => key));
const medicalCoverKeys = new Set<string>(medicalCoverOptions.map(([key]) => key));

const line = z.object({
  label: z.string().transform(stripTags).pipe(z.string().max(160, 'Enter 160 characters or fewer.')),
  amount: z.string().transform(stripTags).pipe(z.string().max(40, 'Enter 40 characters or fewer.')),
});

const blank = (max: number) => z.string().optional().transform((value) => stripTags(value ?? '')).pipe(z.string().max(max));

const worker = z.object({
  designation: z.string().transform(stripTags).pipe(z.string().max(80, 'Enter 80 characters or fewer.')),
  count: z.string().transform(stripTags).pipe(z.string().max(10, 'Enter 10 characters or fewer.')),
  salary: z.string().transform(stripTags).pipe(z.string().max(40, 'Enter 40 characters or fewer.')),
});

function filled(items: { label: string; amount: string }[]) {
  return items.filter((item) => item.label && item.amount);
}

function filledCrops(items: { age: string; coverage: string; count: string; value: string }[]) {
  return items.filter((item) => item.age && item.coverage && item.count && item.value);
}

function filledLimits(items: { label: string; option1: string; option2: string; option3: string }[]) {
  return items.filter((item) => item.label && (item.option1 || item.option2 || item.option3));
}

function filledWorkers(items: { designation: string; count: string; salary: string }[]) {
  return items.filter((item) => item.designation && item.count && item.salary);
}

const coverAmount = z.object({
  key: z.string().trim().max(40),
  amount: z.string().transform(stripTags).pipe(z.string().max(40, 'Enter 40 characters or fewer.')),
});

function keptCovers(slipType: string, covers: string[]) {
  const allowed = slipType === 'workmen' ? workmenCoverKeys : slipType === 'fire' ? fireCoverKeys : slipType === 'accident' ? accidentCoverKeys : slipType === 'transit' ? transitCoverKeys : slipType === 'goods' ? goodsCoverKeys : slipType === 'marine' ? marineCoverKeys : slipType === 'erection' ? erectionCoverKeys : slipType === 'medical' ? medicalCoverKeys : null;
  if (!allowed) return [];
  return [...new Set(covers.filter((key) => allowed.has(key)))];
}

function amountFor(amounts: { key: string; amount: string }[], key: string) {
  return amounts.find((item) => item.key === key)?.amount.trim() || '';
}

export const nonMotorQuotationSlipSchema = z
  .object({
    slipType: z.enum(['fire', 'burglary', 'workmen', 'accident', 'transit', 'goods', 'marine', 'erection', 'electronic', 'medical', 'crop'], { errorMap: () => ({ message: 'Choose a non-motor type.' }) }),
    customerName: textField(1, 160),
    locationAddress: blank(300),
    occupation: blank(120),
    previousInsurance: blank(120),
    claimsLast3Years: blank(80),
    contactPerson: blank(120),
    contactNo: blank(40),
    annualEarnings: blank(40),
    workerCount: blank(20),
    transitFrom: blank(200),
    transitTo: blank(200),
    modeOfTransit: blank(160),
    transitsPerMonth: blank(20),
    annualCarryings: blank(40),
    transitArea: blank(200),
    maxTransitLimit: blank(40),
    transitCount: blank(20),
    vehicleCount: blank(20),
    annualTransit: blank(40),
    goodsDescription: blank(300),
    voyageFrom: blank(300),
    voyageTo: blank(300),
    methodOfTransport: blank(600),
    itemAge: blank(80),
    memberCount: blank(20),
    medicalLimits: z.array(z.object({
      label: z.string().transform(stripTags).pipe(z.string().max(80)),
      option1: z.string().transform(stripTags).pipe(z.string().max(40)),
      option2: z.string().transform(stripTags).pipe(z.string().max(40)),
      option3: z.string().transform(stripTags).pipe(z.string().max(40)),
    })).max(20).optional().default([]),
    cropPlants: z.array(z.object({
      age: z.string().transform(stripTags).pipe(z.string().max(40)),
      coverage: z.string().transform(stripTags).pipe(z.string().max(40)),
      count: z.string().transform(stripTags).pipe(z.string().max(20)),
      value: z.string().transform(stripTags).pipe(z.string().max(40)),
    })).max(40).optional().default([]),
    interests: z.array(z.string().transform(stripTags).pipe(z.string().max(200))).max(40).optional().default([]),
    items: z.array(line).max(40, 'Use 40 lines or fewer.'),
    firstLossItems: z.array(line).max(40, 'Use 40 lines or fewer.').optional().default([]),
    workers: z.array(worker).max(40, 'Use 40 lines or fewer.').optional().default([]),
    coverAmounts: z.array(coverAmount).max(10).optional().default([]),
    covers: z.array(z.string().trim().max(40)).max(20).optional().default([]),
    notes: blank(800),
  })
  .superRefine((value, ctx) => {
    if (value.slipType !== 'transit' && !value.locationAddress.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.', path: ['locationAddress'] });
    }
    if (value.slipType === 'transit' && !value.transitFrom.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter where the transit starts.', path: ['transitFrom'] });
    }
    if (value.slipType === 'transit' && !value.transitTo.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter where the transit ends.', path: ['transitTo'] });
    }
    if (value.slipType === 'transit' && !value.transitsPerMonth.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the number of transits per month.', path: ['transitsPerMonth'] });
    }
    if (value.slipType === 'transit' && !value.annualCarryings.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the estimated annual carryings.', path: ['annualCarryings'] });
    }
    if (value.slipType === 'goods' && !value.transitArea.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the transit.', path: ['transitArea'] });
    }
    if (value.slipType === 'goods' && !value.maxTransitLimit.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the maximum transit limit.', path: ['maxTransitLimit'] });
    }
    if (value.slipType === 'goods' && !value.annualTransit.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the estimated annual transit.', path: ['annualTransit'] });
    }
    if (value.slipType === 'goods' && !value.goodsDescription.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the goods description.', path: ['goodsDescription'] });
    }
    if (value.slipType === 'marine' && !value.voyageFrom.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter where the voyage starts.', path: ['voyageFrom'] });
    }
    if (value.slipType === 'marine' && !value.voyageTo.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter where the voyage ends.', path: ['voyageTo'] });
    }
    if (value.slipType === 'marine' && value.interests.every((item) => !item.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one interest.', path: ['interests'] });
    }
    if (value.slipType === 'erection' && !value.methodOfTransport.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the method of transport.', path: ['methodOfTransport'] });
    }
    if (value.slipType === 'medical' && !value.memberCount.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the number of members.', path: ['memberCount'] });
    }
    if (value.slipType === 'medical' && filledLimits(value.medicalLimits).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one limit with an amount.', path: ['medicalLimits'] });
    }
    if (value.slipType === 'crop' && filledCrops(value.cropPlants).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one plant row with age, coverage, number of plants, and value.', path: ['cropPlants'] });
    }
    if (value.slipType === 'erection' && filled(value.firstLossItems).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one third party liability limit.', path: ['firstLossItems'] });
    }
    if ((value.slipType === 'fire' || value.slipType === 'burglary' || value.slipType === 'transit' || value.slipType === 'erection' || value.slipType === 'electronic') && filled(value.items).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one sum insured line with an amount.', path: ['items'] });
    }
    if (value.slipType === 'accident' && filled(value.items).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one capital benefit option with an amount.', path: ['items'] });
    }
    if (value.slipType === 'accident' && !value.workerCount.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the number of workers.', path: ['workerCount'] });
    }
    if (value.slipType === 'accident') {
      for (const key of valuedAccidentCovers) {
        if (value.covers.includes(key) && !amountFor(value.coverAmounts, key)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an amount for this cover.', path: ['coverAmounts'] });
        }
      }
    }
    if (value.slipType === 'burglary' && filled(value.firstLossItems).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one 1st loss line with an amount.', path: ['firstLossItems'] });
    }
    if (value.slipType === 'workmen' && !value.annualEarnings.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the estimated annual earnings.', path: ['annualEarnings'] });
    }
    if (value.slipType === 'workmen' && filledWorkers(value.workers).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter at least one designation with the number of workers and a monthly salary.', path: ['workers'] });
    }
    if ((value.slipType === 'fire' || value.slipType === 'workmen' || value.slipType === 'accident' || value.slipType === 'transit' || value.slipType === 'goods' || value.slipType === 'marine' || value.slipType === 'erection' || value.slipType === 'medical') && keptCovers(value.slipType, value.covers).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tick at least one cover.', path: ['covers'] });
    }
  })
  .transform((value) => ({
    slipType: value.slipType,
    customerName: value.customerName,
    locationAddress: value.locationAddress,
    occupation: value.occupation,
    previousInsurance: value.previousInsurance,
    claimsLast3Years: value.claimsLast3Years,
    contactPerson: value.contactPerson,
    contactNo: value.contactNo,
    annualEarnings: value.slipType === 'workmen' ? value.annualEarnings : '',
    workerCount: value.slipType === 'accident' ? value.workerCount : '',
    transitFrom: value.slipType === 'transit' ? value.transitFrom : '',
    transitTo: value.slipType === 'transit' ? value.transitTo : '',
    modeOfTransit: value.slipType === 'transit' || value.slipType === 'goods' ? value.modeOfTransit : '',
    transitsPerMonth: value.slipType === 'transit' ? value.transitsPerMonth : '',
    annualCarryings: value.slipType === 'transit' ? value.annualCarryings : '',
    transitArea: value.slipType === 'goods' ? value.transitArea : '',
    maxTransitLimit: value.slipType === 'goods' ? value.maxTransitLimit : '',
    transitCount: value.slipType === 'goods' ? value.transitCount : '',
    vehicleCount: value.slipType === 'goods' ? value.vehicleCount : '',
    annualTransit: value.slipType === 'goods' ? value.annualTransit : '',
    goodsDescription: value.slipType === 'goods' ? value.goodsDescription : '',
    voyageFrom: value.slipType === 'marine' ? value.voyageFrom : '',
    voyageTo: value.slipType === 'marine' ? value.voyageTo : '',
    interests: value.slipType === 'marine' ? value.interests.map((item) => item.trim()).filter(Boolean) : [],
    methodOfTransport: value.slipType === 'erection' ? value.methodOfTransport : '',
    itemAge: value.slipType === 'electronic' ? value.itemAge : '',
    memberCount: value.slipType === 'medical' ? value.memberCount : '',
    medicalLimits: value.slipType === 'medical' ? filledLimits(value.medicalLimits) : [],
    cropPlants: value.slipType === 'crop' ? filledCrops(value.cropPlants) : [],
    items: value.slipType === 'workmen' || value.slipType === 'goods' || value.slipType === 'marine' || value.slipType === 'medical' || value.slipType === 'crop' ? [] : filled(value.items),
    firstLossItems: value.slipType === 'burglary' || value.slipType === 'accident' || value.slipType === 'erection' ? filled(value.firstLossItems) : [],
    workers: value.slipType === 'workmen' ? filledWorkers(value.workers) : [],
    coverAmounts: value.slipType === 'accident'
      ? value.coverAmounts.filter((item) => valuedAccidentCovers.has(item.key) && value.covers.includes(item.key) && item.amount)
      : [],
    covers: keptCovers(value.slipType, value.covers),
    notes: value.notes.trim(),
  }));

export type NonMotorQuotationSlipInput = z.infer<typeof nonMotorQuotationSlipSchema>;
