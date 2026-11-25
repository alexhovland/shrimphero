import { prefersReducedMotion } from './motion';

// Shows a section of the current page: scrolls it to the top of the screen and
// moves keyboard and screen reader focus to its heading (the heading needs tabIndex={-1}).
// Content that loads later (numbers, ranking rows) can push the section down or make
// room to scroll further. Until the visitor scrolls, taps or types (or 10 seconds pass),
// the section is put back at the top whenever the page layout changes.
// Returns a function that stops following.
export function showSection(id: string, focusHeading = true): () => void {
  const el = document.getElementById(id);
  if (!el) return () => {};
  const smooth = !prefersReducedMotion();
  // The section's top edge once scrolled into place (its scroll-margin-top).
  const target = () => parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const align = (behavior: ScrollBehavior) => el.scrollIntoView({ block: 'start', behavior });

  align(smooth ? 'smooth' : 'auto');
  if (focusHeading) el.querySelector<HTMLElement>('h2[tabindex="-1"], h1[tabindex="-1"]')?.focus({ preventScroll: true });

  let stopped = false;
  const ro = new ResizeObserver(() => {
    if (stopped) return;
    if (Math.abs(el.getBoundingClientRect().top - target()) > 2) align('auto');
  });
  ro.observe(document.body);
  const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    ro.disconnect();
    events.forEach((e) => window.removeEventListener(e, stop, true));
    window.clearTimeout(timer);
  };
  events.forEach((e) => window.addEventListener(e, stop, { capture: true, passive: true }));
  const timer = window.setTimeout(stop, 10_000);
  return stop;
}
