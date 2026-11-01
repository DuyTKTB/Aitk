import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Inject initial user and aspirations state matching the user's screenshot
  await page.addInitScript(() => {
    const uid = 'test-duyyy-123';
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid,
      displayName: 'Duyyy',
      email: 'duy@elec.ai',
    }));

    const aspState = {
      selectedExamId: 'THPTQG',
      activeAspirationId: 'bka-chem',
      onboardingCompleted: true,
      hasCompletedOnboarding: true,
      aspirations: [
        {
          id: 'bka-chem',
          priority: 1,
          schoolId: 'BKA',
          majorId: 'bka-ch1',
          school: {
            id: 'BKA',
            code: 'BKA',
            name: 'Đại Học Bách Khoa Hà Nội',
            shortName: 'Bách Khoa Hà Nội',
            coverColor: '#b91c1c',
            city: 'Hà Nội',
          },
          major: {
            id: 'bka-ch1',
            majorCode: 'CH1',
            name: 'Kỹ thuật Hóa học',
          },
          block: 'A00',
          cutoffScore: 24.5,
          targetScore: 25.5,
          targetChemScore: 8.5,
          referenceLabel: 'Điểm chuẩn 2024',
        },
        {
          id: 'neu-marketing',
          priority: 2,
          schoolId: 'NEU',
          majorId: 'neu-mkt',
          school: {
            id: 'NEU',
            code: 'NEU',
            name: 'Đại Học Kinh Tế Quốc Dân',
            shortName: 'Kinh Tế Quốc Dân',
            coverColor: '#1e40af',
            city: 'Hà Nội',
          },
          major: {
            id: 'neu-mkt',
            majorCode: '7340115',
            name: 'Marketing',
          },
          block: 'A00',
          cutoffScore: 26.5,
          targetScore: 27.0,
          targetChemScore: 9.0,
          referenceLabel: 'Điểm chuẩn 2024',
        },
      ],
      examTargets: {
        THPTQG: 25.5,
        HSA: 98,
        TSA: 68,
      },
    };
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify(aspState));
    localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspState));
    localStorage.setItem('elec-aspirations-v2:test-user', JSON.stringify(aspState));
  });

  console.log('=== TEST 1: DESKTOP AUDIT & CTA PRIMARY ===');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Click on the Study Goal pill trigger in navbar
  console.log('Opening StudyGoalNavDropdown on Desktop...');
  const trigger = page.locator('.sg-nav-trigger');
  await trigger.waitFor({ state: 'visible', timeout: 8000 });
  await trigger.click();
  await page.waitForTimeout(800);

  // 2. Verify modal opened
  const panel = page.locator('.sg-dropdown-panel');
  await panel.waitFor({ state: 'visible', timeout: 5000 });
  console.log('StudyGoalNavDropdown panel opened successfully on Desktop.');

  // Take screenshot of desktop dropdown
  const desktopModalShot = path.join(outDir, 'verified_ai_roadmap_dropdown_desktop.png');
  await page.screenshot({ path: desktopModalShot, fullPage: false });
  console.log(`Saved screenshot to ${desktopModalShot}`);

  // Check texts
  const viaExamText = await page.locator('.sg-via-exam').textContent();
  console.log(`Via exam text: "${viaExamText}"`);
  if (viaExamText.includes('Thi Thi')) {
    throw new Error(`Failed: viaExamText still contains redundant "Thi Thi": ${viaExamText}`);
  }

  // Check HSA score circle
  const examItems = await page.locator('.sg-exam-item').all();
  console.log(`Found ${examItems.length} exam items.`);
  for (const item of examItems) {
    const name = await item.locator('b').first().textContent();
    const ringTxt = await item.locator('.sg-ring-txt').textContent().catch(() => '');
    console.log(`Exam: ${name} -> Score ring: "${ringTxt}"`);
  }

  // Check AI Investigate Card
  const aiCard = page.locator('.sg-ai-investigate-card');
  const aiCardVisible = await aiCard.isVisible();
  console.log(`AI Investigate Card visible: ${aiCardVisible}`);
  if (!aiCardVisible) {
    throw new Error('Failed: .sg-ai-investigate-card not visible');
  }

  const aiBadge = await page.locator('.sg-ai-inv-badge').textContent();
  console.log(`AI Badge: "${aiBadge}"`);

  const aiAnalysis = await page.locator('.sg-ai-inv-analysis').textContent();
  console.log(`AI Analysis: "${aiAnalysis}"`);

  const stages = await page.locator('.sg-ai-stage-item').allTextContents();
  console.log(`AI Stages count: ${stages.length}`);
  stages.forEach((st, idx) => console.log(`  Stage ${idx + 1}: ${st.replace(/\s+/g, ' ')}`));

  // Check CTA 1: "Khám phá Lộ trình cá nhân hóa ngay"
  const ctaPrimary = page.locator('.sg-ai-btn-primary');
  console.log(`CTA Primary text: "${await ctaPrimary.textContent()}"`);

  // Test click CTA primary -> should navigate to #roadmap
  console.log('Clicking CTA Primary (Khám phá Lộ trình cá nhân hóa ngay)...');
  await ctaPrimary.click();
  await page.waitForTimeout(1200);

  const currentUrl = page.url();
  console.log(`Current URL after CTA click: ${currentUrl}`);
  if (!currentUrl.includes('#roadmap')) {
    throw new Error(`Failed: URL did not update to #roadmap: ${currentUrl}`);
  }

  // Screenshot Roadmap Page
  const roadmapShot = path.join(outDir, 'verified_roadmap_page_after_cta.png');
  await page.screenshot({ path: roadmapShot, fullPage: false });
  console.log(`Saved roadmap page screenshot to ${roadmapShot}`);

  // Verify "Kỳ thi THPTQG" on Roadmap Page
  const roadmapCardSub = await page.locator('.ns9-card-top p').first().textContent().catch(() => '');
  console.log(`Roadmap hub text: "${roadmapCardSub}"`);
  if (roadmapCardSub.includes('Thi Thi')) {
    throw new Error(`Failed: Roadmap hub still contains "Thi Thi": ${roadmapCardSub}`);
  }

  // === TEST 2: MOBILE VIEWPORT & CTA SECONDARY ===
  console.log('\n=== TEST 2: MOBILE AUDIT & CTA SECONDARY ===');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.addInitScript(() => {
    const uid = 'test-duyyy-123';
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid,
      displayName: 'Duyyy',
      email: 'duy@elec.ai',
    }));
    const aspState = {
      selectedExamId: 'THPTQG',
      activeAspirationId: 'bka-chem',
      onboardingCompleted: true,
      hasCompletedOnboarding: true,
      aspirations: [
        {
          id: 'bka-chem',
          priority: 1,
          schoolId: 'BKA',
          majorId: 'bka-ch1',
          school: {
            id: 'BKA',
            code: 'BKA',
            name: 'Đại Học Bách Khoa Hà Nội',
            shortName: 'Bách Khoa Hà Nội',
            coverColor: '#b91c1c',
            city: 'Hà Nội',
          },
          major: {
            id: 'bka-ch1',
            majorCode: 'CH1',
            name: 'Kỹ thuật Hóa học',
          },
          block: 'A00',
          cutoffScore: 24.5,
          targetScore: 25.5,
          targetChemScore: 8.5,
          referenceLabel: 'Điểm chuẩn 2024',
        },
      ],
      examTargets: { THPTQG: 25.5, HSA: 98, TSA: 68 },
    };
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify(aspState));
  });

  await mobilePage.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1500);

  console.log('Opening StudyGoalNavDropdown on Mobile...');
  const mobileTrigger = mobilePage.locator('.sg-nav-trigger');
  await mobileTrigger.waitFor({ state: 'visible', timeout: 8000 });
  await mobileTrigger.click();
  await mobilePage.waitForTimeout(800);

  const mobileModalShot = path.join(outDir, 'verified_ai_roadmap_dropdown_mobile.png');
  await mobilePage.screenshot({ path: mobileModalShot, fullPage: false });
  console.log(`Saved mobile screenshot to ${mobileModalShot}`);

  const ctaSec = mobilePage.locator('.sg-ai-btn-secondary');
  console.log(`Clicking CTA Secondary on Mobile: "${await ctaSec.textContent()}"...`);
  await ctaSec.click();
  await mobilePage.waitForTimeout(1500);

  const diagUrl = mobilePage.url();
  console.log(`Diagnostic test URL on Mobile: ${diagUrl}`);
  if (!diagUrl.includes('mode=diagnostic')) {
    throw new Error(`Failed: URL does not include mode=diagnostic: ${diagUrl}`);
  }

  const diagShot = path.join(outDir, 'verified_diagnostic_modal_after_cta.png');
  await mobilePage.screenshot({ path: diagShot, fullPage: false });
  console.log(`Saved diagnostic modal screenshot to ${diagShot}`);

  await browser.close();
  console.log('\nALL VERIFICATIONS PASSED 100% SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
