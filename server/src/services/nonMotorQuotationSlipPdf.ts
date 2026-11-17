import { existsSync } from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { accidentCoverOptions, erectionCoverOptions, fireCoverOptions, goodsCoverOptions, marineCoverOptions, medicalCoverOptions, transitCoverOptions, workmenCoverOptions } from '../validators/nonMotorQuotationSlip.js';

type PdfDoc = InstanceType<typeof PDFDocument>;
type Line = { label: string; amount: string };
type Worker = { designation: string; count: string; salary: string };

export type NonMotorSlipPdfInput = {
  referenceNumber: string;
  slipDate: string;
  slipType: 'fire' | 'burglary' | 'workmen' | 'accident' | 'transit' | 'goods' | 'marine' | 'erection' | 'electronic' | 'medical' | 'crop';
  customerName: string;
  locationAddress: string;
  occupation: string;
  previousInsurance: string;
  claimsLast3Years: string;
  contactPerson: string;
  contactNo: string;
  annualEarnings: string;
  workerCount: string;
  transitFrom: string;
  transitTo: string;
  modeOfTransit: string;
  transitsPerMonth: string;
  annualCarryings: string;
  transitArea: string;
  maxTransitLimit: string;
  transitCount: string;
  vehicleCount: string;
  annualTransit: string;
  goodsDescription: string;
  voyageFrom: string;
  voyageTo: string;
  interests: string[];
  methodOfTransport: string;
  itemAge: string;
  memberCount: string;
  medicalLimits: { label: string; option1: string; option2: string; option3: string }[];
  cropPlants: { age: string; coverage: string; count: string; value: string }[];
  coverAmounts: { key: string; amount: string }[];
  items: Line[];
  firstLossItems: Line[];
  workers: Worker[];
  covers: readonly string[];
  notes: string;
  preparedBy: string;
  companyName: string;
  telephone: string;
  email: string;
  address: string;
};

const navy = '#0b2545';
const gold = '#FFB900';
const mist = '#f4f7fb';
const ink = '#334155';

