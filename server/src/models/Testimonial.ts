import mongoose, { Schema } from 'mongoose';
import { INSURANCE_TYPES } from '../config/constants.js';

const testimonialSchema = new Schema(
  {
    customerDisplayName: { type: String, required: true, trim: true, maxlength: 120 },
    review: { type: String, required: true, maxlength: 1000 },
    insuranceType: { type: String, enum: [...INSURANCE_TYPES, ''], default: '' },
    avatarUrl: { type: String, default: '', maxlength: 500 },
    verified: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

testimonialSchema.index({ approved: 1, displayOrder: 1 });

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
