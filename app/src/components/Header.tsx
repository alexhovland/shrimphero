import { useI18n, LANGUAGES, type Lang } from '../i18n';
import { href, type Route } from '../lib/router';
import { NAV } from './nav';

export function Header({ route }: { route: Route }) {
  const { t, lang, setLang } = useI18n();
  return (
    <header className="site-header">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        {t('header.skip')}
      </a>
      <div className="site-header__inner">
        <a className="wordmark" href={href('/')} aria-label={t('header.home')}>
          ShrimpHero
        </a>
        <nav className="header-nav" aria-label={t('nav.menu')}>
          {NAV.map((item) => (
            <a key={item.route} href={href(item.route)} aria-current={route === item.route ? 'page' : undefined}>
              {t(item.label)}
            </a>
          ))}
        </nav>
        <div className="lang">
          <label htmlFor="lang" className="sr-only">
            {t('header.language')}
          </label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
