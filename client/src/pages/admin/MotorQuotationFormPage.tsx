import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { blankQuotation, isYesNoBenefit, resizeInsurers, rowLabels, type MotorCover, type MotorQuotationDraft } from '../../content/motorQuotation';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { downloadPdf } from './MotorQuotationsPage';

const usageLabels: Record<string, string> = {
  private: 'Private',
  business: 'Business',
  'commercial-passenger': 'Commercial passenger',
  'goods-transport': 'Goods transport',
  other: 'Other',
};

const fuelOptions = ['Petrol', 'Diesel', 'Electric', 'PHEV', 'Hybrid'];

const fuelLabels: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  electric: 'Electric',
  phev: 'PHEV',
  hybrid: 'Hybrid',
};

async function messageFrom(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      return fallback;
    }
  }
  return getErrorMessage(error, fallback);
}

export function MotorQuotationFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const inquiryId = search.get('inquiry') || '';
  const [draft, setDraft] = useState<MotorQuotationDraft | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id) {
        const response = await api.get(`/motor-quotations/${id}`);
        if (!cancelled) setDraft(response.data.data);
        return;
      }
      const next = blankQuotation('motor', admin?.name || '');
      next.preparedByEmail = admin?.email || '';
      if (!inquiryId) {
        if (!cancelled) setDraft(next);
        return;
      }
      const response = await api.get(`/quotes/${inquiryId}`);
      const quote = response.data.data as { customerName: string; insuranceType: string; insuranceDetails?: Record<string, string | number> };
      if (quote.insuranceType !== 'motor' && quote.insuranceType !== 'motor-third-party') {
        throw new Error('Only motor and third-party inquiries can use this quotation.');
      }
      const details = quote.insuranceDetails || {};
      const filled = blankQuotation(quote.insuranceType, admin?.name || '');
      filled.preparedByEmail = admin?.email || '';
      filled.customerName = quote.customerName || '';
      filled.vehicleNumber = String(details.registrationNumber || '');
      filled.usage = usageLabels[String(details.vehicleUsage || '')] || String(details.vehicleUsage || '');
      filled.yearOfManufacture = String(details.yearOfManufacture || '');
      filled.sumInsured = details.estimatedMarketValue ? String(details.estimatedMarketValue) : '';
      filled.make = String(details.vehicleMake || '');
      filled.model = String(details.vehicleModel || '');
      filled.fuel = fuelLabels[String(details.fuelType || '')] || String(details.fuelType || '');
      filled.inquiryId = inquiryId;
      if (!cancelled) setDraft(filled);
    }
    load().catch((err: unknown) => {
      if (cancelled) return;
      const plain = err instanceof Error && !('isAxiosError' in err) ? err.message : '';
      setError(plain || getErrorMessage(err, 'The quotation could not be opened.'));
    });
    return () => {
      cancelled = true;
    };
  }, [id, inquiryId, admin?.name, admin?.email]);

  function update(patch: Partial<MotorQuotationDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function setCell(rowIndex: number, valueIndex: number, next: string) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        rows: current.rows.map((item, itemIndex) => itemIndex === rowIndex
          ? { ...item, values: item.values.map((cell, cellIndex) => (cellIndex === valueIndex ? next : cell)) }
          : item),
      };
    });
  }

  function changeType(insuranceType: MotorCover) {
    setDraft((current) => {
      if (!current) return current;
      const insurers = current.insurers;
      return {
        ...current,
        insuranceType,
        rows: rowLabels(insuranceType).map((label) => ({ label, values: insurers.map(() => '') })),
      };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setPending(true);
    setError('');
    const download = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'download';
    try {
      const body = { ...draft, inquiryId: draft.inquiryId || '' };
      const response = id
        ? await api.patch(`/motor-quotations/${id}`, body)
        : await api.post('/motor-quotations', body);
      const saved = response.data.data as { _id: string; referenceNumber: string };
      if (download) await downloadPdf(saved._id, saved.referenceNumber);
      navigate(`/admin/motor-quotations/${saved._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'The quotation could not be saved.'));
    } finally {
      setPending(false);
    }
  }

  async function showPreview() {
    if (!draft) return;
    if (draft.customerName.trim().length < 2) {
      setError('Enter the customer name before showing a preview.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await api.post('/motor-quotations/preview', { ...draft, inquiryId: draft.inquiryId || '' }, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
      if (!opened) setError('Allow pop-ups to show the preview.');
    } catch (err) {
      setError(await messageFrom(err, 'The preview could not be opened.'));
    } finally {
      setPending(false);
    }
  }

  if (error && !draft) return <p role="alert">{error}</p>;
  if (!draft) return <p>Loading quotation…</p>;

  return (
    <form onSubmit={save} className="space-y-6">
      <Link to="/admin/motor-quotations" className="text-sm font-semibold underline">All motor quotations</Link>
      <div>
        <h1 className="text-3xl font-bold">{id ? 'Edit quotation' : 'New customer quotation'}</h1>
        <p className="mt-2 text-sm text-slate-600">Fill the comparison, save it, and download a PDF in the company colours for the customer.</p>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-medium">Cover
          <select className="field mt-1" value={draft.insuranceType} disabled={Boolean(draft.inquiryId)} onChange={(event) => changeType(event.target.value as MotorCover)}>
            <option value="motor">Motor insurance</option>
            <option value="motor-third-party">Third-party motor insurance</option>
          </select>
        </label>
        <label className="text-sm font-medium">Quotation date
          <input className="field mt-1" type="date" required value={draft.quotationDate} onChange={(event) => update({ quotationDate: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Customer name
          <input className="field mt-1" required value={draft.customerName} onChange={(event) => update({ customerName: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Vehicle number
          <input className="field mt-1" value={draft.vehicleNumber} onChange={(event) => update({ vehicleNumber: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Lease or loan no.
          <input className="field mt-1" value={draft.leaseOrLoanNo} onChange={(event) => update({ leaseOrLoanNo: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Usage
          <input className="field mt-1" value={draft.usage} onChange={(event) => update({ usage: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Year of manufacture
          <input className="field mt-1" value={draft.yearOfManufacture} onChange={(event) => update({ yearOfManufacture: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Sum insured
          <input className="field mt-1" value={draft.sumInsured} onChange={(event) => update({ sumInsured: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Make
          <input className="field mt-1" value={draft.make} onChange={(event) => update({ make: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Model
          <input className="field mt-1" value={draft.model} onChange={(event) => update({ model: event.target.value })} />
        </label>
        <label className="text-sm font-medium">Fuel
          <select className="field mt-1" value={draft.fuel} onChange={(event) => update({ fuel: event.target.value })}>
            <option value="">Select</option>
            {draft.fuel && !fuelOptions.includes(draft.fuel) ? <option value={draft.fuel}>{draft.fuel}</option> : null}
            {fuelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </section>
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
        <h2 className="md:col-span-3 font-bold">Prepared by</h2>
        <input className="field" aria-label="Staff name" placeholder="Staff name" value={draft.preparedBy} onChange={(event) => update({ preparedBy: event.target.value })} />
        <input className="field" aria-label="Staff phone" placeholder="Phone" value={draft.preparedByPhone} onChange={(event) => update({ preparedByPhone: event.target.value })} />
        <input className="field" aria-label="Staff email" type="email" placeholder="Email" value={draft.preparedByEmail} onChange={(event) => update({ preparedByEmail: event.target.value })} />
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Insurers</h2>
          <button
            type="button"
            className="text-sm font-semibold text-navy-900"
            disabled={draft.insurers.length >= 8}
            onClick={() => update(resizeInsurers(draft, [...draft.insurers, 'Insurer']))}
          >
            Add insurer
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {draft.insurers.map((insurer, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="field"
                aria-label={`Insurer ${index + 1}`}
                value={insurer}
                onChange={(event) => {
                  const insurers = draft.insurers.map((name, insurerIndex) => (insurerIndex === index ? event.target.value : name));
                  update({ insurers });
                }}
              />
              {draft.insurers.length > 1 ? (
                <button
                  type="button"
                  className="text-sm text-red-800"
                  onClick={() => update(resizeInsurers(draft, draft.insurers.filter((_, insurerIndex) => insurerIndex !== index)))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Comparison</h2>
        <table className="mt-3 min-w-[720px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-navy-900 text-left text-white">
              <th className="px-3 py-2 font-semibold">Benefit</th>
              {draft.insurers.map((insurer, index) => <th key={index} className="px-3 py-2 font-semibold">{insurer}</th>)}
            </tr>
          </thead>
          <tbody>
            {draft.rows.map((row, rowIndex) => (
              <tr key={row.label} className={rowIndex % 2 === 0 ? 'bg-navy-50' : 'bg-white'}>
                <th className="px-3 py-2 text-left font-semibold text-navy-900">{row.label}</th>
                {row.values.map((value, valueIndex) => (
                  <td key={`${row.label}-${valueIndex}`} className="px-2 py-2">
                    {isYesNoBenefit(row.label) ? (
                      <select
                        className="field"
                        aria-label={`${row.label} for ${draft.insurers[valueIndex]}`}
                        value={value}
                        onChange={(event) => setCell(rowIndex, valueIndex, event.target.value)}
                      >
                        <option value="">Select</option>
                        {value && value !== 'Yes' && value !== 'No' ? <option value={value}>{value}</option> : null}
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      <input
                        className="field"
                        aria-label={`${row.label} for ${draft.insurers[valueIndex]}`}
                        value={value}
                        onChange={(event) => setCell(rowIndex, valueIndex, event.target.value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="flex flex-wrap gap-3">
        <button type="submit" value="save" disabled={pending} className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Save</button>
        <button type="submit" value="download" disabled={pending} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60">Save and download PDF</button>
        <button type="button" disabled={pending} onClick={() => void showPreview()} className="rounded-full border border-navy-900 px-5 py-2 text-sm font-semibold text-navy-900 disabled:opacity-60">Show preview</button>
      </div>
    </form>
  );
}
