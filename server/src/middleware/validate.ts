import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Please check the highlighted information and try again.',
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'form',
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}
