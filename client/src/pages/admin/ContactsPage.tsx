import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { STATUS_LABELS } from '../../utils/labels';

type Contact = {
  _id: string;
  referenceNumber: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  insuranceType?: string;
  status: string;
  createdAt: string;
};

export function ContactsPage() {
  const [rows, setRows] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api.get('/contacts', { params: { search, status, limit: 50 } }).then((response) => setRows(response.data.data));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);

  async function update(id: string, next: string) {
    await api.patch(`/contacts/${id}/status`, { status: next });
    const response = await api.get('/contacts', { params: { search, status, limit: 50 } });
    setRows(response.data.data);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Messages</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" aria-label="Search messages" />
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter messages by status">
          <option value="">All statuses</option>
          {['new', 'in-progress', 'resolved', 'archived'].map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-600">No messages match.</p> : rows.map((row) => (
          <article key={row._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.referenceNumber} · {row.subject}</p>
                <p className="text-sm">{row.name} · {row.email} · {row.phone}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{row.message}</p>
              </div>
              <select className="field w-auto" value={row.status} aria-label={`Status for ${row.referenceNumber}`} onChange={(event) => void update(row._id, event.target.value)}>
                {['new', 'in-progress', 'resolved', 'archived'].map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
              </select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
