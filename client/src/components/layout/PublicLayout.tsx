import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PageMotion } from '../common/PageMotion';
import { QuoteSelectionProvider } from '../../context/QuoteSelectionContext';
import { Footer } from './Footer';
import { Header } from './Header';

export function PublicLayout() {
  return (
    <QuoteSelectionProvider>
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">
        <PageMotion>
          <Outlet />
        </PageMotion>
      </main>
      <Footer />
      <AnalyticsNotice />
    </div>
    </QuoteSelectionProvider>
  );
}

function AnalyticsNotice() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => {
    setChoice(localStorage.getItem('ub_analytics_consent'));
  }, []);
  useEffect(() => {
    if (choice !== 'accepted' || !measurementId) return;
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);
    const win = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    win.dataLayer = win.dataLayer || [];
    win.gtag = (...args: unknown[]) => { win.dataLayer?.push(args); };
    win.gtag('js', new Date());
    win.gtag('config', measurementId);
  }, [choice, measurementId]);
  if (!measurementId || choice) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:left-auto sm:max-w-md">
      <p className="text-sm leading-6 text-slate-700">Optional analytics helps us see which pages are useful. It loads only if you accept.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => { localStorage.setItem('ub_analytics_consent', 'accepted'); setChoice('accepted'); }}>Accept</button>
        <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => { localStorage.setItem('ub_analytics_consent', 'declined'); setChoice('declined'); }}>Decline</button>
      </div>
    </div>
  );
}
