import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSettings } from './services/settings.js';

const connection = await connectDb();
await ensureSettings();
const app = createApp();
const server = app.listen(env.port, () => {
  const database = connection.name || 'unknown';
  const host = connection.host || 'MongoDB';
  console.log(`MongoDB connected (${database} on ${host})`);
  console.log(`API listening on port ${env.port}`);
});

async function shutdown() {
  server.close();
  await connection.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
