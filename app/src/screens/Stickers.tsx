import { useI18n } from '../i18n';
import { orderFormFor } from '../lib/order';

const STEPS = [1, 2, 3];

// Order stickers: they are posted for free through an outside form (Tally).
// The site only links to it; nothing about the order is stored here.
// No sticker image on purpose: the sticker shows a shrimp on ice.
export default function Stickers() {
  const { t, lang } = useI18n();
  const link = orderFormFor(lang);

  return (
    <section className="block block--cream" aria-labelledby="st-title">
      <div className="wrap--form">
        <h1 id="st-title">{t('stickers.title')}</h1>
        <p className="lead">{t('stickers.body')}</p>
        <ol className="steps order-steps steps--stickers">
          {STEPS.map((i) => (
            <li key={i} className="sticker">
              <span>{t(`stickers.step${i}`)}</span>
            </li>
          ))}
        </ol>
        <p className="promise">{t('stickers.promise')}</p>
        {link ? (
          <>
            <a className="btn btn--yellow btn--block btn--main" href={link} target="_blank" rel="noopener noreferrer">
              {t('stickers.order')}
              <span className="sr-only"> {t('common.new_tab')}</span>
            </a>
            <p className="hint">{t('stickers.tally_note')}</p>
          </>
        ) : (
          <p className="order-soon">{t('stickers.soon')}</p>
        )}
        <p className="where"><strong>{t('stickers.where')}</strong></p>
      </div>
    </section>
  );
}
