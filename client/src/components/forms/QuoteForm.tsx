import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { services } from '../../content/services';
import { defaultDetails, defaultDwellingInsuredLines, defaultEmployeeClasses, defaultInsuredLines, defaultMoneyTransfers, fieldsFor, type EmployeeClass, type InsuredLine, type MoneyTransfer, type QuoteField } from '../../content/quoteFields';
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
  insuranceDetails: Record<string, string | number | boolean | string[] | InsuredLine[] | EmployeeClass[] | MoneyTransfer[]>;
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
  const customerOnly = insuranceType === 'title-insurance';
  const visibleSteps = customerOnly ? ['Your details', 'Review'] : steps;
  const activeStep = customerOnly ? (step === 1 ? 1 : 2) : step;
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
      setStep(form.getValues('insuranceType') === 'title-insurance' ? 3 : 2);
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
      <ol className={`mt-3 grid gap-2 ${customerOnly ? 'grid-cols-2' : 'grid-cols-3'}`} aria-label="Form progress">
        {visibleSteps.map((label, index) => {
          const current = activeStep === index + 1;
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
          {insuranceType === 'fire' || insuranceType === 'dwelling-fire' ? (
            <fieldset>
              <legend className="text-sm font-semibold text-navy-900">Amount to be insured</legend>
              <div className="mt-3">
                <InsuredAmounts
                  lines={insuredLines(details.insuredItems, insuranceType === 'dwelling-fire' ? defaultDwellingInsuredLines : defaultInsuredLines)}
                  currency={currency}
                  errors={insuredLineErrors(formState.errors.insuranceDetails)}
                  onChange={(lines) => setValue('insuranceDetails.insuredItems', lines, { shouldValidate: false })}
                />
              </div>
            </fieldset>
          ) : null}
          {insuranceType === 'money-in-transit' ? (
            <fieldset>
              <legend className="text-sm font-semibold text-navy-900">Transfers</legend>
              <div className="mt-3">
                <MoneyTransfers
                  lines={moneyTransferLines(details.transfers)}
                  currency={currency}
                  errors={moneyTransferErrors(formState.errors.insuranceDetails)}
                  onChange={(lines) => setValue('insuranceDetails.transfers', lines, { shouldValidate: false })}
                />
              </div>
            </fieldset>
          ) : null}
          {insuranceType === 'workers-compensation' ? (
            <fieldset>
              <legend className="text-sm font-semibold text-navy-900">Classes of employees</legend>
              <div className="mt-3">
                <EmployeeClasses
                  lines={employeeClassLines(details.employeeClasses)}
                  currency={currency}
                  errors={employeeClassErrors(formState.errors.insuranceDetails)}
                  onChange={(lines) => setValue('insuranceDetails.employeeClasses', lines, { shouldValidate: false })}
                />
              </div>
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 space-y-4">
          <dl className="grid gap-3 rounded-xl bg-navy-50 p-4 text-sm">
            <div><dt className="font-medium text-navy-900">Name</dt><dd>{watch('customerName')}</dd></div>
            <div><dt className="font-medium text-navy-900">Contact</dt><dd>{watch('email')} · {watch('phone')}</dd></div>
            {Object.entries(details).filter(([, value]) => value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)).map(([key, value]) => {
              const option = fields.find((field) => field.name === key)?.options?.find((item) => item.value === value);
              const text = formatDetail(key, value, option?.label, currency);
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
        {step > 1 ? <button type="button" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold" onClick={() => setStep((value) => (customerOnly ? 1 : value - 1))}>Back</button> : null}
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

type LineError = {
  item?: { message?: string };
  quantity?: { message?: string };
  values?: { message?: string } & Array<{ message?: string } | undefined>;
};

function valuesForQuantity(current: string[] | undefined, quantity: string) {
  const count = Number(quantity) || 1;
  const next = (current ?? []).slice(0, count);
  while (next.length < count) next.push('');
  return next;
}

function insuredLines(value: FormValues['insuranceDetails'][string] | undefined, fallback: InsuredLine[]): InsuredLine[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry === 'string' || !entry || typeof entry !== 'object' || !('item' in entry))) {
    return fallback.map((line) => ({ ...line, values: [...line.values] }));
  }
  return (value as InsuredLine[]).map((line) => {
    const quantity = ['1', '2', '3'].includes(String(line.quantity)) ? String(line.quantity) : '1';
    return { item: line.item ?? '', quantity, values: valuesForQuantity(line.values, quantity) };
  });
}

function insuredLineErrors(details: unknown) {
  const node = details as { insuredItems?: LineError[] } | undefined;
  return node?.insuredItems;
}

type ClassError = {
  employeeClass?: { message?: string };
  duties?: { message?: string };
  estimatedNumber?: { message?: string };
  monthlyIncome?: { message?: string };
};

function employeeClassLines(value: FormValues['insuranceDetails'][string] | undefined): EmployeeClass[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry === 'string' || !entry || typeof entry !== 'object' || !('employeeClass' in entry))) {
    return defaultEmployeeClasses.map((line) => ({ ...line }));
  }
  return (value as EmployeeClass[]).map((line) => ({
    employeeClass: line.employeeClass ?? '',
    duties: line.duties ?? '',
    estimatedNumber: line.estimatedNumber ?? '',
    monthlyIncome: line.monthlyIncome ?? '',
  }));
}

function employeeClassErrors(details: unknown) {
  const node = details as { employeeClasses?: ClassError[] } | undefined;
  return node?.employeeClasses;
}

function formatDetail(key: string, value: FormValues['insuranceDetails'][string], optionLabel: string | undefined, currency: string) {
  if (key === 'insuredItems' && Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry !== 'object' || !entry || !('item' in entry)) return String(entry);
      const amounts = (entry.values ?? []).filter(Boolean).map((amount) => `${currency} ${amount}`).join(', ');
      return [entry.item, entry.quantity, amounts].filter(Boolean).join(' · ');
    }).join('; ');
  }
  if (key === 'transfers' && Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry !== 'object' || !entry || !('startLocation' in entry)) return String(entry);
      const amount = entry.transferAmount ? `${currency} ${entry.transferAmount}` : '';
      const route = [entry.startLocation, entry.endLocation].filter(Boolean).join(' to ');
      const times = entry.transferTimes ? `${entry.transferTimes} times` : '';
      return [amount, route, times].filter(Boolean).join(' · ');
    }).join('; ');
  }
  if (key === 'employeeClasses' && Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry !== 'object' || !entry || !('employeeClass' in entry)) return String(entry);
      const income = entry.monthlyIncome ? `${currency} ${entry.monthlyIncome}` : '';
      return [entry.employeeClass, entry.duties, entry.estimatedNumber, income].filter(Boolean).join(' · ');
    }).join('; ');
  }
  if (Array.isArray(value)) return value.join(', ');
  return optionLabel ?? String(value);
}

