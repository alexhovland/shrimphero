# ShrimpHero

A small website where volunteers log the campaign stickers they put on shrimp boxes in Lidl stores. People see the total, a map of stores with stickers, and a leaderboard of nicknames. No account, no email, no tracking.

The step-by-step launch guide is in [LAUNCH-GUIDE.md](LAUNCH-GUIDE.md). This file explains what is in the folder, how it works, and the choices made while building it.

## What is in this folder

| Folder or file | What it is |
| --- | --- |
| `app/` | The website: React, Vite and TypeScript. |
| `app/src/site-config.ts` | **Edit before launch.** Contact email, optional postal address, host, petition links, sticker list. |
| `app/src/i18n/` | All interface text, one file per language (en, fr, de, it, pl, es). |
| `app/src/assets/mascot.svg` | The shrimp mascot. Currently a placeholder drawing (see below). |
| `app/public/stickers/` | The nine sticker PNGs people can download. Metadata removed. |
| `app/tests/` | Automatic browser tests and a fake database used only by those tests. |
| `supabase/migrations/` | The database, in six numbered SQL files. Paste them into Supabase in order. |
| `supabase/tests/security.sql` | A check that tries to break every database rule. Must print "all checks passed". |
| `supabase/seed/stores.csv` | The Lidl store list. Empty until you run the "Refresh Lidl stores" workflow once (see below). |
| `supabase/local/` | Only for developers testing on their own computer. Never run it in Supabase. |
| `scripts/fetch-stores.mjs` | Downloads Lidl stores from OpenStreetMap and writes `stores.csv`. |
| `scripts/clean-svg.mjs` | Cleans an SVG (removes metadata and editor data) before you add it to the site. |
| `.github/workflows/` | Two automatic jobs on GitHub: publish the site, and refresh the store list. |
| `SETUP/` | Visible copies of the two workflow files, because web uploads often skip hidden folders. |
| `screenshots/` (next to this folder in the zip) | Every screen at 390 px and 1280 px wide, made with test data. |

## How it works

**Screens.** Home (totals, mascot, why, buttons), Log stickers, Map, Leaderboard, My stickers, Get stickers, How we count (About), and Privacy and imprint. The phone layout has a tab bar at the bottom; from 768 px wide the menu moves to the top.

**Accounts.** There is no login screen. The first time someone saves stickers, the site runs Cloudflare's robot check and signs them in to Supabase anonymously. That anonymous login lives in their browser. They pick a nickname in the same form. If they clear the browser or lose the phone, their entries and nickname stay on the leaderboard, but they can't edit them any more. `app/src/lib/session.tsx` notes where "save my progress with email" can be added later; email sign-ups stay off until then.

**What gets stored.** An anonymous user ID, the nickname, and each entry (store, number of stickers, date). Reports of nicknames, with who reported. Nothing else. No cookies, no analytics, no outside fonts.

**Security.** The website only has the public key. Every table has Row Level Security. People can read and delete only their own rows; nobody can edit an entry. Everything public (totals, leaderboard, map, store search) comes from database functions that return only totals and nicknames, never who logged what, where or when. The database itself refuses: more than 50 stickers in one entry, dates in the future or more than 7 days back, more than 10 entries or 200 stickers per person per day, and anything from a blocked person. Hidden entries and blocked people never count in any public number. The nickname is the only free text, and the database checks it: 3 to 20 letters, digits, spaces, `-` or `_`; unique ignoring case and accents; no links; no reserved names (Lidl, Kaufland, Schwarz, ICAW, admin, moderator, support, official and variants); no insults from a list in six languages. The page carries a strict Content-Security-Policy and a referrer policy, and source maps are off.

**Impact number.** Shrimp helped per sticker = S × p ÷ N = 1,000,000,000 × 0.10 ÷ 1,000,000 = 100 per year, in expectation. S, p and N live in the `settings` table, so an admin can change them in the Supabase Table Editor without a new release. The About page shows the formula and the two Rethink Priorities sources.

## Before launch

1. Fill in `{{CONTACT_EMAIL}}` in `app/src/site-config.ts` with the project's own address. The imprint names "ShrimpHero, a volunteer project" as publisher and GitHub as host. No organisation is named. A postal address is optional (`PUBLISHER_ADDRESS`, empty by default); if you add one, use a P.O. box, never a home address.
2. Replace the placeholder mascot with the La Voix des Crevettes drawing (next section).
3. Have a native speaker read each translation file. **All six files in `app/src/i18n/` need native review**: `fr.json`, `de.json`, `it.json`, `pl.json`, `es.json`, and `en.json` too.
4. Read the "Why Lidl" text in each language (`home.why_body`) with the campaign team. It says Lidl promised to change in Great Britain but not elsewhere.

## Replacing the mascot

The current shrimp is a simple line drawing I made as a stand-in, because the La Voix des Crevettes SVG hadn't arrived yet.

1. Clean the new file: `node scripts/clean-svg.mjs lavoix-shrimp.svg > app/src/assets/mascot.svg`. This removes metadata and editor data, and turns `style="..."` into plain attributes (the security policy blocks inline styles).
2. Open `mascot.svg` in a text editor. Put the antenna paths inside `<g class="antennae">` and the leg paths inside `<g class="legs">`, one path per leg. Only those two parts move.
3. Use `stroke="currentColor"` or `fill="currentColor"` so the drawing turns white on the blue sections.
4. If the antennae should swing from a different point, change `transform-origin: 50px 52px` under `.mascot .antennae` in `app/src/styles.css` to where the antennae meet the head, in the SVG's own coordinates.

