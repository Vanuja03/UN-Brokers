import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Admin } from '../models/Admin.js';
import { AppError } from '../utils/AppError.js';
import type { AdminRole } from '../config/constants.js';

type AccessPayload = {
  sub: string;
  role: AdminRole;
  tv: number;
  type: 'access';
};

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.ub_access as string | undefined;
    if (!token) throw new AppError(401, 'Sign in to continue.');
    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
    if (payload.type !== 'access' || !payload.sub) throw new AppError(401, 'Sign in to continue.');
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.active || admin.tokenVersion !== payload.tv) {
      throw new AppError(401, 'Your session is no longer valid. Sign in again.');
    }
    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role as AdminRole,
      tokenVersion: admin.tokenVersion ?? 0,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, 'Sign in to continue.'));
  }
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return next(new AppError(403, 'You do not have permission to do that.'));
    }
    next();
  };
}
