import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { captureCampaign } from './utils/campaign';

function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    captureCampaign();
  }, [location.search]);
  useLayoutEffect(() => {
    if (location.hash) {
      document.querySelector(location.hash)?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
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
