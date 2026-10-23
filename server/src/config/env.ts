import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/un-brokers'),
    CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().min(2).default('15m'),
    JWT_REFRESH_EXPIRES: z.string().min(2).default('7d'),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    SMTP_HOST: z.string().optional().default(''),
    SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    SMTP_FROM: z.string().optional().default(''),
    BUSINESS_NOTIFICATION_EMAIL: z.string().optional().default(''),
    COMPANY_NAME: z.string().min(1).default('UN Insurance Brokers'),
    COMPANY_TAGLINE: z.string().optional().default('Insurance guidance for the things that matter'),
    COMPANY_PHONE: z.string().optional().default(''),
    COMPANY_EMAIL: z.string().optional().default(''),
    COMPANY_ADDRESS: z.string().optional().default(''),
    COMPANY_OFFICE_HOURS: z.string().optional().default(''),
    DEFAULT_CURRENCY: z.string().min(3).max(3).default('LKR'),
    BUSINESS_TIMEZONE: z.string().min(1).default('Asia/Colombo'),
    ADMIN_APP_URL: z.string().optional().default(''),
    WHATSAPP_TOKEN: z.string().optional().default(''),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
    WHATSAPP_TO: z.string().optional().default(''),
    WHATSAPP_TEMPLATE: z.string().optional().default('new_quotation'),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production') {
      const placeholders = ['replace-with', 'change-me', 'dev-only'];
      for (const secret of [value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET]) {
        if (placeholders.some((item) => secret.toLowerCase().includes(item))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Replace JWT secrets before running in production.',
          });
        }
      }
      if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Access and refresh secrets must be different in production.',
        });
      }
    }
    if (value.COOKIE_SAMESITE === 'none' && value.COOKIE_SECURE === 'false') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'COOKIE_SECURE must be true when COOKIE_SAMESITE is none.',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => issue.message).join(' ');
  throw new Error(`Invalid environment configuration. ${details}`);
}

const data = parsed.data;

export const env = {
  nodeEnv: data.NODE_ENV,
  port: data.PORT,
  mongoUri: data.MONGODB_URI,
  clientOrigins: data.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  jwtAccessSecret: data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: data.JWT_REFRESH_SECRET,
  jwtAccessExpires: data.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: data.JWT_REFRESH_EXPIRES,
  cookieSecure: data.COOKIE_SECURE ? data.COOKIE_SECURE === 'true' : data.NODE_ENV === 'production',
  cookieSameSite: data.COOKIE_SAMESITE,
  smtpHost: data.SMTP_HOST,
  smtpPort: data.SMTP_PORT,
  smtpUser: data.SMTP_USER,
  smtpPass: data.SMTP_PASS,
  smtpFrom: data.SMTP_FROM,
  businessNotificationEmail: data.BUSINESS_NOTIFICATION_EMAIL,
  companyName: data.COMPANY_NAME,
  companyTagline: data.COMPANY_TAGLINE,
  companyPhone: data.COMPANY_PHONE,
  companyEmail: data.COMPANY_EMAIL,
  companyAddress: data.COMPANY_ADDRESS,
  companyOfficeHours: data.COMPANY_OFFICE_HOURS,
  defaultCurrency: data.DEFAULT_CURRENCY.toUpperCase(),
  businessTimezone: data.BUSINESS_TIMEZONE,
  adminAppUrl: data.ADMIN_APP_URL,
  whatsappToken: data.WHATSAPP_TOKEN,
  whatsappPhoneNumberId: data.WHATSAPP_PHONE_NUMBER_ID,
  whatsappTo: data.WHATSAPP_TO.replace(/\D/g, ''),
  whatsappTemplate: data.WHATSAPP_TEMPLATE,
};

export function whatsappConfigured() {
  return Boolean(env.whatsappToken && env.whatsappPhoneNumberId && env.whatsappTo);
}

export function smtpConfigured() {
  return Boolean(env.smtpHost && env.smtpFrom);
}
