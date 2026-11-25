import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getTotals, type Totals } from '../lib/api';
import { href } from '../lib/router';
import { petitionFor } from '../lib/petition';
import { Mascot } from '../components/Mascot';
import { Counter } from '../components/Counter';
import { Reveal } from '../components/Reveal';

export default function Home() {
  const { t, lang } = useI18n();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    getTotals().then(setTotals).catch(() => setFailed(true));
  };
  useEffect(load, []);

  const value = (n: number | undefined) =>
    n === undefined ? <span aria-hidden="true">{failed ? '–' : '…'}</span> : <Counter value={n} lang={lang} />;

  return (
    <>
      <section className="block block--blue hero" aria-labelledby="home-title">
        <div className="wrap">
          <Mascot tappable />
          <h1 id="home-title">{t('home.title')}</h1>
          <div className="counters" aria-busy={!totals && !failed}>
            <p>
              <span className="counter__value">{value(totals?.total_stickers)}</span>
              <span className="counter__label">{t('home.stickers_label', { count: totals?.total_stickers ?? 0 })}</span>
            </p>
            <p>
              <span className="counter__value">{value(totals?.shrimp_helped)}</span>
              <span className="counter__label">{t('home.shrimp_label')}</span>
            </p>
          </div>
          <p className="how-link">
            <a href={href('/about')}>{t('home.how_we_count')}</a>
          </p>
          {failed && (
            <p className="error" role="alert">
              {t('errors.generic')}{' '}
              <button type="button" className="link-button" onClick={load}>{t('common.retry')}</button>
            </p>
          )}
          <div className="actions">
            <a className="btn btn--yellow" href={href('/log')}>{t('home.cta_log')}</a>
            <a className="btn btn--outline" href={href('/stickers')}>{t('home.cta_get')}</a>
          </div>
        </div>
      </section>

      <Reveal className="block block--red" aria-labelledby="why-title">
        <div className="wrap">
          <h2 id="why-title">{t('home.why_title')}</h2>
          <div className="sticker">
            <p>{t('home.why_body')}</p>
          </div>
          <div className="actions">
            <a className="btn btn--light" href={petitionFor(lang)} target="_blank" rel="noopener noreferrer">
              {t('home.petition')}
              <span className="sr-only"> {t('common.new_tab')}</span>
            </a>
          </div>
        </div>
      </Reveal>

      <Reveal className="block block--cream" aria-labelledby="how-title">
        <div className="wrap">
          <h2 id="how-title">{t('home.how_title')}</h2>
          <ol className="steps">
            <li>
              <span>
                <a href={href('/stickers')}>{t('home.step1')}</a>
              </span>
            </li>
            <li><span>{t('home.step2')}</span></li>
            <li>
              <span>
                <a href={href('/log')}>{t('home.step3')}</a>
              </span>
            </li>
          </ol>
          <p className="how-more">
            <a href={href('/how')}>{t('home.how_more')}</a>
          </p>
        </div>
      </Reveal>
    </>
  );
}
