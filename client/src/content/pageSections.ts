export const pageSections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'insurance', label: 'Insurance Services' },
  { id: 'benefits', label: 'Our Benefits' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'partners', label: 'Partners' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'team', label: 'Our Team' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact Us' },
] as const;

export const quoteSectionId = 'get-a-quote';

export const observedSectionIds = [...pageSections.map((section) => section.id), quoteSectionId];
