import { useEffect, useRef, useState } from 'react';
import { Award, FileCheck, Users } from 'lucide-react';
import { Logo } from '../common/Logo';

const values = ['Professionalism', 'Trust', 'Commitment', 'Excellence'];

export const aboutSummary =
  'Established in 2011, UN Insurance Brokers (Pvt) Ltd is a registered insurance broking company in Sri Lanka, working in compliance with the Insurance Regulatory Commission of Sri Lanka.';

function Mark({ children }: { children: string }) {
  return <strong className="rounded-sm bg-gold/30 px-1 font-semibold text-navy-900">{children}</strong>;
}

export function AboutStory({ title, heading = 'h2' }: { title: string; heading?: 'h1' | 'h2' }) {
  const Title = heading;
  return (
    <div>
      <div className="max-w-none">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">About us</p>
        <Title className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</Title>
        <div className="mt-4 h-1 w-12 rounded-full bg-gold" />
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2" aria-label={values.join(', ')}>
          {values.map((value, index) => (
            <span key={value} className="inline-flex items-center gap-3">
              {index > 0 ? <span className="font-bold text-gold" aria-hidden="true">|</span> : null}
              <span className="rounded-md bg-gold px-2.5 py-1 text-sm font-bold uppercase tracking-[0.08em] text-navy-950">{value}</span>
            </span>
          ))}
        </p>
      </div>
      <div className="mt-10 space-y-5 text-base leading-7 text-slate-700">
        <p>
          Established in 2011, <Mark>UN Insurance Brokers (Pvt) Ltd</Mark> is a registered insurance broking company in Sri Lanka, committed to delivering professional, reliable, and customer-focused insurance solutions in compliance with the regulatory requirements of the <Mark>Insurance Regulatory Commission of Sri Lanka (IRCSL)</Mark>.
        </p>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <p>
            Under the leadership of our Managing Director / Principal Officer, Mr. Nandika Perera, who brings over 30 years of professional experience in the insurance industry, including management experience at Ceylinco General Insurance Company Ltd, we continue to strengthen our position through sustainable growth, sound management, and professional service.
          </p>
          <div className="flex items-center justify-center rounded-3xl bg-white p-8 shadow-card">
            <Logo alt="UN Insurance Brokers" className="h-40 w-auto sm:h-44" />
          </div>
        </div>
        <p>
          Our experienced team, including professionals with over 25 years of industry experience, serves a portfolio of more than 2,500 clients across diverse business sectors, providing comprehensive motor and non-motor insurance solutions. We take pride in our commitment to customer care, particularly in claims assistance, negotiation, and coordination with insurance companies to support our clients throughout the claims settlement process. <Mark>At UN Insurance Brokers,</Mark> we believe in building lasting relationships through integrity, transparency, and excellence. Our mission is to protect our clients’ interests, deliver value-added insurance services, and contribute to the continued development of Sri Lanka’s insurance industry.
        </p>
      </div>
      <AboutStats />
    </div>
  );
}

const stats = [
  { icon: Users, target: 2500, label: 'Clients' },
  { icon: FileCheck, target: 10000, label: 'Claims' },
  { icon: Award, target: 15, label: 'Years of experience' },
];

function AboutStats() {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setActive(true);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <ul ref={ref} className="mt-10 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} active={active} icon={stat.icon} target={stat.target} label={stat.label} />
      ))}
    </ul>
  );
}

function StatCard({
  active,
  icon: Icon,
  target,
  label,
}: {
  active: boolean;
  icon: typeof Users;
  target: number;
  label: string;
}) {
  const value = useCountUp(target, active);
  return (
    <li className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-card" aria-label={`${target.toLocaleString('en-US')}+ ${label}`}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-navy-800">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-navy-900" aria-hidden="true">
        {value.toLocaleString('en-US')}+
      </p>
      <p className="mt-1 text-sm text-slate-500" aria-hidden="true">{label}</p>
    </li>
  );
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const duration = 1600;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}