type TransferError = {
  transferAmount?: { message?: string };
  startLocation?: { message?: string };
  endLocation?: { message?: string };
  transferTimes?: { message?: string };
};

function moneyTransferLines(value: FormValues['insuranceDetails'][string] | undefined): MoneyTransfer[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry === 'string' || !entry || typeof entry !== 'object' || !('startLocation' in entry))) {
    return defaultMoneyTransfers.map((line) => ({ ...line }));
  }
  return (value as MoneyTransfer[]).map((line) => ({
    transferAmount: line.transferAmount ?? '',
    startLocation: line.startLocation ?? '',
    endLocation: line.endLocation ?? '',
    transferTimes: line.transferTimes ?? '',
  }));
}

function moneyTransferErrors(details: unknown) {
  const node = details as { transfers?: TransferError[] } | undefined;
  return node?.transfers;
}

function MoneyTransfers({ lines, currency, errors, onChange }: { lines: MoneyTransfer[]; currency: string; errors?: TransferError[]; onChange: (lines: MoneyTransfer[]) => void }) {
  function update(index: number, patch: Partial<MoneyTransfer>) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Transfer amount ({currency})
              <input className="field mt-1.5" type="number" min={0} step="0.01" inputMode="decimal" value={line.transferAmount} aria-invalid={Boolean(errors?.[index]?.transferAmount)} onChange={(event) => update(index, { transferAmount: event.target.value })} />
              {errors?.[index]?.transferAmount?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.transferAmount?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">Transfer times
              <input className="field mt-1.5" inputMode="numeric" value={line.transferTimes} aria-invalid={Boolean(errors?.[index]?.transferTimes)} onChange={(event) => update(index, { transferTimes: event.target.value })} />
              {errors?.[index]?.transferTimes?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.transferTimes?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">Start location
              <input className="field mt-1.5" value={line.startLocation} aria-invalid={Boolean(errors?.[index]?.startLocation)} onChange={(event) => update(index, { startLocation: event.target.value })} />
              {errors?.[index]?.startLocation?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.startLocation?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">End location
              <input className="field mt-1.5" value={line.endLocation} aria-invalid={Boolean(errors?.[index]?.endLocation)} onChange={(event) => update(index, { endLocation: event.target.value })} />
              {errors?.[index]?.endLocation?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.endLocation?.message}</span> : null}
            </label>
          </div>
          <button type="button" className="mt-3 rounded-full border px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" disabled={lines.length <= 1} onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-40" disabled={lines.length >= 12} onClick={() => onChange([...lines, { transferAmount: '', startLocation: '', endLocation: '', transferTimes: '' }])}>Add section</button>
    </div>
  );
}

function EmployeeClasses({ lines, currency, errors, onChange }: { lines: EmployeeClass[]; currency: string; errors?: ClassError[]; onChange: (lines: EmployeeClass[]) => void }) {
  function update(index: number, patch: Partial<EmployeeClass>) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Class of employees
              <input className="field mt-1.5" value={line.employeeClass} aria-invalid={Boolean(errors?.[index]?.employeeClass)} onChange={(event) => update(index, { employeeClass: event.target.value })} />
              {errors?.[index]?.employeeClass?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.employeeClass?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">Nature of duties
              <input className="field mt-1.5" value={line.duties} aria-invalid={Boolean(errors?.[index]?.duties)} onChange={(event) => update(index, { duties: event.target.value })} />
              {errors?.[index]?.duties?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.duties?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">Estimated number
              <input className="field mt-1.5" inputMode="numeric" value={line.estimatedNumber} aria-invalid={Boolean(errors?.[index]?.estimatedNumber)} onChange={(event) => update(index, { estimatedNumber: event.target.value })} />
              {errors?.[index]?.estimatedNumber?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.estimatedNumber?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">Monthly income ({currency})
              <input className="field mt-1.5" type="number" min={0} step="0.01" inputMode="decimal" value={line.monthlyIncome} aria-invalid={Boolean(errors?.[index]?.monthlyIncome)} onChange={(event) => update(index, { monthlyIncome: event.target.value })} />
              {errors?.[index]?.monthlyIncome?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.monthlyIncome?.message}</span> : null}
            </label>
          </div>
          <button type="button" className="mt-3 rounded-full border px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" disabled={lines.length <= 1} onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-40" disabled={lines.length >= 12} onClick={() => onChange([...lines, { employeeClass: '', duties: '', estimatedNumber: '', monthlyIncome: '' }])}>Add section</button>
    </div>
  );
}

function InsuredAmounts({ lines, currency, errors, onChange }: { lines: InsuredLine[]; currency: string; errors?: LineError[]; onChange: (lines: InsuredLine[]) => void }) {
  function update(index: number, patch: Partial<InsuredLine>) {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_9rem_auto]">
            <label className="text-xs font-medium text-slate-600">Item
              <input className="field mt-1.5" value={line.item} aria-invalid={Boolean(errors?.[index]?.item)} onChange={(event) => update(index, { item: event.target.value })} />
              {errors?.[index]?.item?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.item?.message}</span> : null}
            </label>
            <label className="text-xs font-medium text-slate-600">No of items or buildings
              <select className="field mt-1.5" value={line.quantity} aria-invalid={Boolean(errors?.[index]?.quantity)} onChange={(event) => update(index, { quantity: event.target.value, values: valuesForQuantity(line.values, event.target.value) })}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              {errors?.[index]?.quantity?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.quantity?.message}</span> : null}
            </label>
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40" disabled={lines.length <= 1} onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))}>Remove</button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {line.values.map((amount, valueIndex) => (
              <label key={valueIndex} className="text-xs font-medium text-slate-600">
                {line.values.length > 1 ? `Value of item or building ${valueIndex + 1}` : 'Value of item or building'} ({currency})
                <input className="field mt-1.5" type="number" min={0} step="0.01" inputMode="decimal" value={amount} aria-invalid={Boolean(errors?.[index]?.values?.[valueIndex] || errors?.[index]?.values?.message)} onChange={(event) => update(index, { values: line.values.map((current, currentIndex) => (currentIndex === valueIndex ? event.target.value : current)) })} />
                {errors?.[index]?.values?.[valueIndex]?.message ? <span className="mt-1 block text-sm text-red-700">{errors[index]?.values?.[valueIndex]?.message}</span> : null}
              </label>
            ))}
          </div>
          {errors?.[index]?.values?.message ? <p role="alert" className="mt-2 text-sm text-red-700">{errors[index]?.values?.message}</p> : null}
        </div>
      ))}
      <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-40" disabled={lines.length >= 12} onClick={() => onChange([...lines, { item: '', quantity: '1', values: [''] }])}>Add section</button>
    </div>
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
            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-600">{field.detailLabel || 'Details'}</label>
            <input id={id} className="field" type="text" placeholder={field.placeholder} aria-invalid={Boolean(error)} {...register(name)} />
            {error ? <p role="alert" className="mt-1 text-sm text-red-700">{error}</p> : null}
          </div>
          <div>
            <label htmlFor={dateId} className="mb-1.5 block text-xs font-medium text-slate-600">{field.dateLabel || 'Date'}</label>
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
