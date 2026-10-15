export const defaultAbout = {
  intro:
    'UN Insurance Brokers helps people and businesses request insurance quotations and understand the kinds of cover that may suit their vehicle, travel, property, or work. The team explains options in plain language and supports you through the inquiry.',
  mission: 'To help customers understand their insurance options and request quotations with clear, practical guidance.',
  vision: 'To be a brokerage people return to when their cover needs change.',
};

export const defaultValues = [
  { title: 'Clarity', description: 'Explain what a quotation inquiry can and cannot do, including limits and exclusions.' },
  { title: 'Care', description: 'Treat each inquiry as a request for guidance, not a pressure to buy.' },
  { title: 'Integrity', description: 'Use only information the customer chooses to share, and keep it for the inquiry.' },
  { title: 'Responsiveness', description: 'Review inquiries and follow up when more detail is needed.' },
];

export const defaultFaqs = [
  {
    question: 'How do I request an insurance quotation?',
    answer:
      'Choose a cover type, complete the quotation form, and submit it. The team reviews the details you provide and contacts you about possible next steps. The form does not collect payment.',
    category: 'general',
    displayOrder: 1,
  },
  {
    question: 'What documents do I need?',
    answer:
      'Start with the details asked on the form for that cover type, such as vehicle, trip, property, or business information. The team will tell you if an insurer needs anything further. Do not send identity documents or payment card details through this form.',
    category: 'general',
    displayOrder: 2,
  },
  {
    question: 'How long does the quotation process take?',
    answer:
      'Timing depends on the information you provide and how quickly an insurer can respond. After you submit an inquiry, the team reviews it and contacts you. There is no fixed same-day promise.',
    category: 'general',
    displayOrder: 3,
  },
  {
    question: 'Can I inquire about multiple insurance types?',
    answer:
      'Yes. Submit a separate inquiry for each type of cover so the details stay accurate. You can tell the team in the message if the inquiries are related.',
    category: 'general',
    displayOrder: 4,
  },
  {
    question: 'Does submitting a quote request purchase a policy?',
    answer:
      'No. A quotation inquiry is a request for options. It does not start cover, bind a policy, or mean an insurer has accepted the risk.',
    category: 'general',
    displayOrder: 5,
  },
  {
    question: 'How does the brokerage process work?',
    answer:
      'You share the details needed for an inquiry. The brokerage reviews them, may contact you for clarification, and discusses suitable options. Any policy is issued by an insurer, not by this website.',
    category: 'general',
    displayOrder: 6,
  },
  {
    question: 'How do I contact the team?',
    answer:
      'Use the contact form. If a telephone number, email address, or WhatsApp number is shown on the site, you can use that as well.',
    category: 'general',
    displayOrder: 7,
  },
  {
    question: 'How is my personal information handled?',
    answer:
      'The details you submit are used to review your inquiry and contact you. Read the privacy notice for what is collected, why it is kept, and how to ask a question about your information.',
    category: 'general',
    displayOrder: 8,
  },
];

