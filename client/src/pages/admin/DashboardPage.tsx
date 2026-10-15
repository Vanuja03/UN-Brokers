import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { serviceMap } from '../../content/services';
import { STATUS_LABELS } from '../../utils/labels';
import type { InsuranceType } from '../../types';

type Summary = { _id: string; referenceNumber: string; customerName: string; insuranceType: InsuranceType; status: string; createdAt: string };
type Stats = {
  total: number;
  newCount: number;
  awaitingFollowUp: number;
  quotationSent: number;
  converted: number;
  conversionRate: number;
  byCategory: { insuranceType: InsuranceType; count: number }[];
  trend: { date: string; count: number }[];
  recent: Summary[];
  followUps: Summary[];
};

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/quotes/stats').then((response) => setStats(response.data.data)).catch(() => setError('Dashboard figures could not be loaded.'));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!stats) return <p>Loading inquiries…</p>;
  const max = Math.max(1, ...stats.trend.map((item) => item.count));
  const cards = [
    ['Total inquiries', stats.total],
    ['New', stats.newCount],
    ['Awaiting follow-up', stats.awaitingFollowUp],
    ['Quotations sent', stats.quotationSent],
    ['Converted', stats.converted],
    ['Conversion rate', `${stats.conversionRate}%`],
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Overview</h1>
      <p className="text-sm text-slate-600">Figures come from saved inquiries. Conversion rate is converted inquiries divided by inquiries that are not archived.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-bold text-navy-900">{value}</p>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Inquiries over 14 days</h2>
        <div className="mt-4 flex h-36 items-end gap-1" aria-hidden="true">
          {stats.trend.map((item) => (
            <div key={item.date} className="flex-1 rounded-t bg-navy-800" style={{ height: `${Math.max(4, (item.count / max) * 100)}%` }} title={`${item.date}: ${item.count}`} />
          ))}
        </div>
        <ul className="sr-only">
          {stats.trend.map((item) => <li key={item.date}>{item.date}: {item.count} inquiries</li>)}
        </ul>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Leads by category</h2>
        <ul className="mt-4 space-y-2">
          {stats.byCategory.length === 0 ? <li className="text-sm text-slate-600">No inquiries yet.</li> : stats.byCategory.map((item) => (
            <li key={item.insuranceType} className="flex items-center justify-between text-sm"><span>{serviceMap[item.insuranceType]?.name || item.insuranceType}</span><span className="font-semibold">{item.count}</span></li>
          ))}
        </ul>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <InquiryList title="Recent inquiries" items={stats.recent} />
        <InquiryList title="Follow-up reminders" items={stats.followUps} empty="No inquiries have been waiting more than two days." />
      </div>
    </div>
  );
}

function InquiryList({ title, items, empty = 'No inquiries yet.' }: { title: string; items: Summary[]; empty?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">{title}</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-slate-600">{empty}</p> : (
        <ul className="mt-3 divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item._id} className="py-3 text-sm">
              <Link className="font-semibold text-navy-900" to={`/admin/quotations/${item._id}`}>{item.referenceNumber}</Link>
              <p>{item.customerName} · {STATUS_LABELS[item.status] || item.status}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
