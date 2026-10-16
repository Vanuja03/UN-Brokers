import { Link, useLocation, useNavigate } from 'react-router-dom';
import { scrollToSection } from '../../utils/scrollToSection';

type SectionLinkProps = {
  section: string;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  search?: string;
  current?: boolean;
};

export function SectionLink({ section, className, children, onNavigate, search = '', current = false }: SectionLinkProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Link
      to={{ pathname: '/', hash: section, search }}
      className={className}
      aria-current={current ? 'true' : undefined}
      onClick={(event) => {
        onNavigate?.();
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (location.pathname !== '/') return;
        event.preventDefault();
        navigate({ pathname: '/', hash: section, search }, { preventScrollReset: true });
        if (location.hash === `#${section}`) scrollToSection(section);
      }}
    >
      {children}
    </Link>
  );
}
