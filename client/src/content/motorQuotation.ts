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
  'Flood and natural perils',
  'Strike, riot and civil commotion',
  'Terrorism',
  'Air bag cover',
  'Third party bodily injury',
  'Third party property damage (LKR)',
  'Towing charges (LKR)',
  'Free taxi allowance',
];

const optionalComprehensiveRows = [
  'Personal accident benefit cover',
  'Special windscreen cover',
  'Click & Go',
];

export const yesNoBenefitLabels = [
  'Fire / theft / accidental damage',
  'Flood and natural perils',
  'Strike, riot and civil commotion',
  'Terrorism',
] as const;

const yesNoBenefitSet = new Set<string>(yesNoBenefitLabels);

export function isYesNoBenefit(label: string) {
  return yesNoBenefitSet.has(label);
}

export function visibleQuotationRows<T extends { label: string }>(rows: T[]) {
  return rows.filter((row) => row.label.trim().toLowerCase() !== 'malicious act');
}

function blankValues(count: number) {
  return Array.from({ length: count }, () => '');
}

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

export function rowsFor(type: MotorCover, insurers: string[]): ComparisonRow[] {
  const rows = rowLabels(type).map((label) => ({ label, values: insurers.map(() => '') }));
  if (type === 'motor') {
    for (const label of optionalComprehensiveRows) rows.push({ label, values: insurers.map(() => '') });
  }
  return rows;
}

export function arrangeQuotationRows(type: MotorCover, rows: ComparisonRow[], insurerCount: number): ComparisonRow[] {
  const pools = new Map<string, ComparisonRow[]>();
  for (const row of visibleQuotationRows(rows)) {
    const key = row.label.trim().toLowerCase();
    const list = pools.get(key) ?? [];
    list.push(row);
    pools.set(key, list);
  }
  const take = (label: string) => pools.get(label.trim().toLowerCase())?.shift();
  const fixed = rowLabels(type).map((label) => take(label) ?? { label, values: blankValues(insurerCount) });
  const optional = type === 'motor'
    ? optionalComprehensiveRows.flatMap((label) => {
      const found = take(label);
      return found ? [found] : [];
    })
    : [];
  const rest = [...pools.values()].flat();
  return [...fixed, ...optional, ...rest];
}

export function isExtraClaim(type: MotorCover, index: number) {
  return index >= rowLabels(type).length;
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
    rows: rowsFor(type, insurers),
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
