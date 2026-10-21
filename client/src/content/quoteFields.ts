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
  { value: 'business', label: 'Business' },
  { value: 'commercial-passenger', label: 'Commercial passenger transport' },
  { value: 'goods-transport', label: 'Goods transport' },
  { value: 'other', label: 'Other' },
];

const coverTypes = [
  { value: 'full-insurance', label: 'Full insurance' },
  { value: 'third-party', label: 'Third party' },
  { value: 'unsure', label: 'I have no idea yet' },
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
    {
      name: 'estimatedMarketValue',
      label: `Estimated market value (${currency})`,
      type: 'number',
      group: 'Use and value',
      required: true,
      inputMode: 'decimal',
    },
    { name: 'vehicleUsage', label: 'Vehicle usage', type: 'select', group: 'Use and value', required: true, options: usageTypes },
    { name: 'preferredCoverage', label: 'Cover type', type: 'select', group: 'Cover', required: true, options: coverTypes },
    {
      name: 'existingPolicyRenewal',
      label: 'Existing policy and renewal date',
      type: 'text',
      group: 'Cover',
      placeholder: 'Policy number or insurer',
      dateName: 'existingPolicyRenewalDate',
      help: 'Optional. Add a policy number or insurer, and the renewal date.',
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
        { name: 'destination', label: 'Destination', type: 'text', group: 'Trip', required: true },
        { name: 'departureDate', label: 'Departure date', type: 'date', group: 'Trip', required: true },
        { name: 'returnDate', label: 'Return date', type: 'date', group: 'Trip', required: true },
        { name: 'travelerCount', label: 'Number of travelers', type: 'number', group: 'Travelers', required: true, inputMode: 'numeric' },
        { name: 'travelerAges', label: 'Ages of travelers', type: 'text', group: 'Travelers', required: true, placeholder: '34, 32, 8', help: 'Separate ages with commas.' },
        { name: 'additionalNotes', label: 'Additional notes', type: 'textarea', group: 'Preferences' },
      ];
    case 'fire':
      return [
        { name: 'propertyType', label: 'Property type', type: 'select', group: 'Property', required: true, options: [
          { value: 'commercial', label: 'Commercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'office', label: 'Office' }, { value: 'mixed-use', label: 'Mixed use' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'location', label: 'Property location', type: 'text', group: 'Property', required: true },
        { name: 'occupancy', label: 'Occupancy', type: 'text', group: 'Property', required: true, placeholder: 'How the property is used' },
        { name: 'coverBuilding', label: 'Include the building', type: 'checkbox', group: 'Values' },
        { name: 'coverContents', label: 'Include contents', type: 'checkbox', group: 'Values' },
        { name: 'estimatedInsuredValue', label: `Estimated insured value (${currency})`, type: 'number', group: 'Values', required: true, inputMode: 'decimal' },
        { name: 'riskDetails', label: 'Relevant risk details', type: 'textarea', group: 'Risk' },
      ];
    case 'dwelling-fire':
      return [
        { name: 'propertyAddress', label: 'Property address or area', type: 'text', group: 'Home', required: true },
        { name: 'occupantStatus', label: 'Your relationship to the home', type: 'select', group: 'Home', required: true, options: [
          { value: 'owner', label: 'Owner-occupier' }, { value: 'tenant', label: 'Tenant' }, { value: 'landlord', label: 'Landlord' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'buildingValue', label: `Building value (${currency})`, type: 'number', group: 'Values', inputMode: 'decimal', help: 'Enter a building value, a contents value, or both.' },
        { name: 'contentsValue', label: `Contents value (${currency})`, type: 'number', group: 'Values', inputMode: 'decimal' },
        { name: 'constructionType', label: 'Construction type', type: 'text', group: 'Risk', placeholder: 'Optional' },
        { name: 'riskDetails', label: 'Relevant property or fire-risk details', type: 'textarea', group: 'Risk' },
      ];
    case 'workers-compensation':
      return [
        { name: 'businessActivity', label: 'Business activity', type: 'text', group: 'Business', required: true },
        { name: 'employeeCount', label: 'Number of employees', type: 'number', group: 'Employees', required: true, inputMode: 'numeric' },
        { name: 'employeeCategories', label: 'Employee categories', type: 'text', group: 'Employees', required: true, placeholder: 'For example, office staff, drivers, technicians' },
        { name: 'estimatedAnnualPayroll', label: `Estimated annual payroll (${currency})`, type: 'number', group: 'Employees', inputMode: 'decimal', help: 'Optional unless an insurer asks for it.' },
        { name: 'workplaceRiskDetails', label: 'Relevant workplace risk details', type: 'textarea', group: 'Risk' },
      ];
    case 'money-in-transit':
      return [
        { name: 'businessType', label: 'Business type', type: 'text', group: 'Movement of money', required: true },
        { name: 'typicalAmountCarried', label: `Typical amount carried (${currency})`, type: 'number', group: 'Movement of money', required: true, inputMode: 'decimal' },
        { name: 'transitFrequency', label: 'How often money is in transit', type: 'select', group: 'Movement of money', required: true, options: [
          { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'occasional', label: 'Occasional' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'securityArrangements', label: 'Security arrangements', type: 'textarea', group: 'Security', required: true },
        { name: 'collectionDeliveryDetails', label: 'Collection and delivery details', type: 'textarea', group: 'Security', required: true },
        { name: 'additionalNotes', label: 'Additional notes', type: 'textarea', group: 'Security' },
      ];
    case 'personal-accident':
      return [
        { name: 'occupation', label: 'Occupation', type: 'text', group: 'Applicant', required: true },
        { name: 'desiredCoverageAmount', label: `Desired coverage amount (${currency})`, type: 'number', group: 'Benefit', required: true, inputMode: 'decimal' },
        { name: 'benefitPreferences', label: 'Benefit preferences', type: 'textarea', group: 'Benefit', help: 'Optional. Do not include medical records.' },
        { name: 'additionalInformation', label: 'Anything else an insurer may need', type: 'textarea', group: 'Benefit' },
      ];
    case 'title-insurance':
      return [
        { name: 'propertyLocation', label: 'Property location', type: 'text', group: 'Transaction', required: true },
        { name: 'propertyType', label: 'Property type', type: 'text', group: 'Transaction', required: true, placeholder: 'House, apartment, land, or other' },
        { name: 'transactionType', label: 'Transaction type', type: 'select', group: 'Transaction', required: true, options: [
          { value: 'purchase', label: 'Purchase' }, { value: 'sale', label: 'Sale' }, { value: 'refinance', label: 'Refinance' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'estimatedPropertyValue', label: `Estimated property value (${currency})`, type: 'number', group: 'Transaction', required: true, inputMode: 'decimal' },
        { name: 'applicantRole', label: 'Your role in the transaction', type: 'select', group: 'Transaction', required: true, options: [
          { value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' }, { value: 'lender', label: 'Lender' }, { value: 'other', label: 'Other' },
        ] },
        { name: 'additionalInformation', label: 'Other information for the provider', type: 'textarea', group: 'Transaction' },
      ];
    default:
      return [];
  }
}

export function defaultDetails(type: InsuranceType): Record<string, string | number | boolean | string[]> {
  const base: Record<string, string | number | boolean | string[]> = {};
  if (type === 'motor' || type === 'motor-third-party') {
    Object.assign(base, {
      vehicleType: 'private-car', vehicleMake: '', vehicleModel: '', yearOfManufacture: '', registrationAvailable: 'no',
      registrationNumber: '', ownershipStatus: 'owned', estimatedMarketValue: '', vehicleUsage: 'private', fuelType: 'petrol',
      existingPolicyRenewal: '', existingPolicyRenewalDate: '', preferredCoverage: 'unsure', additionalNotes: '',
    });
    if (type === 'motor-third-party') base.liabilityNotes = '';
  }
  if (type === 'travel') Object.assign(base, { destination: '', departureDate: '', returnDate: '', travelerCount: 1, travelerAges: '', benefitPreferences: [], additionalNotes: '' });
  if (type === 'fire') Object.assign(base, { propertyType: 'commercial', location: '', coverBuilding: false, coverContents: false, estimatedInsuredValue: '', occupancy: '', riskDetails: '' });
  if (type === 'dwelling-fire') Object.assign(base, { propertyAddress: '', occupantStatus: 'owner', buildingValue: '', contentsValue: '', constructionType: '', riskDetails: '' });
  if (type === 'workers-compensation') Object.assign(base, { businessActivity: '', employeeCount: '', employeeCategories: '', estimatedAnnualPayroll: '', workplaceRiskDetails: '' });
  if (type === 'money-in-transit') Object.assign(base, { businessType: '', typicalAmountCarried: '', transitFrequency: 'weekly', securityArrangements: '', collectionDeliveryDetails: '', additionalNotes: '' });
  if (type === 'personal-accident') Object.assign(base, { occupation: '', desiredCoverageAmount: '', benefitPreferences: '', additionalInformation: '' });
  if (type === 'title-insurance') Object.assign(base, { propertyLocation: '', propertyType: '', transactionType: 'purchase', estimatedPropertyValue: '', applicantRole: 'buyer', additionalInformation: '' });
  return base;
}
