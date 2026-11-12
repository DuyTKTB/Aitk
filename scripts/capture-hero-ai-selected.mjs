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
    const aspData = {
      aspirations: [
        {
          id: 'asp_1',
          priority: 1,
          school: {
            code: 'BKA',
            name: 'Đại Học Bách Khoa Hà Nội'
          },
          major: {
            code: 'EE2',
            name: 'Kỹ thuật Điều khiển & Tự động hóa'
          },
          targetScore: 24.75
        }
      ],
      activeAspirationId: 'asp_1'
    };
    localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspData));
    localStorage.setItem('elec-aspirations-v2:mock-user-123', JSON.stringify(aspData));
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
    await heroEl.screenshot({ path: 'hero_ai_bka_selected.png' });
    console.log('Hero section with BKA selected captured!');
  }

  await browser.close();
}

await main();
