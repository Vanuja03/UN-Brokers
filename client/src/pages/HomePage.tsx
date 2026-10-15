import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { SectionHeading } from '../components/common/SectionHeading';
import { FaqList } from '../components/common/FaqList';
import { Photo } from '../components/common/Photo';
import { Button } from '../components/common/Button';
import { ServiceCard } from '../components/insurance/ServiceCard';
import { aboutImage, heroImage, services } from '../content/services';
import { fallbackFaqs, guides } from '../content/guides';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import type { Faq, InsuranceType, Partner, TeamMember, Testimonial } from '../types';
import { INSURANCE_TYPES } from '../types';

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
      <section className="py-16">
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
      <section className="bg-navy-50 py-16">
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
            <Button to="/request-quote" variant="gold">Request a Quote</Button>
            <Button to="/contact" variant="outline">Contact Our Team</Button>
          </div>
        </Container>
      </section>
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [type, setType] = useState<InsuranceType>('motor');
  function submit(event: FormEvent) {
    event.preventDefault();
    navigate(`/request-quote?type=${type}`);
  }
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <Photo src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/92 to-navy-900/75" />
      <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <div className="relative">
          <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 top-0 h-full w-auto max-w-none object-contain object-left select-none opacity-25" />
          <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Insurance brokerage</p>
          <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">Protection You Can Trust. Coverage That Fits Your Life.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">Find the right insurance solutions for your vehicle, family, property, travels, and business with guidance from a team committed to protecting what matters most.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/request-quote" variant="gold">Get a Free Quote</Button>
            <Button to="/insurance" variant="outline">Explore Our Coverage</Button>
          </div>
          <p className="mt-5 max-w-xl text-sm text-slate-300">A quotation inquiry is a request for options. It does not start a policy or guarantee acceptance.</p>
          </div>
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
    ['Personalized insurance guidance', 'The inquiry is reviewed against the cover type you chose, rather than a single generic form.'],
    ['Help finding suitable options', 'The team can approach insurers it works with and explain the differences in plain language.'],
    ['Clear policy explanations', 'Limits, excesses, and exclusions should be understood before you decide.'],
    ['Support through the quotation', 'You can be asked for missing details before anything is treated as final.'],
    ['Help with documents', 'The team can tell you which details an insurer still needs.'],
    ['Claims guidance, when offered', 'The team can explain how a claim is usually started. The insurer decides the claim.'],
  ];
  return (
    <section className="bg-navy-50 py-16">
      <Container>
        <SectionHeading eyebrow="Why use a brokerage" title="Guidance before you buy" text="A brokerage can help you compare options. It cannot promise the lowest price, instant cover, or that a claim will be paid." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    <section className="py-16">
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
  const [items, setItems] = useState<Partner[]>([]);
  useEffect(() => { api.get('/partners').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  const demo = items.some((item) => item.isDemo);
  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <Container>
        <SectionHeading eyebrow="Partners" title="Insurance partners and collaborators" text="Logos appear here only for relationships the business chooses to publish." />
        {demo ? <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">Sample profiles are shown for demonstration. They are not real partnerships.</p> : null}
        {items.length === 0 ? <p className="mt-8 text-sm text-slate-600">Partner profiles will appear here once they are added.</p> : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item._id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex h-14 items-center">
                  {item.logoUrl ? <img src={item.logoUrl} alt="" className="max-h-12 max-w-full object-contain" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-gold">{item.name.slice(0, 1)}</span>}
                </div>
                <h3 className="mt-3 font-bold">{item.name}</h3>
                {item.isDemo ? <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Sample</p> : null}
                {item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}
                {item.websiteUrl ? <a className="mt-3 inline-block text-sm font-semibold underline" href={item.websiteUrl} rel="noreferrer" target="_blank">Visit website</a> : null}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

function TestimonialsStrip() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => { api.get('/testimonials').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <section className="py-16">
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
    <section className="bg-navy-50 py-16">
      <Container className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="About" title={settings.companyName} text={settings.aboutIntro} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article><h3 className="font-bold">Mission</h3><p className="mt-1 text-sm leading-6 text-slate-600">{settings.mission}</p></article>
            <article><h3 className="font-bold">Vision</h3><p className="mt-1 text-sm leading-6 text-slate-600">{settings.vision}</p></article>
          </div>
          <Link to="/about" className="mt-6 inline-flex text-sm font-semibold underline">More about us</Link>
        </div>
        <Photo src={aboutImage} alt="Professionals talking together in an office" className="h-80 w-full rounded-3xl object-cover" />
      </Container>
    </section>
  );
}

function TeamPreview() {
  const [items, setItems] = useState<TeamMember[]>([]);
  useEffect(() => { api.get('/team').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <section className="py-16">
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
