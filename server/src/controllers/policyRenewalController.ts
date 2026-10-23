import type { Request } from 'express';
import { PolicyRenewal } from '../models/PolicyRenewal.js';
import { recordAudit } from '../services/audit.js';
import { renderPolicyRenewalPdf } from '../services/policyRenewalPdf.js';
import { ensureSettings } from '../services/settings.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/sanitize.js';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function requireId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) throw new AppError(404, 'Policy not found.');
  return id;
}

function monthNumber(month: string) {
  if (!/^\d{1,2}$/.test(month)) return null;
  const value = Number(month);
  return value >= 1 && value <= 12 ? value : null;
}

function listQuery(query: Request['query']) {
  const month = typeof query.month === 'string' ? query.month : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const monthOfYear = month ? monthNumber(month) : null;
  const filter: Record<string, unknown> = {};
  if (monthOfYear) filter.$expr = { $eq: [{ $month: '$toDate' }, monthOfYear] };
  if (search) {
    const term = escapeRegex(search);
    filter.$or = [
      { policyNumber: { $regex: term, $options: 'i' } },
      { vehicleNumber: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } },
      { contactNo: { $regex: term, $options: 'i' } },
    ];
  }
  return { monthOfYear, search, filter };
}

function findPolicyRenewals(query: Request['query']) {
  const parsed = listQuery(query);
  const rows = PolicyRenewal.find(parsed.filter).sort({ toDate: 1, customerName: 1 }).limit(500);
  return { ...parsed, rows };
}

function pdfDate(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function pdfMoney(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(value || 0);
}

export const listPolicyRenewals = asyncHandler(async (req, res) => {
  const { rows } = findPolicyRenewals(req.query);
  sendData(res, await rows);
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
    rows: policies.map((row) => ({
      policyNumber: row.policyNumber,
      vehicleNumber: row.vehicleNumber,
      fromDate: pdfDate(row.fromDate),
      toDate: pdfDate(row.toDate),
      customerName: row.customerName,
      postalAddress: row.postalAddress,
      sumInsured: pdfMoney(row.sumInsured),
      lastYearPremium: pdfMoney(row.lastYearPremium),
      thisYearPremium: pdfMoney(row.thisYearPremium),
      insuranceCompany: row.insuranceCompany,
      salesPerson: row.salesPerson || '',
      speciCo: row.speciCo || '',
      status: row.status === 'new' ? 'New' : 'Ren',
      renewalResult: row.renewalResult === 'done' || row.renewalResult === 'cancel' || row.renewalResult === 'sold' ? row.renewalResult : '',
      contactNo: row.contactNo,
      remarks: row.remarks || '',
    })),
  });
  const filename = monthOfYear ? `policy-renewals-${period.toLowerCase()}.pdf` : 'policy-renewals.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(pdf);
});

export const getPolicyRenewal = asyncHandler(async (req, res) => {
  const row = await PolicyRenewal.findById(requireId(req.params.id));
  if (!row) throw new AppError(404, 'Policy not found.');
  sendData(res, row);
});

export const createPolicyRenewal = asyncHandler(async (req, res) => {
  const row = await PolicyRenewal.create(req.body);
  await recordAudit(req, 'policy_renewal_create', 'policy-renewal', row.id);
  sendData(res, row, 'Policy saved.', 201);
});

export const updatePolicyRenewal = asyncHandler(async (req, res) => {
  const existing = await PolicyRenewal.findById(requireId(req.params.id));
  if (!existing) throw new AppError(404, 'Policy not found.');
  const row = await PolicyRenewal.findByIdAndUpdate(existing.id, {
    ...req.body,
    policyNumber: existing.policyNumber,
    vehicleNumber: existing.vehicleNumber,
    customerName: existing.customerName,
  }, { new: true, runValidators: true });
  if (!row) throw new AppError(404, 'Policy not found.');
  await recordAudit(req, 'policy_renewal_update', 'policy-renewal', row.id);
  sendData(res, row, 'Policy updated.');
});

export const deletePolicyRenewal = asyncHandler(async (req, res) => {
  const row = await PolicyRenewal.findByIdAndDelete(requireId(req.params.id));
  if (!row) throw new AppError(404, 'Policy not found.');
  await recordAudit(req, 'policy_renewal_delete', 'policy-renewal', row.id);
  sendData(res, { id: row.id }, 'Policy deleted.');
});
