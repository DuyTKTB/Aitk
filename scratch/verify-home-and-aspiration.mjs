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
        examTargets: {
          THPTQG: 24.75,
          HSA: 100,
          TSA: 65,
          'V-ACT': 800,
          SPT: 22,
          'H-SCA': 68
        },
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
          },
          {
            id: 'asp_neu',
            schoolId: 'NEU',
            majorId: 'KT1',
            school: { id: 'NEU', code: 'NEU', name: 'Đại Học Kinh Tế Quốc Dân' },
            major: { id: 'KT1', name: 'Kinh doanh quốc tế' },
            examId: 'THPTQG',
            block: 'D07',
            targetScore: 27.75,
            targetChemScore: 9.5,
            cutoffScore: 27.20,
            priority: 2
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

  console.log('Navigating to http://localhost:5173/#home ...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. Click .sg-nav-trigger on navbar
  const trigger = page.locator('.sg-nav-trigger').first();
  if (await trigger.count() > 0) {
    console.log('Clicking .sg-nav-trigger...');
    await trigger.click();
    await page.waitForTimeout(1000);
    const dropdown = page.locator('.sg-dropdown-panel');
    if (await dropdown.count() > 0) {
      await dropdown.screenshot({ path: 'scratch/verified-aspiration-modal-compact.png' });
      console.log('Saved scratch/verified-aspiration-modal-compact.png');
    }
  }

  await browser.close();
  console.log('Done!');
}

verify().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
