import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Account = { _id: string; name: string; email: string; role: 'admin' | 'staff'; active: boolean };

function roleLabel(role: Account['role']) {
  return role === 'admin' ? 'Administrator' : 'Staff';
}

export function UsersPage() {
  const { admin } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function load() {
    return api.get('/admin/staff').then((response) => setAccounts(response.data.data));
  }

  useEffect(() => {
    if (admin?.role !== 'admin') return;
    load().catch(() => setError('Accounts could not be loaded.'));
  }, [admin?.role]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setError('');
    setMessage('');
    try {
      await api.post('/admin/staff', data);
      event.currentTarget.reset();
      setShowPassword(false);
      setMessage('Account created. They can sign in with that email and password.');
      await load();
    } catch (createError) {
      setError(getErrorMessage(createError, 'Could not create the account.'));
    }
  }

  async function toggle(person: Account) {
    const next = person.active ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${next} ${person.name}?`)) return;
    setError('');
    setMessage('');
    try {
      await api.patch(`/admin/staff/${person._id}`, { active: !person.active });
      setMessage(person.active ? 'Account deactivated.' : 'Account activated.');
      await load();
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, 'The account could not be updated.'));
    }
  }

  if (admin?.role !== 'admin') return <p>Only an administrator can add users.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Create a login for someone on the team. Staff can work on quotations, policies, and messages. An administrator can also open Settings and add more users.</p>
      </div>
      {message ? <p className="text-sm text-navy-900">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <form onSubmit={(event) => void createAccount(event)} className="grid gap-3 rounded-2xl bg-white p-5 md:grid-cols-2">
        <h2 className="md:col-span-2 text-xl font-bold">New user</h2>
        <label className="text-sm font-medium text-navy-900">Full name
          <input name="name" required minLength={2} className="field mt-1.5" />
        </label>
        <label className="text-sm font-medium text-navy-900">Email
          <input name="email" type="email" required className="field mt-1.5" />
        </label>
        <div className="text-sm font-medium text-navy-900">
          <label htmlFor="new-user-password">Password</label>
          <div className="relative mt-1.5">
            <input id="new-user-password" name="password" type={showPassword ? 'text' : 'password'} required minLength={10} className="field pr-11" autoComplete="new-password" />
            <button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-navy-900" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
          <span className="mt-1 block text-xs font-normal text-slate-600">At least 10 characters, with one letter and one number.</span>
        </div>
        <label className="text-sm font-medium text-navy-900">Role
          <select name="role" className="field mt-1.5" defaultValue="staff">
            <option value="staff">Staff</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <button className="w-fit rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950" type="submit">Create account</button>
      </form>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="text-xl font-bold">Accounts</h2>
        <ul className="mt-4 divide-y">
          {accounts.map((person) => (
            <li key={person._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>{person.name} · {person.email} · {roleLabel(person.role)} · {person.active ? 'Active' : 'Inactive'}</span>
              <button type="button" className="font-semibold text-navy-900 underline" onClick={() => void toggle(person)}>{person.active ? 'Deactivate' : 'Activate'}</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
