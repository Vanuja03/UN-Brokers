import { NonMotorQuotationSlip } from '../models/NonMotorQuotationSlip.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { renderNonMotorQuotationSlipPdf } from '../services/nonMotorQuotationSlipPdf.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { makeReference } from '../utils/reference.js';
import type { NonMotorQuotationSlipInput } from '../validators/nonMotorQuotationSlip.js';

function colomboDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo' }).format(new Date());
}

function payload(input: NonMotorQuotationSlipInput) {
  return {
    slipType: input.slipType,
    customerName: input.customerName,
    locationAddress: input.locationAddress,
    occupation: input.occupation,
    previousInsurance: input.previousInsurance,
    claimsLast3Years: input.claimsLast3Years,
    contactPerson: input.contactPerson,
    contactNo: input.contactNo,
    annualEarnings: input.annualEarnings,
    workerCount: input.workerCount,
    transitFrom: input.transitFrom,
    transitTo: input.transitTo,
    modeOfTransit: input.modeOfTransit,
    transitsPerMonth: input.transitsPerMonth,
    annualCarryings: input.annualCarryings,
    transitArea: input.transitArea,
    maxTransitLimit: input.maxTransitLimit,
    transitCount: input.transitCount,
    vehicleCount: input.vehicleCount,
    annualTransit: input.annualTransit,
    goodsDescription: input.goodsDescription,
    voyageFrom: input.voyageFrom,
    voyageTo: input.voyageTo,
    interests: input.interests,
    methodOfTransport: input.methodOfTransport,
    itemAge: input.itemAge,
    memberCount: input.memberCount,
    medicalLimits: input.medicalLimits,
    cropPlants: input.cropPlants,
    items: input.items,
    firstLossItems: input.firstLossItems,
    workers: input.workers,
    coverAmounts: input.coverAmounts,
    covers: input.covers,
    notes: input.notes,
  };
}

export function nonMotorSlipFilename(reference: string, customerName: string) {
  const name = customerName.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `${name ? `${name}-${reference}` : reference}.pdf`;
}

async function buildPdf(item: {
  referenceNumber: string;
  slipDate: string;
  slipType: string;
  customerName: string;
  locationAddress: string;
  occupation: string;
  previousInsurance: string;
  claimsLast3Years: string;
  contactPerson: string;
  contactNo: string;
  annualEarnings?: string;
  workerCount?: string;
  transitFrom?: string;
  transitTo?: string;
  modeOfTransit?: string;
  transitsPerMonth?: string;
  annualCarryings?: string;
  transitArea?: string;
  maxTransitLimit?: string;
  transitCount?: string;
  vehicleCount?: string;
  annualTransit?: string;
  goodsDescription?: string;
  voyageFrom?: string;
  voyageTo?: string;
  interests?: string[];
  methodOfTransport?: string;
  itemAge?: string;
  memberCount?: string;
  medicalLimits?: { label: string; option1: string; option2: string; option3: string }[];
  cropPlants?: { age: string; coverage: string; count: string; value: string }[];
  items: { label: string; amount: string }[];
  firstLossItems: { label: string; amount: string }[];
  workers?: { designation: string; count: string; salary: string }[];
  coverAmounts?: { key: string; amount: string }[];
  covers: string[];
  notes?: string;
  preparedBy?: string;
}) {
  const settings = await SiteSettings.findOne();
  const slipType = item.slipType === 'burglary' ? 'burglary' : item.slipType === 'workmen' ? 'workmen' : item.slipType === 'accident' ? 'accident' : item.slipType === 'transit' ? 'transit' : item.slipType === 'goods' ? 'goods' : item.slipType === 'marine' ? 'marine' : item.slipType === 'erection' ? 'erection' : item.slipType === 'electronic' ? 'electronic' : item.slipType === 'medical' ? 'medical' : item.slipType === 'crop' ? 'crop' : 'fire';
  return renderNonMotorQuotationSlipPdf({
    ...item,
    slipType,
    annualEarnings: item.annualEarnings || '',
    workerCount: item.workerCount || '',
    transitFrom: item.transitFrom || '',
    transitTo: item.transitTo || '',
    modeOfTransit: item.modeOfTransit || '',
    transitsPerMonth: item.transitsPerMonth || '',
    annualCarryings: item.annualCarryings || '',
    transitArea: item.transitArea || '',
    maxTransitLimit: item.maxTransitLimit || '',
    transitCount: item.transitCount || '',
    vehicleCount: item.vehicleCount || '',
    annualTransit: item.annualTransit || '',
    goodsDescription: item.goodsDescription || '',
    voyageFrom: item.voyageFrom || '',
    voyageTo: item.voyageTo || '',
    interests: item.interests || [],
    methodOfTransport: item.methodOfTransport || '',
    itemAge: item.itemAge || '',
    memberCount: item.memberCount || '',
    medicalLimits: item.medicalLimits || [],
    cropPlants: item.cropPlants || [],
    workers: item.workers || [],
    coverAmounts: item.coverAmounts || [],
    notes: item.notes || '',
    preparedBy: item.preparedBy || '',
    companyName: settings?.companyName || 'UN Insurance Brokers',
    telephone: settings?.telephone || '',
    email: settings?.email || '',
    address: settings?.address || '',
  });
}