## The store list

The container I built this in can't reach OpenStreetMap, so `supabase/seed/stores.csv` ships with only its header row. GitHub can reach it: after you upload the code, run the "Refresh Lidl stores" workflow once (Actions tab, then Run workflow). It takes 5 to 10 minutes, saves the full list (Lidl shops in FR, DE, IT, PL, ES, GB, IE, BE, CH and AT, tagged `brand:wikidata=Q151954`) into `supabase/seed/stores.csv`, and you import it into Supabase as the launch guide describes. Run it again every few months to pick up new stores. Re-importing updates existing stores and keeps every entry.

I tested the script on sample data, including the CSV import and merge in Postgres, but not against the live OpenStreetMap servers.

## Assumptions I made

Where the brief was open, I picked the simplest safe option:

- **Routes use `#`** (for example `/shrimphero/#/map`), so GitHub Pages needs no setup. A `404.html` copy is added anyway.
- **Reporting needs a login.** Only someone who has logged stickers from that browser can report a nickname. This keeps the 20-reports-a-day limit meaningful without asking strangers to pass a robot check just to report.
- **The robot check loads only when someone starts filling the Log form**, not when they open the site. Cloudflare sees visitors only when they log, as the privacy page says.
- **Days follow Paris time** for the 7-day window and the daily limits. Someone in the UK logging just before midnight may find the oldest day refused.
- **Store search** matches town, village, street, postcode and store name. `scripts/add-places.mjs` fills in missing towns from GeoNames and lists, for every store, the villages it is one of the 3 nearest Lidl shops for (within 20 km), so typing a village finds the nearest stores. "Use my location" also works.
- **"Use my location"** sends the position rounded to about 1 km, and only to the store search. It is never stored.
- **Leaderboard ties** are ordered by nickname.
- **The Spanish interface offers the English sticker** by default, since there is no Spanish sticker.
- **The last chosen store is remembered in the browser**, so regulars don't search every time. It is never sent anywhere else.
- **Fonts** ship only the Latin and Latin Extended character sets (enough for all six languages and the sticker language names).
- **Imprint.** Published under the project name ShrimpHero with a contact email and the host's name and address, so neither a person nor an organisation is named. ICAW also stays a reserved nickname.
- **The site path** is `/shrimphero/`. For a custom domain later, set the repository variable `BASE_PATH` to `/` (see the launch guide).
- **Supabase keys.** The site works with both the new publishable key (`sb_publishable_...`) and the older anon key.

## What was checked

All run on the production build, with a fake database (`app/tests/mock-server.mjs`) because the real one doesn't exist yet.

- **Database:** `supabase/tests/security.sql` passes on a local Postgres with the six migrations. I also broke rules on purpose to confirm the test catches them.
- **Browser tests:** 26 Playwright tests pass. They log stickers on a 390 px phone screen in English, French and Polish (including Polish plural forms), check the right petition link per language, refuse a reserved nickname, require a store, switch and remember the language, download all nine stickers, and walk through delete entry, report and delete all.
- **Accessibility:** an axe scan of every screen at 390 px and 1280 px, plus the signed-in screens, finds no serious or critical issues (WCAG 2.2 AA rules, including 24 px target size; buttons are 48 px). No screen scrolls sideways. Colour pairs used for text are all 4.5:1 or better (white on red 4.75:1, small red text uses `#C8000F` at 5.4:1).
- **Security policy:** no Content-Security-Policy violations on any screen.
- **Lighthouse (mobile):**

  | Screen | Performance | Accessibility | Best practices | SEO |
  | --- | --- | --- | --- | --- |
  | Home | 98 | 100 | 100 | 100 |
  | Log | 99 | 100 | 100 | 100 |
  | Map | 97 | 100 | 96* | 100 |
  | Leaderboard | 100 | 100 | 100 | 100 |
  | My stickers | 98 | 100 | 100 | 100 |
  | Stickers | 99 | 100 | 100 | 100 |
  | About | 98 | 100 | 100 | 100 |
  | Privacy | 99 | 100 | 100 | 100 |

  \* The test machine couldn't reach the OpenFreeMap tiles, which logs a console error. With tiles reachable, that error goes away.

- **JavaScript size:** 86 KB gzipped on a first visit (82 KB app plus at most 4 KB for one language file). The map library (about 300 KB) loads only on the Map screen. The Supabase library (60 KB) loads only when someone logs stickers or comes back already signed in.
- **Screenshots:** in `screenshots/`. The map shows a blank background there because the tiles were unreachable; on the live site it shows the OpenFreeMap street map. Nicknames and numbers are test data.
- **Not tested here:** the real Cloudflare robot check, the real Supabase project and the live OpenStreetMap download. The launch guide's test checklist covers them.

## For developers

```bash
cd app
npm ci
npx playwright test        # builds the site, starts the fake database, runs all tests
npm run build && npm run size
```

Local development with a real project: create `app/.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_TURNSTILE_SITE_KEY`, then `npm run dev`.

## Licences

Code: MIT (see `LICENSE`). Fonts: Libre Franklin and Newsreader, SIL Open Font License 1.1, bundled through Fontsource. Map: MapLibre GL JS (BSD), tiles by OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors. Store data: © OpenStreetMap contributors, Open Database License; the credit appears on the Log screen, the Map screen and in the footer. Town and village names: © GeoNames, CC BY 4.0; the credit appears on the Log screen. Sticker images and campaign texts belong to the campaign.
