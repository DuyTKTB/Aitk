import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'mock-user-123',
      displayName: 'Duyyy nè',
      email: 'duyfamabo@gmail.com',
      role: 'student'
    }));
    localStorage.setItem('theme', 'light');
  });

  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });

  await page.waitForTimeout(500);

  const heroEl = await page.$('.ns9-unified-hero');
  if (heroEl) {
    await heroEl.screenshot({ path: 'hero_ai_light.png' });
    console.log('Hero section light screenshot captured!');
  }

  const bentoEl = await page.$('.ns9-three-bento-grid');
  if (bentoEl) {
    await bentoEl.screenshot({ path: 'bento_three_cards.png' });
    console.log('Bento three cards screenshot captured!');
  }

  await browser.close();
}

await main();
