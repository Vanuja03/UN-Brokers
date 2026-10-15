import mongoose, { Schema } from 'mongoose';

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    jobTitle: { type: String, required: true, trim: true, maxlength: 120 },
    biography: { type: String, required: true, maxlength: 1500 },
    imageUrl: { type: String, default: '', maxlength: 500 },
    qualifications: { type: [String], default: [] },
    linkedinUrl: { type: String, default: '', maxlength: 500 },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

teamMemberSchema.index({ active: 1, displayOrder: 1 });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
