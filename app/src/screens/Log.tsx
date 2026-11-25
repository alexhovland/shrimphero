import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { ApiError, logStickers, setNickname, type Store } from '../lib/api';
import { addDays, formatDate, formatNumber, localISODate, NICKNAME_PATTERN, safeStorage } from '../lib/format';
import { href } from '../lib/router';
import { petitionFor } from '../lib/petition';
import { useSession } from '../lib/session';
import { configured } from '../lib/supabase';
import { StorePicker } from '../components/StorePicker';
import { Stepper } from '../components/Stepper';
import { Turnstile } from '../components/Turnstile';
import { Mascot } from '../components/Mascot';
import { prefersReducedMotion } from '../lib/motion';

const LAST_STORE = 'shrimphero-last-store';
const NICK_ERRORS = ['nickname_too_short', 'nickname_too_long', 'nickname_characters', 'nickname_spacing', 'nickname_link', 'nickname_blocked', 'nickname_taken', 'no_nickname'];

function lastStore(): Store | null {
  try {
    const raw = safeStorage(LAST_STORE);
    const s = raw ? JSON.parse(raw) : null;
    return s && typeof s.id === 'string' ? s : null;
  } catch {
    return null;
  }
}

export default function Log() {
  const { t, lang } = useI18n();
  const { session, me, ready, signIn, refreshMe } = useSession();
  const [store, setStore] = useState<Store | null>(lastStore);
  const [count, setCount] = useState(1);
  const today = localISODate();
  const [date, setDate] = useState(today);
  const [nick, setNick] = useState('');
  const token = useRef<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  // Cloudflare's robot check loads only once the person starts filling the form.
  const [wantCaptcha, setWantCaptcha] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ store?: string; nick?: string; form?: string }>({});
  const [done, setDone] = useState<{ stickers: number; shrimp: number } | null>(null);
  const doneTitle = useRef<HTMLHeadingElement>(null);

  const needsNickname = ready && !me?.nickname;

  useEffect(() => {
    if (!done) return;
    doneTitle.current?.focus();
    // One short buzz with the stamp, on phones that can. Never with reduced motion.
    if (!prefersReducedMotion()) navigator.vibrate?.(30);
  }, [done]);

  const chooseStore = (s: Store | null) => {
    setStore(s);
    setErrors((e) => ({ ...e, store: undefined }));
    safeStorage(LAST_STORE, s ? JSON.stringify(s) : null);
  };

  const days = Array.from({ length: 8 }, (_, i) => addDays(today, -i));
  const dayLabel = (iso: string, i: number) =>
    i === 0 ? t('log.today') : i === 1 ? t('log.yesterday') : formatDate(iso, lang, true);

  // The robot check usually finishes on its own within a second or two.
  async function waitForToken(): Promise<string | null> {
    for (let i = 0; i < 50 && !token.current; i++) await new Promise((r) => setTimeout(r, 200));
    return token.current;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!store) next.store = t('log.pick_store_first');
    const cleanNick = nick.trim().replace(/\s+/g, ' ');
    if (needsNickname) {
      if (cleanNick.length < 3) next.nick = t('errors.nickname_too_short');
      else if (cleanNick.length > 20) next.nick = t('errors.nickname_too_long');
      else if (!NICKNAME_PATTERN.test(cleanNick)) next.nick = t('errors.nickname_characters');
    }
    setErrors(next);
    setWantCaptcha(true);
    if (next.store || next.nick || !store) return;

    setBusy(true);
    try {
      if (!session) {
        const captcha = await waitForToken();
        if (!captcha) throw new ApiError('not_signed_in');
        try {
          await signIn(captcha);
        } finally {
          token.current = null;
          setCaptchaKey((k) => k + 1);
        }
      }
      if (needsNickname) await setNickname(cleanNick);
      const res = await logStickers(store.id, count, date);
      await refreshMe();
      setDone({ stickers: count, shrimp: Number(res?.shrimp_helped ?? 0) });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : err instanceof Error && err.message === 'sign_in_failed' ? 'sign_in_failed' : 'generic';
      if (NICK_ERRORS.includes(code)) setErrors({ nick: t(`errors.${code}`) });
      else if (code === 'unknown_store') setErrors({ store: t('errors.unknown_store') });
      else setErrors({ form: t(`errors.${code}`) });
      await refreshMe();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="block block--blue done" aria-labelledby="done-title">
        <div className="wrap--form">
          <Mascot rippleKey={done.stickers + date} hopKey={done.stickers + date} />
          {/* Decorative: the text below says the same. */}
          <p className="stamp" aria-hidden="true">+{formatNumber(done.stickers, lang)}</p>
          <h1 id="done-title" ref={doneTitle} tabIndex={-1}>{t('log.done_title')}</h1>
          <p>
            {t('log.done_body', {
              count: done.stickers,
              stickers: formatNumber(done.stickers, lang),
              shrimp: formatNumber(done.shrimp, lang),
            })}
          </p>
          <p>{t('log.done_petition')}</p>
          <div className="actions">
            <a className="btn btn--yellow" href={petitionFor(lang)} target="_blank" rel="noopener noreferrer">
              {t('home.petition')}
              <span className="sr-only"> {t('common.new_tab')}</span>
            </a>
            <button type="button" className="btn btn--outline" onClick={() => { setDone(null); setCount(1); }}>
              {t('log.log_more')}
            </button>
            <a className="btn btn--outline" href={href('/map')}>{t('log.see_map')}</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="block block--cream" aria-labelledby="log-title">
      <div className="wrap--form">
        <h1 id="log-title">{t('log.title')}</h1>
        {!configured && <p className="notice" role="alert">{t('errors.not_configured')}</p>}
        <form onSubmit={submit} noValidate onFocus={() => setWantCaptcha(true)} onPointerDown={() => setWantCaptcha(true)}>
          <StorePicker value={store} onChange={chooseStore} error={errors.store} />
          <Stepper value={count} onChange={setCount} />
          <div className="field">
            <label htmlFor="log-date">{t('log.date_label')}</label>
            <select id="log-date" className="select" value={date} onChange={(e) => setDate(e.target.value)}>
              {days.map((d, i) => (
                <option key={d} value={d}>{dayLabel(d, i)}</option>
              ))}
            </select>
          </div>
          {needsNickname && (
            <div className="field">
              <label htmlFor="log-nick">{t('log.nickname_label')}</label>
              <input
                id="log-nick"
                className="input"
                type="text"
                autoComplete="nickname"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                value={nick}
                aria-describedby={`log-nick-hint${errors.nick ? ' log-nick-err' : ''}`}
                aria-invalid={errors.nick ? true : undefined}
                onChange={(e) => setNick(e.target.value)}
              />
              <span className="hint" id="log-nick-hint">{t('log.nickname_hint')}</span>
              {errors.nick && <span className="error" id="log-nick-err" role="alert">{errors.nick}</span>}
            </div>
          )}
          {wantCaptcha && ready && !session && configured && (
            <Turnstile key={captchaKey} onToken={(v) => (token.current = v)} onError={() => setErrors({ form: t('errors.captcha') })} />
          )}
          {errors.form && <p className="error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn btn--blue btn--block" disabled={busy || !ready || !configured}>
            {busy ? t('log.saving') : t('log.save')}
          </button>
        </form>
      </div>
    </section>
  );
}
