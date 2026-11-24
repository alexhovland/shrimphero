import { useState } from 'react';
import { useI18n } from '../i18n';
import { STICKERS } from '../site-config';

// No preview on purpose: the sticker shows a shrimp on ice.
export default function Stickers() {
  const { t, lang } = useI18n();
  const [code, setCode] = useState<string>(() => STICKERS.find((s) => s.code === lang)?.code ?? 'en');
  const sticker = STICKERS.find((s) => s.code === code) ?? STICKERS[0];
  const url = `${import.meta.env.BASE_URL}stickers/${sticker.file}`;

  return (
    <section className="block block--cream" aria-labelledby="st-title">
      <div className="wrap--form">
        <h1 id="st-title">{t('stickers.title')}</h1>
        <p>{t('stickers.body')}</p>
        <div className="field">
          <label htmlFor="st-lang">{t('stickers.language')}</label>
          <select id="st-lang" className="select" value={code} onChange={(e) => setCode(e.target.value)}>
            {STICKERS.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
        <a className="btn btn--blue btn--block" href={url} download={`shrimphero-${sticker.file}`}>
          {t('stickers.download')}
        </a>
        <p className="sticker-file">{t('stickers.file')}</p>
        <p><strong>{t('stickers.where')}</strong></p>
      </div>
    </section>
  );
}
