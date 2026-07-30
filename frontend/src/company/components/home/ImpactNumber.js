import React, { useEffect, useRef, useState } from 'react';
import { useCounter } from '../../hooks/useCounter';

function ImpactNumber({ number, suffix = '', label }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const animated = useCounter(number, 1600, inView);

  return (
    <div className="impact__item" ref={ref} aria-label={`${number}${suffix} ${label}`}>
      <div className="impact__number notranslate" aria-hidden="true">
        <em>{animated}{suffix}</em>
      </div>
      <div className="impact__label" aria-hidden="true">{label}</div>
    </div>
  );
}

export default ImpactNumber;
