import type { InsuranceType } from '../types';

export type ServiceContent = {
  slug: InsuranceType;
  name: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  imageAlt: string;
  overview: string[];
  who: string[];
  benefits: string[];
  coverage: string[];
  exclusions: string[];
  documents: string[];
  faqs: { question: string; answer: string }[];
  related: InsuranceType[];
};

const photo = (id: string, width = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

export const services: ServiceContent[] = [
  {
    slug: 'motor',
    name: 'Motor Insurance',
    shortDescription: 'Request options for a vehicle you own or use. Comprehensive cover and third-party cover are different products.',
    metaTitle: 'Motor Insurance Quotations',
    metaDescription: 'Request a motor insurance quotation with your vehicle, registration, value, and usage details.',
    image: photo('photo-1494976388531-d1058494cdd8'),
    imageAlt: 'A car parked on a quiet street',
    overview: [
      'A motor quotation starts with the vehicle itself: what it is, how it is used, who owns it, and the value you want considered.',
      'Insurers may offer comprehensive cover, third-party cover, or other combinations. Those options do not include the same benefits. The team will explain the differences when an insurer responds.',
      'This page collects enough information for an inquiry. It is not a policy schedule and it does not confirm that cover is available.',
    ],
    who: ['People who own or finance a private vehicle', 'Businesses that use vans, lorries, or other vehicles', 'Anyone comparing comprehensive cover with more limited options'],
    benefits: ['A clear place to record the vehicle details insurers usually ask for', 'Help distinguishing comprehensive options from third-party liability cover', 'A follow-up from the team before any policy is discussed'],
    coverage: ['Damage to your own vehicle, only when that benefit is part of the option an insurer offers', 'Liability towards other people, subject to the policy limit', 'Optional benefits such as windscreen or personal accident cover, only if the insurer includes them'],
    exclusions: ['Driving without a valid licence or outside the use declared on the policy is commonly excluded', 'Wear and tear, mechanical breakdown, and unapproved modifications are often outside cover', 'The exact exclusions are in the insurer’s wording, not on this website'],
    documents: ['Vehicle make, model, and year', 'Registration number, if one has been issued', 'Estimated market value and how the vehicle is used', 'Ownership or financing status'],
    faqs: [
      { question: 'Is comprehensive motor insurance the same as third-party cover?', answer: 'No. Third-party cover is mainly about liability to other people. Comprehensive options may also consider damage to your own vehicle, but only to the extent the policy says so.' },
      { question: 'Do I need the registration number?', answer: 'Provide it if you have it. If the vehicle is not registered yet, you can say so and add the number later.' },
      { question: 'Will submitting this form insure the vehicle today?', answer: 'No. The form saves an inquiry. Cover begins only if an insurer later issues a policy and any conditions are met.' },
    ],
    related: ['motor-third-party', 'personal-accident', 'fire'],
  },
  {
    slug: 'motor-third-party',
    name: 'Motor Third-Party Insurance',
    shortDescription: 'Request liability cover for injury or damage involving other people. This does not take the place of comprehensive motor insurance.',
    metaTitle: 'Motor Third-Party Insurance',
    metaDescription: 'Understand third-party motor liability cover and request a quotation inquiry.',
    image: photo('photo-1503376780353-7e6692767b70'),
    imageAlt: 'The front of a modern car',
    overview: [
      'Third-party motor insurance is concerned with liability for injury or property damage involving other people. It is not a promise to repair your own vehicle.',
      'Whether this cover is legally required, and what limit applies, depends on the rules where the vehicle is used. Confirm the current requirement before you rely on any explanation you read online.',
      'Use this inquiry when you specifically want third-party liability options, and use the motor insurance page if you want comprehensive options compared as well.',
    ],
    who: ['Vehicle users who want to ask about liability cover', 'Owners who need to understand how third-party cover differs from comprehensive cover', 'Businesses whose vehicles carry passengers or goods and need the use declared accurately'],
    benefits: ['A direct explanation that own-vehicle damage is usually outside third-party cover', 'Vehicle and use details collected in one inquiry', 'Room to describe the liability limit you want the team to ask about'],
    coverage: ['Liability for bodily injury to other people, up to the policy limit', 'Liability for damage to other people’s property, up to the policy limit', 'Any extra benefit only if it is written into the policy that is offered'],
    exclusions: ['Damage to your own vehicle is commonly not covered', 'Use that was not declared, such as hiring the vehicle out, may be excluded', 'Limits and exclusions differ by insurer and must be read in the wording'],
    documents: ['Vehicle type, make, model, and year', 'Registration details if available', 'How the vehicle is used', 'Ownership or financing status'],
    faqs: [
      { question: 'Does third-party cover pay for repairs to my car?', answer: 'Usually no. That is the main difference from comprehensive motor insurance. Ask the team to confirm the wording of any option they receive.' },
      { question: 'Is third-party cover compulsory?', answer: 'Many places require a minimum level of motor liability insurance before a vehicle is used on public roads. Check the rule that applies to your vehicle rather than assuming this page states the law.' },
      { question: 'Can I ask about a higher liability limit?', answer: 'Yes. Add a note and the team can ask the insurer whether a higher limit is available. Availability is not guaranteed.' },
    ],
    related: ['motor', 'personal-accident', 'workers-compensation'],
  },
  {
    slug: 'travel',
    name: 'Travel Insurance',
    shortDescription: 'Tell us where and when you are travelling so the team can ask about medical, baggage, or cancellation benefits that an insurer actually offers.',
    metaTitle: 'Travel Insurance Quotations',
    metaDescription: 'Request a travel insurance quotation with your destination, dates, and traveler details.',
    image: photo('photo-1436491865332-7a61a109cc05'),
    imageAlt: 'An airplane wing above the clouds',
    overview: [
      'Travel cover is built around a trip: the destination, the dates, and who is going. A policy for one journey is not automatically suitable for another.',
      'Medical expenses, baggage, delay, and cancellation are separate benefits. An insurer may offer some of them and not others. This form lets you say which benefits you want considered.',
      'Do not include medical reports. If an insurer needs health information later, the team will explain a suitable way to provide it.',
    ],
    who: ['People planning an international or domestic trip', 'Families who need one inquiry for several travelers', 'Travellers who want to know which benefits are actually available before they buy'],
    benefits: ['Destination, dates, and ages collected together', 'A chance to say whether medical, baggage, or cancellation benefits matter to you', 'A clear statement that the inquiry itself is not travel cover'],
    coverage: ['Emergency medical expenses, when the policy includes them and the trip qualifies', 'Baggage or cancellation benefits, only if the chosen option lists them', 'The insured trip dates, not an open-ended period unless the policy says so'],
    exclusions: ['Events that started before the policy was bought are often excluded', 'Certain activities, destinations, or undeclared travelers may be outside cover', 'Benefit limits and excesses vary and should be checked before you travel'],
    documents: ['Destination and travel dates', 'Number of travelers and their ages', 'The benefits you want the team to ask about'],
    faqs: [
      { question: 'Does every travel policy include medical cover?', answer: 'No. Ask for the benefit to be considered, then read the option the insurer provides. Some policies focus on baggage or cancellation only.' },
      { question: 'Can I include children?', answer: 'Yes. Enter the number of travelers and all ages. Age can change which options are available.' },
      { question: 'When does cover start?', answer: 'Not when you submit this form. Cover starts only if a policy is issued and its start date has been reached.' },
    ],
    related: ['personal-accident', 'motor', 'dwelling-fire'],
  },
  {
    slug: 'fire',
    name: 'Fire Insurance',
    shortDescription: 'Request fire cover for a building, its contents, or both. The location, occupancy, and insured value shape the inquiry.',
    metaTitle: 'Fire Insurance Quotations',
    metaDescription: 'Request a fire insurance quotation for a commercial or other property and its contents.',
    image: photo('photo-1486406146926-c627a92ad1ab'),
    imageAlt: 'A modern commercial building',
    overview: [
      'Fire insurance inquiries describe a property and the values you want an insurer to consider. You can ask about the building, the contents, or both.',
      'Occupancy matters. An office, warehouse, and workshop are not the same risk, even when they sit on the same street.',
      'The perils that are covered, and any excess you would pay, come from the policy. This page explains the inquiry, not a particular insurer’s wording.',
    ],
    who: ['Businesses that occupy commercial premises', 'Owners who want a building considered for fire cover', 'Occupiers who want contents values included'],
    benefits: ['Separate choices for building and contents', 'A place to record location, occupancy, and value', 'Guidance that a quotation is not automatic cover'],
    coverage: ['Loss or damage from fire, to the extent the policy lists that peril', 'Related perils only when they are named in the option you receive', 'The sum you ask the insurer to consider, which may not be the final sum insured'],
    exclusions: ['Gradual deterioration, poor maintenance, and some vacant-property situations are commonly restricted', 'Understating the value can affect a later claim', 'Theft, flood, or explosion are not included unless the policy says they are'],
    documents: ['Property type and location', 'Whether you want building cover, contents cover, or both', 'Estimated insured value and how the property is occupied'],
    faqs: [
      { question: 'Should I insure the building, the contents, or both?', answer: 'That depends on what you own and what you are responsible for. The form lets you choose either or both so the inquiry matches the risk.' },
      { question: 'Is the estimated value the final sum insured?', answer: 'No. It is the figure you want considered. An insurer may ask for a valuation or propose a different sum.' },
      { question: 'Does fire cover include every kind of damage?', answer: 'No. Cover follows the perils and exclusions in the policy. Ask the team to point those out before you decide.' },
    ],
    related: ['dwelling-fire', 'money-in-transit', 'title-insurance'],
  },
  {
    slug: 'dwelling-fire',
    name: 'Dwelling Fire Insurance',
    shortDescription: 'Request residential fire cover for a home you own, occupy, or let, including building and contents values where they apply.',
    metaTitle: 'Dwelling Fire Insurance',
    metaDescription: 'Request a dwelling fire quotation for a home, including owner or occupant status and property values.',
    image: photo('photo-1568605114967-8130f3a36994'),
    imageAlt: 'A residential house with a front garden',
    overview: [
      'Dwelling fire cover is for a home rather than a commercial premises. The inquiry asks whether you own the home, live in it, or let it to someone else.',
      'You can include a building value, a contents value, or both. A tenant may only need contents considered, while an owner may need the building as well.',
      'Construction and nearby risks can change the options an insurer will consider. Share what you know; do not guess at technical details you have not confirmed.',
    ],
    who: ['Homeowners who want the building considered', 'Tenants who want household contents considered', 'Landlords arranging cover for a dwelling they let'],
    benefits: ['Questions written for a home, not a commercial property', 'Owner, tenant, and landlord choices', 'Building and contents values kept separate'],
    coverage: ['Fire damage to the dwelling, when the building is insured', 'Household contents, when a contents sum is included', 'Other perils only if the policy you are offered names them'],
    exclusions: ['Damage that happened before the policy starts is not covered by a new inquiry', 'Some policies restrict cover while a home is unoccupied', 'High-value items may need to be listed separately if an insurer requires it'],
    documents: ['Address or area of the home', 'Whether you own, occupy, or let it', 'Building value, contents value, or both', 'Any construction or fire-risk details you already know'],
    faqs: [
      { question: 'I rent my home. Which value should I enter?', answer: 'Often the contents value is the relevant one, but that depends on your tenancy. Enter the contents value and leave the building value blank if you are not responsible for the building.' },
      { question: 'Can a landlord use this form?', answer: 'Yes. Choose landlord and describe the dwelling. The team can ask insurers for options suited to a let property.' },
      { question: 'Is household insurance the same as dwelling fire cover?', answer: 'Names vary. Some policies are limited to fire and related perils, while others are broader. The inquiry does not assume they are the same.' },
    ],
    related: ['fire', 'title-insurance', 'personal-accident'],
  },
  {
    slug: 'workers-compensation',
    name: "Workers' Compensation Insurance",
    shortDescription: 'Request workplace injury cover for employees. Legal duties and benefits depend on your business and the rules that currently apply.',
    metaTitle: "Workers' Compensation Insurance",
    metaDescription: 'Request a workers’ compensation quotation with your business activity, employees, and payroll details.',
    image: photo('photo-1504307651254-35680f356dfd'),
    imageAlt: 'People working on a construction site',
    overview: [
      'Workers’ compensation insurance is about injury connected with employment. It is not a general medical plan and it is not motor insurance for employees who drive.',
      'Insurers usually ask what the business does, how many people work there, the kind of work they do, and sometimes the payroll. Those facts change the premium and the options.',
      'This website cannot tell you whether your business has a legal duty to buy a particular policy. Use the inquiry to start the conversation, then confirm current obligations separately.',
    ],
    who: ['Employers arranging cover for staff', 'Businesses with mixed office, driving, or manual work', 'Owners who want payroll and job categories recorded accurately'],
    benefits: ['Business activity and employee categories in one inquiry', 'Optional payroll figure when an insurer needs it', 'A reminder that claim decisions belong to the insurer and the policy'],
    coverage: ['Benefits described in the policy for covered workplace injury', 'The employee groups you declare', 'Limits and waiting rules set out in the wording, not on this page'],
    exclusions: ['Injuries outside the policy definition, or outside employment, may not be covered', 'Undeclared work activities can cause a problem later', 'This form does not collect medical records'],
    documents: ['What the business does', 'Number of employees and their categories', 'Estimated annual payroll, if you have it', 'Any workplace risk you want the insurer to know about'],
    faqs: [
      { question: 'Is this the same as personal accident cover?', answer: 'No. Personal accident cover is arranged for a person and a benefit amount. Workers’ compensation is tied to employment and the employer’s policy.' },
      { question: 'Do I have to enter payroll?', answer: 'Only if you have a figure an insurer is likely to need. You can leave it blank and provide it when the team asks.' },
      { question: 'Does this form confirm that I meet a legal requirement?', answer: 'No. It requests a quotation. Legal duties depend on your situation and the current rules.' },
    ],
    related: ['personal-accident', 'money-in-transit', 'motor'],
  },
  {
    slug: 'money-in-transit',
    name: 'Money-in-Transit Insurance',
    shortDescription: 'Request cover for cash or negotiable items while they are being moved, including how often and what security you use.',
    metaTitle: 'Money-in-Transit Insurance',
    metaDescription: 'Request a money-in-transit quotation with amounts, frequency, routes, and security arrangements.',
    image: photo('photo-1556742049-0cfed4f6a45d'),
    imageAlt: 'A card payment at a shop counter',
    overview: [
      'Money-in-transit cover is about cash or similar items during collection, delivery, or movement between places. It is not the same as cover for money locked inside a safe, unless a policy says otherwise.',
      'Insurers pay close attention to the amount, how often money moves, and the security you use. Those details belong in the inquiry.',
      'Any quotation will usually carry conditions. Meeting them is part of the cover, not an optional extra.',
    ],
    who: ['Retailers who bank takings', 'Businesses that move cash between branches', 'Organisations with regular collections or deliveries of money'],
    benefits: ['Amount, frequency, and security captured together', 'Space to describe collection and delivery without sending account numbers', 'A follow-up that can explain conditions before you decide'],
    coverage: ['Loss of money during the transit described in the policy', 'The people and routes that were declared', 'Limits based on the amount and security an insurer agrees'],
    exclusions: ['Movements that ignore the security conditions are commonly excluded', 'Unexplained shortages and certain employee fraud wordings may be limited or excluded', 'Money left unattended outside the transit definition is often not covered'],
    documents: ['Type of business', 'Typical amount carried', 'How often transits happen', 'Security, collection, and delivery arrangements'],
    faqs: [
      { question: 'Should I include bank account numbers?', answer: 'No. Describe the movement and the security. Do not send account numbers, PINs, or card details.' },
      { question: 'Does this cover money in a safe overnight?', answer: 'Not unless the policy says so. This inquiry is about money in transit. Ask the team if you also need premises cover.' },
      { question: 'What if the amount changes from week to week?', answer: 'Give a typical amount and explain the range in the notes. An insurer may set a maximum any one transit.' },
    ],
    related: ['fire', 'workers-compensation', 'motor'],
  },
  {
    slug: 'personal-accident',
    name: 'Personal Accident Insurance',
    shortDescription: 'Request benefit options for a covered accidental injury. Occupation and the amount you want considered are the starting point.',
    metaTitle: 'Personal Accident Insurance',
    metaDescription: 'Request a personal accident quotation with occupation and desired benefit amount. No medical records are collected here.',
    image: photo('photo-1571019614242-c5c5dee9f50b'),
    imageAlt: 'A person exercising outdoors',
    overview: [
      'Personal accident insurance pays a benefit if a covered accident causes an injury described in the policy. It is not a promise to pay for every medical bill, and it is not life insurance.',
      'The inquiry asks for occupation and the amount you want considered. Occupation matters because the risk of injury is not the same for every kind of work.',
      'Do not send medical records, test results, or identity documents through this form.',
    ],
    who: ['Individuals who want accidental injury benefits considered', 'Families asking about cover for a working adult', 'Anyone comparing a stated benefit amount with what insurers offer'],
    benefits: ['A short inquiry that avoids medical records', 'Occupation and benefit amount kept specific', 'Room to describe the benefits you care about, such as accidental death or disablement, without assuming they are included'],
    coverage: ['Benefits named in the policy for accidents that meet the definition', 'The person and occupation that were declared', 'The sum an insurer agrees, which may differ from the amount you requested'],
    exclusions: ['Illness that is not caused by an accident is often excluded', 'Some hazardous activities need to be declared or are excluded', 'Pre-existing conditions, if relevant, are handled by the insurer’s proposal, not by this public form'],
    documents: ['Occupation', 'Desired coverage amount', 'Any benefit preferences you want considered'],
    faqs: [
      { question: 'Will I be asked for medical records?', answer: 'Not on this form. If an insurer needs more information later, that should happen through a process the team explains first.' },
      { question: 'Does this replace health insurance?', answer: 'No. Personal accident cover is limited to the accidental injury benefits in the policy.' },
      { question: 'Is the amount I enter guaranteed?', answer: 'No. It is the amount you want the team to ask about. The insurer decides what it will offer.' },
    ],
    related: ['travel', 'workers-compensation', 'motor'],
  },
  {
    slug: 'title-insurance',
    name: 'Title Insurance',
    shortDescription: 'Request title cover for a property transaction. The location, transaction type, value, and your role are the details providers usually need.',
    metaTitle: 'Title Insurance Quotations',
    metaDescription: 'Request a title insurance quotation for a purchase, sale, refinance, or other property transaction.',
    image: photo('photo-1560518883-ce09059eeffa'),
    imageAlt: 'A house key held in front of a home',
    overview: [
      'Title insurance is concerned with defects in ownership or title that a provider agrees to cover. It is not the same as fire insurance for the building.',
      'The inquiry asks where the property is, what kind of property it is, what the transaction is, and whether you are the buyer, seller, lender, or someone else.',
      'Providers often need searches or documents later. Sending this form does not complete those searches and does not insure the title.',
    ],
    who: ['Buyers who want title risk considered before a purchase', 'Sellers preparing for a transaction', 'Lenders or other parties to a property deal'],
    benefits: ['Transaction type and your role are explicit', 'Property location and value are recorded for the provider', 'A reminder that searches and conditions still apply'],
    coverage: ['Title defects the provider agrees to cover after its requirements are met', 'The transaction and property described in the inquiry', 'Limits based on the value and the provider’s terms'],
    exclusions: ['Problems you already know about may be excluded or need to be disclosed', 'Cover does not replace a lawyer’s review of the transaction', 'Fire, flood, and ordinary building damage are not what title insurance is for'],
    documents: ['Property location and type', 'Whether the transaction is a purchase, sale, refinance, or something else', 'Estimated property value', 'Your role in the transaction'],
    faqs: [
      { question: 'Is title insurance the same as home insurance?', answer: 'No. Home or dwelling fire cover is about physical damage. Title cover is about ownership and title, subject to the provider’s conditions.' },
      { question: 'Do I need a lawyer as well?', answer: 'This inquiry does not replace legal advice on a property transaction. Ask your lawyer what else the transaction requires.' },
      { question: 'Will the provider contact me directly?', answer: 'The brokerage team reviews the inquiry first and will tell you the next step. A provider may need more documents later.' },
    ],
    related: ['dwelling-fire', 'fire', 'personal-accident'],
  },
];

export const serviceMap = Object.fromEntries(services.map((service) => [service.slug, service])) as Record<InsuranceType, ServiceContent>;

export const aboutImage = photo('photo-1521737604893-d14cc237f11d');
export const heroImage = photo('photo-1600880292203-757bb62b4baf');
