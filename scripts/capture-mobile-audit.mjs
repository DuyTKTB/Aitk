import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  // iPhone 14/15 Pro viewport: 393 x 852
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

  console.log('Opening mobile view at http://localhost:5173/#home ...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. Mobile Hero & Header
  await page.screenshot({ path: 'mobile_audit_hero.png' });
  console.log('Saved mobile_audit_hero.png');

  // 2. Scroll to Bento 3 Cards & Hub
  const bentoEl = await page.$('.ns9-three-bento-grid');
  if (bentoEl) {
    await bentoEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'mobile_audit_bento.png' });
    console.log('Saved mobile_audit_bento.png');
  }

  // 3. Scroll to Matrix
  const matrixEl = await page.$('.ns9-matrix-wrap');
  if (matrixEl) {
    await matrixEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'mobile_audit_matrix.png' });
    console.log('Saved mobile_audit_matrix.png');
  }

  // 4. Scroll to Discovery & Quiz
  const discEl = await page.$('.ns9-discovery-wrap');
  if (discEl) {
    await discEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'mobile_audit_discovery.png' });
    console.log('Saved mobile_audit_discovery.png');
  }

  // 5. Scroll to Classroom Hub
  const crEl = await page.$('.ns9-classroom-hub-card');
  if (crEl) {
    await crEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'mobile_audit_classroom.png' });
    console.log('Saved mobile_audit_classroom.png');
  }

  await browser.close();
  console.log('Done mobile audit capture.');
}

await main();
