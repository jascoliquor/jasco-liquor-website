# Cloudflare setup for jascoliquor.com

Some protection lives in the repo (`public/_headers`, `public/_redirects`, `wrangler.jsonc`) and ships
with every deploy. The rest can only be set in the Cloudflare dashboard. This file lists the dashboard
part. Tick items off here as they are done so later chats know the current state.

Everything below works on the **Free plan**.

## Already handled in the repo

- Security headers on every response: HSTS (2 years), Content-Security-Policy, X-Frame-Options DENY,
  nosniff, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy.
- Browser cache times for images (1 day) and logos (1 week). HTML/JS/CSS revalidate every visit.
- Real 404 page for unknown paths; `/deals` and `/deals/index.html` go to `/deals/`.
- `robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD LiquorStore data, canonical URLs, Open Graph tags.
- The `*.workers.dev` address and preview URLs are turned off (`wrangler.jsonc`), so Google only sees
  jascoliquor.com.

## To do in the dashboard

### 1. Deploy command (do this first, right after pushing)
- [ ] Workers & Pages > the site's Worker > Settings > Build.
  Set **Deploy command** to `npx wrangler deploy` (no extra flags; settings now come from
  `wrangler.jsonc`). Root directory: `/`. Build command: empty.
- [ ] Check the Worker's name there matches `"name"` in `wrangler.jsonc` (`jasco-liquor-website`).
  If it is different, change the name in `wrangler.jsonc`. A mismatch fails the build, and the old
  version stays live, so nothing breaks.
- [ ] After the deploy finishes, open https://jascoliquor.com/nope (should show the "That page isn't
  here" page) and https://securityheaders.com/?q=jascoliquor.com (should be grade A).
  Done 2026-11: https://jascoliquor.com gets A+. Testing an `http://` address gives grade **R**,
  which means "Redirect": the http address sends visitors to https, which is correct. Tick
  "Follow redirects" on securityheaders.com to grade the page it lands on.

### 2. www goes to jascoliquor.com (one copy of the site for Google)
- [ ] Rules > Redirect Rules > Create rule > template **"Redirect from WWW to root"**, or by hand:
  - When: Hostname equals `www.jascoliquor.com`
  - Then: Dynamic, `concat("https://jascoliquor.com", http.request.uri.path)`, status **301**,
    preserve query string on.
  - The `www` DNS record must stay **Proxied** (orange cloud).

### 3. SSL/TLS
- [ ] SSL/TLS > Edge Certificates: **Always Use HTTPS** on, **Minimum TLS Version** 1.2,
  **TLS 1.3** on, **Automatic HTTPS Rewrites** on.
- Leave HSTS in the dashboard **off**; the `_headers` file already sends it.

### 4. Rate limiting (the one free rule)
Security > WAF > **Rate limiting rules** > Create rule:
- [ ] Name: `Too many requests`
- If incoming requests match: URI Path, **does not start with**, `/cdn-cgi/`
- Characteristics: IP (fixed on Free)
- When rate exceeds: **150 requests per 10 seconds**
- Then: **Block** for 10 seconds (the Free plan's only option)

Why 150: one full page view is about 20 to 30 files, and phones on the same carrier can share one IP.
150 in 10 seconds only catches scrapers and floods. Lower it if attacks get through, raise it if
real customers ever see a block page.

### 5. WAF custom rules (Free gives 5)
Security > WAF > **Custom rules** > Create rule > "Edit expression", paste, action **Block**.

- [ ] `Block exploit scanners` (bots constantly probe for WordPress, PHP and leaked config files;
  none exist here, so block them at the edge):
  ```
  (http.request.uri.path contains "/wp-") or (http.request.uri.path contains ".php") or (http.request.uri.path contains "xmlrpc") or (http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "phpmyadmin") or (http.request.uri.path contains "/cgi-bin") or (http.request.uri.path contains "/.aws") or (http.request.uri.path contains "/vendor/")
  ```
- [ ] `Only GET and HEAD` (the site has no forms, so nothing should POST):
  ```
  not (http.request.method in {"GET" "HEAD"}) and not starts_with(http.request.uri.path, "/cdn-cgi/")
  ```
  The `/cdn-cgi/` part keeps Cloudflare's own challenge and analytics endpoints working.

### 6. Bots
- [ ] Security > Bots: **Bot Fight Mode** on. It challenges known bad bots; Google, Bing and other
  verified crawlers are let through. If something legit ever breaks, this is the first thing to turn off.
- [ ] AI Crawl Control (or Security > Bots > "Block AI bots"): **Do not block**, and leave
  "Manage robots.txt" **off** so the repo's `robots.txt` is used. ChatGPT, Perplexity, Gemini and
  Google's AI answers are where people ask for "liquor store near me" and store hours.
  (Only block if you decide you don't want AI companies training on the site; that can also hide
  the store from AI answers.)
- [ ] Security > Settings: **Browser Integrity Check** on. Leave Security Level at the default.

### 7. Speed
- [ ] Speed > Optimization: **Early Hints** on, **HTTP/3** on (Network tab).
- [ ] **Rocket Loader off**, **Email Address Obfuscation off**. Both inject scripts the CSP blocks.
- [ ] Caching > Configuration: **Crawler Hints** on (tells Bing and others when pages change).

### 8. Visitor numbers (free, no cookies, no banner needed)
- [ ] Analytics & Logs > **Web Analytics** > Add a site > `jascoliquor.com` > automatic setup.
  The CSP already allows it.

### 9. Email spoofing protection (only if nobody sends email from @jascoliquor.com)
Stops scammers from sending email that looks like it came from the store. DNS > Records > Add:
- [ ] TXT, name `@`, content `v=spf1 -all`
- [ ] TXT, name `_dmarc`, content `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`
- [ ] MX, name `@`, mail server `.`, priority `0` (a "null MX": this domain takes no mail)
If you later set up store email (Google Workspace etc.), delete these and use the provider's records.

### 10. DNSSEC (after the registrar transfer, about 2027-01-22)
- [ ] DNS > Settings > **Enable DNSSEC**. Once the domain is registered at Cloudflare it is one click.
  (Doing it before the transfer needs the DS record copied into Squarespace; easier to wait.)

## Outside Cloudflare (traffic)

- [ ] **Google Business Profile**: website = `https://jascoliquor.com/`. This matters more than
  anything else for local search. Post each sale there too.
- [ ] **Google Search Console**: add a Domain property for `jascoliquor.com` (verify through
  Cloudflare when asked), then Sitemaps > submit `https://jascoliquor.com/sitemap.xml`.
- [ ] **Bing Webmaster Tools**: import from Search Console (also feeds ChatGPT and Copilot search).
- [ ] **Apple Business Connect**: claim the store so Apple Maps shows the website.
- [ ] Instagram and Facebook bios link to `https://jascoliquor.com/`.
- Check with https://search.google.com/test/rich-results (store data) and
  https://pagespeed.web.dev (speed).
