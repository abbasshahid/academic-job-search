// scraper/server.js
import express from 'express';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

// A one-time scrape endpoint you’ll call from Actions:
app.post('/scrape-once', async (req, res) => {
  const { careerPages, keywords } = req.body;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const allJobs = [];

  for (const baseUrl of careerPages) {
    let nextUrl = baseUrl;
    const visited = new Set();

    while (nextUrl && !visited.has(nextUrl)) {
      visited.add(nextUrl);
      await page.goto(nextUrl, { waitUntil: 'networkidle' });
      const anchors = await page.$$eval('a', as =>
        as.map(a => ({ text: a.textContent?.trim()||'', href: a.href }))
      );
      anchors.forEach(({ text, href }) => {
        const lower = text.toLowerCase();
        if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          allJobs.push({ title: text, url: href, source: baseUrl });
        }
      });
      // look for rel="next" or numeric next-page links
      const nextHandle = await page.$('a[rel=next], a:has-text("Next"), a:has-text("›"), a:has-text("»")');
      if (nextHandle) {
        const h = await nextHandle.getAttribute('href');
        nextUrl = h ? new URL(h, baseUrl).href : null;
      } else {
        nextUrl = null;
      }
    }
  }

  await browser.close();
  // Write the JSON into src/prebuilt_jobs.json
  const outPath = path.resolve(__dirname, '..', 'src', 'prebuilt_jobs.json');
  fs.writeFileSync(outPath, JSON.stringify(allJobs, null, 2), 'utf-8');
  res.json({ count: allJobs.length });
});

// Allow local testing:
if (require.main === module) {
  app.listen(9000, () => console.log('Scraper listening on http://localhost:9000'));
}
