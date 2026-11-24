// A small stand-in for Supabase, used only for local tests, screenshots and
// Lighthouse. It copies the database rules in a simplified way. Never deploy it.
// Run: node tests/mock-server.mjs   (listens on http://127.0.0.1:54321)
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_PORT || 54321);
const EMPTY = process.env.MOCK_EMPTY === '1';
const SETTINGS = { s: 1e9, p: 0.1, n: 1e6 };
const PER = (SETTINGS.s * SETTINGS.p) / SETTINGS.n;

const stores = JSON.parse(readFileSync(new URL('./fixtures/stores.json', import.meta.url))).map(
  ([id, name, street, city, postcode, country, lat, lng]) => ({ id, name, street, city, postcode, country, lat, lng }),
);
const profiles = new Map(); // user id -> { nickname, blocked }
const entries = []; // { id, user, store, stickers, date, hidden }
const reports = [];
let nextId = 1;

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

if (!EMPTY) {
  // Test data for screenshots and tests. Not real people.
  const seed = [
    ['Crevette Libre', [['test/fr-lyon-1', 40], ['test/fr-lyon-2', 22], ['test/fr-paris-1', 18]]],
    ['Garnelenfreund', [['test/de-berlin-1', 35], ['test/de-hamburg-1', 20]]],
    ['Gamberetta 7', [['test/it-milano-1', 30], ['test/it-roma-1', 12]]],
    ['Krewetka_Wolna', [['test/pl-warszawa-1', 25], ['test/pl-krakow-1', 9]]],
    ['Gamba Feliz', [['test/es-madrid-1', 16], ['test/es-barcelona-1', 14]]],
    ['Prawn Pal', [['test/gb-london-1', 12], ['test/ie-dublin-1', 6]]],
    ['Zoé', [['test/be-bruxelles-1', 10], ['test/ch-geneve-1', 5]]],
    ['Mia-W', [['test/at-wien-1', 8], ['test/de-muenchen-1', 4]]],
  ];
  for (const [nickname, list] of seed) {
    const user = randomUUID();
    profiles.set(user, { nickname, blocked: false });
    list.forEach(([store, stickers], i) => entries.push({ id: nextId++, user, store, stickers, date: daysAgo(i % 6), hidden: false }));
  }
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const counted = () => entries.filter((e) => !e.hidden && !profiles.get(e.user)?.blocked);
const fail = (message, status = 400) => ({ status, body: { code: 'P0001', message, details: null, hint: null } });

function nicknameProblem(raw) {
  const n = (raw || '').trim();
  if (n.length < 3) return 'nickname_too_short';
  if (n.length > 20) return 'nickname_too_long';
  if (!/^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ſ _-]+$/.test(n)) return 'nickname_characters';
  if (/^[ _-]|[ _-]$|[ _-]{2}/.test(n)) return 'nickname_spacing';
  if (/\b(www|http|com|net|org)\b/i.test(n)) return 'nickname_link';
  if (/(lidl|kaufland|schwarz|icaw|admin|moderat|support|official|idiot)/i.test(norm(n))) return 'nickname_blocked';
  return null;
}