export const defaultInsuranceContent = [
  {
    slug: 'motor',
    name: 'Motor Insurance',
    shortDescription: 'Quotation inquiries for cover options on a vehicle you own or use, including damage and liability choices offered by insurers.',
    overview:
      'Motor insurance inquiries collect the vehicle, use, and value details insurers usually need before they can indicate options. Comprehensive and other cover types are not the same product, and the benefits depend on the policy that is eventually offered.',
  },
  {
    slug: 'motor-third-party',
    name: 'Motor Third-Party Insurance',
    shortDescription: 'Inquiries for liability cover related to injury or damage involving other people. This is different from comprehensive motor insurance.',
    overview:
      'Third-party motor cover is aimed at liability to other people. It commonly does not pay for damage to your own vehicle. Limits, required cover, and exclusions depend on the policy and on the rules that apply where the vehicle is used.',
  },
  {
    slug: 'travel',
    name: 'Travel Insurance',
    shortDescription: 'Inquiries for trip cover. Medical, baggage, or cancellation benefits are included only when an insurer actually offers them.',
    overview:
      'A travel inquiry records the destination, dates, and who is travelling so the team can ask insurers about suitable options. Benefits vary by policy and are not automatic.',
  },
  {
    slug: 'fire',
    name: 'Fire Insurance',
    shortDescription: 'Inquiries for fire cover on a building, contents, or both, based on the property and the value you want considered.',
    overview:
      'Fire insurance inquiries describe the property, what should be considered for cover, and the estimated value. The perils, limits, and exclusions are set by the insurer’s policy, not by this form.',
  },
  {
    slug: 'dwelling-fire',
    name: 'Dwelling Fire Insurance',
    shortDescription: 'Inquiries for residential fire cover, including whether you own or occupy the home and the building or contents values to consider.',
    overview:
      'Dwelling fire inquiries focus on a home. Tell the team whether you own, occupy, or let the property, and which values should be considered. Cover still depends on the policy wording.',
  },
  {
    slug: 'workers-compensation',
    name: "Workers' Compensation Insurance",
    shortDescription: 'Inquiries for workplace injury cover related to employees. Legal duties and policy benefits depend on the business and current local rules.',
    overview:
      'These inquiries collect the type of work, employee numbers, and payroll information an insurer may need. This form does not decide whether a business has a legal duty to buy a particular policy.',
  },
  {
    slug: 'money-in-transit',
    name: 'Money-in-Transit Insurance',
    shortDescription: 'Inquiries for cover while cash or negotiable items are being moved, subject to security conditions and policy limits.',
    overview:
      'Money-in-transit inquiries describe how cash moves, how often, and what security is in place. Insurers commonly apply conditions, limits, and exclusions that the team will explain if a quotation is prepared.',
  },
  {
    slug: 'personal-accident',
    name: 'Personal Accident Insurance',
    shortDescription: 'Inquiries for benefit options if an insured person has a covered accidental injury. This form does not ask for medical records.',
    overview:
      'Personal accident inquiries collect occupation and the amount of benefit you want considered. Policies pay only for events and benefits described in the wording. Pre-existing medical information is not requested here.',
  },
  {
    slug: 'title-insurance',
    name: 'Title Insurance',
    shortDescription: 'Inquiries about title cover for a property transaction, subject to the provider’s searches and conditions.',
    overview:
      'Title insurance inquiries record the property, the transaction, and your role in it. Any cover depends on the provider’s requirements and is not confirmed by submitting this form.',
  },
];

export const demoPartners = [
  { name: 'Sample Partner A', description: 'Demo insurer profile for layout preview. This is not a real partnership.', displayOrder: 1 },
  { name: 'Sample Partner B', description: 'Demo insurer profile for layout preview. This is not a real partnership.', displayOrder: 2 },
  { name: 'Sample Partner C', description: 'Demo collaborator profile for layout preview. Replace it before launch.', displayOrder: 3 },
  { name: 'Sample Partner D', description: 'Demo collaborator profile for layout preview. Replace it before launch.', displayOrder: 4 },
];

export const demoTestimonials = [
  {
    customerDisplayName: 'Sample Customer',
    review: 'This is sample feedback for layout demonstration. Replace it with an approved customer comment before launch.',
    insuranceType: 'motor',
    displayOrder: 1,
  },
  {
    customerDisplayName: 'Sample Traveller',
    review: 'Sample testimonial only. Do not present this as a real client review.',
    insuranceType: 'travel',
    displayOrder: 2,
  },
  {
    customerDisplayName: 'Sample Business',
    review: 'Sample testimonial only. Replace it with feedback you have permission to publish.',
    insuranceType: 'fire',
    displayOrder: 3,
  },
];

export const demoTeam = [
  {
    name: 'Sample Advisor',
    jobTitle: 'Insurance advisor',
    biography: 'Sample team profile for development. Replace this with an authorized biography and photograph.',
    qualifications: [],
    displayOrder: 1,
  },
  {
    name: 'Sample Associate',
    jobTitle: 'Client support',
    biography: 'Sample team profile for development. Replace this with an authorized biography and photograph.',
    qualifications: [],
    displayOrder: 2,
  },
  {
    name: 'Sample Manager',
    jobTitle: 'Inquiry coordinator',
    biography: 'Sample team profile for development. Replace this with an authorized biography and photograph.',
    qualifications: [],
    displayOrder: 3,
  },
];
