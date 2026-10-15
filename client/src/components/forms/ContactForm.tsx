import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { services } from '../../content/services';
import { contactFormSchema } from '../../schemas/quote';
import { api, getErrorMessage, getFieldErrors, trackEvent } from '../../services/api';
import type { InsuranceType } from '../../types';

type ContactValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  insuranceType: InsuranceType | '';
  message: string;
  consent: boolean;
  website: string;
};

export function ContactForm() {
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', insuranceType: '', message: '', consent: false, website: '' },
  });

  async function onSubmit(values: ContactValues) {
    setFormError('');
    try {
      const response = await api.post('/contacts', values, { headers: { 'X-Idempotency-Key': idempotencyKey } });
      setReference(response.data.data.referenceNumber);
      trackEvent('contact_request');
    } catch (error) {
      for (const item of getFieldErrors(error)) form.setError(item.field as keyof ContactValues, { message: item.message });
      setFormError(getErrorMessage(error, 'We could not send your message. Please try again.'));
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card" role="status">
        <CheckCircle2 className="h-8 w-8 text-navy-800" aria-hidden="true" />
        <h2 className="mt-3 text-2xl font-bold">Message received</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Reference <strong>{reference}</strong>. This confirms the message was saved. It is not a policy confirmation.</p>
      </div>
    );
  }

  const error = (name: keyof ContactValues) => form.formState.errors[name]?.message;

  return (
    <form className="form-shell grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {formError ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p> : null}
      <Labeled id="contact-name" label="Name" required error={error('name')}>
        <input id="contact-name" className="field" autoComplete="name" {...form.register('name')} />
      </Labeled>
      <div className="form-pair">
        <Labeled id="contact-email" label="Email" required error={error('email')}>
          <input id="contact-email" className="field" autoComplete="email" {...form.register('email')} />
        </Labeled>
        <Labeled id="contact-phone" label="Telephone" required error={error('phone')}>
          <input id="contact-phone" className="field" autoComplete="tel" {...form.register('phone')} />
        </Labeled>
      </div>
      <Labeled id="contact-subject" label="Subject" required error={error('subject')}>
        <input id="contact-subject" className="field" {...form.register('subject')} />
      </Labeled>
      <Labeled id="contact-type" label="Insurance category (optional)" error={error('insuranceType')}>
        <select id="contact-type" className="field" {...form.register('insuranceType')}>
          <option value="">Not specific</option>
          {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
        </select>
      </Labeled>
      <Labeled id="contact-message" label="Message" required error={error('message')}>
        <textarea id="contact-message" rows={5} className="field" {...form.register('message')} />
      </Labeled>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input type="checkbox" className="mt-1" {...form.register('consent')} />
        <span>I agree to the <Link className="font-semibold underline" to="/privacy-policy">privacy notice</Link>. <span className="text-red-700">*</span></span>
      </label>
      {error('consent') ? <p role="alert" className="text-sm text-red-700">{error('consent')}</p> : null}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" {...form.register('website')} />
      </div>
      <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex w-fit items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Send message
      </button>
    </form>
  );
}

function Labeled({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label} {required ? <span className="text-red-700">*</span> : null}</label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
