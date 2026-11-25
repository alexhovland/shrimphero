import { useI18n } from '../i18n';
import { formatNumber } from '../lib/format';

const GOALS = [1, 10, 25, 50, 100];
const MAX_SHAPES = 50;

// The visitor's stickers as a row of tiny sticker shapes (decorative: the summary
// text already says the total), then simple goals. No points, no levels, no badges.
export function Progress({ total }: { total: number }) {
  const { t, lang } = useI18n();
  const shown = Math.min(total, MAX_SHAPES);
  const next = GOALS.find((g) => total < g);

  return (
    <div className="progress">
      {total > 0 && (
        <p className="sticker-row" aria-hidden="true">
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} className="mini-sticker" />
          ))}
          {total > MAX_SHAPES && <span className="sticker-row__more">+{formatNumber(total - MAX_SHAPES, lang)}</span>}
        </p>
      )}
      <div className="goals-line">
        <ol className="goals" aria-label={t('me.goals_label')}>
          {GOALS.map((g) => {
            const reached = total >= g;
            return (
              <li key={g} className={reached ? 'goal goal--reached' : 'goal'}>
                {formatNumber(g, lang)}
                {reached && <span className="sr-only"> {t('me.goal_reached')}</span>}
              </li>
            );
          })}
        </ol>
        <p className="goal-next">
          {next ? t('me.goal_next', { n: formatNumber(next - total, lang), goal: formatNumber(next, lang) }) : t('me.goals_done')}
        </p>
      </div>
    </div>
  );
}
