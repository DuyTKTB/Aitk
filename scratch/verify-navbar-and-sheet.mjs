import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Pre-seed localStorage with logged in user and aspirations
  await page.goto('http://localhost:5173/', { waitUntil: 'commit' });
  await page.evaluate(() => {
    const uid = 'test-duy';
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid,
      displayName: 'Nguyen Duy TK',
      email: 'duyfamebo@gmail.com',
    }));
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify({
      userId: uid,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp-1',
      onboardingCompleted: true,
      weeklyFreeHours: 6,
      examDate: '2027-05-15',
      aspirations: [
        {
          id: 'asp-1',
          priority: 1,
          schoolId: 'ANND',
          school: {
            id: 'ANND',
            code: 'ANND',
            name: 'Học Viện An Ninh Nhân Dân',
            city: 'Hà Nội',
          },
          majorId: 'an-ninh-mang',
          major: {
            id: 'an-ninh-mang',
            name: 'Ngành An ninh mạng và phòng chống tội phạm công nghệ cao (Thí sinh Nữ, miền Bắc)',
            blocks: ['A00', 'A01'],
          },
          block: 'A00',
          targetScore: 26,
          targetChemScore: 8.75,
          cutoffScore: 25.5,
        },
        {
          id: 'asp-2',
          priority: 2,
          schoolId: 'TNU',
          school: {
            id: 'TNU',
            code: 'TNU',
            name: 'Đại Học Sư Phạm Thái Nguyên',
            city: 'Thái Nguyên',
          },
          majorId: 'sp-tieng-anh',
          major: {
            id: 'sp-tieng-anh',
            name: 'Sư phạm Tiếng Anh',
            blocks: ['D01'],
          },
          block: 'D01',
          targetScore: 25.0,
          targetChemScore: 8.0,
          cutoffScore: 24.2,
        },
        {
          id: 'asp-3',
          priority: 3,
          schoolId: 'ANND',
          school: {
            id: 'ANND',
            code: 'ANND',
            name: 'Học Viện An Ninh Nhân Dân',
            city: 'Hà Nội',
          },
          majorId: 'dieu-tra-hinh-su',
          major: {
            id: 'dieu-tra-hinh-su',
            name: 'Điều tra hình sự chất lượng cao',
            blocks: ['A00'],
          },
          block: 'A00',
          targetScore: 25.5,
          targetChemScore: 8.5,
          cutoffScore: 24.8,
        }
      ],
      updatedAt: Date.now(),
    }));
  });

  // Navigate to #home
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Take screenshot of home page
  await page.screenshot({ path: 'scratch/screenshot-home-logged-in.png' });
  console.log('Saved scratch/screenshot-home-logged-in.png');

  // Find trigger
  const trigger = page.locator('.sg-nav-trigger');
  console.log('sg-nav-trigger count:', await trigger.count());
  if (await trigger.isVisible()) {
    console.log('Clicking trigger...');
    await trigger.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scratch/screenshot-nav-goal-opened.png' });
    console.log('Saved scratch/screenshot-nav-goal-opened.png');
  }

  // Go to roadmap
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/screenshot-roadmap-full.png' });
  console.log('Saved scratch/screenshot-roadmap-full.png');

  // Open chapter modal
  const chBtn = page.locator('.ns9-btn-theory, button:has-text("Lý thuyết"), .ns9-ch-card').first();
  if (await chBtn.isVisible()) {
    console.log('Opening chapter sheet...');
    await chBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/screenshot-chapter-sheet-current.png' });
    console.log('Saved scratch/screenshot-chapter-sheet-current.png');
  }

  await browser.close();
}

main().catch(console.error);
