import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { TALLY_ORIGIN, type OrderForm as Form } from '../lib/order';
import { prefersReducedMotion } from '../lib/motion';
import { href } from '../lib/router';
import { countEvent } from '../lib/stats';

const QUESTIONS = [1, 2, 3, 4, 5, 6, 7];
const LOAD_TIMEOUT = 12_000;

// "Tally.FormSubmitted" from the form, if the message is one. Anything else (including
// the form's answers in the payload) is ignored and never stored or sent anywhere.
function isSubmitted(data: unknown): boolean {
  try {
    const value = typeof data === 'string' ? JSON.parse(data) : data;
    return !!value && typeof value === 'object' && (value as { event?: unknown }).event === 'Tally.FormSubmitted';
  } catch {
    return false; // not JSON, for example the form's own "[iFrameResizerChild]Ready"
  }
}

// The sticker order form (Tally) inside the Order stickers page. Nothing is loaded
// from Tally until the visitor taps the button; a plain new-tab link is always there.
export function OrderForm({ form }: { form: Form }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sentOnce = useRef(false);

  // Once open: focus the form, watch for its messages, and give up waiting after 12 s.
  useEffect(() => {
    if (!open) return;
    wrap.current?.focus();
    const timer = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== TALLY_ORIGIN || !frame.current || e.source !== frame.current.contentWindow) return;
      if (!isSubmitted(e.data) || sentOnce.current) return;
      sentOnce.current = true;
      setSent(true);
      countEvent('order-form-sent');
      // The section (not the heading) keeps a little air above it (scroll-margin-top).
      heading.current?.closest('section')?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };
  }, [open]);

  const start = () => {
    setOpen(true);
    countEvent('order-form-opened');
  };

  const onLoad = () => {
    setLoaded(true);
    setFailed(false);
  };

  const newTab = (text: string) => (
    <a href={form.share} target="_blank" rel="noopener noreferrer">
      {text}
      <span className="sr-only"> {t('common.new_tab')}</span>
    </a>
  );

  const [before, after] = t('stickers.sent', { link: '\u0000' }).split('\u0000');

  return (
    <section className="order-form section-target" aria-labelledby="order-form">
      <h2 id="order-form" ref={heading} tabIndex={-1}>{t('stickers.form_title')}</h2>

      {lang !== 'en' && (
        <div className="form-help">
          <p>{t('stickers.form_english')}</p>
          <ul>
            {QUESTIONS.map((i) => (
              <li key={i}>{t(`stickers.q${i}`)}</li>
            ))}
          </ul>
        </div>
      )}

      {!open ? (
        <button type="button" className="btn btn--yellow btn--block btn--main" onClick={start}>
          {t('stickers.open_form')}
        </button>
      ) : (
        <div ref={wrap} className="order-frame" tabIndex={-1} role="region" aria-label={t('stickers.form_frame_title')}>
          {!loaded && !failed && <p className="hint" role="status">{t('stickers.loading_form')}</p>}
          {!loaded && failed && <p className="error" role="alert">{newTab(t('stickers.form_failed'))}</p>}
          <iframe
            ref={frame}
            className={sent ? 'order-iframe order-iframe--sent' : 'order-iframe'}
            src={form.embed}
            title={t('stickers.form_frame_title')}
            width="100%"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow=""
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            onLoad={onLoad}
          />
          {sent && (
            <p className="order-sent" role="status">
              {before}
              <a href={href('/log')}>{t('stickers.sent_link')}</a>
              {after}
            </p>
          )}
        </div>
      )}

      <p className="new-tab-link">{newTab(t('stickers.open_new_tab'))}</p>
      <p className="hint">{t('stickers.tally_note')}</p>
    </section>
  );
}
