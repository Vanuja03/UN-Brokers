import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

const navy = '#0b2545';
const gold = '#FFB900';
const mist = '#f4f7fb';
const ink = '#334155';

type Row = { label: string; values: string[] };

export type QuotationPdfInput = {
  referenceNumber: string;
  insuranceType: 'motor' | 'motor-third-party';
  quotationDate: string;
  customerName: string;
  vehicleNumber: string;
  leaseOrLoanNo: string;
  usage: string;
  yearOfManufacture: string;
  sumInsured: string;
  make: string;
  model: string;
  fuel: string;
  preparedBy: string;
  preparedByPhone: string;
  preparedByEmail: string;
  insurers: string[];
  rows: Row[];
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
  const size = 320;
  doc.save();
  doc.opacity(0.08);
  doc.image(mark, (doc.page.width - size) / 2, (doc.page.height - size) / 2, { fit: [size, size] });
  doc.restore();
}

function headerArt(doc: PdfDoc, file: string | undefined, x: number, y: number, size: number) {
  doc.roundedRect(x, y, size, size, 10).fill('#ffffff');
  if (!file) return;
  doc.image(file, x + 4, y + 4, { fit: [size - 8, size - 8], align: 'center', valign: 'center' });
}

function headerPhoto(doc: PdfDoc, file: string | undefined, x: number, y: number, photoWidth: number, photoHeight: number) {
  doc.save();
  doc.roundedRect(x, y, photoWidth, photoHeight, 8).clip();
  if (file) doc.image(file, x, y, { cover: [photoWidth, photoHeight], align: 'center', valign: 'center' });
  else doc.rect(x, y, photoWidth, photoHeight).fill('#ffffff');
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

function cell(value: string) {
  const text = value.trim();
  return text || '—';
}

export function renderMotorQuotationPdf(input: QuotationPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const left = 28;
    const width = pageWidth - 56;
    const cover = input.insuranceType === 'motor' ? 'Motor insurance' : 'Third-party motor insurance';
    const headerHeight = 92;
    const artY = 10;
    const logoSize = 72;
    const photoWidth = 168;
    const photoHeight = 72;
    const logoX = 14;
    const photoX = pageWidth - photoWidth - 14;

    paintWatermark(doc);
    doc.rect(0, 0, pageWidth, headerHeight).fill(navy);
    doc.rect(0, headerHeight, pageWidth, 4).fill(gold);
    headerArt(doc, assetPath('logo.png'), logoX, artY, logoSize);
    headerPhoto(doc, assetPath('covers', 'header-bmw.jpg'), photoX, artY, photoWidth, photoHeight);

    const titleX = logoX + logoSize + 12;
    const titleWidth = photoX - 12 - titleX;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(input.companyName || 'UN Insurance Brokers', titleX, 18, {
      width: titleWidth,
      align: 'center',
    });
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(11).text('QUOTATION', titleX, 40, { width: titleWidth, align: 'center' });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(9).text(`${cover}   ·   ${displayDate(input.quotationDate)}   ·   ${input.referenceNumber}`, titleX, 58, {
      width: titleWidth,
      align: 'center',
    });

    let y = headerHeight + 18;
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text(input.customerName, left, y);
    y += 18;
    const facts = [
      ['Vehicle', input.vehicleNumber],
      ['Lease or loan no.', input.leaseOrLoanNo],
      ['Usage', input.usage],
      ['Year', input.yearOfManufacture],
      ['Sum insured', input.sumInsured],
      ['Make', input.make],
      ['Model', input.model],
      ['Fuel', input.fuel],
    ];
    doc.font('Helvetica').fontSize(8);
    facts.forEach((fact, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = left + column * (width / 4);
      doc.fillColor('#64748b').text(fact[0], x, y + row * 16, { width: 70, continued: false });
      doc.fillColor(navy).font('Helvetica-Bold').text(cell(fact[1]), x + 72, y + row * 16, { width: width / 4 - 80 });
      doc.font('Helvetica');
    });
    y += 40;

    const intro = input.insuranceType === 'motor'
      ? 'Thank you for asking UN Insurance Brokers to compare comprehensive motor cover for this vehicle. The figures below are the quotations we have obtained. This document is not a policy. Cover begins only if you accept an insurer’s terms and that insurer issues the policy.'
      : 'Thank you for asking UN Insurance Brokers to compare third-party motor cover for this vehicle. The figures below are the quotations we have obtained. This document is not a policy. Cover begins only if you accept an insurer’s terms and that insurer issues the policy.';
    doc.fillColor(ink).font('Helvetica').fontSize(8).text(intro, left, y, { width });
    y = doc.y + 8;
    const contact = [input.preparedBy, input.preparedByPhone, input.preparedByEmail].filter(Boolean).join('  |  ');
    if (contact) {
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text(`Prepared by  ${contact}`, left, y, { width });
      y = doc.y + 10;
    }

    const labelWidth = 150;
    const columnWidth = (width - labelWidth) / input.insurers.length;
    const drawHeader = () => {
      const headerHeight = 28;
      doc.rect(left, y, width, headerHeight).fill(navy);
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(7).text('Benefit', left + 4, y + 10, { width: labelWidth - 8 });
      input.insurers.forEach((insurer, index) => {
        doc.fillColor('#ffffff').text(insurer, left + labelWidth + index * columnWidth + 3, y + 6, {
          width: columnWidth - 6,
          height: 18,
          ellipsis: true,
        });
      });
      y += headerHeight;
    };
    drawHeader();

    input.rows.forEach((row, rowIndex) => {
      doc.font('Helvetica').fontSize(7);
      const samples = [row.label, ...row.values];
      const textHeight = Math.max(
        ...samples.map((sample, index) => doc.heightOfString(cell(sample), { width: (index === 0 ? labelWidth : columnWidth) - 8 })),
      );
      const rowHeight = Math.min(42, Math.max(18, textHeight + 8));
      if (y + rowHeight > doc.page.height - 46) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 28 });
        paintWatermark(doc);
        y = 36;
        drawHeader();
      }
      if (rowIndex % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
      doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
      doc.fillColor(navy).font('Helvetica-Bold').text(row.label, left + 4, y + 4, { width: labelWidth - 8, height: rowHeight - 6, ellipsis: true });
      row.values.forEach((value, index) => {
        doc.fillColor(ink).font('Helvetica').text(cell(value), left + labelWidth + index * columnWidth + 3, y + 4, {
          width: columnWidth - 6,
          height: rowHeight - 6,
          ellipsis: true,
        });
      });
      y += rowHeight;
    });

    const footer = [input.companyName, input.telephone, input.email, input.address].filter(Boolean).join('   ·   ');
    doc.page.margins.bottom = 0;
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(footer || 'UN Insurance Brokers', left, doc.page.height - 22, {
      width,
      height: 12,
      lineBreak: false,
    });
    doc.end();
  });
}
