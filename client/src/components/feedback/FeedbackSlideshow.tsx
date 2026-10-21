import { useEffect, useState } from 'react';
import { customerFeedback } from '../../content/customerFeedback';
import { SectionHeading } from '../common/SectionHeading';
import { FeedbackCard } from './FeedbackCard';

const gap = 24;

export function FeedbackSlideshow() {
  const [position, setPosition] = useState(customerFeedback.length);
  const [motionOn, setMotionOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [openName, setOpenName] = useState<string | null>(null);
  const count = customerFeedback.length;
  const active = count === 0 ? 0 : ((position % count) + count) % count;
  const track = [0, 1, 2].flatMap((copy) => customerFeedback.map((item) => ({ ...item, copy })));

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
    if (paused || openName || count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setPosition((current) => current + 1);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [paused, openName, count]);

  return (
    <div>
      <SectionHeading eyebrow="Feedback" title="What customers say" text="Comments from businesses that arrange their insurance with UN Insurance Brokers." />
      <div
        className="feedback-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="feedback-frame mt-10 py-3">
          <ul
            className={`flex items-stretch ${motionOn ? 'motion-safe:transition-transform motion-safe:duration-700' : ''}`}
            style={{ gap, transform: `translateX(calc(${-position} * (var(--feedback-card-w) + var(--feedback-gap))))` }}
          >
            {track.map((item) => (
              <li key={`${item.copy}-${item.name}`} className="feedback-card shrink-0">
                <FeedbackCard
                  item={item}
                  expanded={openName === item.name}
                  onToggle={() => setOpenName((current) => (current === item.name ? null : item.name))}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Feedback pages">
          {customerFeedback.map((item, page) => (
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
    </div>
  );
}
