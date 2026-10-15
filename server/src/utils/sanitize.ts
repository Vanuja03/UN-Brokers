import { AppError } from './AppError.js';

export function assertNoOperatorKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoOperatorKeys);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      throw new AppError(400, 'Invalid field name.');
    }
    assertNoOperatorKeys(nested);
  }
}

export function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
