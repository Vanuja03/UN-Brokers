import { PolicyRegister } from '../models/PolicyRegister.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/sanitize.js';

function requireId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) throw new AppError(404, 'Registered policy not found.');
  return id;
}

export const listPolicyRegisters = asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const filter: Record<string, unknown> = {};
  if (search) {
    const term = escapeRegex(search);
    filter.$or = ['policyNumber', 'vehicleNumber', 'customerName', 'telephone', 'debitNoteNo'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }
  const rows = await PolicyRegister.find(filter).sort({ renewalDate: -1, customerName: 1 }).limit(500);
  sendData(res, rows);
});

export const createPolicyRegister = asyncHandler(async (req, res) => {
  const row = await PolicyRegister.create(req.body);
  await recordAudit(req, 'policy_register_create', 'policy-register', row.id);
  sendData(res, row, 'Policy registered.', 201);
});

export const updatePolicyRegister = asyncHandler(async (req, res) => {
  const row = await PolicyRegister.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!row) throw new AppError(404, 'Registered policy not found.');
  await recordAudit(req, 'policy_register_update', 'policy-register', row.id);
  sendData(res, row, 'Registered policy updated.');
});

export const deletePolicyRegister = asyncHandler(async (req, res) => {
  const row = await PolicyRegister.findByIdAndDelete(requireId(req.params.id));
  if (!row) throw new AppError(404, 'Registered policy not found.');
  await recordAudit(req, 'policy_register_delete', 'policy-register', row.id);
  sendData(res, { id: row.id }, 'Registered policy deleted.');
});
