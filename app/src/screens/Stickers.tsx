import { useI18n } from '../i18n';
import { orderFormFor } from '../lib/order';
import { OrderForm } from '../components/OrderForm';

const STEPS = [1, 2, 3];

// Order stickers: they are posted for free. People order them through the campaign
// team's form on Tally, shown on this page after a tap (or opened in a new tab).
// Nothing typed in the form reaches this site.
// No sticker image on purpose: the sticker shows a shrimp on ice.
export default function Stickers() {
  const { t, lang } = useI18n();
  const form = orderFormFor(lang);

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
        {form ? <OrderForm form={form} /> : <p className="order-soon">{t('stickers.soon')}</p>}
        <p className="where"><strong>{t('stickers.where')}</strong></p>
      </div>
    </section>
  );
}
