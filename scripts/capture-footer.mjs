import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const footerEl = await page.$('.sf');
  if (footerEl) {
    await footerEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await footerEl.screenshot({ path: 'verify_updated_footer.png' });
    console.log('Saved verify_updated_footer.png');
  } else {
    console.log('Footer .sf element not found');
  }

  await browser.close();
}

await main();
