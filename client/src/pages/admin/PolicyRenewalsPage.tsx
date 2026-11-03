import { useEffect, useState, type FormEvent } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';
import { PolicyRegisterSection } from './PolicyRegisterSection';

type Status = 'ren' | 'new';
type RenewalResult = '' | 'done' | 'cancel' | 'sold';

type Policy = {
  _id: string;
  policyNumber: string;
  vehicleNumber: string;
  fromDate: string;
  toDate: string;
  customerName: string;
  postalAddress: string;
  sumInsured: number;
  lastYearPremium: number;
  thisYearPremium: number | null;
  insuranceCompany: string;
  salesPerson: string;
  speciCo: string;
  status: Status;
  renewalResult: RenewalResult;
  commissionReceived: boolean;
  contactNo: string;
  remarks: string;
};

type FormState = {
  policyNumber: string;
  vehicleNumber: string;
  fromDate: string;
  toDate: string;
  customerName: string;
  postalAddress: string;
  sumInsured: string;
  lastYearPremium: string;
  thisYearPremium: string;
  insuranceCompany: string;
  salesPerson: string;
  speciCo: string;
  status: Status;
  renewalResult: RenewalResult;
  commissionReceived: boolean;
  contactNo: string;
  remarks: string;
};

const renewalChoices: { value: Exclude<RenewalResult, ''>; label: string }[] = [
  { value: 'done', label: 'Done' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'sold', label: 'Sold' },
];

const blank: FormState = {
  policyNumber: '',
  vehicleNumber: '',
  fromDate: '',
  toDate: '',
  customerName: '',
  postalAddress: '',
  sumInsured: '',
  lastYearPremium: '',
  thisYearPremium: '',
  insuranceCompany: '',
  salesPerson: '',
  speciCo: '',
  status: 'ren',
  renewalResult: '',
  commissionReceived: false,
  contactNo: '',
  remarks: '',
};

const statusLabel: Record<Status, string> = { ren: 'Ren', new: 'New' };

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function day(value: string) {
  return value ? value.slice(0, 10) : '';
}

function money(value: number | null | undefined) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value);
}

const requiredFields: (keyof FormState)[] = [
  'policyNumber',
  'vehicleNumber',
  'fromDate',
  'toDate',
  'customerName',
  'postalAddress',
  'sumInsured',
  'lastYearPremium',
  'thisYearPremium',
];

const amountFields = ['sumInsured', 'lastYearPremium', 'thisYearPremium'] as const;

function validatePolicy(values: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  for (const key of requiredFields) {
    const value = values[key];
    if (typeof value !== 'string' || !value.trim()) errors[key] = 'This field is required.';
  }
  if (values.fromDate && values.toDate && values.toDate < values.fromDate) {
    errors.toDate = 'The to date must be on or after the from date.';
  }
  if (values.status && values.status !== 'ren' && values.status !== 'new') errors.status = 'Choose Ren or New.';
  if (values.renewalResult && !['done', 'cancel', 'sold'].includes(values.renewalResult)) errors.renewalResult = 'Choose done, cancel, or sold.';
  for (const key of amountFields) {
    if (errors[key]) continue;
    const cleaned = values[key].trim().replace(/,/g, '').replace(/^(?:rs\.?|lkr)\s*/i, '');
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) errors[key] = 'Enter a valid amount.';
    else if (Number(cleaned) > 1_000_000_000) errors[key] = 'Amount is too large.';
  }
  if (!errors.contactNo && values.contactNo.trim() && !/^\+?[0-9]{9,15}$/.test(values.contactNo.replace(/[\s()-]/g, ''))) {
    errors.contactNo = 'Enter a valid telephone number.';
  }
  return errors;
}

function toForm(row: Policy): FormState {
  return {
    policyNumber: row.policyNumber,
    vehicleNumber: row.vehicleNumber,
    fromDate: day(row.fromDate),
    toDate: day(row.toDate),
    customerName: row.customerName,
    postalAddress: row.postalAddress || '',
    sumInsured: String(row.sumInsured ?? ''),
    lastYearPremium: String(row.lastYearPremium ?? ''),
    thisYearPremium: row.thisYearPremium == null ? '' : String(row.thisYearPremium),
    insuranceCompany: row.insuranceCompany || '',
    salesPerson: row.salesPerson || '',
    speciCo: row.speciCo || '',
    status: row.status,
    renewalResult: row.renewalResult || '',
    commissionReceived: row.commissionReceived === true,
    contactNo: row.contactNo,
    remarks: row.remarks || '',
  };
}

