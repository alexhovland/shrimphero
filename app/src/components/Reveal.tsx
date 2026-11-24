import { useEffect, useRef, type ReactNode } from 'react';

// Fades a section in once when it scrolls into view. The "motion" class on
// <html> turns the effect on; without it (reduced motion) nothing is hidden.
export function Reveal({ children, className = '', as: Tag = 'section', ...rest }: {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
  'aria-labelledby'?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
