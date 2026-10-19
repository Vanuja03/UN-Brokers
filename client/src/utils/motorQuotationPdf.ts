import { motorBenefitRows, type MotorComparisonSheet } from '../content/motorComparison';

const navy: [number, number, number] = [11, 37, 69];
const gold: [number, number, number] = [255, 185, 0];
const ink: [number, number, number] = [11, 37, 69];
const muted: [number, number, number] = [71, 85, 105];

async function logoDataUrl() {
  const response = await fetch('/logo.png');
  if (!response.ok) return '';
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the logo.'));
    reader.readAsDataURL(blob);
  });
}

function fact(label: string, value: string) {
  return `${label}: ${value || '—'}`;
}

export async function downloadMotorQuotationPdf(sheet: MotorComparisonSheet) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logo = await logoDataUrl().catch(() => '');

  const drawChrome = () => {
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 22, pageWidth, 1.6, 'F');
    if (logo) doc.addImage(logo, 'PNG', 8, 3, 16, 16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('UN INSURANCE BROKERS', logo ? 28 : 10, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gold);
    doc.text('Motor insurance quotation', logo ? 28 : 10, 16);
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(sheet.referenceNumber || 'Draft', pageWidth - 10, 10, { align: 'right' });
    doc.text(sheet.quotationDate || '', pageWidth - 10, 16, { align: 'right' });
  };

  drawChrome();

  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Prepared for ${sheet.customerName}`, 10, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  const facts = [
    fact('Vehicle number', sheet.vehicleNumber),
    fact('Make', sheet.make),
    fact('Model', sheet.model),
    fact('Fuel', sheet.fuel),
    fact('Year', sheet.yearOfManufacture),
    fact('Usage', sheet.usage),
    fact('Sum insured', sheet.sumInsured),
    fact('Lease or loan no.', sheet.leaseOrLoanNo),
  ].join('    ');
  const factLines = doc.splitTextToSize(facts, pageWidth - 20);
  doc.text(factLines, 10, 36);

  const intro =
    'Thank you for asking UN Insurance Brokers to compare motor insurance for this vehicle. The figures below are quotations from the named insurers. Benefits, limits, and exclusions are those of each insurer. This document is not a policy, and cover starts only if an insurer issues one.';
  const introLines = doc.splitTextToSize(intro, pageWidth - 20);
  const introY = 36 + factLines.length * 4 + 2;
  doc.text(introLines, 10, introY);

  autoTable(doc, {
    startY: introY + introLines.length * 4 + 3,
    head: [['Benefit', ...sheet.insurers.map((insurer) => insurer.name)]],
    body: motorBenefitRows.map(([key, label]) => [label, ...sheet.insurers.map((insurer) => insurer.benefits[key] || '—')]),
    theme: 'grid',
    styles: { fontSize: 7, textColor: ink, cellPadding: 1.6, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: navy, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 247, 251] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48 } },
    margin: { left: 10, right: 10, bottom: 16 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawChrome();
      doc.setFillColor(...gold);
      doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
      doc.setTextColor(...navy);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const contact = [sheet.preparedByName, sheet.preparedByPhone, sheet.preparedByEmail].filter(Boolean).join('  |  ');
      doc.text(contact || 'UN Insurance Brokers', 10, pageHeight - 3.4);
      doc.text(`Page ${data.pageNumber}`, pageWidth - 10, pageHeight - 3.4, { align: 'right' });
    },
  });

  const file = `${sheet.vehicleNumber || 'motor'}-quotation.pdf`.replace(/[^\w.-]+/g, '-');
  doc.save(file);
}
