import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loginAs } from './helpers.js';

const app = createApp();

const comparison = {
  insuranceType: 'motor',
  quotationDate: '2026-10-14',
  customerName: 'Sarin',
  vehicleNumber: 'ABC-1234',
  make: 'BYD',
  model: 'Sealion 5',
  fuel: 'Electric',
  yearOfManufacture: '2026',
  sumInsured: '20000000',
  usage: 'Private',
  insurers: ['Fairfirst Insurance', 'HNB General Insurance'],
  rows: [
    { label: 'Total premium with taxes', values: ['244,981.00', '286,504.00'] },
    { label: 'Third party bodily injury', values: ['Unlimited', 'Unlimited'] },
  ],
};

describe('motor customer quotations', () => {
  it('saves a comparison apart from inquiries and downloads a PDF', async () => {
    const { agent, csrf } = await loginAs(app, 'staff', 'motor-pdf@example.com');
    const created = await agent.post('/api/motor-quotations').set('X-CSRF-Token', csrf).send(comparison);
    expect(created.status).toBe(201);
    expect(created.body.data.referenceNumber).toMatch(/^MQ-\d{8}-[A-F0-9]{6}$/);

    const pdf = await agent.get(`/api/motor-quotations/${created.body.data._id}/pdf`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers['content-type']).toMatch(/application\/pdf/);
    const body = Buffer.isBuffer(pdf.body) ? pdf.body : Buffer.from(pdf.text || '');
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('does not accept a quotation for other insurance types', async () => {
    const { agent, csrf } = await loginAs(app, 'staff', 'motor-pdf-reject@example.com');
    const response = await agent
      .post('/api/motor-quotations')
      .set('X-CSRF-Token', csrf)
      .send({ ...comparison, insuranceType: 'fire' });
    expect(response.status).toBe(400);
  });
});
