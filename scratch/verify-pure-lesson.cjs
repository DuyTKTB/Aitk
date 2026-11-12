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
    localStorage.setItem('elec-user-profile:dev-user-01', JSON.stringify({
      fullName: 'Nguyễn Duy TK',
      invoice: { invoiceEmail: 'duyfamobo@gmail.com' }
    }));
  });

  const page = await context.newPage();
  
  // 1. Light Mode - Top of lesson
  await page.goto('http://localhost:5173/#roadmap?lesson=ly-chuyen-dong-nem', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/verified-pure-lesson-light-top.png' });
  console.log('Saved scratch/verified-pure-lesson-light-top.png');

  // 2. Light Mode - Scrolled to formula & traps (exact match of user reference photo)
  const formulaAnchor = await page.$('.ns9-active-sub-anchors li:has-text("Công thức cần nhớ")');
  if (formulaAnchor) {
    await formulaAnchor.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: 'scratch/verified-pure-lesson-light-formula.png' });
  console.log('Saved scratch/verified-pure-lesson-light-formula.png');

  // 3. Dark Mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('cs-theme-v2', 'dark');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/verified-pure-lesson-dark-formula.png' });
  console.log('Saved scratch/verified-pure-lesson-dark-formula.png');

  await browser.close();
})();
