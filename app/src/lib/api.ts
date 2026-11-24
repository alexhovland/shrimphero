import { getSupabase, SUPABASE_KEY, SUPABASE_URL } from './supabase';

export type Totals = { total_stickers: number; shrimp_helped: number; shrimp_per_sticker: number };
export type Store = { id: string; name: string; street: string | null; city: string | null; postcode: string | null; country: string; km?: number };
export type LeaderRow = { rank: number; nickname: string; total: number };
export type MyRank = { rank: number | null; total: number; nickname: string };
export type MapRow = { store_id: string; lat: number; lng: number; street: string | null; city: string | null; total: number };
export type Entry = { id: number; stickers: number; entry_date: string; hidden: boolean; store_name: string; street: string | null; city: string | null };
export type Impact = { s: number; p: number; n: number; per_sticker: number };

// Errors raised by the database come back with a short code as message,
// for example "nickname_taken". The screens translate the code.
export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const toCode = (message: unknown) => (typeof message === 'string' && /^[a-z_]+$/.test(message) ? message : 'generic');

// Functions that need the signed-in person go through the Supabase library.
async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new ApiError(toCode(error.message));
  return data as T;
}

// Public functions (totals, leaderboard, map, store search) are plain HTTP
// calls with the public key, so the home page loads without the library.
async function publicRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: SUPABASE_KEY };
  // Legacy anon keys are JWTs and also go in Authorization; new sb_ keys must not.
  if (!SUPABASE_KEY.startsWith('sb_')) headers.Authorization = `Bearer ${SUPABASE_KEY}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args) });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(toCode(body?.message));
  return body as T;
}

const first = <T,>(rows: T[] | null): T | null => (rows && rows.length ? rows[0] : null);
const num = (v: unknown) => Number(v ?? 0);

export async function getTotals(): Promise<Totals> {
  const row = first(await publicRpc<Totals[]>('public_totals'));
  return { total_stickers: num(row?.total_stickers), shrimp_helped: num(row?.shrimp_helped), shrimp_per_sticker: num(row?.shrimp_per_sticker) };
}

export async function getImpact(): Promise<Impact | null> {
  const row = first(await publicRpc<Impact[]>('impact_settings'));
  return row ? { s: num(row.s), p: num(row.p), n: num(row.n), per_sticker: num(row.per_sticker) } : null;
}

export async function getLeaderboard(): Promise<LeaderRow[]> {
  const rows = await publicRpc<LeaderRow[]>('leaderboard');
  return (rows || []).map((r) => ({ rank: num(r.rank), nickname: r.nickname, total: num(r.total) }));
}

export async function getMyRank(): Promise<MyRank | null> {
  const row = first(await rpc<MyRank[]>('my_rank'));
  return row ? { rank: row.rank == null ? null : num(row.rank), total: num(row.total), nickname: row.nickname } : null;
}

export async function getStoreMap(): Promise<MapRow[]> {
  const rows = await publicRpc<MapRow[]>('store_map');
  return (rows || []).map((r) => ({ ...r, lat: num(r.lat), lng: num(r.lng), total: num(r.total) }));
}

export const searchStores = (q: string) => publicRpc<Store[]>('search_stores', { q });

export const nearbyStores = (lat: number, lng: number) =>
  // About 1 km precision is enough to find the nearest Lidl.
  publicRpc<Store[]>('nearby_stores', { p_lat: Math.round(lat * 100) / 100, p_lng: Math.round(lng * 100) / 100 });

export const setNickname = (nick: string) => rpc<string>('set_nickname', { nick });

export const logStickers = (storeId: string, stickers: number, date: string) =>
  rpc<{ id: number; shrimp_helped: number }>('log_stickers', { p_store_id: storeId, p_stickers: stickers, p_date: date });

export const myEntries = () => rpc<Entry[]>('my_entries');
export const deleteMyEntry = (id: number) => rpc<void>('delete_my_entry', { p_id: id });
export const deleteMyData = () => rpc<void>('delete_my_data');
export const reportNickname = (nick: string) => rpc<void>('report_nickname', { nick });