export const listNonMotorQuotationSlips = asyncHandler(async (_req, res) => {
  const items = await NonMotorQuotationSlip.find().sort('-createdAt').limit(100).select('referenceNumber slipType customerName locationAddress slipDate createdAt');
  sendData(res, items);
});

export const getNonMotorQuotationSlip = asyncHandler(async (req, res) => {
  const item = await NonMotorQuotationSlip.findById(req.params.id);
  if (!item) throw new AppError(404, 'Quotation slip not found.');
  sendData(res, item);
});

export const createNonMotorQuotationSlip = asyncHandler(async (req, res) => {
  const input = req.body as NonMotorQuotationSlipInput;
  const item = await NonMotorQuotationSlip.create({
    ...payload(input),
    referenceNumber: makeReference('NQS'),
    slipDate: colomboDate(),
    preparedBy: req.admin?.name || '',
    createdBy: req.admin?.id,
  });
  await recordAudit(req, 'non_motor_quotation_slip_create', 'nonMotorQuotationSlip', item.id);
  sendData(res, item, 'Quotation slip saved.', 201);
});

export const updateNonMotorQuotationSlip = asyncHandler(async (req, res) => {
  const input = req.body as NonMotorQuotationSlipInput;
  const item = await NonMotorQuotationSlip.findByIdAndUpdate(req.params.id, payload(input), { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Quotation slip not found.');
  await recordAudit(req, 'non_motor_quotation_slip_update', 'nonMotorQuotationSlip', item.id);
  sendData(res, item, 'Quotation slip updated.');
});

export const downloadNonMotorQuotationSlip = asyncHandler(async (req, res) => {
  const item = await NonMotorQuotationSlip.findById(req.params.id);
  if (!item) throw new AppError(404, 'Quotation slip not found.');
  const pdf = await buildPdf({
    referenceNumber: item.referenceNumber,
    slipDate: item.slipDate,
    slipType: item.slipType,
    customerName: item.customerName,
    locationAddress: item.locationAddress,
    occupation: item.occupation,
    previousInsurance: item.previousInsurance,
    claimsLast3Years: item.claimsLast3Years,
    contactPerson: item.contactPerson,
    contactNo: item.contactNo,
    annualEarnings: item.annualEarnings,
    workerCount: item.workerCount,
    transitFrom: item.transitFrom,
    transitTo: item.transitTo,
    modeOfTransit: item.modeOfTransit,
    transitsPerMonth: item.transitsPerMonth,
    annualCarryings: item.annualCarryings,
    transitArea: item.transitArea,
    maxTransitLimit: item.maxTransitLimit,
    transitCount: item.transitCount,
    vehicleCount: item.vehicleCount,
    annualTransit: item.annualTransit,
    goodsDescription: item.goodsDescription,
    voyageFrom: item.voyageFrom,
    voyageTo: item.voyageTo,
    interests: item.interests,
    methodOfTransport: item.methodOfTransport,
    itemAge: item.itemAge,
    memberCount: item.memberCount,
    medicalLimits: item.medicalLimits,
    cropPlants: item.cropPlants,
    items: item.items,
    firstLossItems: item.firstLossItems,
    workers: item.workers,
    coverAmounts: item.coverAmounts,
    covers: item.covers,
    notes: item.notes,
    preparedBy: item.preparedBy,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${nonMotorSlipFilename(item.referenceNumber, item.customerName)}"`);
  res.send(pdf);
});