function assetPath(...parts: string[]) {
  const relative = path.join(...parts);
  const candidates = [path.resolve(process.cwd(), 'client', 'public', relative), path.resolve(process.cwd(), '..', 'client', 'public', relative)];
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
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function amountNumber(value: string) {
  const cleaned = value.replace(/,/g, '').replace(/rs\.?|lkr/gi, '').trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

function moneyText(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /rs\.?|lkr/i.test(trimmed)) return trimmed;
  return `Rs. ${trimmed}`;
}

function totalOf(items: Line[]) {
  const numbers = items.map((item) => amountNumber(item.amount)).filter((value): value is number => value != null);
  if (numbers.length === 0) return '';
  return numbers.reduce((sum, value) => sum + value, 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tick(doc: PdfDoc, x: number, y: number, selected: boolean) {
  doc.roundedRect(x, y, 12, 12, 2).lineWidth(1.1).strokeColor(navy).stroke();
  if (!selected) return;
  doc.save();
  doc.moveTo(x + 2.5, y + 6).lineTo(x + 5, y + 9).lineTo(x + 9.5, y + 3).lineWidth(1.6).strokeColor(navy).stroke();
  doc.restore();
}

export function renderNonMotorQuotationSlipPdf(input: NonMotorSlipPdfInput) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const left = 36;
    const width = pageWidth - 72;
    const bottom = 48;
    const stacked = input.slipType === 'workmen' || input.slipType === 'accident' || input.slipType === 'transit' || input.slipType === 'goods' || input.slipType === 'marine' || input.slipType === 'erection' || input.slipType === 'electronic' || input.slipType === 'medical' || input.slipType === 'crop';
    const title = input.slipType === 'fire' ? 'FIRE QUOTATION SLIP' : input.slipType === 'burglary' ? 'BURGLARY QUOTATION SLIP' : input.slipType === 'accident' ? 'PERSONAL ACCIDENT' : input.slipType === 'transit' ? 'MONEY IN TRANSIT' : input.slipType === 'goods' ? 'GOODS IN TRANSIT' : input.slipType === 'marine' ? 'MARINE' : input.slipType === 'erection' ? 'ERECTION ALL RISK' : input.slipType === 'electronic' ? 'ELECTRONIC ALL RISK' : input.slipType === 'medical' ? 'MEDICAL' : input.slipType === 'crop' ? 'CROP' : "WORKMEN'S COMPENSATION";
    const typeLabel = input.slipType === 'fire' ? 'Fire Insurance' : input.slipType === 'burglary' ? 'Burglary Insurance' : input.slipType === 'accident' ? 'Personal Accident Cover' : input.slipType === 'transit' ? 'Money In Transit Insurance' : input.slipType === 'goods' ? 'Goods In Transit Insurance' : input.slipType === 'marine' ? 'Marine Insurance' : input.slipType === 'erection' ? 'Erection All Risk Insurance' : input.slipType === 'electronic' ? 'Electronic All Risk Insurance' : input.slipType === 'medical' ? 'Medical Insurance' : input.slipType === 'crop' ? 'Crop Insurance' : "Workmen's Compensation Insurance";

    const room = (needed: number, y: number) => {
      if (y + needed <= doc.page.height - bottom) return y;
      doc.addPage();
      paintWatermark(doc);
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(9).text(`${title}  ·  ${input.referenceNumber}`, left, 28, { width, height: 12, lineBreak: false });
      return 46;
    };

    paintWatermark(doc);
    const headerHeight = 96;
    const logoSize = 68;
    const photoWidth = 132;
    const photoHeight = 68;
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
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(stacked ? 13 : 15).text(input.companyName || 'UN Insurance Brokers', titleX, 16, { width: titleWidth, align: 'center', height: 18, lineBreak: false });
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(stacked ? 9 : 11).text(title, titleX, 36, { width: titleWidth, align: 'center', height: 12, lineBreak: false });
    if (stacked) doc.fontSize(9).text('QUOTATION SLIP', titleX, 50, { width: titleWidth, align: 'center', height: 12, lineBreak: false });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(`${displayDate(input.slipDate)}   ·   ${input.referenceNumber}`, titleX, stacked ? 66 : 58, { width: titleWidth, align: 'center', height: 12, lineBreak: false });

    let y = headerHeight + 16;
    const intro = input.slipType === 'fire'
      ? 'UN Insurance Brokers requests a quotation for this fire insurance. The ticked covers and the sum insured lines are the risk to be quoted. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
      : input.slipType === 'burglary'
        ? 'Please forward a competitive quotation for this burglary insurance. Declared value and 1st loss value are both set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
        : input.slipType === 'accident'
          ? 'Please forward a competitive quotation for this personal accident cover. Capital benefit, daily hospitalization, the ticked additional covers, and the number of workers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
          : input.slipType === 'transit'
            ? 'Please forward a competitive quotation for this money in transit insurance. The transit, sum insured, estimated annual carryings, mode of transit, and the ticked additional covers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
            : input.slipType === 'goods'
              ? 'Please forward a competitive quotation for this goods in transit insurance. The transit, limits, goods, mode of transit, and the ticked additional covers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
              : input.slipType === 'marine'
                ? 'Please forward a competitive quotation for this marine insurance. The voyage, interests, and the ticked request covers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
                : input.slipType === 'erection'
                  ? 'Please forward a competitive quotation for this erection all risk insurance. The sum insured, third party liability, method of transport, and the ticked additional covers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
                  : input.slipType === 'electronic'
                    ? 'Please forward a competitive quotation for this electronic all risk insurance. The sum insured and the age of the electrical items are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
                    : input.slipType === 'medical'
                      ? 'Please forward a competitive quotation for this medical insurance. The number of members, the limit options, and the ticked special requirements are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
                      : input.slipType === 'crop'
                        ? 'Please forward a competitive quotation for this crop insurance. The age of each planting, the coverage per plant, the number of plants, and the value are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.'
                        : "Please forward a competitive quotation for this workmen's compensation insurance. Estimated annual earnings, the workers, and the ticked additional covers are set out below. This slip is not a policy. Cover begins only if an insurer accepts the risk and issues the policy.";
    doc.fillColor(ink).font('Helvetica').fontSize(9).text(intro, left, y, { width });
    y = doc.y + 10;

    const facts: [string, string][] = [
      ['Customer name', input.customerName],
      ['Location address', input.locationAddress],
      ['Occupation', input.occupation],
      ['Previous insurance', input.previousInsurance],
      ['Claims last 3 years', input.claimsLast3Years],
      ['Contact person', input.contactPerson],
      ['Contact no', input.contactNo],
      ['Type of insurance', typeLabel],
      ...(input.slipType === 'workmen' ? ([['Estimated annual earnings', input.annualEarnings]] as [string, string][]) : []),
      ...(input.slipType === 'accident' ? ([['No of workers', input.workerCount]] as [string, string][]) : []),
      ...(input.slipType === 'transit'
        ? ([
            ['Transit from', input.transitFrom],
            ['Transit to', input.transitTo],
            ['Number of transits per month', input.transitsPerMonth],
            ['Estimated annual carryings', input.annualCarryings],
            ['Mode of transit', input.modeOfTransit],
          ] as [string, string][])
        : []),
      ...(input.slipType === 'goods'
        ? ([
            ['Transit', input.transitArea],
            ['Maximum transit limit', moneyText(input.maxTransitLimit)],
            ['No of transit', input.transitCount],
            ['No of vehicles', input.vehicleCount],
            ['Estimated annual transit', moneyText(input.annualTransit)],
            ['Goods description', input.goodsDescription],
            ['Mode of transit', input.modeOfTransit],
          ] as [string, string][])
        : []),
      ...(input.slipType === 'marine'
        ? ([
            ['Voyage from', input.voyageFrom],
            ['Voyage to', input.voyageTo],
          ] as [string, string][])
        : []),
      ...(input.slipType === 'electronic' ? ([['Age of electrical items', input.itemAge]] as [string, string][]) : []),
      ...(input.slipType === 'medical' ? ([['No of members', input.memberCount]] as [string, string][]) : []),
    ];
    const labelWidth = 140;
    for (const [index, fact] of facts.entries()) {
      doc.font('Helvetica').fontSize(9);
      const textHeight = Math.max(12, doc.heightOfString(fact[1] || '—', { width: width - labelWidth - 16 }));
      const rowHeight = textHeight + 8;
      y = room(rowHeight, y);
      if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
      doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
      doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(fact[0], left + 8, y + 4, { width: labelWidth - 12 });
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(fact[1] || '—', left + labelWidth, y + 4, { width: width - labelWidth - 10 });
      y += rowHeight;
    }

    const drawLines = (heading: string, items: Line[], column = 'Sum insured', showTotal = true) => {
      y = room(28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text(heading, left, y, { width });
      y = doc.y + 6;
      y = room(22, y);
      doc.rect(left, y, width, 20).fill(navy);
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(9).text('Description', left + 8, y + 5, { width: width - 150 });
      doc.fillColor('#ffffff').text(column, left + width - 140, y + 5, { width: 128, align: 'right' });
      y += 20;
      items.forEach((item, index) => {
        doc.font('Helvetica').fontSize(9);
        const textHeight = Math.max(12, doc.heightOfString(item.label, { width: width - 160 }));
        const rowHeight = textHeight + 8;
        y = room(rowHeight, y);
        if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
        doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica').fontSize(9).text(item.label, left + 8, y + 4, { width: width - 160 });
        doc.font('Helvetica-Bold').text(item.amount, left + width - 140, y + 4, { width: 128, align: 'right' });
        y += rowHeight;
      });
      const total = showTotal ? totalOf(items) : '';
      if (!total) return;
      y = room(22, y);
      doc.rect(left, y, width, 22).fill('#fff6d6');
      doc.rect(left, y, width, 22).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text('Total', left + 8, y + 5, { width: width - 160 });
      doc.text(`Rs. ${total}`, left + width - 160, y + 5, { width: 148, align: 'right' });
      y += 22;
    };

    if (input.slipType === 'fire') drawLines('Sum insured', input.items);
    else if (input.slipType === 'burglary') {
      drawLines('Declared value', input.items);
      drawLines('1st loss value', input.firstLossItems);
    } else if (input.slipType === 'accident') {
      drawLines('Capital benefit', input.items, 'Benefit', false);
      if (input.firstLossItems.length) drawLines('Daily hospitalization payment', input.firstLossItems, 'Benefit', false);
    } else if (input.slipType === 'transit') {
      drawLines('Sum insured', input.items, 'Amount', false);
    } else if (input.slipType === 'marine') {
      y = room(28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Interests', left, y, { width });
      y = doc.y + 6;
      input.interests.forEach((interest, index) => {
        doc.font('Helvetica').fontSize(9);
        const textHeight = Math.max(12, doc.heightOfString(interest, { width: width - 16 }));
        const rowHeight = textHeight + 8;
        y = room(rowHeight, y);
        if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
        doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica').fontSize(9).text(interest, left + 8, y + 4, { width: width - 16 });
        y += rowHeight;
      });
    } else if (input.slipType === 'erection') {
      drawLines('Sum insured', input.items);
      if (input.firstLossItems.length) drawLines('3rd party liability', input.firstLossItems, 'Limit', false);
      const transport = input.methodOfTransport || '—';
      doc.font('Helvetica').fontSize(9);
      const transportHeight = doc.heightOfString(transport, { width });
      y = room(transportHeight + 28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Method of transport', left, y, { width });
      y = doc.y + 6;
      doc.fillColor(ink).font('Helvetica').fontSize(9).text(transport, left, y, { width });
      y = doc.y;
    } else if (input.slipType === 'electronic') {
      drawLines('Sum insured', input.items);
    } else if (input.slipType === 'medical') {
      y = room(28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Limits', left, y, { width });
      y = doc.y + 6;
      y = room(20, y);
      const limitCols = [width * 0.34, width * 0.22, width * 0.22, width * 0.22];
      doc.rect(left, y, width, 20).fill(navy);
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('Limit', left + 8, y + 6, { width: limitCols[0] - 12, height: 12, lineBreak: false });
      doc.fillColor('#ffffff').text('Option 1', left + limitCols[0], y + 6, { width: limitCols[1] - 8, align: 'right', height: 12, lineBreak: false });
      doc.text('Option 2', left + limitCols[0] + limitCols[1], y + 6, { width: limitCols[2] - 8, align: 'right', height: 12, lineBreak: false });
      doc.text('Option 3', left + limitCols[0] + limitCols[1] + limitCols[2], y + 6, { width: limitCols[3] - 12, align: 'right', height: 12, lineBreak: false });
      y += 20;
      input.medicalLimits.forEach((limit, index) => {
        const cells = [limit.option1, limit.option2, limit.option3].map((value) => moneyText(value) || '—');
        doc.font('Helvetica').fontSize(9);
        const textHeight = Math.max(12, doc.heightOfString(limit.label, { width: limitCols[0] - 16 }));
        const rowHeight = textHeight + 8;
        y = room(rowHeight, y);
        if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
        doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica').fontSize(9).text(limit.label, left + 8, y + 4, { width: limitCols[0] - 16 });
        doc.font('Helvetica-Bold');
        cells.forEach((cell, side) => {
          const x = left + limitCols.slice(0, side + 1).reduce((sum, size) => sum + size, 0);
          doc.text(cell, x, y + 4, { width: limitCols[side + 1] - (side === 2 ? 12 : 8), align: 'right' });
        });
        y += rowHeight;
      });
    } else if (input.slipType === 'crop') {
      y = room(36, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Sum insured', left, y, { width });
      y = doc.y + 6;
      y = room(28, y);
      const cropCols = [width * 0.22, width * 0.28, width * 0.22, width * 0.28];
      doc.rect(left, y, width, 28).fill(navy);
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(8);
      doc.text('Age of plant', left + 8, y + 9, { width: cropCols[0] - 12, height: 14, lineBreak: false });
      doc.fillColor('#ffffff').text('Coverage per plant', left + cropCols[0], y + 9, { width: cropCols[1] - 8, align: 'right', height: 14, lineBreak: false });
      doc.text('No of plant', left + cropCols[0] + cropCols[1], y + 9, { width: cropCols[2] - 8, align: 'right', height: 14, lineBreak: false });
      doc.text('Value (Rs)', left + cropCols[0] + cropCols[1] + cropCols[2], y + 9, { width: cropCols[3] - 12, align: 'right', height: 14, lineBreak: false });
      y += 28;
      input.cropPlants.forEach((plant, index) => {
        doc.font('Helvetica').fontSize(9);
        const textHeight = Math.max(12, doc.heightOfString(plant.age, { width: cropCols[0] - 16 }));
        const rowHeight = textHeight + 8;
        y = room(rowHeight, y);
        if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
        doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica').fontSize(9).text(plant.age, left + 8, y + 4, { width: cropCols[0] - 16 });
        doc.font('Helvetica-Bold');
        const cells = [moneyText(plant.coverage) || plant.coverage, plant.count, moneyText(plant.value) || plant.value];
        cells.forEach((cell, side) => {
          const x = left + cropCols.slice(0, side + 1).reduce((sum, size) => sum + size, 0);
          doc.text(cell, x, y + 4, { width: cropCols[side + 1] - (side === 2 ? 12 : 8), align: 'right' });
        });
        y += rowHeight;
      });
      const cropTotal = totalOf(input.cropPlants.map((plant) => ({ label: plant.age, amount: plant.value })));
      if (cropTotal) {
        y = room(22, y);
        doc.rect(left, y, width, 22).fill('#fff6d6');
        doc.rect(left, y, width, 22).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text('Total', left + 8, y + 5, { width: width - 160 });
        doc.text(`Rs. ${cropTotal}`, left + width - 160, y + 5, { width: 148, align: 'right' });
        y += 22;
      }
    } else if (input.slipType === 'workmen') {
      y = room(28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('No of workers', left, y, { width });
      y = doc.y + 6;
      y = room(28, y);
      doc.rect(left, y, width, 28).fill(navy);
      doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text('Designation', left + 8, y + 9, { width: width * 0.42 });
      doc.text('No of workers', left + width * 0.46, y + 9, { width: width * 0.18, align: 'right' });
      doc.text('Monthly salary (per person)', left + width * 0.66, y + 4, { width: width * 0.3, align: 'right' });
      y += 28;
      input.workers.forEach((worker, index) => {
        doc.font('Helvetica').fontSize(9);
        const textHeight = Math.max(12, doc.heightOfString(worker.designation, { width: width * 0.42 }));
        const rowHeight = textHeight + 8;
        y = room(rowHeight, y);
        if (index % 2 === 0) doc.rect(left, y, width, rowHeight).fill(mist);
        doc.rect(left, y, width, rowHeight).strokeColor('#d6e0ec').lineWidth(0.4).stroke();
        doc.fillColor(navy).font('Helvetica').fontSize(9).text(worker.designation, left + 8, y + 4, { width: width * 0.42 });
        doc.font('Helvetica-Bold').text(worker.count, left + width * 0.46, y + 4, { width: width * 0.18, align: 'right' });
        doc.text(worker.salary, left + width * 0.66, y + 4, { width: width * 0.3, align: 'right' });
        y += rowHeight;
      });
    }

    if (input.slipType === 'fire' || input.slipType === 'workmen' || input.slipType === 'accident' || input.slipType === 'transit' || input.slipType === 'goods' || input.slipType === 'marine' || input.slipType === 'erection' || input.slipType === 'medical') {
      const coverOptions = input.slipType === 'fire' ? fireCoverOptions : input.slipType === 'accident' ? accidentCoverOptions : input.slipType === 'transit' ? transitCoverOptions : input.slipType === 'goods' ? goodsCoverOptions : input.slipType === 'marine' ? marineCoverOptions : input.slipType === 'erection' ? erectionCoverOptions : input.slipType === 'medical' ? medicalCoverOptions : workmenCoverOptions;
      y = room(28, y);
      y += 12;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text(input.slipType === 'fire' ? 'Covers' : input.slipType === 'marine' ? 'Request covers' : input.slipType === 'medical' ? 'Special requirements' : 'Additional covers', left, y);
      y = doc.y + 6;
      const selected = new Set(input.covers);
      const colGap = 12;
      const colWidth = (width - colGap) / 2;
      for (let index = 0; index < coverOptions.length; index += 2) {
        y = room(20, y);
        const pair = [coverOptions[index], coverOptions[index + 1]].filter((cover) => cover != null);
        pair.forEach((cover, side) => {
          const x = left + side * (colWidth + colGap);
          const chosen = selected.has(cover[0]);
          const rawAmount = input.coverAmounts.find((item) => item.key === cover[0])?.amount || '';
          const shown = rawAmount && chosen ? (/rs\.?|lkr/i.test(rawAmount) ? rawAmount : `Rs. ${rawAmount}`) : '';
          tick(doc, x, y + 2, chosen);
          doc.fillColor(navy).font('Helvetica').fontSize(8).text(shown ? `${cover[1]}  ${shown}` : cover[1], x + 16, y + 3, { width: colWidth - 18, height: 14, ellipsis: true });
        });
        y += 18;
      }
    }

    if (input.preparedBy) {
      y = room(20, y);
      y += 10;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text(`Prepared by  ${input.preparedBy}`, left, y, { width, height: 14, lineBreak: false });
      y += 16;
    }

    const notes = (input.notes || '').trim();
    if (notes) {
      doc.font('Helvetica').fontSize(9);
      const notesHeight = doc.heightOfString(notes, { width });
      y = room(notesHeight + 24, y);
      y += 8;
      doc.fillColor(navy).font('Helvetica-Bold').fontSize(12).text('Notes', left, y, { width });
      y = doc.y + 4;
      doc.fillColor(ink).font('Helvetica').fontSize(9).text(notes, left, y, { width });
    }

    const footer = [input.companyName, input.telephone, input.email, input.address].filter(Boolean).join('   ·   ');
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      const previous = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(footer || 'UN Insurance Brokers', left, doc.page.height - 28, { width, height: 12, lineBreak: false });
      doc.page.margins.bottom = previous;
    }
    doc.end();
  });
}
