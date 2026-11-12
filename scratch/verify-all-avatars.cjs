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
      photoURL: null, // Test that the logo shows up instead of initial
    }));
  });

  console.log('Navigating to http://localhost:5173/#home ...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2500);

  // 1. Open Community Chat via event or button
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-community-chat'));
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'verify-avatar-4-community-chat.png'), clip: { x: 750, y: 100, width: 680, height: 780 } });
  console.log('Saved verify-avatar-4-community-chat.png');

  // Close chat if open
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 2. Navigate to Profile page
  console.log('Navigating to http://localhost:5173/#profile ...');
  await page.goto('http://localhost:5173/#profile', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'verify-avatar-5-profile-page.png'), clip: { x: 0, y: 0, width: 1440, height: 500 } });
  console.log('Saved verify-avatar-5-profile-page.png');

  // 3. Navigate to Profile Edit section
  await page.goto('http://localhost:5173/#profile?tab=settings&sub=info', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'verify-avatar-6-profile-edit.png'), clip: { x: 0, y: 0, width: 1440, height: 650 } });
  console.log('Saved verify-avatar-6-profile-edit.png');

  await browser.close();
  console.log('Done screenshots 4, 5, 6!');
})();
