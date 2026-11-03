import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

type Row = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  vehicleNumber: string;
  slipDate: string;
};

export function slipFilename(reference: string, vehicleNumber: string) {
  const vehicle = vehicleNumber.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${vehicle ? `${vehicle}-${reference}` : reference}.pdf`;
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

export function MotorQuotationSlipsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/motor-quotation-slips').then((response) => setRows(response.data.data)).catch(() => setError('Quotation slips could not be loaded.'));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Quotation slips</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">A slip for an insurance company, prepared after a motor quotation is received. Saving one downloads a PDF named with the vehicle number.</p>
        </div>
        <Link to="/admin/motor-quotations/slips/new" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">New slip</Link>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
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
    </div>
  );
}
