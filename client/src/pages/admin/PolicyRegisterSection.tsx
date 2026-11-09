import { useEffect, useState, type FormEvent } from 'react';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';

type PolicyStatus = 'ren' | 'new' | 'refund' | 'additional';

const statusOptions: { value: PolicyStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'ren', label: 'Ren' },
  { value: 'refund', label: 'Refund' },
  { value: 'additional', label: 'Additional' },
];

type RegisteredPolicy = {
  _id: string;
  entryDate: string;
  riskDate: string;
  debitNoteNo: string;
  customerName: string;
  postalAddress: string;
  sumInsured: number;
  policyNumber: string;
  renewalDate: string;
  vehicleNumber: string;
  premiumNet: number;
  premiumRcc: number;
  premiumTc: number;
  premiumIncludingTax: number;
  netCommissionRate?: number;
  rccCommissionRate?: number;
  tcCommissionRate?: number;
  basicCommission: number;
  rccCommission: number;
  tcCommission: number;
  insuranceCompany: string;
  salesPerson: string;
  agentCode: string;
  special: PolicyStatus;
  telephone: string;
  unSalesPerson: string;
  commissionReceived?: boolean;
  commissionReference?: string;
  commissionReceivedDate?: string | null;
};

type FormState = {
  entryDate: string;
  riskDate: string;
  debitNoteNo: string;
  customerName: string;
  postalAddress: string;
  sumInsured: string;
  policyNumber: string;
  renewalDate: string;
  vehicleNumber: string;
  premiumNet: string;
  premiumRcc: string;
  premiumTc: string;
  premiumIncludingTax: string;
  netCommissionRate: string;
  rccCommissionRate: string;
  tcCommissionRate: string;
  insuranceCompany: string;
  salesPerson: string;
  agentCode: string;
  special: PolicyStatus;
  telephone: string;
  unSalesPerson: string;
  commissionReceived: boolean;
  commissionReference: string;
  commissionReceivedDate: string;
};

const blank: FormState = {
  entryDate: '',
  riskDate: '',
  debitNoteNo: '',
  customerName: '',
  postalAddress: '',
  sumInsured: '',
  policyNumber: '',
  renewalDate: '',
  vehicleNumber: '',
  premiumNet: '',
  premiumRcc: '',
  premiumTc: '',
  premiumIncludingTax: '',
  netCommissionRate: '13',
  rccCommissionRate: '5',
  tcCommissionRate: '5',
  insuranceCompany: '',
  salesPerson: '',
  agentCode: '',
  special: 'new',
  telephone: '',
  unSalesPerson: '',
  commissionReceived: false,
  commissionReference: '',
  commissionReceivedDate: '',
};

const requiredFields: (keyof FormState)[] = [
  'entryDate', 'riskDate', 'customerName', 'postalAddress', 'sumInsured', 'policyNumber', 'renewalDate', 'vehicleNumber', 'premiumNet', 'premiumIncludingTax', 'insuranceCompany',
];

const amountFields = ['sumInsured', 'premiumNet', 'premiumRcc', 'premiumTc', 'premiumIncludingTax'] as const;
const rateFields = ['netCommissionRate', 'rccCommissionRate', 'tcCommissionRate'] as const;

function day(value: string) {
  return value ? value.slice(0, 10) : '';
}

