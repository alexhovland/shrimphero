import { useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { ApiError, deleteMyData, deleteMyEntry, myEntries, setNickname, type Entry } from '../lib/api';
import { formatDate, formatNumber, NICKNAME_PATTERN } from '../lib/format';
import { href } from '../lib/router';
import { useSession } from '../lib/session';
import { storeLine } from '../components/StorePicker';

export default function Mine() {
  const { t, lang } = useI18n();
  const { session, me, ready, refreshMe, signOut } = useSession();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [editNick, setEditNick] = useState(false);
  const [nick, setNick] = useState('');
  const [nickMsg, setNickMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [deletedAll, setDeletedAll] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setFailed(false);
    myEntries().then((rows) => setEntries(rows || [])).catch(() => setFailed(true));
    refreshMe();
  };
  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const remove = async (id: number) => {
    setError('');
    try {
      await deleteMyEntry(id);
      setConfirmId(null);
      load();
    } catch (e) {
      setError(t(`errors.${e instanceof ApiError ? e.code : 'generic'}`));
    }
  };

  const saveNick = async (e: FormEvent) => {
    e.preventDefault();
    const clean = nick.trim().replace(/\s+/g, ' ');
    if (!NICKNAME_PATTERN.test(clean)) {
      setNickMsg({ ok: false, text: t(clean.length < 3 ? 'errors.nickname_too_short' : 'errors.nickname_characters') });
      return;
    }
    try {
      await setNickname(clean);
      await refreshMe();
      setEditNick(false);
      setNickMsg({ ok: true, text: t('me.nickname_saved') });
    } catch (err) {
      setNickMsg({ ok: false, text: t(`errors.${err instanceof ApiError ? err.code : 'generic'}`) });
    }
  };

  const removeAll = async () => {
    setError('');
    try {
      await deleteMyData();
      await signOut();
      setEntries(null);
      setDeletedAll(true);
    } catch (e) {
      setError(t(`errors.${e instanceof ApiError ? e.code : 'generic'}`));
    }
  };

  if (deletedAll) {
    return (
      <section className="block block--cream" aria-labelledby="me-title">
        <div className="wrap">
          <h1 id="me-title">{t('me.title')}</h1>
          <p role="status">{t('me.deleted_all')}</p>
        </div>
      </section>
    );
  }

  if (ready && !session) {
    return (
      <section className="block block--cream" aria-labelledby="me-title">
        <div className="wrap">
          <h1 id="me-title">{t('me.title')}</h1>
          <p>{t('me.none')}</p>
          <div className="actions">
            <a className="btn btn--blue" href={href('/log')}>{t('home.cta_log')}</a>
          </div>
          <p className="hint">{t('me.device_note')}</p>
        </div>
      </section>
    );
  }

  const total = me?.total ?? 0;
  return (
    <section className="block block--cream" aria-labelledby="me-title">
      <div className="wrap">
        <h1 id="me-title">{t('me.title')}</h1>
        {me?.nickname && (
          <>
            <p className="summary">{me.nickname}</p>
            <p>
              {me.rank
                ? t('me.summary', { count: total, total: formatNumber(total, lang), rank: me.rank })
                : t('me.summary_unranked', { count: total, total: formatNumber(total, lang) })}
            </p>
          </>
        )}

        {me?.nickname && !editNick && (
          <button type="button" className="btn btn--outline btn--small" onClick={() => { setNick(me.nickname); setEditNick(true); setNickMsg(null); }}>
            {t('me.change_nickname')}
          </button>
        )}
        {editNick && (
          <form className="nick-form" onSubmit={saveNick} noValidate>
            <div className="field">
              <label htmlFor="me-nick">{t('log.nickname_label')}</label>
              <input id="me-nick" className="input" type="text" maxLength={20} autoComplete="nickname" spellCheck={false}
                value={nick} onChange={(e) => setNick(e.target.value)} aria-describedby="me-nick-hint" />
              <span className="hint" id="me-nick-hint">{t('log.nickname_hint')}</span>
            </div>
            <div className="actions actions--tight">
              <button type="submit" className="btn btn--blue btn--small">{t('me.save_nickname')}</button>
              <button type="button" className="btn btn--outline btn--small" onClick={() => setEditNick(false)}>{t('common.cancel')}</button>
            </div>
          </form>
        )}
        {nickMsg && <p className={nickMsg.ok ? 'hint' : 'error'} role="status">{nickMsg.text}</p>}

        <h2 className="section-gap">{t('me.entries_title')}</h2>
        {failed && (
          <p className="error" role="alert">
            {t('errors.generic')}{' '}
            <button type="button" className="link-button" onClick={load}>{t('common.retry')}</button>
          </p>
        )}
        {!entries && !failed && <p role="status">{t('common.loading')}</p>}
        {entries && entries.length === 0 && (
          <p>
            {t('me.none')} <a href={href('/log')}>{t('home.cta_log')}</a>
          </p>
        )}
        {entries && entries.length > 0 && (
          <ul className="entries">
            {entries.map((e) => (
              <li key={e.id}>
                <div>
                  <span className="entry__count">{formatNumber(e.stickers, lang)}</span> · {formatDate(e.entry_date, lang)}
                  <span className="entry__where">{e.store_name} {storeLine({ id: '', name: e.store_name, street: e.street, city: e.city, postcode: null, country: '' })}</span>
                  {e.hidden && <span className="entry__hidden">{t('me.hidden')}</span>}
                </div>
                {confirmId === e.id ? (
                  <span className="report-confirm" role="group" aria-label={t('me.confirm_delete')}>
                    <span>{t('me.confirm_delete')}</span>
                    <button type="button" className="btn btn--danger btn--small" onClick={() => remove(e.id)}>{t('common.yes')}</button>
                    <button type="button" className="btn btn--outline btn--small" onClick={() => setConfirmId(null)}>{t('common.no')}</button>
                  </span>
                ) : (
                  <button type="button" className="btn btn--outline btn--small"
                    aria-label={t('me.delete_aria', { date: formatDate(e.entry_date, lang) })} onClick={() => setConfirmId(e.id)}>
                    {t('me.delete')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {error && <p className="error" role="alert">{error}</p>}

        <p className="hint">{t('me.device_note')}</p>

        <div className="danger-zone">
          <h2>{t('me.delete_all_title')}</h2>
          <p>{t('me.delete_all_body')}</p>
          {confirmAll ? (
            <div className="actions" role="group" aria-label={t('me.confirm_delete_all')}>
              <p className="full"><strong>{t('me.confirm_delete_all')}</strong></p>
              <button type="button" className="btn btn--danger" onClick={removeAll}>{t('me.delete_all')}</button>
              <button type="button" className="btn btn--outline" onClick={() => setConfirmAll(false)}>{t('common.cancel')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn--outline" onClick={() => setConfirmAll(true)}>{t('me.delete_all')}</button>
          )}
        </div>
      </div>
    </section>
  );
}
