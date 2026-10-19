import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { blankQuotation, resizeInsurers, rowLabels, type MotorCover, type MotorQuotationDraft } from '../../content/motorQuotation';
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

const fuelLabels: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
  other: 'Other',
};

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
          <input className="field mt-1" value={draft.fuel} onChange={(event) => update({ fuel: event.target.value })} />
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
                    <input
                      className="field"
                      aria-label={`${row.label} for ${draft.insurers[valueIndex]}`}
                      value={value}
                      onChange={(event) => {
                        const rows = draft.rows.map((item, itemIndex) => itemIndex === rowIndex
                          ? { ...item, values: item.values.map((cell, cellIndex) => (cellIndex === valueIndex ? event.target.value : cell)) }
                          : item);
                        update({ rows });
                      }}
                    />
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
      </div>
    </form>
  );
}
