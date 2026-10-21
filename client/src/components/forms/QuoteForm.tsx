import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { services } from '../../content/services';
import { defaultDetails, fieldsFor, type QuoteField } from '../../content/quoteFields';
import { buildQuoteSchema, contactSchema, detailSchemas } from '../../schemas/quote';
import { api, getErrorMessage, getFieldErrors, trackEvent } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import type { InsuranceType } from '../../types';
import { readCampaign } from '../../utils/campaign';
import { labelFor } from '../../utils/labels';

type QuoteFormProps = {
  fixedType?: InsuranceType;
  initialType?: InsuranceType;
  selectionToken?: number;
  sourcePage?: string;
};

type FormValues = {
  customerName: string;
  phone: string;
  email: string;
  preferredContactMethod: 'phone' | 'email' | 'either';
  insuranceType: InsuranceType;
  message: string;
  consent: boolean;
  website: string;
  insuranceDetails: Record<string, string | number | boolean | string[]>;
};

const steps = ['Your details', 'Cover details', 'Review'];

function fieldId(name: string) {
  return name.replace(/\./g, '-');
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function revealForm(form: HTMLFormElement | null, toTop = false) {
  if (!form) return;
  const behavior = scrollBehavior();
  const scroller = form.parentElement;
  if (toTop && scroller && scroller.scrollHeight > scroller.clientHeight + 8) {
    scroller.scrollTo({ top: 0, behavior });
    return;
  }
  const target = form.querySelector('[role="alert"]') ?? form;
  target.scrollIntoView({ block: 'nearest', behavior });
}

function PolicyCorner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) videoRef.current?.pause();
  }, []);

  return (
    <div className="policy-corner" aria-hidden="true">
      <video ref={videoRef} className="policy-corner-video" src="/covers/policy-sign.mp4" autoPlay muted loop playsInline tabIndex={-1} />
    </div>
  );
}

