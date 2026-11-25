import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../lib/format';
import { prefersReducedMotion } from '../lib/motion';

// Counts up once from zero to the real value. No animation under reduced motion.
export function Counter({ value, lang }: { value: number; lang: string }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));
  const done = useRef(false);

  useEffect(() => {
    if (done.current || prefersReducedMotion() || value === 0) {
      setShown(value);
      return;
    }
    done.current = true;
    const start = performance.now();
    const duration = 550; // every animation on the site stays under 600 ms
    let frame = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(value * eased));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatNumber(shown, lang)}</>;
}
