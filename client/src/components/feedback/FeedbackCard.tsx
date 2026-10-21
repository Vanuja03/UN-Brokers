import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { CustomerFeedback } from '../../content/customerFeedback';

function StarMark({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="relative inline-block h-4 w-4" aria-hidden="true">
      <Star className="h-4 w-4 text-slate-300" />
      {fill > 0 ? (
        <span className="absolute inset-0 overflow-hidden" style={{ width: fill === 1 ? '100%' : '50%' }}>
          <Star className="h-4 w-4 fill-[#FFB900] text-[#FFB900]" />
        </span>
      ) : null}
    </span>
  );
}

export function FeedbackStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${rating} out of 5`}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill: 0 | 0.5 | 1 = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;
          return <StarMark key={star} fill={fill} />;
        })}
      </span>
      <span className="text-sm font-semibold text-navy-900">{rating.toFixed(1)}</span>
    </div>
  );
}

export function FeedbackCard({
  item,
  expanded,
  onToggle,
}: {
  item: CustomerFeedback;
  expanded: boolean;
  onToggle: () => void;
}) {
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const node = messageRef.current;
    if (!node || expanded) return;
    const measure = () => setOverflows(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, item.message]);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-navy-900">{item.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{item.designation}</p>
      <div className="mt-3">
        <FeedbackStars rating={item.rating} />
      </div>
      <p ref={messageRef} className={`mt-3 text-sm leading-6 text-slate-700 ${expanded ? '' : 'line-clamp-4'}`}>
        {item.message}
      </p>
      {overflows || expanded ? (
        <button type="button" className="mt-3 self-start text-sm font-semibold text-navy-900 underline" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </article>
  );
}
