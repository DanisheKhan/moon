# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: no-horizontal-scroll.spec.js >> no horizontal scroll: /admin/mobiles @ 320px
- Location: scripts\e2e\no-horizontal-scroll.spec.js:28:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:4173/admin/mobiles", waiting until "networkidle"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "SE Star Enterprises OPERATIONS CONSOLE" [ref=e7] [cursor=pointer]:
          - /url: /admin
          - generic [ref=e8]: SE
          - generic [ref=e9]:
            - generic [ref=e10]: Star Enterprises
            - generic [ref=e11]: OPERATIONS CONSOLE
        - button [ref=e12] [cursor=pointer]
      - navigation [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Enterprise
          - link "Store Launcher" [ref=e19] [cursor=pointer]:
            - /url: /admin
          - link "Staff Management (HRMS)" [ref=e25] [cursor=pointer]:
            - /url: /admin/staff
          - link "All Bills (Editable)" [ref=e32] [cursor=pointer]:
            - /url: /admin/invoices
        - generic [ref=e37]:
          - generic [ref=e38]: Star Mobiles
          - link "Dashboard" [ref=e39] [cursor=pointer]:
            - /url: /admin/mobiles
          - link "Billing (POS)" [ref=e46] [cursor=pointer]:
            - /url: /admin/mobiles/billing
          - link "Bills & Invoices" [ref=e50] [cursor=pointer]:
            - /url: /admin/mobiles/invoices
          - link "Inventory & Stock" [ref=e55] [cursor=pointer]:
            - /url: /admin/mobiles/inventory
          - link "Reports & Tax" [ref=e61] [cursor=pointer]:
            - /url: /admin/mobiles/reports
    - generic [ref=e65]: Console v2.0 • Active
  - generic [ref=e69]:
    - banner [ref=e70]:
      - generic [ref=e71]:
        - button "Open side drawer" [ref=e72] [cursor=pointer]
        - button "STORE WORKSPACE Star Mobiles" [ref=e74] [cursor=pointer]:
          - generic [ref=e78]:
            - generic [ref=e79]: STORE WORKSPACE
            - generic [ref=e80]: Star Mobiles
      - generic [ref=e83]:
        - generic [ref=e84]: 23:01
        - button "SO" [ref=e86] [cursor=pointer]
    - main [ref=e90]:
      - generic [ref=e92]:
        - generic [ref=e93]:
          - generic [ref=e94]:
            - generic [ref=e95]:
              - generic [ref=e96]: STORE WORKSPACE
              - generic [ref=e97]: •
              - generic [ref=e98]: Active Branch
            - heading "Star Mobiles Dashboard" [level=1] [ref=e102]
            - paragraph [ref=e103]: Branch Operations • Mumbai • Real-time telemetry & counter sales
          - generic [ref=e104]:
            - generic [ref=e108]:
              - button "Today" [ref=e109] [cursor=pointer]
              - button "This Week" [ref=e110] [cursor=pointer]
              - button "This Month" [ref=e111] [cursor=pointer]
              - button "All Time" [ref=e112] [cursor=pointer]
            - button [ref=e113] [cursor=pointer]
        - generic [ref=e116]:
          - generic [ref=e117]:
            - generic [ref=e118]: TOTAL SALES
            - generic [ref=e124]:
              - generic [ref=e125]: ₹5,21,830
              - paragraph [ref=e126]:
                - generic [ref=e130]: Revenue across paid & counter sales
          - generic [ref=e131]:
            - generic [ref=e132]: TOTAL EXPENSES
            - generic [ref=e138]:
              - generic [ref=e139]: ₹7,52,120
              - paragraph [ref=e140]: Procurement COGS + store branch overhead
          - generic [ref=e141]:
            - generic [ref=e142]: TOTAL PROFIT
            - generic [ref=e148]:
              - generic [ref=e149]: ₹2,12,136
              - generic [ref=e150]:
                - generic [ref=e151]: 22.0% Net Margin
                - generic [ref=e152]: Sales minus expenses
        - generic [ref=e153]:
          - generic [ref=e155]:
            - generic [ref=e156]:
              - generic [ref=e157]:
                - generic [ref=e162]:
                  - heading "Critical Stock Alerts" [level=2] [ref=e163]
                  - paragraph [ref=e164]: Items at or below reorder threshold
                - generic [ref=e165]: 1 Alert
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - img "OnePlus 12 256GB" [ref=e170]
                  - generic [ref=e171]:
                    - generic [ref=e172]: OnePlus 12 256GB
                    - generic [ref=e173]:
                      - generic [ref=e174]: "SKU: 1PL-12-256"
                      - generic [ref=e175]: •
                      - generic [ref=e176]: Smartphones
                - generic [ref=e177]:
                  - generic [ref=e178]: 2 units left
                  - generic [ref=e179]: "Min: 2"
            - button "Manage Inventory & Restock" [ref=e181] [cursor=pointer]
          - generic [ref=e190]:
            - generic [ref=e191]:
              - generic [ref=e192]:
                - generic [ref=e198]:
                  - heading "Recent Store Transactions" [level=2] [ref=e199]
                  - paragraph [ref=e200]: Live checkout activity at this counter
                - generic [ref=e201]: Realtime
              - generic [ref=e204]:
                - generic [ref=e205]:
                  - generic [ref=e206]:
                    - generic [ref=e207]:
                      - generic [ref=e208]: MOB-2026-0013
                      - generic [ref=e209]: •
                      - generic [ref=e210]: Walk-in Customer
                    - generic [ref=e211]:
                      - generic [ref=e215]: 29 Oct 2026, 03:03 am
                      - generic [ref=e216]: paid
                  - generic [ref=e217]: ₹76,699
                - generic [ref=e219]:
                  - generic [ref=e220]:
                    - generic [ref=e221]:
                      - generic [ref=e222]: MOB-2026-0012
                      - generic [ref=e223]: •
                      - generic [ref=e224]: Walk-in Customer
                    - generic [ref=e225]:
                      - generic [ref=e229]: 29 Oct 2026, 03:02 am
                      - generic [ref=e230]: paid
                  - generic [ref=e231]: ₹25,842
                - generic [ref=e233]:
                  - generic [ref=e234]:
                    - generic [ref=e235]:
                      - generic [ref=e236]: MOB-2026-0011
                      - generic [ref=e237]: •
                      - generic [ref=e238]: Walk-in Customer
                    - generic [ref=e239]:
                      - generic [ref=e243]: 17 Oct 2026, 07:13 pm
                      - generic [ref=e244]: paid
                  - generic [ref=e245]: ₹2,242
                - generic [ref=e247]:
                  - generic [ref=e248]:
                    - generic [ref=e249]:
                      - generic [ref=e250]: MOB-2026-0010
                      - generic [ref=e251]: •
                      - generic [ref=e252]: danish
                    - generic [ref=e253]:
                      - generic [ref=e257]: 17 Oct 2026, 12:22 am
                      - generic [ref=e258]: paid
                  - generic [ref=e259]: ₹28,084
            - button "View All Invoices & GST Reports" [ref=e262] [cursor=pointer]
```

# Test source

```ts
  1  | // Fails if any route scrolls horizontally at phone widths.
  2  | // Routes come from scripts/e2e/routes.json (or ROUTES="/,/contact" env).
  3  | // Add EVERY new route to routes.json in the same change that creates it.
  4  | import { test, expect } from '@playwright/test';
  5  | import fs from 'node:fs';
  6  | 
  7  | const routes = process.env.ROUTES
  8  |   ? process.env.ROUTES.split(',').map((r) => r.trim()).filter(Boolean)
  9  |   : JSON.parse(fs.readFileSync(new URL('./routes.json', import.meta.url), 'utf8'));
  10 | 
  11 | const WIDTHS = [320, 360, 390, 768, 1024, 1280];
  12 | 
  13 | /** Scroll through the page so lazy images and whileInView reveals render before measuring. */
  14 | async function exercisePage(page) {
  15 |   await page.evaluate(async () => {
  16 |     const step = Math.max(200, Math.floor(window.innerHeight / 2));
  17 |     for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
  18 |       window.scrollTo(0, y);
  19 |       await new Promise((r) => setTimeout(r, 60));
  20 |     }
  21 |     window.scrollTo(0, 0);
  22 |   });
  23 |   await page.waitForTimeout(700); // let reveal animations finish
  24 | }
  25 | 
  26 | for (const route of routes) {
  27 |   for (const width of WIDTHS) {
  28 |     test(`no horizontal scroll: ${route} @ ${width}px`, async ({ page }) => {
  29 |       await page.setViewportSize({ width, height: 800 });
> 30 |       await page.goto(route, { waitUntil: 'networkidle' });
     |                  ^ Error: page.goto: Test timeout of 30000ms exceeded.
  31 |       await exercisePage(page);
  32 | 
  33 |       const result = await page.evaluate(() => {
  34 |         const de = document.documentElement;
  35 |         const offenders = [...document.querySelectorAll('body *')]
  36 |           .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
  37 |           .slice(0, 8)
  38 |           .map((el) => {
  39 |             const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
  40 |             return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}`;
  41 |           });
  42 |         return {
  43 |           scrollWidth: Math.max(de.scrollWidth, document.body.scrollWidth),
  44 |           clientWidth: de.clientWidth,
  45 |           offenders,
  46 |         };
  47 |       });
  48 | 
  49 |       expect(
  50 |         result.scrollWidth,
  51 |         `Horizontal overflow on ${route} at ${width}px: scrollWidth ${result.scrollWidth} > clientWidth ${result.clientWidth}.\nElements past the right edge (may include harmless children of an overflow-x-auto box):\n  ${result.offenders.join('\n  ')}`,
  52 |       ).toBeLessThanOrEqual(result.clientWidth);
  53 |     });
  54 |   }
  55 | }
  56 | 
```