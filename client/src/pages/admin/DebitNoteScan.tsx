import { useEffect, useRef, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';

type Book = 'motor' | 'non-motor';

const labels: Record<Book, { key: string; label: string; kind?: 'date' | 'status' }[]> = {
  motor: [
    { key: 'entryDate', label: 'Date', kind: 'date' },
    { key: 'riskDate', label: 'Risk date', kind: 'date' },
    { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
    { key: 'debitNoteNo', label: 'Debit note no' },
    { key: 'customerName', label: 'Customer name' },
    { key: 'postalAddress', label: 'Postal address' },
    { key: 'sumInsured', label: 'Sum insured' },
    { key: 'policyNumber', label: 'Policy no' },
    { key: 'vehicleNumber', label: 'Vehicle no' },
    { key: 'premiumNet', label: 'Premium net' },
    { key: 'premiumRcc', label: 'Premium RCC' },
    { key: 'premiumTc', label: 'Premium TC' },
    { key: 'premiumIncludingTax', label: 'Premium including tax' },
    { key: 'netCommissionRate', label: 'Net commission rate %' },
    { key: 'rccCommissionRate', label: 'RCC commission rate %' },
    { key: 'tcCommissionRate', label: 'TC commission rate %' },
    { key: 'insuranceCompany', label: 'Insurance company' },
    { key: 'salesPerson', label: 'Sales person' },
    { key: 'agentCode', label: 'Broker code' },
    { key: 'telephone', label: 'Telephone no' },
    { key: 'special', label: 'Policy status', kind: 'status' },
  ],
  'non-motor': [
    { key: 'debitDate', label: 'Debit date', kind: 'date' },
    { key: 'riskDate', label: 'Risk date', kind: 'date' },
    { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
    { key: 'debitNoteNo', label: 'Debit note no' },
    { key: 'customerName', label: 'Customer name' },
    { key: 'postalAddress', label: 'Postal address' },
    { key: 'locationAddress', label: 'Location address' },
    { key: 'sumInsured', label: 'Sum insured' },
    { key: 'policyNumber', label: 'Policy no' },
    { key: 'product', label: 'Product' },
    { key: 'premiumExRccTc', label: 'Premium excluding RCC/TC' },
    { key: 'premiumRcc', label: 'Premium RCC' },
    { key: 'premiumTc', label: 'Premium TC' },
    { key: 'premiumIncludingTax', label: 'Premium including tax' },
    { key: 'exCommissionRate', label: 'Ex. RCC/TC commission rate %' },
    { key: 'rccCommissionRate', label: 'RCC commission rate %' },
    { key: 'tcCommissionRate', label: 'TC commission rate %' },
    { key: 'insuranceCompany', label: 'Insurance company' },
    { key: 'salesPerson', label: 'Sales person' },
    { key: 'agentCode', label: 'Broker code' },
    { key: 'special', label: 'Policy status', kind: 'status' },
  ],
};

const statuses = [
  { value: 'new', label: 'New' },
  { value: 'ren', label: 'Ren' },
  { value: 'refund', label: 'Refund' },
  { value: 'additional', label: 'Additional' },
];

function accepted(file: File) {
  const type = file.type.toLowerCase();
  return type === 'application/pdf' || type === 'image/jpeg' || type === 'image/png' || type === 'image/webp' || /\.(pdf|jpe?g|png|webp)$/i.test(file.name);
}

export function DebitNoteScan({ book, onUse }: { book: Book; onUse: (fields: Record<string, string>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [review, setReview] = useState<Record<string, string> | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function scan(file: File) {
    if (!accepted(file)) {
      setError('Use a PDF or a JPEG, PNG, or WebP photo.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Use a PDF or photo under 4 MB.');
      return;
    }
    setBusy(true);
    setError('');
    setReview(null);
    try {
      const body = new FormData();
      body.append('book', book);
      body.append('document', file);
      const response = await api.post('/policy-registers/scan', body, { timeout: 90000 });
      const fields = (response.data?.data?.fields ?? {}) as Record<string, string>;
      const known = labels[book].filter((item) => fields[item.key]);
      if (known.length === 0) {
        setError('No policy details could be read. Try a clearer photo, or type the debit note into the register.');
        return;
      }
      const next: Record<string, string> = {};
      for (const item of known) next[item.key] = fields[item.key];
      setReview(next);
    } catch (scanError) {
      setError(getErrorMessage(scanError, 'The debit note could not be read.'));
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraFileRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      window.setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }, 0);
    } catch {
      cameraFileRef.current?.click();
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('The camera is not ready yet.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    stopCamera();
    if (!blob) {
      setError('The photo could not be taken.');
      return;
    }
    await scan(new File([blob], 'debit-note.jpg', { type: 'image/jpeg' }));
  }

  const found = review ? labels[book].filter((item) => review[item.key]) : [];

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-bold">Scan a debit note</h3>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">Upload the debit note or take a photo. The details are read into a review, then you confirm them in the register. The document is not stored.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Reading…' : 'Choose file'}</button>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900 disabled:opacity-60" disabled={busy} onClick={() => void startCamera()}>Use camera</button>
        <input ref={fileRef} className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="Debit note file" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void scan(file); }} />
        <input ref={cameraFileRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Debit note camera" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void scan(file); }} />
      </div>
      {busy ? <p className="mt-3 text-sm text-slate-600">Reading the debit note. A photo can take up to a minute.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      {cameraOn ? (
        <div className="mt-4 max-w-xl">
          <video ref={videoRef} className="w-full rounded-xl bg-navy-950" autoPlay muted playsInline />
          <div className="mt-3 flex gap-3">
            <button type="button" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950" onClick={() => void capture()}>Take photo</button>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={stopCamera}>Cancel</button>
          </div>
        </div>
      ) : null}
      {review && found.length > 0 ? (
        <div className="mt-4 rounded-xl border border-gold bg-gold/10 p-4">
          <h4 className="font-bold text-navy-950">Review scanned details</h4>
          <p className="mt-1 text-sm text-navy-950">Correct anything that was read wrong. Nothing is saved until you fill the register and press Save policy.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {found.map((item) => (
              <label key={item.key} className="text-sm font-medium text-navy-900">{item.label}
                {item.kind === 'status' ? (
                  <select className="field mt-1.5" value={review[item.key]} onChange={(event) => setReview({ ...review, [item.key]: event.target.value })}>
                    {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input className="field mt-1.5" type={item.kind === 'date' ? 'date' : 'text'} value={review[item.key]} onChange={(event) => setReview({ ...review, [item.key]: event.target.value })} />
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950" onClick={() => { onUse(review); setReview(null); }}>Fill the register</button>
            <button type="button" className="rounded-full border px-4 py-2 text-sm font-semibold" onClick={() => setReview(null)}>Discard</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
