import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { AdminProfile } from '../types';

type AuthContextValue = {
  admin: AdminProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setAdmin: (admin: AdminProfile | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await api.get('/auth/me');
      setAdmin(response.data.data);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ admin, loading, refresh, setAdmin }), [admin, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Authentication is unavailable.');
  return context;
}
