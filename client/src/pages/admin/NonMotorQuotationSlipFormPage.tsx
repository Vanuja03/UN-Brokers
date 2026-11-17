import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage, getFieldErrors } from '../../services/api';
import { accidentCoverOptions, amountTotal, benefitOptions, blankCropPlants, blankLines, burglaryItemTemplate, electronicItemTemplate, erectionCoverOptions, erectionItemTemplate, erectionLiabilityTemplate, fireCoverOptions, fireItemTemplate, goodsCoverOptions, marineCoverOptions, medicalCoverOptions, medicalLimitTemplate, slipTypeLabel, transitCoverOptions, transitItemTemplate, workmenCoverOptions, workmenDesignations, type CoverAmount, type CropPlant, type MedicalLimit, type NonMotorSlipType, type SlipLine, type WorkerLine } from '../../content/nonMotorSlip';
import { downloadNonMotorSlip } from './MotorQuotationSlipsPage';

type Draft = {
  slipType: NonMotorSlipType;
  customerName: string;
  locationAddress: string;
  occupation: string;
  previousInsurance: string;
  claimsLast3Years: string;
  contactPerson: string;
  contactNo: string;
  annualEarnings: string;
  items: SlipLine[];
  firstLossItems: SlipLine[];
  workers: WorkerLine[];
  workerCount: string;
  transitFrom: string;
  transitTo: string;
  modeOfTransit: string;
  transitsPerMonth: string;
  annualCarryings: string;
  transitArea: string;
  maxTransitLimit: string;
  transitCount: string;
  vehicleCount: string;
  annualTransit: string;
  goodsDescription: string;
  voyageFrom: string;
  voyageTo: string;
  interests: string[];
  methodOfTransport: string;
  itemAge: string;
  memberCount: string;
  medicalLimits: MedicalLimit[];
  cropPlants: CropPlant[];
  coverAmounts: CoverAmount[];
  covers: string[];
  notes: string;
};

function slipFrom(value: string | null | undefined): NonMotorSlipType {
  if (value === 'burglary' || value === 'workmen' || value === 'accident' || value === 'transit' || value === 'goods' || value === 'marine' || value === 'erection' || value === 'electronic' || value === 'medical' || value === 'crop') return value;
  return 'fire';
}

function blankDraft(slipType: NonMotorSlipType): Draft {
  return {
    slipType,
    customerName: '',
    locationAddress: '',
    occupation: '',
    previousInsurance: '',
    claimsLast3Years: 'Nil',
    contactPerson: '',
    contactNo: '',
    annualEarnings: '',
    items: slipType === 'fire' ? blankLines(fireItemTemplate) : slipType === 'burglary' ? blankLines(burglaryItemTemplate) : slipType === 'accident' ? blankLines(benefitOptions) : slipType === 'transit' ? blankLines(transitItemTemplate) : slipType === 'erection' ? blankLines(erectionItemTemplate) : slipType === 'electronic' ? blankLines(electronicItemTemplate) : [],
    firstLossItems: slipType === 'burglary' ? blankLines(burglaryItemTemplate) : slipType === 'accident' ? blankLines(benefitOptions) : slipType === 'erection' ? blankLines(erectionLiabilityTemplate) : [],
    workers: slipType === 'workmen' ? workmenDesignations.map((designation) => ({ designation, count: '', salary: '' })) : [],
    workerCount: '',
    transitFrom: '',
    transitTo: '',
    modeOfTransit: '',
    transitsPerMonth: '',
    annualCarryings: '',
    transitArea: '',
    maxTransitLimit: '',
    transitCount: '',
    vehicleCount: '',
    annualTransit: '',
    goodsDescription: '',
    voyageFrom: '',
    voyageTo: '',
    interests: slipType === 'marine' ? ['', '', '', ''] : [],
    methodOfTransport: '',
    itemAge: '',
    memberCount: '',
    medicalLimits: slipType === 'medical' ? medicalLimitTemplate.map((row) => ({ ...row })) : [],
    cropPlants: slipType === 'crop' ? blankCropPlants() : [],
    coverAmounts: [],
    covers: [],
    notes: '',
  };
}

function asWorkers(value: unknown): WorkerLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Partial<WorkerLine>;
    return { designation: row.designation || '', count: row.count || '', salary: row.salary || '' };
  });
}

function asPlants(value: unknown): CropPlant[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Partial<CropPlant>;
    return { age: row.age || '', coverage: row.coverage || '', count: row.count || '', value: row.value || '' };
  });
}

