export type NonMotorSlipType = 'fire' | 'burglary' | 'workmen' | 'accident' | 'transit' | 'goods' | 'marine' | 'erection' | 'electronic' | 'medical' | 'crop';

export type SlipLine = { label: string; amount: string };
export type WorkerLine = { designation: string; count: string; salary: string };
export type CoverAmount = { key: string; amount: string };
export type MedicalLimit = { label: string; option1: string; option2: string; option3: string };
export type CropPlant = { age: string; coverage: string; count: string; value: string };

export const nonMotorSlipTypes: { value: NonMotorSlipType; label: string }[] = [
  { value: 'fire', label: 'Fire insurance' },
  { value: 'burglary', label: 'Burglary insurance' },
  { value: 'workmen', label: "Workmen's compensation insurance" },
  { value: 'accident', label: 'Personal accident insurance' },
  { value: 'transit', label: 'Money in transit insurance' },
  { value: 'goods', label: 'Goods in transit insurance' },
  { value: 'marine', label: 'Marine insurance' },
  { value: 'erection', label: 'Erection all risk insurance' },
  { value: 'electronic', label: 'Electronic all risk insurance' },
  { value: 'medical', label: 'Medical insurance' },
  { value: 'crop', label: 'Crop insurance' },
];

export const fireCoverOptions = [
  { key: 'fire', label: 'Fire' },
  { key: 'riot', label: 'Riot & Strike' },
  { key: 'terrorism', label: 'Terrorism Cover' },
  { key: 'malicious', label: 'Malicious Damage' },
  { key: 'explosion', label: 'Explosion' },
  { key: 'impact', label: 'Impact Damage' },
  { key: 'aircraft', label: 'Air Craft Damage' },
  { key: 'bursting', label: 'Bursting & Overflowing' },
  { key: 'spontaneous', label: 'Spontaneous Cover' },
  { key: 'cyclone', label: 'Cyclone, Storm & Tempest' },
  { key: 'flood', label: 'Flood' },
  { key: 'earthquake', label: 'Earthquake' },
  { key: 'natural', label: 'Other Natural Perils' },
  { key: 'electrical-burn', label: 'Electrical Fire (With Burn Mark)' },
  { key: 'electrical-no-burn', label: 'Electrical Fire (Without Burn Mark)' },
  { key: 'other', label: 'Other Special Perils' },
];

export const fireItemTemplate = [
  'On Building Including Permanent fixtures & fittings',
  'On Electrical Wiring System',
  'On Boundary Wall',
  'Swimming Pool (Motor & Filter system)',
  'On Office Equipment (Computers)',
  'Printers, Scanners & Barcode Readers',
  'On Other Electrical Equipment',
  'On Stock In Trade (Consisting Of Paper (Hazardous))',
  'On Furniture & equipment',
  'On Machinery',
  'On Removal Of Debris',
  "On Architects' Fee",
  'On 12 Month Rent',
];

export const workmenCoverOptions = [
  { key: 'riot', label: 'Riot & Strike Cover' },
  { key: 'terrorism', label: 'Terrorism Cover' },
  { key: 'three-day', label: '1st Three Day Cover' },
];

export const workmenDesignations = ['Managers', 'Carpenters', 'Helpers', 'Drivers'];

export const accidentCoverOptions = [
  { key: 'weekly', label: 'Weekly Benefit' },
  { key: 'tppd', label: 'TPPD' },
  { key: 'ttd', label: 'TTD' },
  { key: 'funeral', label: 'Funeral Expenses', valued: true },
  { key: 'riot', label: 'Riot & Strike Cover' },
  { key: 'terrorism', label: 'Terrorism Cover' },
  { key: 'motorcycle', label: 'Motor Cycle Cover' },
  { key: 'natural-death', label: 'Natural Death Cover', valued: true },
];

export const benefitOptions = ['Option 1', 'Option 2', 'Option 3'];

export const transitCoverOptions = [
  { key: 'riot', label: 'Riot & Strike Cover' },
  { key: 'terrorism', label: 'Terrorism Cover' },
  { key: 'infidelity', label: 'Infidelity Cover' },
];

export const transitItemTemplate = ['Maximum Transit', 'Estimated Annual Transit', 'Cash In Safe', 'Cash In Drawer'];

export const goodsCoverOptions = [
  { key: 'riot', label: 'Riot & Strike' },
  { key: 'terrorism', label: 'Terrorism Cover' },
];

export const marineCoverOptions = [
  { key: 'institute-a', label: 'Institute "A" Clause' },
  { key: 'war', label: 'Institute War Clause' },
  { key: 'riot', label: 'Institute Riot Clause' },
  { key: 'warehouse', label: 'Warehouse to Warehouse cover' },
  { key: 'fcl', label: 'FCL' },
];

export const erectionCoverOptions = [
  { key: 'riot', label: 'Riot & Strike' },
  { key: 'terrorism', label: 'Terrorism' },
  { key: 'inland', label: 'Inland Transit' },
];

export const erectionItemTemplate = [
  'Hydro Electric Equipment ( Invoice Attach herewith)',
  'Erection Work ( Quotation attach herewith)',
];

export const erectionLiabilityTemplate = ['Bodily', 'Property'];

export const electronicItemTemplate = ['PC (100), Server (1), Switches (6)', 'PABX & Accessories'];

export function blankCropPlants(count = 5): CropPlant[] {
  return Array.from({ length: count }, () => ({ age: '', coverage: '', count: '', value: '' }));
}

export const medicalCoverOptions = [
  { key: 'no-sub-limits', label: 'Premium Without Sub Limits' },
  { key: 'sub-limits', label: 'Premium with sub limits' },
  { key: 'family', label: 'Premium Family & Individual' },
  { key: 'no-excess', label: 'With Out Excess' },
  { key: 'eye-dental', label: 'Eye and Dental Cover' },
];

export const medicalLimitTemplate: MedicalLimit[] = [
  { label: 'Hospitalization', option1: '', option2: '', option3: '' },
  { label: 'OPD', option1: '', option2: '', option3: '' },
  { label: 'Spectacle', option1: '', option2: '', option3: '' },
];

export const burglaryItemTemplate = [
  'On Office equipment (Computers)',
  'Printers, Scanners & Barcode Readers',
  'On Other equipment',
  'On Stock In Trade (Consisting Of Paper (Hazardous))',
  'On Furniture & equipment',
  'On Machinery',
];

export function blankLines(labels: string[]): SlipLine[] {
  return labels.map((label) => ({ label, amount: '' }));
}

export function slipTypeLabel(value: string) {
  return nonMotorSlipTypes.find((item) => item.value === value)?.label || value;
}

export function amountTotal(rows: SlipLine[]) {
  let sum = 0;
  let any = false;
  for (const row of rows) {
    const cleaned = row.amount.replace(/,/g, '').replace(/rs\.?|lkr/gi, '').trim();
    if (!/^\d+(\.\d+)?$/.test(cleaned)) continue;
    sum += Number(cleaned);
    any = true;
  }
  if (!any) return '';
  return sum.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
