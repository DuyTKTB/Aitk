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

  // 1. Matrix
  const matrixEl = await page.$('.ns9-matrix-wrap');
  if (matrixEl) {
    await matrixEl.screenshot({ path: 'verify_mascot_matrix.png' });
    console.log('Matrix screenshot captured!');
  } else {
    console.log('Matrix element not found');
  }

  // 2. Discovery
  const discEl = await page.$('.ns9-discovery-wrap');
  if (discEl) {
    await discEl.screenshot({ path: 'verify_mascot_discovery.png' });
    console.log('Discovery screenshot captured!');
  } else {
    console.log('Discovery element not found');
  }

  // 3. Classroom
  const crEl = await page.$('.ns9-classroom-hub-card');
  if (crEl) {
    await crEl.screenshot({ path: 'verify_mascot_classroom.png' });
    console.log('Classroom screenshot captured!');
  } else {
    console.log('Classroom element not found');
  }

  // 4. Virtual Exams
  await page.goto('http://localhost:5173/#virtual-exams', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const bannerEl = await page.$('.ns9-vex-struct-banner');
  if (bannerEl) {
    await bannerEl.screenshot({ path: 'verify_mascot_vex_banner.png' });
    console.log('Vex banner screenshot captured!');
  }

  await browser.close();
}

await main();
