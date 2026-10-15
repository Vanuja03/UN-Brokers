import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { SectionHeading } from '../components/common/SectionHeading';
import { ServiceCard } from '../components/insurance/ServiceCard';
import { INSURANCE_TYPES } from '../types';

export function InsuranceIndexPage() {
  return (
    <Container className="py-12">
      <Seo title="Insurance services" description="Compare motor, travel, fire, workers’ compensation, and other insurance quotation inquiries." path="/insurance" />
      <SectionHeading eyebrow="Services" title="All insurance services" text="Open a service to read what the inquiry covers, then send the details for that category." />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {INSURANCE_TYPES.map((slug) => <ServiceCard key={slug} slug={slug} />)}
      </div>
    </Container>
  );
}
