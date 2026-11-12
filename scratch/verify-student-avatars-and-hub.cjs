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
      uid: 'X6EIQPJNcQgb3nPJACCC1E0zUc63',
      displayName: 'Duyyy nè',
      email: 'duyfamabo@gmail.com',
      photoURL: null,
    }));
  });

  // 1. Check Community Chat
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open community chat
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-community-chat'));
  });
  await page.waitForTimeout(1000);

  // Screenshot community chat messages showing avatars
  const chatCard = page.locator('.ns9-comm-card');
  if (await chatCard.count() > 0) {
    await chatCard.screenshot({ path: path.join(__dirname, 'verified-community-chat-student-avatars.png') });
    console.log('Saved verified-community-chat-student-avatars.png');

    // Click channel dropdown to inspect popover icons
    const titleBtn = page.locator('.ns9-chat-title-btn');
    if (await titleBtn.count() > 0) {
      await titleBtn.click();
      await page.waitForTimeout(500);
      await chatCard.screenshot({ path: path.join(__dirname, 'verified-channel-popover-svg-icons.png') });
      console.log('Saved verified-channel-popover-svg-icons.png');
    }
  }

  // 2. Check Roadmap Hub (Image 2 fix)
  console.log('Navigating to http://localhost:5173/#roadmap ...');
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const hubBanner = page.locator('.ns9-banner-hero-card, .ns9-bh-user-row');
  if (await hubBanner.count() > 0) {
    await hubBanner.first().screenshot({ path: path.join(__dirname, 'verified-roadmap-hub-user-avatar.png') });
    console.log('Saved verified-roadmap-hub-user-avatar.png');
  } else {
    await page.screenshot({ path: path.join(__dirname, 'verified-roadmap-hub-page.png'), clip: { x: 0, y: 0, width: 1440, height: 500 } });
    console.log('Saved verified-roadmap-hub-page.png');
  }

  await browser.close();
  console.log('Done all verifications!');
})();
