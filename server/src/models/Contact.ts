import mongoose, { Schema } from 'mongoose';
import { CONTACT_STATUSES, INSURANCE_TYPES } from '../config/constants.js';

const contactSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    insuranceType: { type: String, enum: [...INSURANCE_TYPES, ''], default: '' },
    message: { type: String, required: true, maxlength: 5000 },
    consent: { type: Boolean, required: true },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new', index: true },
    fingerprint: { type: String, index: true },
    notifications: {
      business: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
      customer: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
    },
  },
  { timestamps: true },
);

export const Contact = mongoose.model('Contact', contactSchema);
