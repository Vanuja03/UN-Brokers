import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../services/api';
import { serviceMap } from '../../content/services';
import { STATUS_LABELS, labelFor } from '../../utils/labels';
import type { InsuranceType } from '../../types';

type Quote = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  customerType?: 'private' | 'company';
  nic?: string;
  companyName?: string;
  designation?: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  insuranceType: InsuranceType;
  insuranceDetails: Record<string, unknown>;
  message: string;
  status: string;
  sourcePage: string;
  currency: string;
  createdAt: string;
  notes: { text: string; authorName: string; createdAt: string }[];
  statusHistory: { from?: string; to: string; note?: string; actorName?: string; changedAt: string }[];
  notifications?: { business: string; customer: string };
  assignedTo?: { _id: string; name: string } | null;
  campaignSource?: { source?: string; medium?: string; campaign?: string };
};

const statuses = Object.keys(STATUS_LABELS).filter((status) => status !== 'in-progress' && status !== 'resolved');

const valueLabels: Record<string, string> = {
  'private-car': 'Car',
  'prime-mover': 'Prime mover',
  motorcycle: 'Motorcycle',
  'three-wheeler': 'Three-wheeler',
  van: 'Van',
  lorry: 'Lorry',
  bus: 'Bus',
};

function formatInquiryValue(value: unknown, currency: string) {
  if (typeof value === 'string' && valueLabels[value]) return valueLabels[value];
  if (!Array.isArray(value)) return String(value);
  return value.map((entry) => {
    if (entry && typeof entry === 'object' && 'startLocation' in entry) {
      const line = entry as { transferAmount?: number | string; startLocation?: string; endLocation?: string; transferTimes?: number | string };
      return `${currency} ${line.transferAmount} · ${line.startLocation} to ${line.endLocation} · ${line.transferTimes} times`;
    }
    if (entry && typeof entry === 'object' && 'employeeClass' in entry) {
      const line = entry as { employeeClass?: string; duties?: string; estimatedNumber?: number | string; monthlyIncome?: number | string };
      return `${line.employeeClass} · ${line.duties} · ${line.estimatedNumber} · ${currency} ${line.monthlyIncome}`;
    }
    if (entry && typeof entry === 'object' && 'item' in entry) {
      const line = entry as { item?: string; quantity?: number | string; values?: Array<number | string>; total?: number | string };
      const amounts = Array.isArray(line.values) ? line.values.map((amount) => `${currency} ${amount}`).join(', ') : `${currency} ${line.total ?? ''}`;
      return `${line.item} · ${line.quantity} · ${amounts}`;
    }
    return String(entry);
  }).join('; ');
}

