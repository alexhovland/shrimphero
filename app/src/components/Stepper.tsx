import { useId } from 'react';
import { useI18n } from '../i18n';

export function Stepper({ value, onChange, min = 1, max = 50 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const { t } = useI18n();
  const id = useId();
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n) || min));
  return (
    <div className="field">
      <label htmlFor={id}>{t('log.count_label')}</label>
      <div className="stepper">
        <button type="button" aria-label={t('log.less')} aria-controls={id} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button type="button" aria-label={t('log.more')} aria-controls={id} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}
