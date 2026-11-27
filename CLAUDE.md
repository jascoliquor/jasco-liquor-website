# Jasco Liquor & Wine website

The website for **Jasco Liquor & Wine**, a liquor store at 2014 Terry Rd, Jackson, MS 39204.
Phone (601) 346-0360. Open Monday to Saturday, 10 AM to 10 PM; closed Sunday and Christmas Day.
Instagram @jascowholesale, Facebook jascoWholesale, DoorDash store 25647772.

Live at **https://jascoliquor.com/** (canonical, no www). Read this file first in a new chat.
Cloudflare dashboard settings and what is still to do: [CLOUDFLARE.md](CLOUDFLARE.md).

## How it works

- **Plain static site.** HTML, CSS and vanilla JS in `public/`. No framework, no build step, no npm
  dependencies, no server code, no forms, no database, no cookies. What is in `public/` is what ships.
- **Hosting:** Cloudflare Workers with static assets (not Cloudflare Pages). `wrangler.jsonc` points
  Cloudflare at `public/`. There is no Worker script, so every request is a free static-asset hit.
- **Deploy:** push to `main` on GitHub (`jascoliquor/jasco-liquor-website`); Cloudflare builds
  from the repo and runs `npx wrangler deploy`. Check a change locally with
  `npx wrangler@4 dev` (serves on http://localhost:8787 with the real headers, redirects and 404 page),
  or `npx wrangler@4 deploy --dry-run` to just validate the config.
- **Domain:** jascoliquor.com is registered at Squarespace with nameservers on Cloudflare.
  Plan: transfer the registration to Cloudflare once it is 60 days old (about 2027-01-22).

## Files

```
wrangler.jsonc          Cloudflare config: assets dir, trailing slashes, 404 page, workers.dev off
CLAUDE.md               this file
CLOUDFLARE.md           dashboard checklist (security, rate limiting, redirects, SEO tools)
brand/build_logos.py    draws the logo SVGs into public/brand/ (python3 brand/build_logos.py)
brand/unused/           logo options that were not picked; not published

public/
  index.html            home: hero, "On the shelves" (6 spirits with a 3D bottle), store photos, visit + hours
  deals/index.html      /deals/: the current sale as a printed-flyer grid, or "No sale posted right now"
  404.html              shown for any unknown path (real 404 status, noindex)
  styles.css            all base styles (home, bar, footer, dock, hours); .page = plain page like 404
  sale.css              sale theme on home, flyer layout on /deals/, .ended message
  sale.js               THE CURRENT SALE as data (window.JASCO_SALE), or null for none. Edit for each sale.
  sale-view.js          reads sale.js in <head>: sets html.sale + theme class, builds deal rows/cards
  hours.js              open/closed status in Jackson time (America/Chicago), today's row in the hours table
  bottle.js             WebGL bottle on the home page (window.JascoStage); falls back to no bottle
  app.js                home page behavior: sale prices beside bottles, scroll scenes, copy address, phone dock
  deals.js              fills /deals/ from sale.js
  jasco.vcf             "Save to your contacts" card
  images/               photos (.webp); share.jpg is the 1200x630 link preview; deals/ holds a sale's bottle cutouts
  brand/                logo SVGs, icon.svg (favicon), apple-touch-icon.png
  _headers              security headers (CSP, HSTS, ...) and cache times. Read by Cloudflare, not served.
  _redirects            /favicon.ico, /apple-touch-icon.png, /sale, /sales, /specials. Read by Cloudflare, not served.
  robots.txt            allows all crawlers, points at the sitemap
  sitemap.xml           / and /deals/
  llms.txt              plain summary of the store for AI assistants
  .assetsignore         files never uploaded (.DS_Store)
```

## Running a sale

1. In `public/sale.js`, replace `null` with the sale (the comment there has an example): `name`,
   `theme` (optional; CSS class `theme-<theme>` that you add to sale.css; none exist right now), `ends` (ISO time with Jackson offset: `-06:00` winter, `-05:00` summer),
   `until`, `short`, `hours`, and `groups` of items.
2. Item fields: `name`, `pic` (file in `public/images/deals/<pic>.webp`, bottle cut out on a
   clear background), `size`, `price` as a string like `"32.99"`, `qty: 2` for "2 for",
   `tax: true` for "Tax included", `shelf` = which home-page bottle it sits beside
   (`whiskey`, `cognac`, `tequila`, `vodka`, `gin`, `wine`).
3. When `ends` passes, the whole site goes back to normal by itself (open pages reload within 20 s)
   and /deals/ says no sale is posted. Nothing has to be removed, but once it is over, set
   `JASCO_SALE` back to `null`, delete that sale's pictures and theme CSS. The 2026 Thanksgiving
   sale (theme, turkey tail, bottle cutouts, flyer scan) is in git history at commit `da28dd8`.
4. Bump `lastmod` for /deals/ in `public/sitemap.xml`.

## Rules to keep (security and SEO)

- **CSP in `public/_headers` is strict.** No inline `<script>` code, no `onclick=` attributes, no
  `style="..."` attributes in HTML (put styles in CSS; setting `el.style.setProperty()` from JS is fine).
  The JSON-LD `<script type="application/ld+json">` block is data and is allowed. Any new outside
  domain (embed, font, analytics, form) must be added to the CSP or the browser blocks it.
  Allowed today: Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) and Cloudflare Web
  Analytics (`static.cloudflareinsights.com`, `cloudflareinsights.com`).
- **Never turn on Rocket Loader** in Cloudflare; it rewrites scripts and breaks the CSP and script order.
- **New page checklist:** its own folder `public/<name>/index.html` (gives `/name/`), absolute paths
  (`/styles.css`), `<title>`, meta description, `<link rel="canonical">` with the trailing slash,
  og tags, add it to `sitemap.xml` and `llms.txt`, add it to the nav in every page's header.
- `index.html` uses relative paths (`styles.css`); every other page uses absolute paths (`/styles.css`)
  because it lives in a folder.
- Store facts (hours, phone, address) appear in several places. When one changes, update all of:
  `index.html` (text, meta description, JSON-LD `openingHoursSpecification`), `deals/index.html`,
  `404.html`, `hours.js` (`OPEN`, `CLOSE`, closed days), `jasco.vcf`, `llms.txt`, and the Google
  Business Profile.
- Images: `.webp`, with `width`/`height` attributes and `loading="lazy"` below the fold, and real alt text.
- Must say "21 or older" in the footer of every page (it is a liquor store).
