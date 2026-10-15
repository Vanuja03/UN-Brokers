import { Link } from 'react-router-dom';
import { Container } from '../components/common/Container';
import { Seo } from '../components/common/Seo';

export function NotFoundPage() {
  return (
    <Container className="py-20">
      <Seo title="Page not found" description="The page you requested is not available." path="/404" />
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600">The link may be out of date. You can return home or request a quotation.</p>
      <div className="mt-6 flex gap-4 text-sm font-semibold">
        <Link className="underline" to="/">Home</Link>
        <Link className="underline" to="/request-quote">Request a quote</Link>
      </div>
    </Container>
  );
}
