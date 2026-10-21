import { Router } from 'express';
import mongoose from 'mongoose';
import { login, logout, me, refresh } from '../controllers/authController.js';
import {
  archiveQuote,
  createQuote,
  exportQuotes,
  getQuote,
  listQuotes,
  quoteStats,
  updateQuote,
  updateQuoteStatus,
} from '../controllers/quoteController.js';
import { createContact, listContacts, updateContactStatus } from '../controllers/contactController.js';
import {
  createFaq,
  createPartner,
  createTeamMember,
  createTestimonial,
  deleteFaq,
  deletePartner,
  deleteTeamMember,
  deleteTestimonial,
  getInsurance,
  listAllFaqs,
  listAllPartners,
  listAllTeam,
  listAllTestimonials,
  listFaqs,
  listInsurance,
  listPublicPartners,
  listPublicTeam,
  listPublicTestimonials,
  updateFaq,
  updateInsurance,
  updatePartner,
  updateTeamMember,
  updateTestimonial,
} from '../controllers/contentController.js';
import {
  createMotorQuotation,
  downloadMotorQuotation,
  getMotorQuotation,
  listMotorQuotations,
  previewMotorQuotation,
  updateMotorQuotation,
} from '../controllers/motorQuotationController.js';
import { adminSettings, createStaff, listAudit, listStaff, publicSettings, updateSettings, updateStaff } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { authLimiter, inquiryLimiter } from '../middleware/rateLimits.js';
import { validateBody } from '../middleware/validate.js';
import { faqSchema, insuranceContentSchema, partnerSchema, settingsSchema, teamSchema, testimonialSchema } from '../validators/content.js';

export const router = Router();

const admin = [requireAuth, requireRole('admin'), requireCsrf] as const;
const staff = [requireAuth, requireCsrf] as const;

router.get('/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? 'ok' : 'degraded', db: connected ? 'connected' : 'disconnected' },
  });
});

router.post('/auth/login', authLimiter, login);
router.post('/auth/logout', requireAuth, requireCsrf, logout);
router.post('/auth/refresh', requireCsrf, refresh);
router.get('/auth/me', requireAuth, me);

router.post('/quotes', inquiryLimiter, createQuote);
router.get('/quotes/stats', requireAuth, quoteStats);
router.get('/quotes/export', requireAuth, exportQuotes);
router.get('/quotes', requireAuth, listQuotes);
router.get('/quotes/:id', requireAuth, getQuote);
router.patch('/quotes/:id/status', ...staff, updateQuoteStatus);
router.patch('/quotes/:id', ...staff, updateQuote);
router.delete('/quotes/:id', ...staff, archiveQuote);

router.get('/motor-quotations', requireAuth, listMotorQuotations);
router.post('/motor-quotations/preview', ...staff, previewMotorQuotation);
router.post('/motor-quotations', ...staff, createMotorQuotation);
router.get('/motor-quotations/:id/pdf', requireAuth, downloadMotorQuotation);
router.get('/motor-quotations/:id', requireAuth, getMotorQuotation);
router.patch('/motor-quotations/:id', ...staff, updateMotorQuotation);

router.post('/contacts', inquiryLimiter, createContact);
router.get('/contacts', requireAuth, listContacts);
router.patch('/contacts/:id/status', ...staff, updateContactStatus);

router.get('/partners', listPublicPartners);
router.get('/admin/partners', requireAuth, requireRole('admin'), listAllPartners);
router.post('/partners', ...admin, validateBody(partnerSchema), createPartner);
router.patch('/partners/:id', ...admin, validateBody(partnerSchema), updatePartner);
router.delete('/partners/:id', ...admin, deletePartner);

router.get('/testimonials', listPublicTestimonials);
router.get('/admin/testimonials', requireAuth, requireRole('admin'), listAllTestimonials);
router.post('/testimonials', ...admin, validateBody(testimonialSchema), createTestimonial);
router.patch('/testimonials/:id', ...admin, validateBody(testimonialSchema), updateTestimonial);
router.delete('/testimonials/:id', ...admin, deleteTestimonial);

router.get('/team', listPublicTeam);
router.get('/admin/team', requireAuth, requireRole('admin'), listAllTeam);
router.post('/team', ...admin, validateBody(teamSchema), createTeamMember);
router.patch('/team/:id', ...admin, validateBody(teamSchema), updateTeamMember);
router.delete('/team/:id', ...admin, deleteTeamMember);

router.get('/faqs', listFaqs);
router.get('/admin/faqs', requireAuth, requireRole('admin'), listAllFaqs);
router.post('/faqs', ...admin, validateBody(faqSchema), createFaq);
router.patch('/faqs/:id', ...admin, validateBody(faqSchema), updateFaq);
router.delete('/faqs/:id', ...admin, deleteFaq);

router.get('/insurance', listInsurance);
router.get('/insurance/:slug', getInsurance);
router.put('/insurance/:slug', ...admin, validateBody(insuranceContentSchema), updateInsurance);

router.get('/settings/public', publicSettings);
router.get('/settings', requireAuth, requireRole('admin'), adminSettings);
router.put('/settings', ...admin, validateBody(settingsSchema), updateSettings);

router.get('/admin/staff', requireAuth, listStaff);
router.post('/admin/staff', ...admin, createStaff);
router.patch('/admin/staff/:id', ...admin, updateStaff);
router.get('/admin/audit', requireAuth, requireRole('admin'), listAudit);
