import { randomUUID } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendData } from '../utils/apiResponse.js';
import { loginSchema } from '../validators/auth.js';
import { cookieBase, setCsrfCookie } from '../middleware/csrf.js';
import { recordAudit } from '../services/audit.js';

function expiryToMs(value: string, fallback: number) {
  const match = /^(\d+)([mhd])$/.exec(value);
  if (!match) return fallback;
  const amount = Number(match[1]);
  if (match[2] === 'm') return amount * 60 * 1000;
  if (match[2] === 'h') return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const base: CookieOptions = { ...cookieBase(), httpOnly: true };
  res.cookie('ub_access', accessToken, { ...base, maxAge: expiryToMs(env.jwtAccessExpires, 15 * 60 * 1000) });
  res.cookie('ub_refresh', refreshToken, {
    ...base,
    maxAge: expiryToMs(env.jwtRefreshExpires, 7 * 24 * 60 * 60 * 1000),
    path: '/api/auth',
  });
}

function clearAuthCookies(res: Response) {
  const base = cookieBase();
  res.clearCookie('ub_access', { ...base, httpOnly: true });
  res.clearCookie('ub_refresh', { ...base, httpOnly: true, path: '/api/auth' });
}

let dummyHash: string | null = null;

async function getDummyHash() {
  if (!dummyHash) dummyHash = await bcrypt.hash('not-a-real-password', 12);
  return dummyHash;
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await Admin.findOne({ email }).select('+passwordHash +refreshTokenId');
  const hash = admin?.passwordHash || (await getDummyHash());
  const matches = await bcrypt.compare(password, hash);
  if (!admin || !admin.active || !matches) {
    await recordAudit(req, 'login_failed');
    throw new AppError(401, 'Invalid email or password.');
  }

  const jti = randomUUID();
  admin.refreshTokenId = jti;
  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = jwt.sign({ sub: admin.id, role: admin.role, tv: admin.tokenVersion, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ sub: admin.id, tv: admin.tokenVersion, jti, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires as jwt.SignOptions['expiresIn'],
  });
  setAuthCookies(res, accessToken, refreshToken);
  setCsrfCookie(res);
  await recordAudit(req, 'login_success', 'admin', admin.id);
  sendData(res, { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, 'Signed in.');
});

export const logout = asyncHandler(async (req, res) => {
  if (req.admin) {
    await Admin.findByIdAndUpdate(req.admin.id, { $inc: { tokenVersion: 1 }, refreshTokenId: '' });
    await recordAudit(req, 'logout', 'admin', req.admin.id);
  }
  clearAuthCookies(res);
  sendData(res, null, 'Signed out.');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.ub_refresh as string | undefined;
  if (!token) throw new AppError(401, 'Sign in to continue.');
  let payload: { sub?: string; tv?: number; jti?: string; type?: string };
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret) as typeof payload;
  } catch {
    throw new AppError(401, 'Sign in to continue.');
  }
  if (payload.type !== 'refresh' || !payload.sub || !payload.jti) throw new AppError(401, 'Sign in to continue.');
  const admin = await Admin.findById(payload.sub).select('+refreshTokenId');
  if (!admin || !admin.active || admin.tokenVersion !== payload.tv) throw new AppError(401, 'Sign in to continue.');
  if (admin.refreshTokenId !== payload.jti) {
    admin.tokenVersion += 1;
    admin.refreshTokenId = '';
    await admin.save();
    clearAuthCookies(res);
    throw new AppError(401, 'Sign in to continue.');
  }
  const jti = randomUUID();
  admin.refreshTokenId = jti;
  await admin.save();
  const accessToken = jwt.sign({ sub: admin.id, role: admin.role, tv: admin.tokenVersion, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ sub: admin.id, tv: admin.tokenVersion, jti, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires as jwt.SignOptions['expiresIn'],
  });
  setAuthCookies(res, accessToken, refreshToken);
  if (!req.cookies?.ub_csrf) setCsrfCookie(res);
  sendData(res, { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, 'Session refreshed.');
});

export const me = asyncHandler(async (req, res) => {
  if (!req.cookies?.ub_csrf) setCsrfCookie(res);
  sendData(res, req.admin);
});
