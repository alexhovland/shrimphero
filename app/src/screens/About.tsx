import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getImpact, type Impact } from '../lib/api';
import { impactVars } from '../lib/impact';
import { SOURCES } from '../site-config';

export default function About() {
  const { t, lang } = useI18n();
  const [impact, setImpact] = useState<Impact | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getImpact().then(setImpact).catch(() => setFailed(true));
  }, []);

  // Placeholders ("…") keep the layout steady until the numbers arrive from the database.
  const v = impactVars(impact, lang, failed);

  return (
    <section className="block block--cream prose" aria-labelledby="about-title">
      <div className="wrap">
        <h1 id="about-title">{t('about.title')}</h1>
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
        <h2>{t('about.sources')}</h2>
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
      </div>
    </section>
  );
}
