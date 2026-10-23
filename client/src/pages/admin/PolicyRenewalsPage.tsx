import { useEffect, useState, type FormEvent } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';

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
  thisYearPremium: number;
  insuranceCompany: string;
  salesPerson: string;
  speciCo: string;
  status: Status;
  renewalResult: RenewalResult;
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
  contactNo: '',
  remarks: '',
};

const statusLabel: Record<Status, string> = { ren: 'Ren', new: 'New' };

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function day(value: string) {
  return value ? value.slice(0, 10) : '';
}

function money(value: number) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value || 0);
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
  'insuranceCompany',
  'status',
  'contactNo',
];

const amountFields = ['sumInsured', 'lastYearPremium', 'thisYearPremium'] as const;

function validatePolicy(values: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  for (const key of requiredFields) {
    if (!values[key].trim()) errors[key] = 'This field is required.';
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
    thisYearPremium: String(row.thisYearPremium ?? ''),
    insuranceCompany: row.insuranceCompany || '',
    salesPerson: row.salesPerson || '',
    speciCo: row.speciCo || '',
    status: row.status,
    renewalResult: row.renewalResult || '',
    contactNo: row.contactNo,
    remarks: row.remarks || '',
  };
}

export function PolicyRenewalsPage() {
  const [rows, setRows] = useState<Policy[]>([]);
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Policy | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  function load(nextMonth = month, nextSearch = search) {
    return api.get('/policy-renewals', { params: { month: nextMonth, search: nextSearch } }).then((response) => setRows(response.data.data));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => setError('Policies could not be loaded.'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [month, search]);

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
      const response = await api.get('/policy-renewals/pdf', { params: { month, search }, responseType: 'blob' });
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

  function startAdd() {
    setEditingId(null);
    setViewing(null);
    setForm(blank);
    setError('');
    setFieldErrors({});
    setShowForm(true);
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
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      if (editingId) await api.patch(`/policy-renewals/${editingId}`, form);
      else await api.post('/policy-renewals', form);
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

  async function mark(row: Policy, renewalResult: Exclude<RenewalResult, ''>) {
    setError('');
    const next = row.renewalResult === renewalResult ? '' : renewalResult;
    try {
      await api.patch(`/policy-renewals/${row._id}`, { ...toForm(row), renewalResult: next });
      if (viewing?._id === row._id) setViewing({ ...row, renewalResult: next });
      await load();
    } catch (markError) {
      setError(getErrorMessage(markError, 'The renewal mark could not be saved.'));
    }
  }

  async function remove(row: Policy) {
    if (!window.confirm(`Delete policy ${row.policyNumber}?`)) return;
    setError('');
    try {
      await api.delete(`/policy-renewals/${row._id}`);
      if (viewing?._id === row._id) setViewing(null);
      if (editingId === row._id) {
        setShowForm(false);
        setEditingId(null);
      }
      await load();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'The policy could not be deleted.'));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Policy renewal list</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Add, view, edit, or delete policies. The month list uses the to date and includes every year.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={() => void downloadList()}>Download PDF</button>
          <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" onClick={startAdd}>Add policy</button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[16rem_1fr]">
        <select className="field" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Filter by to-date month">
          <option value="">All months</option>
          {months.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}
        </select>
        <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search policy no, vehicle no, name, or contact" aria-label="Search policies" />
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}

      {showForm ? (
        <form className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3" noValidate onSubmit={(event) => void save(event)}>
          <h2 className="sm:col-span-2 xl:col-span-3 text-lg font-bold">{editingId ? 'Edit policy' : 'Add policy'}</h2>
          {editingId ? <p className="sm:col-span-2 xl:col-span-3 text-sm text-slate-600">Policy no, vehicle no, and customer name stay as they were first saved.</p> : null}
          <Field name="policyNumber" label="Policy no" value={form.policyNumber} error={fieldErrors.policyNumber} onChange={(value) => update('policyNumber', value)} required readOnly={Boolean(editingId)} />
          <Field name="vehicleNumber" label="Vehicle no" value={form.vehicleNumber} error={fieldErrors.vehicleNumber} onChange={(value) => update('vehicleNumber', value)} required readOnly={Boolean(editingId)} />
          <label className="text-sm font-medium text-navy-900">Sat
            <select className="field mt-1.5" value={form.status} aria-invalid={fieldErrors.status ? true : undefined} onChange={(event) => update('status', event.target.value as Status)} aria-label="Sat" required>
              <option value="ren">Ren</option>
              <option value="new">New</option>
            </select>
            {fieldErrors.status ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.status}</span> : null}
          </label>
          <Field name="fromDate" label="From date" type="date" value={form.fromDate} error={fieldErrors.fromDate} onChange={(value) => update('fromDate', value)} required />
          <Field name="toDate" label="To date" type="date" value={form.toDate} error={fieldErrors.toDate} onChange={(value) => update('toDate', value)} required />
          <Field name="customerName" label="Customer name" value={form.customerName} error={fieldErrors.customerName} onChange={(value) => update('customerName', value)} required readOnly={Boolean(editingId)} />
          <Field name="contactNo" label="Contact no" value={form.contactNo} error={fieldErrors.contactNo} onChange={(value) => update('contactNo', value)} required />
          <label className="text-sm font-medium text-navy-900 sm:col-span-2">Postal address
            <textarea className="field mt-1.5" rows={2} required value={form.postalAddress} aria-invalid={fieldErrors.postalAddress ? true : undefined} onChange={(event) => update('postalAddress', event.target.value)} />
            {fieldErrors.postalAddress ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.postalAddress}</span> : null}
          </label>
          <Field name="sumInsured" label="Sum insured" value={form.sumInsured} error={fieldErrors.sumInsured} inputMode="decimal" onChange={(value) => update('sumInsured', value)} required />
          <Field name="lastYearPremium" label="Last year premium" value={form.lastYearPremium} error={fieldErrors.lastYearPremium} inputMode="decimal" onChange={(value) => update('lastYearPremium', value)} required />
          <Field name="thisYearPremium" label="This year premium" value={form.thisYearPremium} error={fieldErrors.thisYearPremium} inputMode="decimal" onChange={(value) => update('thisYearPremium', value)} required />
          <Field name="insuranceCompany" label="Insurance company" value={form.insuranceCompany} error={fieldErrors.insuranceCompany} onChange={(value) => update('insuranceCompany', value)} required />
          <Field name="salesPerson" label="Sales person" value={form.salesPerson} error={fieldErrors.salesPerson} onChange={(value) => update('salesPerson', value)} />
          <Field name="speciCo" label="Speci co" value={form.speciCo} error={fieldErrors.speciCo} onChange={(value) => update('speciCo', value)} />
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
          <label className="text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">Remarks
            <textarea className="field mt-1.5" rows={2} value={form.remarks} aria-invalid={fieldErrors.remarks ? true : undefined} onChange={(event) => update('remarks', event.target.value)} />
            {fieldErrors.remarks ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.remarks}</span> : null}
          </label>
          <div className="flex gap-3 sm:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Save policy'}</button>
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
            <Item label="From date" value={day(viewing.fromDate)} />
            <Item label="To date" value={day(viewing.toDate)} />
            <Item label="Customer name" value={viewing.customerName} />
            <Item label="Contact no" value={viewing.contactNo} />
            <Item label="Postal address" value={viewing.postalAddress || '—'} />
            <Item label="Sum insured" value={money(viewing.sumInsured)} />
            <Item label="Last year premium" value={money(viewing.lastYearPremium)} />
            <Item label="This year premium" value={money(viewing.thisYearPremium)} />
            <Item label="Insurance company" value={viewing.insuranceCompany || '—'} />
            <Item label="Sales person" value={viewing.salesPerson || '—'} />
            <Item label="Speci co" value={viewing.speciCo || '—'} />
            <div><dt className="font-medium text-navy-900">Renewal</dt><dd className="mt-1 text-slate-700"><ResultIcon value={viewing.renewalResult} labelled /></dd></div>
            <Item label="Remarks" value={viewing.remarks || '—'} />
          </dl>
        </article>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[88rem] w-full text-left text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              {['Policy no', 'Vehicle no', 'From', 'To', 'Customer', 'Address', 'Sum insured', 'Last premium', 'This premium', 'Insurer', 'Sales person', 'Speci co', 'Sat', 'Contact', 'Renewal', 'Remarks', 'Actions'].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3 py-2 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-600" colSpan={17}>{month || search ? 'No policies match this filter.' : 'No policies yet. Add the first one.'}</td></tr>
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
                <td className="max-w-48 px-3 py-2">{row.remarks}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <button type="button" className="font-semibold text-navy-900 underline" onClick={() => { setShowForm(false); setViewing(row); }}>View</button>
                  <button type="button" className="ml-3 font-semibold text-navy-900 underline" onClick={() => startEdit(row)}>Edit</button>
                  <button type="button" className="ml-3 font-semibold text-red-700 underline" onClick={() => void remove(row)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
