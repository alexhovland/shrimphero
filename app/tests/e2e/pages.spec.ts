import { test, expect } from '@playwright/test';
import { stubOutside, watchCsp } from './helpers';

// Map and ranking share one page, "How we count" sits inside How it works,
// and the old links (#/leaderboard, #/about) open the right part.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'en-GB' });
test.beforeEach(async ({ page }) => stubOutside(page));

test('#/leaderboard opens the map page with the ranking in view', async ({ page }) => {
  const csp = watchCsp(page);
  await page.goto('./#/leaderboard');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Map and ranking');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#ranking table')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Leaderboard' })).toBeInViewport();
  await expect(page.getByRole('heading', { level: 2, name: 'Leaderboard' })).toBeFocused();
  await expect(page).toHaveTitle('Leaderboard · ShrimpHero');
  await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveAttribute('href', '#/map');
  expect(csp).toEqual([]);
});

test('#/about opens How it works with "How we count" in view', async ({ page }) => {
  await page.goto('./#/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How it works');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: 'How we count' })).toBeInViewport();
  await expect(page.getByRole('heading', { level: 2, name: 'How we count' })).toBeFocused();
  await expect(page).toHaveTitle('How we count · ShrimpHero');
  await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveAttribute('href', '#/how');
});

test('the bottom bar has 5 tabs, all on one line', async ({ page }) => {
  await page.goto('./#/');
  const tabs = page.locator('.tabbar a');
  await expect(tabs).toHaveCount(5);
  // Short visible word first, then the full label (WCAG 2.5.3, label in name).
  await expect(tabs.nth(1)).toHaveAttribute('aria-label', 'Guide – How it works');
  for (const label of await tabs.locator('span').all()) {
    const lines = await label.evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getClientRects().length;
    });
    expect(lines).toBe(1);
  }
});

test('"See the ranking" on the map page scrolls to the ranking', async ({ page }) => {
  await page.goto('./#/map');
  await page.locator('#ranking table').waitFor();
  await page.getByRole('button', { name: /See the ranking/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Leaderboard' })).toBeInViewport();
});
