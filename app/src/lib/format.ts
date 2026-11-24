export const formatNumber = (n: number, lang: string) => new Intl.NumberFormat(lang).format(Math.round(n));

export function localISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return localISODate(new Date(y, m - 1, d + days));
}

export function formatDate(iso: string, lang: string, long = false): string {
  const [y, m, d] = iso.split('-').map(Number);
  const opts: Intl.DateTimeFormatOptions = long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' };
  return new Intl.DateTimeFormat(lang, opts).format(new Date(y, m - 1, d));
}

// Same check as the database, so people see the problem before sending.
export const NICKNAME_PATTERN = /^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ſ _-]{3,20}$/;

export function safeStorage(key: string, value?: string | null): string | null {
  try {
    if (value === undefined) return window.localStorage.getItem(key);
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: the app still works */
  }
  return null;
}
