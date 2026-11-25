import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { nearbyStores, searchStores, type Store } from '../lib/api';

export const storeLine = (s: Store) => [s.street, [s.postcode, s.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

// Search the Lidl list by city, street or postcode, or by location.
// Follows the ARIA combobox pattern so it works with a keyboard and screen readers.
export function StorePicker({ value, onChange, error }: { value: Store | null; onChange: (s: Store | null) => void; error?: string }) {
  const { t, lang } = useI18n();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Store[] | null>(null);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<'' | 'searching' | 'locating' | 'location_denied' | 'failed'>('');

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setStatus('searching');
    const timer = window.setTimeout(async () => {
      try {
        const rows = await searchStores(term);
        if (!cancelled) {
          setResults(rows || []);
          setActive(-1);
          setStatus('');
        }
      } catch {
        if (!cancelled) setStatus('failed');
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q]);

  const pick = (s: Store) => {
    onChange(s);
    setResults(null);
    setQ('');
  };

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus('location_denied');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const rows = await nearbyStores(pos.coords.latitude, pos.coords.longitude);
          setResults(rows || []);
          setActive(-1);
          setStatus('');
          inputRef.current?.focus();
        } catch {
          setStatus('failed');
        }
      },
      () => setStatus('location_denied'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  if (value) {
    return (
      <div className="field">
        <span className="label" id={`${id}-label`}>{t('log.store_label')}</span>
        <div className="store-picked" aria-labelledby={`${id}-label`}>
          <div>
            <strong>{value.city || value.name || 'Lidl'}</strong>
            <span>{storeLine(value)}</span>
          </div>
          <button type="button" className="btn btn--outline btn--small" onClick={() => onChange(null)}>
            {t('log.change_store')}
          </button>
        </div>
      </div>
    );
  }

  const open = results !== null;
  const listId = `${id}-list`;
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results || !results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setResults(null);
    }
  };

  const message =
    status === 'searching' ? t('log.searching')
    : status === 'locating' ? t('log.locating')
    : status === 'location_denied' ? t('log.location_denied')
    : status === 'failed' ? t('errors.generic')
    : results && results.length === 0 ? t('log.no_results')
    : '';

  return (
    <div className="field">
      <label htmlFor={`${id}-input`}>{t('log.store_label')}</label>
      <input
        ref={inputRef}
        id={`${id}-input`}
        className="input"
        type="search"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        placeholder={t('log.store_placeholder')}
        aria-autocomplete="list"
        aria-expanded={open && !!results?.length}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-describedby={`${id}-hint ${id}-status${error ? ` ${id}-err` : ''}`}
        aria-invalid={error ? true : undefined}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKey}
      />
      {open && results.length > 0 && (
        <ul className="store-results" role="listbox" id={listId} aria-label={t('log.store_label')}>
          {results.map((s, i) => (
            <li key={s.id} role="presentation">
              <button
                type="button"
                role="option"
                id={`${id}-opt-${i}`}
                className="store-option"
                aria-selected={i === active}
                tabIndex={-1}
                onClick={() => pick(s)}
              >
                <strong>
                  {s.city || s.name}
                  {s.km != null ? ` · ${t('log.km', { km: Number(s.km).toLocaleString(lang, { maximumFractionDigits: 1 }) })}` : ''}
                </strong>
                <span>{storeLine(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="hint" id={`${id}-hint`}>{t('log.store_hint')}</span>
      <span className="credit store-credit">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">{t('footer.osm')}</a>
        {' · '}
        <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">© GeoNames</a>
      </span>
      <span className="hint" id={`${id}-status`} role="status">{message}</span>
      {error && <span className="error" id={`${id}-err`}>{error}</span>}
      <div className="store-tools">
        <button type="button" className="btn btn--outline btn--small" onClick={locate}>
          {t('log.use_location')}
        </button>
      </div>
    </div>
  );
}
