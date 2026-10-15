import { Link } from 'react-router-dom';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { FaqList } from '../components/common/FaqList';
import { Photo } from '../components/common/Photo';
import { QuoteForm } from '../components/forms/QuoteForm';
import { ServiceCard } from '../components/insurance/ServiceCard';
import { serviceMap } from '../content/services';
import { api } from '../services/api';
import type { InsuranceCopy, InsuranceType } from '../types';
import { useEffect, useState } from 'react';

export function ServicePage({ slug }: { slug: InsuranceType }) {
  const service = serviceMap[slug];
  const [copy, setCopy] = useState<InsuranceCopy | null>(null);
  useEffect(() => {
    api.get(`/insurance/${slug}`).then((response) => setCopy(response.data.data)).catch(() => setCopy(null));
  }, [slug]);
  const overview = copy?.overview ? [copy.overview, ...service.overview.slice(1)] : service.overview;
  const summary = copy?.shortDescription || service.shortDescription;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Insurance', item: '/insurance' },
      { '@type': 'ListItem', position: 3, name: service.name },
    ],
  };
  return (
    <>
      <Seo title={copy?.metaTitle || service.metaTitle} description={copy?.metaDescription || service.metaDescription} path={`/insurance/${slug}`} jsonLd={jsonLd} />
      <section className="bg-navy-900 text-white">
        <Container className="py-10">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Insurance', to: '/insurance' }, { label: service.name }]} />
          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-4xl font-bold">{copy?.name || service.name}</h1>
              <p className="mt-4 max-w-2xl text-slate-200">{summary}</p>
              <a href="#quote" className="mt-6 inline-flex rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950">Request a quote</a>
            </div>
            <Photo src={service.image} alt={service.imageAlt} className="h-64 w-full rounded-3xl object-cover" />
          </div>
        </Container>
      </section>
      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <aside id="quote" className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <QuoteForm fixedType={slug} sourcePage={`/insurance/${slug}`} />
        </aside>
        <article className="order-2 space-y-10 lg:order-1">
          <Section title="Overview" items={overview} />
          <Section title="Who may need this insurance" items={service.who} />
          <Section title="Main benefits of asking us" items={service.benefits} />
          <Section title="Coverage that may be available" items={service.coverage} />
          <Section title="Important limitations" items={service.exclusions} />
          <Section title="Information used for the inquiry" items={service.documents} />
          <div>
            <h2 className="text-2xl font-bold">Questions about {service.name}</h2>
            <div className="mt-4"><FaqList items={service.faqs} /></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Related insurance</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {service.related.map((related) => <ServiceCard key={related} slug={related} />)}
            </div>
          </div>
          <p className="text-sm text-slate-600">Prefer to talk first? <Link className="font-semibold underline" to="/contact">Contact the team</Link>.</p>
        </article>
      </Container>
    </>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-navy-900">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
        {items.map((item) => <li key={item} className="rounded-xl bg-navy-50 px-4 py-3">{item}</li>)}
      </ul>
    </section>
  );
}
