import { chromium } from 'playwright';

async function captureRoadmap() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const mockUid = 'mock_user_1';
  await page.addInitScript(({ uid }) => {
    try {
      localStorage.setItem('cs-dev-mock-user', JSON.stringify({
        uid: uid,
        displayName: 'Nguyễn Duy TK',
        email: 'duyfamvbo@gmail.com'
      }));
      localStorage.setItem('cs-user-profile:' + uid, JSON.stringify({
        fullName: 'Nguyễn Duy TK',
        grade: '12',
        targetSchool: 'BKA'
      }));
      const aspState = {
        userId: uid,
        selectedExamId: 'THPTQG',
        onboardingCompleted: true,
        aspirations: [
          {
            id: 'asp_bka',
            schoolId: 'BKA',
            majorId: 'CH1',
            school: { id: 'BKA', code: 'BKA', name: 'Đại Học Bách Khoa Hà Nội' },
            major: { id: 'CH1', name: 'Kỹ thuật Hóa học' },
            examId: 'THPTQG',
            block: 'A00',
            targetScore: 24.75,
            targetChemScore: 8.5,
            cutoffScore: 24.25,
            priority: 1
          }
        ],
        activeAspirationId: 'asp_bka'
      };
      localStorage.setItem('elec-aspirations-v2:' + uid, JSON.stringify(aspState));
      localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspState));
    } catch (e) {
      console.error(e);
    }
  }, { uid: mockUid });

  console.log('Navigating to http://localhost:5173/#roadmap ...');
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Screenshot top of roadmap
  await page.screenshot({ path: 'scratch/roadmap-current-full.png', fullPage: false });
  console.log('Saved scratch/roadmap-current-full.png');

  // Scroll down a bit and capture chapters / lessons
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/roadmap-current-mid.png', fullPage: false });
  console.log('Saved scratch/roadmap-current-mid.png');

  await browser.close();
  console.log('Done capturing roadmap!');
}

captureRoadmap().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
