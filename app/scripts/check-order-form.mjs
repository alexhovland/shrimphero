// Checks that the order form on #/stickers fits its frame (no big empty space under it).
// Run after any change to the form in Tally:
//   cd app && npm run check:form                                   (the live site)
//   cd app && npm run check:form -- http://127.0.0.1:4173/#/stickers   (a local preview)
// Opens the page in Chromium and WebKit at 375 and 1280 px, taps "Fill in the order form"
// and fails if no height arrives from the form, if the frame is more than 120 px taller
// than the height the form reported, or if there are console errors.
// It never types anything and never submits: every POST to tally.so is blocked.
import { chromium, webkit } from '@playwright/test';

const url = process.argv[2] || 'https://shrimphero.org/#/stickers';
const SLACK = 120;
let failed = 0;

for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await engine.launch();
  for (const width of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, locale: 'en-GB' });
    await ctx.route('https://tally.so/**', (r) => (r.request().method() === 'GET' ? r.continue() : r.abort()));
    // Page counts: answer with an empty script, so checks are not counted as visits.
    await ctx.route('https://gc.zgo.at/**', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || /Content Security Policy|Refused to/i.test(m.text())) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    let result;
    try {
      await page.goto(url);
      await page.locator('main h1').waitFor({ timeout: 20000 });
      await page.getByRole('button', { name: 'Fill in the order form' }).click();
      await page.locator('iframe.order-iframe').waitFor();
      const reported = await page
        .waitForFunction(() => document.querySelector('iframe.order-iframe')?.dataset.formHeight, null, { timeout: 20000 })
        .then((h) => h.jsonValue())
        .catch(() => null);
      await page.waitForTimeout(1000); // let the last resize settle
      const frame = await page.locator('iframe.order-iframe').evaluate((f) => Math.round(f.getBoundingClientRect().height));
      const height = reported === null ? null : Number(await page.locator('iframe.order-iframe').getAttribute('data-form-height'));
      if (height === null) result = `FAIL  no height arrived from the form (frame ${frame}px)`;
      else if (frame > height + SLACK) result = `FAIL  frame ${frame}px is more than ${SLACK}px taller than the form (${height}px)`;
      else if (errors.length) result = `FAIL  console errors: ${errors.join(' | ').slice(0, 300)}`;
      else result = `PASS  form ${height}px, frame ${frame}px`;
    } catch (e) {
      result = `FAIL  ${String(e.message || e).split('\n')[0]}`;
    }
    if (result.startsWith('FAIL')) failed++;
    console.log(`${name.padEnd(8)} ${String(width).padStart(4)}px  ${result}`);
    await ctx.close();
  }
  await browser.close();
}
console.log(failed ? `${failed} check(s) failed for ${url}` : `All checks passed for ${url}`);
process.exit(failed ? 1 : 0);
