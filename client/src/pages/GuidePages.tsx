import { Link, useParams } from 'react-router-dom';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { guides } from '../content/guides';

export function GuidesPage() {
  return (
    <Container className="py-12">
      <Seo title="Insurance guides" description="Short explanations of excesses, motor cover, fire risk, travel preparation, and policy exclusions." path="/guides" />
      <h1 className="text-4xl font-bold">Guides</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Practical reading before you request a quotation. These articles are educational and are not policy wordings.</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <li key={guide.slug}><Link to={`/guides/${guide.slug}`} className="block rounded-2xl border border-slate-200 p-5 hover:border-navy-800"><h2 className="text-xl font-bold">{guide.title}</h2><p className="mt-2 text-sm text-slate-600">{guide.description}</p></Link></li>
        ))}
      </ul>
    </Container>
  );
}

export function GuideArticlePage() {
  const { slug } = useParams();
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) return <Container className="py-16"><h1 className="text-3xl font-bold">Article not found</h1></Container>;
  return (
    <Container className="max-w-3xl py-12">
      <Seo title={guide.title} description={guide.description} path={`/guides/${guide.slug}`} />
      <p className="text-sm"><Link to="/guides" className="font-semibold underline">All guides</Link></p>
      <h1 className="mt-3 text-4xl font-bold">{guide.title}</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-slate-700">
        {guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <Link to={guide.related} className="mt-8 inline-flex font-semibold underline">Continue</Link>
    </Container>
  );
}
