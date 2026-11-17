import mongoose, { Schema } from 'mongoose';

const lineSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 160 },
    amount: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const workerSchema = new Schema(
  {
    designation: { type: String, required: true, trim: true, maxlength: 80 },
    count: { type: String, required: true, trim: true, maxlength: 10 },
    salary: { type: String, required: true, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const nonMotorQuotationSlipSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    slipType: { type: String, required: true, enum: ['fire', 'burglary', 'workmen', 'accident', 'transit', 'goods', 'marine', 'erection', 'electronic', 'medical', 'crop'] },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    locationAddress: { type: String, default: '', trim: true, maxlength: 300 },
    occupation: { type: String, default: '', trim: true, maxlength: 120 },
    previousInsurance: { type: String, default: '', trim: true, maxlength: 120 },
    claimsLast3Years: { type: String, default: '', trim: true, maxlength: 80 },
    contactPerson: { type: String, default: '', trim: true, maxlength: 120 },
    contactNo: { type: String, default: '', trim: true, maxlength: 40 },
    annualEarnings: { type: String, default: '', trim: true, maxlength: 40 },
    workerCount: { type: String, default: '', trim: true, maxlength: 20 },
    transitFrom: { type: String, default: '', trim: true, maxlength: 200 },
    transitTo: { type: String, default: '', trim: true, maxlength: 200 },
    modeOfTransit: { type: String, default: '', trim: true, maxlength: 160 },
    transitsPerMonth: { type: String, default: '', trim: true, maxlength: 20 },
    annualCarryings: { type: String, default: '', trim: true, maxlength: 40 },
    transitArea: { type: String, default: '', trim: true, maxlength: 200 },
    maxTransitLimit: { type: String, default: '', trim: true, maxlength: 40 },
    transitCount: { type: String, default: '', trim: true, maxlength: 20 },
    vehicleCount: { type: String, default: '', trim: true, maxlength: 20 },
    annualTransit: { type: String, default: '', trim: true, maxlength: 40 },
    goodsDescription: { type: String, default: '', trim: true, maxlength: 300 },
    voyageFrom: { type: String, default: '', trim: true, maxlength: 300 },
    voyageTo: { type: String, default: '', trim: true, maxlength: 300 },
    methodOfTransport: { type: String, default: '', trim: true, maxlength: 600 },
    itemAge: { type: String, default: '', trim: true, maxlength: 80 },
    memberCount: { type: String, default: '', trim: true, maxlength: 20 },
    medicalLimits: {
      type: [new Schema({
        label: { type: String, required: true, trim: true, maxlength: 80 },
        option1: { type: String, default: '', trim: true, maxlength: 40 },
        option2: { type: String, default: '', trim: true, maxlength: 40 },
        option3: { type: String, default: '', trim: true, maxlength: 40 },
      }, { _id: false })],
      default: [],
    },
    cropPlants: {
      type: [new Schema({
        age: { type: String, required: true, trim: true, maxlength: 40 },
        coverage: { type: String, required: true, trim: true, maxlength: 40 },
        count: { type: String, required: true, trim: true, maxlength: 20 },
        value: { type: String, required: true, trim: true, maxlength: 40 },
      }, { _id: false })],
      default: [],
    },
    interests: { type: [String], default: [] },
    items: { type: [lineSchema], default: [] },
    workers: { type: [workerSchema], default: [] },
    firstLossItems: { type: [lineSchema], default: [] },
    covers: { type: [String], default: [] },
    coverAmounts: {
      type: [new Schema({ key: { type: String, required: true, maxlength: 40 }, amount: { type: String, required: true, maxlength: 40 } }, { _id: false })],
      default: [],
    },
    notes: { type: String, default: '', trim: true, maxlength: 800 },
    slipDate: { type: String, required: true, maxlength: 10 },
    preparedBy: { type: String, default: '', maxlength: 120 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

export const NonMotorQuotationSlip = mongoose.model('NonMotorQuotationSlip', nonMotorQuotationSlipSchema);
