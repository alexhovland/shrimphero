import { useEffect, useRef } from 'react';
import svg from '../assets/mascot.svg?raw';

// The mascot is decorative (hidden from screen readers). Its legs ripple once when
// a screen opens (and again whenever "rippleKey" changes). It hops once, with a
// wiggle of the antennae, when "hopKey" is set or changes, and on every tap when
// "tappable" is set. All motion is short, runs once, and only with the "motion"
// class on <html> (see styles.css), so reduced motion shows a still shrimp.
// To use another drawing, replace src/assets/mascot.svg. Keep the antennae in
// <g class="antennae"> and the legs in <g class="legs">, one <path> per leg.
export function Mascot({ className = '', rippleKey = 0, hopKey, tappable = false }: {
  className?: string;
  rippleKey?: number | string;
  hopKey?: number | string;
  tappable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<Record<string, number>>({});

  // Plays a one-off animation class again from the start.
  const play = (cls: string, ms: number) => {
    const el = ref.current;
    if (!el) return;
    window.clearTimeout(timers.current[cls]);
    el.classList.remove(cls);
    void el.offsetWidth; // restart the animation
    el.classList.add(cls);
    timers.current[cls] = window.setTimeout(() => el.classList.remove(cls), ms);
  };

  useEffect(() => play('ripple', 600), [rippleKey]);
  useEffect(() => {
    if (hopKey !== undefined) play('hop', 400);
  }, [hopKey]);
  useEffect(() => () => Object.values(timers.current).forEach((id) => window.clearTimeout(id)), []);

  return (
    <div
      ref={ref}
      className={`mascot${tappable ? ' mascot--tap' : ''} ${className}`}
      aria-hidden="true"
      onPointerDown={tappable ? () => play('hop', 400) : undefined}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
