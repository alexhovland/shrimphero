import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES, routeName, stubOutside, watchCsp } from './helpers';

const SIZES = [
  { name: '390', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: '1280', viewport: { width: 1280, height: 800 }, isMobile: false },
];

test.beforeEach(async ({ page }) => stubOutside(page));

for (const size of SIZES) {
  test.describe(`${size.name}px`, () => {
    test.use({ viewport: size.viewport, isMobile: size.isMobile, locale: 'en-GB', reducedMotion: 'reduce' });

    for (const route of ROUTES) {
      test(`${routeName(route)}: no serious accessibility issues, no CSP errors, no sideways scroll`, async ({ page }) => {
        const csp = watchCsp(page);
        await page.goto(`./#${route}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.waitForLoadState('networkidle');
        if (route === '/map') await page.locator('.pin').first().waitFor();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        expect(csp).toEqual([]);
      });
    }
  });
}

test('sticker downloads exist for all nine languages', async ({ page, request }) => {
  await page.goto('./#/stickers');
  await page.getByRole('heading', { name: 'Get stickers' }).waitFor();
  const options = await page.getByLabel('Sticker language').locator('option').allTextContents();
  expect(options).toHaveLength(9);
  for (const value of await page.getByLabel('Sticker language').locator('option').evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value))) {
    await page.getByLabel('Sticker language').selectOption(value);
    const href = await page.getByRole('link', { name: 'Download sticker' }).getAttribute('href');
    const res = await request.get(new URL(href!, page.url()).toString());
    expect(res.status(), href!).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  }
});

test.describe('signed-in screens', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, locale: 'en-GB', reducedMotion: 'reduce' });

  test('thank-you, My stickers and report confirm have no serious accessibility issues', async ({ page }) => {
    const csp = watchCsp(page);
    const scan = async () => {
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      return r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id);
    };
    await page.goto('./#/log');
    await page.getByRole('combobox', { name: 'Lidl store' }).fill('Wien');
    await page.getByRole('listbox').getByRole('option').first().click();
    await page.getByLabel('Your nickname').fill('Axe Check');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('heading', { name: 'Saved' }).waitFor();
    expect(await scan()).toEqual([]);

    await page.goto('./#/me');
    await page.getByRole('button', { name: /Delete the entry/ }).waitFor();
    await page.getByRole('button', { name: /Delete the entry/ }).click();
    expect(await scan()).toEqual([]);
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByRole('button', { name: /Delete the entry/ })).toHaveCount(0);

    await page.goto('./#/leaderboard');
    await page.getByRole('button', { name: 'Report the nickname Prawn Pal' }).click();
    expect(await scan()).toEqual([]);
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page.getByText('Reported. Thanks.')).toBeVisible();

    await page.goto('./#/me');
    await page.getByRole('button', { name: 'Delete everything' }).click();
    await page.getByRole('group', { name: /Sure/ }).getByRole('button', { name: 'Delete everything' }).click();
    await expect(page.getByText('All your data is deleted.')).toBeVisible();
    expect(csp).toEqual([]);
  });
});
