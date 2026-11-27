// Page counts with GoatCounter (no cookies, no personal data).
// The site uses hash routes (#/map), which GoatCounter would all count as "/", so
// automatic counting is turned off and each route is counted here as its own path:
// "/", "/how", "/map", "/leaderboard", "/about" and so on. A few actions are counted
// as events (for example "order-form-opened"); never anything a visitor typed.
// The script is added from code because the security policy forbids inline scripts.
// If it is blocked (for example by an ad blocker), nothing breaks and nothing is shown.

type GoatCounter = {
  no_onload?: boolean;
  count?: (vars: { path: string; title?: string; event?: boolean }) => void;
};
declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

const SCRIPT = 'https://gc.zgo.at/count.js';
const ENDPOINT = 'https://axelhovner.goatcounter.com/count';

let loaded = false;
let waiting: string | null = null; // a page view that happened before the script loaded
const waitingEvents: string[] = []; // events that happened before the script loaded

function send(path: string, event = false) {
  try {
    window.goatcounter?.count?.(event ? { path, title: path, event: true } : { path, title: document.title });
  } catch {
    /* counting must never break the site */
  }
}

// Call once at start. Does nothing in test builds.
export function startStats() {
  if (import.meta.env.MODE === 'test') return;
  window.goatcounter = { ...window.goatcounter, no_onload: true };
  const s = document.createElement('script');
  s.async = true;
  s.src = SCRIPT;
  s.dataset.goatcounter = ENDPOINT;
  s.addEventListener('load', () => {
    loaded = true;
    if (waiting) send(waiting);
    waiting = null;
    waitingEvents.splice(0).forEach((name) => send(name, true));
  });
  document.head.appendChild(s);
}

// Counts one page view. Call after the page title is set, once per route change.
export function countPage(route: string) {
  if (import.meta.env.MODE === 'test') return;
  if (loaded) send(route);
  else waiting = route;
}

// Counts one event, for example "order-form-opened". Only the fixed name is sent.
export function countEvent(name: string) {
  if (import.meta.env.MODE === 'test') return;
  if (loaded) send(name, true);
  else waitingEvents.push(name);
}
