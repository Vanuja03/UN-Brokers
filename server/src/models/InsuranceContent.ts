import mongoose, { Schema } from 'mongoose';
import { INSURANCE_TYPES } from '../config/constants.js';

const insuranceContentSchema = new Schema(
  {
    slug: { type: String, enum: INSURANCE_TYPES, required: true, unique: true },
    name: { type: String, required: true, maxlength: 160 },
    shortDescription: { type: String, required: true, maxlength: 400 },
    overview: { type: String, required: true, maxlength: 4000 },
    metaTitle: { type: String, default: '', maxlength: 160 },
    metaDescription: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);

export const InsuranceContent = mongoose.model('InsuranceContent', insuranceContentSchema);
