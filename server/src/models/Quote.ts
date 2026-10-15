import mongoose, { Schema } from 'mongoose';
import { INSURANCE_TYPES, QUOTE_STATUSES } from '../config/constants.js';

const noteSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 2000 },
    authorName: { type: String, required: true, maxlength: 120 },
    authorId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    from: { type: String, maxlength: 40 },
    to: { type: String, required: true, maxlength: 40 },
    note: { type: String, maxlength: 500 },
    actorName: { type: String, maxlength: 120 },
    actorId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const quoteSchema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254, index: true },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    preferredContactMethod: { type: String, enum: ['phone', 'email', 'either'], required: true },
    insuranceType: { type: String, enum: INSURANCE_TYPES, required: true, index: true },
    insuranceDetails: { type: Schema.Types.Mixed, required: true },
    message: { type: String, default: '', maxlength: 2000 },
    consent: { type: Boolean, required: true },
    consentAt: { type: Date, required: true },
    status: { type: String, enum: QUOTE_STATUSES, default: 'new', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
    notes: { type: [noteSchema], default: [] },
    statusHistory: { type: [historySchema], default: [] },
    sourcePage: { type: String, default: '', maxlength: 300 },
    campaignSource: {
      source: { type: String, maxlength: 120 },
      medium: { type: String, maxlength: 120 },
      campaign: { type: String, maxlength: 120 },
      term: { type: String, maxlength: 120 },
      content: { type: String, maxlength: 120 },
    },
    currency: { type: String, required: true, maxlength: 3 },
    fingerprint: { type: String, index: true },
    notifications: {
      business: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
      customer: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'skipped' },
    },
  },
  { timestamps: true },
);

quoteSchema.index({ status: 1, createdAt: -1 });
quoteSchema.index({ createdAt: -1 });

export const Quote = mongoose.model('Quote', quoteSchema);
