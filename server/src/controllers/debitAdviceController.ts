import { DebitAdvice } from '../models/DebitAdvice.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { renderDebitAdvicePdf } from '../services/debitAdvicePdf.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { makeReference } from '../utils/reference.js';
import type { DebitAdviceInput } from '../validators/debitAdvice.js';

function colomboDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
}

function payload(input: DebitAdviceInput) {
  return {
    confirmationType: input.confirmationType,
    vehicleNumber: input.vehicleNumber,
    customerName: input.customerName,
    sumInsured: input.sumInsured,
    contactNo: input.contactNo,
    notes: input.notes,
  };
}

function adviceFilename(reference: string, vehicleNumber: string) {
  const vehicle = vehicleNumber.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${vehicle ? `${vehicle}-${reference}` : reference}.pdf`;
}

async function buildPdf(item: {
  referenceNumber: string;
  adviceDate: string;
  confirmationType: string;
  vehicleNumber: string;
  customerName: string;
  sumInsured: string;
  contactNo: string;
  notes?: string;
  preparedBy?: string;
}) {
  const settings = await SiteSettings.findOne();
  return renderDebitAdvicePdf({
    referenceNumber: item.referenceNumber,
    adviceDate: item.adviceDate,
    confirmationType: item.confirmationType === 'new-business' ? 'new-business' : 'renewal',
    vehicleNumber: item.vehicleNumber,
    customerName: item.customerName,
    sumInsured: item.sumInsured,
    contactNo: item.contactNo,
    notes: item.notes || '',
    preparedBy: item.preparedBy || '',
    companyName: settings?.companyName || 'UN Insurance Brokers',
    telephone: settings?.telephone || '',
    email: settings?.email || '',
    address: settings?.address || '',
  });
}

export const listDebitAdvice = asyncHandler(async (_req, res) => {
  const items = await DebitAdvice.find()
    .sort('-createdAt')
    .limit(100)
    .select('referenceNumber confirmationType customerName vehicleNumber adviceDate createdAt');
  sendData(res, items);
});

export const getDebitAdvice = asyncHandler(async (req, res) => {
  const item = await DebitAdvice.findById(req.params.id);
  if (!item) throw new AppError(404, 'Debit advice not found.');
  sendData(res, item);
});

export const createDebitAdvice = asyncHandler(async (req, res) => {
  const input = req.body as DebitAdviceInput;
  const item = await DebitAdvice.create({
    ...payload(input),
    referenceNumber: makeReference('DA'),
    adviceDate: colomboDate(),
    preparedBy: req.admin?.name || '',
    createdBy: req.admin?.id,
  });
  await recordAudit(req, 'debit_advice_create', 'debitAdvice', item.id);
  sendData(res, item, 'Debit advice saved.', 201);
});

export const updateDebitAdvice = asyncHandler(async (req, res) => {
  const input = req.body as DebitAdviceInput;
  const item = await DebitAdvice.findByIdAndUpdate(req.params.id, payload(input), { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Debit advice not found.');
  await recordAudit(req, 'debit_advice_update', 'debitAdvice', item.id);
  sendData(res, item, 'Debit advice updated.');
});

export const downloadDebitAdvice = asyncHandler(async (req, res) => {
  const item = await DebitAdvice.findById(req.params.id);
  if (!item) throw new AppError(404, 'Debit advice not found.');
  const pdf = await buildPdf({
    referenceNumber: item.referenceNumber,
    adviceDate: item.adviceDate,
    confirmationType: item.confirmationType,
    vehicleNumber: item.vehicleNumber,
    customerName: item.customerName,
    sumInsured: item.sumInsured,
    contactNo: item.contactNo,
    notes: item.notes,
    preparedBy: item.preparedBy,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${adviceFilename(item.referenceNumber, item.vehicleNumber)}"`);
  res.send(pdf);
});
