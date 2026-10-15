import mongoose, { Schema } from 'mongoose';

const auditSchema = new Schema(
  {
    action: { type: String, required: true, maxlength: 80 },
    actorId: { type: Schema.Types.ObjectId, ref: 'Admin' },
    actorRole: { type: String, maxlength: 20 },
    resourceType: { type: String, maxlength: 40 },
    resourceId: { type: String, maxlength: 80 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

export const AuditLog = mongoose.model('AuditLog', auditSchema);