function asLimits(value: unknown): MedicalLimit[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as Partial<MedicalLimit>;
    return { label: row.label || '', option1: row.option1 || '', option2: row.option2 || '', option3: row.option3 || '' };
  });
}

function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asLines(value: unknown): SlipLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as { label?: string; amount?: string };
    return { label: row.label || '', amount: row.amount || '' };
  });
}

export function NonMotorQuotationSlipFormPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const requested = slipFrom(search.get('type'));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        if (!cancelled) setDraft(blankDraft(requested));
        return;
      }
      const response = await api.get(`/non-motor-quotation-slips/${id}`);
      const saved = response.data.data as Partial<Draft> & { slipType?: string; covers?: string[] };
      if (cancelled) return;
      const slipType = slipFrom(saved.slipType);
      const base = blankDraft(slipType);
      setDraft({
        ...base,
        slipType,
        customerName: saved.customerName || '',
        locationAddress: saved.locationAddress || '',
        occupation: saved.occupation || '',
        previousInsurance: saved.previousInsurance || '',
        claimsLast3Years: saved.claimsLast3Years || '',
        contactPerson: saved.contactPerson || '',
        contactNo: saved.contactNo || '',
        annualEarnings: saved.annualEarnings || '',
        items: slipType === 'workmen' ? [] : asLines(saved.items).length ? asLines(saved.items) : base.items,
        firstLossItems: slipType === 'burglary' || slipType === 'accident' || slipType === 'erection' ? (asLines(saved.firstLossItems).length ? asLines(saved.firstLossItems) : base.firstLossItems) : [],
        workers: slipType === 'workmen' ? asWorkers(saved.workers) : [],
        workerCount: saved.workerCount || '',
        transitFrom: saved.transitFrom || '',
        transitTo: saved.transitTo || '',
        modeOfTransit: saved.modeOfTransit || '',
        transitsPerMonth: saved.transitsPerMonth || '',
        annualCarryings: saved.annualCarryings || '',
        transitArea: saved.transitArea || '',
        maxTransitLimit: saved.maxTransitLimit || '',
        transitCount: saved.transitCount || '',
        vehicleCount: saved.vehicleCount || '',
        annualTransit: saved.annualTransit || '',
        goodsDescription: saved.goodsDescription || '',
        voyageFrom: saved.voyageFrom || '',
        voyageTo: saved.voyageTo || '',
        interests: slipType === 'marine' ? (asTextList(saved.interests).length ? asTextList(saved.interests) : base.interests) : [],
        methodOfTransport: saved.methodOfTransport || '',
        itemAge: saved.itemAge || '',
        memberCount: saved.memberCount || '',
        medicalLimits: slipType === 'medical' ? (asLimits(saved.medicalLimits).length ? asLimits(saved.medicalLimits) : base.medicalLimits) : [],
        cropPlants: slipType === 'crop' ? (asPlants(saved.cropPlants).length ? asPlants(saved.cropPlants) : base.cropPlants) : [],
        coverAmounts: Array.isArray(saved.coverAmounts) ? saved.coverAmounts.filter((item) => item.key && item.amount) : [],
        covers: Array.isArray(saved.covers) ? saved.covers : [],
        notes: saved.notes || '',
      });
    }
    load().catch((err) => {
      if (!cancelled) setError(getErrorMessage(err, 'The quotation slip could not be opened.'));
    });
    return () => {
      cancelled = true;
    };
  }, [id, requested]);

  function update(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function changeLine(key: 'items' | 'firstLossItems', index: number, patch: Partial<SlipLine>) {
    if (!draft) return;
    const next = draft[key].map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    update({ [key]: next });
  }

  function localErrors(values: Draft) {
    const errors: Record<string, string> = {};
    if (!values.customerName.trim()) errors.customerName = 'This field is required.';
    if (values.slipType !== 'transit' && !values.locationAddress.trim()) errors.locationAddress = 'This field is required.';
    if (values.slipType === 'transit' && !values.transitFrom.trim()) errors.transitFrom = 'Enter where the transit starts.';
    if (values.slipType === 'transit' && !values.transitTo.trim()) errors.transitTo = 'Enter where the transit ends.';
    if (values.slipType === 'transit' && !values.transitsPerMonth.trim()) errors.transitsPerMonth = 'Enter the number of transits per month.';
    if (values.slipType === 'transit' && !values.annualCarryings.trim()) errors.annualCarryings = 'Enter the estimated annual carryings.';
    if (values.slipType === 'goods' && !values.transitArea.trim()) errors.transitArea = 'Enter the transit.';
    if (values.slipType === 'goods' && !values.maxTransitLimit.trim()) errors.maxTransitLimit = 'Enter the maximum transit limit.';
    if (values.slipType === 'goods' && !values.annualTransit.trim()) errors.annualTransit = 'Enter the estimated annual transit.';
    if (values.slipType === 'goods' && !values.goodsDescription.trim()) errors.goodsDescription = 'Enter the goods description.';
    if (values.slipType === 'marine' && !values.voyageFrom.trim()) errors.voyageFrom = 'Enter where the voyage starts.';
    if (values.slipType === 'marine' && !values.voyageTo.trim()) errors.voyageTo = 'Enter where the voyage ends.';
    if (values.slipType === 'marine' && !values.interests.some((item) => item.trim())) errors.interests = 'Enter at least one interest.';
    if ((values.slipType === 'fire' || values.slipType === 'burglary' || values.slipType === 'transit' || values.slipType === 'erection' || values.slipType === 'electronic') && !values.items.some((row) => row.label.trim() && row.amount.trim())) errors.items = 'Enter at least one sum insured line with an amount.';
    if (values.slipType === 'erection' && !values.firstLossItems.some((row) => row.label.trim() && row.amount.trim())) errors.firstLossItems = 'Enter at least one third party liability limit.';
    if (values.slipType === 'erection' && !values.methodOfTransport.trim()) errors.methodOfTransport = 'Enter the method of transport.';
    if (values.slipType === 'medical' && !values.memberCount.trim()) errors.memberCount = 'Enter the number of members.';
    if (values.slipType === 'medical' && !values.medicalLimits.some((row) => row.label.trim() && (row.option1.trim() || row.option2.trim() || row.option3.trim()))) errors.medicalLimits = 'Enter at least one limit with an amount.';
    if (values.slipType === 'crop' && !values.cropPlants.some((row) => row.age.trim() && row.coverage.trim() && row.count.trim() && row.value.trim())) errors.cropPlants = 'Enter at least one plant row with age, coverage, number of plants, and value.';
    if (values.slipType === 'accident' && !values.items.some((row) => row.label.trim() && row.amount.trim())) errors.items = 'Enter at least one capital benefit option with an amount.';
    if (values.slipType === 'accident' && !values.workerCount.trim()) errors.workerCount = 'Enter the number of workers.';
    if (values.slipType === 'accident' && values.covers.some((key) => (key === 'funeral' || key === 'natural-death') && !values.coverAmounts.some((item) => item.key === key && item.amount.trim()))) {
      errors.coverAmounts = 'Enter an amount for each ticked cover that needs one.';
    }
    if (values.slipType === 'burglary' && !values.firstLossItems.some((row) => row.label.trim() && row.amount.trim())) {
      errors.firstLossItems = 'Enter at least one 1st loss line with an amount.';
    }
    if (values.slipType === 'workmen' && !values.annualEarnings.trim()) errors.annualEarnings = 'Enter the estimated annual earnings.';
    if (values.slipType === 'workmen' && !values.workers.some((row) => row.designation.trim() && row.count.trim() && row.salary.trim())) {
      errors.workers = 'Enter at least one designation with the number of workers and a monthly salary.';
    }
    if ((values.slipType === 'fire' || values.slipType === 'workmen' || values.slipType === 'accident' || values.slipType === 'transit' || values.slipType === 'goods' || values.slipType === 'marine' || values.slipType === 'erection' || values.slipType === 'medical') && values.covers.length === 0) errors.covers = 'Tick at least one cover.';
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
    const body = {
      ...draft,
      annualEarnings: draft.slipType === 'workmen' ? draft.annualEarnings : '',
      workerCount: draft.slipType === 'accident' ? draft.workerCount : '',
      transitFrom: draft.slipType === 'transit' ? draft.transitFrom : '',
      transitTo: draft.slipType === 'transit' ? draft.transitTo : '',
      modeOfTransit: draft.slipType === 'transit' || draft.slipType === 'goods' ? draft.modeOfTransit : '',
      transitsPerMonth: draft.slipType === 'transit' ? draft.transitsPerMonth : '',
      annualCarryings: draft.slipType === 'transit' ? draft.annualCarryings : '',
      transitArea: draft.slipType === 'goods' ? draft.transitArea : '',
      maxTransitLimit: draft.slipType === 'goods' ? draft.maxTransitLimit : '',
      transitCount: draft.slipType === 'goods' ? draft.transitCount : '',
      vehicleCount: draft.slipType === 'goods' ? draft.vehicleCount : '',
      annualTransit: draft.slipType === 'goods' ? draft.annualTransit : '',
      goodsDescription: draft.slipType === 'goods' ? draft.goodsDescription : '',
      voyageFrom: draft.slipType === 'marine' ? draft.voyageFrom : '',
      voyageTo: draft.slipType === 'marine' ? draft.voyageTo : '',
      interests: draft.slipType === 'marine' ? draft.interests.map((item) => item.trim()).filter(Boolean) : [],
      methodOfTransport: draft.slipType === 'erection' ? draft.methodOfTransport : '',
      itemAge: draft.slipType === 'electronic' ? draft.itemAge : '',
      memberCount: draft.slipType === 'medical' ? draft.memberCount : '',
      medicalLimits: draft.slipType === 'medical' ? draft.medicalLimits.filter((row) => row.label.trim() && (row.option1.trim() || row.option2.trim() || row.option3.trim())) : [],
      cropPlants: draft.slipType === 'crop' ? draft.cropPlants.filter((row) => row.age.trim() && row.coverage.trim() && row.count.trim() && row.value.trim()) : [],
      items: draft.slipType === 'workmen' || draft.slipType === 'goods' || draft.slipType === 'marine' || draft.slipType === 'medical' || draft.slipType === 'crop' ? [] : draft.items.filter((row) => row.label.trim() && row.amount.trim()),
      firstLossItems: draft.slipType === 'burglary' || draft.slipType === 'accident' || draft.slipType === 'erection' ? draft.firstLossItems.filter((row) => row.label.trim() && row.amount.trim()) : [],
      workers: draft.slipType === 'workmen' ? draft.workers.filter((row) => row.designation.trim() && row.count.trim() && row.salary.trim()) : [],
      coverAmounts: draft.slipType === 'accident' ? draft.coverAmounts.filter((item) => draft.covers.includes(item.key) && item.amount.trim()) : [],
      covers: draft.slipType === 'burglary' ? [] : draft.covers,
    };
    let saved: { _id: string; referenceNumber: string; customerName: string } | null = null;
    try {
      const response = id ? await api.patch(`/non-motor-quotation-slips/${id}`, body) : await api.post('/non-motor-quotation-slips', body);
      saved = response.data.data;
    } catch (err) {
      const nextErrors: Record<string, string> = {};
      for (const item of getFieldErrors(err)) nextErrors[item.field] = item.message;
      setFieldErrors(nextErrors);
      setError(getErrorMessage(err, 'The quotation slip could not be saved.'));
      setPending(false);
      return;
    }
    try {
      if (saved) await downloadNonMotorSlip(saved._id, saved.referenceNumber, saved.customerName);
    } catch {
      setError('The slip was saved, but the PDF could not be downloaded. Use Download PDF from the list.');
    } finally {
      setPending(false);
    }
    if (saved && !id) navigate(`/admin/motor-quotations/slips/non-motor/${saved._id}`, { replace: true });
  }

  if (error && !draft) return <p role="alert">{error}</p>;
  if (!draft) return <p>Loading quotation slip…</p>;

  const typeName = slipTypeLabel(draft.slipType);

  return (
    <form onSubmit={(event) => void save(event)} className="space-y-6" noValidate>
      <Link to="/admin/motor-quotations/slips?book=non-motor" className="text-sm font-semibold underline">All quotation slips</Link>
      <div>
        <h1 className="text-3xl font-bold">{id ? `Edit ${typeName.toLowerCase()} slip` : `New ${typeName.toLowerCase()} slip`}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{helpText(draft.slipType)}</p>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <Field label="Customer name" value={draft.customerName} error={fieldErrors.customerName} onChange={(value) => update({ customerName: value })} />
        <Field label="Location address" value={draft.locationAddress} error={fieldErrors.locationAddress} onChange={(value) => update({ locationAddress: value })} />
        <Field label="Occupation" value={draft.occupation} error={fieldErrors.occupation} onChange={(value) => update({ occupation: value })} />
        <Field label="Previous insurance" value={draft.previousInsurance} error={fieldErrors.previousInsurance} onChange={(value) => update({ previousInsurance: value })} />
        <Field label="Claims last 3 years" value={draft.claimsLast3Years} error={fieldErrors.claimsLast3Years} onChange={(value) => update({ claimsLast3Years: value })} />
        <Field label="Contact person" value={draft.contactPerson} error={fieldErrors.contactPerson} onChange={(value) => update({ contactPerson: value })} />
        <Field label="Contact no" value={draft.contactNo} error={fieldErrors.contactNo} onChange={(value) => update({ contactNo: value })} />
        <div className="text-sm font-medium text-navy-900">Type of insurance
          <p className="field mt-1.5 bg-slate-100">{typeName}</p>
        </div>
        {draft.slipType === 'workmen' ? <Field label="Estimated annual earnings" value={draft.annualEarnings} error={fieldErrors.annualEarnings} onChange={(value) => update({ annualEarnings: value })} /> : null}
        {draft.slipType === 'accident' ? <Field label="No of workers" value={draft.workerCount} error={fieldErrors.workerCount} onChange={(value) => update({ workerCount: value })} /> : null}
        {draft.slipType === 'transit' ? (
          <>
            <Field label="Transit from" value={draft.transitFrom} error={fieldErrors.transitFrom} onChange={(value) => update({ transitFrom: value })} />
            <Field label="Transit to" value={draft.transitTo} error={fieldErrors.transitTo} onChange={(value) => update({ transitTo: value })} />
            <Field label="Number of transits per month" value={draft.transitsPerMonth} error={fieldErrors.transitsPerMonth} onChange={(value) => update({ transitsPerMonth: value })} />
            <Field label="Estimated annual carryings" value={draft.annualCarryings} error={fieldErrors.annualCarryings} onChange={(value) => update({ annualCarryings: value })} />
            <Field label="Mode of transit" value={draft.modeOfTransit} error={fieldErrors.modeOfTransit} onChange={(value) => update({ modeOfTransit: value })} />
          </>
        ) : null}
        {draft.slipType === 'goods' ? (
          <>
            <Field label="Transit" value={draft.transitArea} error={fieldErrors.transitArea} onChange={(value) => update({ transitArea: value })} />
            <Field label="Maximum transit limit" value={draft.maxTransitLimit} error={fieldErrors.maxTransitLimit} onChange={(value) => update({ maxTransitLimit: value })} />
            <Field label="No of transit" value={draft.transitCount} error={fieldErrors.transitCount} onChange={(value) => update({ transitCount: value })} />
            <Field label="No of vehicles" value={draft.vehicleCount} error={fieldErrors.vehicleCount} onChange={(value) => update({ vehicleCount: value })} />
            <Field label="Estimated annual transit" value={draft.annualTransit} error={fieldErrors.annualTransit} onChange={(value) => update({ annualTransit: value })} />
            <Field label="Goods description" value={draft.goodsDescription} error={fieldErrors.goodsDescription} onChange={(value) => update({ goodsDescription: value })} />
            <Field label="Mode of transit" value={draft.modeOfTransit} error={fieldErrors.modeOfTransit} onChange={(value) => update({ modeOfTransit: value })} />
          </>
        ) : null}
        {draft.slipType === 'marine' ? (
          <>
            <Field label="Voyage from" value={draft.voyageFrom} error={fieldErrors.voyageFrom} onChange={(value) => update({ voyageFrom: value })} />
            <Field label="Voyage to" value={draft.voyageTo} error={fieldErrors.voyageTo} onChange={(value) => update({ voyageTo: value })} />
          </>
        ) : null}
        {draft.slipType === 'erection' ? (
          <label className="text-sm font-medium text-navy-900 md:col-span-2">Method of transport
            <textarea className="field mt-1.5" rows={4} value={draft.methodOfTransport} aria-invalid={fieldErrors.methodOfTransport ? true : undefined} onChange={(event) => update({ methodOfTransport: event.target.value })} />
            {fieldErrors.methodOfTransport ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.methodOfTransport}</span> : null}
          </label>
        ) : null}
        {draft.slipType === 'electronic' ? <Field label="Age of electrical items" value={draft.itemAge} error={fieldErrors.itemAge} onChange={(value) => update({ itemAge: value })} /> : null}
        {draft.slipType === 'medical' ? <Field label="No of members" value={draft.memberCount} error={fieldErrors.memberCount} onChange={(value) => update({ memberCount: value })} /> : null}
      </section>
      {draft.slipType === 'workmen' ? (
        <>
          <WorkerEditor
            rows={draft.workers}
            error={fieldErrors.workers}
            onChange={(index, patch) => update({ workers: draft.workers.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) })}
            onAdd={() => update({ workers: [...draft.workers, { designation: '', count: '', salary: '' }] })}
            onRemove={(index) => update({ workers: draft.workers.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList title="Additional covers" options={workmenCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
        </>
      ) : draft.slipType === 'transit' ? (
        <>
          <LineEditor
            title="Sum insured"
            rows={draft.items}
            error={fieldErrors.items}
            showTotal={false}
            onChange={(index, patch) => changeLine('items', index, patch)}
            onAdd={() => update({ items: [...draft.items, { label: '', amount: '' }] })}
            onRemove={(index) => update({ items: draft.items.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList title="Additional covers" options={transitCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
        </>
      ) : draft.slipType === 'goods' ? (
        <CoverList title="Additional covers" options={goodsCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
      ) : draft.slipType === 'marine' ? (
        <>
          <InterestEditor
            rows={draft.interests}
            error={fieldErrors.interests}
            onChange={(index, value) => update({ interests: draft.interests.map((row, rowIndex) => (rowIndex === index ? value : row)) })}
            onAdd={() => update({ interests: [...draft.interests, ''] })}
            onRemove={(index) => update({ interests: draft.interests.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList title="Request covers" options={marineCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
        </>
      ) : draft.slipType === 'erection' ? (
        <>
          <LineEditor
            title="Sum insured"
            rows={draft.items}
            error={fieldErrors.items}
            onChange={(index, patch) => changeLine('items', index, patch)}
            onAdd={() => update({ items: [...draft.items, { label: '', amount: '' }] })}
            onRemove={(index) => update({ items: draft.items.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <LineEditor
            title="3rd party liability"
            rows={draft.firstLossItems}
            error={fieldErrors.firstLossItems}
            showTotal={false}
            onChange={(index, patch) => changeLine('firstLossItems', index, patch)}
            onAdd={() => update({ firstLossItems: [...draft.firstLossItems, { label: '', amount: '' }] })}
            onRemove={(index) => update({ firstLossItems: draft.firstLossItems.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList title="Additional covers" options={erectionCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
        </>
      ) : draft.slipType === 'electronic' ? (
        <LineEditor
          title="Sum insured"
          rows={draft.items}
          error={fieldErrors.items}
          onChange={(index, patch) => changeLine('items', index, patch)}
          onAdd={() => update({ items: [...draft.items, { label: '', amount: '' }] })}
          onRemove={(index) => update({ items: draft.items.filter((_, rowIndex) => rowIndex !== index) })}
        />
      ) : draft.slipType === 'medical' ? (
        <>
          <LimitEditor
            rows={draft.medicalLimits}
            error={fieldErrors.medicalLimits}
            onChange={(index, patch) => update({ medicalLimits: draft.medicalLimits.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) })}
            onAdd={() => update({ medicalLimits: [...draft.medicalLimits, { label: '', option1: '', option2: '', option3: '' }] })}
            onRemove={(index) => update({ medicalLimits: draft.medicalLimits.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList title="Special requirements" options={medicalCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
        </>
      ) : draft.slipType === 'crop' ? (
        <CropEditor
          rows={draft.cropPlants}
          error={fieldErrors.cropPlants}
          onChange={(index, patch) => update({ cropPlants: draft.cropPlants.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)) })}
          onAdd={() => update({ cropPlants: [...draft.cropPlants, { age: '', coverage: '', count: '', value: '' }] })}
          onRemove={(index) => update({ cropPlants: draft.cropPlants.filter((_, rowIndex) => rowIndex !== index) })}
        />
      ) : draft.slipType === 'accident' ? (
        <>
          <LineEditor
            title="Capital benefit"
            rows={draft.items}
            error={fieldErrors.items}
            showTotal={false}
            onChange={(index, patch) => changeLine('items', index, patch)}
            onAdd={() => update({ items: [...draft.items, { label: '', amount: '' }] })}
            onRemove={(index) => update({ items: draft.items.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <LineEditor
            title="Daily hospitalization payment"
            rows={draft.firstLossItems}
            error={fieldErrors.firstLossItems}
            showTotal={false}
            onChange={(index, patch) => changeLine('firstLossItems', index, patch)}
            onAdd={() => update({ firstLossItems: [...draft.firstLossItems, { label: '', amount: '' }] })}
            onRemove={(index) => update({ firstLossItems: draft.firstLossItems.filter((_, rowIndex) => rowIndex !== index) })}
          />
          <CoverList
            title="Additional covers"
            options={accidentCoverOptions}
            selected={draft.covers}
            error={fieldErrors.covers || fieldErrors.coverAmounts}
            amounts={Object.fromEntries(draft.coverAmounts.map((item) => [item.key, item.amount]))}
            onAmount={(key, amount) => update({ coverAmounts: [...draft.coverAmounts.filter((item) => item.key !== key), ...(amount ? [{ key, amount }] : [])] })}
            onChange={(covers) => update({ covers })}
          />
        </>
      ) : (
        <>
          <LineEditor
            title={draft.slipType === 'fire' ? 'Sum insured' : 'Declared value'}
            rows={draft.items}
            error={fieldErrors.items}
            onChange={(index, patch) => changeLine('items', index, patch)}
            onAdd={() => update({ items: [...draft.items, { label: '', amount: '' }] })}
            onRemove={(index) => update({ items: draft.items.filter((_, rowIndex) => rowIndex !== index) })}
          />
          {draft.slipType === 'burglary' ? (
            <LineEditor
              title="1st loss value"
              rows={draft.firstLossItems}
              error={fieldErrors.firstLossItems}
              onChange={(index, patch) => changeLine('firstLossItems', index, patch)}
              onAdd={() => update({ firstLossItems: [...draft.firstLossItems, { label: '', amount: '' }] })}
              onRemove={(index) => update({ firstLossItems: draft.firstLossItems.filter((_, rowIndex) => rowIndex !== index) })}
            />
          ) : (
            <CoverList title="Covers" options={fireCoverOptions} selected={draft.covers} error={fieldErrors.covers} onChange={(covers) => update({ covers })} />
          )}
        </>
      )}
      <label className="block rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-navy-900">
        Notes
        <span className="mt-1 block font-normal text-slate-600">Optional. Anything written here is printed at the bottom of the slip.</span>
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
        {pending ? 'Saving…' : 'Save and download PDF'}
      </button>
    </form>
  );
}

function helpText(slipType: NonMotorSlipType) {
  if (slipType === 'workmen') return 'Fill the customer details, estimated annual earnings, and the worker lines. A line needs a designation, a number of workers, and a monthly salary. Saving downloads the PDF.';
  if (slipType === 'accident') return 'Fill the customer details, capital benefit options, and the additional covers. Funeral expenses and natural death need an amount when ticked. Options without an amount are left off the PDF.';
  if (slipType === 'transit') return 'Fill the transit, the sum insured lines, estimated annual carryings, and the additional covers. Location and mode of transit can be left blank. Lines without an amount are left off the PDF.';
  if (slipType === 'goods') return 'Fill the transit, the maximum limit, estimated annual transit, and the goods description. No of transit, no of vehicles, and mode of transit can be left blank. Saving downloads the PDF.';
  if (slipType === 'marine') return 'Fill the voyage, the interests, and the request covers. Blank interest lines are left off the PDF. Saving downloads the PDF.';
  if (slipType === 'erection') return 'Fill the sum insured, the third party liability limits, and the method of transport. Lines without an amount are left off the PDF. The sum insured lines are totalled.';
  if (slipType === 'electronic') return 'Fill the sum insured lines. Age of the electrical items can be left blank. Lines without an amount are left off the PDF, and the remaining lines are totalled.';
  if (slipType === 'medical') return 'Fill the number of members and at least one limit. The three columns are separate options, so they are not added together. A limit row needs a name and at least one amount.';
  if (slipType === 'crop') return 'Each plant row needs an age, coverage per plant, number of plants, and a value. Incomplete rows are left off the PDF, and the values are totalled.';
  return 'Fill the customer details and the sum insured lines. Lines without an amount are left off the PDF. Saving downloads the PDF.';
}

function CropEditor({ rows, error, onChange, onAdd, onRemove }: { rows: CropPlant[]; error?: string; onChange: (index: number, patch: Partial<CropPlant>) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Sum insured</h2>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={onAdd}>Add plant row</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`crop-${index}`} className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_9rem_auto]">
            <label className="text-sm font-medium text-navy-900">Age of plant
              <input className="field mt-1.5" value={row.age} onChange={(event) => onChange(index, { age: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">Coverage per plant
              <input className="field mt-1.5" value={row.coverage} inputMode="decimal" onChange={(event) => onChange(index, { coverage: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">No of plant
              <input className="field mt-1.5" value={row.count} inputMode="numeric" onChange={(event) => onChange(index, { count: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">Value (Rs)
              <input className="field mt-1.5" value={row.value} inputMode="decimal" onChange={(event) => onChange(index, { value: event.target.value })} />
            </label>
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LimitEditor({ rows, error, onChange, onAdd, onRemove }: { rows: MedicalLimit[]; error?: string; onChange: (index: number, patch: Partial<MedicalLimit>) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Limits</h2>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={onAdd}>Add limit</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`limit-${index}`} className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_8rem_auto]">
            <label className="text-sm font-medium text-navy-900">Limit
              <input className="field mt-1.5" value={row.label} onChange={(event) => onChange(index, { label: event.target.value })} />
            </label>
            {(['option1', 'option2', 'option3'] as const).map((key, optionIndex) => (
              <label key={key} className="text-sm font-medium text-navy-900">Option {optionIndex + 1}
                <input className="field mt-1.5" value={row[key]} inputMode="decimal" onChange={(event) => onChange(index, { [key]: event.target.value })} />
              </label>
            ))}
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function InterestEditor({ rows, error, onChange, onAdd, onRemove }: { rows: string[]; error?: string; onChange: (index: number, value: string) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Interests</h2>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={onAdd}>Add interest</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`interest-${index}`} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-sm font-medium text-navy-900">Interest
              <input className="field mt-1.5" value={row} onChange={(event) => onChange(index, event.target.value)} />
            </label>
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LineEditor({ title, rows, error, onChange, onAdd, onRemove, showTotal = true }: { title: string; rows: SlipLine[]; error?: string; onChange: (index: number, patch: Partial<SlipLine>) => void; onAdd: () => void; onRemove: (index: number) => void; showTotal?: boolean }) {
  const total = amountTotal(rows);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={onAdd}>Add line</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
            <label className="text-sm font-medium text-navy-900">Description
              <input className="field mt-1.5" value={row.label} onChange={(event) => onChange(index, { label: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">Amount
              <input className="field mt-1.5" value={row.amount} inputMode="decimal" onChange={(event) => onChange(index, { amount: event.target.value })} />
            </label>
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
      {showTotal ? <p className="mt-4 text-sm font-semibold text-navy-900">Total{total ? `  Rs. ${total}` : ''}</p> : null}
    </section>
  );
}

function WorkerEditor({ rows, error, onChange, onAdd, onRemove }: { rows: WorkerLine[]; error?: string; onChange: (index: number, patch: Partial<WorkerLine>) => void; onAdd: () => void; onRemove: (index: number) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">No of workers</h2>
        <button type="button" className="rounded-full border border-navy-900 px-4 py-2 text-sm font-semibold text-navy-900" onClick={onAdd}>Add designation</button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div key={`worker-${index}`} className="grid gap-3 sm:grid-cols-[1fr_8rem_11rem_auto]">
            <label className="text-sm font-medium text-navy-900">Designation
              <input className="field mt-1.5" value={row.designation} onChange={(event) => onChange(index, { designation: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">No of workers
              <input className="field mt-1.5" value={row.count} inputMode="numeric" onChange={(event) => onChange(index, { count: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-navy-900">Monthly salary
              <input className="field mt-1.5" value={row.salary} inputMode="decimal" onChange={(event) => onChange(index, { salary: event.target.value })} />
            </label>
            <button type="button" className="self-end rounded-full border px-3 py-2 text-sm font-semibold text-red-700" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoverList({ title, options, selected, error, onChange, amounts, onAmount }: { title: string; options: { key: string; label: string; valued?: boolean }[]; selected: string[]; error?: string; onChange: (covers: string[]) => void; amounts?: Record<string, string>; onAmount?: (key: string, amount: string) => void }) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
      <legend className="px-1 text-lg font-bold">{title}</legend>
      <p className="mt-1 text-sm text-slate-600">Tick the covers the insurance company should quote.</p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((cover) => (
          <div key={cover.key} className="grid items-center gap-3 sm:grid-cols-[1fr_11rem]">
            <label className="flex items-center gap-3 text-sm font-medium text-navy-900">
              <input
                type="checkbox"
                checked={selected.includes(cover.key)}
                onChange={(event) => onChange(event.target.checked ? [...selected, cover.key] : selected.filter((key) => key !== cover.key))}
              />
              {cover.label}
            </label>
            {cover.valued ? (
              <input className="field" value={amounts?.[cover.key] || ''} disabled={!selected.includes(cover.key)} placeholder={selected.includes(cover.key) ? 'Amount' : ''} inputMode="decimal" onChange={(event) => onAmount?.(cover.key, event.target.value)} />
            ) : null}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <label className="text-sm font-medium text-navy-900">{label}
      <input className="field mt-1.5" value={value} aria-invalid={error ? true : undefined} onChange={(event) => onChange(event.target.value)} />
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}
