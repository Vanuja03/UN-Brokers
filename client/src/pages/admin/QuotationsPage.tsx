import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { services } from '../../content/services';
import { api } from '../../services/api';
import { STATUS_LABELS } from '../../utils/labels';

type Row = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  email: string;
  phone: string;
  insuranceType: string;
  status: string;
  createdAt: string;
};

const statuses = ['', 'new', 'contacted', 'awaiting-information', 'quote-in-progress', 'quotation-sent', 'converted', 'not-converted', 'archived'];

export function QuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [insuranceType, setInsuranceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api.get('/quotes', { params: { search, status, insuranceType, from, to, page, limit: 10 } }).then((response) => {
        setRows(response.data.data);
        setPages(response.data.meta.pages || 1);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, status, insuranceType, from, to, page]);

  async function exportCsv() {
    const response = await api.get('/quotes/export', { params: { search, status, insuranceType, from, to }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotation-inquiries.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => void exportCsv()}>Export CSV</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <input className="field" placeholder="Search name, email, phone, reference" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} aria-label="Search inquiries" />
        <select className="field" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} aria-label="Filter by status">
          {statuses.map((item) => <option key={item || 'all'} value={item}>{item ? STATUS_LABELS[item] : 'All statuses'}</option>)}
        </select>
        <select className="field" value={insuranceType} onChange={(event) => { setPage(1); setInsuranceType(event.target.value); }} aria-label="Filter by insurance">
          <option value="">All categories</option>
          {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
        </select>
        <input className="field" type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
        <input className="field" type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
      </div>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-600">No inquiries match these filters.</p> : rows.map((row) => (
          <article key={row._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link className="font-semibold text-navy-900" to={`/admin/quotations/${row._id}`}>{row.referenceNumber}</Link>
                <p className="text-sm">{row.customerName}</p>
                <p className="text-sm text-slate-600">{row.email} · {row.phone}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{STATUS_LABELS[row.status]}</p>
                <p className="text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="rounded-full border px-4 py-2 text-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <p className="text-sm">Page {page} of {pages}</p>
        <button type="button" className="rounded-full border px-4 py-2 text-sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}
