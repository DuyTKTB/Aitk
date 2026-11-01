import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Nguyen The Duy\\.gemini\\antigravity\\brain\\2e3e62eb-9044-4017-b6c4-48c8b875d9c0';

async function captureRedesignedCard() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    localStorage.setItem(
      'cs-dev-mock-user',
      JSON.stringify({
        uid: 'user-elec-demo',
        email: 'student@elec.ai',
        displayName: 'Học sinh ELEC',
      })
    );
    localStorage.setItem(
      'elec-aspirations-v2:user-elec-demo',
      JSON.stringify({
        userId: 'user-elec-demo',
        selectedExamId: 'THPTQG',
        activeAspirationId: 'bka-chem',
        onboardingCompleted: true,
        aspirations: [
          {
            id: 'bka-chem',
            priority: 1,
            examId: 'THPTQG',
            school: { id: 'BKA', code: 'BKA', name: 'Đại Học Bách Khoa Hà Nội' },
            major: { id: 'm1', name: 'Kỹ thuật Hóa học' },
            block: 'A00',
            targetScore: 24.5,
            cutoffScore: 24.0,
          },
        ],
      })
    );
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Open modal
  const trigger = page.locator('.sg-nav-trigger');
  await trigger.click();
  await page.waitForTimeout(600);

  // Capture close-up of the redesigned AI Investigate Card in Light Mode
  const card = page.locator('.sg-ai-investigate-card');
  if (await card.count() > 0) {
    await card.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_ai_investigate_card_redesigned_light.png'),
    });
    console.log('Saved verified_ai_investigate_card_redesigned_light.png');
  }

  // Full modal screenshot in Light Mode
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_aspiration_modal_redesigned_light.png'),
    clip: { x: 380, y: 15, width: 920, height: 750 },
  });
  console.log('Saved verified_aspiration_modal_redesigned_light.png');

  // Toggle to Dark Mode to inspect dark mode visual beauty
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(300);

  if (await card.count() > 0) {
    await card.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_ai_investigate_card_redesigned_dark.png'),
    });
    console.log('Saved verified_ai_investigate_card_redesigned_dark.png');
  }

  await browser.close();
  console.log('Capture completed successfully!');
}

captureRedesignedCard().catch((e) => {
  console.error(e);
  process.exit(1);
});
