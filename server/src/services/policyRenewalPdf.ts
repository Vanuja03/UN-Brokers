import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

const navy = '#0b2545';
const gold = '#FFB900';
const mist = '#f4f7fb';
const ink = '#334155';

export type PolicyRenewalPdfRow = {
  policyNumber: string;
  vehicleNumber: string;
  fromDate: string;
  toDate: string;
  customerName: string;
  postalAddress: string;
  sumInsured: string;
  lastYearPremium: string;
  thisYearPremium: string;
  insuranceCompany: string;
  salesPerson: string;
  speciCo: string;
  status: string;
  renewalResult: '' | 'done' | 'cancel' | 'sold';
  contactNo: string;
  remarks: string;
};

export type PolicyRenewalPdfInput = {
  companyName: string;
  telephone: string;
  email: string;
  address: string;
  periodLabel: string;
  rows: PolicyRenewalPdfRow[];
};

const columns: { title: string; width: number; symbol?: boolean; value: (row: PolicyRenewalPdfRow) => string }[] = [
  { title: 'Policy no', width: 58, value: (row) => row.policyNumber },
  { title: 'Vehicle no', width: 54, value: (row) => row.vehicleNumber },
  { title: 'From', width: 44, value: (row) => row.fromDate },
  { title: 'To', width: 44, value: (row) => row.toDate },
  { title: 'Customer', width: 70, value: (row) => row.customerName },
  { title: 'Address', width: 60, value: (row) => row.postalAddress },
  { title: 'Sum insured', width: 50, value: (row) => row.sumInsured },
  { title: 'Last premium', width: 50, value: (row) => row.lastYearPremium },
  { title: 'This premium', width: 50, value: (row) => row.thisYearPremium },
  { title: 'Insurer', width: 72, value: (row) => row.insuranceCompany },
  { title: 'Sales person', width: 48, value: (row) => row.salesPerson },
  { title: 'Speci co', width: 40, value: (row) => row.speciCo },
  { title: 'Sat', width: 26, value: (row) => row.status },
  { title: 'Contact', width: 52, value: (row) => row.contactNo },
  { title: 'Result', width: 36, symbol: true, value: (row) => row.renewalResult },
  { title: 'Remarks', width: 46, value: (row) => row.remarks },
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

function cell(value: string) {
  const text = value.trim();
  return text || '—';
}

function drawResult(doc: PdfDoc, value: string, x: number, y: number, width: number, rowHeight: number) {
  const cx = x + width / 2;
  const cy = y + rowHeight / 2;
  doc.save();
  if (value === 'done') {
    doc.strokeColor('#15803d').lineWidth(1.4).lineCap('round').lineJoin('round');
    doc.moveTo(cx - 4.5, cy).lineTo(cx - 1.2, cy + 3.2).lineTo(cx + 5, cy - 4).stroke();
  } else if (value === 'cancel') {
    doc.strokeColor('#b91c1c').lineWidth(1.4).lineCap('round');
    doc.moveTo(cx - 4, cy - 4).lineTo(cx + 4, cy + 4).moveTo(cx + 4, cy - 4).lineTo(cx - 4, cy + 4).stroke();
  } else if (value === 'sold') {
    doc.fillColor('#b45309');
    doc.moveTo(cx - 6, cy - 3.2).lineTo(cx + 1.5, cy - 3.2).lineTo(cx + 6, cy).lineTo(cx + 1.5, cy + 3.2).lineTo(cx - 6, cy + 3.2).closePath().fill();
    doc.circle(cx - 3.2, cy, 0.7).fill('#ffffff');
  } else {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5).text('—', x, cy - 3, { width, align: 'center', lineBreak: false });
  }
  doc.restore();
}

export function renderPolicyRenewalPdf(input: PolicyRenewalPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 16 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const left = 16;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const headerHeight = 92;
    const artY = 10;
    const logoSize = 72;
    const photoWidth = 168;
    const photoHeight = 72;
    const logoX = 14;
    const photoX = pageWidth - photoWidth - 14;

    const paintBanner = () => {
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
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(11).text('POLICY RENEWAL LIST', titleX, 40, { width: titleWidth, align: 'center' });
      doc.fillColor('#ffffff').font('Helvetica').fontSize(9).text(`${input.periodLabel}   ·   ${input.rows.length} ${input.rows.length === 1 ? 'policy' : 'policies'}`, titleX, 58, {
        width: titleWidth,
        align: 'center',
      });
    };

    const paintColumns = (y: number) => {
      doc.rect(left, y, tableWidth, 18).fill(navy);
      let x = left;
      columns.forEach((column) => {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6).text(column.title, x + 2, y + 5, {
          width: column.width - 4,
          height: 10,
          ellipsis: true,
        });
        x += column.width;
      });
      return y + 18;
    };

    paintBanner();
    let y = paintColumns(headerHeight + 14);

    input.rows.forEach((row, rowIndex) => {
      doc.font('Helvetica').fontSize(6.5);
      const values = columns.map((column) => cell(column.value(row)));
      const textHeight = Math.max(
        ...values.map((value, index) => doc.heightOfString(value, { width: columns[index].width - 4 })),
      );
      const rowHeight = Math.min(30, Math.max(14, textHeight + 4));
      if (y + rowHeight > doc.page.height - 28) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 16 });
        paintBanner();
        y = paintColumns(headerHeight + 14);
      }
      if (rowIndex % 2 === 0) doc.rect(left, y, tableWidth, rowHeight).fill(mist);
      doc.rect(left, y, tableWidth, rowHeight).strokeColor('#d6e0ec').lineWidth(0.3).stroke();
      let x = left;
      values.forEach((value, index) => {
        if (columns[index].symbol) drawResult(doc, columns[index].value(row), x, y, columns[index].width, rowHeight);
        else {
          doc.fillColor(index === 0 ? navy : ink).font(index === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(6.5).text(value, x + 2, y + 2, {
            width: columns[index].width - 4,
            height: rowHeight - 3,
            ellipsis: true,
          });
        }
        x += columns[index].width;
      });
      y += rowHeight;
    });

    if (input.rows.length === 0) {
      doc.fillColor(ink).font('Helvetica').fontSize(9).text('No policies match this list.', left, y + 8);
    }

    const footer = [input.companyName, input.telephone, input.email, input.address].filter(Boolean).join('   ·   ');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(footer || 'UN Insurance Brokers', left, doc.page.height - 18, {
      width: tableWidth,
      height: 10,
      lineBreak: false,
    });
    doc.end();
  });
}
