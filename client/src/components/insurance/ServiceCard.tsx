import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Car, FileCheck, Flame, HardHat, HeartPulse, Home, Plane, Shield } from 'lucide-react';
import type { InsuranceType } from '../../types';
import { serviceMap } from '../../content/services';
import { quoteSectionId } from '../../content/pageSections';
import { useQuoteSelection } from '../../context/QuoteSelectionContext';
import { scrollToSection } from '../../utils/scrollToSection';

const icons = {
  motor: Car,
  'motor-third-party': Shield,
  travel: Plane,
  fire: Flame,
  'dwelling-fire': Home,
  'workers-compensation': HardHat,
  'money-in-transit': Banknote,
  'personal-accident': HeartPulse,
  'title-insurance': FileCheck,
};

export function ServiceIcon({ slug, className = 'h-6 w-6' }: { slug: InsuranceType; className?: string }) {
  const Icon = icons[slug];
  return <Icon className={className} aria-hidden="true" />;
}

export function ServiceCard({ slug }: { slug: InsuranceType }) {
  const service = serviceMap[slug];
  const navigate = useNavigate();
  const { choose } = useQuoteSelection();

  function requestQuote() {
    choose(slug);
    const search = `?type=${slug}`;
    if (window.location.pathname === '/' && window.location.hash === `#${quoteSectionId}`) {
      navigate({ pathname: '/', search, hash: quoteSectionId }, { preventScrollReset: true });
      scrollToSection(quoteSectionId);
      return;
    }
    navigate({ pathname: '/', search, hash: quoteSectionId });
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-gold">
        <ServiceIcon slug={slug} />
      </div>
      <h3 className="mt-4 text-xl font-bold text-navy-900">{service.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{service.shortDescription}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {service.benefits.slice(0, 3).map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link to={`/insurance/${slug}`} className="text-sm font-semibold text-navy-900 underline-offset-4 hover:underline">Learn more</Link>
        <button type="button" className="text-sm font-semibold text-navy-800 underline-offset-4 hover:underline" onClick={requestQuote}>Request a quote</button>
      </div>
    </article>
  );
}
