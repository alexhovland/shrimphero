import type { Page } from '@playwright/test';

// Cloudflare Turnstile and OpenFreeMap are replaced by stand-ins in tests.
const TURNSTILE_STUB = `window.turnstile = {
  render: function (el, o) { setTimeout(function () { o.callback('test-token'); }, 50); return 'w1'; },
  reset: function () {}, remove: function () {}
};`;
const MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e9e5dc' } }],
};

export async function stubOutside(page: Page) {
  await page.route('https://challenges.cloudflare.com/**', (r) =>
    r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }),
  );
  await page.route('https://tiles.openfreemap.org/**', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(MAP_STYLE) }),
  );
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
