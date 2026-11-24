import { useI18n } from '../i18n';
import { href, type Route } from '../lib/router';
import { NAV } from './nav';

export function TabBar({ route }: { route: Route }) {
  const { t } = useI18n();
  return (
    <nav className="tabbar" aria-label={t('nav.menu')}>
      {NAV.map(({ route: r, label, Icon }) => (
        <a key={r} href={href(r)} aria-current={route === r ? 'page' : undefined}>
          <Icon />
          <span>{t(label)}</span>
        </a>
      ))}
    </nav>
  );
}
