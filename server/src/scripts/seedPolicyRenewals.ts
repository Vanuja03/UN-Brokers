import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from '../config/db.js';
import { PolicyRenewal } from '../models/PolicyRenewal.js';

export async function seedPolicyRenewals() {
  const result = await PolicyRenewal.deleteMany({});
  return result.deletedCount;
}

async function main() {
  await connectDb();
  const removed = await seedPolicyRenewals();
  console.log(`Removed ${removed} separate policy renewal records. Renewals now come from the policy register.`);
  process.exit(0);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
