export const motorBenefitRows = [
  ['totalPremium', 'Total premium with taxes'],
  ['fireTheftAccident', 'Fire / theft / accidental damage'],
  ['maliciousAct', 'Malicious act'],
  ['floodNaturalPerils', 'Flood and natural perils'],
  ['airBagCover', 'Air bag cover'],
  ['thirdPartyInjury', 'Third party bodily injury'],
  ['thirdPartyProperty', 'Third party property damage (LKR)'],
  ['strikeRiot', 'Strike, riot and civil commotion'],
  ['terrorism', 'Terrorism'],
  ['towing', 'Towing charges (LKR)'],
  ['personalAccident', 'Personal accident benefit cover'],
  ['windscreen', 'Special windscreen cover'],
  ['taxiAllowance', 'Free taxi allowance'],
  ['clickAndGo', 'Click & Go'],
] as const;

export type MotorBenefitKey = (typeof motorBenefitRows)[number][0];

export type MotorInsurerColumn = {
  name: string;
  benefits: Record<MotorBenefitKey, string>;
};

export type MotorComparisonSheet = {
  _id?: string;
  referenceNumber?: string;
  customerName: string;
  quotationDate: string;
  vehicleNumber: string;
  leaseOrLoanNo: string;
  usage: string;
  yearOfManufacture: string;
  sumInsured: string;
  make: string;
  model: string;
  fuel: string;
  preparedByName: string;
  preparedByPhone: string;
  preparedByEmail: string;
  insurers: MotorInsurerColumn[];
};

export function emptyBenefits(): Record<MotorBenefitKey, string> {
  return Object.fromEntries(motorBenefitRows.map(([key]) => [key, ''])) as Record<MotorBenefitKey, string>;
}

export function emptyInsurer(name = ''): MotorInsurerColumn {
  return { name, benefits: emptyBenefits() };
}

export function blankSheet(preparedByName = '', preparedByEmail = ''): MotorComparisonSheet {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
  return {
    customerName: '',
    quotationDate: today,
    vehicleNumber: '',
    leaseOrLoanNo: '',
    usage: 'Private',
    yearOfManufacture: '',
    sumInsured: '',
    make: '',
    model: '',
    fuel: '',
    preparedByName,
    preparedByPhone: '',
    preparedByEmail,
    insurers: [emptyInsurer(), emptyInsurer(), emptyInsurer()],
  };
}
