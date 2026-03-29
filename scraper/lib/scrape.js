import { chromium } from 'playwright';
import { MAX_PAGES_PER_SITE } from './config.js';
import { autoScroll, clickLoadMore, safeGoto } from './browser.js';
import { buildJobRecord, shouldKeepAnchor } from './normalize.js';

export async function scrapeAll(careerPages, keywords, generatedAt) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const results = [];
  const seenJobIds = new Set();

  for (const sourceUrl of careerPages) {
    let nextUrl = sourceUrl;
    const visited = new Set();
    let pageCounter = 0;

    while (nextUrl && !visited.has(nextUrl) && pageCounter < MAX_PAGES_PER_SITE) {
      pageCounter += 1;
      visited.add(nextUrl);
      console.log(`Visiting ${nextUrl}`);

      try {
        await safeGoto(page, nextUrl);
        await page.waitForTimeout(1200);
      } catch (error) {
        console.error(`Failed to load ${nextUrl}: ${error.message}`);
        nextUrl = null;
        continue;
      }

      await autoScroll(page).catch((error) => {
        console.warn(`autoScroll skipped for ${nextUrl}: ${error.message}`);
      });
      await clickLoadMore(page).catch((error) => {
        console.warn(`clickLoadMore skipped for ${nextUrl}: ${error.message}`);
      });

      const anchors = await page.$$eval('a', (elements) =>
        elements.map((anchor) => ({
          text: anchor.textContent?.trim() ?? '',
          href: anchor.href,
        }))
      ).catch(() => []);

      for (const anchor of anchors) {
        if (!shouldKeepAnchor({ ...anchor, keywords })) {
          continue;
        }

        const job = buildJobRecord({
          title: anchor.text,
          href: anchor.href,
          sourceUrl,
          generatedAt,
        });

        if (seenJobIds.has(job.id)) {
          continue;
        }

        seenJobIds.add(job.id);
        results.push(job);
      }

      const nextLocator = page.locator(
        'a[rel=next], a:has-text("Next"), a:has-text("›"), a:has-text("»"), a:has-text("Weiter"), a:has-text("Nächste")'
      ).first();

      const hasNext = await nextLocator.isVisible().catch(() => false);
      if (!hasNext) {
        nextUrl = null;
        continue;
      }

      const href = await nextLocator.getAttribute('href');
      nextUrl = href ? new URL(href, nextUrl).href : null;
    }
  }

  await browser.close();
  return results;
}
