import type { Impact } from './api';
import { formatNumber } from './format';

// Text values for the impact numbers from the settings table (S, p, N), formatted for the language.
//   s, n: S and N as whole numbers   p: p as a fraction (0.1)   per: shrimp per sticker
//   N:  shrimp per sticker ("{N}" in the How it works texts)
//   X:  p as a percentage, 0.1 -> 10 ("{X}" in the texts)
// Until the numbers arrive, every value is "…" ("–" if loading failed), so nothing is hardcoded.
export function impactVars(impact: Impact | null, lang: string, failed = false) {
  const exact = (n: number, digits = 4) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(n);
  if (!impact) {
    const dash = failed ? '–' : '…';
    return { s: dash, p: dash, n: dash, per: dash, N: dash, X: dash };
  }
  const per = exact(impact.per_sticker);
  return {
    s: formatNumber(impact.s, lang),
    p: exact(impact.p),
    n: formatNumber(impact.n, lang),
    per,
    N: per,
    X: exact(impact.p * 100, 2),
  };
}
