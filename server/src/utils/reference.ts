import { createHash, randomBytes } from 'node:crypto';

export function makeReference(prefix: 'UNB' | 'CT' | 'MQ') {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

export function fingerprintInquiry(email: string, phone: string, insuranceType: string, details: unknown) {
  const serialized = JSON.stringify(details);
  return createHash('sha256').update(`${email}|${phone}|${insuranceType}|${serialized}`).digest('hex');
}
