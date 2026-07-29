import { useEffect } from 'react';

const SELECTOR = '.reveal, .reveal-left, .reveal-right, .rv, .rv-l, .rv-r, .rv-s, .rv-up';

export function useScrollReveal(deps = []) {
  useEffect(() => {
    const targets = [...document.querySelectorAll(SELECTOR)];
    if (!targets.length) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((element) => {
        element.classList.add('visible');
        element.classList.add('vis');
      });
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          entry.target.classList.add('vis');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' },
    );

    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}




