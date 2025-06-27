import express from 'express';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

console.log('🔥 Starting scraper service...');

// POST /scrape-once: Body { careerPages: string[], keywords: string[] }
app.post('/scrape-once', async (req, res) => {
  console.log('📬 Received scrape request');
  const { careerPages, keywords } = req.body;
  if (!Array.isArray(careerPages) || !Array.isArray(keywords)) {
    console.error('❌ Invalid payload:', req.body);
    return res.status(400).json({ error: 'careerPages & keywords arrays required' });
  }

  console.log(`🚀 Scraping ${careerPages.length} pages for keywords: ${keywords}`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const allJobs = [];

  for (const baseUrl of careerPages) {
    console.log(`🔗 Navigating initial page: ${baseUrl}`);
    let nextUrl = baseUrl;
    const visited = new Set();

    while (nextUrl && !visited.has(nextUrl)) {
      visited.add(nextUrl);
      console.log(`➡️ Visiting: ${nextUrl}`);
      try {
        await page.goto(nextUrl, { waitUntil: 'networkidle' });
      } catch (err) {
        console.error(`⚠️ Failed to load ${nextUrl}:`, err.message);
        break;
      }

      // Extract and filter anchors
      const anchors = await page.$$eval('a', as =>
        as.map(a => ({ text: a.textContent?.trim() || '', href: a.href }))
      );
      for (const { text, href } of anchors) {
        if (!text || !href) continue;
        const lower = text.toLowerCase();
        if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          console.log(`  📄 Found job: ${text}`);
          allJobs.push({ title: text, url: href, source: baseUrl });
        }
      }

      // Find next link by rel=next or common text
      const nextHandle = await page.$(
        `a[rel=next], a:has-text('Next'), a:has-text('›'), a:has-text('»')`
      );
      if (nextHandle) {
        const href = await nextHandle.getAttribute('href');
        nextUrl = href ? new URL(href, nextUrl).href : null;
        console.log(`  🔄 Queued next page: ${nextUrl}`);
      } else {
        nextUrl = null;
      }
    }
  }

  await browser.close();
  console.log(`✅ Scraped total jobs: ${allJobs.length}`);

  // Write JSON
  const outPath = path.resolve(__dirname, '..', 'src', 'prebuilt_jobs.json');
  fs.writeFileSync(outPath, JSON.stringify(allJobs, null, 2), 'utf-8');
  console.log(`💾 Written JSON to ${outPath}`);

  return res.json({ count: allJobs.length });
});

// Always start the server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`🎧 Scraper listening on http://localhost:${PORT}`);
});

