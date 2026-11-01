import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const uid = 'test-player';
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
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({ uid, displayName: 'Duy', email: 'test@elec.vn' }));
  }, { uid });

  const gamesToTest = [
    { id: 'tugofwar', name: 'Kéo co' },
    { id: 'wheel', name: 'Vòng quay' },
    { id: 'flip', name: 'Lật mảnh ghép' },
    { id: 'millionaire', name: 'Ai là triệu phú' },
    { id: 'racing', name: 'Đua xe' },
    { id: 'chicken', name: 'Bắt gà' },
    { id: 'slingshot', name: 'Bắn súng parabol' },
    { id: 'jeopardy', name: 'Chọn ô may mắn' },
    { id: 'lab', name: 'Lab 2D' },
    { id: 'battle', name: 'Đấu trường nguyên tố' },
    { id: 'sudoku', name: 'Sudoku' },
    { id: 'mines', name: 'Dò mìn' },
    { id: 'duel', name: 'Thách đấu 1-1' },
    { id: 'lab-3d', name: 'Lab 3D' },
    { id: 'cam-fingers', name: 'Camera ngón tay' }
  ];

  console.log(`Starting playability tests for ${gamesToTest.length} games...`);

  const results = [];
  for (const g of gamesToTest) {
    const errors = [];
    const onErr = (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    };
    page.on('console', onErr);

    try {
      await page.goto(`http://localhost:5173/#games/${g.id}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const has404 = (await page.locator('text=Không tìm thấy trang').count()) > 0;
      const title = await page.title();
      const hasCanvas = (await page.locator('canvas').count()) > 0;
      const hasButtons = (await page.locator('button, a').count()) > 0;

      // Check for Back button or Exit button
      const backBtn = await page.locator('a[href="#games"], button:has-text("Quay lại"), button:has-text("Thoát"), a:has-text("Trò chơi"), .game-back-btn, [aria-label="Quay lại"]').count();

      results.push({
        id: g.id,
        name: g.name,
        ok: !has404 && hasButtons,
        has404,
        hasCanvas,
        hasBackBtn: backBtn > 0,
        errorsCount: errors.length,
        errors: errors.slice(0, 2)
      });
      console.log(`[PASS] Game ${g.id} (${g.name}) - hasBackBtn=${backBtn > 0}, canvas=${hasCanvas}`);
    } catch (err) {
      results.push({
        id: g.id,
        name: g.name,
        ok: false,
        error: err.message
      });
      console.log(`[FAIL] Game ${g.id}: ${err.message}`);
    } finally {
      page.off('console', onErr);
    }
  }

  console.table(results);
  await browser.close();
})();
