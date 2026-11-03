import type { Request } from 'express';
import { PolicyRegister } from '../models/PolicyRegister.js';
import { recordAudit } from '../services/audit.js';
import { renderPolicyRenewalPdf } from '../services/policyRenewalPdf.js';
import { ensureSettings } from '../services/settings.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/sanitize.js';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type RegisterRow = {
  _id: unknown;
  policyNumber: string;
  vehicleNumber: string;
  riskDate: Date;
  renewalDate: Date;
  customerName: string;
  postalAddress: string;
  sumInsured: number;
  premiumNet: number;
  thisYearPremium?: number | null;
  insuranceCompany: string;
  salesPerson?: string;
  agentCode?: string;
  special: 'ren' | 'new';
  renewalResult?: '' | 'done' | 'cancel' | 'sold';
  commissionReceived?: boolean;
  telephone?: string;
  remarks?: string;
};

function requireId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) throw new AppError(404, 'Policy not found.');
  return id;
}

function monthNumber(month: string) {
  if (!/^\d{1,2}$/.test(month)) return null;
  const value = Number(month);
  return value >= 1 && value <= 12 ? value : null;
}

function toRenewalView(row: RegisterRow) {
  return {
    _id: row._id,
    policyNumber: row.policyNumber,
    vehicleNumber: row.vehicleNumber,
    fromDate: row.riskDate,
    toDate: row.renewalDate,
    customerName: row.customerName,
    postalAddress: row.postalAddress,
    sumInsured: row.sumInsured,
    lastYearPremium: row.premiumNet,
    thisYearPremium: row.thisYearPremium ?? null,
    insuranceCompany: row.insuranceCompany,
    salesPerson: row.salesPerson || '',
    speciCo: row.agentCode || '',
    status: row.special,
    renewalResult: row.renewalResult || '',
    commissionReceived: row.commissionReceived === true,
    contactNo: row.telephone || '',
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
    filter.$or = [
      { policyNumber: { $regex: term, $options: 'i' } },
      { vehicleNumber: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } },
      { telephone: { $regex: term, $options: 'i' } },
    ];
  }
  return { monthOfYear, search, category, commission, filter };
}

function findPolicyRenewals(query: Request['query']) {
  const parsed = listQuery(query);
  const rows = PolicyRegister.find(parsed.filter).sort({ renewalDate: 1, customerName: 1 }).limit(500);
  return { ...parsed, rows };
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

export const listPolicyRenewals = asyncHandler(async (req, res) => {
  const { rows } = findPolicyRenewals(req.query);
  const policies = await rows;
  sendData(res, policies.map((row) => toRenewalView(row)));
});

export const downloadPolicyRenewals = asyncHandler(async (req, res) => {
  const { monthOfYear, search, rows } = findPolicyRenewals(req.query);
  const policies = await rows;
  const settings = await ensureSettings();
  const period = monthOfYear ? monthNames[monthOfYear - 1] : 'All months';
  const pdf = await renderPolicyRenewalPdf({
    companyName: settings.companyName,
    telephone: settings.telephone || '',
    email: settings.email || '',
    address: settings.address || '',
    periodLabel: search ? `${period}  ·  Search: ${search.slice(0, 40)}` : period,
    rows: policies.map((row) => {
      const view = toRenewalView(row);
      return {
        policyNumber: view.policyNumber,
        vehicleNumber: view.vehicleNumber,
        fromDate: pdfDate(view.fromDate),
        toDate: pdfDate(view.toDate),
        customerName: view.customerName,
        postalAddress: view.postalAddress,
        sumInsured: pdfMoney(view.sumInsured),
        lastYearPremium: pdfMoney(view.lastYearPremium),
        thisYearPremium: pdfMoney(view.thisYearPremium),
        insuranceCompany: view.insuranceCompany,
        salesPerson: view.salesPerson,
        speciCo: view.speciCo,
        status: view.status === 'new' ? 'New' : 'Ren',
        renewalResult: view.renewalResult === 'done' || view.renewalResult === 'cancel' || view.renewalResult === 'sold' ? view.renewalResult : '',
        contactNo: view.contactNo,
        remarks: view.remarks,
      };
    }),
  });
  const filename = monthOfYear ? `policy-renewals-${period.toLowerCase()}.pdf` : 'policy-renewals.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

export const getPolicyRenewal = asyncHandler(async (req, res) => {
  const row = await PolicyRegister.findById(requireId(req.params.id));
  if (!row) throw new AppError(404, 'Policy not found.');
  sendData(res, toRenewalView(row));
});

export const createPolicyRenewal = asyncHandler(async () => {
  throw new AppError(400, 'Register the policy first. Renewals use the policy register.');
});

export const updatePolicyRenewal = asyncHandler(async (req, res) => {
  const existing = await PolicyRegister.findById(requireId(req.params.id));
  if (!existing) throw new AppError(404, 'Policy not found.');
  existing.thisYearPremium = req.body.thisYearPremium;
  existing.renewalResult = req.body.renewalResult;
  existing.commissionReceived = req.body.commissionReceived;
  existing.remarks = req.body.remarks ?? '';
  await existing.save();
  await recordAudit(req, 'policy_renewal_update', 'policy-register', existing.id);
  sendData(res, toRenewalView(existing), 'This year premium saved.');
});

export const deletePolicyRenewal = asyncHandler(async () => {
  throw new AppError(400, 'Registered policies stay in the register. Remove one from the policy register tab.');
});
