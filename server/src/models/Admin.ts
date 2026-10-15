import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'staff'], required: true, default: 'staff' },
    active: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    refreshTokenId: { type: String, default: '', select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminDocument = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId };

export const Admin = mongoose.model('Admin', adminSchema);
