import { Link } from 'react-router-dom';

type ButtonProps = {
  children: React.ReactNode;
  to?: string;
  href?: string;
  variant?: 'primary' | 'gold' | 'outline' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
};

const variants = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800',
  gold: 'bg-gold text-navy-950 hover:bg-gold-dark',
  outline: 'border border-white/40 bg-white/10 text-white hover:bg-white/20',
  ghost: 'border border-navy-900/15 bg-white text-navy-900 hover:border-navy-900/40',
};

export function Button({ children, to, href, variant = 'primary', className = '', type = 'button', disabled, onClick }: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
  if (to) return <Link to={to} className={classes}>{children}</Link>;
  if (href) return <a href={href} className={classes}>{children}</a>;
  return <button type={type} className={classes} disabled={disabled} onClick={onClick}>{children}</button>;
}
