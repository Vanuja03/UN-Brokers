import { INSURANCE_TYPES } from '../config/constants.js';
import { Faq } from '../models/Faq.js';
import { InsuranceContent } from '../models/InsuranceContent.js';
import { Partner } from '../models/Partner.js';
import { TeamMember } from '../models/TeamMember.js';
import { Testimonial } from '../models/Testimonial.js';
import { recordAudit } from '../services/audit.js';
import { sendData } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function requireId(id: string | string[] | undefined) {
  if (!id || Array.isArray(id)) throw new AppError(404, 'Record not found.');
  return id;
}

export const listPublicPartners = asyncHandler(async (_req, res) => {
  const items = await Partner.find({ active: true }).sort({ displayOrder: 1, name: 1 });
  sendData(res, items);
});

export const listAllPartners = asyncHandler(async (_req, res) => {
  sendData(res, await Partner.find().sort({ displayOrder: 1, name: 1 }));
});

export const createPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.create(req.body);
  await recordAudit(req, 'partner_create', 'partner', partner.id);
  sendData(res, partner, 'Partner saved.', 201);
});

export const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!partner) throw new AppError(404, 'Partner not found.');
  await recordAudit(req, 'partner_update', 'partner', partner.id);
  sendData(res, partner, 'Partner updated.');
});

export const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findByIdAndDelete(requireId(req.params.id));
  if (!partner) throw new AppError(404, 'Partner not found.');
  await recordAudit(req, 'partner_delete', 'partner', String(req.params.id));
  sendData(res, { id: req.params.id }, 'Partner removed.');
});

export const listPublicTestimonials = asyncHandler(async (_req, res) => {
  sendData(res, await Testimonial.find({ approved: true }).sort({ displayOrder: 1 }));
});

export const listAllTestimonials = asyncHandler(async (_req, res) => {
  sendData(res, await Testimonial.find().sort({ displayOrder: 1 }));
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.create(req.body);
  await recordAudit(req, 'testimonial_create', 'testimonial', item.id);
  sendData(res, item, 'Testimonial saved.', 201);
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Testimonial not found.');
  await recordAudit(req, 'testimonial_update', 'testimonial', item.id);
  sendData(res, item, 'Testimonial updated.');
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndDelete(requireId(req.params.id));
  if (!item) throw new AppError(404, 'Testimonial not found.');
  await recordAudit(req, 'testimonial_delete', 'testimonial', String(req.params.id));
  sendData(res, { id: req.params.id }, 'Testimonial removed.');
});

export const listPublicTeam = asyncHandler(async (_req, res) => {
  sendData(res, await TeamMember.find({ active: true }).sort({ displayOrder: 1, name: 1 }));
});

export const listAllTeam = asyncHandler(async (_req, res) => {
  sendData(res, await TeamMember.find().sort({ displayOrder: 1, name: 1 }));
});

export const createTeamMember = asyncHandler(async (req, res) => {
  const item = await TeamMember.create(req.body);
  await recordAudit(req, 'team_create', 'team', item.id);
  sendData(res, item, 'Team profile saved.', 201);
});

export const updateTeamMember = asyncHandler(async (req, res) => {
  const item = await TeamMember.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Team profile not found.');
  await recordAudit(req, 'team_update', 'team', item.id);
  sendData(res, item, 'Team profile updated.');
});

export const deleteTeamMember = asyncHandler(async (req, res) => {
  const item = await TeamMember.findByIdAndDelete(requireId(req.params.id));
  if (!item) throw new AppError(404, 'Team profile not found.');
  await recordAudit(req, 'team_delete', 'team', String(req.params.id));
  sendData(res, { id: req.params.id }, 'Team profile removed.');
});

export const listFaqs = asyncHandler(async (req, res) => {
  const filter: Record<string, unknown> = { active: true };
  if (typeof req.query.category === 'string' && req.query.category) {
    const allowed = req.query.category === 'general' || INSURANCE_TYPES.includes(req.query.category as (typeof INSURANCE_TYPES)[number]);
    if (!allowed) throw new AppError(400, 'Unknown FAQ category.');
    filter.category = req.query.category;
  }
  sendData(res, await Faq.find(filter).sort({ displayOrder: 1 }));
});

export const listAllFaqs = asyncHandler(async (_req, res) => {
  sendData(res, await Faq.find().sort({ category: 1, displayOrder: 1 }));
});

export const createFaq = asyncHandler(async (req, res) => {
  const item = await Faq.create(req.body);
  await recordAudit(req, 'faq_create', 'faq', item.id);
  sendData(res, item, 'FAQ saved.', 201);
});

export const updateFaq = asyncHandler(async (req, res) => {
  const item = await Faq.findByIdAndUpdate(requireId(req.params.id), req.body, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'FAQ not found.');
  await recordAudit(req, 'faq_update', 'faq', item.id);
  sendData(res, item, 'FAQ updated.');
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const item = await Faq.findByIdAndDelete(requireId(req.params.id));
  if (!item) throw new AppError(404, 'FAQ not found.');
  await recordAudit(req, 'faq_delete', 'faq', String(req.params.id));
  sendData(res, { id: req.params.id }, 'FAQ removed.');
});

export const listInsurance = asyncHandler(async (_req, res) => {
  sendData(res, await InsuranceContent.find().sort({ name: 1 }));
});

export const getInsurance = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug);
  if (!INSURANCE_TYPES.includes(slug as (typeof INSURANCE_TYPES)[number])) throw new AppError(404, 'Insurance type not found.');
  const item = await InsuranceContent.findOne({ slug });
  if (!item) throw new AppError(404, 'Insurance type not found.');
  sendData(res, item);
});

export const updateInsurance = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug);
  if (!INSURANCE_TYPES.includes(slug as (typeof INSURANCE_TYPES)[number])) throw new AppError(404, 'Insurance type not found.');
  const item = await InsuranceContent.findOneAndUpdate({ slug }, req.body, { new: true, runValidators: true });
  if (!item) throw new AppError(404, 'Insurance type not found.');
  await recordAudit(req, 'insurance_update', 'insurance', slug);
  sendData(res, item, 'Description updated.');
});
