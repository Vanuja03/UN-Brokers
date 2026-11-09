import { z } from 'zod';
import { textField } from './common.js';

const coverValue = z.object({
  selected: z.boolean(),
  value: z.string().trim().max(80, 'Enter 80 characters or fewer.').optional().default(''),
});

const coverMultiple = coverValue.extend({
  multiple: z.string().trim().max(40, 'Enter 40 characters or fewer.').optional().default(''),
});

const vehicleTypes = ['Car', 'Motorcycle', 'Three-wheeler', 'Van', 'Lorry', 'Bus', 'Prime mover', 'Other'] as const;
const vehicleUsages = ['Private', 'Hiring', 'Rent a car'] as const;
const wciRoles = ['Driver', 'Cleaner'] as const;
const valuedKeys = ['towing', 'gt', 'windscreen', 'tpd', 'hp'] as const;
const multipliedKeys = ['pab', 'll'] as const;

export const motorQuotationSlipSchema = z
  .object({
    customerName: textField(1, 120),
    vehicleNumber: textField(1, 40),
    make: textField(1, 80),
    model: textField(1, 80),
    yearOfManufacture: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'Enter a four-digit year.')
      .refine((value) => {
        const year = Number(value);
        return year >= 1950 && year <= new Date().getFullYear() + 1;
      }, 'Enter a valid year.'),
    vehicleType: z
      .string()
      .trim()
      .transform((value) => (value.toLowerCase() === 'private car' ? 'Car' : value))
      .pipe(z.enum(vehicleTypes, { errorMap: () => ({ message: 'Choose a vehicle type.' }) })),
    vehicleUsage: z.enum(vehicleUsages, { errorMap: () => ({ message: 'Choose a vehicle usage.' }) }),
    covers: z
      .object({
        basic: z.boolean(),
        srcc: z.boolean(),
        tc: z.boolean(),
        flood: z.boolean(),
        towing: coverValue,
        wci: coverValue,
        gt: coverValue,
        windscreen: coverValue,
        pab: coverMultiple,
        ll: coverMultiple,
        tpd: coverValue,
        hp: coverValue,
      })
      .superRefine((covers, ctx) => {
        for (const key of valuedKeys) {
          if (covers[key].selected && !covers[key].value.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a value for this cover.', path: [key, 'value'] });
          }
        }
        if (covers.wci.selected && !wciRoles.includes(covers.wci.value as (typeof wciRoles)[number])) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose driver or cleaner.', path: ['wci', 'value'] });
        }
        for (const key of multipliedKeys) {
          if (!covers[key].selected) continue;
          if (!covers[key].value.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a value for this cover.', path: [key, 'value'] });
          if (!covers[key].multiple.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter the multiplication.', path: [key, 'multiple'] });
        }
        const selected = covers.basic || covers.srcc || covers.tc || covers.flood || covers.wci.selected || valuedKeys.some((key) => covers[key].selected) || multipliedKeys.some((key) => covers[key].selected);
        if (!selected) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tick at least one cover.', path: ['basic'] });
      })
      .transform((covers) => ({
        basic: covers.basic,
        srcc: covers.srcc,
        tc: covers.tc,
        flood: covers.flood,
        towing: { selected: covers.towing.selected, value: covers.towing.selected ? covers.towing.value.trim() : '' },
        wci: { selected: covers.wci.selected, value: covers.wci.selected ? covers.wci.value.trim() : '' },
        gt: { selected: covers.gt.selected, value: covers.gt.selected ? covers.gt.value.trim() : '' },
        windscreen: { selected: covers.windscreen.selected, value: covers.windscreen.selected ? covers.windscreen.value.trim() : '' },
        pab: {
          selected: covers.pab.selected,
          value: covers.pab.selected ? covers.pab.value.trim() : '',
          multiple: covers.pab.selected ? covers.pab.multiple.trim() : '',
        },
        ll: {
          selected: covers.ll.selected,
          value: covers.ll.selected ? covers.ll.value.trim() : '',
          multiple: covers.ll.selected ? covers.ll.multiple.trim() : '',
        },
        tpd: { selected: covers.tpd.selected, value: covers.tpd.selected ? covers.tpd.value.trim() : '' },
        hp: { selected: covers.hp.selected, value: covers.hp.selected ? covers.hp.value.trim() : '' },
      })),
    inquiryId: z.string().optional().default(''),
    motorQuotationId: z.string().optional().default(''),
  });

export type MotorQuotationSlipInput = z.infer<typeof motorQuotationSlipSchema>;