function money(value: number) {
  return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

function amount(value: string) {
  const cleaned = value.trim().replace(/,/g, '').replace(/^(?:rs\.?|lkr)\s*/i, '');
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function commission(value: string, rate: number) {
  const parsed = amount(value);
  if (parsed == null) return '0.00';
  if (Number.isNaN(parsed)) return '—';
  return money(Math.round((Math.round(parsed * 100) * rate) / 100) / 100);
}

function rateNumber(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function validate(values: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  for (const key of requiredFields) {
    const value = values[key];
    if (typeof value !== 'string' || !value.trim()) errors[key] = 'This field is required.';
  }
  if (!statusOptions.some((option) => option.value === values.special)) errors.special = 'Choose a policy status.';
  for (const key of amountFields) {
    if (errors[key]) continue;
    const parsed = amount(values[key]);
    const optional = key === 'premiumRcc' || key === 'premiumTc';
    if (parsed == null) {
      if (!optional) errors[key] = 'This field is required.';
    } else if (Number.isNaN(parsed)) errors[key] = 'Enter a valid amount.';
    else if (parsed > 1_000_000_000) errors[key] = 'Amount is too large.';
  }
  for (const key of rateFields) {
    const parsed = rateNumber(values[key]);
    if (parsed == null) errors[key] = 'Enter a rate.';
    else if (Number.isNaN(parsed)) errors[key] = 'Enter a valid rate.';
    else if (parsed > 100) errors[key] = 'Enter a rate up to 100.';
  }
  if (values.commissionReceived) {
    if (!values.commissionReference.trim()) errors.commissionReference = 'Enter the BR or NIC.';
    if (!values.commissionReceivedDate) errors.commissionReceivedDate = 'Enter the received date.';
  }
  if (!errors.telephone && values.telephone.trim() && !/^\+?[0-9]{9,15}$/.test(values.telephone.replace(/[\s()-]/g, ''))) {
    errors.telephone = 'Enter a valid telephone number.';
  }
  return errors;
}

function toForm(row: RegisteredPolicy): FormState {
  return {
    entryDate: day(row.entryDate),
    riskDate: day(row.riskDate),
    debitNoteNo: row.debitNoteNo || '',
    customerName: row.customerName,
    postalAddress: row.postalAddress || '',
    sumInsured: String(row.sumInsured ?? ''),
    policyNumber: row.policyNumber,
    renewalDate: day(row.renewalDate),
    vehicleNumber: row.vehicleNumber,
    premiumNet: String(row.premiumNet ?? ''),
    premiumRcc: String(row.premiumRcc ?? ''),
    premiumTc: String(row.premiumTc ?? ''),
    premiumIncludingTax: String(row.premiumIncludingTax ?? ''),
    netCommissionRate: String(row.netCommissionRate ?? 13),
    rccCommissionRate: String(row.rccCommissionRate ?? 5),
    tcCommissionRate: String(row.tcCommissionRate ?? 5),
    insuranceCompany: row.insuranceCompany || '',
    salesPerson: row.salesPerson || '',
    agentCode: row.agentCode || '',
    special: row.special,
    telephone: row.telephone || '',
    unSalesPerson: row.unSalesPerson || '',
    commissionReceived: row.commissionReceived === true,
    commissionReference: row.commissionReference || '',
    commissionReceivedDate: day(row.commissionReceivedDate || ''),
  };
}

function statusLabel(value: PolicyStatus) {
  return statusOptions.find((option) => option.value === value)?.label || value;
}

export function PolicyRegisterSection() {
  const [rows, setRows] = useState<RegisteredPolicy[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  function load(nextSearch = search) {
    return api.get('/policy-registers', { params: { search: nextSearch } }).then((response) => setRows(response.data.data));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => setError('Registered policies could not be loaded.'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function startAdd() {
    setEditingId(null);
    setForm(blank);
    setError('');
    setFieldErrors({});
    setShowForm(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      setError('Please check the highlighted information and try again.');
      return;
    }
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editingId) await api.patch(`/policy-registers/${editingId}`, form);
      else await api.post('/policy-registers', form);
      setShowForm(false);
      setForm(blank);
      setEditingId(null);
      await load();
    } catch (saveError) {
      const nextErrors: Partial<Record<keyof FormState, string>> = {};
      for (const item of getFieldErrors(saveError)) {
        if (item.field in form) nextErrors[item.field as keyof FormState] = item.message;
      }
      setFieldErrors(nextErrors);
      setError(getErrorMessage(saveError, 'The policy could not be registered.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: RegisteredPolicy) {
    if (!window.confirm(`Delete registered policy ${row.policyNumber}?`)) return;
    setError('');
    try {
      await api.delete(`/policy-registers/${row._id}`);
      if (editingId === row._id) {
        setShowForm(false);
        setEditingId(null);
      }
      await load();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'The registered policy could not be deleted.'));
    }
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Policy register</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Motor policies registered from the sheet columns. Commission starts at premium net × 13%, RCC × 5%, and TC × 5%. Change a rate when this policy uses a different one.</p>
        </div>
        <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" onClick={startAdd}>Register new policy</button>
      </div>
      <input className="field mt-4" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search policy no, vehicle no, name, telephone, or debit note" aria-label="Search registered policies" />
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}

      {showForm ? (
        <form className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3" noValidate onSubmit={(event) => void save(event)}>
          <h3 className="sm:col-span-2 xl:col-span-3 text-lg font-bold">{editingId ? 'Edit registered policy' : 'Register new policy'}</h3>
          <Field name="entryDate" label="Date" type="date" value={form.entryDate} error={fieldErrors.entryDate} onChange={(value) => update('entryDate', value)} required />
          <Field name="riskDate" label="Risk date" type="date" value={form.riskDate} error={fieldErrors.riskDate} onChange={(value) => update('riskDate', value)} required />
          <Field name="renewalDate" label="Renewal date" type="date" value={form.renewalDate} error={fieldErrors.renewalDate} onChange={(value) => update('renewalDate', value)} required />
          <Field name="debitNoteNo" label="Debit note no" value={form.debitNoteNo} error={fieldErrors.debitNoteNo} onChange={(value) => update('debitNoteNo', value)} />
          <Field name="customerName" label="Customer name" value={form.customerName} error={fieldErrors.customerName} onChange={(value) => update('customerName', value)} required />
          <label className="text-sm font-medium text-navy-900 sm:col-span-2">Postal address
            <textarea className="field mt-1.5" rows={2} required value={form.postalAddress} aria-invalid={fieldErrors.postalAddress ? true : undefined} onChange={(event) => update('postalAddress', event.target.value)} />
            {fieldErrors.postalAddress ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.postalAddress}</span> : null}
          </label>
          <Field name="sumInsured" label="Sum insured" value={form.sumInsured} error={fieldErrors.sumInsured} inputMode="decimal" onChange={(value) => update('sumInsured', value)} required />
          <Field name="policyNumber" label="Policy no" value={form.policyNumber} error={fieldErrors.policyNumber} onChange={(value) => update('policyNumber', value)} required />
          <Field name="vehicleNumber" label="Vehicle no" value={form.vehicleNumber} error={fieldErrors.vehicleNumber} onChange={(value) => update('vehicleNumber', value)} required />
          <Field name="premiumNet" label="Premium net" value={form.premiumNet} error={fieldErrors.premiumNet} inputMode="decimal" onChange={(value) => update('premiumNet', value)} required />
          <Field name="premiumRcc" label="Premium RCC" value={form.premiumRcc} error={fieldErrors.premiumRcc} inputMode="decimal" onChange={(value) => update('premiumRcc', value)} />
          <Field name="premiumTc" label="Premium TC" value={form.premiumTc} error={fieldErrors.premiumTc} inputMode="decimal" onChange={(value) => update('premiumTc', value)} />
          <Field name="premiumIncludingTax" label="Premium including tax" value={form.premiumIncludingTax} error={fieldErrors.premiumIncludingTax} inputMode="decimal" onChange={(value) => update('premiumIncludingTax', value)} required />
          <Field name="netCommissionRate" label="Net commission rate %" value={form.netCommissionRate} error={fieldErrors.netCommissionRate} inputMode="decimal" onChange={(value) => update('netCommissionRate', value)} required />
          <Field name="rccCommissionRate" label="RCC commission rate %" value={form.rccCommissionRate} error={fieldErrors.rccCommissionRate} inputMode="decimal" onChange={(value) => update('rccCommissionRate', value)} required />
          <Field name="tcCommissionRate" label="TC commission rate %" value={form.tcCommissionRate} error={fieldErrors.tcCommissionRate} inputMode="decimal" onChange={(value) => update('tcCommissionRate', value)} required />
          <Readout label="Commission" value={commission(form.premiumNet, rateNumber(form.netCommissionRate) || 0)} />
          <Readout label="RCC commission" value={commission(form.premiumRcc, rateNumber(form.rccCommissionRate) || 0)} />
          <Readout label="TC commission" value={commission(form.premiumTc, rateNumber(form.tcCommissionRate) || 0)} />
          <Field name="insuranceCompany" label="Insurance company" value={form.insuranceCompany} error={fieldErrors.insuranceCompany} onChange={(value) => update('insuranceCompany', value)} required />
          <Field name="salesPerson" label="Sales person" value={form.salesPerson} error={fieldErrors.salesPerson} onChange={(value) => update('salesPerson', value)} />
          <Field name="agentCode" label="Broker code" value={form.agentCode} error={fieldErrors.agentCode} onChange={(value) => update('agentCode', value)} />
          <label className="text-sm font-medium text-navy-900">Policy status
            <select className="field mt-1.5" value={form.special} aria-invalid={fieldErrors.special ? true : undefined} onChange={(event) => update('special', event.target.value as PolicyStatus)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldErrors.special ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.special}</span> : null}
          </label>
          <Field name="telephone" label="Telephone no" value={form.telephone} error={fieldErrors.telephone} onChange={(value) => update('telephone', value)} />
          <Field name="unSalesPerson" label="UN sales person" value={form.unSalesPerson} error={fieldErrors.unSalesPerson} onChange={(value) => update('unSalesPerson', value)} />
          <fieldset className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:col-span-2 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
            <legend className="px-1 text-sm font-semibold text-navy-900">Commission received</legend>
            <label className="flex items-center gap-2 text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">
              <input type="checkbox" checked={form.commissionReceived} onChange={(event) => update('commissionReceived', event.target.checked)} />
              Commission received
            </label>
            <Field name="commissionReference" label="BR or NIC" value={form.commissionReference} error={fieldErrors.commissionReference} onChange={(value) => update('commissionReference', value)} required={form.commissionReceived} />
            <Field name="commissionReceivedDate" label="Received date" type="date" value={form.commissionReceivedDate} error={fieldErrors.commissionReceivedDate} onChange={(value) => update('commissionReceivedDate', value)} required={form.commissionReceived} />
          </fieldset>
          <div className="flex gap-3 sm:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Save policy'}</button>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[120rem] w-full text-left text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              {['Date', 'Risk date', 'Renewal date', 'Debit note no', 'Customer', 'Postal address', 'Sum insured', 'Policy no', 'Vehicle no', 'Premium net', 'Premium RCC', 'Premium TC', 'Premium incl. tax', 'Commission', 'RCC commission', 'TC commission', 'Insurer', 'Sales person', 'Broker code', 'Policy status', 'Telephone', 'UN sales person', 'Commission received', 'BR or NIC', 'Received date', 'Actions'].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3 py-2 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-600" colSpan={26}>{search ? 'No registered policies match this search.' : 'No registered policies yet.'}</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-200 align-top">
                <td className="whitespace-nowrap px-3 py-2">{day(row.entryDate)}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.riskDate)}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.renewalDate)}</td>
                <td className="px-3 py-2">{row.debitNoteNo}</td>
                <td className="px-3 py-2">{row.customerName}</td>
                <td className="max-w-48 px-3 py-2">{row.postalAddress}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.sumInsured)}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold">{row.policyNumber}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.vehicleNumber}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.premiumNet)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.premiumRcc)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.premiumTc)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.premiumIncludingTax)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.basicCommission)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.rccCommission)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.tcCommission)}</td>
                <td className="px-3 py-2">{row.insuranceCompany}</td>
                <td className="px-3 py-2">{row.salesPerson}</td>
                <td className="px-3 py-2">{row.agentCode}</td>
                <td className="px-3 py-2">{statusLabel(row.special)}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.telephone}</td>
                <td className="px-3 py-2">{row.unSalesPerson}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.commissionReceived ? 'Received' : 'Not received'}</td>
                <td className="px-3 py-2">{row.commissionReference}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.commissionReceivedDate || '')}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button type="button" className="font-semibold text-navy-900 underline" onClick={() => { setEditingId(row._id); setForm(toForm(row)); setFieldErrors({}); setShowForm(true); }}>Edit</button>
                  <button type="button" className="ml-3 font-semibold text-red-700 underline" onClick={() => void remove(row)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Field({ name, label, value, onChange, type = 'text', required = false, error, inputMode }: { name: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; error?: string; inputMode?: 'decimal' }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <input id={name} className="field mt-1.5" type={type} inputMode={inputMode} value={value} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined} onChange={(event) => onChange(event.target.value)} />
      {error ? <span id={`${name}-error`} className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-medium text-navy-900">{label}
      <p className="field mt-1.5 bg-slate-100 text-navy-900">{value}</p>
    </div>
  );
}
