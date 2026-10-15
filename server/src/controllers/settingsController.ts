import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.js';
import { AuditLog } from '../models/AuditLog.js';
import { ensureSettings, toPublicSettings } from '../services/settings.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { staffCreateSchema, staffUpdateSchema } from '../validators/content.js';

export const publicSettings = asyncHandler(async (_req, res) => {
  const settings = await ensureSettings();
  sendData(res, toPublicSettings(settings));
});

export const adminSettings = asyncHandler(async (_req, res) => {
  const settings = await ensureSettings();
  sendData(res, settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSettings();
  Object.assign(settings, req.body);
  await settings.save();
  await recordAudit(req, 'settings_update', 'settings', settings.id);
  sendData(res, settings, 'Settings saved.');
});

export const listStaff = asyncHandler(async (_req, res) => {
  const staff = await Admin.find().select('name email role active lastLoginAt createdAt').sort({ name: 1 });
  sendData(res, staff);
});

export const createStaff = asyncHandler(async (req, res) => {
  const parsed = staffCreateSchema.parse(req.body);
  const existing = await Admin.findOne({ email: parsed.email });
  if (existing) throw new AppError(409, 'An account with that email already exists.');
  const passwordHash = await bcrypt.hash(parsed.password, 12);
  const admin = await Admin.create({
    name: parsed.name,
    email: parsed.email,
    passwordHash,
    role: parsed.role,
    active: true,
  });
  await recordAudit(req, 'staff_create', 'admin', admin.id, { role: admin.role });
  sendData(res, { id: admin.id, name: admin.name, email: admin.email, role: admin.role, active: admin.active }, 'Staff account created.', 201);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const parsed = staffUpdateSchema.parse(req.body);
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw new AppError(404, 'Account not found.');
  const demoting = parsed.active === false || (parsed.role && parsed.role !== 'admin');
  if (admin.role === 'admin' && demoting) {
    const others = await Admin.countDocuments({ role: 'admin', active: true, _id: { $ne: admin._id } });
    if (others === 0) throw new AppError(400, 'Keep at least one active administrator.');
  }
  if (parsed.active !== undefined) admin.active = parsed.active;
  if (parsed.role) admin.role = parsed.role;
  if (parsed.active === false) admin.tokenVersion += 1;
  await admin.save();
  await recordAudit(req, 'staff_update', 'admin', admin.id, { active: admin.active, role: admin.role });
  sendData(res, { id: admin.id, name: admin.name, email: admin.email, role: admin.role, active: admin.active }, 'Account updated.');
});

export const listAudit = asyncHandler(async (_req, res) => {
  const logs = await AuditLog.find().sort('-createdAt').limit(100).select('action actorRole resourceType resourceId metadata createdAt');
  sendData(res, logs);
});
