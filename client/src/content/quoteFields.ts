import type { InsuranceType } from '../types';

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'radio' | 'checkbox' | 'date';

export type QuoteField = {
  name: string;
  label: string;
  type: FieldType;
  group: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  showWhen?: { field: string; equals: string };
  inputMode?: 'numeric' | 'decimal' | 'text';
  dateName?: string;
  detailLabel?: string;
  dateLabel?: string;
};

const vehicleTypes = [
  { value: 'private-car', label: 'Private car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'three-wheeler', label: 'Three-wheeler' },
  { value: 'van', label: 'Van' },
  { value: 'lorry', label: 'Lorry' },
  { value: 'bus', label: 'Bus' },
  { value: 'other', label: 'Other' },
];

const fuelTypes = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'phev', label: 'PHEV' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'other', label: 'Other' },
];

const usageTypes = [
  { value: 'private', label: 'Private' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'rent-a-car', label: 'Rent a car' },
];

const coverTypes = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'third-party', label: 'Third party' },
];

const ownershipTypes = [
  { value: 'owned', label: 'Owned outright' },
  { value: 'financed', label: 'Financed' },
  { value: 'leased', label: 'Leased' },
  { value: 'other', label: 'Other' },
];

function vehicleFields(currency: string, includeCoverage: boolean): QuoteField[] {
  const fields: QuoteField[] = [
    { name: 'vehicleType', label: 'Vehicle type', type: 'select', group: 'Vehicle', required: true, options: vehicleTypes },
    { name: 'vehicleMake', label: 'Make', type: 'text', group: 'Vehicle', required: true, placeholder: 'Toyota' },
    { name: 'vehicleModel', label: 'Model', type: 'text', group: 'Vehicle', required: true, placeholder: 'Aqua' },
    { name: 'yearOfManufacture', label: 'Year of manufacture', type: 'number', group: 'Vehicle', required: true, inputMode: 'numeric' },
    { name: 'fuelType', label: 'Fuel type', type: 'select', group: 'Vehicle', required: true, options: fuelTypes },
    {
      name: 'estimatedMarketValue',
      label: `Estimated market value (${currency})`,
      type: 'number',
      group: 'Use and value',
      required: true,
      inputMode: 'decimal',
    },
    { name: 'vehicleUsage', label: 'Vehicle usage', type: 'select', group: 'Use and value', required: true, options: usageTypes },
    {
      name: 'registrationAvailable',
      label: 'Is a registration number available?',
      type: 'radio',
      group: 'Registration and ownership',
      required: true,
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      name: 'registrationNumber',
      label: 'Registration number',
      type: 'text',
      group: 'Registration and ownership',
      required: true,
      showWhen: { field: 'registrationAvailable', equals: 'yes' },
    },
    { name: 'ownershipStatus', label: 'Ownership or financing', type: 'select', group: 'Registration and ownership', required: true, options: ownershipTypes },
    { name: 'preferredCoverage', label: 'Cover type', type: 'select', group: 'Cover', required: true, options: coverTypes },
    {
      name: 'existingPolicyRenewal',
      label: 'Existing policy and renewal date',
      type: 'text',
      group: 'Cover',
      placeholder: 'Insurer name and no claim bonus %',
      dateName: 'existingPolicyRenewalDate',
      detailLabel: 'Existing insurer + no claim bonus percentage',
      dateLabel: 'Renewal date',
      help: 'Optional. Add the existing insurer and no claim bonus percentage, and the renewal date.',
    },
    { name: 'additionalNotes', label: 'Additional notes', type: 'textarea', group: 'Cover' },
  ];
  if (!includeCoverage) {
    fields.splice(fields.length - 2, 0, {
      name: 'liabilityNotes',
      label: 'Anything the team should know about the liability cover you need',
      type: 'textarea',
      group: 'Cover',
    });
  }
  return fields;
}

