import { INSURANCE_LABELS, type InsuranceType } from '../config/constants.js';
import { env, whatsappConfigured } from '../config/env.js';

type Delivery = 'sent' | 'failed' | 'skipped';

function plain(value: string, max: number) {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

async function postMessage(body: Record<string, unknown>) {
  const response = await fetch(`https://graph.facebook.com/v21.0/${env.whatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (response.ok) return { ok: true as const };
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  return { ok: false as const, message: payload?.error?.message || `WhatsApp request failed (${response.status})` };
}

export async function sendQuoteWhatsApp(input: {
  customerName: string;
  phone: string;
  insuranceType: string;
}): Promise<Delivery> {
  if (!whatsappConfigured()) return 'skipped';
  const name = plain(input.customerName, 80) || 'A customer';
  const type = plain(INSURANCE_LABELS[input.insuranceType as InsuranceType] ?? input.insuranceType, 80);
  const phone = plain(input.phone, 30);
  const text = `New quotation from ${name}. Cover type: ${type}. Contact: ${phone}.`;

  try {
    const template = await postMessage({
      messaging_product: 'whatsapp',
      to: env.whatsappTo,
      type: 'template',
      template: {
        name: env.whatsappTemplate,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: name },
              { type: 'text', text: type },
              { type: 'text', text: phone },
            ],
          },
        ],
      },
    });
    if (template.ok) return 'sent';

    const session = await postMessage({
      messaging_product: 'whatsapp',
      to: env.whatsappTo,
      type: 'text',
      text: { preview_url: false, body: text },
    });
    if (session.ok) return 'sent';
    console.error(session.message || template.message);
    return 'failed';
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'WhatsApp failed');
    return 'failed';
  }
}
