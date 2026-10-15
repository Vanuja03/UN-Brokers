import { useEffect, useState } from 'react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { api } from '../services/api';
import type { Testimonial } from '../types';

export function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => { api.get('/testimonials').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <Container className="py-12">
      <Seo title="Client testimonials" description="Approved client feedback. Sample reviews are clearly labelled." path="/testimonials" />
      <h1 className="text-4xl font-bold">Client testimonials</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Published comments are approved by the business. Sample comments are not real customer reviews.</p>
      {items.length === 0 ? <p className="mt-8">No testimonials have been approved yet.</p> : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <li key={item._id} className="rounded-2xl border border-slate-200 p-5">
              <p className="leading-7 text-slate-700">“{item.review}”</p>
              <p className="mt-4 font-semibold">{item.customerDisplayName}</p>
              <p className="text-sm text-slate-500">{item.isDemo ? 'Sample' : item.verified ? 'Verified review' : 'Customer feedback'}{item.insuranceType ? ` · ${item.insuranceType}` : ''}</p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
