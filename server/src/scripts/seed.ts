import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from '../config/db.js';
import { defaultFaqs, defaultInsuranceContent, demoPartners, demoTeam, demoTestimonials } from '../data/defaults.js';
import { Faq } from '../models/Faq.js';
import { InsuranceContent } from '../models/InsuranceContent.js';
import { Partner } from '../models/Partner.js';
import { TeamMember } from '../models/TeamMember.js';
import { Testimonial } from '../models/Testimonial.js';
import { ensureSettings } from '../services/settings.js';

export async function seedDemo(refresh = false) {
  await ensureSettings();
  if (refresh) {
    await Promise.all([
      Partner.deleteMany({ isDemo: true }),
      Testimonial.deleteMany({ isDemo: true }),
      TeamMember.deleteMany({ isDemo: true }),
    ]);
  }

  if ((await InsuranceContent.countDocuments()) === 0) {
    await InsuranceContent.insertMany(defaultInsuranceContent);
  }
  if ((await Faq.countDocuments()) === 0) {
    await Faq.insertMany(defaultFaqs.map((faq) => ({ ...faq, active: true })));
  }
  if ((await Partner.countDocuments({ isDemo: true })) === 0 && (refresh || (await Partner.countDocuments()) === 0)) {
    await Partner.insertMany(demoPartners.map((item) => ({ ...item, active: true, isDemo: true, logoUrl: '', websiteUrl: '' })));
  }
  if ((await Testimonial.countDocuments({ isDemo: true })) === 0 && (refresh || (await Testimonial.countDocuments()) === 0)) {
    await Testimonial.insertMany(
      demoTestimonials.map((item) => ({ ...item, approved: true, verified: false, isDemo: true, avatarUrl: '' })),
    );
  }
  if ((await TeamMember.countDocuments({ isDemo: true })) === 0 && (refresh || (await TeamMember.countDocuments()) === 0)) {
    await TeamMember.insertMany(demoTeam.map((item) => ({ ...item, active: true, isDemo: true, imageUrl: '', linkedinUrl: '' })));
  }
}

async function main() {
  await connectDb();
  await seedDemo(process.argv.includes('--refresh'));
  console.log('Seed complete. Demo partners, testimonials, and team profiles are marked as sample content.');
  process.exit(0);
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invoked) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Seed failed.');
    process.exit(1);
  });
}
