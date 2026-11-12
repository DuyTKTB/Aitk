import { chromium } from 'playwright';

async function verify() {
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
        displayName: 'Duyyy nè',
        email: 'duyfamvbo@gmail.com'
      }));
      localStorage.setItem('cs-user-profile:' + uid, JSON.stringify({
        fullName: 'Duyyy nè',
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

  // 1. Home page
  console.log('Navigating to http://localhost:5173/#home ...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/verified-home-no-focus-bar.png' });
  console.log('Saved scratch/verified-home-no-focus-bar.png');

  // 2. Virtual Exams page
  console.log('Navigating to http://localhost:5173/#virtual-exams ...');
  await page.goto('http://localhost:5173/#virtual-exams', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/verified-virtual-exams-no-focus-bar.png' });
  console.log('Saved scratch/verified-virtual-exams-no-focus-bar.png');

  await browser.close();
  console.log('Done verification!');
}

verify().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