export function fieldsFor(type: InsuranceType, currency: string): QuoteField[] {
  switch (type) {
    case 'motor':
      return vehicleFields(currency, true);
    case 'motor-third-party':
      return vehicleFields(currency, false);
    case 'travel':
      return [
        { name: 'nicNo', label: 'NIC no', type: 'text', group: 'Trip', required: true, placeholder: '123456789V or 200012345678' },
        { name: 'destination', label: 'Destination', type: 'text', group: 'Trip', required: true },
        { name: 'departureDate', label: 'Departure date', type: 'date', group: 'Trip', required: true },
        { name: 'returnDate', label: 'Arrival date', type: 'date', group: 'Trip', required: true },
        { name: 'dependents', label: 'Dependents', type: 'number', group: 'Trip', required: true, inputMode: 'numeric', help: 'How many dependents are travelling. Enter 0 if none.' },
        { name: 'purpose', label: 'Purpose', type: 'select', group: 'Trip', required: true, options: [
          { value: 'holiday', label: 'Holiday' },
          { value: 'business', label: 'Business' },
          { value: 'study', label: 'Study' },
          { value: 'family', label: 'Visiting family' },
          { value: 'medical', label: 'Medical' },
          { value: 'other', label: 'Other' },
        ] },
        { name: 'additionalNotes', label: 'Additional notes', type: 'textarea', group: 'Preferences' },
      ];
    case 'fire':
      return [
        { name: 'propertyType', label: 'Property type', type: 'select', group: 'Property', required: true, options: [
          { value: 'commercial', label: 'Commercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'office', label: 'Office' }, { value: 'mixed-use', label: 'Mixed use' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'location', label: 'Property location', type: 'text', group: 'Property', required: true },
        { name: 'occupancy', label: 'Occupancy', type: 'text', group: 'Property', required: true, placeholder: 'How the property is used' },
        { name: 'riskDetails', label: 'Relevant risk details', type: 'textarea', group: 'Risk' },
      ];
    case 'dwelling-fire':
      return [
        { name: 'propertyAddress', label: 'Property address or area', type: 'text', group: 'Home', required: true },
        { name: 'occupantStatus', label: 'Your relationship to the home', type: 'select', group: 'Home', required: true, options: [
          { value: 'owner', label: 'Owner-occupier' }, { value: 'tenant', label: 'Tenant' }, { value: 'landlord', label: 'Landlord' }, { value: 'other', label: 'Other' },
        ] },
      ];
    case 'workers-compensation':
      return [
        { name: 'businessActivity', label: 'Business activity', type: 'text', group: 'Business', required: true },
      ];
    case 'money-in-transit':
      return [
        { name: 'businessType', label: 'Business type', type: 'text', group: 'Movement of money', required: true },
      ];
    case 'personal-accident':
      return [
        { name: 'occupation', label: 'Occupation', type: 'text', group: 'Applicant', required: true },
        { name: 'desiredCoverageAmount', label: `Desired coverage amount (${currency})`, type: 'number', group: 'Benefit', required: true, inputMode: 'decimal' },
        { name: 'benefitPreferences', label: 'Benefit preferences', type: 'textarea', group: 'Benefit', help: 'Optional. Do not include medical records.' },
        { name: 'additionalInformation', label: 'Anything else an insurer may need', type: 'textarea', group: 'Benefit' },
      ];
    case 'title-insurance':
      return [];
    default:
      return [];
  }
}

export type InsuredLine = { item: string; quantity: string; values: string[] };

export const defaultInsuredLines: InsuredLine[] = [
  { item: 'Office equipments', quantity: '1', values: [''] },
  { item: 'Office furniture & telephone', quantity: '1', values: [''] },
];

export const defaultDwellingInsuredLines: InsuredLine[] = [
  { item: 'Building', quantity: '1', values: [''] },
  { item: 'Household furniture & contents', quantity: '1', values: [''] },
];

function copyInsuredLines(lines: InsuredLine[]) {
  return lines.map((line) => ({ ...line, values: [...line.values] }));
}

export type EmployeeClass = { employeeClass: string; duties: string; estimatedNumber: string; monthlyIncome: string };

export const defaultEmployeeClasses: EmployeeClass[] = [
  { employeeClass: 'Office staff', duties: '', estimatedNumber: '', monthlyIncome: '' },
  { employeeClass: 'Drivers', duties: '', estimatedNumber: '', monthlyIncome: '' },
];

function copyEmployeeClasses(lines: EmployeeClass[]) {
  return lines.map((line) => ({ ...line }));
}

export type MoneyTransfer = { transferAmount: string; startLocation: string; endLocation: string; transferTimes: string };

export const defaultMoneyTransfers: MoneyTransfer[] = [
  { transferAmount: '', startLocation: 'Shop', endLocation: 'Bank', transferTimes: '' },
  { transferAmount: '', startLocation: 'Branch', endLocation: 'Head office', transferTimes: '' },
];

function copyMoneyTransfers(lines: MoneyTransfer[]) {
  return lines.map((line) => ({ ...line }));
}

export function defaultDetails(type: InsuranceType): Record<string, string | number | boolean | string[] | InsuredLine[] | EmployeeClass[] | MoneyTransfer[]> {
  const base: Record<string, string | number | boolean | string[] | InsuredLine[] | EmployeeClass[] | MoneyTransfer[]> = {};
  if (type === 'motor' || type === 'motor-third-party') {
    Object.assign(base, {
      vehicleType: 'private-car', vehicleMake: '', vehicleModel: '', yearOfManufacture: '', registrationAvailable: 'no',
      registrationNumber: '', ownershipStatus: 'owned', estimatedMarketValue: '', vehicleUsage: 'private', fuelType: 'petrol',
      existingPolicyRenewal: '', existingPolicyRenewalDate: '', preferredCoverage: type === 'motor-third-party' ? 'third-party' : 'comprehensive', additionalNotes: '',
    });
    if (type === 'motor-third-party') base.liabilityNotes = '';
  }
  if (type === 'travel') Object.assign(base, { nicNo: '', destination: '', departureDate: '', returnDate: '', dependents: 0, purpose: 'holiday', additionalNotes: '' });
  if (type === 'fire') Object.assign(base, { propertyType: 'commercial', location: '', insuredItems: copyInsuredLines(defaultInsuredLines), occupancy: '', riskDetails: '' });
  if (type === 'dwelling-fire') Object.assign(base, { propertyAddress: '', occupantStatus: 'owner', insuredItems: copyInsuredLines(defaultDwellingInsuredLines) });
  if (type === 'workers-compensation') Object.assign(base, { businessActivity: '', employeeClasses: copyEmployeeClasses(defaultEmployeeClasses) });
  if (type === 'money-in-transit') Object.assign(base, { businessType: '', transfers: copyMoneyTransfers(defaultMoneyTransfers) });
  if (type === 'personal-accident') Object.assign(base, { occupation: '', desiredCoverageAmount: '', benefitPreferences: '', additionalInformation: '' });
  return base;
}
