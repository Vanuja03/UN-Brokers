import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { nonMotorSlipTypes, slipTypeLabel, type NonMotorSlipType } from '../../content/nonMotorSlip';

type MotorRow = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  vehicleNumber: string;
  slipDate: string;
};

type NonMotorRow = {
  _id: string;
  referenceNumber: string;
  slipType: NonMotorSlipType;
  customerName: string;
  locationAddress: string;
  slipDate: string;
};

export function slipFilename(reference: string, vehicleNumber: string) {
  const vehicle = vehicleNumber.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${vehicle ? `${vehicle}-${reference}` : reference}.pdf`;
}

function customerFilename(reference: string, customerName: string) {
  const name = customerName.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `${name ? `${name}-${reference}` : reference}.pdf`;
}

export async function downloadSlip(id: string, reference: string, vehicleNumber: string) {
  const response = await api.get(`/motor-quotation-slips/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = slipFilename(reference, vehicleNumber);
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadNonMotorSlip(id: string, reference: string, customerName: string) {
  const response = await api.get(`/non-motor-quotation-slips/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = customerFilename(reference, customerName);
  link.click();
  URL.revokeObjectURL(url);
}

export function MotorQuotationSlipsPage() {
  const [search, setSearch] = useSearchParams();
  const book = search.get('book') === 'non-motor' ? 'non-motor' : 'motor';
  const [slipType, setSlipType] = useState<NonMotorSlipType>('fire');
  const [rows, setRows] = useState<MotorRow[]>([]);
  const [nonMotorRows, setNonMotorRows] = useState<NonMotorRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/motor-quotation-slips').then((response) => setRows(response.data.data)).catch(() => setError('Quotation slips could not be loaded.'));
  }, []);

  useEffect(() => {
    if (book !== 'non-motor') return;
    api.get('/non-motor-quotation-slips').then((response) => setNonMotorRows(response.data.data)).catch(() => setError('Quotation slips could not be loaded.'));
  }, [book]);

  const visible = nonMotorRows.filter((row) => row.slipType === slipType);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Quotation slips</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            {book === 'motor'
              ? 'A slip for an insurance company, prepared after a motor quotation is received. Saving one downloads a PDF named with the vehicle number.'
              : "Fire, burglary, workmen's compensation, personal accident, money in transit, goods in transit, marine, erection all risk, electronic all risk, medical, and crop slips for an insurance company. Choose the type, then open the form. Saving one downloads a PDF."}
          </p>
        </div>
      </div>
      <div role="tablist" aria-label="Quotation slip book" className="mt-5 flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={book === 'motor'} className={`rounded-full px-4 py-2 text-sm font-semibold ${book === 'motor' ? 'bg-gold text-navy-950' : 'border border-slate-300 text-navy-900'}`} onClick={() => setSearch({}, { replace: true })}>Motor</button>
        <button type="button" role="tab" aria-selected={book === 'non-motor'} className={`rounded-full px-4 py-2 text-sm font-semibold ${book === 'non-motor' ? 'bg-gold text-navy-950' : 'border border-slate-300 text-navy-900'}`} onClick={() => setSearch({ book: 'non-motor' }, { replace: true })}>Non-motor</button>
      </div>
      {book === 'motor' ? (
        <div className="mt-4 flex justify-end">
          <Link to="/admin/motor-quotations/slips/new" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">New slip</Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className="text-sm font-medium text-navy-900">Non-motor type
            <select className="field mt-1.5" value={slipType} onChange={(event) => setSlipType(event.target.value as NonMotorSlipType)}>
              {nonMotorSlipTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <Link to={`/admin/motor-quotations/slips/non-motor/new?type=${slipType}`} className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Open {slipTypeLabel(slipType).toLowerCase()} form</Link>
        </div>
      )}
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      {book === 'motor' ? (
        <div className="mt-6 space-y-3">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No quotation slips yet.</p> : rows.map((row) => (
            <article key={row._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <Link className="font-semibold text-navy-900" to={`/admin/motor-quotations/slips/${row._id}`}>{row.referenceNumber}</Link>
                <p className="text-sm">{row.customerName} · {row.vehicleNumber}</p>
                <p className="text-sm text-slate-500">{row.slipDate}</p>
              </div>
              <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => void downloadSlip(row._id, row.referenceNumber, row.vehicleNumber)}>Download PDF</button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.length === 0 ? <p className="text-sm text-slate-600">No {slipTypeLabel(slipType).toLowerCase()} slips yet.</p> : visible.map((row) => (
            <article key={row._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div>
                <Link className="font-semibold text-navy-900" to={`/admin/motor-quotations/slips/non-motor/${row._id}`}>{row.referenceNumber}</Link>
                <p className="text-sm">{row.customerName} · {slipTypeLabel(row.slipType)}</p>
                <p className="text-sm text-slate-500">{row.locationAddress}</p>
                <p className="text-sm text-slate-500">{row.slipDate}</p>
              </div>
              <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => void downloadNonMotorSlip(row._id, row.referenceNumber, row.customerName)}>Download PDF</button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
