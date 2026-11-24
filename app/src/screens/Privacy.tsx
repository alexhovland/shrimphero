import { useI18n } from '../i18n';
import { CONTACT_EMAIL, HOST, PUBLISHER_ADDRESS, PUBLISHER_NAME } from '../site-config';

export default function Privacy() {
  const { t } = useI18n();
  const email = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  const [before, after] = t('privacy.rights_1', { email: '\u0000' }).split('\u0000');
  const list = (prefix: string, n: number) => (
    <ul>
      {Array.from({ length: n }, (_, i) => (
        <li key={i}>{t(`privacy.${prefix}_${i + 1}`)}</li>
      ))}
    </ul>
  );
  return (
    <section className="block block--cream prose" aria-labelledby="pv-title">
      <div className="wrap">
        <h1 id="pv-title">{t('privacy.title')}</h1>
        <h2>{t('privacy.stored_title')}</h2>
        {list('stored', 4)}
        <h2>{t('privacy.not_title')}</h2>
        {list('not', 2)}
        <h2>{t('privacy.public_title')}</h2>
        <p>{t('privacy.public_1')}</p>
        <h2>{t('privacy.services_title')}</h2>
        {list('services', 4)}
        <h2>{t('privacy.rights_title')}</h2>
        <p>
          {before}
          {email}
          {after}
        </p>
        <h2>{t('privacy.imprint_title')}</h2>
        <p>{t('privacy.publisher', { name: PUBLISHER_NAME })}</p>
        {PUBLISHER_ADDRESS && <p>{PUBLISHER_ADDRESS}</p>}
        <p>
          {t('privacy.contact', { email: '' })}
          {email}
        </p>
        <p>{t('privacy.host', { host: HOST })}</p>
      </div>
    </section>
  );
}
