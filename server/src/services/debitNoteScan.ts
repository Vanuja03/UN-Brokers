import { AppError } from '../utils/AppError.js';
import { parseDebitNote, type PolicyBook } from './debitNoteParse.js';

type OcrWorker = {
  recognize: (image: Buffer) => Promise<{ data: { text: string } }>;
};

let workerPromise: Promise<OcrWorker> | null = null;

function linesFromItems(items: Array<{ str?: string; transform?: number[] }>) {
  const rows: { y: number; parts: string[] }[] = [];
  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;
    const y = item.transform?.[5] ?? 0;
    const row = rows.find((candidate) => Math.abs(candidate.y - y) < 3);
    if (row) row.parts.push(text);
    else rows.push({ y, parts: [text] });
  }
  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => row.parts.join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

async function pdfText(buffer: Buffer) {
  try {
    const { getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(linesFromItems(content.items as Array<{ str?: string; transform?: number[] }>));
    }
    await pdf.destroy();
    return pages.join('\n');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, 'This PDF could not be read. Photograph the debit note instead.');
  }
}

async function imageText(buffer: Buffer) {
  const loaded = (await import('tesseract.js')) as {
    createWorker?: (langs: string) => Promise<OcrWorker>;
    default?: { createWorker: (langs: string) => Promise<OcrWorker> };
  };
  const createWorker = loaded.createWorker ?? loaded.default?.createWorker;
  if (!createWorker) throw new AppError(400, 'The photo could not be read.');
  if (!workerPromise) {
    workerPromise = createWorker('eng').catch((error: unknown) => {
      workerPromise = null;
      throw error;
    });
  }
  try {
    const worker = await workerPromise;
    const result = await worker.recognize(buffer);
    return result.data.text ?? '';
  } catch (error) {
    workerPromise = null;
    throw error;
  }
}

function documentType(buffer: Buffer, mime: string) {
  const type = mime.toLowerCase();
  if (type === 'application/pdf' || buffer.subarray(0, 5).toString('utf8') === '%PDF-') return 'pdf';
  if (type === 'image/png' || buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image';
  if (type === 'image/jpeg' || type === 'image/jpg' || (buffer[0] === 0xff && buffer[1] === 0xd8)) return 'image';
  if (type === 'image/webp' || (buffer.subarray(0, 4).toString('utf8') === 'RIFF' && buffer.subarray(8, 12).toString('utf8') === 'WEBP')) return 'image';
  return '';
}

export async function readDebitNote(buffer: Buffer, mime: string, book: PolicyBook) {
  const kind = documentType(buffer, mime);
  let text = '';
  if (kind === 'pdf') {
    text = await pdfText(buffer);
    if (text.trim().length < 20) throw new AppError(400, 'This PDF has no selectable text. Photograph the debit note instead.');
  } else if (kind === 'image') {
    text = await imageText(buffer);
    if (text.trim().length < 15) throw new AppError(400, 'The photo could not be read. Use a clearer picture of the whole debit note.');
  } else {
    throw new AppError(400, 'Use a PDF or a JPEG, PNG, or WebP photo.');
  }
  return parseDebitNote(text, book);
}
