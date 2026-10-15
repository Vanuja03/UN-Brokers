export const INSURANCE_TYPES = [
  'motor',
  'motor-third-party',
  'travel',
  'fire',
  'dwelling-fire',
  'workers-compensation',
  'money-in-transit',
  'personal-accident',
  'title-insurance',
] as const;

export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  motor: 'Motor Insurance',
  'motor-third-party': 'Motor Third-Party Insurance',
  travel: 'Travel Insurance',
  fire: 'Fire Insurance',
  'dwelling-fire': 'Dwelling Fire Insurance',
  'workers-compensation': "Workers' Compensation Insurance",
  'money-in-transit': 'Money-in-Transit Insurance',
  'personal-accident': 'Personal Accident Insurance',
  'title-insurance': 'Title Insurance',
};

export const QUOTE_STATUSES = [
  'new',
  'contacted',
  'awaiting-information',
  'quote-in-progress',
  'quotation-sent',
  'converted',
  'not-converted',
  'archived',
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const FOLLOW_UP_STATUSES: QuoteStatus[] = ['new', 'contacted', 'awaiting-information'];

export const CONTACT_STATUSES = ['new', 'in-progress', 'resolved', 'archived'] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const ADMIN_ROLES = ['admin', 'staff'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
