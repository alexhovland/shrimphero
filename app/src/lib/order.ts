import { ORDER_FORM_DEFAULT, ORDER_FORM_LINKS } from '../site-config';
import { safeStorage } from './format';

// The sticker order form for a language, or '' when ordering is not open yet.
// The site only links to the form: no address or email ever reaches this site.
export function orderFormFor(lang: string): string {
  // Test builds only (npm run test:e2e): the tests set a link here to check both states.
  // In the real build this branch is removed, because the mode is known at build time.
  if (import.meta.env.MODE === 'test') {
    const testLink = safeStorage('shrimphero-test-order-form');
    if (testLink !== null) return testLink;
  }
  return ORDER_FORM_LINKS[lang] || ORDER_FORM_DEFAULT || '';
}
