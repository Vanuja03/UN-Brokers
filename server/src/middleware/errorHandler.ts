import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'The requested resource was not found.' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Please check the highlighted information and try again.',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.') || 'form',
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  if (err instanceof SyntaxError && 'body' in (err as SyntaxError & { body?: unknown })) {
    return res.status(400).json({ success: false, message: 'The request could not be read.' });
  }

  const typed = err as { type?: string; status?: number; name?: string };
  if (typed?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'The submission is too large.' });
  }

  if (typed?.name === 'CastError') {
    return res.status(404).json({ success: false, message: 'The requested record was not found.' });
  }

  console.error(err instanceof Error ? err.message : 'Unexpected error');
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
}
