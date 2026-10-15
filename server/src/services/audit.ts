import type { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';

export async function recordAudit(
  req: Request,
  action: string,
  resourceType = '',
  resourceId = '',
  metadata: Record<string, string | number | boolean | null> = {},
) {
  await AuditLog.create({
    action,
    actorId: req.admin?.id,
    actorRole: req.admin?.role ?? '',
    resourceType,
    resourceId,
    metadata,
    ip: req.ip ?? '',
  });
}
