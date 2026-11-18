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
];

const optionalComprehensiveRows = [
  'Personal accident benefit cover',
  'Special windscreen cover',
  'Click & Go',
  'Free taxi allowance',
];

const freeTaxiDefaults: { match: (name: string) => boolean; text: string }[] = [
  {
    match: (name) => name.includes('lolc'),
    text: '3000 PER DAY UP TO MAXIMUM 10 DAYS\nEXCLUDING 1ST 2 DAYS',
  },
  {
    match: (name) => name.includes('sri lanka') || /\bslic\b/.test(name),
    text: '2000 PER DAY UP TO MAXIMUM 10 DAYS\nEXCLUDING AGENT REPAIR',
  },
  {
    match: (name) => name.includes('hnb'),
    text: '1500 PER DAY UP TO MAXIMUM 10 DAYS\nEXCLUDING 1ST 4 DAYS',
  },
];

export function freeTaxiDefault(insurer: string) {
  const name = insurer.trim().toLowerCase();
  return freeTaxiDefaults.find((item) => item.match(name))?.text ?? '';
}

function isFreeTaxiLabel(label: string) {
  return label.trim().toLowerCase() === 'free taxi allowance';
}

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
  'Co-operative Insurance',
  'Continental Insurance',
  'LOLC General Insurance',
  'HNB General Insurance',
  'Sri Lanka Insurance',
];

export function quotationInsurerName(name: string) {
  return name === 'Continental Life' ? 'Continental Insurance' : name;
}

export function needsLegalLiability(usage: string) {
  const value = usage.trim().toLowerCase();
  return value === 'hiring' || value === 'rent a car' || value === 'rent-a-car';
}

export function rowLabels(type: MotorCover, usage = '') {
  const base = type === 'motor' ? [...comprehensiveRows] : [...thirdPartyRows];
  if (!needsLegalLiability(usage)) return base;
  const without = base.filter((label) => label.trim().toLowerCase() !== 'legal liability');
  const towing = without.indexOf('Towing charges (LKR)');
  if (towing === -1) return [...without, 'Legal liability'];
  return [...without.slice(0, towing), 'Legal liability', ...without.slice(towing)];
}

export function rowsFor(type: MotorCover, insurers: string[], usage = ''): ComparisonRow[] {
  const rows = rowLabels(type, usage).map((label) => ({ label, values: insurers.map(() => '') }));
  if (type === 'motor') {
    for (const label of optionalComprehensiveRows) {
      rows.push({ label, values: insurers.map((insurer) => (isFreeTaxiLabel(label) ? freeTaxiDefault(insurer) : '')) });
    }
  }
  return rows;
}

export function arrangeQuotationRows(type: MotorCover, rows: ComparisonRow[], insurerCount: number, usage = ''): ComparisonRow[] {
  const pools = new Map<string, ComparisonRow[]>();
  for (const row of visibleQuotationRows(rows)) {
    const key = row.label.trim().toLowerCase();
    const list = pools.get(key) ?? [];
    list.push(row);
    pools.set(key, list);
  }
  const take = (label: string) => pools.get(label.trim().toLowerCase())?.shift();
  const fixed = rowLabels(type, usage).map((label) => take(label) ?? { label, values: blankValues(insurerCount) });
  const optional = type === 'motor'
    ? optionalComprehensiveRows.flatMap((label) => {
      const found = take(label);
      return found ? [found] : [];
    })
    : [];
  const rest = [...pools.values()].flat();
  return [...fixed, ...optional, ...rest];
}

export function fillEmptyTaxiDefaults(rows: ComparisonRow[], insurers: string[]): ComparisonRow[] {
  return rows.map((row) => {
    if (!isFreeTaxiLabel(row.label)) return row;
    return {
      ...row,
      values: insurers.map((insurer, index) => {
        const current = row.values[index] ?? '';
        return current.trim() ? current : freeTaxiDefault(insurer);
      }),
    };
  });
}

export function rowsForUsage(draft: MotorQuotationDraft): ComparisonRow[] {
  const source = draft.insuranceType === 'motor' && !needsLegalLiability(draft.usage)
    ? draft.rows.filter((row) => row.label.trim().toLowerCase() !== 'legal liability')
    : draft.rows;
  return arrangeQuotationRows(draft.insuranceType, source, draft.insurers.length, draft.usage);
}

export function isExtraClaim(type: MotorCover, index: number, usage = '') {
  return index >= rowLabels(type, usage).length;
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
      values: insurers.map((insurer, index) => {
        if (index < row.values.length) return row.values[index] ?? '';
        return isFreeTaxiLabel(row.label) ? freeTaxiDefault(insurer) : '';
      }),
    })),
  };
}

export function renameInsurer(draft: MotorQuotationDraft, index: number, nextName: string): MotorQuotationDraft {
  const previousDefault = freeTaxiDefault(draft.insurers[index] || '');
  const nextDefault = freeTaxiDefault(nextName);
  return {
    ...draft,
    insurers: draft.insurers.map((name, insurerIndex) => (insurerIndex === index ? nextName : name)),
    rows: draft.rows.map((row) => {
      if (!isFreeTaxiLabel(row.label)) return row;
      const current = row.values[index] ?? '';
      const keep = current.trim() !== '' && current !== previousDefault;
      return {
        ...row,
        values: row.values.map((value, valueIndex) => (valueIndex === index ? (keep ? value : nextDefault) : value)),
      };
    }),
  };
}
