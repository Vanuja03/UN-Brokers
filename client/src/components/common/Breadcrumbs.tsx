import { Link } from 'react-router-dom';

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.to ? <Link to={item.to} className="hover:text-navy-900">{item.label}</Link> : <span aria-current="page" className="font-medium text-navy-900">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
