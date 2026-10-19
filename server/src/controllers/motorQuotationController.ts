import mongoose from 'mongoose';
import { MotorQuotation } from '../models/MotorQuotation.js';
import { Quote } from '../models/Quote.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { renderMotorQuotationPdf } from '../services/motorQuotationPdf.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { makeReference } from '../utils/reference.js';
import { motorQuotationSchema, type MotorQuotationInput } from '../validators/motorQuotation.js';

function payload(input: MotorQuotationInput) {
  return {
    insuranceType: input.insuranceType,
    quotationDate: input.quotationDate,
    customerName: input.customerName,
    vehicleNumber: input.vehicleNumber,
    leaseOrLoanNo: input.leaseOrLoanNo,
    usage: input.usage,
    yearOfManufacture: input.yearOfManufacture,
    sumInsured: input.sumInsured,
    make: input.make,
    model: input.model,
    fuel: input.fuel,
    preparedBy: input.preparedBy,
    preparedByPhone: input.preparedByPhone,
    preparedByEmail: input.preparedByEmail,
    insurers: input.insurers,
    rows: input.rows,
    inquiryId: input.inquiryId && mongoose.isValidObjectId(input.inquiryId) ? input.inquiryId : null,
  };
}

async function assertInquiry(input: MotorQuotationInput) {
  if (!input.inquiryId) return;
  if (!mongoose.isValidObjectId(input.inquiryId)) throw new AppError(400, 'The inquiry could not be found.');
  const inquiry = await Quote.findById(input.inquiryId);
  if (!inquiry || (inquiry.insuranceType !== 'motor' && inquiry.insuranceType !== 'motor-third-party')) {
    throw new AppError(400, 'A customer quotation can only be prepared for motor or third-party insurance.');
  }
  if (inquiry.insuranceType !== input.insuranceType) {
    throw new AppError(400, 'Choose the same cover type as the customer inquiry.');
  }
}

export const listMotorQuotations = asyncHandler(async (req, res) => {
  const insuranceType = req.query.insuranceType === 'motor' || req.query.insuranceType === 'motor-third-party' ? req.query.insuranceType : undefined;
  const items = await MotorQuotation.find(insuranceType ? { insuranceType } : {})
    .sort('-createdAt')
    .limit(100)
    .select('referenceNumber customerName vehicleNumber insuranceType quotationDate createdAt');
  sendData(res, items);
});

export const getMotorQuotation = asyncHandler(async (req, res) => {
  const item = await MotorQuotation.findById(req.params.id);
  if (!item) throw new AppError(404, 'Quotation not found.');
  sendData(res, item);
});

export const createMotorQuotation = asyncHandler(async (req, res) => {
  const input = motorQuotationSchema.parse(req.body);
  await assertInquiry(input);
  const item = await MotorQuotation.create({
    ...payload(input),
    referenceNumber: makeReference('MQ'),
    createdBy: req.admin?.id,
  });
  await recordAudit(req, 'motor_quotation_create', 'motorQuotation', item.id, { insuranceType: item.insuranceType });
  sendData(res, item, 'Quotation saved.', 201);
});

export const updateMotorQuotation = asyncHandler(async (req, res) => {
  const input = motorQuotationSchema.parse(req.body);
  await assertInquiry(input);
  const item = await MotorQuotation.findByIdAndUpdate(req.params.id, payload(input), { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Quotation not found.');
  await recordAudit(req, 'motor_quotation_update', 'motorQuotation', item.id);
  sendData(res, item, 'Quotation updated.');
});

export const downloadMotorQuotation = asyncHandler(async (req, res) => {
  const item = await MotorQuotation.findById(req.params.id);
  if (!item) throw new AppError(404, 'Quotation not found.');
  const settings = await SiteSettings.findOne();
  const pdf = await renderMotorQuotationPdf({
    referenceNumber: item.referenceNumber,
    insuranceType: item.insuranceType,
    quotationDate: item.quotationDate,
    customerName: item.customerName,
    vehicleNumber: item.vehicleNumber,
    leaseOrLoanNo: item.leaseOrLoanNo,
    usage: item.usage,
    yearOfManufacture: item.yearOfManufacture,
    sumInsured: item.sumInsured,
    make: item.make,
    model: item.model,
    fuel: item.fuel,
    preparedBy: item.preparedBy,
    preparedByPhone: item.preparedByPhone,
    preparedByEmail: item.preparedByEmail,
    insurers: item.insurers,
    rows: item.rows,
    companyName: settings?.companyName || 'UN Insurance Brokers',
    telephone: settings?.telephone || '',
    email: settings?.email || '',
    address: settings?.address || '',
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${item.referenceNumber}.pdf"`);
  res.send(pdf);
});
