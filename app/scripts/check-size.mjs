// Prints how much JavaScript a first visit downloads (gzipped) and fails above 150 KB.
// Run after "npm run build":  node scripts/check-size.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const gz = (f) => gzipSync(readFileSync(`dist/${f}`)).length / 1024;
const html = readFileSync('dist/index.html', 'utf8');
const entry = [...new Set([...html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.js)"/g)].map((m) => m[1]))];
// A visitor whose browser is not in English also loads one language file at start.
const langs = readdirSync('dist/assets').filter((f) => /^(fr|de|it|pl|es)-[\w-]+\.js$/.test(f));
const biggestLang = Math.max(0, ...langs.map((f) => gz(`assets/${f}`)));

let total = 0;
for (const f of entry) {
  total += gz(f);
  console.log(`${f}: ${gz(f).toFixed(1)} KB`);
}
console.log(`Largest language file: ${biggestLang.toFixed(1)} KB`);
total += biggestLang;
console.log(`First load JavaScript, worst case: ${total.toFixed(1)} KB gzipped (limit 150 KB)`);
if (total > 150) process.exit(1);
