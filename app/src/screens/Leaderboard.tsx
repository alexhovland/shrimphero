import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { ApiError, getLeaderboard, reportNickname, type LeaderRow } from '../lib/api';
import { formatNumber } from '../lib/format';
import { href } from '../lib/router';
import { useSession } from '../lib/session';

type ReportState = { nickname: string; step: 'confirm' | 'done' | 'login' | 'error'; message?: string };

export default function Leaderboard() {
  const { t, lang } = useI18n();
  const { session, me, refreshMe } = useSession();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [report, setReport] = useState<ReportState | null>(null);

  const load = () => {
    setFailed(false);
    getLeaderboard().then(setRows).catch(() => setFailed(true));
    if (session) refreshMe();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const startReport = (nickname: string) =>
    setReport({ nickname, step: session ? 'confirm' : 'login' });

  const sendReport = async (nickname: string) => {
    try {
      await reportNickname(nickname);
      setReport({ nickname, step: 'done' });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'generic';
      setReport({ nickname, step: 'error', message: t(`errors.${code}`) });
    }
  };

  const reportCell = (nickname: string) => {
    if (report?.nickname !== nickname) {
      return (
        <button type="button" className="link-button report" aria-label={t('leaderboard.report_aria', { nickname })} onClick={() => startReport(nickname)}>
          {t('leaderboard.report')}
        </button>
      );
    }
    if (report.step === 'confirm') {
      return (
        <span className="report-confirm" role="group" aria-label={t('leaderboard.confirm_report', { nickname })}>
          <span>{t('leaderboard.confirm_report', { nickname })}</span>
          <button type="button" className="btn btn--danger btn--small" onClick={() => sendReport(nickname)}>{t('common.yes')}</button>
          <button type="button" className="btn btn--outline btn--small" onClick={() => setReport(null)}>{t('common.no')}</button>
        </span>
      );
    }
    const text = report.step === 'done' ? t('leaderboard.reported') : report.step === 'login' ? t('leaderboard.report_login') : report.message;
    return <span className="report-confirm" role="status">{text}</span>;
  };

  return (
    <section className="block block--cream" aria-labelledby="lb-title">
      <div className="wrap">
        <h1 id="lb-title">{t('leaderboard.title')}</h1>
        <p className="my-rank">
          {me?.rank ? (
            t('leaderboard.your_rank', { count: me.total, rank: me.rank, total: formatNumber(me.total, lang) })
          ) : (
            <a href={href('/log')}>{t('leaderboard.not_ranked')}</a>
          )}
        </p>
        {failed && (
          <p className="error" role="alert">
            {t('errors.generic')}{' '}
            <button type="button" className="link-button" onClick={load}>{t('common.retry')}</button>
          </p>
        )}
        {!rows && !failed && <p role="status">{t('common.loading')}</p>}
        {rows && rows.length === 0 && <p>{t('leaderboard.empty')}</p>}
        {rows && rows.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th scope="col" className="rank">{t('leaderboard.rank')}</th>
                <th scope="col">{t('leaderboard.nickname')}</th>
                <th scope="col" className="num">{t('leaderboard.stickers')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const mine = !!me?.nickname && me.nickname === r.nickname;
                return (
                  <tr key={r.nickname} className={mine ? 'is-me' : undefined}>
                    <td className="rank">{r.rank}</td>
                    <td>
                      <div className="nick">
                        <span>{r.nickname}</span>
                        {mine ? <span className="tag">{t('leaderboard.you')}</span> : reportCell(r.nickname)}
                      </div>
                    </td>
                    <td className="num">{formatNumber(r.total, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
