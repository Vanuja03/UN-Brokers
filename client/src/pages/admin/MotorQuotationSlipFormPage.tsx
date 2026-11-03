import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';
import { downloadSlip } from './MotorQuotationSlipsPage';

type ValuedCover = { selected: boolean; value: string };

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
    pab: ValuedCover;
    ll: ValuedCover;
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
  { key: 'wci', label: 'WCI' },
  { key: 'pab', label: 'PAB' },
  { key: 'll', label: 'LL' },
  { key: 'tpd', label: 'TPD' },
  { key: 'hp', label: 'H/P' },
] as const;

const vehicleTypeLabels: Record<string, string> = {
  'private-car': 'Private car',
  motorcycle: 'Motorcycle',
  'three-wheeler': 'Three-wheeler',
  van: 'Van',
  lorry: 'Lorry',
  bus: 'Bus',
  other: 'Other',
};

const usageLabels: Record<string, string> = {
  private: 'Private',
  hiring: 'Hiring',
  'rent-a-car': 'Rent a car',
};

function blankCover(): ValuedCover {
  return { selected: false, value: '' };
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
      pab: blankCover(),
      ll: blankCover(),
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
  const usage = asText(details.vehicleUsage);
  draft.vehicleUsage = usageLabels[usage] || usage || draft.vehicleUsage;
  const type = asText(details.vehicleType);
  draft.vehicleType = vehicleTypeLabels[type] || type || draft.vehicleType;
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
          setDraft({
            ...blankSlip(),
            ...saved,
            covers: { ...blankSlip().covers, ...saved.covers },
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
        next.vehicleUsage = quotation.usage || '';
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
    for (const cover of tickValue) {
      if (values.covers[cover.key].selected && !values.covers[cover.key].value.trim()) errors[`covers.${cover.key}.value`] = 'Enter a value for this cover.';
    }
    const any = tickOnly.some((cover) => values.covers[cover.key]) || tickValue.some((cover) => values.covers[cover.key].selected);
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
        <Field label="Vehicle type" value={draft.vehicleType} error={fieldErrors.vehicleType} onChange={(value) => update({ vehicleType: value })} />
        <Field label="Vehicle usage" value={draft.vehicleUsage} error={fieldErrors.vehicleUsage} onChange={(value) => update({ vehicleUsage: value })} />
      </section>
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-lg font-bold">Covers</legend>
        <p className="mt-1 text-sm text-slate-600">Tick the covers the insurance company should quote. Towing charges, WCI, PAB, LL, TPD, and H/P also need a value.</p>
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
        </div>
      </fieldset>
      <button type="submit" className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={pending}>
        {pending ? 'Saving…' : 'Save and download PDF'}
      </button>
    </form>
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
