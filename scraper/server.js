import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Read payload.json for your URLs and keywords
const payloadPath = path.resolve(__dirname, 'payload.json');
if (!fs.existsSync(payloadPath)) {
  console.error(`❌ Cannot find payload.json at ${payloadPath}`);
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
const { careerPages, keywords } = payload;
if (!Array.isArray(careerPages) || !Array.isArray(keywords)) {
  console.error('❌ payload.json must have arrays: careerPages, keywords');
  process.exit(1);
}

// 2) Scrape + pagination + filter logic
tmp: any;
async function scrapeAll(pages, kws) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  for (const base of pages) {
    let nextUrl = base;
    const seen = new Set();

    while (nextUrl && !seen.has(nextUrl)) {
      seen.add(nextUrl);
      console.log(`🔗 Loading ${nextUrl}`);
      try {
        await page.goto(nextUrl, { waitUntil: 'networkidle' });
      } catch (err) {
        console.error(`⚠️ Failed to load ${nextUrl}: ${err.message}`);
        break;
      }

      // Collect links
      const anchors = await page.$$eval('a', els =>
        els.map(a => ({ text: a.textContent?.trim() || '', href: a.href }))
      );
      for (const { text, href } of anchors) {
        if (!text || !href) continue;
        const lc = text.toLowerCase();
        if (kws.some(kw => lc.includes(kw.toLowerCase()))) {
          results.push({ title: text, url: href, source: base });
          console.log(`  📄 Matched: ${text}`);
        }
      }

      // Find next pagination link
      const nextHandle = await page.$(
        `a[rel=next], a:has-text("Next"), a:has-text("›"), a:has-text("»")`
      );
      if (nextHandle) {
        const href = await nextHandle.getAttribute('href');
        nextUrl = href ? new URL(href, nextUrl).href : null;
        console.log(`  ⏭ Next: ${nextUrl}`);
      } else {
        nextUrl = null;
      }
    }
  }

  await browser.close();
  return results;
}

// 3) Run one-off scrape and write JSON
(async () => {
  console.log(`🚀 Starting scrape of ${careerPages.length} pages`);
  try {
    const jobs = await scrapeAll(careerPages, keywords);
    const outPath = path.resolve(__dirname, '..', 'src', 'prebuilt_jobs.json');
    fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2), 'utf-8');
    console.log(`✅ Written ${jobs.length} jobs to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Scrape failed: ${err}`);
    process.exit(1);
  }
})();
