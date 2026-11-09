import mongoose, { Schema } from 'mongoose';

const nonMotorPolicyRegisterSchema = new Schema(
  {
    debitDate: { type: Date, required: true },
    riskDate: { type: Date, required: true },
    debitNoteNo: { type: String, default: '', trim: true, maxlength: 80 },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    postalAddress: { type: String, default: '', trim: true, maxlength: 400 },
    locationAddress: { type: String, default: '', trim: true, maxlength: 400 },
    sumInsured: { type: Number, required: true, min: 0, default: 0 },
    policyNumber: { type: String, required: true, trim: true, maxlength: 80, index: true },
    product: { type: String, required: true, trim: true, maxlength: 80 },
    renewalDate: { type: Date, default: null },
    premiumExRccTc: { type: Number, required: true, min: 0 },
    premiumRcc: { type: Number, required: true, min: 0, default: 0 },
    premiumTc: { type: Number, required: true, min: 0, default: 0 },
    premiumIncludingTax: { type: Number, required: true, min: 0 },
    exCommissionRate: { type: Number, default: 15, min: 0, max: 100 },
    rccCommissionRate: { type: Number, default: 7.5, min: 0, max: 100 },
    tcCommissionRate: { type: Number, default: 7.5, min: 0, max: 100 },
    exCommission: { type: Number, required: true, min: 0 },
    rccCommission: { type: Number, required: true, min: 0 },
    tcCommission: { type: Number, required: true, min: 0 },
    insuranceCompany: { type: String, required: true, trim: true, maxlength: 160 },
    salesPerson: { type: String, default: '', trim: true, maxlength: 120 },
    agentCode: { type: String, default: '', trim: true, maxlength: 80 },
    special: { type: String, enum: ['ren', 'new', 'refund', 'additional'], required: true, default: 'new' },
    commissionReceived: { type: Boolean, default: false },
    commissionReference: { type: String, default: '', trim: true, maxlength: 40 },
    commissionReceivedDate: { type: Date, default: null },
    thisYearPremium: { type: Number, default: null },
    renewalResult: { type: String, enum: ['done', 'cancel', 'sold', ''], default: '' },
    remarks: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

export const NonMotorPolicyRegister = mongoose.model('NonMotorPolicyRegister', nonMotorPolicyRegisterSchema);
