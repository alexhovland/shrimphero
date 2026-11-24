import { test, expect } from '@playwright/test';
import { stubOutside, watchCsp } from './helpers';

// Logging stickers on a phone-size screen, in several languages.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }) => stubOutside(page));

test.describe('English', () => {
  test.use({ locale: 'en-GB' });

  test('logs stickers and links the English petition', async ({ page }) => {
    const csp = watchCsp(page);
    await page.goto('./#/log');
    await page.getByRole('combobox', { name: 'Lidl store' }).fill('Lyon');
    await page.getByRole('option', { name: /Lyon/ }).first().click();
    await page.getByRole('button', { name: 'One more' }).click();
    await page.getByRole('button', { name: 'One more' }).click();
    await page.getByLabel('Your nickname').fill('Test Shrimp EN');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible();
    await expect(page.getByText("3 stickers. That's about 300 shrimp helped per year.")).toBeVisible();
    await expect(page.getByRole('link', { name: /Sign the petition/ })).toHaveAttribute('href', 'https://lidlshrimp.com/');

    await page.getByRole('link', { name: 'Mine' }).click();
    await expect(page.getByText('Test Shrimp EN')).toBeVisible();
    await expect(page.getByText(/3 stickers · rank #\d+/)).toBeVisible();
    expect(csp).toEqual([]);
  });

  test('refuses a reserved nickname with a clear message', async ({ page }) => {
    await page.goto('./#/log');
    await page.getByRole('combobox', { name: 'Lidl store' }).fill('Berlin');
    await page.getByRole('listbox').getByRole('option').first().click();
    await page.getByLabel('Your nickname').fill('Lidl Admin');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Please pick another nickname.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Saved' })).toHaveCount(0);
  });

  test('asks for a store before saving', async ({ page }) => {
    await page.goto('./#/log');
    await page.getByLabel('Your nickname').fill('Someone New');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Pick a store first.')).toBeVisible();
  });
});

test.describe('French', () => {
  test.use({ locale: 'fr-FR' });

  test('déclare des autocollants et renvoie vers la pétition française', async ({ page }) => {
    const csp = watchCsp(page);
    await page.goto('./#/log');
    await expect(page.getByRole('heading', { name: 'Déclarer vos autocollants' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Magasin Lidl' }).fill('paris');
    await page.getByRole('option', { name: /Paris/ }).first().click();
    await page.getByRole('button', { name: 'Un de plus' }).click();
    await page.getByRole('button', { name: 'Un de plus' }).click();
    await page.getByLabel('Votre pseudo').fill('Crevette Test');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page.getByRole('heading', { name: 'Enregistré' })).toBeVisible();
    await expect(page.getByText('3 autocollants. Environ 300 crevettes aidées par an.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Signer la pétition/ })).toHaveAttribute('href', 'https://lidlcrevettes.com/');
    expect(csp).toEqual([]);
  });
});

test.describe('Polish', () => {
  test.use({ locale: 'pl-PL' });

  test('uses Polish plural forms', async ({ page }) => {
    await page.goto('./#/log');
    await page.getByRole('combobox', { name: 'Sklep Lidl' }).fill('Kraków');
    await page.getByRole('listbox').getByRole('option').first().click();
    await page.getByRole('spinbutton').fill('5');
    await page.getByLabel('Twój pseudonim').fill('Krewetka Test');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByText('5 naklejek. To około 500 krewetek, którym pomagasz rocznie.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Podpisz petycję/ })).toHaveAttribute('href', 'https://lidlkrewetki.pl/');
  });
});

test.describe('Language switch', () => {
  test.use({ locale: 'en-GB' });

  test('switches language and remembers it', async ({ page }) => {
    await page.goto('./');
    await page.getByLabel('Language').selectOption('de');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aufkleber');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aufkleber');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
