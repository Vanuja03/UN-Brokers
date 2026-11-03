import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

const navy = '#0b2545';
const gold = '#FFB900';
const mist = '#f4f7fb';
const ink = '#334155';

type ValuedCover = { selected: boolean; value: string };

export type QuotationSlipPdfInput = {
  referenceNumber: string;
  slipDate: string;
  customerName: string;
  vehicleNumber: string;
  make: string;
  model: string;
  yearOfManufacture: string;
  vehicleType: string;
  vehicleUsage: string;
  covers: {
    basic: boolean;
    srcc: boolean;
    tc: boolean;
    flood: boolean;
    towing: ValuedCover;
    wci: ValuedCover;
    pab: ValuedCover;
    ll: ValuedCover;
    tpd: ValuedCover;
    hp: ValuedCover;
  };
  preparedBy: string;
  companyName: string;
  telephone: string;
  email: string;
  address: string;
};

const coverRows: { label: string; selected: (input: QuotationSlipPdfInput) => boolean; value: (input: QuotationSlipPdfInput) => string }[] = [
  { label: 'Basic', selected: (input) => input.covers.basic, value: () => '' },
  { label: 'SRCC', selected: (input) => input.covers.srcc, value: () => '' },
  { label: 'TC', selected: (input) => input.covers.tc, value: () => '' },
  { label: 'Flood', selected: (input) => input.covers.flood, value: () => '' },
  { label: 'Towing charges', selected: (input) => input.covers.towing.selected, value: (input) => input.covers.towing.value },
  { label: 'WCI', selected: (input) => input.covers.wci.selected, value: (input) => input.covers.wci.value },
  { label: 'PAB', selected: (input) => input.covers.pab.selected, value: (input) => input.covers.pab.value },
  { label: 'LL', selected: (input) => input.covers.ll.selected, value: (input) => input.covers.ll.value },
  { label: 'TPD', selected: (input) => input.covers.tpd.selected, value: (input) => input.covers.tpd.value },
  { label: 'H/P', selected: (input) => input.covers.hp.selected, value: (input) => input.covers.hp.value },
];

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
  const size = 280;
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

function tick(doc: PdfDoc, x: number, y: number, selected: boolean) {
  doc.roundedRect(x, y, 12, 12, 2).lineWidth(1).strokeColor(navy).stroke();
  if (!selected) return;
  doc.save();
  doc.moveTo(x + 2.5, y + 6).lineTo(x + 5, y + 9).lineTo(x + 9.5, y + 3).lineWidth(1.6).strokeColor(navy).stroke();
  doc.restore();
}

export function renderMotorQuotationSlipPdf(input: QuotationSlipPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const left = 36;
    const width = pageWidth - 72;
    const headerHeight = 96;
    const logoSize = 68;
    const photoWidth = 132;
    const photoHeight = 68;

    paintWatermark(doc);
    doc.rect(0, 0, pageWidth, headerHeight).fill(navy);
    doc.rect(0, headerHeight, pageWidth, 4).fill(gold);
    doc.roundedRect(16, 14, logoSize, logoSize, 10).fill('#ffffff');
    const logo = assetPath('logo.png');
    if (logo) doc.image(logo, 20, 18, { fit: [logoSize - 8, logoSize - 8], align: 'center', valign: 'center' });
    const photoX = pageWidth - photoWidth - 16;
    const photo = assetPath('covers', 'header-bmw.jpg');
    doc.save();
    doc.roundedRect(photoX, 14, photoWidth, photoHeight, 8).clip();
    if (photo) doc.image(photo, photoX, 14, { cover: [photoWidth, photoHeight], align: 'center', valign: 'center' });
    else doc.rect(photoX, 14, photoWidth, photoHeight).fill('#ffffff');
    doc.restore();

    const titleX = 16 + logoSize + 12;
    const titleWidth = photoX - 12 - titleX;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text(input.companyName || 'UN Insurance Brokers', titleX, 22, {
      width: titleWidth,
      align: 'center',
    });
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(12).text('QUOTATION SLIP', titleX, 44, { width: titleWidth, align: 'center' });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(9).text(`${displayDate(input.slipDate)}   ·   ${input.referenceNumber}`, titleX, 64, {
      width: titleWidth,
      align: 'center',
    });

    let y = headerHeight + 22;
    doc.fillColor(ink).font('Helvetica').fontSize(10).text(
      'UN Insurance Brokers requests a quotation from the insurance company for this vehicle and the ticked covers. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.',
      left,
      y,
      { width },
    );
    y = doc.y + 14;

    const facts: [string, string][] = [
      ['Customer name', input.customerName],
      ['Vehicle no', input.vehicleNumber],
      ['Make', input.make],
      ['Model', input.model],
      ['Manufacturing year', input.yearOfManufacture],
      ['Vehicle type', input.vehicleType],
      ['Vehicle usage', input.vehicleUsage],
    ];
    const labelWidth = 150;
    facts.forEach((fact, index) => {
      const rowHeight = 24;
      if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
      doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
      doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(fact[0], left + 8, y + 7, { width: labelWidth - 12 });
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(fact[1], left + labelWidth, y + 6, { width: width - labelWidth - 10, ellipsis: true });
      y += rowHeight;
    });

    y += 16;
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Covers', left, y);
    y += 18;
    doc.rect(left, y, width, 22).fill(navy);
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(9).text('Cover', left + 28, y + 6, { width: 180 });
    doc.fillColor('#ffffff').text('Requested', left + 220, y + 6, { width: width - 230 });
    y += 22;

    coverRows.forEach((row, index) => {
      const selected = row.selected(input);
      const rowHeight = 24;
      if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
      doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
      tick(doc, left + 8, y + 6, selected);
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(row.label, left + 28, y + 6, { width: 180 });
      doc.fillColor(selected ? ink : '#94a3b8').font('Helvetica').fontSize(10).text(selected ? row.value(input) || 'Yes' : '—', left + 220, y + 6, {
        width: width - 230,
        ellipsis: true,
      });
      y += rowHeight;
    });

    if (input.preparedBy) {
      y += 14;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text(`Prepared by  ${input.preparedBy}`, left, y, { width });
    }

    const footer = [input.companyName, input.telephone, input.email, input.address].filter(Boolean).join('   ·   ');
    doc.page.margins.bottom = 0;
    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(footer || 'UN Insurance Brokers', left, doc.page.height - 28, {
      width,
      height: 12,
      lineBreak: false,
    });
    doc.end();
  });
}
