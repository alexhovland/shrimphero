import type { PointerEvent } from 'react';
import { useI18n } from '../i18n';
import { href, pageOf, type Route } from '../lib/router';
import { NAV } from './nav';

// A tiny press on the tapped tab's icon. The animation only runs with the "motion"
// class on <html> (see styles.css), so reduced motion shows nothing.
function press(e: PointerEvent<HTMLAnchorElement>) {
  const a = e.currentTarget;
  a.classList.remove('press');
  void a.offsetWidth; // restart the animation on a second tap
  a.classList.add('press');
}

export function TabBar({ route }: { route: Route }) {
  const { t } = useI18n();
  return (
    <nav className="tabbar" aria-label={t('nav.menu')}>
      {NAV.map(({ route: r, label, short, Icon }) => (
        <a
          key={r}
          href={href(r)}
          aria-current={pageOf(route) === r ? 'page' : undefined}
          aria-label={short ? t(label) : undefined}
          onPointerDown={press}
          onAnimationEnd={(e) => e.currentTarget.classList.remove('press')}
        >
          <Icon />
          <span>{t(short ?? label)}</span>
        </a>
      ))}
    </nav>
  );
}
