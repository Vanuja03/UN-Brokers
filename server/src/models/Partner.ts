import mongoose, { Schema } from 'mongoose';

const partnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    logoUrl: { type: String, default: '', maxlength: 500 },
    description: { type: String, default: '', maxlength: 500 },
    websiteUrl: { type: String, default: '', maxlength: 500 },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

partnerSchema.index({ active: 1, displayOrder: 1 });

export const Partner = mongoose.model('Partner', partnerSchema);
