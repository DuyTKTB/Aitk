const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Mock logged in user in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'user-tk-tester-123',
      displayName: 'Duyyy nè',
      email: 'duyyy@elec.edu.vn',
      photoURL: null,
    }));
  });

  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Dispatch event to open community chat
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-community-chat'));
  });
  await page.waitForTimeout(1000);

  const chatCard = page.locator('.ns9-comm-card');
  if (await chatCard.count() > 0) {
    await chatCard.screenshot({ path: path.join(__dirname, 'verify-avatar-4-community-chat.png') });
    console.log('Saved verify-avatar-4-community-chat.png');
  }

  await browser.close();
})();
