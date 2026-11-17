import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

const navy = '#0b2545';
const gold = '#FFB900';
const ink = '#334155';

export type DebitAdvicePdfInput = {
  referenceNumber: string;
  adviceDate: string;
  confirmationType: 'renewal' | 'new-business';
  vehicleNumber: string;
  customerName: string;
  sumInsured: string;
  contactNo: string;
  notes: string;
  preparedBy: string;
  companyName: string;
  telephone: string;
  email: string;
  address: string;
};

function assetPath(...parts: string[]) {
  const relative = path.join(...parts);
  const candidates = [
    path.resolve(process.cwd(), 'client', 'public', relative),
    path.resolve(process.cwd(), '..', 'client', 'public', relative),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function paintWatermark(doc: PdfDoc) {
  const mark = assetPath('logo.png');
  if (!mark) return;
  const size = 150;
  doc.save();
  doc.opacity(0.08);
  doc.image(mark, (doc.page.width - size) / 2, (doc.page.height - size) / 2, { fit: [size, size] });
  doc.restore();
}

function displayDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function moneyText(value: string) {
  const text = value.trim();
  if (!text) return '—';
  return /rs\.?|lkr/i.test(text) ? text : `Rs. ${text}`;
}

export function renderDebitAdvicePdf(input: DebitAdvicePdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const pageWidth = 595.28;
    const pageHeight = 420.95;
    const doc = new PDFDocument({ size: [pageWidth, pageHeight], margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 48;
    const width = pageWidth - 96;
    const headerHeight = 78;
    const logoSize = 50;
    const photoWidth = 96;
    const photoHeight = 50;
    const subheading = input.confirmationType === 'renewal' ? 'RENEWAL CONFIRMATION' : 'NEW BUSINESS CONFIRMATION';

    paintWatermark(doc);
    doc.rect(0, 0, pageWidth, headerHeight).fill(navy);
    doc.rect(0, headerHeight, pageWidth, 4).fill(gold);
    doc.roundedRect(14, 14, logoSize, logoSize, 8).fill('#ffffff');
    const logo = assetPath('logo.png');
    if (logo) doc.image(logo, 18, 18, { fit: [logoSize - 8, logoSize - 8], align: 'center', valign: 'center' });
    const photoX = pageWidth - photoWidth - 14;
    const photo = assetPath('covers', 'header-bmw.jpg');
    doc.save();
    doc.roundedRect(photoX, 14, photoWidth, photoHeight, 8).clip();
    if (photo) doc.image(photo, photoX, 14, { cover: [photoWidth, photoHeight], align: 'center', valign: 'center' });
    else doc.rect(photoX, 14, photoWidth, photoHeight).fill('#ffffff');
    doc.restore();

    const titleX = 14 + logoSize + 10;
    const titleWidth = photoX - 10 - titleX;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(input.companyName || 'UN Insurance Brokers', titleX, 12, {
      width: titleWidth,
      align: 'center',
      height: 14,
      lineBreak: false,
    });
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(11).text('DEBIT ADVICE', titleX, 28, { width: titleWidth, align: 'center', height: 14, lineBreak: false });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(subheading, titleX, 44, { width: titleWidth, align: 'center', height: 12, lineBreak: false });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(`${displayDate(input.adviceDate)}   ·   ${input.referenceNumber}`, titleX, 58, {
      width: titleWidth,
      align: 'center',
      height: 12,
      lineBreak: false,
    });

    let y = headerHeight + 16;
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(
      'This debit advice confirms the business below. It is not a policy.',
      left,
      y,
      { width, align: 'left' },
    );
    y = doc.y + 12;

    const labelWidth = 130;
    const facts: [string, string][] = [
      ['Vehicle no', input.vehicleNumber],
      ['Customer name', input.customerName],
      ['Sum insured', moneyText(input.sumInsured)],
      ['Contact no', input.contactNo],
    ];
    for (const [label, value] of facts) {
      doc.fillColor('#64748b').font('Helvetica').fontSize(11).text(label, left, y, { width: labelWidth, height: 16, lineBreak: false });
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text(value, left + labelWidth, y - 1, { width: width - labelWidth, height: 16, lineBreak: false, ellipsis: true });
      y += 22;
    }

    const notes = input.notes.trim();
    if (notes) {
      y += 10;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Notes', left, y, { width, align: 'left' });
      y = doc.y + 6;
      doc.fillColor(ink).font('Helvetica').fontSize(11).text(notes, left, y, { width, align: 'left' });
      y = doc.y + 16;
    }

    if (input.preparedBy) {
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(`Prepared by  ${input.preparedBy}`, left, y, { width, align: 'left' });
    }

    const footer = [input.companyName, input.telephone, input.email, input.address].filter(Boolean).join('   ·   ');
    doc.page.margins.bottom = 0;
    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(footer || 'UN Insurance Brokers', left, pageHeight - 22, {
      width,
      height: 16,
      align: 'center',
      lineBreak: false,
    });
    doc.end();
  });
}
