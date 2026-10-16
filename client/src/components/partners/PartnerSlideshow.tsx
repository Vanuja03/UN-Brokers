import { useEffect, useState } from 'react';
import { insurerPartners } from '../../content/insurerPartners';

const captions = {
  partners: 'List of leading insurers that have partnered with us to make insurance simplified.',
  collaborators: 'Collaborator logos will appear here once they are published.',
};

const gap = 20;

export function PartnerSlideshow() {
  const [group, setGroup] = useState<'partners' | 'collaborators'>('partners');
  const [position, setPosition] = useState(insurerPartners.length);
  const [motionOn, setMotionOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const items = group === 'partners' ? insurerPartners : [];
  const count = items.length;
  const active = count === 0 ? 0 : ((position % count) + count) % count;
  const track = [0, 1, 2].flatMap((copy) => items.map((item) => ({ ...item, copy })));

  useEffect(() => {
    if (count === 0) return;
    if (position >= count && position < count * 2) return;
    const timer = window.setTimeout(() => {
      setMotionOn(false);
      setPosition(count + (((position % count) + count) % count));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [count, position]);

  useEffect(() => {
    if (motionOn) return;
    const frame = window.requestAnimationFrame(() => setMotionOn(true));
    return () => window.cancelAnimationFrame(frame);
  }, [motionOn]);

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setPosition((current) => current + 1);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [paused, count, group]);

  function choose(next: 'partners' | 'collaborators') {
    setGroup(next);
    setMotionOn(false);
    setPosition(next === 'partners' ? insurerPartners.length : 0);
  }

  return (
    <div>
      <div className="flex justify-center gap-7" role="tablist" aria-label="Logo groups">
        {(['partners', 'collaborators'] as const).map((key) => {
          const selected = group === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`border-b-2 pb-2 text-lg font-semibold ${selected ? 'border-navy-900 text-navy-900' : 'border-transparent text-navy-700'}`}
              onClick={() => choose(key)}
            >
              {key === 'partners' ? 'Partners' : 'Collaborators'}
            </button>
          );
        })}
      </div>
      <p className="mx-auto mt-6 max-w-xl text-center text-base leading-7 text-slate-600">{captions[group]}</p>
      {items.length === 0 ? null : (
        <div
          className="partner-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="partner-frame mt-8 py-1">
            <ul
              className={`flex items-center ${motionOn ? 'motion-safe:transition-transform motion-safe:duration-700' : ''}`}
              style={{ gap, transform: `translateX(calc((1 - ${position}) * (var(--partner-card-w) + var(--partner-gap))))` }}
            >
              {track.map((item, trackIndex) => (
                <li
                  key={`${item.copy}-${item.name}`}
                  className={`partner-card flex shrink-0 items-center justify-center bg-white ${trackIndex === position ? 'is-center' : ''}`}
                >
                  <a href={item.website} target="_blank" rel="noreferrer" aria-label={item.name} className="flex h-full w-full items-center justify-center px-4 sm:px-6">
                    <img src={item.logo} alt="" className="max-h-20 w-full object-contain" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Slideshow pages">
            {items.map((item, page) => (
              <button
                key={item.name}
                type="button"
                aria-label={`Show ${item.name}`}
                aria-current={page === active ? 'true' : undefined}
                className={`h-2.5 w-2.5 rounded-full ${page === active ? 'bg-[#2f6fed]' : 'bg-[#b7c7d8]'}`}
                onClick={() => {
                  setMotionOn(true);
                  setPosition(count + page);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
