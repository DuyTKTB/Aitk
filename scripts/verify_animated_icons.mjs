import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Nguyen The Duy\\.gemini\\antigravity\\brain\\2e3e62eb-9044-4017-b6c4-48c8b875d9c0';

async function verifyAnimatedIcons() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject logged in state and completed onboarding
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
          {
            id: 'neu-econ',
            priority: 2,
            examId: 'THPTQG',
            school: { id: 'NEU', code: 'NEU', name: 'Đại học Kinh tế Quốc dân' },
            major: { id: 'm2', name: 'Kinh tế Quốc tế' },
            block: 'A00',
            targetScore: 26.5,
            cutoffScore: 26.0,
          },
        ],
      })
    );
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/#games...');
  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 1. Verify Desktop Nav items and visible icons
  const navItems = page.locator('.nav-item');
  const count = await navItems.count();
  console.log(`Found ${count} desktop nav items.`);

  const navIcos = page.locator('.nav-item .nav-ico svg');
  const icoCount = await navIcos.count();
  console.log(`Found ${icoCount} visible SVG icons in desktop nav.`);

  // Screenshot 1: Full Top Navigation Bar showing all 5 nav icons + labels + right action icons
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_animated_nav_resting.png'),
    clip: { x: 0, y: 0, width: 1440, height: 180 },
  });
  console.log('Saved verified_animated_nav_resting.png');

  // 2. Hover over "Phòng thí ảo" (Mortarboard Cap Tilt animation)
  const virtualExamItem = page.locator('.ns9-nav-virtual-exam');
  if (await virtualExamItem.count() > 0) {
    await virtualExamItem.hover();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_hover_quiz_cap.png'),
      clip: { x: 280, y: 0, width: 380, height: 100 },
    });
    console.log('Saved verified_hover_quiz_cap.png');
  }

  // 3. Hover over "Lộ trình" (Compass needle animation)
  const roadmapItem = page.locator('a[href="#roadmap"].nav-item');
  if (await roadmapItem.count() > 0) {
    await roadmapItem.hover();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_hover_roadmap.png'),
      clip: { x: 420, y: 0, width: 320, height: 100 },
    });
    console.log('Saved verified_hover_roadmap.png');
  }

  // 4. Hover over Bell & Search
  const bellBtn = page.locator('.nav-bell-btn');
  if (await bellBtn.count() > 0) {
    await bellBtn.hover();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_hover_bell.png'),
      clip: { x: 920, y: 0, width: 480, height: 100 },
    });
    console.log('Saved verified_hover_bell.png');
  }

  // 5. Open Aspiration Target Modal and inspect animated icons
  const goalPill = page.locator('.sg-nav-trigger');
  if (await goalPill.count() > 0) {
    await goalPill.click();
    await page.waitForTimeout(600);

    // Hover over edit pencil button
    const editBtn = page.locator('.sg-wish-item .sg-icon-btn').first();
    if (await editBtn.count() > 0) {
      await editBtn.hover();
      await page.waitForTimeout(400);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verified_animated_aspiration_modal.png'),
    });
    console.log('Saved verified_animated_aspiration_modal.png');
  }

  // 6. Test Mobile Viewport Bottom Nav
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Hover on Mobile Bottom Nav "Phòng thi"
  const bnavQuiz = page.locator('.bnav-btn[href="#virtual-exams"]');
  if (await bnavQuiz.count() > 0) {
    await bnavQuiz.hover();
    await page.waitForTimeout(400);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verified_mobile_bottom_nav_icons.png'),
    clip: { x: 0, y: 720, width: 390, height: 124 },
  });
  console.log('Saved verified_mobile_bottom_nav_icons.png');

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

verifyAnimatedIcons().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
