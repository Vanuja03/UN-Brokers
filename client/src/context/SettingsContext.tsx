import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { fallbackSettings, type PublicSettings } from '../types';

type SettingsContextValue = {
  settings: PublicSettings;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await api.get('/settings/public');
      setSettings({ ...fallbackSettings, ...response.data.data });
    } catch {
      setSettings(fallbackSettings);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ settings, loading, refresh }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('Settings are unavailable.');
  return context;
}
