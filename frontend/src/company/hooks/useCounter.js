import { useEffect, useRef, useState } from 'react';

export function useCounter(target, duration = 1800, inView = true) {
  const numericTarget = Number(target) || 0;
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!inView) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || duration <= 0) {
      setValue(numericTarget);
      return undefined;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * numericTarget));
      if (progress < 1) rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [duration, inView, numericTarget]);

  return value;
}

