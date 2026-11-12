import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    const uid = 'test-user-upgraded';
    localStorage.setItem(
      'cs-dev-mock-user',
      JSON.stringify({
        uid,
        email: 'ha8487172@gmail.com',
        displayName: 'Ha Hoang',
      })
    );
    localStorage.setItem(
      `elec-aspirations-v2:${uid}`,
      JSON.stringify({
        selectedExamId: 'THPTQG',
        aspirations: [
          {
            id: 'asp-annd-1',
            examId: 'THPTQG',
            school: {
              code: 'ANND',
              name: 'Học Viện An Ninh Nhân Dân',
              city: 'Hà Nội',
            },
            major: {
              majorCode: '7860100',
              name: 'An ninh mạng và phòng chống tội phạm công nghệ cao',
              blocks: ['A00', 'A01'],
            },
            block: 'A00',
            cutoffScore: 26.0,
            targetScore: 26.0,
            targetChemScore: 8.75,
            order: 1,
          },
        ],
      })
    );
    localStorage.setItem('cs-theme-v2', '"light"');
    document.documentElement.dataset.theme = 'light';
  });

  console.log('1. Navigating to #study in LIGHT mode...');
  await page.goto('http://localhost:5173/#study');
  await page.waitForTimeout(1500);

  // Screenshot 1: Overview with Aspiration Goal Strip & Mode Tabs & Audio Player
  await page.screenshot({ path: 'scratch/upgraded-1-aspiration-and-tabs.png' });
  console.log('Saved scratch/upgraded-1-aspiration-and-tabs.png');

  // Click on "Thẻ nhớ Flashcard" tab
  console.log('2. Switching to Flashcard mode...');
  const modeTabs = await page.$$('.ns9-mode-tab');
  if (modeTabs.length >= 2) {
    await modeTabs[1].click(); // Tab 2: Flashcards
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'scratch/upgraded-2-flashcards.png' });
    console.log('Saved scratch/upgraded-2-flashcards.png');

    // Click card to flip
    const card = await page.$('.ns9-card-3d-wrap');
    if (card) {
      await card.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: 'scratch/upgraded-2b-flashcard-flipped.png' });
      console.log('Saved scratch/upgraded-2b-flashcard-flipped.png');
    }
  }

  // Click on "Bộ câu hỏi 2026" tab
  console.log('3. Switching to Bộ câu hỏi 2026 mode...');
  if (modeTabs.length >= 3) {
    await modeTabs[2].click(); // Tab 3: Bộ câu hỏi 2026
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'scratch/upgraded-3-questions-2026.png' });
    console.log('Saved scratch/upgraded-3-questions-2026.png');
  }

  // Open "Hướng dẫn ôn đúng cách" modal
  console.log('4. Opening Hướng dẫn ôn đúng cách modal...');
  const guideBtn = await page.$('.ns9-asp-guide-trigger');
  if (guideBtn) {
    await guideBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scratch/upgraded-4-study-guide-modal.png' });
    console.log('Saved scratch/upgraded-4-study-guide-modal.png');
  }

  await browser.close();
  console.log('All verification steps completed successfully!');
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
