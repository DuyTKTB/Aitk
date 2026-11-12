const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

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

  // Open community chat
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-community-chat'));
  });
  await page.waitForTimeout(1000);

  // Type a message in input
  const input = page.locator('.ns9-comm-card textarea, .ns9-comm-card input[type="text"]').last();
  if (await input.count() > 0) {
    await input.fill('Test tin nhắn của tôi nè');
    await input.press('Enter');
    await page.waitForTimeout(1000);
  }

  const chatCard = page.locator('.ns9-comm-card');
  if (await chatCard.count() > 0) {
    await chatCard.screenshot({ path: path.join(__dirname, 'verify-avatar-4c-sent-message.png') });
    console.log('Saved verify-avatar-4c-sent-message.png');
  }

  await browser.close();
})();
