export function SectionHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-700">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h2>
      <div className="mt-4 h-1 w-12 rounded-full bg-gold" />
      {text ? <p className="mt-4 text-base leading-7 text-slate-600">{text}</p> : null}
    </div>
  );
}
