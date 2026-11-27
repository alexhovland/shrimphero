import { test, expect, type Page } from '@playwright/test';
import { FORM_HEIGHT, stubOutside } from './helpers';

// The order form's frame follows the form's own height, so there is never a big
// empty space under it. tally.so is a stand-in page (see helpers.ts); nothing is sent.
test.use({ locale: 'en-GB', viewport: { width: 390, height: 844 }, isMobile: true });

const frameHeight = (page: Page) =>
  page.locator('main iframe').evaluate((f) => Math.round(f.getBoundingClientRect().height));

async function openForm(page: Page) {
  // Test builds only: a form id for the stand-in (see src/lib/order.ts).
  await page.addInitScript(() => localStorage.setItem('shrimphero-test-order-form', 'TestForm1'));
  await page.goto('./#/stickers');
  await page.getByRole('button', { name: 'Fill in the order form' }).click();
  await page.locator('main iframe').waitFor();
}

// Changes the height of the stand-in form's content.
const setFormHeight = (page: Page, px: number) =>
  page.frameLocator('main iframe').locator('#box').evaluate((el, h) => { el.style.height = `${h}px`; }, px);

test('the frame takes the form\'s height, with no empty gap under it', async ({ page }) => {
  await stubOutside(page);
  await openForm(page);
  await expect.poll(() => frameHeight(page)).toBeGreaterThan(FORM_HEIGHT - 40);
  expect(Math.abs((await frameHeight(page)) - FORM_HEIGHT)).toBeLessThanOrEqual(40);
  const gap = await page.evaluate(() => {
    const frame = document.querySelector('main iframe')!.getBoundingClientRect();
    const link = document.querySelector('.new-tab-link')!.getBoundingClientRect();
    return link.top - frame.bottom;
  });
  expect(gap).toBeLessThan(60);
});

test('the frame follows the form when it grows and shrinks', async ({ page }) => {
  await stubOutside(page);
  await openForm(page);
  await expect.poll(() => frameHeight(page)).toBeGreaterThan(FORM_HEIGHT - 40);
  await setFormHeight(page, 1800);
  await expect.poll(async () => Math.abs((await frameHeight(page)) - 1800)).toBeLessThanOrEqual(40);
  await setFormHeight(page, 400); // like Tally's short thank-you after sending
  await expect.poll(async () => Math.abs((await frameHeight(page)) - 400)).toBeLessThanOrEqual(40);
});

test('a form that never reports its height gets no taller than the screen, and scrolls', async ({ page }) => {
  await stubOutside(page, { tally: 'silent' });
  await openForm(page);
  await page.waitForTimeout(7000);
  const viewport = page.viewportSize()!.height;
  expect(await frameHeight(page)).toBeLessThanOrEqual(viewport);
  await expect(page.locator('main iframe')).not.toHaveAttribute('scrolling', 'no');
});

test('height messages from another origin or another window are ignored', async ({ page }) => {
  await stubOutside(page);
  await openForm(page);
  await expect.poll(() => frameHeight(page)).toBeGreaterThan(FORM_HEIGHT - 40);
  const id = (await page.locator('main iframe').getAttribute('id'))!;
  const fake = `[iFrameSizer]${id}:99999:300:resize`;

  // From the page itself (another origin than tally.so).
  await page.evaluate((m) => window.postMessage(m, '*'), fake);
  // From another window on tally.so: a second, unrelated frame.
  await page.evaluate(() => {
    const other = document.createElement('iframe');
    other.id = 'other-tally-frame';
    other.src = 'https://tally.so/embed/Other?x=1';
    document.body.appendChild(other);
  });
  const other = page.frameLocator('#other-tally-frame');
  await other.locator('body').waitFor();
  await other.locator('body').evaluate((_, m) => window.parent.postMessage(m, '*'), fake);

  await page.waitForTimeout(800);
  expect(Math.abs((await frameHeight(page)) - FORM_HEIGHT)).toBeLessThanOrEqual(40);
});
