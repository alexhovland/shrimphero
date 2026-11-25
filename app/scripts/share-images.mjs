// Renders the sharing preview (public/og.png, 1200 × 630) and the phone home-screen
// icon (public/apple-touch-icon.png, 180 × 180) from plain HTML with Playwright,
// using the site's own font and mascot. Run after changing either:
//   cd app && node scripts/share-images.mjs
// The PNGs are saved with no metadata (only the chunks needed to show the image).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const font = readFileSync(resolve(APP, 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2')).toString('base64');
const mascot = readFileSync(resolve(APP, 'src/assets/mascot.svg'), 'utf8');

const base = `
  @font-face { font-family: 'Bricolage'; font-weight: 200 800; src: url(data:font/woff2;base64,${font}) format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Bricolage', sans-serif; font-optical-sizing: auto; }
  svg { display: block; width: 100%; height: auto; }`;

const og = `<!doctype html><meta charset="utf-8"><style>${base}
  body { width: 1200px; height: 630px; background: #f5f1e8; color: #16181b; display: flex; align-items: center; gap: 40px; padding: 0 72px; }
  .text { flex: 1; }
  h1 { font-weight: 800; font-size: 116px; line-height: 1; letter-spacing: -0.03em; }
  p { margin-top: 28px; font-weight: 700; font-size: 46px; line-height: 1.15; letter-spacing: -0.01em; }
  .shrimp { flex: none; width: 420px; color: #0050aa; }
  .shrimp svg { stroke-width: 3.5; }
</style><body><div class="text"><h1>ShrimpHero</h1><p>Stick it. Log it.<br>Help the shrimp.</p></div><div class="shrimp">${mascot}</div></body>`;

const icon = `<!doctype html><meta charset="utf-8"><style>${base}
  body { width: 180px; height: 180px; background: #0050aa; color: #ffffff; display: flex; align-items: center; justify-content: center; }
  .shrimp { width: 150px; }
  .shrimp svg { stroke-width: 5; }
</style><body><div class="shrimp">${mascot}</div></body>`;

// Keep only the chunks needed to draw the picture: no text, dates, colour profiles or other metadata.
function stripPng(buf) {
  const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);
  const parts = [buf.subarray(0, 8)];
  for (let p = 8; p < buf.length; ) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const end = p + 12 + len;
    if (keep.has(type)) parts.push(buf.subarray(p, end));
    p = end;
  }
  return Buffer.concat(parts);
}

const browser = await chromium.launch();
for (const [html, w, h, out] of [[og, 1200, 630, 'public/og.png'], [icon, 180, 180, 'public/apple-touch-icon.png']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = stripPng(await page.screenshot({ type: 'png' }));
  writeFileSync(resolve(APP, out), png);
  console.log(`${out}: ${w} × ${h}, ${(png.length / 1024).toFixed(1)} KB`);
  await page.close();
}
await browser.close();
