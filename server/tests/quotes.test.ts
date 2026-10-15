import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Quote } from '../src/models/Quote.js';
import { loginAs, motorQuote } from './helpers.js';

const app = createApp();

describe('quotation inquiries', () => {
  beforeAll(() => {
    expect(app).toBeTruthy();
  });

  it('saves a motor inquiry and returns a reference number', async () => {
    const response = await request(app).post('/api/quotes').send(motorQuote);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.referenceNumber).toMatch(/^UNB-\d{8}-[A-F0-9]{6}$/);
    const saved = await Quote.findOne({ referenceNumber: response.body.data.referenceNumber });
    expect(saved?.currency).toBe('LKR');
    expect(saved?.insuranceDetails).not.toHaveProperty('extraField');
    expect(saved?.status).toBe('new');
  });

  it('rejects an invalid email and telephone number', async () => {
    const response = await request(app)
      .post('/api/quotes')
      .send({ ...motorQuote, email: 'not-an-email', phone: '123' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    const fields = response.body.errors.map((error: { field: string }) => error.field);
    expect(fields).toContain('email');
    expect(fields).toContain('phone');
  });

  it('requires consent and a registration number when the customer says one is available', async () => {
    const missingConsent = await request(app).post('/api/quotes').send({ ...motorQuote, consent: false });
    expect(missingConsent.status).toBe(400);

    const missingRegistration = await request(app)
      .post('/api/quotes')
      .send({
        ...motorQuote,
        email: 'second@example.com',
        insuranceDetails: { ...motorQuote.insuranceDetails, registrationNumber: '' },
      });
    expect(missingRegistration.status).toBe(400);
    expect(missingRegistration.body.errors.some((error: { field: string }) => error.field.includes('registrationNumber'))).toBe(true);
  });

  it('validates travel dates and fire cover choices', async () => {
    const travel = await request(app)
      .post('/api/quotes')
      .send({
        ...motorQuote,
        insuranceType: 'travel',
        insuranceDetails: {
          destination: 'Singapore',
          departureDate: '2026-12-10',
          returnDate: '2026-12-01',
          travelerCount: 2,
          travelerAges: '34, 32',
        },
      });
    expect(travel.status).toBe(400);

    const fire = await request(app)
      .post('/api/quotes')
      .send({
        ...motorQuote,
        email: 'fire@example.com',
        insuranceType: 'fire',
        insuranceDetails: {
          propertyType: 'office',
          location: 'Colombo 03',
          coverBuilding: false,
          coverContents: false,
          estimatedInsuredValue: 10000000,
          occupancy: 'Office',
        },
      });
    expect(fire.status).toBe(400);
  });

  it('does not create a second inquiry for an accidental duplicate', async () => {
    const key = 'idem-key-123456';
    const first = await request(app).post('/api/quotes').set('X-Idempotency-Key', key).send(motorQuote);
    const second = await request(app).post('/api/quotes').set('X-Idempotency-Key', key).send(motorQuote);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.referenceNumber).toBe(first.body.data.referenceNumber);
    expect(await Quote.countDocuments()).toBe(1);
  });

  it('blocks public access to inquiry records', async () => {
    const created = await request(app).post('/api/quotes').send({ ...motorQuote, email: 'hidden@example.com' });
    const saved = await Quote.findOne({ email: 'hidden@example.com' });
    const list = await request(app).get('/api/quotes');
    const detail = await request(app).get(`/api/quotes/${saved?.id}`);
    expect(list.status).toBe(401);
    expect(detail.status).toBe(401);
    expect(created.body.data.referenceNumber).toBeTruthy();
    expect(JSON.stringify(list.body)).not.toContain('hidden@example.com');
  });

  it('lets an administrator update status and see it in dashboard stats', async () => {
    await request(app).post('/api/quotes').send(motorQuote);
    const { agent, csrf } = await loginAs(app, 'admin');
    const list = await agent.get('/api/quotes');
    const id = list.body.data[0]._id as string;
    const denied = await agent.patch(`/api/quotes/${id}/status`).send({ status: 'contacted' });
    expect(denied.status).toBe(403);
    const updated = await agent.patch(`/api/quotes/${id}/status`).set('x-csrf-token', csrf).send({ status: 'contacted' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('contacted');
    const stats = await agent.get('/api/quotes/stats');
    expect(stats.body.data.total).toBe(1);
    expect(stats.body.data.awaitingFollowUp).toBe(1);
    expect(stats.body.data.byCategory[0].insuranceType).toBe('motor');
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Colombo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    expect(stats.body.data.trend).toHaveLength(14);
    expect(stats.body.data.trend.at(-1)).toEqual({ date: today, count: 1 });
  });

  it('allows staff to archive and only administrators to permanently delete', async () => {
    await request(app).post('/api/quotes').send(motorQuote);
    const staff = await loginAs(app, 'staff');
    const list = await staff.agent.get('/api/quotes');
    const id = list.body.data[0]._id as string;
    const forbidden = await staff.agent.delete(`/api/quotes/${id}?permanent=true`).set('x-csrf-token', staff.csrf);
    expect(forbidden.status).toBe(403);
    const archived = await staff.agent.delete(`/api/quotes/${id}`).set('x-csrf-token', staff.csrf);
    expect(archived.status).toBe(200);
    expect(archived.body.data.status).toBe('archived');
  });
});
