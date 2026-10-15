import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Admin } from '../src/models/Admin.js';
import { loginAs } from './helpers.js';

const app = createApp();

describe('administrator authentication', () => {
  it('rejects a wrong password and signs in a valid administrator', async () => {
    const { user } = await loginAs(app, 'admin', 'owner@example.com');
    const failed = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong-password' });
    expect(failed.status).toBe(401);
    expect(failed.body.message).toBe('Invalid email or password.');
  });

  it('returns the signed-in profile and ends the session on logout', async () => {
    const { agent, csrf } = await loginAs(app, 'staff', 'staff.user@example.com');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.role).toBe('staff');
    const loggedOut = await agent.post('/api/auth/logout').set('x-csrf-token', csrf);
    expect(loggedOut.status).toBe(200);
    const again = await agent.get('/api/auth/me');
    expect(again.status).toBe(401);
  });

  it('stops a deactivated account from using an existing session', async () => {
    const { agent } = await loginAs(app, 'admin', 'active.admin@example.com');
    await Admin.updateOne({ email: 'active.admin@example.com' }, { active: false, $inc: { tokenVersion: 1 } });
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('lets administrators update settings and refuses staff', async () => {
    const admin = await loginAs(app, 'admin', 'settings.admin@example.com');
    const staff = await loginAs(app, 'staff', 'settings.staff@example.com');
    const body = { companyName: 'UN Brokers', defaultCurrency: 'LKR', businessTimezone: 'Asia/Colombo', telephone: '' };
    const denied = await staff.agent.put('/api/settings').set('x-csrf-token', staff.csrf).send(body);
    expect(denied.status).toBe(403);
    const saved = await admin.agent.put('/api/settings').set('x-csrf-token', admin.csrf).send(body);
    expect(saved.status).toBe(200);
    expect(saved.body.data.companyName).toBe('UN Brokers');
  });

  it('returns a not found response for unknown routes', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
