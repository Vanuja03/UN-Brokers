import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    hookTimeout: 120000,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-access-secret-32-characters-minimum',
      JWT_REFRESH_SECRET: 'test-refresh-secret-32-characters-minimum',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/un-brokers-test',
      CLIENT_ORIGIN: 'http://localhost:5173',
      COOKIE_SECURE: 'false',
      COOKIE_SAMESITE: 'lax',
      DEFAULT_CURRENCY: 'LKR',
      COMPANY_NAME: 'UN Brokers',
      SMTP_HOST: '',
      SMTP_FROM: '',
    },
  },
});
