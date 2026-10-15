import { useState } from 'react';

export function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return <img src={src} alt={alt} className={className} onError={() => setHidden(true)} />;
}
