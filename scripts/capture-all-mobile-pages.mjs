import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'mock-user-123',
      displayName: 'Duyyy',
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
          targetScore: 25.5
        }
      ],
      activeAspirationId: 'asp_1'
    };
    localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspData));
    localStorage.setItem('elec-aspirations-v2:mock-user-123', JSON.stringify(aspData));
  });

  // 1. Home in Light Mode
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'mobile_light_home.png' });
  console.log('Saved mobile_light_home.png');

  // 2. Virtual Exams on Mobile
  await page.goto('http://localhost:5173/#virtual-exams', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'mobile_virtual_exams.png' });
  console.log('Saved mobile_virtual_exams.png');

  // 3. Roadmap on Mobile
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'mobile_roadmap.png' });
  console.log('Saved mobile_roadmap.png');

  // 4. Leaderboard on Mobile
  await page.goto('http://localhost:5173/#leaderboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'mobile_leaderboard.png' });
  console.log('Saved mobile_leaderboard.png');

  await browser.close();
  console.log('All mobile pages captured.');
}

await main();
