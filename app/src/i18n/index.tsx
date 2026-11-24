import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import en from './en.json';
import { safeStorage } from '../lib/format';

// Interface languages. Names are shown as written in each language, never as flags.
export const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'es', name: 'Español' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
type Dict = { [key: string]: string | Plural | Dict };

const STORAGE_KEY = 'shrimphero-lang';
const loaders: Record<Lang, () => Promise<Dict>> = {
  en: async () => en as Dict,
  fr: () => import('./fr.json').then((m) => m.default as Dict),
  de: () => import('./de.json').then((m) => m.default as Dict),
  it: () => import('./it.json').then((m) => m.default as Dict),
  pl: () => import('./pl.json').then((m) => m.default as Dict),
  es: () => import('./es.json').then((m) => m.default as Dict),
};

const isLang = (v: unknown): v is Lang => LANGUAGES.some((l) => l.code === v);

export function detectLanguage(): Lang {
  const saved = safeStorage(STORAGE_KEY);
  if (isLang(saved)) return saved;
  for (const tag of navigator.languages || [navigator.language]) {
    const base = (tag || '').slice(0, 2).toLowerCase();
    if (isLang(base)) return base;
  }
  return 'en';
}

let initial: { lang: Lang; dict: Dict } = { lang: 'en', dict: en as Dict };

// Called once before the first render, so nobody sees English flash first.
export async function initI18n() {
  const lang = detectLanguage();
  try {
    initial = { lang, dict: await loaders[lang]() };
  } catch {
    initial = { lang: 'en', dict: en as Dict };
  }
  document.documentElement.lang = initial.lang;
}

type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;

function lookup(dict: Dict, key: string): string | Plural | undefined {
  let node: string | Plural | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (!node || typeof node === 'string') return undefined;
    node = (node as Dict)[part];
  }
  return node as string | Plural | undefined;
}

function translate(lang: Lang, dict: Dict, key: string, vars?: Vars): string {
  let value = lookup(dict, key) ?? lookup(en as Dict, key);
  if (value === undefined) return key;
  if (typeof value !== 'string') {
    // Plural forms: pick by the "count" variable.
    const rule = new Intl.PluralRules(lang).select(Number(vars?.count ?? 0));
    value = value[rule] ?? value.other;
  }
  return value.replace(/\{(\w+)\}/g, (m, name: string) => (vars && name in vars ? String(vars[name]) : m));
}

type I18n = { lang: Lang; t: T; setLang: (l: Lang) => Promise<void> };
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);

  const setLang = useCallback(async (lang: Lang) => {
    const dict = await loaders[lang]();
    safeStorage(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    setState({ lang, dict });
  }, []);

  const t = useCallback<T>((key, vars) => translate(state.lang, state.dict, key, vars), [state]);

  return <Ctx.Provider value={{ lang: state.lang, t, setLang }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('I18nProvider missing');
  return v;
}
