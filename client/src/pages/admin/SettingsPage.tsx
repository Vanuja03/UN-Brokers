import { FormEvent, useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Settings = {
  companyName: string;
  tagline: string;
  telephone: string;
  email: string;
  address: string;
  officeHours: string;
  whatsappNumber: string;
  defaultCurrency: string;
  businessTimezone: string;
  notificationEmail: string;
  aboutIntro: string;
  mission: string;
  vision: string;
  logoUrl: string;
  socialLinks?: { facebook?: string; instagram?: string; linkedin?: string; youtube?: string };
  values?: { title: string; description: string }[];
};

type Staff = { _id: string; name: string; email: string; role: string; active: boolean };

export function SettingsPage() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<{ _id: string; action: string; createdAt: string }[]>([]);

  function loadStaff() {
    api.get('/admin/staff').then((response) => setStaff(response.data.data));
  }

  useEffect(() => {
    if (admin?.role !== 'admin') return;
    api.get('/settings').then((response) => setSettings(response.data.data));
    loadStaff();
    api.get('/admin/audit').then((response) => setLogs(response.data.data)).catch(() => undefined);
  }, [admin?.role]);

  if (admin?.role !== 'admin') return <p>Only an administrator can change business settings.</p>;
  if (!settings) return <p>Loading settings…</p>;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await api.put('/settings', {
        ...settings,
        ...data,
        socialLinks: {
          facebook: data.facebook,
          instagram: data.instagram,
          linkedin: data.linkedin,
          youtube: data.youtube,
        },
        values: settings?.values || [],
      });
      setSettings(response.data.data);
      setMessage('Settings saved.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Could not save settings.'));
    }
  }

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api.post('/admin/staff', data);
      event.currentTarget.reset();
      setMessage('Staff account created.');
      loadStaff();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Could not create the account.'));
    }
  }

  async function toggle(person: Staff) {
    if (!window.confirm(`${person.active ? 'Deactivate' : 'Activate'} ${person.name}?`)) return;
    await api.patch(`/admin/staff/${person._id}`, { active: !person.active });
    loadStaff();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      {message ? <p className="text-sm">{message}</p> : null}
      <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-5 md:grid-cols-2">
        <h2 className="md:col-span-2 text-xl font-bold">Business details</h2>
        <input name="companyName" defaultValue={settings.companyName} className="field" required aria-label="Company name" />
        <input name="tagline" defaultValue={settings.tagline} className="field" aria-label="Tagline" />
        <input name="telephone" defaultValue={settings.telephone} className="field" aria-label="Telephone" />
        <input name="email" defaultValue={settings.email} className="field" aria-label="Public email" />
        <input name="notificationEmail" defaultValue={settings.notificationEmail} className="field" aria-label="Notification email" />
        <input name="whatsappNumber" defaultValue={settings.whatsappNumber} className="field" aria-label="WhatsApp number" />
        <input name="address" defaultValue={settings.address} className="field" aria-label="Address" />
        <input name="officeHours" defaultValue={settings.officeHours} className="field" aria-label="Office hours" />
        <input name="defaultCurrency" defaultValue={settings.defaultCurrency} className="field" maxLength={3} required aria-label="Currency" />
        <input name="businessTimezone" defaultValue={settings.businessTimezone} className="field" required aria-label="Timezone" />
        <input name="logoUrl" defaultValue={settings.logoUrl} className="field md:col-span-2" placeholder="https:// logo" aria-label="Logo URL" />
        <input name="facebook" defaultValue={settings.socialLinks?.facebook} className="field" placeholder="https:// facebook" aria-label="Facebook" />
        <input name="instagram" defaultValue={settings.socialLinks?.instagram} className="field" placeholder="https:// instagram" aria-label="Instagram" />
        <input name="linkedin" defaultValue={settings.socialLinks?.linkedin} className="field" placeholder="https:// linkedin" aria-label="LinkedIn" />
        <input name="youtube" defaultValue={settings.socialLinks?.youtube} className="field" placeholder="https:// youtube" aria-label="YouTube" />
        <textarea name="aboutIntro" defaultValue={settings.aboutIntro} className="field md:col-span-2" rows={4} aria-label="About introduction" />
        <textarea name="mission" defaultValue={settings.mission} className="field" rows={3} aria-label="Mission" />
        <textarea name="vision" defaultValue={settings.vision} className="field" rows={3} aria-label="Vision" />
        <button className="w-fit rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Save settings</button>
      </form>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="text-xl font-bold">Staff access</h2>
        <form onSubmit={createStaff} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Full name" className="field" />
          <input name="email" type="email" required placeholder="Email" className="field" />
          <input name="password" type="password" required minLength={10} placeholder="Temporary password" className="field" />
          <select name="role" className="field" defaultValue="staff"><option value="staff">Staff</option><option value="admin">Administrator</option></select>
          <button className="w-fit rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy-950" type="submit">Create account</button>
        </form>
        <ul className="mt-4 divide-y">
          {staff.map((person) => (
            <li key={person._id} className="flex items-center justify-between py-3 text-sm">
              <span>{person.name} · {person.email} · {person.role}</span>
              <button type="button" className="font-semibold" onClick={() => void toggle(person)}>{person.active ? 'Deactivate' : 'Activate'}</button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-white p-5">
        <h2 className="text-xl font-bold">Recent staff activity</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {logs.slice(0, 12).map((log) => <li key={log._id}>{new Date(log.createdAt).toLocaleString()} · {log.action}</li>)}
        </ul>
      </section>
    </div>
  );
}
