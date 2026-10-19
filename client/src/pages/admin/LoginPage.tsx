import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { admin, setAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && admin) return <Navigate to="/admin/dashboard" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await api.post('/auth/login', {
        email: data.get('email'),
        password: data.get('password'),
      });
      setAdmin(response.data.data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Sign-in failed.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-navy-950 px-4 py-8">
      <form onSubmit={onSubmit} className="m-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-card">
        <Logo alt="UN Insurance Brokers" className="mx-auto h-24 w-auto" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">Staff</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Accounts are created by an administrator. There is no public registration.</p>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <label className="mt-5 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field mt-1" />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <div className="relative mt-1">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="field pr-11" />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-navy-900"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        <button type="submit" disabled={pending} className="mt-6 w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold text-navy-950 disabled:opacity-60">{pending ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
