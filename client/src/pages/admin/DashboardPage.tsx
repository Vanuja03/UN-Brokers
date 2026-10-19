import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { api } from '../../services/api';
import { serviceMap } from '../../content/services';
import { STATUS_LABELS } from '../../utils/labels';
import { playNotificationSound, unlockNotificationSound } from '../../utils/notificationSound';
import type { InsuranceType } from '../../types';
import 'react-toastify/dist/ReactToastify.css';

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let ready = false;
    let previousTotal = 0;
    const seen = new Set<string>();

    async function load() {
      try {
        const response = await api.get('/quotes/stats');
        if (cancelled) return;
        const next = response.data.data as Stats;
        const arrivals = next.recent.filter((item) => !seen.has(item._id));
        const submittedSinceLastCheck = ready ? Math.max(0, next.total - previousTotal) : 0;
        const count = Math.max(arrivals.length, submittedSinceLastCheck);
        next.recent.forEach((item) => seen.add(item._id));
        previousTotal = next.total;
        if (ready && count > 0) {
          playNotificationSound();
          const waiting = next.newCount === 1 ? '1 quotation is still new' : `${next.newCount} quotations are still new`;
          toast.info(
            <span>
              <strong>{count === 1 ? '1 new quotation has arrived' : `${count} new quotations have arrived`}</strong>
              <br />
              {waiting}
            </span>,
            {
              toastId: `new-quotations-${Date.now()}`,
              onClick: () => navigate('/admin/quotations'),
            },
          );
        }
        ready = true;
        setStats(next);
        setError('');
      } catch {
        if (!cancelled && !ready) setError('Dashboard figures could not be loaded.');
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 15000);
    window.addEventListener('pointerdown', unlockNotificationSound);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', unlockNotificationSound);
    };
  }, [navigate]);
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
      <ToastContainer position="top-right" autoClose={8000} closeOnClick pauseOnHover newestOnTop />
      <h1 className="text-3xl font-bold">Overview</h1>
      <p className="text-sm text-slate-600">Figures come from saved inquiries. Every 15 seconds this page checks for new quotations and tells you how many have arrived, and how many are still new. Conversion rate is converted inquiries divided by inquiries that are not archived.</p>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="font-bold">Motor and third-party quotations</h2>
          <p className="mt-1 text-sm text-slate-600">Prepare a comparison in the company colours, save it separately from the inquiry, and download a PDF for the customer.</p>
        </div>
        <Link to="/admin/motor-quotations" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Open quotations</Link>
      </section>
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
