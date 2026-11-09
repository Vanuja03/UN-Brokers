import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';
import { downloadSlip } from './MotorQuotationSlipsPage';

type ValuedCover = { selected: boolean; value: string };
type MultipliedCover = ValuedCover & { multiple: string };

type SlipDraft = {
  customerName: string;
  vehicleNumber: string;
  make: string;
  model: string;
  yearOfManufacture: string;
  vehicleType: string;
  vehicleUsage: string;
  covers: {
    basic: boolean;
    srcc: boolean;
    tc: boolean;
    flood: boolean;
    towing: ValuedCover;
    wci: ValuedCover;
    gt: ValuedCover;
    windscreen: ValuedCover;
    pab: MultipliedCover;
    ll: MultipliedCover;
    tpd: ValuedCover;
    hp: ValuedCover;
  };
  inquiryId: string;
  motorQuotationId: string;
};

const tickOnly = [
  { key: 'basic', label: 'Basic' },
  { key: 'srcc', label: 'SRCC' },
  { key: 'tc', label: 'TC' },
  { key: 'flood', label: 'Flood' },
] as const;

const tickValue = [
  { key: 'towing', label: 'Towing charges' },
] as const;

const wciOptions = [
  { value: 'driver', label: 'Driver' },
  { value: 'cleaner', label: 'Cleaner' },
];

const tickValueMid = [
  { key: 'gt', label: 'GT' },
  { key: 'windscreen', label: 'Special windscreen cover' },
] as const;

const tickTimes = [
  { key: 'pab', label: 'PAB' },
  { key: 'll', label: 'LL' },
] as const;

const tickValueAfter = [
  { key: 'tpd', label: 'TPD' },
  { key: 'hp', label: 'H/P' },
] as const;

