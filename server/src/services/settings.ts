import { env } from '../config/env.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { defaultAbout, defaultValues } from '../data/defaults.js';

export async function ensureSettings() {
  const existing = await SiteSettings.findOne();
  if (existing) return existing;
  return SiteSettings.create({
    companyName: env.companyName,
    tagline: env.companyTagline,
    telephone: env.companyPhone,
    email: env.companyEmail,
    address: env.companyAddress,
    officeHours: env.companyOfficeHours,
    defaultCurrency: env.defaultCurrency,
    businessTimezone: env.businessTimezone,
    notificationEmail: env.businessNotificationEmail,
    aboutIntro: defaultAbout.intro,
    mission: defaultAbout.mission,
    vision: defaultAbout.vision,
    values: defaultValues,
    socialLinks: {},
  });
}

export function toPublicSettings(settings: {
  companyName: string;
  logoUrl?: string;
  tagline?: string;
  telephone?: string;
  email?: string;
  address?: string;
  officeHours?: string;
  socialLinks?: { facebook?: string; instagram?: string; linkedin?: string; youtube?: string };
  whatsappNumber?: string;
  defaultCurrency?: string;
  businessTimezone?: string;
  aboutIntro?: string;
  mission?: string;
  vision?: string;
  values?: { title: string; description: string }[];
}) {
  return {
    companyName: settings.companyName,
    logoUrl: settings.logoUrl ?? '',
    tagline: settings.tagline ?? '',
    telephone: settings.telephone ?? '',
    email: settings.email ?? '',
    address: settings.address ?? '',
    officeHours: settings.officeHours ?? '',
    socialLinks: settings.socialLinks ?? {},
    whatsappNumber: settings.whatsappNumber ?? '',
    defaultCurrency: settings.defaultCurrency || env.defaultCurrency,
    businessTimezone: settings.businessTimezone || env.businessTimezone,
    aboutIntro: settings.aboutIntro ?? '',
    mission: settings.mission ?? '',
    vision: settings.vision ?? '',
    values: settings.values ?? [],
  };
}
