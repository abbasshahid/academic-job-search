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

// Safe navigation with retries for network errors
async function safeGoto(page, url) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await page.goto(url, {
        waitUntil: 'domcontentloaded',  // ✅ less strict than networkidle
        timeout: 60000
      });
    } catch (e) {
      console.warn(`⚠️ goto attempt ${attempt} for ${url} failed: ${e.message}`);
      if (attempt === maxAttempts) throw e;
      await page.waitForTimeout(2000);
    }
  }
}

await safeGoto(page, nextUrl);
await page.waitForTimeout(1500); // let JS render

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

// Helper: click any "load more" buttons when visible and enabled
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
        try {
          if (await handle.isVisible() && await handle.isEnabled()) {
            await handle.click();
            console.log(`  🎉 Clicked load-more selector: ${sel}`);
            await page.waitForTimeout(500);
            clicked = true;
            break;
          }
        } catch (e) {
          // ignore errors on clicking invisible elements
        }
      }
      if (clicked) break;
    }
  } while (clicked);
}

// 2) Scrape + handle JS, infinite scroll, load more, pagination + filtering
async function scrapeAll(pages, kws) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();   // ✅ page exists ONLY after this line
  const results = [];

  for (const baseUrl of pages) {
    let nextUrl = baseUrl;
    const visited = new Set();

    while (nextUrl && !visited.has(nextUrl)) {
      visited.add(nextUrl);
      console.log(`🔗 Visiting ${nextUrl}`);

      // ✅ THIS is where the try/catch goes
      try {
        await safeGoto(page, nextUrl);
      } catch (err) {
        console.error(`⚠️ Failed to load ${nextUrl}: ${err.message}`);
        nextUrl = null;   // skip only this baseUrl
        continue;
      }

      await autoScroll(page);
      await clickLoadMore(page);

      const anchors = await page.$$eval('a', els =>
        els.map(a => ({ text: a.textContent?.trim() || '', href: a.href }))
      );

      for (const { text, href } of anchors) {
        if (!text || !href) continue;
        const lc = text.toLowerCase();
        if (kws.some(kw => lc.includes(kw.toLowerCase()))) {
          results.push({ title: text, url: href, source: baseUrl });
          console.log(`  📄 Matched: ${text}`);
        }
      }

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

    const outPath = path.resolve(__dirname, '..', 'public', 'prebuilt_jobs.json');

    // ✅ ensure public/ exists in GitHub Actions runner
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf-8');
    console.log(`✅ Wrote ${jobs.length} jobs to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Scrape failed:`, err);
    process.exit(1);
  }
})();

