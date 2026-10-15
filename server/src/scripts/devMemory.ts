process.env.NODE_ENV ||= 'development';
process.env.JWT_ACCESS_SECRET ||= 'dev-only-access-secret-not-for-production-use';
process.env.JWT_REFRESH_SECRET ||= 'dev-only-refresh-secret-not-for-production-use';
process.env.CLIENT_ORIGIN ||= 'http://localhost:5173';
process.env.COOKIE_SECURE ||= 'false';
process.env.COOKIE_SAMESITE ||= 'lax';
process.env.COMPANY_NAME ||= 'UN Insurance Brokers';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const memory = await MongoMemoryServer.create();
process.env.MONGODB_URI = memory.getUri();

const { connectDb } = await import('../config/db.js');
const { createApp } = await import('../app.js');
const { seedDemo } = await import('./seed.js');
const { createAdminAccount } = await import('./createAdmin.js');
const { env } = await import('../config/env.js');

await connectDb(memory.getUri());
await seedDemo();

if (process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD) {
  await createAdminAccount({
    name: process.env.DEV_ADMIN_NAME || 'Local Admin',
    email: process.env.DEV_ADMIN_EMAIL,
    password: process.env.DEV_ADMIN_PASSWORD,
    role: 'admin',
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Could not create the local admin.');
  });
}

const app = createApp();
app.listen(env.port, () => {
  console.log(`Memory API listening on http://localhost:${env.port}`);
  console.log('Demo partners, testimonials, and team profiles are sample content.');
});
