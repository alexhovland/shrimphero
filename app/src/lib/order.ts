import { ORDER_FORM_ID_DEFAULT, ORDER_FORM_IDS } from '../site-config';
import { safeStorage } from './format';

export const TALLY_ORIGIN = 'https://tally.so';
const VALID_ID = /^[A-Za-z0-9]{4,20}$/;

export type OrderForm = {
  embed: string; // shown in the iframe on the Order stickers page
  share: string; // the plain link, for "Open the form in a new tab"
};

// The sticker order form for a language, or null when ordering is not open yet
// (no id set, or an id that does not look like a Tally form id).
// The site only shows or links to the form: nothing typed in it reaches this site.
// The links carry nothing about the visitor.
export function orderFormFor(lang: string): OrderForm | null {
  let id = ORDER_FORM_IDS[lang] || ORDER_FORM_ID_DEFAULT || '';
  // Test builds only (npm run test:e2e): the tests set a form id here ('' = no form).
  // In the real build this branch is removed, because the mode is known at build time.
  if (import.meta.env.MODE === 'test') {
    const testId = safeStorage('shrimphero-test-order-form');
    if (testId !== null) id = testId;
  }
  if (!VALID_ID.test(id)) return null;

  const embed = new URL(`/embed/${id}`, TALLY_ORIGIN);
  // No dynamicHeight: without Tally's own script the form does not report its height,
  // so the page gives the iframe a fixed height (see .order-iframe in styles.css).
  embed.search = new URLSearchParams({ alignLeft: '1', hideTitle: '1', transparentBackground: '1' }).toString();
  const share = new URL(`/r/${id}`, TALLY_ORIGIN);
  return { embed: embed.toString(), share: share.toString() };
}
