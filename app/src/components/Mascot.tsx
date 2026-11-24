import { useEffect, useRef } from 'react';
import svg from '../assets/mascot.svg?raw';

// The mascot is decorative. Its antennae sway slowly; the legs ripple once
// when a screen opens (and again whenever "rippleKey" changes).
// To use another drawing, replace src/assets/mascot.svg. Keep the antennae in
// <g class="antennae"> and the legs in <g class="legs">, one <path> per leg.
export function Mascot({ className = '', rippleKey = 0 }: { className?: string; rippleKey?: number | string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('ripple');
    void el.offsetWidth; // restart the animation
    el.classList.add('ripple');
    const id = window.setTimeout(() => el.classList.remove('ripple'), 1000);
    return () => window.clearTimeout(id);
  }, [rippleKey]);

  return <div ref={ref} className={`mascot ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
