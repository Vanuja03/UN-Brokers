import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { PartnerSlideshow } from '../components/partners/PartnerSlideshow';

export function PartnersPage() {
  return (
    <Container className="py-12">
      <Seo title="Insurance partners" description="Insurance partners published by the brokerage." path="/partners" />
      <div className="rounded-lg bg-navy-100 px-4 py-12 sm:px-8">
        <PartnerSlideshow />
      </div>
    </Container>
  );
}
