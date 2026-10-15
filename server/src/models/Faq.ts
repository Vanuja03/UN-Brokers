import mongoose, { Schema } from 'mongoose';

const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, maxlength: 3000 },
    category: { type: String, required: true, default: 'general', maxlength: 80 },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

faqSchema.index({ category: 1, active: 1, displayOrder: 1 });

export const Faq = mongoose.model('Faq', faqSchema);
