import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { loadTurnstile, SITE_KEY } from '../lib/turnstile';

// Cloudflare's robot check. Shown only before the first anonymous sign-in.
// Most people never see it: it only asks for a click when Cloudflare is unsure.
export function Turnstile({ onToken, onError }: { onToken: (token: string | null) => void; onError: () => void }) {
  const { t, lang } = useI18n();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widget: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widget = ts.render(box.current, {
          sitekey: SITE_KEY,
          language: lang,
          appearance: 'interaction-only',
          theme: 'light',
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => {
            onToken(null);
            onError();
          },
        });
      })
      .catch(() => !cancelled && onError());
    return () => {
      cancelled = true;
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
    // Render once per language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return <div className="turnstile" ref={box} role="group" aria-label={t('log.robot_check')} />;
}
