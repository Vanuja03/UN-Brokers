import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Contact } from '../src/models/Contact.js';
import { loginAs } from './helpers.js';

const app = createApp();

const contact = {
  name: 'Nimal Perera',
  email: 'nimal@example.com',
  phone: '+94771234567',
  subject: 'Question about motor cover',
  insuranceType: 'motor',
  message: 'Please explain the difference between comprehensive and third-party cover.',
  consent: true,
  website: '',
};

describe('contact inquiries', () => {
  it('saves a contact message and hides it from the public', async () => {
    const response = await request(app).post('/api/contacts').send(contact);
    expect(response.status).toBe(201);
    expect(response.body.data.referenceNumber).toMatch(/^CT-/);
    expect(await Contact.countDocuments()).toBe(1);
    const hidden = await request(app).get('/api/contacts');
    expect(hidden.status).toBe(401);
  });

  it('rejects a short message and lets staff update the status', async () => {
    const invalid = await request(app).post('/api/contacts').send({ ...contact, message: 'Too short' });
    expect(invalid.status).toBe(400);
    await request(app).post('/api/contacts').send(contact);
    const staff = await loginAs(app, 'staff', 'contact.staff@example.com');
    const list = await staff.agent.get('/api/contacts');
    const id = list.body.data[0]._id as string;
    const updated = await staff.agent.patch(`/api/contacts/${id}/status`).set('x-csrf-token', staff.csrf).send({ status: 'in-progress' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('in-progress');
  });
});
