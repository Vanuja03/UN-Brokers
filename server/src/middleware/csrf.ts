import { randomBytes } from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function cookieBase(): CookieOptions {
  return {
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

export function setCsrfCookie(res: Response) {
  const token = randomBytes(32).toString('hex');
  res.cookie('ub_csrf', token, {
    ...cookieBase(),
    httpOnly: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  const cookie = req.cookies?.ub_csrf as string | undefined;
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie !== header) {
    return next(new AppError(403, 'The form session expired. Refresh the page and try again.'));
  }
  next();
}
