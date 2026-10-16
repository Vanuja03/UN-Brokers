import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { captureCampaign } from './utils/campaign';
import { scrollToSection } from './utils/scrollToSection';

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    captureCampaign();
  }, [location.search]);
  useLayoutEffect(() => {
    const id = location.hash.replace(/^#/, '');
    const frame = requestAnimationFrame(() => {
      if (!id) {
        const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top: 0, behavior });
        return;
      }
      scrollToSection(id);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <AppRoutes />
    </>
  );
}
