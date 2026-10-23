import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Container } from '../common/Container';
import { serviceMap } from '../../content/services';
import { quoteSectionId } from '../../content/pageSections';
import { useQuoteSelection } from '../../context/QuoteSelectionContext';
import { scrollToSection } from '../../utils/scrollToSection';
import type { InsuranceType } from '../../types';
import { INSURANCE_TYPES } from '../../types';

const covers: Record<InsuranceType, string> = {
  motor: '/covers/cover-motor.png',
  'motor-third-party': '/covers/cover-third-party.png',
  travel: '/covers/cover-travel.png',
  fire: '/covers/cover-fire.png',
  'dwelling-fire': '/covers/cover-home.png',
  'workers-compensation': '/covers/cover-workers.png',
  'money-in-transit': '/covers/cover-money.png',
  'personal-accident': '/covers/cover-personal.png',
  'title-insurance': '/covers/cover-title.png',
};

const hooks: Record<InsuranceType, string> = {
  motor: 'Ask for comprehensive options for the vehicle you own or use.',
  'motor-third-party': 'Ask about liability cover when other people are involved.',
  travel: 'Share the trip, the dates, and who is travelling.',
  fire: 'Request fire cover for a building, its contents, or both.',
  'dwelling-fire': 'Home fire cover for owners, tenants, and landlords.',
  'workers-compensation': 'Workplace injury cover based on your staff and the work they do.',
  'money-in-transit': 'Cover for cash while it is being collected or delivered.',
  'personal-accident': 'Benefit options for a covered accidental injury.',
  'title-insurance': 'Title cover for a purchase, sale, or refinance.',
};

function useRequestQuote() {
  const navigate = useNavigate();
  const { choose } = useQuoteSelection();

  return (slug: InsuranceType) => {
    choose(slug);
    const search = `?type=${slug}`;
    if (window.location.pathname === '/' && window.location.hash === `#${quoteSectionId}`) {
      navigate({ pathname: '/', search, hash: quoteSectionId }, { preventScrollReset: true });
      scrollToSection(quoteSectionId);
      return;
    }
    navigate({ pathname: '/', search, hash: quoteSectionId });
  };
}

export function CoverageShowcase() {
  const requestQuote = useRequestQuote();
  const [featured, ...rest] = INSURANCE_TYPES;

  return (
    <section id="insurance" className="section-anchor py-16">
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">Coverage</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Choose a cover. Ask for a quote.</h2>
          <div className="mt-4 h-1 w-12 rounded-full bg-gold" />
          <p className="mt-4 text-base leading-7 text-slate-600">Pick the insurance that fits, then send the details the team needs. A quotation request does not start a policy.</p>
        </div>

        <FeaturedCover slug={featured} onQuote={requestQuote} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rest.map((slug) => <CoverTile key={slug} slug={slug} onQuote={requestQuote} />)}
        </div>
      </Container>
    </section>
  );
}

function FeaturedCover({ slug, onQuote }: { slug: InsuranceType; onQuote: (slug: InsuranceType) => void }) {
  const service = serviceMap[slug];
  return (
    <article className="mt-10 grid overflow-hidden rounded-[1.75rem] border border-navy-900/10 bg-navy-900 text-white shadow-card lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gold">Start here</p>
        <h3 className="mt-2 text-3xl font-bold sm:text-4xl">{service.name}</h3>
        <p className="mt-3 max-w-md text-base leading-7 text-slate-200">{hooks[slug]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-dark" onClick={() => onQuote(slug)}>
            Get a quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link to={`/insurance/${slug}`} className="inline-flex items-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            See the details
          </Link>
        </div>
      </div>
      <div className="relative flex min-h-56 items-center justify-center bg-[radial-gradient(circle_at_center,#16345f_0%,#0b2545_70%)] px-6 py-8">
        <img src={covers[slug]} alt="" className="h-52 w-full object-contain sm:h-64 lg:h-72" />
      </div>
    </article>
  );
}

function CoverTile({ slug, onQuote }: { slug: InsuranceType; onQuote: (slug: InsuranceType) => void }) {
  const service = serviceMap[slug];
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:shadow-lg">
      <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-b from-navy-50 to-white">
        <img src={covers[slug]} alt="" className="h-32 w-full object-contain transition duration-500 group-hover:scale-105" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy-900">{service.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-slate-600">{hooks[slug]}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-gold group-hover:text-navy-950" onClick={() => onQuote(slug)}>
          Get a quote
        </button>
        <Link to={`/insurance/${slug}`} className="text-sm font-semibold text-navy-800 underline-offset-4 hover:underline">Details</Link>
      </div>
    </article>
  );
}
