import { useSearchParams } from 'react-router-dom';
import { QuoteForm } from '../components/forms/QuoteForm';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { isInsuranceType } from '../types';

export function RequestQuotePage() {
  const [params] = useSearchParams();
  const requested = params.get('type');
  const fixedType = isInsuranceType(requested) ? requested : undefined;
  return (
    <Container className="max-w-3xl py-12">
      <Seo title="Request a quotation" description="Submit an insurance quotation inquiry. This does not purchase a policy." path="/request-quote" />
      <h1 className="text-4xl font-bold">Request a quotation</h1>
      <p className="mt-3 text-slate-600">Choose a category and add the details that apply. You will receive a reference number when the inquiry is saved.</p>
      <div className="mt-8">
        <QuoteForm initialType={fixedType} sourcePage="/request-quote" />
      </div>
    </Container>
  );
}
