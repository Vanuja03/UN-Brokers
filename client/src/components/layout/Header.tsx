import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Menu, Phone, X } from 'lucide-react';
import { pageSections, quoteSectionId } from '../../content/pageSections';
import { useSettings } from '../../context/SettingsContext';
import { useActiveSection } from '../../hooks/useActiveSection';
import { Logo } from '../common/Logo';
import { SectionLink } from '../common/SectionLink';

function HeaderBar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mx-auto flex w-full px-4 sm:px-6 lg:px-8 ${className ?? ''}`}>{children}</div>;
}

export function Header() {
  const { settings } = useSettings();
  const location = useLocation();
  const active = useActiveSection(location.pathname === '/');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const link = document.querySelector('nav[aria-label="Primary"] a[aria-current="true"]');
    const nav = link?.parentElement;
    if (!(link instanceof HTMLElement) || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const delta = linkRect.left - navRect.left - (nav.clientWidth - linkRect.width) / 2;
    nav.scrollBy({ left: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [active]);

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

  function itemClass(current: boolean) {
    return `whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium ${current ? 'bg-navy-50 text-navy-900' : 'text-slate-700 hover:text-navy-900'}`;
  }

  const quoteCurrent = active === quoteSectionId;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {(settings.telephone || settings.email) && (
        <div className="bg-navy-900 text-sm text-white">
          <HeaderBar className="items-center justify-end gap-4 overflow-x-auto py-2">
            {settings.telephone ? <a className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:text-gold" href={`tel:${settings.telephone}`}><Phone className="h-4 w-4" aria-hidden="true" />{settings.telephone}</a> : null}
            {settings.email ? <a className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:text-gold" href={`mailto:${settings.email}`}><Mail className="h-4 w-4" aria-hidden="true" />{settings.email}</a> : null}
          </HeaderBar>
        </div>
      )}
      <HeaderBar className="items-center gap-4 py-3">
        <SectionLink section="home" className="flex shrink-0 items-center gap-3">
          <Logo src={settings.logoUrl || '/logo.png'} className="h-14 w-auto shrink-0" />
          <span>
            <span className="block whitespace-nowrap font-heading text-lg font-bold leading-none text-navy-900">{settings.companyName}</span>
            <span className="mt-1 hidden whitespace-nowrap text-xs text-slate-500 2xl:block">{settings.tagline}</span>
          </span>
        </SectionLink>
        <nav className="ml-auto hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Primary">
          {pageSections.map((section) => (
            <SectionLink key={section.id} section={section.id} className={itemClass(active === section.id)} current={active === section.id}>
              {section.label}
            </SectionLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <SectionLink section={quoteSectionId} className={`hidden whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold sm:inline-flex ${quoteCurrent ? 'bg-gold text-navy-950 ring-2 ring-navy-900 ring-offset-2' : 'bg-gold text-navy-950'}`} current={quoteCurrent}>
            Get a Quote
          </SectionLink>
          <button ref={buttonRef} type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 lg:hidden" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          </button>
        </div>
      </HeaderBar>
      {open ? (
        <div id={menuId} ref={menuRef} className="border-t border-slate-200 bg-white lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          <HeaderBar className="max-h-[calc(100vh-5rem)] flex-col items-stretch gap-1 overflow-y-auto py-4">
            {pageSections.map((section) => (
              <SectionLink key={section.id} section={section.id} className={`rounded-xl px-3 py-3 text-base font-medium ${active === section.id ? 'bg-navy-50 text-navy-900' : ''}`} current={active === section.id} onNavigate={() => setOpen(false)}>
                {section.label}
              </SectionLink>
            ))}
            <SectionLink section={quoteSectionId} className="mt-3 rounded-full bg-gold px-4 py-3 text-center font-semibold text-navy-950" current={quoteCurrent} onNavigate={() => setOpen(false)}>
              Get a Quote
            </SectionLink>
          </HeaderBar>
        </div>
      ) : null}
    </header>
  );
}
