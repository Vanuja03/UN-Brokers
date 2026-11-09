import { useEffect, useState, type FormEvent } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';

type Status = 'ren' | 'new' | 'refund' | 'additional';
type RenewalResult = '' | 'done' | 'cancel' | 'sold';

type Policy = {
  _id: string;
  policyNumber: string;
  product: string;
  fromDate: string;
  toDate: string | null;
  customerName: string;
  postalAddress: string;
  locationAddress: string;
  sumInsured: number;
  lastYearPremium: number;
  thisYearPremium: number | null;
  insuranceCompany: string;
  salesPerson: string;
  speciCo: string;
  status: Status;
  renewalResult: RenewalResult;
  commissionReceived: boolean;
  remarks: string;
};

type FormState = {
  thisYearPremium: string;
  renewalResult: RenewalResult;
  remarks: string;
};

const renewalChoices: { value: Exclude<RenewalResult, ''>; label: string }[] = [
  { value: 'done', label: 'Done' },
  { value: 'cancel', label: 'Cancel' },
  { value: 'sold', label: 'Sold' },
];

const statusLabel: Record<Status, string> = { ren: 'Ren', new: 'New', refund: 'Refund', additional: 'Additional' };
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function day(value: string | null) {
  return value ? value.slice(0, 10) : '';
}

function money(value: number | null | undefined) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(value);
}

