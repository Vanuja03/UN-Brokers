import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDb } from '../config/db.js';
import { Admin } from '../models/Admin.js';

function arg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return '';
  return process.argv[index + 1] ?? '';
}

export async function createAdminAccount(input: { name: string; email: string; password: string; role: 'admin' | 'staff' }) {
  if (input.password.length < 10 || !/[A-Za-z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    throw new Error('Password must be at least 10 characters and include a letter and a number.');
  }
  const email = input.email.toLowerCase().trim();
  const existing = await Admin.findOne({ email });
  if (existing) throw new Error('An account with that email already exists.');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const admin = await Admin.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role,
    active: true,
  });
  return admin;
}

async function main() {
  const name = arg('name');
  const email = arg('email');
  const password = arg('password');
  const role = arg('role') === 'staff' ? 'staff' : 'admin';
  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -w server -- --name "Full Name" --email "you@company.com" --password "a-long-password" [--role admin|staff]');
    process.exit(1);
  }
  await connectDb();
  const admin = await createAdminAccount({ name, email, password, role });
  console.log(`Created ${admin.role} account for ${admin.email}.`);
  process.exit(0);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invoked) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Could not create the account.');
    process.exit(1);
  });
}
