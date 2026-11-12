import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'mock-user-123',
      displayName: 'Duyyy nè',
      email: 'duyfamabo@gmail.com',
      role: 'student'
    }));
    // User is FREE so VIP exams are locked
    localStorage.setItem('elec_sub_quota_v1_mock-user-123', JSON.stringify({
      planName: 'FREE',
      hearts: 5,
      maxHearts: 5,
    }));
    localStorage.setItem('theme', 'light');
  });

  await page.goto('http://localhost:5173/#virtual-exams', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on locked VIP card button
  const lockBtn = await page.$('.ns9-vex-start-btn.is-locked');
  if (lockBtn) {
    await lockBtn.click();
    await page.waitForTimeout(1000);
    const modalEl = await page.$('.ns9-9s-modal-card');
    if (modalEl) {
      await modalEl.screenshot({ path: 'verify_mascot_pricing_modal.png' });
      console.log('Pricing modal screenshot captured!');
    } else {
      console.log('Modal element .ns9-9s-modal-card not found');
    }
  } else {
    console.log('Lock button not found');
  }

  await browser.close();
}

await main();
