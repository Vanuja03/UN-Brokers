import { FormEvent, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { services } from '../../content/services';
import { useAuth } from '../../context/AuthContext';
import type { Faq, InsuranceCopy, Partner, TeamMember, Testimonial } from '../../types';

type Tab = 'partners' | 'testimonials' | 'team' | 'faqs' | 'insurance';

export function ContentPage() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<Tab>('partners');
  const [message, setMessage] = useState('');
  if (admin?.role !== 'admin') return <p>Only an administrator can manage website content.</p>;
  return (
    <div>
      <h1 className="text-3xl font-bold">Content</h1>
      <p className="mt-2 text-sm text-slate-600">Sample records should be replaced before launch. Removing a record asks for confirmation.</p>
      {message ? <p className="mt-3 text-sm text-navy-800">{message}</p> : null}
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {(['partners', 'testimonials', 'team', 'faqs', 'insurance'] as Tab[]).map((item) => (
          <button key={item} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item ? 'bg-navy-900 text-white' : 'bg-white'}`} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'partners' ? <PartnerManager onMessage={setMessage} /> : null}
        {tab === 'testimonials' ? <TestimonialManager onMessage={setMessage} /> : null}
        {tab === 'team' ? <TeamManager onMessage={setMessage} /> : null}
        {tab === 'faqs' ? <FaqManager onMessage={setMessage} /> : null}
        {tab === 'insurance' ? <InsuranceManager onMessage={setMessage} /> : null}
      </div>
    </div>
  );
}

function PartnerManager({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<Partner[]>([]);
  const load = () => api.get('/admin/partners').then((response) => setItems(response.data.data));
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.post('/partners', { ...data, displayOrder: Number(data.displayOrder || 0), active: data.active === 'on', isDemo: false });
      event.currentTarget.reset();
      onMessage('Partner saved.');
      await load();
    } catch (error) { onMessage(getErrorMessage(error, 'Could not save the partner.')); }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-2">
        <input name="name" required placeholder="Name" className="field" />
        <input name="websiteUrl" placeholder="https:// website" className="field" />
        <input name="logoUrl" placeholder="https:// logo" className="field" />
        <input name="displayOrder" type="number" placeholder="Order" className="field" />
        <textarea name="description" placeholder="Short description" className="field md:col-span-2" />
        <label className="text-sm"><input type="checkbox" name="active" defaultChecked /> Active</label>
        <button className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Add partner</button>
      </form>
      {items.map((item) => (
        <article key={item._id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4">
          <div><h2 className="font-bold">{item.name}</h2>{item.isDemo ? <p className="text-xs uppercase text-amber-800">Sample</p> : null}<p className="text-sm text-slate-600">{item.description}</p></div>
          <button type="button" className="text-sm text-red-800" onClick={() => { if (window.confirm('Remove this partner?')) void api.delete(`/partners/${item._id}`).then(load); }}>Remove</button>
        </article>
      ))}
    </div>
  );
}

function TestimonialManager({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const load = () => api.get('/admin/testimonials').then((response) => setItems(response.data.data));
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.post('/testimonials', { ...data, approved: data.approved === 'on', verified: data.verified === 'on', isDemo: false, displayOrder: Number(data.displayOrder || 0) });
      event.currentTarget.reset();
      onMessage('Testimonial saved.');
      await load();
    } catch (error) { onMessage(getErrorMessage(error, 'Could not save the testimonial.')); }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4">
        <input name="customerDisplayName" required placeholder="Display name" className="field" />
        <textarea name="review" required placeholder="Approved review text" className="field" />
        <select name="insuranceType" className="field"><option value="">No category</option>{services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}</select>
        <label className="text-sm"><input name="approved" type="checkbox" /> Approved for the website</label>
        <label className="text-sm"><input name="verified" type="checkbox" /> Verified</label>
        <button className="w-fit rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Add testimonial</button>
      </form>
      {items.map((item) => (
        <article key={item._id} className="rounded-2xl bg-white p-4">
          <div className="flex justify-between gap-3"><h2 className="font-bold">{item.customerDisplayName}</h2><button type="button" className="text-sm text-red-800" onClick={() => { if (window.confirm('Remove this testimonial?')) void api.delete(`/testimonials/${item._id}`).then(load); }}>Remove</button></div>
          <p className="text-sm">{item.review}</p>
          <p className="text-xs text-slate-500">{item.approved ? 'Approved' : 'Hidden'}{item.isDemo ? ' · Sample' : ''}</p>
        </article>
      ))}
    </div>
  );
}

function TeamManager({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<TeamMember[]>([]);
  const load = () => api.get('/admin/team').then((response) => setItems(response.data.data));
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const qualifications = String(data.qualifications || '').split(',').map((item) => item.trim()).filter(Boolean);
    try {
      await api.post('/team', { ...data, qualifications, active: data.active === 'on', isDemo: false, displayOrder: Number(data.displayOrder || 0) });
      event.currentTarget.reset();
      onMessage('Team profile saved.');
      await load();
    } catch (error) { onMessage(getErrorMessage(error, 'Could not save the profile.')); }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4">
        <input name="name" required placeholder="Full name" className="field" />
        <input name="jobTitle" required placeholder="Job title" className="field" />
        <textarea name="biography" required placeholder="Short biography" className="field" />
        <input name="qualifications" placeholder="Qualifications, separated by commas" className="field" />
        <input name="imageUrl" placeholder="https:// photograph" className="field" />
        <input name="linkedinUrl" placeholder="https:// linkedin profile" className="field" />
        <label className="text-sm"><input name="active" type="checkbox" defaultChecked /> Active</label>
        <button className="w-fit rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Add profile</button>
      </form>
      {items.map((item) => (
        <article key={item._id} className="flex justify-between gap-3 rounded-2xl bg-white p-4">
          <div><h2 className="font-bold">{item.name}</h2><p className="text-sm">{item.jobTitle}</p>{item.isDemo ? <p className="text-xs uppercase text-amber-800">Sample</p> : null}</div>
          <button type="button" className="text-sm text-red-800" onClick={() => { if (window.confirm('Remove this profile?')) void api.delete(`/team/${item._id}`).then(load); }}>Remove</button>
        </article>
      ))}
    </div>
  );
}

function FaqManager({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<Faq[]>([]);
  const load = () => api.get('/admin/faqs').then((response) => setItems(response.data.data));
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.post('/faqs', { ...data, active: true, displayOrder: Number(data.displayOrder || 0) });
      event.currentTarget.reset();
      onMessage('FAQ saved.');
      await load();
    } catch (error) { onMessage(getErrorMessage(error, 'Could not save the FAQ.')); }
  }
  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4">
        <input name="question" required placeholder="Question" className="field" />
        <textarea name="answer" required placeholder="Answer" className="field" />
        <input name="category" defaultValue="general" className="field" aria-label="Category" />
        <button className="w-fit rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Add FAQ</button>
      </form>
      {items.map((item) => (
        <article key={item._id} className="rounded-2xl bg-white p-4">
          <div className="flex justify-between gap-3"><h2 className="font-bold">{item.question}</h2><button type="button" className="text-sm text-red-800" onClick={() => { if (window.confirm('Remove this FAQ?')) void api.delete(`/faqs/${item._id}`).then(load); }}>Remove</button></div>
          <p className="text-sm text-slate-600">{item.answer}</p>
        </article>
      ))}
    </div>
  );
}

function InsuranceManager({ onMessage }: { onMessage: (message: string) => void }) {
  const [items, setItems] = useState<InsuranceCopy[]>([]);
  const [slug, setSlug] = useState(services[0].slug);
  const current = items.find((item) => item.slug === slug);
  useEffect(() => { api.get('/insurance').then((response) => setItems(response.data.data)).catch(() => undefined); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.put(`/insurance/${slug}`, data);
      onMessage('Service description updated.');
    } catch (error) { onMessage(getErrorMessage(error, 'Could not update the description.')); }
  }
  return (
    <form key={current?.slug || slug} onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4">
      <label className="text-sm font-medium" htmlFor="slug">Service</label>
      <select id="slug" className="field" value={slug} onChange={(event) => setSlug(event.target.value as typeof slug)}>
        {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
      </select>
      <input name="name" defaultValue={current?.name || services.find((service) => service.slug === slug)?.name} className="field" required />
      <textarea name="shortDescription" defaultValue={current?.shortDescription || ''} className="field" required />
      <textarea name="overview" defaultValue={current?.overview || ''} className="field" rows={5} required />
      <input name="metaTitle" defaultValue={current?.metaTitle || ''} placeholder="Meta title" className="field" />
      <textarea name="metaDescription" defaultValue={current?.metaDescription || ''} placeholder="Meta description" className="field" />
      <button className="w-fit rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Save description</button>
    </form>
  );
}