export function NonMotorPolicyRenewalSection() {
  const [rows, setRows] = useState<Policy[]>([]);
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [commission, setCommission] = useState('');
  const [form, setForm] = useState<FormState>({ thisYearPremium: '', renewalResult: '', remarks: '' });
  const [editing, setEditing] = useState<Policy | null>(null);
  const [viewing, setViewing] = useState<Policy | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  function load(nextMonth = month, nextSearch = search, nextCategory = category, nextCommission = commission) {
    return api.get('/non-motor-policy-renewals', { params: { month: nextMonth, search: nextSearch, category: nextCategory, commission: nextCommission } }).then((response) => setRows(response.data.data));
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => setError('Policies could not be loaded.'));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [month, search, category, commission]);

  async function downloadList() {
    setError('');
    try {
      const response = await api.get('/non-motor-policy-renewals/pdf', { params: { month, search, category, commission }, responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const monthName = months[Number(month) - 1];
      link.href = url;
      link.download = monthName ? `non-motor-policy-renewals-${monthName.toLowerCase()}.pdf` : 'non-motor-policy-renewals.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('The PDF could not be downloaded.');
    }
  }

  function startEdit(row: Policy) {
    setEditing(row);
    setViewing(null);
    setForm({
      thisYearPremium: row.thisYearPremium == null ? '' : String(row.thisYearPremium),
      renewalResult: row.renewalResult || '',
      remarks: row.remarks || '',
    });
    setError('');
    setFieldErrors({});
  }

  function validate(values: FormState) {
    const errors: Partial<Record<keyof FormState, string>> = {};
    const cleaned = values.thisYearPremium.trim().replace(/,/g, '').replace(/^(?:rs\.?|lkr)\s*/i, '');
    if (!cleaned) errors.thisYearPremium = 'This field is required.';
    else if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) errors.thisYearPremium = 'Enter a valid amount.';
    else if (Number(cleaned) > 1_000_000_000) errors.thisYearPremium = 'Amount is too large.';
    if (values.renewalResult && !['done', 'cancel', 'sold'].includes(values.renewalResult)) errors.renewalResult = 'Choose done, cancel, or sold.';
    return errors;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
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
      await api.patch(`/non-motor-policy-renewals/${editing._id}`, form);
      setEditing(null);
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
      await api.patch(`/non-motor-policy-renewals/${row._id}`, {
        thisYearPremium: row.thisYearPremium == null ? '' : String(row.thisYearPremium),
        renewalResult: next,
        remarks: row.remarks || '',
      });
      if (viewing?._id === row._id) setViewing({ ...row, renewalResult: next });
      await load();
    } catch (markError) {
      setError(getErrorMessage(markError, 'The renewal mark could not be saved.'));
    }
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Non-motor policy renewal</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">From date is the risk date, to date is the renewal date, and last year premium is the premium excluding RCC/TC. Enter this year premium and save it on the policy.</p>
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
        <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search policy no, product, name, or debit note" aria-label="Search non-motor renewals" />
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}

      {editing ? (
        <form className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3" noValidate onSubmit={(event) => void save(event)}>
          <h3 className="sm:col-span-2 xl:col-span-3 text-lg font-bold">Edit renewal</h3>
          <p className="sm:col-span-2 xl:col-span-3 text-sm text-slate-600">The register details stay as saved. Enter this year premium, then save it on this policy.</p>
          <Read label="Policy no" value={editing.policyNumber} />
          <Read label="Product" value={editing.product} />
          <Read label="Policy status" value={statusLabel[editing.status]} />
          <Read label="From date (risk date)" value={day(editing.fromDate) || '—'} />
          <Read label="To date (renewal date)" value={day(editing.toDate) || '—'} />
          <Read label="Customer name" value={editing.customerName} />
          <Read label="Postal address" value={editing.postalAddress || '—'} />
          <Read label="Location address" value={editing.locationAddress || '—'} />
          <Read label="Sum insured" value={money(editing.sumInsured)} />
          <Read label="Last year premium (ex. RCC/TC)" value={money(editing.lastYearPremium)} />
          <label className="text-sm font-medium text-navy-900">This year premium
            <input className="field mt-1.5" inputMode="decimal" required value={form.thisYearPremium} aria-invalid={fieldErrors.thisYearPremium ? true : undefined} onChange={(event) => { setForm((current) => ({ ...current, thisYearPremium: event.target.value })); setFieldErrors((current) => { const next = { ...current }; delete next.thisYearPremium; return next; }); }} />
            {fieldErrors.thisYearPremium ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.thisYearPremium}</span> : null}
          </label>
          <Read label="Insurance company" value={editing.insuranceCompany || '—'} />
          <Read label="Sales person" value={editing.salesPerson || '—'} />
          <Read label="Broker code" value={editing.speciCo || '—'} />
          <fieldset className="text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">
            <legend>Renewal</legend>
            <p className="mt-1 text-slate-600">After the period, mark the policy. Click the same mark again to clear it. Remarks stay a written note.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {renewalChoices.map((choice) => {
                const selected = form.renewalResult === choice.value;
                return (
                  <button key={choice.value} type="button" aria-pressed={selected} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 ${selected ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-navy-900'}`} onClick={() => setForm((current) => ({ ...current, renewalResult: selected ? '' : choice.value }))}>
                    <ResultIcon value={choice.value} className={selected ? 'text-white' : undefined} />
                    {choice.label}
                  </button>
                );
              })}
            </div>
            {fieldErrors.renewalResult ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.renewalResult}</span> : null}
          </fieldset>
          <label className="text-sm font-medium text-navy-900 sm:col-span-2 xl:col-span-3">Remarks
            <textarea className="field mt-1.5" rows={2} value={form.remarks} onChange={(event) => setForm((current) => ({ ...current, remarks: event.target.value }))} />
          </label>
          <div className="flex gap-3 sm:col-span-2 xl:col-span-3">
            <button type="submit" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {viewing ? (
        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{viewing.policyNumber}</h3>
            <button type="button" className="text-sm font-semibold text-navy-900 underline" onClick={() => setViewing(null)}>Close</button>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
            <Item label="Product" value={viewing.product} />
            <Item label="Policy status" value={statusLabel[viewing.status]} />
            <Item label="From date (risk date)" value={day(viewing.fromDate) || '—'} />
            <Item label="To date (renewal date)" value={day(viewing.toDate) || '—'} />
            <Item label="Customer name" value={viewing.customerName} />
            <Item label="Postal address" value={viewing.postalAddress || '—'} />
            <Item label="Location address" value={viewing.locationAddress || '—'} />
            <Item label="Sum insured" value={money(viewing.sumInsured)} />
            <Item label="Last year premium" value={money(viewing.lastYearPremium)} />
            <Item label="This year premium" value={money(viewing.thisYearPremium)} />
            <Item label="Insurance company" value={viewing.insuranceCompany || '—'} />
            <Item label="Sales person" value={viewing.salesPerson || '—'} />
            <Item label="Broker code" value={viewing.speciCo || '—'} />
            <div><dt className="font-medium text-navy-900">Renewal</dt><dd className="mt-1 text-slate-700"><ResultIcon value={viewing.renewalResult} labelled /></dd></div>
            <Item label="Remarks" value={viewing.remarks || '—'} />
          </dl>
        </article>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[96rem] w-full text-left text-sm">
          <thead className="bg-navy-900 text-white">
            <tr>
              {['Policy no', 'Product', 'From (risk date)', 'To (renewal date)', 'Customer', 'Address', 'Location', 'Sum insured', 'Last year premium', 'This year premium', 'Insurer', 'Sales person', 'Broker code', 'Policy status', 'Renewal', 'Remarks', 'Actions'].map((heading) => (
                <th key={heading} className="whitespace-nowrap px-3 py-2 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-slate-600" colSpan={17}>{month || search || category || commission ? 'No policies match this filter.' : 'No registered policies yet.'}</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 font-semibold">{row.policyNumber}</td>
                <td className="px-3 py-2">{row.product}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.fromDate)}</td>
                <td className="whitespace-nowrap px-3 py-2">{day(row.toDate)}</td>
                <td className="px-3 py-2">{row.customerName}</td>
                <td className="max-w-48 px-3 py-2">{row.postalAddress}</td>
                <td className="max-w-48 px-3 py-2">{row.locationAddress}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.sumInsured)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.lastYearPremium)}</td>
                <td className="whitespace-nowrap px-3 py-2">{money(row.thisYearPremium)}</td>
                <td className="px-3 py-2">{row.insuranceCompany}</td>
                <td className="px-3 py-2">{row.salesPerson}</td>
                <td className="px-3 py-2">{row.speciCo}</td>
                <td className="px-3 py-2">{statusLabel[row.status]}</td>
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
                  <button type="button" className="font-semibold text-navy-900 underline" onClick={() => { setEditing(null); setViewing(row); }}>View</button>
                  <button type="button" className="ml-3 font-semibold text-navy-900 underline" onClick={() => startEdit(row)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return <div className="text-sm font-medium text-navy-900">{label}<p className="field mt-1.5 bg-slate-100 text-slate-600">{value}</p></div>;
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
