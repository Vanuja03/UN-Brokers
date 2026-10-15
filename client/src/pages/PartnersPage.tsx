import { useEffect, useState } from 'react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { api } from '../services/api';
import type { Partner } from '../types';

export function PartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);
  useEffect(() => { api.get('/partners').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <Container className="py-12">
      <Seo title="Insurance partners" description="Insurance partners and collaborators published by the brokerage." path="/partners" />
      <h1 className="text-4xl font-bold">Insurance partners and collaborators</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Partnerships are shown only when the business publishes them. Sample cards are for layout preview.</p>
      {items.length === 0 ? <p className="mt-8 text-sm">No partner profiles have been published yet.</p> : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item._id} className="rounded-2xl border border-slate-200 p-5">
              {item.logoUrl ? <img src={item.logoUrl} alt="" className="mb-4 max-h-12 object-contain" /> : null}
              <h2 className="text-xl font-bold">{item.name}</h2>
              {item.isDemo ? <p className="text-xs font-semibold uppercase text-amber-800">Sample</p> : null}
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              {item.websiteUrl ? <a className="mt-3 inline-block text-sm font-semibold underline" href={item.websiteUrl} target="_blank" rel="noreferrer">Official website</a> : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
