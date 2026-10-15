import mongoose, { Schema } from 'mongoose';

const socialSchema = new Schema(
  {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    companyName: { type: String, required: true, maxlength: 160 },
    logoUrl: { type: String, default: '', maxlength: 500 },
    tagline: { type: String, default: '', maxlength: 240 },
    telephone: { type: String, default: '', maxlength: 40 },
    email: { type: String, default: '', maxlength: 254 },
    address: { type: String, default: '', maxlength: 400 },
    officeHours: { type: String, default: '', maxlength: 240 },
    socialLinks: { type: socialSchema, default: () => ({}) },
    whatsappNumber: { type: String, default: '', maxlength: 20 },
    defaultCurrency: { type: String, default: 'LKR', maxlength: 3 },
    businessTimezone: { type: String, default: 'Asia/Colombo', maxlength: 80 },
    notificationEmail: { type: String, default: '', maxlength: 254 },
    aboutIntro: { type: String, default: '', maxlength: 2000 },
    mission: { type: String, default: '', maxlength: 1000 },
    vision: { type: String, default: '', maxlength: 1000 },
    values: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, maxlength: 80 },
            description: { type: String, required: true, maxlength: 300 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const SiteSettings = mongoose.model('SiteSettings', settingsSchema);
