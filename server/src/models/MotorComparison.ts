import mongoose, { Schema } from 'mongoose';

const benefitFields = {
  totalPremium: { type: String, default: '', maxlength: 180 },
  fireTheftAccident: { type: String, default: '', maxlength: 180 },
  maliciousAct: { type: String, default: '', maxlength: 180 },
  floodNaturalPerils: { type: String, default: '', maxlength: 180 },
  airBagCover: { type: String, default: '', maxlength: 180 },
  thirdPartyInjury: { type: String, default: '', maxlength: 180 },
  thirdPartyProperty: { type: String, default: '', maxlength: 180 },
  strikeRiot: { type: String, default: '', maxlength: 180 },
  terrorism: { type: String, default: '', maxlength: 180 },
  towing: { type: String, default: '', maxlength: 180 },
  personalAccident: { type: String, default: '', maxlength: 180 },
  windscreen: { type: String, default: '', maxlength: 180 },
  taxiAllowance: { type: String, default: '', maxlength: 180 },
  clickAndGo: { type: String, default: '', maxlength: 180 },
};

const insurerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    benefits: { type: new Schema(benefitFields, { _id: false }), default: () => ({}) },
  },
  { _id: false },
);

const motorComparisonSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    quotationDate: { type: Date, required: true },
    vehicleNumber: { type: String, required: true, trim: true, maxlength: 20 },
    leaseOrLoanNo: { type: String, default: '', maxlength: 40 },
    usage: { type: String, default: '', maxlength: 40 },
    yearOfManufacture: { type: String, default: '', maxlength: 10 },
    sumInsured: { type: String, default: '', maxlength: 40 },
    make: { type: String, default: '', maxlength: 60 },
    model: { type: String, default: '', maxlength: 60 },
    fuel: { type: String, default: '', maxlength: 40 },
    preparedByName: { type: String, default: '', maxlength: 120 },
    preparedByPhone: { type: String, default: '', maxlength: 20 },
    preparedByEmail: { type: String, default: '', maxlength: 254 },
    insurers: { type: [insurerSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

motorComparisonSchema.index({ createdAt: -1 });

export const MotorComparison = mongoose.model('MotorComparison', motorComparisonSchema);
