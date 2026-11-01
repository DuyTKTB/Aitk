import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const uid = 'admin-user-123';
  await page.addInitScript(({ uid }) => {
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
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid,
      displayName: 'Thầy Duy Admin',
      email: 'admin@elec.vn',
      isVip: true,
      role: 'admin'
    }));
  }, { uid });

  console.log('Navigating to #games...');
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2', { timeout: 10000 });

  // 1. Check Admin Settings Button
  const settingsBtn = page.locator('button:has-text("Cài đặt & Quản lý trò chơi")');
  console.log('Admin settings button text:', (await settingsBtn.innerText()).replace(/\n/g, ' '));
  await settingsBtn.click();
  await page.waitForTimeout(600);

  const backdrop = page.locator('.cg-modal-backdrop');
  console.log('Modal backdrop open:', await backdrop.isVisible());
  await page.screenshot({ path: 'game_hub_settings_modal.png' });
  console.log('Saved game_hub_settings_modal.png');

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 2. Check Each Category Filter
  const tabLocators = page.locator('.cg-tab-btn');
  const tabsCount = await tabLocators.count();
  for (let i = 0; i < tabsCount; i++) {
    const tabName = (await tabLocators.nth(i).innerText()).replace(/\s+/g, ' ').trim();
    await tabLocators.nth(i).click();
    await page.waitForTimeout(300);
    const count = await page.locator('.game-card-v2').count();
    const titles = await page.locator('.gc-title').allInnerTexts();
    console.log(`Tab [${tabName}] -> Count: ${count}`);
    console.log(`   Games: ${titles.map(t => t.replace(/\n/g, ' ')).join(', ')}`);
  }

  // 3. Test Clicking "Chơi ngay" on Game 01 (Kéo co)
  await tabLocators.first().click();
  await page.waitForTimeout(300);

  console.log('Testing Game 01: Kéo co tri thức...');
  await page.locator('.game-card-v2').first().locator('.gc-play').click();
  await page.waitForTimeout(1500);
  console.log('Current URL after play 01:', page.url());
  await page.screenshot({ path: 'game_01_tugofwar.png' });

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Game 02: Vòng quay may mắn
  console.log('Testing Game 02: Vòng quay may mắn...');
  await page.locator('.game-card-v2').nth(1).locator('.gc-play').click();
  await page.waitForTimeout(1500);
  console.log('Current URL after play 02:', page.url());
  await page.screenshot({ path: 'game_02_wheel.png' });

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Game 03: Lật mảnh ghép
  console.log('Testing Game 03: Lật mảnh ghép bí mật...');
  await page.locator('.game-card-v2').nth(2).locator('.gc-play').click();
  await page.waitForTimeout(1500);
  console.log('Current URL after play 03:', page.url());
  await page.screenshot({ path: 'game_03_flip.png' });

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Game 04: Ai là triệu phú
  console.log('Testing Game 04: Ai là triệu phú...');
  await page.locator('.game-card-v2').nth(3).locator('.gc-play').click();
  await page.waitForTimeout(1500);
  console.log('Current URL after play 04:', page.url());
  await page.screenshot({ path: 'game_04_millionaire.png' });

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Game 05: Đua xe tri thức
  console.log('Testing Game 05: Đua xe tri thức...');
  await page.locator('.game-card-v2').nth(4).locator('.gc-play').click();
  await page.waitForTimeout(1500);
  console.log('Current URL after play 05:', page.url());
  await page.screenshot({ path: 'game_05_racing.png' });

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Lab 3D
  console.log('Testing Lab 3D...');
  const lab3dCard = page.locator('.game-card-v2:has-text("Phòng Lab 3D")');
  if (await lab3dCard.count() > 0) {
    await lab3dCard.locator('.gc-play').click();
    await page.waitForTimeout(2000);
    console.log('Current URL after Lab 3D:', page.url());
    await page.screenshot({ path: 'game_lab3d.png' });
  }

  // Back to #games
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.game-card-v2');

  // Test Quiz Duel 1-1
  console.log('Testing Quiz Duel 1-1...');
  const duelCard = page.locator('.game-card-v2:has-text("Thách đấu Quiz")');
  if (await duelCard.count() > 0) {
    await duelCard.locator('.gc-play').click();
    await page.waitForTimeout(1500);
    console.log('Current URL after Duel:', page.url());
    await page.screenshot({ path: 'game_duel.png' });
  }

  await browser.close();
  console.log('TEST SUITE COMPLETED SUCCESSFULLY!');
})();
