import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { PageMotion } from '../common/PageMotion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const links = [
  ['/admin/dashboard', 'Overview'],
  ['/admin/quotations', 'Quotations'],
  ['/admin/contacts', 'Messages'],
  ['/admin/content', 'Content'],
  ['/admin/settings', 'Settings'],
];

export function AdminLayout() {
  const { admin, setAdmin } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await api.post('/auth/logout');
    setAdmin(null);
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-navy-50 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="bg-navy-900 text-white lg:min-h-screen">
        <div className="flex items-center gap-3 px-5 py-5">
          <Logo className="h-14 w-auto" />
          <div>
            <p className="font-heading text-lg font-bold leading-none">UN Insurance Brokers</p>
            <p className="mt-1 text-xs text-slate-300">Staff workspace</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible" aria-label="Admin">
          {links.filter(([to]) => admin?.role === 'admin' || (to !== '/admin/content' && to !== '/admin/settings')).map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `block whitespace-nowrap rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-gold' : 'text-slate-200'}`}>{label}</NavLink>
          ))}
          <button type="button" className="block whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm text-slate-200" onClick={() => void logout()}>Sign out</button>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-600">Signed in as <span className="font-semibold text-navy-900">{admin?.name}</span></p>
          <a href="/" className="text-sm font-semibold text-navy-900">View website</a>
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
