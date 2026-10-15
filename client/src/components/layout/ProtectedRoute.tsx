import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute() {
  const { admin, loading } = useAuth();
  if (loading) return <p className="p-8 text-sm text-slate-600">Checking your session…</p>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
