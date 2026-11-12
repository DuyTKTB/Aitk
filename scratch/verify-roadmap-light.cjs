const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  await context.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'dev-user-01',
      displayName: 'Nguyễn Duy TK',
      email: 'duyfamobo@gmail.com',
    }));
    localStorage.setItem('elec-user-profile:dev-user-01', JSON.stringify({
      fullName: 'Nguyễn Duy TK',
      invoice: { invoiceEmail: 'duyfamobo@gmail.com' }
    }));
    localStorage.setItem('elec-aspirations-v2:dev-user-01', JSON.stringify({
      activeExamId: 'thptqg',
      activeAspirationId: 'asp-bka',
      aspirations: [
        {
          id: 'asp-bka',
          examId: 'thptqg',
          priority: 1,
          school: { code: 'BKA', name: 'Đại Học Bách Khoa Hà Nội' },
          major: { id: 'm-chem-eng', name: 'Kỹ thuật Hóa học' },
          block: 'A00',
          benchmark2025: 24.25,
          targetScore: 24.75,
          targetChemScore: 8.5,
          margin: 0.5,
          safety: 'target',
        }
      ]
    }));
    localStorage.setItem('cs-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'scratch/verified-roadmap-light.png' });
  console.log('Saved scratch/verified-roadmap-light.png');

  // Navigate to Dedicated Lesson View in Light mode
  await page.goto('http://localhost:5173/#roadmap?lesson=ly-chuyen-dong-nem', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/verified-dedicated-light.png' });
  console.log('Saved scratch/verified-dedicated-light.png');

  await browser.close();
})();
