import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '../common/Button';
import { Container } from '../common/Container';
import { SectionHeading } from '../common/SectionHeading';
import { useSettings } from '../../context/SettingsContext';

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollCoverScene() {
  const { settings } = useSettings();
  const trackRef = useRef<HTMLDivElement>(null);
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
      const node = trackRef.current;
      if (!node) return;
      const panel = node.firstElementChild instanceof HTMLElement ? node.firstElementChild.offsetHeight : 0;
      const total = Math.max(node.offsetHeight - panel, 1);
      const scrolled = clamp(128 - node.getBoundingClientRect().top, 0, total);
      setProgress(scrolled / total);
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

  const drive = clamp(progress / 0.62);
  const impact = progress > 0.5 && progress < 0.78 ? Math.sin(clamp((progress - 0.5) / 0.28) * Math.PI) : 0;
  const call = clamp((progress - 0.76) / 0.24);
  const phoneHref = settings.telephone ? `tel:${settings.telephone}` : '/#contact';

  return (
    <section className="section-anchor bg-navy-50 py-16 text-navy-900" aria-label="A car drives into a tree, then a call for insurance guidance">
      <p className="sr-only">Scrolling shows a car meeting a tree, then a prompt to call UN Insurance Brokers. A call does not start a policy or approve a claim.</p>
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              eyebrow="On the road"
              title="An incident can happen in a moment"
              text="Motor cover is one of the conversations we have most often. If a car meets a tree, the next step is to call and ask what to do. Cover is not automatic, and a call does not approve a claim."
            />
          </div>

          <div ref={trackRef} className={reduced ? '' : 'h-[150vh]'}>
            <div className={`${reduced ? '' : 'sticky top-32'} overflow-hidden rounded-3xl bg-navy-950 text-white shadow-card`}>
              <div className="relative h-[26rem] sm:h-[28rem]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,185,0,0.16),transparent_42%)]" aria-hidden="true" />
                <p className="absolute left-6 top-6 max-w-xs text-sm font-semibold text-gold">
                  {call > 0.45 ? 'Then you call for guidance.' : drive > 0.92 ? 'The car meets the tree.' : 'The car is still on the road.'}
                </p>

                <div className="absolute inset-x-0 bottom-0 h-52" aria-hidden="true" style={{ opacity: 1 - call * 0.35 }}>
                  <div className="absolute inset-x-0 bottom-16 h-16 bg-gradient-to-t from-navy-900 to-transparent" />
                  <div className="absolute inset-x-6 bottom-16 h-px bg-white/25" />
                  <div
                    className="absolute inset-x-6 bottom-16 h-px"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, #FFB900 0 16px, transparent 16px 32px)',
                      transform: reduced ? undefined : `translateX(${-drive * 48}px)`,
                    }}
                  />
                  <div
                    className="absolute bottom-16 right-[8%] w-24 sm:right-[12%] sm:w-28"
                    style={{ transform: `rotate(${impact * 7}deg)`, transformOrigin: '50% 100%' }}
                  >
                    <Tree />
                  </div>
                  <div
                    className="absolute bottom-16 w-36 sm:w-44"
                    style={{
                      left: reduced ? '42%' : `${2 + drive * 46}%`,
                      transform: `translateY(${impact * -3}px) rotate(${impact * -5}deg)`,
                      transformOrigin: '70% 80%',
                    }}
                  >
                    <Car />
                  </div>
                  <Leaf style={{ left: '72%', opacity: impact, transform: `translate(${impact * 18}px, ${-impact * 36}px)` }} />
                  <Leaf style={{ left: '78%', opacity: impact * 0.8, transform: `translate(${impact * -10}px, ${-impact * 28}px)` }} />
                  <div
                    className="pointer-events-none absolute bottom-16 right-[18%] h-20 w-20 rounded-full bg-gold/50 blur-md"
                    style={{ opacity: impact * 0.75 }}
                  />
                </div>

                <div
                  className="absolute inset-0 flex items-end justify-center px-5 pb-8 sm:items-center sm:pb-0"
                  style={{ opacity: reduced ? 1 : call, transform: reduced ? undefined : `translateY(${(1 - call) * 16}px)`, pointerEvents: reduced || call > 0.45 ? 'auto' : 'none' }}
                >
                  <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900/95 p-5 text-center">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy-950">
                      <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-gold/40" />
                      <Phone className="relative h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 font-heading text-xl font-bold">Call for guidance</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Tell the team what happened. They can explain the next step.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <Button href={phoneHref} variant="gold">{settings.telephone ? 'Call the team' : 'Contact the team'}</Button>
                      <Button to="/#get-a-quote" variant="outline">Request a quote</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Leaf({ style }: { style: CSSProperties }) {
  return <span className="absolute bottom-28 h-2.5 w-2.5 rounded-full bg-gold" style={style} />;
}

function Tree() {
  return (
    <svg viewBox="0 0 120 170" className="h-auto w-full">
      <rect x="52" y="92" width="16" height="68" rx="5" fill="#6b4423" />
      <circle cx="60" cy="62" r="38" fill="#1c6b43" />
      <circle cx="34" cy="84" r="26" fill="#145536" />
      <circle cx="88" cy="82" r="28" fill="#228055" />
      <circle cx="46" cy="48" r="9" fill="#FFB900" />
    </svg>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 200 72" className="h-auto w-full">
      <path d="M14 44h28l14-18h64l18 18h48c6 0 10 4 10 10v4H14c-6 0-10-4-10-10s4-4 10-4z" fill="#f4f7fb" />
      <path d="M58 28h58l16 16H50z" fill="#0b2545" />
      <path d="M64 32h22l6 10H60z" fill="#c5ddf0" />
      <path d="M90 32h22l8 10H94z" fill="#e8f3fb" />
      <rect x="168" y="44" width="16" height="7" rx="2" fill="#FFB900" />
      <circle cx="52" cy="58" r="10" fill="#0b2545" />
      <circle cx="52" cy="58" r="4" fill="#FFB900" />
      <circle cx="148" cy="58" r="10" fill="#0b2545" />
      <circle cx="148" cy="58" r="4" fill="#FFB900" />
    </svg>
  );
}
