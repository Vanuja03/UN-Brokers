import { ContactForm } from '../components/forms/ContactForm';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { useSettings } from '../context/SettingsContext';
import { whatsappHref } from '../services/api';

export function ContactPage() {
  const { settings } = useSettings();
  const whatsapp = whatsappHref(settings.whatsappNumber);
  return (
    <Container className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr]">
      <Seo title="Contact us" description="Send a message to the insurance brokerage team." path="/contact" />
      <div>
        <h1 className="text-4xl font-bold">Contact us</h1>
        <p className="mt-3 text-slate-600">Use the form for a general question. For a quotation, the quote form collects the right details for each cover type.</p>
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
  );
}
