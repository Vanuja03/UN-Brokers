import mongoose, { Schema } from 'mongoose';

const policyRenewalSchema = new Schema(
  {
    policyNumber: { type: String, required: true, trim: true, maxlength: 60, index: true },
    vehicleNumber: { type: String, required: true, trim: true, maxlength: 30 },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    postalAddress: { type: String, required: true, trim: true, minlength: 1, maxlength: 400 },
    sumInsured: { type: Number, required: true, min: 0 },
    lastYearPremium: { type: Number, required: true, min: 0 },
    thisYearPremium: { type: Number, required: true, min: 0 },
    insuranceCompany: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    salesPerson: { type: String, default: '', trim: true, maxlength: 120 },
    speciCo: { type: String, default: '', trim: true, maxlength: 160 },
    status: { type: String, enum: ['ren', 'new'], required: true, default: 'ren' },
    renewalResult: { type: String, enum: ['done', 'cancel', 'sold', ''], default: '' },
    contactNo: { type: String, required: true, trim: true, maxlength: 20 },
    remarks: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true },
);

export const PolicyRenewal = mongoose.model('PolicyRenewal', policyRenewalSchema);
