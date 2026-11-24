// Adds town and village names to supabase/seed/stores.csv, so people can find a store
// by typing their town or village.
//
// Many shops in OpenStreetMap have coordinates but no city. For those, this fills in
// the nearest inhabited place. It also writes an "area" column: the towns and villages
// for which this store is one of the 3 nearest Lidl shops (within 20 km).
//
// Place names come from GeoNames (https://www.geonames.org/), CC BY 4.0.
// It reads the per-country dumps (<CC>.txt from https://download.geonames.org/export/dump/<CC>.zip)
// from the folder in GEONAMES_DIR. A missing country is skipped with a warning.
//
// Run with Node 20 or newer:   GEONAMES_DIR=/path/to/txt node scripts/add-places.mjs

import { createReadStream, existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = process.env.STORES_OUT || resolve(ROOT, 'supabase/seed/stores.csv');
const DIR = process.env.GEONAMES_DIR;
const COUNTRIES = ['FR', 'DE', 'IT', 'PL', 'ES', 'GB', 'IE', 'BE', 'CH', 'AT'];

const NEAREST = 3; // each place is listed on its 3 nearest stores
const AREA_KM = 20; // ... if they are within 20 km
const CITY_KM = 5; // a store with no city gets the nearest inhabited place within 5 km
// Populated places, without historical, abandoned, destroyed or sub-city sections.
const SKIP_CODES = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLCH', 'PPLX']);

// ---- CSV ----
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// ---- distance and a simple grid index ----
const CELL = 0.25; // degrees
const key = (lat, lng) => `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;
function km(aLat, aLng, bLat, bLng) {
  const x = (bLng - aLng) * Math.cos(((aLat + bLat) / 2) * Math.PI / 180);
  return 111.2 * Math.sqrt(x * x + (bLat - aLat) ** 2);
}
function makeGrid(items) {
  const grid = new Map();
  for (const it of items) {
    const k = key(it.lat, it.lng);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(it);
  }
  return grid;
}
// Everything within maxKm of a point, nearest first.
function near(grid, lat, lng, maxKm) {
  const rLat = Math.ceil(maxKm / 111.2 / CELL);
  const rLng = Math.ceil(maxKm / (111.2 * Math.max(0.2, Math.cos(lat * Math.PI / 180))) / CELL);
  const cLat = Math.floor(lat / CELL), cLng = Math.floor(lng / CELL);
  const out = [];
  for (let i = -rLat; i <= rLat; i++) {
    for (let j = -rLng; j <= rLng; j++) {
      for (const it of grid.get(`${cLat + i}:${cLng + j}`) || []) {
        const d = km(lat, lng, it.lat, it.lng);
        if (d <= maxKm) out.push([d, it]);
      }
    }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

async function loadPlaces(cc) {
  const file = resolve(DIR, `${cc}.txt`);
  if (!existsSync(file)) {
    console.warn(`::warning::No GeoNames file for ${cc}, skipping its place names.`);
    return [];
  }
  const places = [];
  const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity });
  for await (const line of lines) {
    const f = line.split('\t');
    if (f[6] !== 'P' || SKIP_CODES.has(f[7])) continue;
    const name = f[1].trim();
    if (!name) continue;
    places.push({ name, lat: Number(f[4]), lng: Number(f[5]), population: Number(f[14]) || 0 });
  }
  return places;
}

async function main() {
  if (!DIR) throw new Error('Set GEONAMES_DIR to the folder holding the GeoNames <CC>.txt files.');
  const [header, ...data] = parseCsv(await readFile(FILE, 'utf8')).filter((r) => r.length > 1);
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const stores = data.map((r) => ({
    row: Object.fromEntries(header.map((h) => [h, r[col[h]] ?? ''])),
    lat: Number(r[col.lat]),
    lng: Number(r[col.lng]),
    area: [],
  }));
  const storeGrid = makeGrid(stores);

  let places = [];
  for (const cc of COUNTRIES) {
    const p = await loadPlaces(cc);
    console.log(`${cc}: ${p.length} places`);
    places = places.concat(p);
  }
  if (!places.length) {
    console.warn('::warning::No place names loaded. The store list is saved without them.');
  }
  const placeGrid = makeGrid(places);

  // 1. Fill in a missing city: the nearest place with people living there, else the nearest place.
  let filled = 0;
  for (const s of stores) {
    if (s.row.city) continue;
    const around = near(placeGrid, s.lat, s.lng, CITY_KM);
    const best = (around.find(([, p]) => p.population > 0) || around[0])?.[1];
    if (best) { s.row.city = best.name; filled++; }
  }

  // 2. List each place on its nearest stores.
  for (const p of places) {
    for (const [, s] of near(storeGrid, p.lat, p.lng, AREA_KM).slice(0, NEAREST)) s.area.push(p.name);
  }

  const outHeader = [...header.filter((h) => h !== 'area'), 'area'];
  const lines = [outHeader.join(',')];
  for (const s of stores) {
    const city = s.row.city.toLowerCase();
    const seen = new Set([city]);
    const area = s.area.filter((n) => { const k = n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    s.row.area = area.join(', ');
    lines.push(outHeader.map((h) => csvCell(String(s.row[h] ?? ''))).join(','));
  }
  await writeFile(FILE, lines.join('\n') + '\n');
  const withArea = stores.filter((s) => s.row.area).length;
  console.log(`Filled in ${filled} missing cities. ${withArea} of ${stores.length} stores have nearby place names.`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
