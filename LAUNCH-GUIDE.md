# ShrimpHero launch guide

About two hours of clicking, which you can spread over several days. At the end the site runs at `https://shrimphero.org` on free plans, with no card and no real name anywhere. Tick each box as you go.

`<username>` below means the GitHub username you create in step 3.

Dashboards change their menus from time to time. If a menu name below doesn't match what you see, use the search box at the top of that dashboard and type the name in bold.

---

## 1. Before you start (15 min)

These keep the new accounts apart from your personal ones. Use them every time you work on ShrimpHero.

- [ ] Create a separate browser profile just for ShrimpHero (Chrome: profile icon at the top right, then **Add**). Never log into personal accounts in it.
- [ ] Install a VPN and turn it on whenever you use that profile. Proton VPN has a free plan.
- [ ] Install a password manager (Bitwarden is free). Save every new password and recovery code there.
- [ ] Install an authenticator app on your phone (Aegis, 2FAS or Bitwarden Authenticator). Don't use text-message codes: they tie accounts to your phone number.

## 2. Email: Proton Mail (10 min)

Use Proton Mail, not Gmail. Gmail usually asks for a phone number, which ties the account to you.

- [ ] In the new profile, with the VPN on, sign up at [proton.me/mail](https://proton.me/mail) on the **Free** plan.
- [ ] Pick a neutral address, for example `shrimphero.team@proton.me`. No real name, no nickname you use elsewhere.
- [ ] Display name: `ShrimpHero`.
- [ ] **Settings**, then **All settings**, then **Account and password**: turn on **Two-factor authentication** with your authenticator app.
- [ ] Save the recovery phrase in the password manager.

If Proton says the account is "restricted from registering on third-party services", it wants a verified recovery address:

- [ ] Create a second free mailbox that needs no phone, for example at [tuta.com](https://tuta.com), with no real name.
- [ ] In Proton: **Settings**, then **Recovery**, add that address as **Recovery email** and verify it.
- [ ] If that is refused too, your personal email as recovery is an acceptable fallback. Only Proton sees it, never GitHub, Cloudflare or visitors. Avoid adding a phone number.

## 3. GitHub (15 min)

Your GitHub username becomes part of the site address, so pick a neutral one.

- [ ] Sign up at [github.com/signup](https://github.com/signup) with the Proton address. Username: something like `shrimphero-eu`.
- [ ] **Settings** (your avatar at the top right, then Settings), then **Public profile**: leave name, photo, bio, company and location empty.
- [ ] **Settings**, then **Emails**: tick **Keep my email addresses private** and **Block command line pushes that expose my email**.
- [ ] **Settings**, then **Password and authentication**: click **Enable two-factor authentication**, scan the code with the authenticator app, and save the recovery codes in the password manager.
- [ ] Create the repository: **+** at the top right, then **New repository**. Repository name: `shrimphero`. Choose **Public** (free GitHub Pages needs a public repository). Leave "Add README", ".gitignore" and "license" off. Click **Create repository**.

Public means anyone can read the code. That's fine: it holds no passwords or secret keys, and it contains no names or personal paths.

## 4. Cloudflare, for the robot check (10 min)

Turnstile is Cloudflare's free, mostly invisible robot check. It stops bots from creating thousands of fake users.

- [ ] Sign up at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) with the Proton address. Free plan, no card. Confirm the email.
- [ ] Profile icon at the top right, then **Profile**, then **Authentication**: under **Two-Factor Authentication** set up **Mobile App Authentication**. Save the backup codes.
- [ ] In the left menu open **Turnstile** (in some layouts it sits under **Application security**; or type Turnstile in the search box). Click **Add widget**.
- [ ] **Widget name:** `ShrimpHero`. **Hostname management:** click **Add Hostnames** and add `shrimphero.org` (and `<username>.github.io` while testing there). **Widget Mode:** **Managed**. Pre-clearance: **No**. Click **Create**.
- [ ] Copy the **Site Key** and the **Secret Key** into the password manager. The Site Key goes into GitHub (step 6). The Secret Key goes only into Supabase (step 5), nowhere else.

## 5. Supabase, the database (30 min)

A new Supabase account, separate from any you already have.

**Account and project**

- [ ] At [supabase.com/dashboard](https://supabase.com/dashboard), choose **Continue with GitHub** and log in with the new GitHub account.
- [ ] Create an organisation: name `ShrimpHero`, plan **Free**.
- [ ] **New project**: name `shrimphero`. Database password: click **Generate a password** and save it in the password manager. Region: **Central EU (Frankfurt)**. Leave the Data API settings as they are. Click **Create new project** and wait about two minutes.
- [ ] Your avatar at the bottom left, then **Account preferences**, then **Security** (in some layouts **Multi-factor authentication**): add the authenticator app.

**Login settings** (left menu: **Authentication**)

- [ ] **Sign In / Providers**: under **User Signups**, keep **Allow new users to sign up** on (anonymous sign-in needs it) and turn on **Allow anonymous sign-ins**. Click **Save changes**.
- [ ] Still in **Sign In / Providers**, under **Auth Providers**, open **Email** and turn off **Enable Email provider**. Save. (Email stays off until "save my progress with email" is built.)
- [ ] **Attack Protection**: turn on **Enable Captcha protection**, choose **Turnstile by Cloudflare**, paste the **Secret Key** from step 4 into **Captcha secret**, and save.
- [ ] **Rate Limits**: set **Rate limit for anonymous users** to `10` (sign-ins per hour per IP address). Save.
- [ ] **URL Configuration**: set **Site URL** to `https://shrimphero.org/`. Save.

**Database**

- [ ] Left menu: **SQL Editor**. Click **+** (New query). Open `supabase/migrations/001_tables.sql` from the zip in a text editor, copy everything, paste it, and click **Run**. You should see "Success. No rows returned".
- [ ] Do the same, in order, with `002_nicknames.sql`, `003_entries.sql`, `004_public_functions.sql`, `005_permissions.sql`, `006_settings_and_blocklist.sql` and `007_store_places.sql`. One new query each.
- [ ] Run `supabase/tests/security.sql` the same way. If Supabase warns about "destructive operations", click **Run this query**: the test deletes only its own test rows. The result must say **all checks passed**. If it shows an error starting with FAILED, stop and send me that message.
- [ ] Left menu: **Advisors**, then **Security Advisor**. Click **Rerun linter** if offered. There must be no **Errors**. Warnings named "Anonymous Access Policies" are expected: every visitor here is anonymous on purpose.

**Keys for the website**

- [ ] Left menu: **Project Settings**, then **Data API**: copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
- [ ] **Project Settings**, then **API Keys**: copy the **Publishable key** (starts with `sb_publishable_`). If you only see the older keys, use the **anon public** key on the **Legacy API Keys** tab. Both are meant to be public.
- [ ] Never copy the **Secret key** or the **service_role** key anywhere: not into GitHub, not into a message.

**Lidl stores** (do this after step 6, once the "Refresh Lidl stores" workflow has run)

- [ ] Left menu: **Table Editor**, then the table **stores_import**. Click **Insert**, then **Import data from CSV**, choose the `stores.csv` you downloaded in step 6, check the preview shows columns id, name, street, city, postcode, country, lat, lng, and click **Import data**.
- [ ] **SQL Editor**, new query: `select public.merge_store_import();` and **Run**. It answers with the number of stores imported (several thousand).
- [ ] Quick check, new query: `select * from public.search_stores('lyon');` should list Lidl stores in Lyon.

## 6. Upload the code and publish (25 min)

You upload through the GitHub website, in the ShrimpHero browser profile. That way your computer's own Git setup, which may carry your real name, never touches this account.

**Upload**

- [ ] Unzip the file. It holds two folders: `shrimphero` (the code) and `screenshots` (for you to look at; don't upload it).
- [ ] Open your `shrimphero` repository on GitHub. Click **uploading an existing file** (on an empty repository) or **Add file**, then **Upload files**.
- [ ] Open the unzipped `shrimphero` folder on your computer, select everything inside it (`app`, `scripts`, `SETUP`, `supabase`, `README.md`, `LAUNCH-GUIDE.md`, `LICENSE`) and drag it onto the page. Wait until every file is listed.
- [ ] Commit message: `First upload`. Keep **Commit directly to the main branch**. Click **Commit changes**.
- [ ] Check the repository now shows the folders `app`, `scripts`, `SETUP` and `supabase`, and that `app/public` holds `CNAME` and `favicon.svg`.

**The two workflow files** (hidden folders are usually skipped by drag and drop)

- [ ] **Add file**, then **Create new file**. In the name box type exactly `.github/workflows/deploy.yml` (each `/` makes a folder). Open `SETUP/deploy.yml` from the zip in a text editor, copy everything, paste it into the big box. Click **Commit changes...**, then **Commit changes**.
- [ ] Same again with the name `.github/workflows/refresh-stores.yml` and the contents of `SETUP/refresh-stores.yml`.

**Settings**

- [ ] **Settings** (tab of the repository), then **Secrets and variables**, then **Actions**, then the **Variables** tab. Click **New repository variable** three times:
  - `VITE_SUPABASE_URL` = the Project URL from step 5
  - `VITE_SUPABASE_ANON_KEY` = the publishable (or anon) key from step 5
  - `VITE_TURNSTILE_SITE_KEY` = the Site Key from step 4
- [ ] **Settings**, then **Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.

**Publisher details**

- [ ] Open `app/src/site-config.ts` in the repository and click the pencil (**Edit this file**). Replace `{{CONTACT_EMAIL}}` with the project's contact address (for example the Proton one). Keep the quote marks. Click **Commit changes...**, then **Commit changes**.
- [ ] Leave `PUBLISHER_NAME` as `ShrimpHero` and `PUBLISHER_ADDRESS` empty. The imprint then shows the project name, the contact address and GitHub as host. Never put your own name or home address there.

**Publish**

- [ ] **Actions** tab. On the left click **Deploy**, then **Run workflow**, then the green **Run workflow** button. Wait 2 to 3 minutes for a green tick. (A red cross that says "Missing repository variables" means one of the three variables is missing or misspelled.)
- [ ] Open `https://shrimphero.org/`. The site should show "0 stickers stuck so far".

**Store list**

- [ ] **Actions** tab, then **Refresh Lidl stores** on the left, then **Run workflow**. Wait 5 to 10 minutes for a green tick. If it fails, the free OpenStreetMap servers were busy: run it again an hour later.
- [ ] Back in the **Code** tab, open `supabase/seed/stores.csv`. Click the **Download raw file** button (the arrow pointing down, top right of the file).
- [ ] Go back to step 5, "Lidl stores", and import the file.

## 7. Test before sharing (15 min)

On your phone, in a private window:

- [ ] Open the site. The totals show 0, the shrimp's antennae move slowly.
- [ ] **Log** 3 stickers in a store near you with the nickname `test run`. You see "Saved" and a petition button. The robot check either passes silently or asks for one click.
- [ ] The home total shows 3, the map shows a pin with 3, and the ranking under the map shows `test run`.
- [ ] Try 60 stickers: the counter stops at 50.
- [ ] Try the nickname `www.test.com` in another private window: it is refused.
- [ ] Try the nickname `Lidl Official`: it is refused.
- [ ] **Get stickers**: the Order stickers button opens the order form (or shows "Ordering opens soon").
- [ ] Switch the language at the top to each of the six languages and look at every screen.
- [ ] Turn on "Reduce motion" on the phone (iPhone: Settings, Accessibility, Motion; Android: Settings, Accessibility, Remove animations). The shrimp stays still.
- [ ] **Mine**: delete the test entry, then **Delete everything**. The totals go back to 0.
- [ ] Share the link first from a ShrimpHero account made with the Proton address, not from personal ones.

## 8. Admin tasks and upkeep

Always in the ShrimpHero profile with the VPN on. All in Supabase, left menu **Table Editor**. Double-click a cell to change it, then press Enter and **Save**.

- **Hide a fake entry:** table `entries`, set `hidden` to `TRUE`. It stops counting at once. Find a person's entries by their `user_id`.
- **Block a person:** table `profiles`, set `blocked` to `TRUE`. None of their entries count any more and they can't add new ones.
- **Rename a nickname:** table `profiles`, edit `nickname`. The same rules apply, so a blocked word is refused.
- **Review reports:** in **SQL Editor** run
  ```sql
  select r.created_at, p.nickname, p.user_id, r.reviewed
  from public.reports r join public.profiles p on p.user_id = r.reported_id
  order by r.created_at desc;
  ```
  Rename or block as needed, then in table `reports` set `reviewed` to `TRUE`.
- **Add a word to the nickname block list:** table `nickname_blocklist`, **Insert**, **Insert row**: `term` in lower case, `match` = `contains` (blocked anywhere) or `word` (only as a whole word, for short words).
- **Change the impact numbers:** table `settings`, edit `value` for `S`, `p` or `N`. The site uses the new numbers right away.

**Weekly backup (5 min)**

- [ ] In **SQL Editor** run `select * from public.profiles;`, then above the results click **Export** (or **Download**), then **Download CSV**. Do the same for `public.entries` and `public.reports`.
- [ ] Keep the files in an encrypted folder, not on a shared drive.

**If the project pauses**

The free plan pauses a project after about a week with no database activity. The site then shows "Something went wrong" for the totals. Open the project in Supabase and click **Restore project**. Nothing is lost. Restore it within 90 days: after that the free plan only lets you download a backup.

## 9. Later: your own domain, with Cloudflare in front

GitHub Pages can't send some security headers (for example the one that stops other sites embedding yours). The code covers what it can from inside the page. With a domain behind Cloudflare, you can add the rest for free. If you buy a domain, pick a registrar that hides the owner in the public record for free (Cloudflare Registrar does by default), so the registration doesn't show your name.

- [ ] In Cloudflare: **Add a domain** (or **Add a site**), enter the domain, choose the **Free** plan, and change the nameservers at the registrar to the two Cloudflare gives you.
- [ ] Cloudflare **DNS**, **Records**: add four `A` records for the bare domain pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, and a `CNAME` record `www` pointing to `<username>.github.io`. Proxy status: **Proxied** (orange cloud).
- [ ] Cloudflare **SSL/TLS**: set the mode to **Full**. Under **Edge Certificates**, turn on **Always Use HTTPS**.
- [ ] GitHub repository **Settings**, **Pages**: type the domain under **Custom domain** and click **Save**.
- [ ] No `BASE_PATH` variable is needed any more: the site path is `/` by default. Run **Actions**, **Deploy**, **Run workflow** once the domain is saved.
- [ ] Cloudflare **Rules**, **Transform Rules** (or **Rules overview**, then **Response Header Transform Rules**), **Create rule**, for all incoming requests, **Set static** headers:
  - `Strict-Transport-Security` = `max-age=31536000`
  - `X-Frame-Options` = `DENY`
  - `X-Content-Type-Options` = `nosniff`
  - `Permissions-Policy` = `camera=(), microphone=(), geolocation=(self)`
- [ ] Cloudflare **Turnstile**, the ShrimpHero widget, **Settings**: add the new domain to the hostnames.
- [ ] Supabase **Authentication**, **URL Configuration**: change **Site URL** to `https://<your-domain>/`.
- [ ] Open the site on the new domain and run the step 7 checklist again.
