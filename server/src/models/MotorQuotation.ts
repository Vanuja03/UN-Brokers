import mongoose, { Schema } from 'mongoose';

const rowSchema = new Schema(
  {
    label: { type: String, required: true, maxlength: 120 },
    values: { type: [String], required: true },
  },
  { _id: false },
);

const motorQuotationSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    insuranceType: { type: String, enum: ['motor', 'motor-third-party'], required: true, index: true },
    quotationDate: { type: String, required: true, maxlength: 10 },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    vehicleNumber: { type: String, default: '', maxlength: 40 },
    leaseOrLoanNo: { type: String, default: '', maxlength: 60 },
    usage: { type: String, default: '', maxlength: 80 },
    yearOfManufacture: { type: String, default: '', maxlength: 10 },
    sumInsured: { type: String, default: '', maxlength: 40 },
    make: { type: String, default: '', maxlength: 80 },
    model: { type: String, default: '', maxlength: 80 },
    fuel: { type: String, default: '', maxlength: 40 },
    preparedBy: { type: String, default: '', maxlength: 120 },
    preparedByPhone: { type: String, default: '', maxlength: 40 },
    preparedByEmail: { type: String, default: '', maxlength: 254 },
    insurers: { type: [String], required: true },
    rows: { type: [rowSchema], required: true },
    inquiryId: { type: Schema.Types.ObjectId, ref: 'Quote', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

export const MotorQuotation = mongoose.model('MotorQuotation', motorQuotationSchema);