export function QuotationDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [staff, setStaff] = useState<{ _id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await api.get(`/quotes/${id}`);
    setQuote(response.data.data);
  }, [id]);

  useEffect(() => {
    load().catch(() => setError('Inquiry not found.'));
    api.get('/admin/staff').then((response) => setStaff(response.data.data)).catch(() => undefined);
  }, [load]);

  async function updateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api.patch(`/quotes/${id}/status`, { status: data.get('status'), note: data.get('note') || undefined });
      setMessage('Status updated.');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update the status.'));
    }
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const assignedTo = String(new FormData(event.currentTarget).get('assignedTo') || '');
    await api.patch(`/quotes/${id}`, { assignedTo: assignedTo || null });
    setMessage('Assignment updated.');
    await load();
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const note = String(new FormData(form).get('note') || '');
    await api.patch(`/quotes/${id}`, { note });
    form.reset();
    setMessage('Note added.');
    await load();
  }

  async function archiveInquiry(permanent = false) {
    const warning = permanent ? 'Permanently delete this inquiry?' : 'Archive this inquiry?';
    if (!window.confirm(warning)) return;
    await api.delete(`/quotes/${id}${permanent ? '?permanent=true' : ''}`);
    window.location.href = '/admin/quotations';
  }

  if (error && !quote) return <p role="alert">{error}</p>;
  if (!quote) return <p>Loading inquiry…</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/quotations" className="text-sm font-semibold underline">All quotations</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{quote.referenceNumber}</h1>
          <p className="text-sm text-slate-600">{serviceMap[quote.insuranceType]?.name} · {STATUS_LABELS[quote.status]}</p>
          <p className="mt-1 text-sm text-slate-600">Submitted {new Date(quote.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' })}</p>
          {quote.insuranceType === 'motor' || quote.insuranceType === 'motor-third-party' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/admin/motor-quotations/new?inquiry=${quote._id}`} className="inline-flex rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950">Prepare customer PDF</Link>
              <Link to={`/admin/motor-quotations/slips/new?inquiry=${quote._id}`} className="inline-flex rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900">Quotation slip</Link>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <a className="rounded-full border px-4 py-2 text-sm" href={`mailto:${quote.email}`}>Email customer</a>
          <a className="rounded-full border px-4 py-2 text-sm" href={`tel:${quote.phone}`}>Call</a>
        </div>
      </div>
      {message ? <p className="text-sm text-navy-800">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <h2 className="font-bold">Customer</h2>
        <p className="mt-2">{quote.customerType === 'company' ? 'Company' : 'Private'}</p>
        {quote.customerType === 'company' ? <p>{quote.companyName}</p> : null}
        <p>{quote.customerName}{quote.customerType === 'company' && quote.designation ? ` · ${quote.designation}` : ''}</p>
        {quote.nic ? <p>NIC: {quote.nic}</p> : null}
        <p>{quote.email}</p>
        <p>{quote.phone}</p>
        <p>Preferred contact: {quote.preferredContactMethod}</p>
        <p>Source: {quote.sourcePage || 'Not recorded'}</p>
        {quote.campaignSource?.campaign ? <p>Campaign: {quote.campaignSource.source} / {quote.campaignSource.medium} / {quote.campaignSource.campaign}</p> : null}
        <p>Email notification: business {quote.notifications?.business}, customer {quote.notifications?.customer}</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Inquiry details</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {Object.entries(quote.insuranceDetails || {}).map(([key, value]) => (
            <div key={key}><dt className="font-medium">{labelFor(key)}</dt><dd>{formatInquiryValue(value, quote.currency || 'LKR')}</dd></div>
          ))}
        </dl>
        {quote.message ? <p className="mt-4 text-sm"><span className="font-medium">Message: </span>{quote.message}</p> : null}
      </section>
      <form onSubmit={updateStatus} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Status</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select name="status" className="field min-w-48 flex-1" defaultValue={quote.status} aria-label="Status">
            {statuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
          <input name="note" className="field min-w-48 flex-1" placeholder="Optional note for the history" />
          <button className="shrink-0 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Update</button>
        </div>
      </form>
      <form onSubmit={assign} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Assign</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select name="assignedTo" className="field max-w-xs" defaultValue={quote.assignedTo?._id || ''} aria-label="Assigned staff">
            <option value="">Unassigned</option>
            {staff.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}
          </select>
          <button className="rounded-full border px-4 py-2 text-sm font-semibold" type="submit">Save assignment</button>
        </div>
      </form>
      <form onSubmit={addNote} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Internal notes</h2>
        <textarea name="note" required className="field mt-3" rows={3} placeholder="Add a note the customer will not see" />
        <button className="mt-3 rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Add note</button>
        <ul className="mt-4 space-y-3 text-sm">
          {quote.notes?.map((note) => <li key={`${note.createdAt}-${note.text}`} className="rounded-xl bg-navy-50 p-3"><p>{note.text}</p><p className="mt-1 text-xs text-slate-500">{note.authorName} · {new Date(note.createdAt).toLocaleString()}</p></li>)}
        </ul>
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Status history</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {quote.statusHistory?.map((entry, index) => (
            <li key={`${entry.changedAt}-${index}`}>{new Date(entry.changedAt).toLocaleString()} · {entry.actorName || 'System'} set {STATUS_LABELS[entry.to] || entry.to}{entry.note ? ` — ${entry.note}` : ''}</li>
          ))}
        </ol>
      </section>
      <div className="flex gap-3">
        <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => void archiveInquiry(false)}>Archive</button>
        <button type="button" className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-800" onClick={() => void archiveInquiry(true)}>Delete permanently</button>
      </div>
    </div>
  );
}
