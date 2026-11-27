import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

// Cloudflare Turnstile, OpenFreeMap and the Tally order form are replaced by stand-ins
// in tests, so nothing reaches them (and no order is ever sent).

// The Tally stand-in acts like the real form: it runs the child part of iframe-resizer
// and reports its height once the page starts the resizer. Its content is exactly
// FORM_HEIGHT px tall; tests can change it through the #box element.
// "silent" is a form that never reports a height.
export const FORM_HEIGHT = 1234;
const CHILD = readFileSync(join(process.cwd(), 'node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const TALLY_FORM = `<!doctype html><html lang="en"><title>Order form</title>
<body style="margin:0"><div id="box" style="height:${FORM_HEIGHT}px">Test form</div><script>${CHILD}</script></body></html>`;
const TALLY_SILENT = '<!doctype html><html lang="en"><title>Order form</title><body style="margin:0"><div style="height:2000px">Test form</div></body></html>';
const TURNSTILE_STUB = `window.turnstile = {
  render: function (el, o) { setTimeout(function () { o.callback('test-token'); }, 50); return 'w1'; },
  reset: function () {}, remove: function () {}
};`;
const MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9e5dc' } }],
};

export async function stubOutside(page: Page, { tally = 'form' }: { tally?: 'form' | 'silent' } = {}) {
  await page.route('https://challenges.cloudflare.com/**', (r) =>
    r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }),
  );
  await page.route('https://tiles.openfreemap.org/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(MAP_STYLE) }),
  );
  const body = tally === 'form' ? TALLY_FORM : TALLY_SILENT;
  await page.route('https://tally.so/**', (r) => r.fulfill({ contentType: 'text/html', body }));
}

// Collects Content-Security-Policy violations reported by the browser.
export function watchCsp(page: Page): string[] {
  const found: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to (load|execute|apply|connect|frame|create)/i.test(m.text())) found.push(m.text());
  });
  return found;
}

export const ROUTES = ['/', '/how', '/log', '/map', '/leaderboard', '/me', '/stickers', '/about', '/privacy'] as const;
export const routeName = (r: string) => (r === '/' ? 'home' : r.slice(1));
