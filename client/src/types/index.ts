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

export type PublicSettings = {
  companyName: string;
  logoUrl: string;
  tagline: string;
  telephone: string;
  email: string;
  address: string;
  officeHours: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  whatsappNumber: string;
  defaultCurrency: string;
  businessTimezone: string;
  aboutIntro: string;
  mission: string;
  vision: string;
  values: { title: string; description: string }[];
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
};

export type Partner = {
  _id: string;
  name: string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  active: boolean;
  displayOrder: number;
  isDemo: boolean;
};

export type Testimonial = {
  _id: string;
  customerDisplayName: string;
  review: string;
  insuranceType: string;
  avatarUrl: string;
  verified: boolean;
  approved: boolean;
  displayOrder: number;
  isDemo: boolean;
};

export type TeamMember = {
  _id: string;
  name: string;
  jobTitle: string;
  biography: string;
  imageUrl: string;
  qualifications: string[];
  linkedinUrl: string;
  active: boolean;
  displayOrder: number;
  isDemo: boolean;
};

export type Faq = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  active: boolean;
};

export type InsuranceCopy = {
  slug: InsuranceType;
  name: string;
  shortDescription: string;
  overview: string;
  metaTitle?: string;
  metaDescription?: string;
};

export const fallbackSettings: PublicSettings = {
  companyName: 'UN Insurance Brokers',
  logoUrl: '',
  tagline: 'Insurance guidance for the things that matter',
  telephone: '',
  email: '',
  address: '',
  officeHours: '',
  socialLinks: {},
  whatsappNumber: '',
  defaultCurrency: 'LKR',
  businessTimezone: 'Asia/Colombo',
  aboutIntro:
    'Established in 2011, UN Insurance Brokers (Pvt) Ltd is a registered insurance broking company in Sri Lanka, working in compliance with the Insurance Regulatory Commission of Sri Lanka.',
  mission: 'To protect our clients’ interests, deliver value-added insurance services, and contribute to the continued development of Sri Lanka’s insurance industry.',
  vision: 'To be a brokerage people return to when their cover needs change.',
  values: [
    { title: 'Clarity', description: 'Explain what a quotation inquiry can and cannot do.' },
    { title: 'Care', description: 'Treat each inquiry as a request for guidance.' },
    { title: 'Integrity', description: 'Use only the information a customer chooses to share.' },
    { title: 'Responsiveness', description: 'Review inquiries and follow up when more detail is needed.' },
  ],
};

export function isInsuranceType(value: string | null | undefined): value is InsuranceType {
  return INSURANCE_TYPES.includes(value as InsuranceType);
}
