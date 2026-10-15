import type { Response } from 'express';

export function sendData<T>(res: Response, data: T, message = 'OK', status = 200, meta?: Record<string, unknown>) {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}
