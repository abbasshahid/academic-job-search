import { MAX_LOAD_MORE_CLICKS_PER_PAGE, WAIT_AFTER_CLICK_MS } from './config.js';

export async function safeGoto(page, url) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } catch (error) {
      console.warn(`goto attempt ${attempt} for ${url} failed: ${error.message}`);
      if (attempt === maxAttempts) {
        throw error;
      }
      await page.waitForTimeout(2000);
    }
  }

  return null;
}

export async function autoScroll(page) {
  try {
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    for (let index = 0; index < 20; index += 1) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);

      let nextHeight;
      try {
        nextHeight = await page.evaluate(() => document.body.scrollHeight);
      } catch (error) {
        if (String(error).includes('Execution context was destroyed')) {
          return;
        }
        throw error;
      }

      if (nextHeight === lastHeight) {
        break;
      }
      lastHeight = nextHeight;
    }
  } catch (error) {
    if (String(error).includes('Execution context was destroyed')) {
      return;
    }
    throw error;
  }
}

export async function clickLoadMore(page) {
  const selectors = [
    'button:has-text("load more")',
    'button:has-text("show more")',
    'a:has-text("more jobs")',
    'button:has-text("weiter")',
    'a:has-text("weiter")',
    'button:has-text("mehr")',
    'a:has-text("mehr")',
  ];

  const getAnchorCount = async () => page.locator('a').count();
  let clicks = 0;
  let previousCount = await getAnchorCount();

  while (clicks < MAX_LOAD_MORE_CLICKS_PER_PAGE) {
    let clicked = false;

    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      const visible = await locator.isVisible().catch(() => false);
      if (!visible) {
        continue;
      }

      const enabled = await locator.isEnabled().catch(() => true);
      if (!enabled) {
        continue;
      }

      try {
        await locator.scrollIntoViewIfNeeded();
        await locator.click({ timeout: 15000 });
        clicks += 1;
        clicked = true;
        await page.waitForTimeout(WAIT_AFTER_CLICK_MS);

        const nextCount = await getAnchorCount();
        if (nextCount <= previousCount) {
          await page.waitForTimeout(900);
          const retryCount = await getAnchorCount();
          if (retryCount <= previousCount) {
            return;
          }
          previousCount = retryCount;
        } else {
          previousCount = nextCount;
        }
        break;
      } catch {
        continue;
      }
    }

    if (!clicked) {
      return;
    }
  }
}
