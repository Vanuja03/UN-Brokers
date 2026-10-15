import { useEffect, useState } from 'react';
import { Seo } from '../components/common/Seo';
import { Container } from '../components/common/Container';
import { api } from '../services/api';
import type { TeamMember } from '../types';

export function TeamPage() {
  const [items, setItems] = useState<TeamMember[]>([]);
  useEffect(() => { api.get('/team').then((response) => setItems(response.data.data)).catch(() => setItems([])); }, []);
  return (
    <Container className="py-12">
      <Seo title="Our team" description="The people who review insurance quotation inquiries." path="/team" />
      <h1 className="text-4xl font-bold">Our team</h1>
      <p className="mt-3 max-w-2xl text-slate-600">Qualifications are shown only when the business has added them. Sample profiles are marked.</p>
      {items.length === 0 ? <p className="mt-8">Team profiles will appear here once they are added.</p> : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((member) => (
            <li key={member._id} className="rounded-2xl border border-slate-200 p-5">
              {member.imageUrl ? <img src={member.imageUrl} alt="" className="h-40 w-full rounded-xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 font-bold text-gold">{member.name.slice(0, 1)}</div>}
              <h2 className="mt-4 text-xl font-bold">{member.name}</h2>
              <p className="text-sm text-navy-700">{member.jobTitle}</p>
              {member.isDemo ? <p className="text-xs font-semibold uppercase text-amber-800">Sample profile</p> : null}
              <p className="mt-3 text-sm leading-6 text-slate-600">{member.biography}</p>
              {member.qualifications.length > 0 ? <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">{member.qualifications.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              {member.linkedinUrl ? <a className="mt-3 inline-block text-sm font-semibold underline" href={member.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
