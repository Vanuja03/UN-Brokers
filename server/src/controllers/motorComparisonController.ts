import { MotorComparison } from '../models/MotorComparison.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';
import { makeReference } from '../utils/reference.js';
import { escapeRegex } from '../utils/sanitize.js';
import { motorComparisonSchema } from '../validators/motorComparison.js';

function toDocument(parsed: ReturnType<typeof motorComparisonSchema.parse>, createdBy?: string) {
  return {
    customerName: parsed.customerName,
    quotationDate: new Date(`${parsed.quotationDate}T00:00:00.000Z`),
    vehicleNumber: parsed.vehicleNumber,
    leaseOrLoanNo: parsed.leaseOrLoanNo,
    usage: parsed.usage,
    yearOfManufacture: parsed.yearOfManufacture,
    sumInsured: parsed.sumInsured,
    make: parsed.make,
    model: parsed.model,
    fuel: parsed.fuel,
    preparedByName: parsed.preparedByName,
    preparedByPhone: parsed.preparedByPhone,
    preparedByEmail: parsed.preparedByEmail,
    insurers: parsed.insurers,
    ...(createdBy ? { createdBy } : {}),
  };
}

export const listMotorComparisons = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, 20);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter = search
    ? {
        $or: ['customerName', 'vehicleNumber', 'referenceNumber'].map((field) => ({
          [field]: new RegExp(escapeRegex(search), 'i'),
        })),
      }
    : {};
  const [items, total] = await Promise.all([
    MotorComparison.find(filter).sort('-createdAt').skip(skip).limit(limit),
    MotorComparison.countDocuments(filter),
  ]);
  sendData(res, items, 'OK', 200, { page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

export const getMotorComparison = asyncHandler(async (req, res) => {
  const item = await MotorComparison.findById(req.params.id);
  if (!item) throw new AppError(404, 'Motor quotation not found.');
  sendData(res, item);
});

export const createMotorComparison = asyncHandler(async (req, res) => {
  const parsed = motorComparisonSchema.parse(req.body);
  const referenceNumber = makeReference('MQ');
  const item = await MotorComparison.create({
    referenceNumber,
    ...toDocument(parsed, req.admin?.id),
  });
  await recordAudit(req, 'motor_comparison_create', 'motorComparison', item.id, { referenceNumber });
  sendData(res, item, 'Motor quotation saved.', 201);
});

export const updateMotorComparison = asyncHandler(async (req, res) => {
  const parsed = motorComparisonSchema.parse(req.body);
  const item = await MotorComparison.findByIdAndUpdate(req.params.id, toDocument(parsed), { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Motor quotation not found.');
  await recordAudit(req, 'motor_comparison_update', 'motorComparison', item.id);
  sendData(res, item, 'Motor quotation updated.');
});

export const deleteMotorComparison = asyncHandler(async (req, res) => {
  const item = await MotorComparison.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError(404, 'Motor quotation not found.');
  await recordAudit(req, 'motor_comparison_delete', 'motorComparison', String(req.params.id));
  sendData(res, { id: item.id }, 'Motor quotation removed.');
});
