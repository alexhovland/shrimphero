// Builds supabase/seed/stores.csv: every Lidl shop in the campaign countries,
// from OpenStreetMap (brand:wikidata=Q151954), through the public Overpass API.
//
// Run with Node 20 or newer:   node scripts/fetch-stores.mjs
// The GitHub workflow "Refresh Lidl stores" runs it for you.
//
// Data © OpenStreetMap contributors, available under the ODbL.
// The site must show "© OpenStreetMap contributors" wherever stores appear.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.STORES_OUT || resolve(ROOT, 'supabase/seed/stores.csv');
const COUNTRIES = ['FR', 'DE', 'IT', 'PL', 'ES', 'GB', 'IE', 'BE', 'CH', 'AT'];
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
// For testing without network: a folder with one <COUNTRY>.json Overpass answer per country.
const FIXTURES = process.env.OVERPASS_FIXTURES;

const query = (cc) => `[out:json][timeout:300];
area["ISO3166-1"="${cc}"][admin_level=2]->.country;
nwr["brand:wikidata"="Q151954"]["shop"](area.country);
out center tags;`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(cc) {
  if (FIXTURES) return JSON.parse(await readFile(resolve(FIXTURES, `${cc}.json`), 'utf8'));
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ShrimpHero store list (campaign site)' },
        body: new URLSearchParams({ data: query(cc) }),
      });
      if (res.ok) return await res.json();
      lastError = new Error(`${url} answered ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await sleep(15000 * (attempt + 1));
  }
  throw lastError;
}

const clean = (v) => (v == null ? '' : String(v).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim());

function toRow(el, cc) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;
  if (t['disused:shop'] || t['was:shop'] || t.shop === 'vacant') return null;
  const street = [t['addr:street'] || t['addr:place'], t['addr:housenumber']].filter(Boolean).join(' ');
  // House number first in FR, GB, IE, BE (French part) style addresses.
  const streetLocal = ['FR', 'GB', 'IE'].includes(cc) && t['addr:housenumber'] && t['addr:street']
    ? `${t['addr:housenumber']} ${t['addr:street']}`
    : street;
  const city = t['addr:city'] || t['addr:town'] || t['addr:village'] || t['addr:municipality'] || t['addr:suburb'] || t['addr:hamlet'] || '';
  return {
    id: `${el.type}/${el.id}`,
    name: clean(t.name || t.brand || 'Lidl'),
    street: clean(streetLocal),
    city: clean(city),
    postcode: clean(t['addr:postcode']),
    country: cc,
    lat: Number(lat).toFixed(6),
    lng: Number(lng).toFixed(6),
  };
}

const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

async function main() {
  const rows = new Map();
  for (const cc of COUNTRIES) {
    const data = await overpass(cc);
    let n = 0;
    for (const el of data.elements || []) {
      const row = toRow(el, cc);
      if (row && !rows.has(row.id)) {
        rows.set(row.id, row);
        n++;
      }
    }
    console.log(`${cc}: ${n} stores`);
    if (!FIXTURES) await sleep(5000); // be gentle with the free Overpass servers
  }
  const header = ['id', 'name', 'street', 'city', 'postcode', 'country', 'lat', 'lng'];
  const sorted = [...rows.values()].sort((a, b) => a.country.localeCompare(b.country) || a.city.localeCompare(b.city) || a.id.localeCompare(b.id));
  const csv = [header.join(','), ...sorted.map((r) => header.map((h) => csvCell(String(r[h]))).join(','))].join('\n') + '\n';
  if (sorted.length < 100 && !FIXTURES) throw new Error(`Only ${sorted.length} stores found: something went wrong, keeping the old file.`);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, csv);
  console.log(`Wrote ${sorted.length} stores to ${OUT}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
