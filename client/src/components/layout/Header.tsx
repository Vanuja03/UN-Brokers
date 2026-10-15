import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, Mail, Menu, Phone, X } from 'lucide-react';
import { services } from '../../content/services';
import { useSettings } from '../../context/SettingsContext';
import { Container } from '../common/Container';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/partners', label: 'Partners' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/team', label: 'Our Team' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = menuRef.current;
    const focusable = node?.querySelectorAll<HTMLElement>('a, button');
    focusable?.[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (event.key === 'Tab' && node && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium ${isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-700 hover:text-navy-900'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {(settings.telephone || settings.email) && (
        <div className="bg-navy-900 text-sm text-white">
          <Container className="flex items-center justify-end gap-4 overflow-x-auto py-2">
            {settings.telephone ? <a className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:text-gold" href={`tel:${settings.telephone}`}><Phone className="h-4 w-4" aria-hidden="true" />{settings.telephone}</a> : null}
            {settings.email ? <a className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:text-gold" href={`mailto:${settings.email}`}><Mail className="h-4 w-4" aria-hidden="true" />{settings.email}</a> : null}
          </Container>
        </div>
      )}
      <Container className="flex items-center gap-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          {settings.logoUrl ? <img src={settings.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-heading text-sm font-bold text-gold">UN</span>}
          <span>
            <span className="block whitespace-nowrap font-heading text-lg font-bold leading-none text-navy-900">{settings.companyName}</span>
            <span className="mt-1 hidden whitespace-nowrap text-xs text-slate-500 2xl:block">{settings.tagline}</span>
          </span>
        </Link>
        <nav className="ml-auto hidden shrink-0 items-center gap-1 lg:flex" aria-label="Primary">
          {links.slice(0, 2).map((link) => <NavLink key={link.to} to={link.to} className={navClass} end={link.to === '/'}>{link.label}</NavLink>)}
          <div className="relative" onMouseLeave={() => setServicesOpen(false)}>
            <button type="button" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-slate-700" aria-expanded={servicesOpen} onClick={() => setServicesOpen((value) => !value)} onMouseEnter={() => setServicesOpen(true)}>
              Insurance Services <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
            {servicesOpen ? (
              <div className="absolute left-0 top-full z-20 w-max min-w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
                <Link to="/insurance" className="block whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-navy-50" onClick={() => setServicesOpen(false)}>All insurance services</Link>
                {services.map((service) => (
                  <Link key={service.slug} to={`/insurance/${service.slug}`} className="block whitespace-nowrap rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-navy-50" onClick={() => setServicesOpen(false)}>{service.name}</Link>
                ))}
              </div>
            ) : null}
          </div>
          {links.slice(2).map((link) => <NavLink key={link.to} to={link.to} className={navClass}>{link.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/request-quote" className="hidden shrink-0 whitespace-nowrap rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-navy-950 sm:inline-flex">Get a Quote</Link>
          <button ref={buttonRef} type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 lg:hidden" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </Container>
      {open ? (
        <div id={menuId} ref={menuRef} className="border-t border-slate-200 bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <Container className="flex max-h-[calc(100vh-5rem)] flex-col gap-1 overflow-y-auto py-4">
            {links.map((link) => <NavLink key={link.to} to={link.to} className="rounded-xl px-3 py-3 text-base font-medium" onClick={() => setOpen(false)}>{link.label}</NavLink>)}
            <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Insurance services</p>
            <NavLink to="/insurance" className="rounded-xl px-3 py-3 font-medium" onClick={() => setOpen(false)}>All services</NavLink>
            {services.map((service) => <NavLink key={service.slug} to={`/insurance/${service.slug}`} className="rounded-xl px-3 py-3" onClick={() => setOpen(false)}>{service.name}</NavLink>)}
            <Link to="/request-quote" className="mt-3 rounded-full bg-gold px-4 py-3 text-center font-semibold text-navy-950" onClick={() => setOpen(false)}>Get a Quote</Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
