import { CONTACT_STATUSES, INSURANCE_TYPES } from '../config/constants.js';
import { env } from '../config/env.js';
import { Contact } from '../models/Contact.js';
import { IdempotencyKey } from '../models/Idempotency.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { recordAudit } from '../services/audit.js';
import { sendContactEmails } from '../services/email.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';
import { fingerprintInquiry, makeReference } from '../utils/reference.js';
import { escapeRegex } from '../utils/sanitize.js';
import { contactBodySchema, contactStatusSchema } from '../validators/contact.js';

export const createContact = asyncHandler(async (req, res) => {
  const parsed = contactBodySchema.parse(req.body);
  const idempotency = req.get('x-idempotency-key');
  if (idempotency && !/^[A-Za-z0-9-]{8,80}$/.test(idempotency)) throw new AppError(400, 'Invalid submission key.');
  if (idempotency) {
    const existingKey = await IdempotencyKey.findOne({ key: idempotency, kind: 'contact' });
    if (existingKey) {
      return sendData(res, { referenceNumber: existingKey.referenceNumber, duplicate: true }, 'We already received this message.');
    }
  }

  const fingerprint = fingerprintInquiry(parsed.email, parsed.phone, parsed.subject, { message: parsed.message });
  const recent = await Contact.findOne({ fingerprint, createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } });
  if (recent) {
    return sendData(res, { referenceNumber: recent.referenceNumber, duplicate: true }, 'We already received this message.');
  }

  const referenceNumber = makeReference('CT');
  const contact = await Contact.create({
    referenceNumber,
    name: parsed.name,
    email: parsed.email,
    phone: parsed.phone,
    subject: parsed.subject,
    insuranceType: parsed.insuranceType || '',
    message: parsed.message,
    consent: true,
    fingerprint,
  });
  const settings = await SiteSettings.findOne();
  try {
    contact.notifications = await sendContactEmails({
      referenceNumber,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      insuranceType: contact.insuranceType,
      companyName: settings?.companyName || env.companyName,
      notificationEmail: settings?.notificationEmail || '',
    });
    await contact.save();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Email error');
  }
  if (idempotency) {
    await IdempotencyKey.updateOne(
      { key: idempotency },
      { key: idempotency, referenceNumber, kind: 'contact', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true },
    );
  }
  sendData(res, { referenceNumber }, 'Your message has been received.', 201);
});

export const listContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === 'string' && CONTACT_STATUSES.includes(req.query.status as (typeof CONTACT_STATUSES)[number])) {
    filter.status = req.query.status;
  }
  if (typeof req.query.insuranceType === 'string' && INSURANCE_TYPES.includes(req.query.insuranceType as (typeof INSURANCE_TYPES)[number])) {
    filter.insuranceType = req.query.insuranceType;
  }
  if (typeof req.query.search === 'string' && req.query.search.trim()) {
    const term = escapeRegex(req.query.search.trim().slice(0, 100));
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { subject: { $regex: term, $options: 'i' } },
      { referenceNumber: { $regex: term, $options: 'i' } },
    ];
  }
  const [items, total] = await Promise.all([
    Contact.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Contact.countDocuments(filter),
  ]);
  sendData(res, items, 'OK', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = contactStatusSchema.parse(req.body);
  const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!contact) throw new AppError(404, 'Message not found.');
  await recordAudit(req, 'contact_status_change', 'contact', contact.id, { status });
  sendData(res, contact, 'Status updated.');
});
