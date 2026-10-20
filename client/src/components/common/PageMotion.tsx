import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AOS from 'aos';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let started = false;

export function initAos() {
  if (started) return;
  started = true;
  AOS.init({
    duration: 650,
    easing: 'ease-out-cubic',
    once: true,
    offset: 48,
    disable: prefersReducedMotion,
  });
}

function assign(element: HTMLElement, animation: string, delay: number) {
  if (element.dataset.aos) return;
  element.dataset.aos = animation;
  element.dataset.aosDuration = '650';
  element.dataset.aosOnce = 'true';
  if (delay > 0) element.dataset.aosDelay = String(delay);
}

function decorate(root: HTMLElement) {
  if (prefersReducedMotion()) return;
  const blocks = [...root.children].filter((node): node is HTMLElement => node instanceof HTMLElement);
  blocks.forEach((block) => {
    if (block.id === 'home') return;
    assign(block, 'fade-up', 0);
    block.querySelectorAll('ul.grid > li, ol.grid > li, .grid > article, .grid > a').forEach((card, index) => {
      if (card instanceof HTMLElement) assign(card, 'fade-up', Math.min(index, 5) * 70);
    });
  });
}

export function PageMotion({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    initAos();
    decorate(node);
    AOS.refreshHard();
    const observer = new MutationObserver(() => {
      decorate(node);
      AOS.refreshHard();
    });
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname]);

  return (
    <div ref={ref} key={location.pathname}>
      {children}
    </div>
  );
}
