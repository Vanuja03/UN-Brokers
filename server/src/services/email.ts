import nodemailer from 'nodemailer';
import { env, smtpConfigured } from '../config/env.js';
import type { InsuranceType } from '../config/constants.js';
import { adminContactEmail, adminQuoteEmail, customerContactEmail, customerQuoteEmail } from './emailTemplates.js';

type Delivery = 'sent' | 'failed' | 'skipped';

function transporter() {
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });
}

async function deliver(to: string, message: { subject: string; text: string; html: string }): Promise<Delivery> {
  let lastMessage = 'Email failed';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await transporter().sendMail({
        from: env.smtpFrom,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return 'sent';
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : 'Email failed';
    }
  }
  console.error(lastMessage);
  return 'failed';
}

export async function sendQuoteEmails(input: {
  referenceNumber: string;
  customerName: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  insuranceType: string;
  insuranceDetails: Record<string, unknown>;
  message?: string;
  currency: string;
  id: string;
  companyName: string;
  notificationEmail?: string;
}) {
  if (!smtpConfigured()) return { business: 'skipped' as Delivery, customer: 'skipped' as Delivery };
  const businessTo = input.notificationEmail || env.businessNotificationEmail;
  const business = businessTo
    ? await deliver(
        businessTo,
        adminQuoteEmail({
          companyName: input.companyName,
          referenceNumber: input.referenceNumber,
          customerName: input.customerName,
          email: input.email,
          phone: input.phone,
          preferredContactMethod: input.preferredContactMethod,
          insuranceType: input.insuranceType as InsuranceType,
          details: input.insuranceDetails,
          message: input.message ?? '',
          currency: input.currency,
          adminUrl: env.adminAppUrl ? `${env.adminAppUrl.replace(/\/$/, '')}/admin/quotations/${input.id}` : undefined,
        }),
      )
    : 'skipped';
  const customer = await deliver(
    input.email,
    customerQuoteEmail({
      companyName: input.companyName,
      customerName: input.customerName,
      referenceNumber: input.referenceNumber,
      insuranceType: input.insuranceType as InsuranceType,
    }),
  );
  return { business, customer };
}

export async function sendContactEmails(input: {
  referenceNumber: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  insuranceType?: string;
  companyName: string;
  notificationEmail?: string;
}) {
  if (!smtpConfigured()) return { business: 'skipped' as Delivery, customer: 'skipped' as Delivery };
  const businessTo = input.notificationEmail || env.businessNotificationEmail;
  const business = businessTo
    ? await deliver(businessTo, adminContactEmail({ ...input, companyName: input.companyName }))
    : 'skipped';
  const customer = await deliver(
    input.email,
    customerContactEmail({ companyName: input.companyName, name: input.name, referenceNumber: input.referenceNumber }),
  );
  return { business, customer };
}
