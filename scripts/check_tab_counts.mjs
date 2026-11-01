import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  await page.addInitScript(() => {
    const uid = 'test-user';
    const aspData = {
      userId: uid,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp-1',
      onboardingCompleted: true,
      aspirations: [{ id: 'asp-1', priority: 1, examId: 'THPTQG', schoolId: 'BKA' }]
    };
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify(aspData));
    localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspData));
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('elec-onboarding-dismissed', 'true');
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({ uid, displayName: 'Duy', email: 'test@example.com' }));
  });

  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2', { timeout: 10000 });

  const totalAll = await page.locator('.game-card-v2').count();
  console.log('Total cards in All:', totalAll);

  const tabs = await page.locator('.cg-tab-btn').allInnerTexts();
  console.log('Tabs:', tabs);

  const tabCounts = {};
  for (let i = 0; i < tabs.length; i++) {
    await page.locator('.cg-tab-btn').nth(i).click({ force: true });
    await page.waitForTimeout(300);
    const count = await page.locator('.game-card-v2').count();
    const cleanTab = tabs[i].replace(/\s+/g, ' ').trim();
    tabCounts[cleanTab] = count;
  }
  console.log('Tab counts:', tabCounts);

  // Check sum of categories (excluding 'Tất cả')
  const categoriesSum = (tabCounts['Camera (14)'] || 0) +
    (tabCounts['Đối kháng & Đua tốc độ'] || 0) +
    (tabCounts['Gameshow & May mắn'] || 0) +
    (tabCounts['Rèn luyện & Thí nghiệm'] || 0);

  console.log(`Sum of 4 categories: ${categoriesSum} vs Total All: ${totalAll}`);
  console.log(`Difference (Orphan Games): ${totalAll - categoriesSum}`);

  // Test opening guide for first card
  await page.locator('.cg-tab-btn').first().click({ force: true });
  await page.waitForTimeout(300);
  const firstGuideBtn = page.locator('.gc-guide-btn').first();
  await firstGuideBtn.click();
  const guideVisible = await page.locator('.gc-guide').first().isVisible();
  console.log('First card guide accordion open:', guideVisible);

  // Test Settings Modal
  const settingsBtn = page.locator('button:has-text("Cài đặt & Quản lý trò chơi")');
  await settingsBtn.click();
  await page.waitForTimeout(500);
  const modalVisible = await page.locator('.cg-modal, [role="dialog"], .cgs-modal').first().isVisible();
  console.log('Game Settings modal open:', modalVisible);

  await browser.close();
})();
