import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Car, ClipboardList, FileText, LayoutDashboard, LogOut, Mail, PanelLeftClose, PanelLeftOpen, PenLine, Settings, Shield, type LucideIcon } from 'lucide-react';
import { Logo } from '../common/Logo';
import { PageMotion } from '../common/PageMotion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function navActive(to: string, pathname: string) {
  if (to === '/admin/motor-quotations') {
    return pathname === to || /^\/admin\/motor-quotations\/(?!slips(?:\/|$))/.test(pathname);
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

const links: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/quotations', label: 'Quotations', icon: FileText },
  { to: '/admin/motor-quotations', label: 'Motor quotations', icon: Car },
  { to: '/admin/motor-quotations/slips', label: 'Quotation slips', icon: ClipboardList },
  { to: '/admin/policy-renewals', label: 'Policies', icon: Shield },
  { to: '/admin/contacts', label: 'Messages', icon: Mail },
  { to: '/admin/content', label: 'Content', icon: PenLine },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function desktopSidebarOpen() {
  if (window.matchMedia('(max-width: 1023px)').matches) return false;
  return localStorage.getItem('un-admin-sidebar') !== 'closed';
}

export function AdminLayout() {
  const { admin, setAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(desktopSidebarOpen);

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) setExpanded(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSidebar(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function setSidebar(next: boolean) {
    setExpanded(next);
    if (window.matchMedia('(min-width: 1024px)').matches) {
      localStorage.setItem('un-admin-sidebar', next ? 'open' : 'closed');
    }
  }

  async function logout() {
    await api.post('/auth/logout');
    setAdmin(null);
    navigate('/admin/login');
  }

  const visibleLinks = links.filter((link) => admin?.role === 'admin' || (link.to !== '/admin/content' && link.to !== '/admin/settings'));
  const labelClass = `min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-in-out motion-reduce:transition-none ${expanded ? 'ml-3 max-w-40 opacity-100' : 'ml-0 max-w-0 opacity-0'}`;

  return (
    <div
      className="min-h-screen bg-navy-50 lg:grid lg:transition-[grid-template-columns] lg:duration-300 lg:ease-in-out motion-reduce:lg:transition-none"
      style={{ gridTemplateColumns: expanded ? '16rem minmax(0, 1fr)' : '4rem minmax(0, 1fr)' }}
    >
      <button type="button" className={`fixed inset-0 z-30 bg-navy-950/50 transition-opacity duration-300 ease-in-out motion-reduce:transition-none lg:hidden ${expanded ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-label="Collapse menu" aria-hidden={!expanded} tabIndex={expanded ? 0 : -1} onClick={() => setSidebar(false)} />
      <aside id="admin-sidebar" className={`fixed inset-y-0 left-0 z-40 w-64 overflow-x-hidden bg-navy-900 text-white shadow-xl transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:overflow-y-auto lg:shadow-none ${expanded ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-16 lg:translate-x-0'}`}>
        <div className="flex items-center py-4">
          <div className="flex h-14 w-16 shrink-0 items-center justify-center">
            <Logo className="h-10 w-auto" />
          </div>
          <div className={`min-w-0 overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none ${expanded ? 'max-w-[11rem] pr-3 opacity-100' : 'max-w-0 opacity-0'}`}>
            <p className="whitespace-nowrap font-heading text-sm font-bold leading-none">UN Insurance Brokers</p>
            <p className="mt-1 whitespace-nowrap text-xs text-slate-300">Staff workspace</p>
          </div>
        </div>
        <nav className="space-y-1 pb-4" aria-label="Admin">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = navActive(link.to, pathname);
            return (
              <NavLink key={link.to} to={link.to} title={link.label} className={`flex w-full items-center overflow-hidden rounded-xl py-1 text-sm ${active ? 'bg-white/10 text-gold' : 'text-slate-200'}`}>
                <span className="flex h-10 w-16 shrink-0 items-center justify-center">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className={labelClass}>{link.label}</span>
              </NavLink>
            );
          })}
          <button type="button" title="Sign out" className="flex w-full items-center overflow-hidden rounded-xl py-1 text-left text-sm text-slate-200" onClick={() => void logout()}>
            <span className="flex h-10 w-16 shrink-0 items-center justify-center">
              <LogOut className="h-5 w-5" aria-hidden />
            </span>
            <span className={labelClass}>Sign out</span>
          </button>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-navy-900 px-3 py-1.5 text-sm font-semibold text-navy-900" aria-expanded={expanded} aria-controls="admin-sidebar" onClick={() => setSidebar(!expanded)}>
              {expanded ? <PanelLeftClose className="h-4 w-4" aria-hidden /> : <PanelLeftOpen className="h-4 w-4" aria-hidden />}
              {expanded ? 'Collapse menu' : 'Expand menu'}
            </button>
            <p className="truncate text-sm text-slate-600">Signed in as <span className="font-semibold text-navy-900">{admin?.name}</span></p>
          </div>
          <a href="/" className="shrink-0 text-sm font-semibold text-navy-900">View website</a>
        </header>
        <div className="px-4 py-6 sm:px-6">
          <PageMotion>
            <Outlet />
          </PageMotion>
        </div>
      </div>
    </div>
  );
}
