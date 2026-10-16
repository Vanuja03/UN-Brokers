export function scrollToSection(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const behavior: ScrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  node.scrollIntoView({ behavior, block: 'start' });
}
