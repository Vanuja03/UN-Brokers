import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { readDebitNote } from '../services/debitNoteScan.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

export function receiveDebitNote(req: Request, res: Response, next: NextFunction) {
  upload.single('document')(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    const code = (error as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 'Use a PDF or photo under 4 MB.'));
      return;
    }
    next(new AppError(400, 'Use a PDF or a JPEG, PNG, or WebP photo.'));
  });
}

export async function scanDebitNote(req: Request, res: Response) {
  const file = req.file;
  if (!file) throw new AppError(400, 'Choose a debit note file or take a photo.');
  const book = req.body?.book === 'non-motor' ? 'non-motor' : req.body?.book === 'motor' ? 'motor' : '';
  if (!book) throw new AppError(400, 'Open the motor or non-motor register before scanning.');
  try {
    const fields = await readDebitNote(file.buffer, file.mimetype, book);
    sendData(res, { fields });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'The debit note could not be read. Try a clearer PDF or photo.');
  } finally {
    file.buffer.fill(0);
  }
}
