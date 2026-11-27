import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getImpact, type Impact } from '../lib/api';
import { href } from '../lib/router';
import { impactVars } from '../lib/impact';
import { HowWeCountSection } from './About';

const STEPS = [1, 2, 3, 4, 5];
const FAQ = [1, 2, 3, 4, 5];

// "How it works": why stickers work, five steps, common questions, then "How we count"
// (where #/about scrolls to). {N} (shrimp per sticker) and {X} (store-action share)
// come from the settings table, fetched once here for the whole page.
export default function HowItWorks() {
  const { t, lang } = useI18n();
  const [impact, setImpact] = useState<Impact | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getImpact().then(setImpact).catch(() => setFailed(true));
  }, []);

  const vars = impactVars(impact, lang, failed);

  return (
    <section className="block block--cream prose" aria-labelledby="how-page-title">
      <div className="wrap">
        <h1 id="how-page-title">{t('how.title')}</h1>

        <h2>{t('how.why_title')}</h2>
        <p>{t('how.why_body')}</p>

        <ol className="steps steps--detail steps--stickers">
          {STEPS.map((i) => (
            <li key={i} className="sticker">
              <div>
                <h3>{t(`how.step${i}_title`)}</h3>
                <p aria-busy={i === 4 && !impact && !failed ? true : undefined}>
                  {t(`how.step${i}_body`, vars)}
                  {i === 4 && (
                    <>
                      {' ('}
                      <a href={href('/about')}>{t('how.step4_link')}</a>
                      {')'}
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <h2>{t('how.faq_title')}</h2>
        <div className="faq-list">
          {FAQ.map((i) => (
            <div className="faq" key={i}>
              <h3>{t(`how.faq${i}_q`)}</h3>
              <p>{t(`how.faq${i}_a`)}</p>
            </div>
          ))}
        </div>

        <HowWeCountSection impact={impact} failed={failed} />
      </div>
    </section>
  );
}
