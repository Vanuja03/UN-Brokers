import bcrypt from 'bcryptjs';
import request, { type TestAgent } from 'supertest';
import type { Express } from 'express';
import { Admin } from '../src/models/Admin.js';

type Agent = TestAgent<request.Test>;

export async function createUser(role: 'admin' | 'staff', email = `${role}@example.com`) {
  const password = 'ValidPass123';
  await Admin.create({
    name: role === 'admin' ? 'Admin User' : 'Staff User',
    email,
    passwordHash: await bcrypt.hash(password, 4),
    role,
    active: true,
  });
  return { email, password };
}

export function readCookie(response: request.Response, name: string) {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const found = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!found) return '';
  return decodeURIComponent(found.split(';')[0].slice(name.length + 1));
}

export async function loginAs(app: Express, role: 'admin' | 'staff', email?: string) {
  const user = await createUser(role, email);
  const agent: Agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send(user);
  return { agent, csrf: readCookie(response, 'ub_csrf'), user, response };
}

export const motorQuote = {
  customerName: 'Test Customer',
  phone: '0771234567',
  email: 'customer@example.com',
  preferredContactMethod: 'email',
  insuranceType: 'motor',
  insuranceDetails: {
    vehicleType: 'private-car',
    vehicleMake: 'Toyota',
    vehicleModel: 'Aqua',
    yearOfManufacture: 2019,
    registrationAvailable: 'yes',
    registrationNumber: 'ABC-1234',
    ownershipStatus: 'owned',
    estimatedMarketValue: 8500000,
    vehicleUsage: 'private',
    fuelType: 'hybrid',
    preferredCoverage: 'comprehensive',
    extraField: 'should-not-be-stored',
  },
  consent: true,
  sourcePage: '/insurance/motor',
  website: '',
};
