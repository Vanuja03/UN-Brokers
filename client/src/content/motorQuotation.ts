export type MotorCover = 'motor' | 'motor-third-party';

export type ComparisonRow = { label: string; values: string[] };

export type MotorQuotationDraft = {
  insuranceType: MotorCover;
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
  rows: ComparisonRow[];
  inquiryId?: string;
};

const comprehensiveRows = [
  'Total premium with taxes',
  'Fire / theft / accidental damage',
  'Malicious act',
  'Flood and natural perils',
  'Air bag cover',
  'Third party bodily injury',
  'Third party property damage (LKR)',
  'Strike, riot and civil commotion',
  'Terrorism',
  'Towing charges (LKR)',
  'Personal accident benefit cover',
  'Special windscreen cover',
  'Free taxi allowance',
  'Click & Go',
];

const thirdPartyRows = [
  'Total premium with taxes',
  'Third party bodily injury',
  'Third party property damage (LKR)',
  'Legal liability',
  'Personal accident benefit cover',
  'Towing charges (LKR)',
  'Passenger cover',
];

export const defaultInsurers = [
  'Fairfirst Insurance',
  'Continental Insurance',
  'LOLC General Insurance',
  'HNB General Insurance',
  'Sri Lanka Insurance',
];

export function rowLabels(type: MotorCover) {
  return type === 'motor' ? comprehensiveRows : thirdPartyRows;
}

export function blankQuotation(type: MotorCover, preparedBy = ''): MotorQuotationDraft {
  const insurers = [...defaultInsurers];
  return {
    insuranceType: type,
    quotationDate: new Date().toISOString().slice(0, 10),
    customerName: '',
    vehicleNumber: '',
    leaseOrLoanNo: '',
    usage: '',
    yearOfManufacture: '',
    sumInsured: '',
    make: '',
    model: '',
    fuel: '',
    preparedBy,
    preparedByPhone: '',
    preparedByEmail: '',
    insurers,
    rows: rowLabels(type).map((label) => ({ label, values: insurers.map(() => '') })),
  };
}

export function resizeInsurers(draft: MotorQuotationDraft, insurers: string[]): MotorQuotationDraft {
  return {
    ...draft,
    insurers,
    rows: draft.rows.map((row) => ({
      label: row.label,
      values: insurers.map((_, index) => row.values[index] ?? ''),
    })),
  };
}
