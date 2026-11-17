import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';
import { downloadDebitAdvice } from './DebitAdvicePage';

type ConfirmationType = 'renewal' | 'new-business';

type Draft = {
  confirmationType: ConfirmationType;
  vehicleNumber: string;
  customerName: string;
  sumInsured: string;
  contactNo: string;
  notes: string;
};

function blankDraft(): Draft {
  return {
    confirmationType: 'renewal',
    vehicleNumber: '',
    customerName: '',
    sumInsured: '',
    contactNo: '',
    notes: '',
  };
}

function confirmationFrom(value: string | undefined): ConfirmationType {
  return value === 'new-business' ? 'new-business' : 'renewal';
}

export function DebitAdviceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        if (!cancelled) setDraft(blankDraft());
        return;
      }
      const response = await api.get(`/debit-advice/${id}`);
      const saved = response.data.data as Partial<Draft> & { confirmationType?: string };
      if (!cancelled) {
        setDraft({
          ...blankDraft(),
          confirmationType: confirmationFrom(saved.confirmationType),
          vehicleNumber: saved.vehicleNumber || '',
          customerName: saved.customerName || '',
          sumInsured: saved.sumInsured || '',
          contactNo: saved.contactNo || '',
          notes: saved.notes || '',
        });
      }
    }
    load().catch((err) => {
      if (!cancelled) setError(getErrorMessage(err, 'The debit advice could not be opened.'));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function localErrors(values: Draft) {
    const errors: Record<string, string> = {};
    if (values.confirmationType !== 'renewal' && values.confirmationType !== 'new-business') errors.confirmationType = 'Choose renewal or new business confirmation.';
    if (!values.vehicleNumber.trim()) errors.vehicleNumber = 'This field is required.';
    if (!values.customerName.trim()) errors.customerName = 'This field is required.';
    if (!values.sumInsured.trim()) errors.sumInsured = 'This field is required.';
    if (!values.contactNo.trim()) errors.contactNo = 'Enter a contact number.';
    else if (!/^[+0-9][0-9\s()-]{6,19}$/.test(values.contactNo.trim())) errors.contactNo = 'Enter a valid contact number.';
    if (values.notes.trim().length > 800) errors.notes = 'Enter 800 characters or fewer.';
    return errors;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const found = localErrors(draft);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      setError('Please check the highlighted information and try again.');
      return;
    }
    setPending(true);
    setError('');
    setFieldErrors({});
    let saved: { _id: string; referenceNumber: string; vehicleNumber: string } | null = null;
    try {
      const response = id ? await api.patch(`/debit-advice/${id}`, draft) : await api.post('/debit-advice', draft);
      saved = response.data.data;
    } catch (err) {
      const nextErrors: Record<string, string> = {};
      for (const item of getFieldErrors(err)) nextErrors[item.field] = item.message;
      setFieldErrors(nextErrors);
      setError(getErrorMessage(err, 'The debit advice could not be saved.'));
      setPending(false);
      return;
    }
    try {
      if (saved) await downloadDebitAdvice(saved._id, saved.referenceNumber, saved.vehicleNumber);
    } catch {
      setError('The debit advice was saved, but the PDF could not be downloaded. Use Download PDF from the list.');
    } finally {
      setPending(false);
    }
    if (saved && !id) navigate(`/admin/debit-advice/${saved._id}`, { replace: true });
  }

  if (error && !draft) return <p role="alert">{error}</p>;
  if (!draft) return <p>Loading debit advice…</p>;

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6" noValidate>
      <Link to="/admin/debit-advice" className="text-sm font-semibold underline">All debit advice</Link>
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Edit debit advice' : 'New debit advice'}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Choose renewal confirmation or new business confirmation. That choice is printed as the subheading. Saving generates the PDF.</p>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
        <legend className="px-1 text-lg font-bold">Confirmation</legend>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
            <input type="radio" name="confirmationType" checked={draft.confirmationType === 'renewal'} onChange={() => update({ confirmationType: 'renewal' })} />
            Renewal confirmation
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
            <input type="radio" name="confirmationType" checked={draft.confirmationType === 'new-business'} onChange={() => update({ confirmationType: 'new-business' })} />
            New business confirmation
          </label>
        </div>
        {fieldErrors.confirmationType ? <p className="mt-2 text-sm text-red-700">{fieldErrors.confirmationType}</p> : null}
      </fieldset>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Field label="Vehicle no" value={draft.vehicleNumber} error={fieldErrors.vehicleNumber} onChange={(value) => update({ vehicleNumber: value })} />
        <Field label="Customer name" value={draft.customerName} error={fieldErrors.customerName} onChange={(value) => update({ customerName: value })} />
        <Field label="Sum insured" value={draft.sumInsured} error={fieldErrors.sumInsured} onChange={(value) => update({ sumInsured: value })} />
        <Field label="Contact no" type="tel" value={draft.contactNo} error={fieldErrors.contactNo} autoComplete="tel" onChange={(value) => update({ contactNo: value })} />
      </section>
      <label className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-navy-900">
        Notes
        <span className="mt-1 block font-normal text-slate-600">Optional. Anything written here is printed at the bottom of the advice.</span>
        <textarea
          className="field mt-3 min-h-28"
          value={draft.notes}
          maxLength={800}
          aria-invalid={fieldErrors.notes ? true : undefined}
          onChange={(event) => update({ notes: event.target.value })}
        />
        {fieldErrors.notes ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.notes}</span> : null}
      </label>
      <button type="submit" className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60" disabled={pending}>
        {pending ? 'Saving…' : 'Save and generate PDF'}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, error, type = 'text', autoComplete }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: 'text' | 'tel'; autoComplete?: string }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <input className="field mt-1.5" type={type} inputMode={type === 'tel' ? 'tel' : undefined} autoComplete={autoComplete} value={value} aria-invalid={error ? true : undefined} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
