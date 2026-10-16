export const pageSections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'insurance', label: 'Insurance Services' },
  { id: 'partners', label: 'Partners' },
  { id: 'team', label: 'Our Team' },
  { id: 'contact', label: 'Contact Us' },
] as const;

export const quoteSectionId = 'get-a-quote';

export const observedSectionIds = [...pageSections.map((section) => section.id), quoteSectionId];
