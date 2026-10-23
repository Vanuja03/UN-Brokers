import mongoose, { type FilterQuery } from 'mongoose';
import { FOLLOW_UP_STATUSES, INSURANCE_TYPES, QUOTE_STATUSES } from '../config/constants.js';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { IdempotencyKey } from '../models/Idempotency.js';
import { Quote } from '../models/Quote.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { recordAudit } from '../services/audit.js';
import { sendQuoteEmails } from '../services/email.js';
import { sendQuoteWhatsApp } from '../services/whatsapp.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toCsv } from '../utils/csv.js';
import { parseDateRange, parsePagination } from '../utils/pagination.js';
import { fingerprintInquiry, makeReference } from '../utils/reference.js';
import { assertNoOperatorKeys, escapeRegex } from '../utils/sanitize.js';
import { quoteBodySchema, quoteStatusSchema, quoteUpdateSchema } from '../validators/quote.js';

const summarySelect = 'referenceNumber customerName email phone insuranceType status createdAt updatedAt assignedTo sourcePage';

function calendarKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function shiftCalendarKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function quoteFilter(query: Record<string, unknown>): FilterQuery<typeof Quote> {
  const filter: FilterQuery<typeof Quote> = {};
  if (typeof query.status === 'string' && QUOTE_STATUSES.includes(query.status as (typeof QUOTE_STATUSES)[number])) {
    filter.status = query.status;
  }
  if (typeof query.insuranceType === 'string' && INSURANCE_TYPES.includes(query.insuranceType as (typeof INSURANCE_TYPES)[number])) {
    filter.insuranceType = query.insuranceType;
  }
  const createdAt = parseDateRange(query.from, query.to);
  if (createdAt) filter.createdAt = createdAt;
  if (typeof query.assignedTo === 'string' && mongoose.isValidObjectId(query.assignedTo)) filter.assignedTo = query.assignedTo;
  if (typeof query.search === 'string' && query.search.trim()) {
    const term = escapeRegex(query.search.trim().slice(0, 100));
    filter.$or = [
      { customerName: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { referenceNumber: { $regex: term, $options: 'i' } },
    ];
  }
  return filter;
}

async function uniqueReference() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referenceNumber = makeReference('UNB');
    const exists = await Quote.exists({ referenceNumber });
    if (!exists) return referenceNumber;
  }
  throw new AppError(500, 'Could not create a reference number. Please try again.');
}

export const createQuote = asyncHandler(async (req, res) => {
  const parsed = quoteBodySchema.parse(req.body);
  const idempotency = req.get('x-idempotency-key');
  if (idempotency && !/^[A-Za-z0-9-]{8,80}$/.test(idempotency)) {
    throw new AppError(400, 'Invalid submission key.');
  }
  if (idempotency) {
    const existingKey = await IdempotencyKey.findOne({ key: idempotency, kind: 'quote' });
    if (existingKey) {
      return sendData(res, { referenceNumber: existingKey.referenceNumber, duplicate: true }, 'We already received this inquiry.');
    }
  }

  assertNoOperatorKeys(parsed.insuranceDetails);
  const fingerprint = fingerprintInquiry(parsed.email, parsed.phone, parsed.insuranceType, parsed.insuranceDetails);
  const recent = await Quote.findOne({ fingerprint, createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } });
  if (recent) {
    return sendData(res, { referenceNumber: recent.referenceNumber, duplicate: true }, 'We already received this inquiry.');
  }

  const settings = await SiteSettings.findOne();
  const referenceNumber = await uniqueReference();
  const quote = await Quote.create({
    referenceNumber,
    customerName: parsed.customerName,
    email: parsed.email,
    phone: parsed.phone,
    preferredContactMethod: parsed.preferredContactMethod,
    insuranceType: parsed.insuranceType,
    insuranceDetails: parsed.insuranceDetails,
    message: parsed.message ?? '',
    consent: true,
    consentAt: new Date(),
    status: 'new',
    statusHistory: [{ from: '', to: 'new', actorName: 'Customer', changedAt: new Date() }],
    sourcePage: parsed.sourcePage ?? '',
    campaignSource: parsed.campaignSource,
    currency: settings?.defaultCurrency || env.defaultCurrency,
    fingerprint,
  });

  const notifications: { business: 'sent' | 'failed' | 'skipped'; customer: 'sent' | 'failed' | 'skipped'; whatsapp: 'sent' | 'failed' | 'skipped' } = {
    business: 'skipped',
    customer: 'skipped',
    whatsapp: 'skipped',
  };
  try {
    const emailResult = await sendQuoteEmails({
      referenceNumber: quote.referenceNumber,
      customerName: quote.customerName,
      email: quote.email,
      phone: quote.phone,
      preferredContactMethod: quote.preferredContactMethod,
      insuranceType: quote.insuranceType,
      insuranceDetails: quote.insuranceDetails as Record<string, unknown>,
      message: quote.message,
      currency: quote.currency,
      id: quote.id,
      companyName: settings?.companyName || env.companyName,
      notificationEmail: settings?.notificationEmail || '',
    });
    notifications.business = emailResult.business;
    notifications.customer = emailResult.customer;
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Email error');
  }
  try {
    notifications.whatsapp = await sendQuoteWhatsApp({
      customerName: quote.customerName,
      phone: quote.phone,
      insuranceType: quote.insuranceType,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'WhatsApp error');
  }
  quote.notifications = notifications;
  await quote.save();

  if (idempotency) {
    await IdempotencyKey.updateOne(
      { key: idempotency },
      { key: idempotency, referenceNumber, kind: 'quote', expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true },
    );
  }

  return sendData(
    res,
    { referenceNumber },
    'Your quotation inquiry has been received. It is not a policy and not a binding offer.',
    201,
  );
});

