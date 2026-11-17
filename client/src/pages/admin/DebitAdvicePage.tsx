import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

type AdviceRow = {
  _id: string;
  referenceNumber: string;
  confirmationType: 'renewal' | 'new-business';
  customerName: string;
  vehicleNumber: string;
  adviceDate: string;
};

function filename(reference: string, vehicleNumber: string) {
  const vehicle = vehicleNumber.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${vehicle ? `${vehicle}-${reference}` : reference}.pdf`;
}

export async function downloadDebitAdvice(id: string, reference: string, vehicleNumber: string) {
  const response = await api.get(`/debit-advice/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename(reference, vehicleNumber);
  link.click();
  URL.revokeObjectURL(url);
}

function confirmationLabel(type: AdviceRow['confirmationType']) {
  return type === 'new-business' ? 'New business confirmation' : 'Renewal confirmation';
}

export function DebitAdvicePage() {
  const [rows, setRows] = useState<AdviceRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/debit-advice').then((response) => setRows(response.data.data)).catch(() => setError('Debit advice could not be loaded.'));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Debit advice</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Business confirmation for a renewal or new business. Saving one generates a PDF named with the vehicle number.</p>
        </div>
        <Link to="/admin/debit-advice/new" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">New debit advice</Link>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-600">No debit advice yet.</p> : rows.map((row) => (
          <article key={row._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <Link className="font-semibold text-navy-900" to={`/admin/debit-advice/${row._id}`}>{row.referenceNumber}</Link>
              <p className="text-sm">{confirmationLabel(row.confirmationType)}</p>
              <p className="text-sm">{row.customerName} · {row.vehicleNumber}</p>
              <p className="text-sm text-slate-500">{row.adviceDate}</p>
            </div>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => void downloadDebitAdvice(row._id, row.referenceNumber, row.vehicleNumber)}>Download PDF</button>
          </article>
        ))}
      </div>
    </div>
  );
}