function ranking() {
  const totals = new Map();
  for (const e of counted()) totals.set(e.user, (totals.get(e.user) || 0) + e.stickers);
  return [...totals.entries()]
    .map(([user, total]) => ({ user, total, nickname: profiles.get(user)?.nickname }))
    .filter((r) => r.nickname)
    .sort((a, b) => b.total - a.total || a.nickname.localeCompare(b.nickname))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

const publicStore = (s) => ({ id: s.id, name: s.name, street: s.street, city: s.city, postcode: s.postcode, country: s.country });

const RPC = {
  public_totals() {
    const total = counted().reduce((a, e) => a + e.stickers, 0);
    return [{ total_stickers: total, shrimp_helped: total * PER, shrimp_per_sticker: PER }];
  },
  impact_settings: () => [{ ...SETTINGS, per_sticker: PER }],
  leaderboard: () => ranking().slice(0, 50).map(({ rank, nickname, total }) => ({ rank, nickname, total })),
  store_map() {
    const byStore = new Map();
    for (const e of counted()) byStore.set(e.store, (byStore.get(e.store) || 0) + e.stickers);
    return [...byStore.entries()].map(([id, total]) => {
      const s = stores.find((x) => x.id === id);
      return { store_id: id, lat: s.lat, lng: s.lng, street: s.street, city: s.city, total };
    });
  },
  search_stores({ q }) {
    const t = norm(q || '');
    if (t.length < 2) return [];
    return stores.filter((s) => norm([s.name, s.street, s.city, s.postcode].join(' ')).includes(t)).slice(0, 20).map(publicStore);
  },
  nearby_stores({ p_lat, p_lng }) {
    return stores
      .map((s) => ({ ...publicStore(s), km: Math.round(Math.hypot((s.lat - p_lat) * 111, (s.lng - p_lng) * 111 * Math.cos((p_lat * Math.PI) / 180)) * 10) / 10 }))
      .filter((s) => s.km < 60)
      .sort((a, b) => a.km - b.km)
      .slice(0, 10);
  },
  set_nickname({ nick }, user) {
    if (!user) return fail('not_signed_in');
    const problem = nicknameProblem(nick);
    if (problem) return fail(problem);
    const clean = nick.trim();
    for (const [id, p] of profiles) if (id !== user && norm(p.nickname) === norm(clean)) return fail('nickname_taken');
    const p = profiles.get(user);
    if (p?.blocked) return fail('blocked');
    profiles.set(user, { nickname: clean, blocked: false });
    return clean;
  },
  log_stickers({ p_store_id, p_stickers, p_date }, user) {
    if (!user) return fail('not_signed_in');
    if (!profiles.has(user)) return fail('no_nickname');
    if (!stores.some((s) => s.id === p_store_id)) return fail('unknown_store');
    if (!(p_stickers >= 1 && p_stickers <= 50)) return fail('stickers_range');
    if (p_date > today()) return fail('date_future');
    if (p_date < daysAgo(7)) return fail('date_too_old');
    const mineToday = entries.filter((e) => e.user === user && e.date === today());
    if (mineToday.length >= 10) return fail('limit_entries_per_day');
    if (mineToday.reduce((a, e) => a + e.stickers, 0) + p_stickers > 200) return fail('limit_stickers_per_day');
    const id = nextId++;
    entries.push({ id, user, store: p_store_id, stickers: p_stickers, date: p_date, hidden: false });
    return { id, shrimp_helped: p_stickers * PER };
  },
  my_rank(_args, user) {
    if (!user || !profiles.has(user)) return [];
    const me = ranking().find((r) => r.user === user);
    return [{ rank: me ? me.rank : null, total: me ? me.total : 0, nickname: profiles.get(user).nickname }];
  },
  my_entries(_args, user) {
    if (!user) return fail('not_signed_in');
    return entries
      .filter((e) => e.user === user)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .map((e) => {
        const s = stores.find((x) => x.id === e.store);
        return { id: e.id, stickers: e.stickers, entry_date: e.date, hidden: e.hidden, store_name: s.name, street: s.street, city: s.city };
      });
  },
  delete_my_entry({ p_id }, user) {
    const i = entries.findIndex((e) => e.id === p_id && e.user === user);
    if (i >= 0) entries.splice(i, 1);
    return null;
  },
  delete_my_data(_args, user) {
    for (let i = entries.length - 1; i >= 0; i--) if (entries[i].user === user) entries.splice(i, 1);
    profiles.delete(user);
    return null;
  },
  report_nickname({ nick }, user) {
    if (!user) return fail('not_signed_in');
    if (reports.filter((r) => r.by === user).length >= 20) return fail('limit_reports_per_day');
    reports.push({ by: user, nick });
    return null;
  },
};

// ---- Auth: anonymous sign-in only ----
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function session(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const access_token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user, role: 'authenticated', aud: 'authenticated', exp, is_anonymous: true })}.mock`;
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    refresh_token: `refresh-${user}`,
    user: { id: user, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {}, identities: [], created_at: new Date().toISOString() },
  };
}
function userFrom(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m || m[1].split('.').length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(m[1].split('.')[1], 'base64url').toString()).sub || null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-supabase-api-version, accept-profile, content-profile, prefer');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PATCH');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  const url = new URL(req.url, 'http://x');
  const send = (status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(data === undefined ? '' : JSON.stringify(data));
  };

  if (url.pathname.startsWith('/rest/v1/rpc/')) {
    const fn = url.pathname.split('/').pop();
    const handler = RPC[fn];
    if (!handler) return send(404, { message: 'not found' });
    const out = handler(body, userFrom(req));
    if (out && typeof out === 'object' && 'status' in out && 'body' in out) return send(out.status, out.body);
    return send(200, out);
  }
  if (url.pathname === '/auth/v1/signup' && req.method === 'POST') {
    if (!body?.gotrue_meta_security?.captcha_token) return send(400, { code: 400, error_code: 'captcha_failed', msg: 'captcha required' });
    return send(200, session(randomUUID()));
  }
  if (url.pathname === '/auth/v1/token') {
    const user = String(body.refresh_token || '').replace('refresh-', '');
    return user ? send(200, session(user)) : send(400, { msg: 'bad refresh' });
  }
  if (url.pathname === '/auth/v1/user') {
    const user = userFrom(req);
    return user ? send(200, session(user).user) : send(401, { msg: 'no user' });
  }
  if (url.pathname === '/auth/v1/logout') return send(204);
  send(404, { message: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => console.log(`mock supabase on http://127.0.0.1:${PORT}`));
