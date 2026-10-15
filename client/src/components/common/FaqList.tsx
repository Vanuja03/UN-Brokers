import { useState } from 'react';

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-navy-900"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
              >
                {item.question}
                <span aria-hidden="true" className="text-xl text-navy-700">{expanded ? '−' : '+'}</span>
              </button>
            </h3>
            {expanded ? <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{item.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
