type LogoProps = {
  className?: string;
  alt?: string;
  src?: string;
};

export function Logo({ className = 'h-14 w-auto', alt = '', src = '/logo.png' }: LogoProps) {
  return <img src={src} alt={alt} className={`object-contain ${className}`} />;
}