function FieldShell({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-900">
        {label} {required ? <span className="text-red-700">*</span> : null}
      </label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function QuoteForm({ fixedType, initialType, selectionToken, sourcePage }: QuoteFormProps) {
  const { settings } = useSettings();
  const currency = settings.defaultCurrency || 'LKR';
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [reference, setReference] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const formRef = useRef<HTMLFormElement>(null);
  const skipScroll = useRef(true);
  const seenToken = useRef<number | null>(null);
  const startingType = fixedType ?? initialType ?? 'motor';

  const form = useForm<FormValues>({
    defaultValues: {
      customerName: '',
      phone: '',
      email: '',
      preferredContactMethod: 'either',
      insuranceType: startingType,
      message: '',
      consent: false,
      website: '',
      insuranceDetails: defaultDetails(startingType),
    },
  });

  const { register, handleSubmit, watch, setValue, setError, clearErrors, formState } = form;
  const insuranceType = watch('insuranceType');
  const details = watch('insuranceDetails');
  const fields = useMemo(() => fieldsFor(insuranceType, currency), [insuranceType, currency]);
  const groups = [...new Set(fields.map((field) => field.group))];

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    revealForm(formRef.current, true);
  }, [step]);

  useEffect(() => {
    const next = fixedType ?? initialType;
    if (!next) return;
    const tokenChanged = selectionToken != null && seenToken.current !== selectionToken;
    if (selectionToken != null) seenToken.current = selectionToken;
    if (form.getValues('insuranceType') !== next) {
      setValue('insuranceType', next);
      setValue('insuranceDetails', defaultDetails(next));
      clearErrors();
    }
    if (tokenChanged) setStep(1);
  }, [fixedType, initialType, selectionToken, setValue, clearErrors, form]);

  function changeType(next: InsuranceType) {
    setValue('insuranceType', next);
    setValue('insuranceDetails', defaultDetails(next));
    clearErrors();
  }

  function applyZod(error: ZodError, prefix = '') {
    for (const issue of error.issues) {
      const path = [prefix, ...issue.path.map(String)].filter(Boolean).join('.');
      setError(path as never, { message: issue.message });
    }
  }

  function goNext() {
    clearErrors();
    setFormError('');
    if (step === 1) {
      const result = contactSchema.safeParse(form.getValues());
      if (!result.success) {
        applyZod(result.error);
        requestAnimationFrame(() => revealForm(formRef.current));
        return;
      }
      setStep(2);
      return;
    }
    const result = detailSchemas[insuranceType].safeParse(form.getValues().insuranceDetails);
    if (!result.success) {
      applyZod(result.error, 'insuranceDetails');
      requestAnimationFrame(() => revealForm(formRef.current));
      return;
    }
    setStep(3);
  }

  async function onSubmit(values: FormValues) {
    setFormError('');
    const parsed = buildQuoteSchema(values.insuranceType).safeParse(values);
    if (!parsed.success) {
      applyZod(parsed.error);
      setFormError('Please check the highlighted fields.');
      requestAnimationFrame(() => revealForm(formRef.current));
      return;
    }
    try {
      const response = await api.post(
        '/quotes',
        {
          ...parsed.data,
          sourcePage: sourcePage || window.location.pathname,
          campaignSource: readCampaign(),
        },
        { headers: { 'X-Idempotency-Key': idempotencyKey } },
      );
      setReference(response.data.data.referenceNumber);
      trackEvent('quote_request', { insurance_type: values.insuranceType });
    } catch (error) {
      for (const item of getFieldErrors(error)) setError(item.field as never, { message: item.message });
      setFormError(getErrorMessage(error, 'We could not submit your inquiry. Your details are still on this page. Please try again.'));
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card" role="status">
        <CheckCircle2 className="h-8 w-8 text-navy-800" aria-hidden="true" />
        <h2 className="mt-3 text-2xl font-bold text-navy-900">Your inquiry has been received</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Reference <strong className="text-navy-900">{reference}</strong>. This is not a policy and not a binding offer. The team will contact you if they need anything else.
        </p>
        <Link to="/" className="mt-5 inline-flex text-sm font-semibold text-navy-900 underline">Back to the homepage</Link>
      </div>
    );
  }

  function errorFor(name: keyof FormValues) {
    const message = formState.errors[name]?.message;
    return typeof message === 'string' ? message : undefined;
  }

  function detailError(name: string) {
    const node = formState.errors.insuranceDetails as Record<string, { message?: string }> | undefined;
    return node?.[name]?.message;
  }

  return (
    <form ref={formRef} className="form-shell scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7" onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={formState.isSubmitting}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-navy-700">Quotation inquiry</p>
          <h2 className="mt-1 text-2xl font-bold text-navy-900">{fixedType ? services.find((item) => item.slug === fixedType)?.name : 'Tell us what you need'}</h2>
        </div>
        <PolicyCorner />
      </div>
      <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Form progress">
        {steps.map((label, index) => {
          const current = step === index + 1;
          return (
            <li key={label} aria-current={current ? 'step' : undefined} className={`rounded-lg px-2 py-2.5 text-center text-xs font-semibold leading-4 ${current ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-800'}`}>
              <span className="block">{index + 1}</span>
              <span className="mt-1 block">{label}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm leading-6 text-slate-600">Required fields are marked with *. Submitting this form does not start cover.</p>
      {formError ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p> : null}

      {step === 1 ? (
        <div className="mt-5 grid gap-5">
          <FieldShell id="customerName" label="Full name" required error={errorFor('customerName')}>
            <input id="customerName" className="field" autoComplete="name" aria-invalid={Boolean(errorFor('customerName'))} aria-describedby={errorFor('customerName') ? 'customerName-error' : undefined} {...register('customerName')} />
          </FieldShell>
          <div className="form-pair">
            <FieldShell id="phone" label="Mobile number" required error={errorFor('phone')}>
              <input id="phone" className="field" autoComplete="tel" inputMode="tel" aria-invalid={Boolean(errorFor('phone'))} {...register('phone')} />
            </FieldShell>
            <FieldShell id="email" label="Email address" required error={errorFor('email')}>
              <input id="email" className="field" autoComplete="email" inputMode="email" aria-invalid={Boolean(errorFor('email'))} {...register('email')} />
            </FieldShell>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-navy-900">Preferred contact method <span className="text-red-700">*</span></legend>
            <div className="flex flex-wrap gap-3">
              {[['phone', 'Phone'], ['email', 'Email'], ['either', 'Either']].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <input type="radio" value={value} {...register('preferredContactMethod')} /> {label}
                </label>
              ))}
            </div>
          </fieldset>
          <FieldShell id="insuranceType" label="Insurance category" required error={errorFor('insuranceType')}>
            <select
              id="insuranceType"
              className="field"
              disabled={Boolean(fixedType)}
              value={insuranceType}
              onChange={(event) => changeType(event.target.value as InsuranceType)}
            >
              {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
            </select>
          </FieldShell>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5 space-y-6">
          {insuranceType === 'travel' ? <TravelBenefits details={details} setValue={setValue} /> : null}
          {groups.map((group) => (
            <fieldset key={group}>
              <legend className="text-sm font-semibold text-navy-900">{group}</legend>
              <div className="mt-3 grid gap-5">
                {fields.filter((field) => field.group === group).map((field) => (
                  <DetailField key={field.name} field={field} details={details} register={register} error={detailError(field.name)} dateError={field.dateName ? detailError(field.dateName) : undefined} />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 space-y-4">
          <dl className="grid gap-3 rounded-xl bg-navy-50 p-4 text-sm">
            <div><dt className="font-medium text-navy-900">Name</dt><dd>{watch('customerName')}</dd></div>
            <div><dt className="font-medium text-navy-900">Contact</dt><dd>{watch('email')} · {watch('phone')}</dd></div>
            {Object.entries(details).filter(([, value]) => value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)).map(([key, value]) => {
              const option = fields.find((field) => field.name === key)?.options?.find((item) => item.value === value);
              const text = Array.isArray(value) ? value.join(', ') : option?.label ?? String(value);
              return <div key={key}><dt className="font-medium text-navy-900">{labelFor(key)}</dt><dd>{text}</dd></div>;
            })}
          </dl>
          <FieldShell id="message" label="Optional message" error={errorFor('message')}>
            <textarea id="message" rows={4} className="field" {...register('message')} />
          </FieldShell>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input type="checkbox" className="mt-1" {...register('consent')} />
            <span>I agree to the <Link to="/privacy-policy" className="font-semibold text-navy-900 underline">privacy notice</Link> and understand this form requests a quotation inquiry. It does not purchase a policy. <span className="text-red-700">*</span></span>
          </label>
          {formState.errors.consent ? <p role="alert" className="text-sm text-red-700">{formState.errors.consent.message}</p> : null}
        </div>
      ) : null}

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 1 ? <button type="button" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold" onClick={() => setStep((value) => value - 1)}>Back</button> : null}
        {step < 3 ? <button type="button" className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white" onClick={goNext}>Continue</button> : (
          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {formState.isSubmitting ? 'Submitting…' : 'Submit inquiry'}
          </button>
        )}
      </div>
    </form>
  );
}

function DetailField({ field, details, register, error, dateError }: { field: QuoteField; details: FormValues['insuranceDetails']; register: ReturnType<typeof useForm<FormValues>>['register']; error?: string; dateError?: string }) {
  if (field.showWhen && details[field.showWhen.field] !== field.showWhen.equals) return null;
  const name = `insuranceDetails.${field.name}` as const;
  const id = fieldId(name);
  if (field.dateName) {
    const dateName = `insuranceDetails.${field.dateName}` as const;
    const dateId = fieldId(dateName);
    return (
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-navy-900">{field.label}</legend>
        <div className="form-pair">
          <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600">Details</label>
            <input id={id} className="field" type="text" placeholder={field.placeholder} aria-invalid={Boolean(error)} {...register(name)} />
            {error ? <p role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
          </div>
          <div>
            <label htmlFor={dateId} className="mb-1.5 block text-xs font-medium text-slate-600">Date</label>
            <input id={dateId} className="field" type="date" aria-invalid={Boolean(dateError)} {...register(dateName)} />
            {dateError ? <p role="alert" className="mt-1 text-sm text-red-700">{dateError}</p> : null}
          </div>
        </div>
        {field.help ? <p className="mt-1 text-xs text-slate-500">{field.help}</p> : null}
      </fieldset>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-3 text-sm text-navy-900">
        <input type="checkbox" className="mt-1" {...register(name)} />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === 'radio' && field.options) {
    return (
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{field.label} {field.required ? <span className="text-red-700">*</span> : null}</legend>
        <div className="flex flex-wrap gap-3">
          {field.options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <input type="radio" value={option.value} {...register(name)} /> {option.label}
            </label>
          ))}
        </div>
        {error ? <p role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
      </fieldset>
    );
  }
  return (
    <FieldShell id={id} label={field.label} required={field.required} error={error}>
      {field.type === 'select' ? (
        <select id={id} className="field" aria-invalid={Boolean(error)} {...register(name)}>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea id={id} rows={3} className="field" placeholder={field.placeholder} aria-invalid={Boolean(error)} {...register(name)} />
      ) : (
        <input id={id} className="field" type={field.type === 'number' ? 'number' : field.type} inputMode={field.inputMode} placeholder={field.placeholder} aria-invalid={Boolean(error)} {...register(name)} />
      )}
      {field.help ? <p className="mt-1 text-xs text-slate-500">{field.help}</p> : null}
    </FieldShell>
  );
}

function TravelBenefits({ details, setValue }: { details: FormValues['insuranceDetails']; setValue: ReturnType<typeof useForm<FormValues>>['setValue'] }) {
  const selected = Array.isArray(details.benefitPreferences) ? details.benefitPreferences : [];
  const options = [
    ['medical', 'Medical expenses'],
    ['baggage', 'Baggage'],
    ['cancellation', 'Cancellation'],
    ['other', 'Another benefit'],
  ] as const;
  function toggle(value: string) {
    const next = selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
    setValue('insuranceDetails.benefitPreferences', next);
  }
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-navy-900">Benefits you want considered</legend>
      <p className="mt-1 text-xs text-slate-500">Optional. An insurer may not offer every benefit.</p>
      <div className="form-pair mt-3">
        {options.map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)} /> {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
