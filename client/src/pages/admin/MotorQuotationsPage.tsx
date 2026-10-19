import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

type Row = {
  _id: string;
  referenceNumber: string;
  customerName: string;
  vehicleNumber: string;
  insuranceType: 'motor' | 'motor-third-party';
  quotationDate: string;
};

const coverName = {
  motor: 'Motor insurance',
  'motor-third-party': 'Third-party motor insurance',
};

async function downloadPdf(id: string, reference: string) {
  const response = await api.get(`/motor-quotations/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reference}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MotorQuotationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/motor-quotations').then((response) => setRows(response.data.data)).catch(() => setError('Saved quotations could not be loaded.'));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Motor quotations</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Comparison sheets for motor and third-party insurance. These are kept apart from customer inquiries and can be downloaded for the customer.</p>
        </div>
        <Link to="/admin/motor-quotations/new" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white">New quotation</Link>
      </div>
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {rows.length === 0 ? <p className="text-sm text-slate-600">No customer quotations yet.</p> : rows.map((row) => (
          <article key={row._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <Link className="font-semibold text-navy-900" to={`/admin/motor-quotations/${row._id}`}>{row.referenceNumber}</Link>
              <p className="text-sm">{row.customerName}{row.vehicleNumber ? ` · ${row.vehicleNumber}` : ''}</p>
              <p className="text-sm text-slate-500">{coverName[row.insuranceType]} · {row.quotationDate}</p>
            </div>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => void downloadPdf(row._id, row.referenceNumber)}>Download PDF</button>
          </article>
        ))}
      </div>
    </div>
  );
}

export { downloadPdf };
