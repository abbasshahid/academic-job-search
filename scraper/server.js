import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Helper: auto-scroll to bottom to trigger lazy-load
async function autoScroll(page) {
  let lastHeight = await page.evaluate('document.body.scrollHeight');
  while (true) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(500);
    const newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }
}

// Improved clickLoadMore: only click visible & enabled handles, loop until none left
async function clickLoadMore(page) {
  const selectors = [
    'button:has-text("load more")',
    'button:has-text("show more")',
    'a:has-text("more jobs")',
    'button:has-text("weiter")', // German
  ];

  let clicked;
  do {
    clicked = false;
    for (const sel of selectors) {
      const handles = await page.$$(sel);
      for (const handle of handles) {
        const visible = await handle.isVisible();
        const enabled = typeof handle.isEnabled === 'function'
          ? await handle.isEnabled()
          : true;
        if (visible && enabled) {
          try {
            await handle.click();
            await page.waitForTimeout(500);
            console.log(`  🎉 Clicked load-more selector: ${sel}`);
            clicked = true;
            break;
          } catch (e) {
            console.warn(`  ⚠️ Could not click ${sel}: ${e.message}`);
          }
        }
      }
      if (clicked) break;
    }
  } while (clicked);
}

// 2) Scrape + handle JS, infinite scroll, load more, pagination + keyword filtering
async function scrapeAll(pages, kws) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  for (const baseUrl of pages) {
    let nextUrl = baseUrl;
    const visited = new Set();

    while (nextUrl && !visited.has(nextUrl)) {
      visited.add(nextUrl);
      console.log(`🔗 Visiting ${nextUrl}`);
      try {
        await page.goto(nextUrl, { waitUntil: 'networkidle' });
      } catch (err) {
        console.error(`⚠️ Failed to load ${nextUrl}: ${err.message}`);
        break;
      }

      // 2a) Ensure JS-rendered content is loaded
      await autoScroll(page);
      await clickLoadMore(page);

      // 2b) Extract all links
      const anchors = await page.$$eval('a', els =>
        els.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href
        }))
      );
      for (const { text, href } of anchors) {
        if (!text || !href) continue;
        const lc = text.toLowerCase();
        if (kws.some(kw => lc.includes(kw.toLowerCase()))) {
          results.push({ title: text, url: href, source: baseUrl });
          console.log(`  📄 Matched: ${text}`);
        }
      }

      // 2c) Find "next" pagination link
      const nextHandle = await page.$(
        'a[rel=next], a:has-text("Next"), a:has-text("›"), a:has-text("»")'
      );
      if (nextHandle) {
        const href = await nextHandle.getAttribute('href');
        nextUrl = href ? new URL(href, nextUrl).href : null;
        console.log(`  ⏭ Next page: ${nextUrl}`);
      } else {
        nextUrl = null;
      }
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
    const outPath = path.resolve(__dirname, '..', 'src', 'prebuilt_jobs.json');
    fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf-8');
    console.log(`✅ Wrote ${jobs.length} jobs to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Scrape failed:`, err);
    process.exit(1);
  }
})();
