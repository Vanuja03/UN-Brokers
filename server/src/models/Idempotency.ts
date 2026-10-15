import mongoose, { Schema } from 'mongoose';

const idempotencySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, maxlength: 80 },
    referenceNumber: { type: String, required: true },
    kind: { type: String, enum: ['quote', 'contact'], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

idempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencySchema);