const vehicleTypes = [
  { value: 'private-car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'three-wheeler', label: 'Three-wheeler' },
  { value: 'van', label: 'Van' },
  { value: 'lorry', label: 'Lorry' },
  { value: 'bus', label: 'Bus' },
  { value: 'prime-mover', label: 'Prime mover' },
  { value: 'other', label: 'Other' },
];

const usageTypes = [
  { value: 'private', label: 'Private' },
  { value: 'hiring', label: 'Hiring' },
  { value: 'rent-a-car', label: 'Rent a car' },
];

function listed(value: string, options: { value: string; label: string }[]) {
  const normalized = value.trim().toLowerCase() === 'private car' ? 'car' : value.trim().toLowerCase();
  const found = options.find((item) => item.label.toLowerCase() === normalized || item.value === normalized);
  return found?.label || '';
}

function blankCover(): ValuedCover {
  return { selected: false, value: '' };
}

function blankTimes(): MultipliedCover {
  return { selected: false, value: '', multiple: '' };
}

function blankSlip(): SlipDraft {
  return {
    customerName: '',
    vehicleNumber: '',
    make: '',
    model: '',
    yearOfManufacture: '',
    vehicleType: '',
    vehicleUsage: '',
    covers: {
      basic: false,
      srcc: false,
      tc: false,
      flood: false,
      towing: blankCover(),
      wci: blankCover(),
      gt: blankCover(),
      windscreen: blankCover(),
      pab: blankTimes(),
      ll: blankTimes(),
      tpd: blankCover(),
      hp: blankCover(),
    },
    inquiryId: '',
    motorQuotationId: '',
  };
}

function asText(value: unknown) {
  return value == null ? '' : String(value);
}

function applyInquiry(draft: SlipDraft, quote: { customerName?: string; insuranceDetails?: Record<string, unknown> }) {
  const details = quote.insuranceDetails || {};
  draft.customerName = quote.customerName || draft.customerName;
  draft.vehicleNumber = asText(details.registrationNumber) || draft.vehicleNumber;
  draft.make = asText(details.vehicleMake) || draft.make;
  draft.model = asText(details.vehicleModel) || draft.model;
  draft.yearOfManufacture = asText(details.yearOfManufacture) || draft.yearOfManufacture;
  draft.vehicleUsage = listed(asText(details.vehicleUsage), usageTypes) || draft.vehicleUsage;
  draft.vehicleType = listed(asText(details.vehicleType), vehicleTypes) || draft.vehicleType;
}

export function MotorQuotationSlipFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<SlipDraft | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id) {
        const response = await api.get(`/motor-quotation-slips/${id}`);
        const saved = response.data.data as SlipDraft & { inquiryId?: string | null; motorQuotationId?: string | null };
        if (!cancelled) {
          const base = blankSlip();
          setDraft({
            ...base,
            ...saved,
            vehicleType: listed(saved.vehicleType || '', vehicleTypes),
            vehicleUsage: listed(saved.vehicleUsage || '', usageTypes),
            covers: {
              ...base.covers,
              ...saved.covers,
              gt: { ...base.covers.gt, ...saved.covers?.gt },
              windscreen: { ...base.covers.windscreen, ...saved.covers?.windscreen },
              wci: { ...base.covers.wci, ...saved.covers?.wci, value: listed(saved.covers?.wci?.value || '', wciOptions) },
              pab: { ...base.covers.pab, ...saved.covers?.pab },
              ll: { ...base.covers.ll, ...saved.covers?.ll },
            },
            inquiryId: saved.inquiryId || '',
            motorQuotationId: saved.motorQuotationId || '',
          });
        }
        return;
      }
      const next = blankSlip();
      const quotationId = search.get('quotation') || '';
      const inquiryId = search.get('inquiry') || '';
      if (quotationId) {
        const response = await api.get(`/motor-quotations/${quotationId}`);
        const quotation = response.data.data as {
          customerName?: string;
          vehicleNumber?: string;
          make?: string;
          model?: string;
          yearOfManufacture?: string;
          usage?: string;
          inquiryId?: string | null;
        };
        next.customerName = quotation.customerName || '';
        next.vehicleNumber = quotation.vehicleNumber || '';
        next.make = quotation.make || '';
        next.model = quotation.model || '';
        next.yearOfManufacture = quotation.yearOfManufacture || '';
        next.vehicleUsage = listed(quotation.usage || '', usageTypes);
        next.motorQuotationId = quotationId;
        if (quotation.inquiryId) {
          next.inquiryId = quotation.inquiryId;
          const inquiry = await api.get(`/quotes/${quotation.inquiryId}`);
          const quote = inquiry.data.data as { insuranceType?: string; customerName?: string; insuranceDetails?: Record<string, unknown> };
          if (quote.insuranceType === 'motor' || quote.insuranceType === 'motor-third-party') applyInquiry(next, quote);
        }
      } else if (inquiryId) {
        const inquiry = await api.get(`/quotes/${inquiryId}`);
        const quote = inquiry.data.data as { insuranceType?: string; customerName?: string; insuranceDetails?: Record<string, unknown> };
        if (quote.insuranceType !== 'motor' && quote.insuranceType !== 'motor-third-party') {
          throw new Error('A quotation slip can only be prepared for a motor inquiry.');
        }
        next.inquiryId = inquiryId;
        applyInquiry(next, quote);
      }
      if (!cancelled) setDraft(next);
    }
    load().catch((err: unknown) => {
      if (cancelled) return;
      const plain = err instanceof Error && !('isAxiosError' in err) ? err.message : '';
      setError(plain || getErrorMessage(err, 'The quotation slip could not be opened.'));
    });
    return () => {
      cancelled = true;
    };
  }, [id, search]);

  function update(patch: Partial<SlipDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function localErrors(values: SlipDraft) {
    const errors: Record<string, string> = {};
    const required: [keyof SlipDraft, string][] = [
      ['customerName', 'customerName'],
      ['vehicleNumber', 'vehicleNumber'],
      ['make', 'make'],
      ['model', 'model'],
      ['yearOfManufacture', 'yearOfManufacture'],
      ['vehicleType', 'vehicleType'],
      ['vehicleUsage', 'vehicleUsage'],
    ];
    for (const [key] of required) {
      if (!String(values[key]).trim()) errors[key] = 'This field is required.';
    }
    if (!errors.yearOfManufacture) {
      const year = values.yearOfManufacture.trim();
      const current = new Date().getFullYear() + 1;
      if (!/^\d{4}$/.test(year) || Number(year) < 1950 || Number(year) > current) errors.yearOfManufacture = 'Enter a valid four-digit year.';
    }
    for (const cover of [...tickValue, ...tickValueMid, ...tickValueAfter]) {
      if (values.covers[cover.key].selected && !values.covers[cover.key].value.trim()) errors[`covers.${cover.key}.value`] = 'Enter a value for this cover.';
    }
    if (values.covers.wci.selected && !wciOptions.some((option) => option.label === values.covers.wci.value)) {
      errors['covers.wci.value'] = 'Choose driver or cleaner.';
    }
    for (const cover of tickTimes) {
      if (!values.covers[cover.key].selected) continue;
      if (!values.covers[cover.key].value.trim()) errors[`covers.${cover.key}.value`] = 'Enter a value for this cover.';
      if (!values.covers[cover.key].multiple.trim()) errors[`covers.${cover.key}.multiple`] = 'Enter the multiplication.';
    }
    const any = tickOnly.some((cover) => values.covers[cover.key])
      || values.covers.wci.selected
      || [...tickValue, ...tickValueMid, ...tickValueAfter].some((cover) => values.covers[cover.key].selected)
      || tickTimes.some((cover) => values.covers[cover.key].selected);
    if (!any) errors['covers.basic'] = 'Tick at least one cover.';
    return errors;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const found = localErrors(draft);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      setError('Please check the highlighted information and try again.');
      return;
    }
    setPending(true);
    setError('');
    setFieldErrors({});
    let saved: { _id: string; referenceNumber: string; vehicleNumber: string } | null = null;
    try {
      const response = id
        ? await api.patch(`/motor-quotation-slips/${id}`, draft)
        : await api.post('/motor-quotation-slips', draft);
      saved = response.data.data;
    } catch (err) {
      const nextErrors: Record<string, string> = {};
      for (const item of getFieldErrors(err)) nextErrors[item.field] = item.message;
      setFieldErrors(nextErrors);
      setError(getErrorMessage(err, 'The quotation slip could not be saved.'));
      setPending(false);
      return;
    }
    try {
      if (saved) await downloadSlip(saved._id, saved.referenceNumber, saved.vehicleNumber);
    } catch {
      setError('The slip was saved, but the PDF could not be downloaded. Use Download PDF from the list.');
    } finally {
      setPending(false);
    }
    if (saved && !id) navigate(`/admin/motor-quotations/slips/${saved._id}`, { replace: true });
  }

  if (error && !draft) return <p role="alert">{error}</p>;
  if (!draft) return <p>Loading quotation slip…</p>;

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6" noValidate>
      <Link to="/admin/motor-quotations/slips" className="text-sm font-semibold underline">All quotation slips</Link>
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Edit quotation slip' : 'New quotation slip'}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Fill the vehicle details and tick the covers to request from the insurance company. Saving downloads the PDF, named with the vehicle number.</p>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Field label="Customer name" value={draft.customerName} error={fieldErrors.customerName} onChange={(value) => update({ customerName: value })} />
        <Field label="Vehicle no" value={draft.vehicleNumber} error={fieldErrors.vehicleNumber} onChange={(value) => update({ vehicleNumber: value })} />
        <Field label="Make" value={draft.make} error={fieldErrors.make} onChange={(value) => update({ make: value })} />
        <Field label="Model" value={draft.model} error={fieldErrors.model} onChange={(value) => update({ model: value })} />
        <Field label="Manufacturing year" value={draft.yearOfManufacture} error={fieldErrors.yearOfManufacture} inputMode="numeric" onChange={(value) => update({ yearOfManufacture: value })} />
        <SelectField label="Vehicle type" value={draft.vehicleType} options={vehicleTypes.map((item) => item.label)} error={fieldErrors.vehicleType} onChange={(value) => update({ vehicleType: value })} />
        <SelectField label="Vehicle usage" value={draft.vehicleUsage} options={usageTypes.map((item) => item.label)} error={fieldErrors.vehicleUsage} onChange={(value) => update({ vehicleUsage: value })} />
      </section>
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-lg font-bold">Covers</legend>
        <p className="mt-1 text-sm text-slate-600">Tick the covers the insurance company should quote. WCI is Driver or Cleaner. Towing charges, GT, special windscreen cover, TPD, and H/P need a value. PAB and LL also need a multiplication.</p>
        {fieldErrors['covers.basic'] ? <p className="mt-2 text-sm text-red-700">{fieldErrors['covers.basic']}</p> : null}
        <div className="mt-4 grid gap-3">
          {tickOnly.map((cover) => (
            <label key={cover.key} className="flex items-center gap-3 text-sm font-medium text-navy-900">
              <input
                type="checkbox"
                checked={draft.covers[cover.key]}
                onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: event.target.checked } })}
              />
              {cover.label}
            </label>
          ))}
          {tickValue.map((cover) => {
            const current = draft.covers[cover.key];
            const valueError = fieldErrors[`covers.${cover.key}.value`];
            return (
              <div key={cover.key} className="grid items-center gap-3 sm:grid-cols-[12rem_1fr]">
                <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={current.selected}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { selected: event.target.checked, value: event.target.checked ? current.value : '' } } })}
                  />
                  {cover.label}
                </label>
                <label className="text-sm font-medium text-navy-900">
                  <span className="sr-only">{cover.label} value</span>
                  <input
                    className="field"
                    value={current.value}
                    disabled={!current.selected}
                    placeholder={current.selected ? 'Value' : ''}
                    aria-invalid={valueError ? true : undefined}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { ...current, value: event.target.value } } })}
                  />
                  {valueError ? <span className="mt-1 block text-sm text-red-700">{valueError}</span> : null}
                </label>
              </div>
            );
          })}
          <div className="grid items-center gap-3 sm:grid-cols-[12rem_1fr]">
            <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
              <input
                type="checkbox"
                checked={draft.covers.wci.selected}
                onChange={(event) => update({ covers: { ...draft.covers, wci: { selected: event.target.checked, value: event.target.checked ? draft.covers.wci.value : '' } } })}
              />
              WCI
            </label>
            <label className="text-sm font-medium text-navy-900">
              <span className="sr-only">WCI value</span>
              <select
                className="field"
                value={draft.covers.wci.value}
                disabled={!draft.covers.wci.selected}
                aria-invalid={fieldErrors['covers.wci.value'] ? true : undefined}
                onChange={(event) => update({ covers: { ...draft.covers, wci: { ...draft.covers.wci, value: event.target.value } } })}
              >
                <option value="">Select</option>
                {wciOptions.map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
              </select>
              {fieldErrors['covers.wci.value'] ? <span className="mt-1 block text-sm text-red-700">{fieldErrors['covers.wci.value']}</span> : null}
            </label>
          </div>
          {tickValueMid.map((cover) => {
            const current = draft.covers[cover.key];
            const valueError = fieldErrors[`covers.${cover.key}.value`];
            return (
              <div key={cover.key} className="grid items-center gap-3 sm:grid-cols-[16rem_1fr]">
                <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={current.selected}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { selected: event.target.checked, value: event.target.checked ? current.value : '' } } })}
                  />
                  {cover.label}
                </label>
                <label className="text-sm font-medium text-navy-900">
                  <span className="sr-only">{cover.label} value</span>
                  <input
                    className="field"
                    value={current.value}
                    disabled={!current.selected}
                    placeholder={current.selected ? 'Value' : ''}
                    aria-invalid={valueError ? true : undefined}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { ...current, value: event.target.value } } })}
                  />
                  {valueError ? <span className="mt-1 block text-sm text-red-700">{valueError}</span> : null}
                </label>
              </div>
            );
          })}
          {tickTimes.map((cover) => {
            const current = draft.covers[cover.key];
            const valueError = fieldErrors[`covers.${cover.key}.value`];
            const multipleError = fieldErrors[`covers.${cover.key}.multiple`];
            return (
              <div key={cover.key} className="grid items-start gap-3 sm:grid-cols-[12rem_1fr_auto_8rem]">
                <label className="flex items-center gap-3 pt-2 text-sm font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={current.selected}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { selected: event.target.checked, value: event.target.checked ? current.value : '', multiple: event.target.checked ? current.multiple : '' } } })}
                  />
                  {cover.label}
                </label>
                <label className="text-sm font-medium text-navy-900">
                  <span className="sr-only">{cover.label} value</span>
                  <input
                    className="field"
                    value={current.value}
                    disabled={!current.selected}
                    placeholder={current.selected ? 'Value' : ''}
                    aria-invalid={valueError ? true : undefined}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { ...current, value: event.target.value } } })}
                  />
                  {valueError ? <span className="mt-1 block text-sm text-red-700">{valueError}</span> : null}
                </label>
                <span className="pt-2 text-lg font-semibold text-navy-900" aria-hidden>×</span>
                <label className="text-sm font-medium text-navy-900">
                  <span className="sr-only">{cover.label} multiplication</span>
                  <input
                    className="field"
                    value={current.multiple}
                    disabled={!current.selected}
                    placeholder={current.selected ? '×' : ''}
                    aria-invalid={multipleError ? true : undefined}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { ...current, multiple: event.target.value } } })}
                  />
                  {multipleError ? <span className="mt-1 block text-sm text-red-700">{multipleError}</span> : null}
                </label>
              </div>
            );
          })}
          {tickValueAfter.map((cover) => {
            const current = draft.covers[cover.key];
            const valueError = fieldErrors[`covers.${cover.key}.value`];
            return (
              <div key={cover.key} className="grid items-center gap-3 sm:grid-cols-[12rem_1fr]">
                <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={current.selected}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { selected: event.target.checked, value: event.target.checked ? current.value : '' } } })}
                  />
                  {cover.label}
                </label>
                <label className="text-sm font-medium text-navy-900">
                  <span className="sr-only">{cover.label} value</span>
                  <input
                    className="field"
                    value={current.value}
                    disabled={!current.selected}
                    placeholder={current.selected ? 'Value' : ''}
                    aria-invalid={valueError ? true : undefined}
                    onChange={(event) => update({ covers: { ...draft.covers, [cover.key]: { ...current, value: event.target.value } } })}
                  />
                  {valueError ? <span className="mt-1 block text-sm text-red-700">{valueError}</span> : null}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
      <button type="submit" className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={pending}>
        {pending ? 'Saving…' : 'Save and download PDF'}
      </button>
    </form>
  );
}

function SelectField({ label, value, options, onChange, error }: { label: string; value: string; options: string[]; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <select className="field mt-1.5" value={value} aria-invalid={error ? true : undefined} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function Field({ label, value, onChange, error, inputMode }: { label: string; value: string; onChange: (value: string) => void; error?: string; inputMode?: 'numeric' }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <input className="field mt-1.5" value={value} inputMode={inputMode} aria-invalid={error ? true : undefined} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
