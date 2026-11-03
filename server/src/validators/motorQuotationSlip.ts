import { z } from 'zod';
import { textField } from './common.js';

const coverValue = z.object({
  selected: z.boolean(),
  value: z.string().trim().max(80, 'Enter 80 characters or fewer.').optional().default(''),
});

const valuedKeys = ['towing', 'wci', 'pab', 'll', 'tpd', 'hp'] as const;

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
    vehicleType: textField(1, 80),
    vehicleUsage: textField(1, 80),
    covers: z
      .object({
        basic: z.boolean(),
        srcc: z.boolean(),
        tc: z.boolean(),
        flood: z.boolean(),
        towing: coverValue,
        wci: coverValue,
        pab: coverValue,
        ll: coverValue,
        tpd: coverValue,
        hp: coverValue,
      })
      .superRefine((covers, ctx) => {
        for (const key of valuedKeys) {
          if (covers[key].selected && !covers[key].value.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a value for this cover.', path: [key, 'value'] });
          }
        }
        const selected = covers.basic || covers.srcc || covers.tc || covers.flood || valuedKeys.some((key) => covers[key].selected);
        if (!selected) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Tick at least one cover.', path: ['basic'] });
      })
      .transform((covers) => ({
        basic: covers.basic,
        srcc: covers.srcc,
        tc: covers.tc,
        flood: covers.flood,
        towing: { selected: covers.towing.selected, value: covers.towing.selected ? covers.towing.value.trim() : '' },
        wci: { selected: covers.wci.selected, value: covers.wci.selected ? covers.wci.value.trim() : '' },
        pab: { selected: covers.pab.selected, value: covers.pab.selected ? covers.pab.value.trim() : '' },
        ll: { selected: covers.ll.selected, value: covers.ll.selected ? covers.ll.value.trim() : '' },
        tpd: { selected: covers.tpd.selected, value: covers.tpd.selected ? covers.tpd.value.trim() : '' },
        hp: { selected: covers.hp.selected, value: covers.hp.selected ? covers.hp.value.trim() : '' },
      })),
    inquiryId: z.string().optional().default(''),
    motorQuotationId: z.string().optional().default(''),
  });

export type MotorQuotationSlipInput = z.infer<typeof motorQuotationSlipSchema>;
