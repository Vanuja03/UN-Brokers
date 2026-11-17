import mongoose, { Schema } from 'mongoose';

const debitAdviceSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    confirmationType: { type: String, required: true, enum: ['renewal', 'new-business'] },
    vehicleNumber: { type: String, required: true, trim: true, maxlength: 40 },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    sumInsured: { type: String, required: true, trim: true, maxlength: 80 },
    contactNo: { type: String, required: true, trim: true, maxlength: 20 },
    notes: { type: String, default: '', trim: true, maxlength: 800 },
    adviceDate: { type: String, required: true, maxlength: 10 },
    preparedBy: { type: String, default: '', maxlength: 120 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

export const DebitAdvice = mongoose.model('DebitAdvice', debitAdviceSchema);
