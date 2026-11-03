import mongoose, { Schema } from 'mongoose';

const policyRegisterSchema = new Schema(
  {
    entryDate: { type: Date, required: true },
    riskDate: { type: Date, required: true },
    debitNoteNo: { type: String, default: '', trim: true, maxlength: 80 },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    postalAddress: { type: String, required: true, trim: true, maxlength: 400 },
    sumInsured: { type: Number, required: true, min: 0 },
    policyNumber: { type: String, required: true, trim: true, maxlength: 60, index: true },
    renewalDate: { type: Date, required: true },
    vehicleNumber: { type: String, required: true, trim: true, maxlength: 30 },
    premiumNet: { type: Number, required: true, min: 0 },
    premiumRcc: { type: Number, required: true, min: 0, default: 0 },
    premiumTc: { type: Number, required: true, min: 0, default: 0 },
    premiumIncludingTax: { type: Number, required: true, min: 0 },
    basicCommission: { type: Number, required: true, min: 0 },
    rccCommission: { type: Number, required: true, min: 0 },
    tcCommission: { type: Number, required: true, min: 0 },
    insuranceCompany: { type: String, required: true, trim: true, maxlength: 160 },
    salesPerson: { type: String, default: '', trim: true, maxlength: 120 },
    agentCode: { type: String, default: '', trim: true, maxlength: 80 },
    special: { type: String, enum: ['ren', 'new'], required: true, default: 'new' },
    telephone: { type: String, default: '', trim: true, maxlength: 20 },
    unSalesPerson: { type: String, default: '', trim: true, maxlength: 120 },
    thisYearPremium: { type: Number, default: null },
    renewalResult: { type: String, enum: ['done', 'cancel', 'sold', ''], default: '' },
    commissionReceived: { type: Boolean, default: false },
    remarks: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

export const PolicyRegister = mongoose.model('PolicyRegister', policyRegisterSchema);
