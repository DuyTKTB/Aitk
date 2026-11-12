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
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: 'scratch/verified-roadmap-hero-top.png' });
  console.log('Saved scratch/verified-roadmap-hero-top.png');

  // Scroll down to see 3 quick nav cards and chart
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/verified-roadmap-quick-cards.png' });
  console.log('Saved scratch/verified-roadmap-quick-cards.png');

  // Navigate to Dedicated Lesson View
  await page.goto('http://localhost:5173/#roadmap?lesson=ly-chuyen-dong-nem', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/verified-dedicated-lesson.png' });
  console.log('Saved scratch/verified-dedicated-lesson.png');

  // Click on Mindmap tab
  const mindmapBtn = await page.$('.ns9-mode-tab:has-text("Sơ đồ tư duy")');
  if (mindmapBtn) {
    await mindmapBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'scratch/verified-dedicated-mindmap.png' });
    console.log('Saved scratch/verified-dedicated-mindmap.png');
  }

  await browser.close();
})();
