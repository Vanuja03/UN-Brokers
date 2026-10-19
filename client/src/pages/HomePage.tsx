import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { SectionHeading } from '../components/common/SectionHeading';
import { FaqList } from '../components/common/FaqList';
import { Photo } from '../components/common/Photo';
import { Button } from '../components/common/Button';
import { ServiceCard } from '../components/insurance/ServiceCard';
import { PartnerSlideshow } from '../components/partners/PartnerSlideshow';
import { ContactForm } from '../components/forms/ContactForm';
import { QuoteForm } from '../components/forms/QuoteForm';
import { heroImage, services } from '../content/services';
import { AboutStory } from '../components/about/AboutStory';
import { quoteSectionId } from '../content/pageSections';
import { fallbackFaqs, guides } from '../content/guides';
import { api, whatsappHref } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useQuoteSelection } from '../context/QuoteSelectionContext';
import { scrollToSection } from '../utils/scrollToSection';
import type { Faq, InsuranceType, TeamMember, Testimonial } from '../types';
import { INSURANCE_TYPES, isInsuranceType } from '../types';

export function HomePage() {
  const { settings } = useSettings();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'InsuranceAgency',
    name: settings.companyName,
    description: settings.tagline,
    url: import.meta.env.VITE_SITE_URL || undefined,
    ...(settings.telephone ? { telephone: settings.telephone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.address ? { address: { '@type': 'PostalAddress', streetAddress: settings.address } } : {}),
  };

  return (
    <>
      <Seo title={`${settings.companyName} | Insurance quotations`} description={settings.tagline} path="/" jsonLd={jsonLd} />
      <Hero />
      <section id="insurance" className="section-anchor py-16">
        <Container>
          <SectionHeading eyebrow="Coverage" title="Insurance services" text="Each category collects different details. Choose the one that matches what you want quoted." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {INSURANCE_TYPES.map((slug) => <ServiceCard key={slug} slug={slug} />)}
          </div>
        </Container>
      </section>
      <Why />
      <How />
      <PartnersStrip />
      <TestimonialsStrip />
      <AboutPreview />
      <TeamPreview />
      <Education />
      <section id="faq" className="section-anchor bg-navy-50 py-16">
        <Container>
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" text="These answers describe the inquiry process. They are not a policy wording." />
          <div className="mt-8"><FaqPreview /></div>
          <Link to="/faq" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-900">Read all questions <ArrowRight className="h-4 w-4" /></Link>
        </Container>
      </section>
      <section className="bg-navy-900 py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Let's Find the Right Protection for You.</h2>
          <div className="flex flex-wrap gap-3">
            <Button to="/#get-a-quote" variant="gold">Request a Quote</Button>
            <Button to="/#contact" variant="outline">Contact Our Team</Button>
          </div>
        </Container>
      </section>
      <ContactSection />
      <QuoteSection />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const { choose } = useQuoteSelection();
  const [type, setType] = useState<InsuranceType>('motor');
  function submit(event: FormEvent) {
    event.preventDefault();
    choose(type);
    const alreadyThere = window.location.pathname === '/' && window.location.hash === `#${quoteSectionId}`;
    navigate({ pathname: '/', search: `?type=${type}`, hash: quoteSectionId }, { preventScrollReset: true });
    if (alreadyThere) scrollToSection(quoteSectionId);
  }
  return (
    <section id="home" className="section-anchor relative overflow-hidden bg-navy-950 text-white">
      <Photo src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/92 to-navy-900/75" />
      <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Insurance brokerage</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">Protection You Can Trust. Coverage That Fits Your Life.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">Find the right insurance solutions for your vehicle, family, property, travels, and business with guidance from a team committed to protecting what matters most.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/#get-a-quote" variant="gold">Get a Free Quote</Button>
            <Button to="/#insurance" variant="outline">Explore Our Coverage</Button>
          </div>
          <p className="mt-5 max-w-xl text-sm text-slate-300">A quotation inquiry is a request for options. It does not start a policy or guarantee acceptance.</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-navy-900 shadow-card sm:p-6">
          <h2 className="text-xl font-bold">Start a quotation inquiry</h2>
          <label htmlFor="hero-type" className="mt-4 block text-sm font-medium">Insurance category</label>
          <select id="hero-type" className="field mt-1.5" value={type} onChange={(event) => setType(event.target.value as InsuranceType)}>
            {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
          </select>
          <button type="submit" className="mt-4 w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-navy-950">Continue</button>
          <p className="mt-3 text-xs leading-5 text-slate-500">Takes a few minutes. No payment is collected.</p>
        </form>
      </Container>
    </section>
  );
}

function Why() {
  const items = [
    ['Specially negotiated insurance rates', 'We negotiate with insurance companies for competitive premiums and special discounts, so clients can secure suitable cover at attractive prices.'],
    ['Quotations and clear comparisons', 'We explain the benefits, cover, terms, and conditions of different insurers, then set the options out in detailed quotations and comparisons of premiums, benefits, and other conditions.'],
    ['Personalized guidance', 'Our experienced team discusses each client’s requirements and recommends options that fit their needs, budget, and preferred level of protection.'],
    ['Dedicated claims assistance', 'Our team stays with clients through the claims process, coordinating with insurers, following up, and negotiating where appropriate to help reach a fair and timely settlement.'],
  ];
  return (
    <section id="benefits" className="section-anchor bg-navy-50 py-16">
      <Container>
        <SectionHeading eyebrow="Benefits" title="Why clients work with us" text="We negotiate with insurers, compare the options in writing, and stay involved if a claim needs to be made." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function How() {
  const steps = [
    ['Tell us what you need', 'Choose the insurance category that matches the risk.'],
    ['Submit your quotation inquiry', 'Add the details that category asks for and confirm the privacy notice.'],
    ['The team reviews your requirements', 'Someone checks the inquiry and contacts you if more information is needed.'],
    ['Discuss suitable options', 'If an insurer offers terms, you can review them before deciding. Cover is not automatic.'],
  ];
  return (
    <section id="how-it-works" className="section-anchor py-16">
      <Container>
        <SectionHeading eyebrow="How it works" title="Four steps, and no cover until a policy exists" />
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([title, text], index) => (
            <li key={title} className="rounded-2xl border border-slate-200 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-gold">{index + 1}</span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function PartnersStrip() {
  return (
    <section id="partners" className="section-anchor bg-navy-100 py-16">
      <Container>
        <PartnerSlideshow />
      </Container>
    </section>
  );
}

function TestimonialsStrip() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => { api.get('/testimonials').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <section id="testimonials" className="section-anchor py-16">
      <Container>
        <SectionHeading eyebrow="Feedback" title="What customers say" text="Only approved feedback is published. Sample cards are labelled until real reviews replace them." />
        {items.length === 0 ? <p className="mt-8 text-sm text-slate-600">Customer feedback will appear here when it has been approved.</p> : (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {items.slice(0, 3).map((item) => (
              <li key={item._id} className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm leading-6 text-slate-700">“{item.review}”</p>
                <p className="mt-4 font-semibold">{item.customerDisplayName}</p>
                <p className="text-xs text-slate-500">{item.isDemo ? 'Sample' : item.verified ? 'Verified review' : item.insuranceType}</p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function AboutPreview() {
  const { settings } = useSettings();
  return (
    <section id="about" className="section-anchor bg-navy-50 py-16">
      <Container>
        <AboutStory title={settings.companyName} />
      </Container>
    </section>
  );
}

function TeamPreview() {
  const [items, setItems] = useState<TeamMember[]>([]);
  useEffect(() => { api.get('/team').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <section id="team" className="section-anchor py-16">
      <Container>
        <SectionHeading eyebrow="People" title="Our team" text="Profiles are published by the business. Sample profiles are marked until they are replaced." />
        {items.length === 0 ? <p className="mt-8 text-sm text-slate-600">Team profiles will appear here once they are added.</p> : (
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {items.slice(0, 3).map((member) => (
              <li key={member._id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 font-bold text-gold">{member.name.slice(0, 1)}</div>
                <h3 className="mt-4 font-bold">{member.name}</h3>
                <p className="text-sm text-navy-700">{member.jobTitle}</p>
                {member.isDemo ? <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Sample profile</p> : null}
                <p className="mt-2 text-sm leading-6 text-slate-600">{member.biography}</p>
              </li>
            ))}
          </ul>
        )}
        <Link to="/team" className="mt-6 inline-flex text-sm font-semibold underline">Meet the team</Link>
      </Container>
    </section>
  );
}

function Education() {
  return (
    <section className="border-t border-slate-200 py-16">
      <Container>
        <SectionHeading eyebrow="Learn" title="Useful reading before you inquire" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link key={guide.slug} to={`/guides/${guide.slug}`} className="rounded-2xl border border-slate-200 p-5 hover:border-navy-800">
              <h3 className="font-bold text-navy-900">{guide.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FaqPreview() {
  const [items, setItems] = useState(fallbackFaqs);
  useEffect(() => {
    api.get('/faqs?category=general').then((response) => {
      const data = response.data.data as Faq[];
      if (data.length) setItems(data.map((item) => ({ question: item.question, answer: item.answer })));
    }).catch(() => undefined);
  }, []);
  return <FaqList items={items.slice(0, 5)} />;
}

function ContactSection() {
  const { settings } = useSettings();
  const whatsapp = whatsappHref(settings.whatsappNumber);
  return (
    <section id="contact" className="section-anchor py-16">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="Contact" title="Contact us" text="Use the form for a general question. For a quotation, the quote form collects the right details for each cover type." />
          <ul className="mt-6 space-y-3 text-sm">
            {settings.telephone ? <li><a className="font-semibold" href={`tel:${settings.telephone}`}>{settings.telephone}</a></li> : null}
            {settings.email ? <li><a className="font-semibold" href={`mailto:${settings.email}`}>{settings.email}</a></li> : null}
            {whatsapp ? <li><a className="font-semibold" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></li> : null}
            {settings.address ? <li>{settings.address}</li> : null}
            {settings.officeHours ? <li>Office hours: {settings.officeHours}</li> : null}
          </ul>
        </div>
        <ContactForm />
      </Container>
    </section>
  );
}

function QuoteSection() {
  const [params] = useSearchParams();
  const { pick } = useQuoteSelection();
  const requested = params.get('type');
  const urlType = isInsuranceType(requested) ? requested : undefined;
  const initialType = pick?.type ?? urlType;
  return (
    <section id={quoteSectionId} className="section-anchor bg-navy-50 py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Quotation" title="Get a quote" text="Choose a category and add the details that apply. You will receive a reference number when the inquiry is saved. Submitting this form does not start cover." />
          <div className="mt-8">
            <QuoteForm initialType={initialType} selectionToken={pick?.token} sourcePage="/" />
          </div>
        </div>
      </Container>
    </section>
  );
}
