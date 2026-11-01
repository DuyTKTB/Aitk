import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  await page.addInitScript(() => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('elec-onboarding-dismissed', 'true');
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'admin-1',
      displayName: 'Admin ELEC',
      email: 'admin@elec.vn',
      isVip: true,
      role: 'admin'
    }));
  });

  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.cg-action-btn');

  const btn = page.locator('button:has-text("Cài đặt & Quản lý trò chơi")');
  await btn.click();
  await page.waitForTimeout(600);

  const isBackdrop = await page.locator('.cg-modal-backdrop').isVisible();
  console.log('Backdrop visible:', isBackdrop);

  const modalTitle = await page.locator('.cg-question-box h3, .cg-question-box h2').allInnerTexts();
  console.log('Modal titles:', modalTitle);

  await page.screenshot({ path: 'test_game_settings_modal.png' });
  console.log('Screenshot saved to test_game_settings_modal.png');

  await browser.close();
})();
