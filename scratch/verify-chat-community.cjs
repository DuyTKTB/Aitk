const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  await context.addInitScript(() => {
    localStorage.setItem('cs-theme-v2', 'light');
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'dev-user-01',
      displayName: 'Nguyễn Duy TK',
      email: 'duyfamobo@gmail.com',
    }));
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5174/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // 1. Click the navbar chat icon
  console.log('Clicking navbar chat icon...');
  const chatBtn = await page.$('.nav-companion-msg-btn');
  if (chatBtn) {
    await chatBtn.click();
    await page.waitForTimeout(1000);
  } else {
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('elec-open-community-chat')));
    await page.waitForTimeout(1000);
  }

  // Scroll to top of scroll area to see mascot and quick pills
  await page.evaluate(() => {
    const el = document.querySelector('.ns9-chat-scroll-area');
    if (el) el.scrollTop = 0;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/verified-community-chat-top.png' });
  console.log('Saved scratch/verified-community-chat-top.png');

  // Type in the composer
  await page.fill('.ns9-cf-input', 'Dạ em đang ôn thi phần Este Lipit, mọi người có tài liệu hay không ạ?');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/verified-community-chat-typing.png' });
  console.log('Saved scratch/verified-community-chat-typing.png');

  await browser.close();
})();
