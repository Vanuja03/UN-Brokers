import { INSURANCE_LABELS, type InsuranceType } from '../config/constants.js';
import { escapeHtml } from '../utils/sanitize.js';

const LABELS: Record<string, string> = {
  vehicleType: 'Vehicle type',
  vehicleMake: 'Make',
  vehicleModel: 'Model',
  yearOfManufacture: 'Year of manufacture',
  registrationAvailable: 'Registration number available',
  registrationNumber: 'Registration number',
  ownershipStatus: 'Ownership',
  estimatedMarketValue: 'Estimated market value',
  vehicleUsage: 'Vehicle usage',
  fuelType: 'Fuel type',
  preferredCoverage: 'Cover type',
  existingPolicyRenewal: 'Existing policy',
  existingPolicyRenewalDate: 'Renewal date',
  additionalNotes: 'Additional notes',
  liabilityNotes: 'Liability notes',
  destination: 'Destination',
  departureDate: 'Departure date',
  returnDate: 'Return date',
  travelerCount: 'Number of travelers',
  travelerAges: 'Ages of travelers',
  tripDurationDays: 'Trip duration (days)',
  benefitPreferences: 'Benefit preferences',
  propertyType: 'Property type',
  location: 'Location',
  coverBuilding: 'Cover for the building',
  coverContents: 'Cover for contents',
  estimatedInsuredValue: 'Estimated insured value',
  occupancy: 'Occupancy',
  riskDetails: 'Risk details',
  propertyAddress: 'Property address',
  occupantStatus: 'Owner or occupant status',
  buildingValue: 'Building value',
  contentsValue: 'Contents value',
  constructionType: 'Construction type',
  businessActivity: 'Business activity',
  employeeCount: 'Number of employees',
  employeeCategories: 'Employee categories',
  estimatedAnnualPayroll: 'Estimated annual payroll',
  workplaceRiskDetails: 'Workplace risk details',
  businessType: 'Business type',
  typicalAmountCarried: 'Typical amount carried',
  transitFrequency: 'Transit frequency',
  securityArrangements: 'Security arrangements',
  collectionDeliveryDetails: 'Collection and delivery',
  occupation: 'Occupation',
  desiredCoverageAmount: 'Desired coverage amount',
  additionalInformation: 'Additional information',
  propertyLocation: 'Property location',
  transactionType: 'Transaction type',
  estimatedPropertyValue: 'Estimated property value',
  applicantRole: 'Applicant role',
};

export function detailLines(details: Record<string, unknown>, currency: string) {
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== '' && value !== null && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => {
      const label = LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
      const moneyKeys = ['estimatedMarketValue', 'estimatedInsuredValue', 'buildingValue', 'contentsValue', 'estimatedAnnualPayroll', 'typicalAmountCarried', 'desiredCoverageAmount', 'estimatedPropertyValue'];
      const rendered = Array.isArray(value) ? value.join(', ') : String(value);
      const text = moneyKeys.includes(key) ? `${currency} ${rendered}` : rendered;
      return { label, text };
    });
}

function layout(companyName: string, heading: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#0b2545;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#0b2545;color:#fff;padding:20px 24px;border-radius:16px 16px 0 0;">
      <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#FFB900;">${escapeHtml(companyName)}</p>
      <h1 style="margin:8px 0 0;font-size:22px;">${escapeHtml(heading)}</h1>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e7eef6;border-top:0;border-radius:0 0 16px 16px;">
      ${body}
    </div>
  </div>
</body>
</html>`;
}

export function customerQuoteEmail(input: {
  companyName: string;
  customerName: string;
  referenceNumber: string;
  insuranceType: InsuranceType;
}) {
  const category = INSURANCE_LABELS[input.insuranceType];
  const body = `
    <p>Hello ${escapeHtml(input.customerName)},</p>
    <p>We have received your quotation inquiry for <strong>${escapeHtml(category)}</strong>.</p>
    <p style="font-size:18px;">Reference: <strong>${escapeHtml(input.referenceNumber)}</strong></p>
    <p>A member of the team will review what you sent and contact you if they need anything else. Submitting this inquiry does not start a policy, bind cover, or confirm that an insurer will offer terms.</p>
    <p>If you did not send this request, contact the brokerage and quote the reference above.</p>`;
  const text = `Hello ${input.customerName},\n\nWe received your quotation inquiry for ${category}.\nReference: ${input.referenceNumber}\n\nThis inquiry does not start a policy or guarantee an offer of cover.\n`;
  return {
    subject: `Quotation inquiry received (${input.referenceNumber})`,
    text,
    html: layout(input.companyName, 'Quotation inquiry received', body),
  };
}

export function adminQuoteEmail(input: {
  companyName: string;
  referenceNumber: string;
  customerName: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  insuranceType: InsuranceType;
  details: Record<string, unknown>;
  message: string;
  currency: string;
  adminUrl?: string;
}) {
  const rows = detailLines(input.details, input.currency)
    .map((line) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e7eef6;">${escapeHtml(line.label)}</td><td style="padding:6px 8px;border-bottom:1px solid #e7eef6;">${escapeHtml(line.text)}</td></tr>`)
    .join('');
  const link = input.adminUrl ? `<p><a href="${escapeHtml(input.adminUrl)}">Open this inquiry</a></p>` : '';
  const body = `
    <p>A new quotation inquiry has been saved.</p>
    <p><strong>${escapeHtml(input.referenceNumber)}</strong> · ${escapeHtml(INSURANCE_LABELS[input.insuranceType])}</p>
    <p>${escapeHtml(input.customerName)}<br>${escapeHtml(input.email)}<br>${escapeHtml(input.phone)}<br>Preferred contact: ${escapeHtml(input.preferredContactMethod)}</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    ${input.message ? `<p><strong>Message</strong><br>${escapeHtml(input.message)}</p>` : ''}
    ${link}`;
  const text = `New inquiry ${input.referenceNumber}\n${input.customerName} ${input.email} ${input.phone}\n${INSURANCE_LABELS[input.insuranceType]}`;
  return {
    subject: `New inquiry ${input.referenceNumber}`,
    text,
    html: layout(input.companyName, 'New quotation inquiry', body),
  };
}

export function customerContactEmail(input: { companyName: string; name: string; referenceNumber: string }) {
  const body = `<p>Hello ${escapeHtml(input.name)},</p><p>We received your message. Reference: <strong>${escapeHtml(input.referenceNumber)}</strong>.</p><p>This acknowledgment means the message was saved. It is not a policy confirmation.</p>`;
  return {
    subject: `Message received (${input.referenceNumber})`,
    text: `Hello ${input.name},\n\nWe received your message. Reference: ${input.referenceNumber}\n`,
    html: layout(input.companyName, 'Message received', body),
  };
}

export function adminContactEmail(input: {
  companyName: string;
  referenceNumber: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  insuranceType?: string;
}) {
  const body = `<p><strong>${escapeHtml(input.referenceNumber)}</strong></p><p>${escapeHtml(input.name)} · ${escapeHtml(input.email)} · ${escapeHtml(input.phone)}</p><p><strong>${escapeHtml(input.subject)}</strong></p><p>${escapeHtml(input.message)}</p>`;
  return {
    subject: `New contact message ${input.referenceNumber}`,
    text: `Contact ${input.referenceNumber}\n${input.name}\n${input.subject}\n${input.message}`,
    html: layout(input.companyName, 'New contact message', body),
  };
}