export const listQuotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = quoteFilter(req.query as Record<string, unknown>);
  const sort = req.query.sort === 'createdAt' || req.query.sort === 'status' ? String(req.query.sort) : '-createdAt';
  const [items, total] = await Promise.all([
    Quote.find(filter).select(summarySelect).populate('assignedTo', 'name role').sort(sort).skip(skip).limit(limit),
    Quote.countDocuments(filter),
  ]);
  sendData(res, items, 'OK', 200, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id).populate('assignedTo', 'name role');
  if (!quote) throw new AppError(404, 'Inquiry not found.');
  sendData(res, quote);
});

export const quoteStats = asyncHandler(async (_req, res) => {
  const settings = await SiteSettings.findOne();
  const timezone = settings?.businessTimezone || env.businessTimezone;
  const todayKey = calendarKey(new Date(), timezone);
  const startKey = shiftCalendarKey(todayKey, -13);
  const windowStart = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [total, newCount, awaitingFollowUp, quotationSent, converted, archived, byCategory, trendRaw, recent, followUps] = await Promise.all([
    Quote.countDocuments(),
    Quote.countDocuments({ status: 'new' }),
    Quote.countDocuments({ status: { $in: FOLLOW_UP_STATUSES } }),
    Quote.countDocuments({ status: 'quotation-sent' }),
    Quote.countDocuments({ status: 'converted' }),
    Quote.countDocuments({ status: 'archived' }),
    Quote.aggregate<{ _id: string; count: number }>([
      { $match: { status: { $ne: 'archived' } } },
      { $group: { _id: '$insuranceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Quote.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: windowStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } }, count: { $sum: 1 } } },
    ]),
    Quote.find().select(summarySelect).populate('assignedTo', 'name role').sort('-createdAt').limit(6),
    Quote.find({ status: { $in: FOLLOW_UP_STATUSES }, createdAt: { $lte: cutoff } })
      .select(summarySelect)
      .sort('createdAt')
      .limit(8),
  ]);

  const trendMap = new Map(trendRaw.map((item) => [item._id, item.count]));
  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = shiftCalendarKey(startKey, index);
    return { date, count: trendMap.get(date) ?? 0 };
  });
  const denominator = total - archived;
  const conversionRate = denominator > 0 ? Math.round((converted / denominator) * 1000) / 10 : 0;

  sendData(res, {
    total,
    newCount,
    awaitingFollowUp,
    quotationSent,
    converted,
    conversionRate,
    byCategory: byCategory.map((item) => ({ insuranceType: item._id, count: item.count })),
    trend,
    recent,
    followUps,
  });
});

