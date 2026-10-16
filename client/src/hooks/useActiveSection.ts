import { useEffect, useState } from 'react';
import { observedSectionIds } from '../content/pageSections';

const headerOffset = 128;

export function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState('');

  useEffect(() => {
    if (!enabled) {
      setActive('');
      return;
    }

    const elements = observedSectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    function update() {
      const header = document.querySelector('header');
      const line = (header?.getBoundingClientRect().bottom ?? headerOffset) + 120;
      const ordered = observedSectionIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null)
        .sort((a, b) => a.offsetTop - b.offsetTop);
      let current = ordered[0]?.id ?? '';
      for (const element of ordered) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }
      if (current) setActive(current);
    }

    const observer = new IntersectionObserver(update, {
      root: null,
      rootMargin: `-${headerOffset}px 0px -40% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });
    elements.forEach((element) => observer.observe(element));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scrollend', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('scrollend', update);
    };
  }, [enabled]);

  return active;
}
