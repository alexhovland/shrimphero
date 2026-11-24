import { test } from '@playwright/test';
import { ROUTES, routeName, stubOutside } from './helpers';

// Screenshots of every screen at 390 and 1280 px, saved in ../screenshots.
// The numbers and nicknames are test data from tests/mock-server.mjs.
const OUT = '../screenshots';
const SIZES = [
  { name: '390', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: '1280', viewport: { width: 1280, height: 800 }, isMobile: false },
];

for (const size of SIZES) {
  test(`screenshots at ${size.name}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: size.viewport,
      isMobile: size.isMobile,
      deviceScaleFactor: 2,
      locale: 'en-GB',
      reducedMotion: 'reduce',
      geolocation: { latitude: 45.76, longitude: 4.84 },
      permissions: ['geolocation'],
      bypassCSP: true, // only so the screenshot style below applies; CSP is tested in screens.spec.ts
    });
    const page = await context.newPage();
    await stubOutside(page);
    // Full-page screenshots: draw the phone tab bar at the end of the page
    // instead of floating halfway down the image.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = '.tabbar{position:static}';
        document.head.appendChild(s);
      });
    });

    // First log stickers, so "My stickers" and the thank-you screen have content.
    await page.goto('./#/log');
    await page.getByRole('button', { name: 'Use my location' }).click();
    await page.getByRole('listbox').getByRole('option').first().waitFor();
    await page.screenshot({ path: `${OUT}/log-search-${size.name}.png`, fullPage: true });
    await page.getByRole('listbox').getByRole('option').first().click();
    await page.getByRole('spinbutton').fill('12');
    await page.getByLabel('Your nickname').fill(`Sticker Fan ${size.name}`);
    await page.screenshot({ path: `${OUT}/log-form-${size.name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('heading', { name: 'Saved' }).waitFor();
    await page.screenshot({ path: `${OUT}/log-saved-${size.name}.png`, fullPage: true });

    for (const route of ROUTES) {
      if (route === '/log') continue;
      await page.goto(`./#${route}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForLoadState('networkidle');
      if (route === '/map') {
        await page.locator('.pin').first().waitFor();
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: `${OUT}/${routeName(route)}-${size.name}.png`, fullPage: true });
    }
    await context.close();
  });
}