export const exportQuotes = asyncHandler(async (req, res) => {
  const filter = quoteFilter(req.query as Record<string, unknown>);
  const quotes = await Quote.find(filter).populate('assignedTo', 'name').sort('-createdAt').limit(5000);
  const csv = toCsv(
    ['Reference', 'Created', 'Name', 'Email', 'Phone', 'Insurance', 'Status', 'Assigned', 'Source page'],
    quotes.map((quote) => [
      quote.referenceNumber,
      quote.createdAt?.toISOString() ?? '',
      quote.customerName,
      quote.email,
      quote.phone,
      quote.insuranceType,
      quote.status,
      (quote.assignedTo as { name?: string } | null)?.name ?? '',
      quote.sourcePage ?? '',
    ]),
  );
  await recordAudit(req, 'quote_export', 'quote', '', { count: quotes.length });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="quotation-inquiries.csv"');
  res.send(csv);
});

async function applyQuoteUpdate(id: string, body: unknown, actor: { id: string; name: string }, statusOnly = false) {
  const parsed = (statusOnly ? quoteStatusSchema : quoteUpdateSchema).parse(body);
  const quote = await Quote.findById(id);
  if (!quote) throw new AppError(404, 'Inquiry not found.');
  if ('status' in parsed && parsed.status && parsed.status !== quote.status) {
    const previous = quote.status;
    quote.status = parsed.status;
    quote.statusHistory.push({
      from: previous,
      to: parsed.status,
      note: 'note' in parsed ? parsed.note ?? '' : '',
      actorName: actor.name,
      actorId: actor.id,
      changedAt: new Date(),
    });
  } else if ('note' in parsed && parsed.note && statusOnly) {
    quote.statusHistory.push({
      from: quote.status,
      to: quote.status,
      note: parsed.note,
      actorName: actor.name,
      actorId: actor.id,
      changedAt: new Date(),
    });
  }
  if (!statusOnly && 'assignedTo' in parsed && parsed.assignedTo !== undefined) {
    if (parsed.assignedTo === null || parsed.assignedTo === '') {
      quote.assignedTo = null;
    } else {
      const staff = await Admin.findOne({ _id: parsed.assignedTo, active: true });
      if (!staff) throw new AppError(400, 'Choose an active staff member.');
      quote.assignedTo = staff._id;
    }
  }
  if (!statusOnly && 'note' in parsed && parsed.note) {
    quote.notes.push({ text: parsed.note, authorName: actor.name, authorId: actor.id, createdAt: new Date() });
  }
  await quote.save();
  return quote;
}

export const updateQuoteStatus = asyncHandler(async (req, res) => {
  const quote = await applyQuoteUpdate(String(req.params.id), req.body, { id: req.admin!.id, name: req.admin!.name }, true);
  await recordAudit(req, 'quote_status_change', 'quote', quote.id, { status: quote.status });
  sendData(res, await quote.populate('assignedTo', 'name role'), 'Status updated.');
});

export const updateQuote = asyncHandler(async (req, res) => {
  const quote = await applyQuoteUpdate(String(req.params.id), req.body, { id: req.admin!.id, name: req.admin!.name });
  await recordAudit(req, 'quote_update', 'quote', quote.id, { status: quote.status });
  sendData(res, await quote.populate('assignedTo', 'name role'), 'Inquiry updated.');
});

export const archiveQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new AppError(404, 'Inquiry not found.');
  const permanent = req.query.permanent === 'true';
  if (permanent) {
    if (req.admin?.role !== 'admin') throw new AppError(403, 'Only an administrator can permanently delete an inquiry.');
    await quote.deleteOne();
    await recordAudit(req, 'quote_delete', 'quote', String(req.params.id));
    return sendData(res, { id: req.params.id }, 'Inquiry deleted.');
  }
  const previous = quote.status;
  quote.status = 'archived';
  quote.statusHistory.push({
    from: previous,
    to: 'archived',
    actorName: req.admin!.name,
    actorId: req.admin!.id,
    changedAt: new Date(),
  });
  await quote.save();
  await recordAudit(req, 'quote_archive', 'quote', quote.id);
  sendData(res, { id: quote.id, status: quote.status }, 'Inquiry archived.');
});
