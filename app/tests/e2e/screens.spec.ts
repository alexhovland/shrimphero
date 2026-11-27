import { test, expect, type Page } from '@playwright/test';
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

// The order form (Tally). Test builds only: "shrimphero-test-order-form" sets the
// form id ('' = no form; see src/lib/order.ts). tally.so itself is a stand-in page.
const setFormId = (page: Page, id: string) =>
  page.addInitScript((v) => localStorage.setItem('shrimphero-test-order-form', v), id);

test.describe('Get stickers', () => {
  test.use({ locale: 'en-GB', viewport: { width: 390, height: 844 }, isMobile: true });

  test('without a form id it says ordering opens soon: no button, no form, no link', async ({ page }) => {
    await setFormId(page, '');
    await page.goto('./#/stickers');
    await expect(page.getByRole('heading', { level: 1, name: 'Order stickers' })).toBeVisible();
    await expect(page.getByText('Ordering opens soon.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fill in the order form' })).toHaveCount(0);
    await expect(page.locator('main iframe')).toHaveCount(0);
    await expect(page.locator('main a[href*="tally.so"]')).toHaveCount(0);
    await expect(page.locator('main a[download], main select')).toHaveCount(0);
  });

  test('with a form id it loads the form only after the tap', async ({ page }) => {
    await setFormId(page, 'TestForm1');
    const tally: string[] = [];
    page.on('request', (r) => {
      if (r.url().startsWith('https://tally.so/')) tally.push(r.url());
    });
    await page.goto('./#/stickers');
    await expect(page.getByRole('heading', { level: 2, name: 'Order form' })).toBeVisible();
    const newTab = page.getByRole('link', { name: /Open the form in a new tab/ });
    await expect(newTab).toHaveAttribute('href', 'https://tally.so/r/TestForm1');
    await expect(newTab).toHaveAttribute('target', '_blank');
    await expect(newTab).toHaveAttribute('rel', 'noopener noreferrer');
    await page.waitForLoadState('networkidle');
    expect(tally).toEqual([]);

    await page.getByRole('button', { name: 'Fill in the order form' }).click();
    const frame = page.locator('main iframe');
    await expect(frame).toHaveCount(1);
    const src = (await frame.getAttribute('src'))!;
    expect(src.startsWith('https://tally.so/embed/')).toBe(true);
    for (const link of [src, (await newTab.getAttribute('href'))!]) expect(link).not.toContain('lang=');
    await expect(page.getByText('Ordering opens soon.')).toHaveCount(0);
  });

  test('in German it explains that the form is in English and lists its questions', async ({ page }) => {
    await setFormId(page, 'TestForm1');
    await page.addInitScript(() => localStorage.setItem('shrimphero-lang', 'de'));
    await page.goto('./#/stickers');
    await expect(page.getByText('Das Formular ist auf Englisch. Das wird gefragt:')).toBeVisible();
    await expect(page.locator('.form-help li')).toHaveCount(7);
    await expect(page.locator('.form-help li').first()).toHaveText('Für wen du bestellst: dich, deine Ortsgruppe oder andere');
  });

  test('in English there is no "form is in English" line', async ({ page }) => {
    await setFormId(page, 'TestForm1');
    await page.goto('./#/stickers');
    await expect(page.getByRole('button', { name: 'Fill in the order form' })).toBeVisible();
    await expect(page.locator('.form-help')).toHaveCount(0);
    await expect(page.getByText('The form is in English')).toHaveCount(0);
  });
});

test('How it works has no subtitle and one h1', async ({ page }) => {
  await page.goto('./#/how');
  await expect(page.getByRole('heading', { level: 1, name: 'How it works' })).toBeVisible();
  await expect(page.getByText('Simple actions, big impact.')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
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
