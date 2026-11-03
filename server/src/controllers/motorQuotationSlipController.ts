import mongoose from 'mongoose';
import { MotorQuotation } from '../models/MotorQuotation.js';
import { MotorQuotationSlip } from '../models/MotorQuotationSlip.js';
import { Quote } from '../models/Quote.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { renderMotorQuotationSlipPdf } from '../services/motorQuotationSlipPdf.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { makeReference } from '../utils/reference.js';
import type { MotorQuotationSlipInput } from '../validators/motorQuotationSlip.js';

function objectId(value: string) {
  return value && mongoose.isValidObjectId(value) ? value : null;
}

function colomboDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
}

function payload(input: MotorQuotationSlipInput) {
  return {
    customerName: input.customerName,
    vehicleNumber: input.vehicleNumber,
    make: input.make,
    model: input.model,
    yearOfManufacture: input.yearOfManufacture,
    vehicleType: input.vehicleType,
    vehicleUsage: input.vehicleUsage,
    covers: input.covers,
    inquiryId: objectId(input.inquiryId),
    motorQuotationId: objectId(input.motorQuotationId),
  };
}

async function assertLinks(input: MotorQuotationSlipInput) {
  if (input.inquiryId) {
    if (!mongoose.isValidObjectId(input.inquiryId)) throw new AppError(400, 'The inquiry could not be found.');
    const inquiry = await Quote.findById(input.inquiryId).select('insuranceType');
    if (!inquiry || (inquiry.insuranceType !== 'motor' && inquiry.insuranceType !== 'motor-third-party')) {
      throw new AppError(400, 'A quotation slip can only be prepared for a motor inquiry.');
    }
  }
  if (input.motorQuotationId) {
    if (!mongoose.isValidObjectId(input.motorQuotationId)) throw new AppError(400, 'The motor quotation could not be found.');
    const quotation = await MotorQuotation.findById(input.motorQuotationId).select('_id');
    if (!quotation) throw new AppError(400, 'The motor quotation could not be found.');
  }
}

function slipFilename(reference: string, vehicleNumber: string) {
  const vehicle = vehicleNumber.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${vehicle ? `${vehicle}-${reference}` : reference}.pdf`;
}

async function buildPdf(item: {
  referenceNumber: string;
  slipDate: string;
  customerName: string;
  vehicleNumber: string;
  make: string;
  model: string;
  yearOfManufacture: string;
  vehicleType: string;
  vehicleUsage: string;
  covers: MotorQuotationSlipInput['covers'];
  preparedBy?: string;
}) {
  const settings = await SiteSettings.findOne();
  return renderMotorQuotationSlipPdf({
    referenceNumber: item.referenceNumber,
    slipDate: item.slipDate,
    customerName: item.customerName,
    vehicleNumber: item.vehicleNumber,
    make: item.make,
    model: item.model,
    yearOfManufacture: item.yearOfManufacture,
    vehicleType: item.vehicleType,
    vehicleUsage: item.vehicleUsage,
    covers: item.covers,
    preparedBy: item.preparedBy || '',
    companyName: settings?.companyName || 'UN Insurance Brokers',
    telephone: settings?.telephone || '',
    email: settings?.email || '',
    address: settings?.address || '',
  });
}

export const listMotorQuotationSlips = asyncHandler(async (_req, res) => {
  const items = await MotorQuotationSlip.find()
    .sort('-createdAt')
    .limit(100)
    .select('referenceNumber customerName vehicleNumber slipDate createdAt');
  sendData(res, items);
});

export const getMotorQuotationSlip = asyncHandler(async (req, res) => {
  const item = await MotorQuotationSlip.findById(req.params.id);
  if (!item) throw new AppError(404, 'Quotation slip not found.');
  sendData(res, item);
});

export const createMotorQuotationSlip = asyncHandler(async (req, res) => {
  const input = req.body as MotorQuotationSlipInput;
  await assertLinks(input);
  const item = await MotorQuotationSlip.create({
    ...payload(input),
    referenceNumber: makeReference('QS'),
    slipDate: colomboDate(),
    preparedBy: req.admin?.name || '',
    createdBy: req.admin?.id,
  });
  await recordAudit(req, 'motor_quotation_slip_create', 'motorQuotationSlip', item.id);
  sendData(res, item, 'Quotation slip saved.', 201);
});

export const updateMotorQuotationSlip = asyncHandler(async (req, res) => {
  const input = req.body as MotorQuotationSlipInput;
  await assertLinks(input);
  const item = await MotorQuotationSlip.findByIdAndUpdate(req.params.id, payload(input), { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Quotation slip not found.');
  await recordAudit(req, 'motor_quotation_slip_update', 'motorQuotationSlip', item.id);
  sendData(res, item, 'Quotation slip updated.');
});

export const downloadMotorQuotationSlip = asyncHandler(async (req, res) => {
  const item = await MotorQuotationSlip.findById(req.params.id);
  if (!item?.covers) throw new AppError(404, 'Quotation slip not found.');
  const pdf = await buildPdf({
    referenceNumber: item.referenceNumber,
    slipDate: item.slipDate,
    customerName: item.customerName,
    vehicleNumber: item.vehicleNumber,
    make: item.make,
    model: item.model,
    yearOfManufacture: item.yearOfManufacture,
    vehicleType: item.vehicleType,
    vehicleUsage: item.vehicleUsage,
    covers: item.covers,
    preparedBy: item.preparedBy,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slipFilename(item.referenceNumber, item.vehicleNumber)}"`);
  res.send(pdf);
});
