process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-minimum';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-minimum';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/un-brokers-test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAMESITE = 'lax';
process.env.DEFAULT_CURRENCY = 'LKR';
process.env.COMPANY_NAME = 'UN Brokers';
process.env.SMTP_HOST = '';
process.env.SMTP_FROM = '';

import { afterAll, afterEach, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memory: MongoMemoryServer;

beforeAll(async () => {
  memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (memory) await memory.stop();
});
