import mongoose, { Schema } from 'mongoose';

const valuedCoverSchema = new Schema(
  {
    selected: { type: Boolean, default: false },
    value: { type: String, default: '', trim: true, maxlength: 80 },
  },
  { _id: false },
);

const multipliedCoverSchema = new Schema(
  {
    selected: { type: Boolean, default: false },
    value: { type: String, default: '', trim: true, maxlength: 80 },
    multiple: { type: String, default: '', trim: true, maxlength: 40 },
  },
  { _id: false },
);

const motorQuotationSlipSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    vehicleNumber: { type: String, required: true, trim: true, maxlength: 40 },
    make: { type: String, required: true, trim: true, maxlength: 80 },
    model: { type: String, required: true, trim: true, maxlength: 80 },
    yearOfManufacture: { type: String, required: true, trim: true, maxlength: 4 },
    vehicleType: { type: String, required: true, trim: true, maxlength: 80 },
    vehicleUsage: { type: String, required: true, trim: true, maxlength: 80 },
    covers: {
      basic: { type: Boolean, default: false },
      srcc: { type: Boolean, default: false },
      tc: { type: Boolean, default: false },
      flood: { type: Boolean, default: false },
      towing: { type: valuedCoverSchema, default: () => ({}) },
      wci: { type: valuedCoverSchema, default: () => ({}) },
      gt: { type: valuedCoverSchema, default: () => ({}) },
      windscreen: { type: valuedCoverSchema, default: () => ({}) },
      pab: { type: multipliedCoverSchema, default: () => ({}) },
      ll: { type: multipliedCoverSchema, default: () => ({}) },
      tpd: { type: valuedCoverSchema, default: () => ({}) },
      hp: { type: valuedCoverSchema, default: () => ({}) },
    },
    slipDate: { type: String, required: true, maxlength: 10 },
    preparedBy: { type: String, default: '', maxlength: 120 },
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Quote', default: null },
    motorQuotationId: { type: Schema.Types.ObjectId, ref: 'MotorQuotation', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

export const MotorQuotationSlip = mongoose.model('MotorQuotationSlip', motorQuotationSlipSchema);
