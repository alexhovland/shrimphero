import { useI18n } from '../i18n';
import type { Impact } from '../lib/api';
import { impactVars } from '../lib/impact';
import { SOURCES } from '../site-config';

// "How we count": the impact formula with the real numbers from the settings table.
// Shown at the end of How it works, where #/about scrolls to it. The numbers are
// fetched once by How it works and passed in.
export function HowWeCountSection({ impact, failed }: { impact: Impact | null; failed: boolean }) {
  const { t, lang } = useI18n();
  // Placeholders ("…") keep the layout steady until the numbers arrive from the database.
  const v = impactVars(impact, lang, failed);

  return (
    <section id="how-we-count" className="how-we-count section-target" aria-labelledby="about-title">
      <h2 id="about-title" tabIndex={-1}>{t('about.title')}</h2>
      <p aria-busy={!impact && !failed}>{t('about.intro', { per: v.per })}</p>
      {failed && <p className="error" role="alert">{t('errors.generic')}</p>}
      <div className="formula">
        <p>{t('about.formula')}</p>
        <p>{t('about.result', v)}</p>
      </div>
      <ul>
        <li>
          {t('about.s', { s: v.s })}
          <br />
          {t('about.s_note')}
        </li>
        <li>{t('about.p', { p: v.p })}</li>
        <li>{t('about.n', { n: v.n })}</li>
      </ul>
      <p aria-busy={!impact && !failed}>{t('about.steps', v)}</p>
      <h3>{t('about.sources')}</h3>
      <ul>
        <li>
          <a href={SOURCES.europe} target="_blank" rel="noopener noreferrer">
            {t('about.source_europe')}
            <span className="sr-only"> {t('common.new_tab')}</span>
          </a>
        </li>
        <li>
          <a href={SOURCES.germany} target="_blank" rel="noopener noreferrer">
            {t('about.source_germany')}
            <span className="sr-only"> {t('common.new_tab')}</span>
          </a>
        </li>
      </ul>
      <p className="credit">{t('about.credits')}</p>
      <p className="closing" aria-busy={!impact && !failed}>{t('about.closing', v)}</p>
    </section>
  );
}
