import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '../common/Button';
import { useSettings } from '../../context/SettingsContext';

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollCoverScene() {
  const { settings } = useSettings();
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      const node = sectionRef.current;
      if (!node) return;
      const total = node.offsetHeight - window.innerHeight;
      const scrolled = clamp(-node.getBoundingClientRect().top, 0, Math.max(total, 0));
      setProgress(total > 0 ? scrolled / total : 0);
    };
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  const drive = clamp(progress / 0.58);
  const impact = progress > 0.48 && progress < 0.7 ? Math.sin(clamp((progress - 0.48) / 0.22) * Math.PI) : 0;
  const call = clamp((progress - 0.58) / 0.3);
  const eclipseShift = 70 - clamp(progress / 0.85) * 120;
  const caption = call > 0.45 ? 'Then you call for guidance.' : drive > 0.72 ? 'An incident can happen in a moment.' : 'The road is moving. So is the cover you may need.';
  const phoneHref = settings.telephone ? `tel:${settings.telephone}` : '/#contact';

  return (
    <section ref={sectionRef} className={reduced ? 'bg-navy-950 text-white' : 'relative h-[230vh] bg-navy-950 text-white'} aria-label="A scroll scene of a car incident followed by a call for insurance guidance">
      <p className="sr-only">Scrolling shows a car approaching an incident, then a prompt to call UN Insurance Brokers. A call does not start a policy or approve a claim.</p>
      <div className={`${reduced ? 'relative min-h-[32rem]' : 'sticky top-0 h-dvh'} overflow-hidden`}>
        <div
          className="pointer-events-none absolute -right-16 top-[-8%] h-[28rem] w-[28rem] rounded-full bg-gold/90 blur-[1px] sm:h-[36rem] sm:w-[36rem]"
          style={reduced ? undefined : { transform: `translate3d(${eclipseShift * 0.15}px, 0, 0)` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-8 top-[-4%] h-[26rem] w-[26rem] rounded-full bg-navy-950 sm:h-[34rem] sm:w-[34rem]"
          style={reduced ? { transform: 'translate3d(-2.5rem, 0.5rem, 0)' } : { transform: `translate3d(${eclipseShift}px, 12px, 0)` }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/20 via-transparent to-navy-950" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-center px-4 pb-8 pt-24 sm:px-8" style={reduced ? undefined : { opacity: 1 - call }}>
          <p className="max-w-xl font-heading text-3xl font-bold leading-tight sm:text-5xl">{caption}</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">UN Insurance Brokers can help you ask about motor cover and what to do after an incident. Cover is not automatic.</p>

          <div className="relative mt-10 h-48 sm:h-56" aria-hidden="true">
            <div className="absolute inset-x-0 bottom-8 h-px bg-white/20" />
            <div
              className="absolute bottom-8 left-0 right-0 h-px"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #FFB900 0 18px, transparent 18px 36px)',
                transform: reduced ? undefined : `translateX(${-drive * 80}px)`,
              }}
            />
            <div className="absolute bottom-6 right-[8%] h-16 w-3 rounded-sm bg-gold sm:right-[14%]" />
            <div className="absolute bottom-10 right-[6%] h-2 w-14 rounded-full bg-white/80 sm:right-[12%]" />
            <div
              className="absolute bottom-8 w-40 sm:w-52"
              style={{
                left: reduced ? '42%' : `${4 + drive * 68}%`,
                transform: `translateY(${impact * -6}px)`,
                opacity: 1 - call,
              }}
            >
              <Car />
            </div>
            <div
              className="pointer-events-none absolute bottom-10 right-[18%] h-24 w-24 rounded-full bg-gold/70 blur-md"
              style={{ opacity: impact * 0.9 }}
            />
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-0 top-24 flex items-end justify-center px-4 pb-16 sm:items-center sm:pb-0"
          style={{ opacity: reduced ? 1 : call, transform: reduced ? undefined : `translateY(${(1 - call) * 28}px)`, pointerEvents: reduced || call > 0.4 ? 'auto' : 'none' }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-navy-900/90 p-6 text-center shadow-card backdrop-blur">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy-950">
              <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-gold/40" />
              <Phone className="relative h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold">Call for guidance</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Tell the team what happened. They can explain the next step. A call does not approve a claim.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button href={phoneHref} variant="gold">{settings.telephone ? 'Call the team' : 'Contact the team'}</Button>
              <Button to="/#get-a-quote" variant="outline">Request a quote</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 220 80" className="h-auto w-full" role="img" aria-label="">
      <path d="M18 52h150c8 0 12-6 14-12l10-4c6-2 12 2 12 8v8H18c-6 0-10-4-10-8s4-8 10-8z" fill="#f4f7fb" />
      <path d="M48 28h62l18 20H40z" fill="#0b2545" />
      <path d="M58 32h22l6 12H54z" fill="#9ec5e8" />
      <path d="M86 32h20l8 12h-24z" fill="#d7e8f6" />
      <path d="M168 40h18l8 8h-22z" fill="#FFB900" />
      <circle cx="58" cy="58" r="12" fill="#0b2545" />
      <circle cx="58" cy="58" r="5" fill="#FFB900" />
      <circle cx="150" cy="58" r="12" fill="#0b2545" />
      <circle cx="150" cy="58" r="5" fill="#FFB900" />
    </svg>
  );
}
