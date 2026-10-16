import { Link } from 'react-router-dom';
import { services } from '../../content/services';
import { quoteSectionId } from '../../content/pageSections';
import { SectionLink } from '../common/SectionLink';
import { useSettings } from '../../context/SettingsContext';
import { whatsappHref } from '../../services/api';
import { Container } from '../common/Container';
import { Logo } from '../common/Logo';

export function Footer() {
  const { settings } = useSettings();
  const socials = [
    ['facebook', settings.socialLinks.facebook],
    ['instagram', settings.socialLinks.instagram],
    ['linkedin', settings.socialLinks.linkedin],
    ['youtube', settings.socialLinks.youtube],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const whatsapp = whatsappHref(settings.whatsappNumber);

  return (
    <footer className="bg-navy-950 text-slate-200">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <SectionLink section="home" className="inline-flex items-center gap-3">
            <Logo className="h-16 w-auto" />
            <span className="font-heading text-xl font-bold text-white">{settings.companyName}</span>
          </SectionLink>
          <p className="mt-3 text-sm leading-6 text-slate-300">{settings.tagline}</p>
          {socials.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {socials.map(([name, href]) => <li key={name}><a className="capitalize underline-offset-4 hover:text-gold hover:underline" href={href} rel="noreferrer" target="_blank">{name}</a></li>)}
            </ul>
          ) : null}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Insurance</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((service) => <li key={service.slug}><Link className="hover:text-white" to={`/insurance/${service.slug}`}>{service.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Pages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><SectionLink section="about">About Us</SectionLink></li>
            <li><SectionLink section="partners">Partners</SectionLink></li>
            <li><SectionLink section="testimonials">Testimonials</SectionLink></li>
            <li><SectionLink section="team">Our Team</SectionLink></li>
            <li><SectionLink section="faq">FAQ</SectionLink></li>
            <li><Link to="/guides">Guides</Link></li>
            <li><SectionLink section="contact">Contact</SectionLink></li>
            <li><SectionLink section={quoteSectionId}>Request a quote</SectionLink></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {settings.telephone ? <li><a href={`tel:${settings.telephone}`}>{settings.telephone}</a></li> : null}
            {settings.email ? <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li> : null}
            {whatsapp ? <li><a href={whatsapp} rel="noreferrer" target="_blank">WhatsApp</a></li> : null}
            {settings.address ? <li>{settings.address}</li> : null}
            {settings.officeHours ? <li>Office hours: {settings.officeHours}</li> : null}
            <li><SectionLink section="contact">Contact the team</SectionLink></li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          <p className="flex gap-4"><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms">Terms and conditions</Link></p>
        </Container>
      </div>
    </footer>
  );
}