export function PolicyRenewalsPage() {
  const [rows, setRows] = useState<Policy[]>([]);
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [commission, setCommission] = useState('');
  const [form, setForm] = useState<FormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Policy | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'register' | 'renewal'>('register');

  function renewalBody(values: FormState) {
    return {
      thisYearPremium: values.thisYearPremium,
      renewalResult: values.renewalResult,
      commissionReceived: values.commissionReceived,
      remarks: values.remarks,
    };
  }

  function load(nextMonth = month, nextSearch = search, nextCategory = category, nextCommission = commission) {
    return api.get('/policy-renewals', { params: { month: nextMonth, search: nextSearch, category: nextCategory, commission: nextCommission } }).then((response) => setRows(response.data.data));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => setError('Policies could not be loaded.'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [month, search, category, commission]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function downloadList() {
    setError('');
    try {
      const response = await api.get('/policy-renewals/pdf', { params: { month, search, category, commission }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const monthName = months[Number(month) - 1];
      link.href = url;
      link.download = monthName ? `policy-renewals-${monthName.toLowerCase()}.pdf` : 'policy-renewals.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('The PDF could not be downloaded.');
    }
  }

  function startEdit(row: Policy) {
    setEditingId(row._id);
    setViewing(null);
    setForm(toForm(row));
    setError('');
    setFieldErrors({});
    setShowForm(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const found = validatePolicy(form);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      setError('Please check the highlighted information and try again.');
      return;
    }
    if (!editingId) return;
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      await api.patch(`/policy-renewals/${editingId}`, renewalBody(form));
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
      setError(getErrorMessage(saveError, 'The policy could not be saved.'));
    } finally {
      setSaving(false);
    }
  }

  async function markCommission(row: Policy, commissionReceived: boolean) {
    setError('');
    try {
      await api.patch(`/policy-renewals/${row._id}`, { ...renewalBody(toForm(row)), commissionReceived });
      if (viewing?._id === row._id) setViewing({ ...row, commissionReceived });
      await load();
    } catch (markError) {
      setError(getErrorMessage(markError, 'The commission status could not be saved.'));
    }
  }

  async function mark(row: Policy, renewalResult: Exclude<RenewalResult, ''>) {
    setError('');
    const next = row.renewalResult === renewalResult ? '' : renewalResult;
    try {
      await api.patch(`/policy-renewals/${row._id}`, { ...renewalBody(toForm(row)), renewalResult: next });
      if (viewing?._id === row._id) setViewing({ ...row, renewalResult: next });
      await load();
    } catch (markError) {
      setError(getErrorMessage(markError, 'The renewal mark could not be saved.'));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Policies</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">The same registered policies appear in both views. Renewal uses the risk date, the renewal date, and the premium net.</p>
        </div>
      </div>
      <div role="tablist" aria-label="Policy views" className="mt-5 flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={tab === 'register'} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'register' ? 'bg-navy-900 text-white' : 'border border-slate-300 text-navy-900'}`} onClick={() => setTab('register')}>Policy register</button>
        <button type="button" role="tab" aria-selected={tab === 'renewal'} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === 'renewal' ? 'bg-navy-900 text-white' : 'border border-slate-300 text-navy-900'}`} onClick={() => setTab('renewal')}>Policy renewal</button>
      </div>
      {error && tab === 'register' ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      {tab === 'register' ? <PolicyRegisterSection /> : null}
      {tab === 'renewal' ? (
      <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Policy renewal</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">From date is the risk date, to date is the renewal date, and last year premium is the premium net. Enter this year premium and save it on the policy.</p>
        </div>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={() => void downloadList()}>Download PDF</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select className="field" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Filter by renewal month">
          <option value="">All months</option>
          {months.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}
        </select>
        <select className="field" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by cancel or sold">
          <option value="">All renewal marks</option>
          <option value="cancel">Cancel</option>
          <option value="sold">Sold</option>
          <option value="cancel-sold">Cancel or sold</option>
        </select>
        <select className="field" value={commission} onChange={(event) => setCommission(event.target.value)} aria-label="Filter by commission received">
          <option value="">All commission statuses</option>
          <option value="received">Commission received</option>
          <option value="pending">Commission not received</option>
        </select>
        <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search policy no, vehicle no, name, or contact" aria-label="Search policies" />
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}

      {showForm && editingId ? (
        <form className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3" noValidate onSubmit={(event) => void save(event)}>
          <h3 className="sm:col-span-2 xl:col-span-3 text-lg font-bold">Edit renewal</h3>
          <p className="sm:col-span-2 xl:col-span-3 text-sm text-slate-600">The register details stay as saved. Enter this year premium, then save it on this policy.</p>
          <Field name="policyNumber" label="Policy no" value={form.policyNumber} error={fieldErrors.policyNumber} onChange={(value) => update('policyNumber', value)} readOnly />
          <Field name="vehicleNumber" label="Vehicle no" value={form.vehicleNumber} error={fieldErrors.vehicleNumber} onChange={(value) => update('vehicleNumber', value)} readOnly />
          <label className="text-sm font-medium text-navy-900">Sat
            <select className="field mt-1.5 bg-slate-100 text-slate-600" value={form.status} aria-label="Sat" disabled>
              <option value="ren">Ren</option>
              <option value="new">New</option>
            </select>
          </label>
          <Field name="fromDate" label="From date (risk date)" type="date" value={form.fromDate} error={fieldErrors.fromDate} onChange={(value) => update('fromDate', value)} readOnly />
          <Field name="toDate" label="To date (renewal date)" type="date" value={form.toDate} error={fieldErrors.toDate} onChange={(value) => update('toDate', value)} readOnly />
          <Field name="customerName" label="Customer name" value={form.customerName} error={fieldErrors.customerName} onChange={(value) => update('customerName', value)} readOnly />
          <Field name="contactNo" label="Contact no" value={form.contactNo} error={fieldErrors.contactNo} onChange={(value) => update('contactNo', value)} readOnly />
          <label className="text-sm font-medium text-navy-900 sm:col-span-2">Postal address
            <textarea className="field mt-1.5 bg-slate-100 text-slate-600" rows={2} readOnly value={form.postalAddress} />
          </label>
          <Field name="sumInsured" label="Sum insured" value={form.sumInsured} error={fieldErrors.sumInsured} onChange={(value) => update('sumInsured', value)} readOnly />
          <Field name="lastYearPremium" label="Last year premium (premium net)" value={form.lastYearPremium} error={fieldErrors.lastYearPremium} onChange={(value) => update('lastYearPremium', value)} readOnly />
          <Field name="thisYearPremium" label="This year premium" value={form.thisYearPremium} error={fieldErrors.thisYearPremium} inputMode="decimal" onChange={(value) => update('thisYearPremium', value)} required />
          <Field name="insuranceCompany" label="Insurance company" value={form.insuranceCompany} error={fieldErrors.insuranceCompany} onChange={(value) => update('insuranceCompany', value)} readOnly />
          <Field name="salesPerson" label="Sales person" value={form.salesPerson} error={fieldErrors.salesPerson} onChange={(value) => update('salesPerson', value)} readOnly />
          <Field name="speciCo" label="Agent code" value={form.speciCo} error={fieldErrors.speciCo} onChange={(value) => update('speciCo', value)} readOnly />
          <fieldset className="text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">
            <legend>Renewal</legend>
            <p className="mt-1 text-slate-600">After the one-year period, mark the policy. Click the same mark again to clear it. Remarks stay a written note.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {renewalChoices.map((choice) => {
                const selected = form.renewalResult === choice.value;
                return (
                  <button key={choice.value} type="button" aria-pressed={selected} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${selected ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-navy-900'}`} onClick={() => update('renewalResult', selected ? '' : choice.value)}>
                    <ResultIcon value={choice.value} className={selected ? 'text-white' : undefined} />
                    {choice.label}
                  </button>
                );
              })}
            </div>
            {fieldErrors.renewalResult ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.renewalResult}</span> : null}
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">
            <input type="checkbox" checked={form.commissionReceived} onChange={(event) => update('commissionReceived', event.target.checked)} />
            Commission received
          </label>
          <label className="text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">Remarks
            <textarea className="field mt-1.5" rows={2} value={form.remarks} aria-invalid={fieldErrors.remarks ? true : undefined} onChange={(event) => update('remarks', event.target.value)} />
            {fieldErrors.remarks ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.remarks}</span> : null}
          </label>
          <div className="flex gap-3 sm:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {viewing ? (
        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{viewing.policyNumber}</h2>
            <button type="button" className="text-sm font-semibold text-navy-900 underline" onClick={() => setViewing(null)}>Close</button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <Item label="Vehicle no" value={viewing.vehicleNumber} />
            <Item label="Sat" value={statusLabel[viewing.status]} />
            <Item label="From date (risk date)" value={day(viewing.fromDate)} />
            <Item label="To date (renewal date)" value={day(viewing.toDate)} />
            <Item label="Customer name" value={viewing.customerName} />
            <Item label="Contact no" value={viewing.contactNo} />
            <Item label="Postal address" value={viewing.postalAddress || '—'} />
            <Item label="Sum insured" value={money(viewing.sumInsured)} />
            <Item label="Last year premium" value={money(viewing.lastYearPremium)} />
            <Item label="This year premium" value={money(viewing.thisYearPremium)} />
            <Item label="Insurance company" value={viewing.insuranceCompany || '—'} />
            <Item label="Sales person" value={viewing.salesPerson || '—'} />
            <Item label="Agent code" value={viewing.speciCo || '—'} />
            <div><dt className="font-medium text-navy-900">Renewal</dt><dd className="mt-1 text-slate-700"><ResultIcon value={viewing.renewalResult} labelled /></dd></div>
            <Item label="Commission received" value={viewing.commissionReceived ? 'Received' : 'Not received'} />
            <Item label="Remarks" value={viewing.remarks || '—'} />
          </dl>
        </article>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[88rem] w-full text-left text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              {['Policy no', 'Vehicle no', 'From (risk date)', 'To (renewal date)', 'Customer', 'Address', 'Sum insured', 'Last year premium', 'This year premium', 'Insurer', 'Sales person', 'Agent code', 'Sat', 'Contact', 'Renewal', 'Commission', 'Remarks', 'Actions'].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3 py-2 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-600" colSpan={18}>{month || search || category || commission ? 'No policies match this filter.' : 'No registered policies yet.'}</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 font-semibold">{row.policyNumber}</td>
                <td className="px-3 py-2">{row.vehicleNumber}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.fromDate)}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.toDate)}</td>
                <td className="px-3 py-2">{row.customerName}</td>
                <td className="max-w-48 px-3 py-2">{row.postalAddress}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.sumInsured)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.lastYearPremium)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.thisYearPremium)}</td>
                <td className="px-3 py-2">{row.insuranceCompany}</td>
                <td className="px-3 py-2">{row.salesPerson}</td>
                <td className="px-3 py-2">{row.speciCo}</td>
                <td className="px-3 py-2">{statusLabel[row.status]}</td>
                <td className="whitespace-nowrap px-3 py-2">{row.contactNo}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-1">
                    {renewalChoices.map((choice) => {
                      const selected = row.renewalResult === choice.value;
                      return (
                        <button key={choice.value} type="button" title={choice.label} aria-label={`${choice.label} for ${row.policyNumber}`} aria-pressed={selected} className={`rounded-full border p-1.5 ${selected ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 text-navy-900'}`} onClick={() => void mark(row, choice.value)}>
                          <ResultIcon value={choice.value} className={selected ? 'text-white' : undefined} />
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={row.commissionReceived === true} aria-label={`Commission received for ${row.policyNumber}`} onChange={(event) => void markCommission(row, event.target.checked)} />
                    {row.commissionReceived ? 'Received' : 'Not received'}
                  </label>
                </td>
                <td className="max-w-48 px-3 py-2">{row.remarks}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button type="button" className="font-semibold text-navy-900 underline" onClick={() => { setShowForm(false); setViewing(row); }}>View</button>
                  <button type="button" className="ml-3 font-semibold text-navy-900 underline" onClick={() => startEdit(row)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      ) : null}
    </div>
  );
}

function Field({ name, label, value, onChange, type = 'text', required = false, error, inputMode, readOnly = false }: { name: string; label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; error?: string; inputMode?: 'decimal'; readOnly?: boolean }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <input id={name} className="field mt-1.5 read-only:bg-slate-100 read-only:text-slate-600" type={type} inputMode={inputMode} value={value} required={required} readOnly={readOnly} aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined} onChange={(event) => onChange(event.target.value)} />
      {error ? <span id={`${name}-error`} className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function ResultIcon({ value, labelled = false, className }: { value: RenewalResult; labelled?: boolean; className?: string }) {
  const iconClass = `h-4 w-4 ${className || ''}`;
  const icon = value === 'done'
    ? <Check className={`${iconClass} ${className ? '' : 'text-green-700'}`} aria-hidden />
    : value === 'cancel'
      ? <X className={`${iconClass} ${className ? '' : 'text-red-700'}`} aria-hidden />
      : value === 'sold'
        ? <Tag className={`${iconClass} ${className ? '' : 'text-amber-700'}`} aria-hidden />
        : <span className="text-slate-400">—</span>;
  const label = value === 'done' ? 'Done' : value === 'cancel' ? 'Cancel' : value === 'sold' ? 'Sold' : 'Not marked';
  if (!labelled) return icon;
  return <span className="inline-flex items-center gap-2">{icon}<span>{label}</span></span>;
}

function Item({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-medium text-navy-900">{label}</dt><dd className="text-slate-700">{value}</dd></div>;
}
