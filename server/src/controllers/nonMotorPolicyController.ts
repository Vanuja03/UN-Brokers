import type { Request } from 'express';
import { NonMotorPolicyRegister } from '../models/NonMotorPolicyRegister.js';
import { recordAudit } from '../services/audit.js';
import { nonMotorRenewalColumns, renderPolicyRenewalPdf } from '../services/policyRenewalPdf.js';
import { ensureSettings } from '../services/settings.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/sanitize.js';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Status = 'ren' | 'new' | 'refund' | 'additional';
type RenewalResult = '' | 'done' | 'cancel' | 'sold';

type RegisterRow = {
  _id: unknown;
  debitDate: Date;
  riskDate: Date;
  debitNoteNo?: string;
  customerName: string;
  postalAddress?: string;
  locationAddress?: string;
  sumInsured: number;
  policyNumber: string;
  product: string;
  renewalDate?: Date | null;
  premiumExRccTc: number;
  thisYearPremium?: number | null;
  insuranceCompany: string;
  salesPerson?: string;
  agentCode?: string;
  special: Status;
  renewalResult?: RenewalResult;
  commissionReceived?: boolean;
  remarks?: string;
};

function requireId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) throw new AppError(404, 'Registered policy not found.');
  return id;
}

function monthNumber(month: string) {
  if (!/^\d{1,2}$/.test(month)) return null;
  const value = Number(month);
  return value >= 1 && value <= 12 ? value : null;
}

function statusText(status: Status) {
  if (status === 'new') return 'New';
  if (status === 'refund') return 'Refund';
  if (status === 'additional') return 'Additional';
  return 'Ren';
}

function toRenewalView(row: RegisterRow) {
  return {
    _id: row._id,
    policyNumber: row.policyNumber,
    product: row.product,
    fromDate: row.riskDate,
    toDate: row.renewalDate ?? null,
    customerName: row.customerName,
    postalAddress: row.postalAddress || '',
    locationAddress: row.locationAddress || '',
    sumInsured: row.sumInsured,
    lastYearPremium: row.premiumExRccTc,
    thisYearPremium: row.thisYearPremium ?? null,
    insuranceCompany: row.insuranceCompany,
    salesPerson: row.salesPerson || '',
    speciCo: row.agentCode || '',
    status: row.special,
    renewalResult: row.renewalResult || '',
    commissionReceived: row.commissionReceived === true,
    remarks: row.remarks || '',
  };
}

function listQuery(query: Request['query']) {
  const month = typeof query.month === 'string' ? query.month : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const category = typeof query.category === 'string' ? query.category : '';
  const commission = typeof query.commission === 'string' ? query.commission : '';
  const monthOfYear = month ? monthNumber(month) : null;
  const filter: Record<string, unknown> = {};
  if (monthOfYear) filter.$expr = { $eq: [{ $month: '$renewalDate' }, monthOfYear] };
  if (category === 'cancel' || category === 'sold') filter.renewalResult = category;
  if (category === 'cancel-sold') filter.renewalResult = { $in: ['cancel', 'sold'] };
  if (commission === 'received') filter.commissionReceived = true;
  if (commission === 'pending') filter.commissionReceived = { $ne: true };
  if (search) {
    const term = escapeRegex(search);
    filter.$or = ['policyNumber', 'customerName', 'product', 'debitNoteNo'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }
  return { monthOfYear, search, filter };
}

function pdfDate(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function pdfMoney(value: number | null | undefined) {
  if (value == null) return '';
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value || 0);
}

export const listNonMotorPolicyRegisters = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter: Record<string, unknown> = {};
  if (search) {
    const term = escapeRegex(search);
    filter.$or = ['policyNumber', 'customerName', 'product', 'debitNoteNo'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }
  const rows = await NonMotorPolicyRegister.find(filter).sort({ debitDate: -1, customerName: 1 }).limit(500);
  sendData(res, rows);
});

export const createNonMotorPolicyRegister = asyncHandler(async (req, res) => {
  const row = await NonMotorPolicyRegister.create(req.body);
  await recordAudit(req, 'non_motor_policy_register_create', 'non-motor-policy-register', row.id);
  sendData(res, row, 'Policy registered.', 201);
});

