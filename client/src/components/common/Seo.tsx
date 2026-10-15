import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(name: string, content: string, attribute: 'name' | 'property') {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function Seo({ title, description, path, jsonLd }: SeoProps) {
  const serialized = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const site = import.meta.env.VITE_SITE_URL || window.location.origin;
    const url = new URL(path, site.endsWith('/') ? site : `${site}/`).toString();
    document.title = title;
    upsertMeta('description', description, 'name');
    upsertMeta('og:title', title, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:url', url, 'property');
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    const existing = document.getElementById('structured-data');
    if (serialized) {
      const script = existing ?? document.createElement('script');
      script.id = 'structured-data';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = serialized;
      if (!existing) document.head.appendChild(script);
    } else {
      existing?.remove();
    }
  }, [title, description, path, serialized]);
  return null;
}

export function siteUrl(path: string) {
  const site = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!site) return path;
  return new URL(path, site.endsWith('/') ? site : `${site}/`).toString();
}
