import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------
// Global safety limits
// --------------------
const MAX_LOAD_MORE_CLICKS_PER_PAGE = 25;  // prevents infinite "weiter" clicking
const MAX_PAGES_PER_SITE = 50;             // prevents infinite pagination loops
const WAIT_AFTER_CLICK_MS = 900;           // allow DOM to update

// 1) Load payload.json for your careerPages + keywords
const payloadPath = path.resolve(__dirname, 'payload.json');
if (!fs.existsSync(payloadPath)) {
  console.error(`❌ Cannot find payload.json at ${payloadPath}`);
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
const { careerPages, keywords } = payload;
if (!Array.isArray(careerPages) || !Array.isArray(keywords)) {
  console.error('❌ payload.json must contain arrays careerPages & keywords');
  process.exit(1);
}

// Safe navigation with retries for network errors
async function safeGoto(page, url) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await page.goto(url, {
        waitUntil: 'domcontentloaded', // avoids networkidle hangs
        timeout: 60000,
      });
    } catch (e) {
      console.warn(`⚠️ goto attempt ${attempt} for ${url} failed: ${e.message}`);
      if (attempt === maxAttempts) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

// Helper: auto-scroll to bottom to trigger lazy-load
async function autoScroll(page) {
  try {
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    for (let i = 0; i < 20; i++) { // hard cap so it can't loop forever
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);

      let newHeight;
      try {
        newHeight = await page.evaluate(() => document.body.scrollHeight);
      } catch (e) {
        if (String(e).includes('Execution context was destroyed')) return;
        throw e;
      }

      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }
  } catch (e) {
    if (String(e).includes('Execution context was destroyed')) return;
    throw e;
  }
}

/**
 * Safer "Load more" clicker:
 * - uses locators (stable)
 * - stops if clicking doesn't increase link count (no new content)
 * - max clicks guard
 */
async function clickLoadMore(page) {
  const selectors = [
    'button:has-text("load more")',
    'button:has-text("show more")',
    'a:has-text("more jobs")',
    'button:has-text("weiter")', // German
    'a:has-text("weiter")',
    'button:has-text("mehr")',
    'a:has-text("mehr")',
  ];

  // Measure page "growth" using number of anchors. It's generic and works widely.
  const getAnchorCount = async () => page.locator('a').count();

  let clicks = 0;
  let lastCount = await getAnchorCount();

  while (clicks < MAX_LOAD_MORE_CLICKS_PER_PAGE) {
    let clickedSomething = false;

    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      const isVisible = await loc.isVisible().catch(() => false);
      if (!isVisible) continue;

      // Some sites keep the element but disable it; isEnabled helps.
      const isEnabled = await loc.isEnabled().catch(() => true); // if unsupported, assume true
      if (!isEnabled) continue;

      try {
        await loc.scrollIntoViewIfNeeded();
        await loc.click({ timeout: 15000 });
        clicks++;
        clickedSomething = true;
        console.log(`  🎉 Clicked load-more selector: ${sel}`);

        await page.waitForTimeout(WAIT_AFTER_CLICK_MS);

        const newCount = await getAnchorCount();

        // If nothing changed, stop trying — prevents infinite loop
        if (newCount <= lastCount) {
          // Try one short extra wait in case content loads slightly later
          await page.waitForTimeout(900);
          const retryCount = await getAnchorCount();
          if (retryCount <= lastCount) {
            console.log('  🛑 Load-more produced no new content. Stopping load-more on this page.');
            return;
          }
          lastCount = retryCount;
        } else {
          lastCount = newCount;
        }

        break; // clicked one control; re-scan selectors from start
      } catch (e) {
        // If click fails, try other selectors
      }
    }

    if (!clickedSomething) return; // nothing found -> stop
  }

  console.log(`  🛑 Reached max load-more clicks (${MAX_LOAD_MORE_CLICKS_PER_PAGE}). Stopping load-more.`);
}

// 2) Scrape + handle JS, infinite scroll, load more, pagination + filtering
async function scrapeAll(pages, kws) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const results = [];
  const seenJobUrls = new Set(); // dedupe across the whole run

  for (const baseUrl of pages) {
    let nextUrl = baseUrl;
    const visited = new Set();
    let pageCounter = 0;

    while (nextUrl && !visited.has(nextUrl) && pageCounter < MAX_PAGES_PER_SITE) {
      pageCounter++;
      visited.add(nextUrl);
      console.log(`🔗 Visiting ${nextUrl}`);

      try {
        await safeGoto(page, nextUrl);
        await page.waitForTimeout(1200);
      } catch (err) {
        console.error(`⚠️ Failed to load ${nextUrl}: ${err.message}`);
        nextUrl = null;
        continue;
      }

      // Ensure JS-rendered content is loaded
      try { await autoScroll(page); } catch (e) {
        console.warn(`⚠️ autoScroll skipped due to: ${e.message}`);
      }

      // Click load more safely (no infinite loops)
      try { await clickLoadMore(page); } catch (e) {
        console.warn(`⚠️ clickLoadMore skipped due to: ${e.message}`);
      }

      // Extract all links
      let anchors = [];
      try {
        anchors = await page.$$eval('a', els =>
          els.map(a => ({ text: a.textContent?.trim() || '', href: a.href }))
        );
      } catch (e) {
        console.warn(`⚠️ Failed to extract anchors on ${nextUrl}: ${e.message}`);
      }

      for (const { text, href } of anchors) {
        if (!text || !href) continue;

        const lc = text.toLowerCase();
        if (kws.some(kw => lc.includes(String(kw).toLowerCase()))) {
          // Deduplicate by job URL
          if (!seenJobUrls.has(href)) {
            seenJobUrls.add(href);
            results.push({ title: text, url: href, source: baseUrl });
            console.log(`  📄 Matched: ${text}`);
          }
        }
      }

      // Find "next" pagination link (generic)
      const nextLocator = page.locator(
        'a[rel=next], a:has-text("Next"), a:has-text("›"), a:has-text("»"), a:has-text("Weiter"), a:has-text("Nächste")'
      ).first();

      const hasNext = await nextLocator.isVisible().catch(() => false);

      if (hasNext) {
        const href = await nextLocator.getAttribute('href');
        nextUrl = href ? new URL(href, nextUrl).href : null;
        console.log(`  ⏭ Next page: ${nextUrl}`);
      } else {
        nextUrl = null;
      }
    }

    if (pageCounter >= MAX_PAGES_PER_SITE) {
      console.warn(`⚠️ Reached MAX_PAGES_PER_SITE (${MAX_PAGES_PER_SITE}) for ${baseUrl}. Moving on.`);
    }
  }

  await browser.close();
  return results;
}

// 3) Execute one-off scrape and write JSON
(async () => {
  console.log(`🚀 Starting scrape of ${careerPages.length} pages`);
  try {
    const jobs = await scrapeAll(careerPages, keywords);

    // write to public/ so Vite/GitHub Pages serves it
    const outPath = path.resolve(__dirname, '..', 'public', 'prebuilt_jobs.json');

    // ensure folder exists
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf-8');
    console.log(`✅ Wrote ${jobs.length} jobs to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Scrape failed:`, err);
    process.exit(1);
  }
})();