export const updateNonMotorPolicyRegister = asyncHandler(async (req, res) => {
  const row = await NonMotorPolicyRegister.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!row) throw new AppError(404, 'Registered policy not found.');
  await recordAudit(req, 'non_motor_policy_register_update', 'non-motor-policy-register', row.id);
  sendData(res, row, 'Registered policy updated.');
});

export const deleteNonMotorPolicyRegister = asyncHandler(async (req, res) => {
  const row = await NonMotorPolicyRegister.findByIdAndDelete(requireId(req.params.id));
  if (!row) throw new AppError(404, 'Registered policy not found.');
  await recordAudit(req, 'non_motor_policy_register_delete', 'non-motor-policy-register', row.id);
  sendData(res, { id: row.id }, 'Registered policy deleted.');
});

export const listNonMotorPolicyRenewals = asyncHandler(async (req, res) => {
  const { filter } = listQuery(req.query);
  const rows = await NonMotorPolicyRegister.find(filter).sort({ renewalDate: 1, customerName: 1 }).limit(500);
  sendData(res, rows.map((row) => toRenewalView(row)));
});

export const downloadNonMotorPolicyRenewals = asyncHandler(async (req, res) => {
  const { monthOfYear, search, filter } = listQuery(req.query);
  const policies = await NonMotorPolicyRegister.find(filter).sort({ renewalDate: 1, customerName: 1 }).limit(500);
  const settings = await ensureSettings();
  const period = monthOfYear ? monthNames[monthOfYear - 1] : 'All months';
  const pdf = await renderPolicyRenewalPdf({
    companyName: settings.companyName,
    telephone: settings.telephone || '',
    email: settings.email || '',
    address: settings.address || '',
    periodLabel: search ? `${period}  ·  Search: ${search.slice(0, 40)}` : period,
    title: 'NON-MOTOR POLICY RENEWAL LIST',
    columns: nonMotorRenewalColumns,
    rows: policies.map((row) => {
      const view = toRenewalView(row);
      return {
        policyNumber: view.policyNumber,
        product: view.product,
        vehicleNumber: '',
        fromDate: pdfDate(view.fromDate),
        toDate: pdfDate(view.toDate),
        customerName: view.customerName,
        postalAddress: view.postalAddress,
        locationAddress: view.locationAddress,
        sumInsured: pdfMoney(view.sumInsured),
        lastYearPremium: pdfMoney(view.lastYearPremium),
        thisYearPremium: pdfMoney(view.thisYearPremium),
        insuranceCompany: view.insuranceCompany,
        salesPerson: view.salesPerson,
        speciCo: view.speciCo,
        status: statusText(view.status),
        renewalResult: view.renewalResult === 'done' || view.renewalResult === 'cancel' || view.renewalResult === 'sold' ? view.renewalResult : '',
        contactNo: '',
        remarks: view.remarks,
      };
    }),
  });
  const filename = monthOfYear ? `non-motor-policy-renewals-${period.toLowerCase()}.pdf` : 'non-motor-policy-renewals.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

export const createNonMotorPolicyRenewal = asyncHandler(async () => {
  throw new AppError(400, 'Register the policy first. Renewals use the policy register.');
});

export const deleteNonMotorPolicyRenewal = asyncHandler(async () => {
  throw new AppError(400, 'Registered policies stay in the register. Remove one from the policy register tab.');
});

export const updateNonMotorPolicyRenewal = asyncHandler(async (req, res) => {
  const existing = await NonMotorPolicyRegister.findById(requireId(req.params.id));
  if (!existing) throw new AppError(404, 'Policy not found.');
  existing.thisYearPremium = req.body.thisYearPremium;
  existing.renewalResult = req.body.renewalResult;
  existing.remarks = req.body.remarks ?? '';
  await existing.save();
  await recordAudit(req, 'non_motor_policy_renewal_update', 'non-motor-policy-register', existing.id);
  sendData(res, toRenewalView(existing), 'This year premium saved.');
});
