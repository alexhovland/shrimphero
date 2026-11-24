import { useI18n } from '../i18n';
import { href } from '../lib/router';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer block block--ink">
      <div className="wrap">
        <ul>
          <li><a href={href('/stickers')}>{t('footer.stickers')}</a></li>
          <li><a href={href('/about')}>{t('footer.about')}</a></li>
          <li><a href={href('/privacy')}>{t('footer.privacy')}</a></li>
        </ul>
        <p className="credit">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            {t('footer.osm')}
          </a>
        </p>
      </div>
    </footer>
  );
}
