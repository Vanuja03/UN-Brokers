import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

function isSrvDnsError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const record = error as { code?: string; message?: string };
  return record.code === 'EBADRESP' || record.message?.includes('querySrv') === true;
}

export async function connectDb(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (!uri.startsWith('mongodb+srv://') || !isSrvDnsError(error)) throw error;
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(uri);
  }
  return mongoose.connection;
}
