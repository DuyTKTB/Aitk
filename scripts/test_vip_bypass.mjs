import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function testFreeUserAccessingVipExam() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Mock a 100% FREE student (no VIP, no PRO, no activation code)
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'free_student_001',
      displayName: 'Học sinh Miễn Phí',
      email: 'free_student@gmail.com',
      providerData: [{ providerId: 'password' }],
      metadata: {
        creationTime: '2026-10-01T00:00:00.000Z',
        lastSignInTime: '2026-11-01T00:00:00.000Z'
      }
    }));
    // Explicitly set Free tier and quota
    localStorage.setItem('elec_sub_quota_v1_free_student_001', JSON.stringify({
      planName: 'Free',
      planDesc: 'Nội dung miễn phí',
      durationLabel: 'Trọn đời',
      examAccessLabel: 'Đề cơ bản của mọi kỳ thi',
      hearts: 5,
      maxHearts: 5,
      aiCreditsUsed: 0,
      aiCreditsMax: 30,
      transactions: [],
    }));
    localStorage.setItem('elec-aspirations-v2:free_student_001', JSON.stringify({
      userId: 'free_student_001',
      onboardingCompleted: true,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp_1',
      aspirations: [{ id: 'asp_1', schoolId: 'BKA', schoolCode: 'BKA', schoolName: 'Đại Học Bách Khoa Hà Nội', majorId: 'BKA_IT1', majorName: 'Khoa học Máy tính', block: 'A00', priority: 1, targetScore: 26.0 }]
    }));
  });

  console.log('1. Navigating to Virtual Exam Room (#quiz)...');
  await page.goto('http://localhost:5173/#quiz', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Chụp ảnh danh sách đề thi (xem nút của đề VIP)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bug_evidence_free_user_exam_list.png') });

  // Tìm thẻ đề VIP đầu tiên
  const vipCard = page.locator('.ns9-vex-card.tier-vip').first();
  const vipCardExists = await vipCard.count() > 0;
  console.log('VIP Exam card exists:', vipCardExists);

  if (vipCardExists) {
    const vipTitle = await vipCard.locator('.ns9-vex-title').textContent();
    const btnText = await vipCard.locator('.ns9-vex-start-btn').textContent();
    console.log('VIP Exam title:', vipTitle?.trim());
    console.log('VIP Exam button text:', btnText?.trim());

    // Click nút "Làm bài ngay" của đề VIP!
    console.log('2. Clicking "Làm bài ngay" on VIP exam as a FREE user...');
    await vipCard.locator('.ns9-vex-start-btn').click();
    await page.waitForTimeout(1500);

    // Kiểm tra xem có bị chặn không, hay là vào thẳng phòng thi!
    const inExamSession = await page.locator('.ns9-strict-exam-wrapper, .ep-dialog, .ep-session, .ns9-vex-modal, .ns9-vex-confirm-card').first().isVisible();
    const paywallVisible = await page.locator('.apl-pay-wrap, .ns9-upgrade-modal, .paywall-modal, .vip-gate').first().isVisible();

    console.log('Result: inExamSession =', inExamSession, ', paywallVisible =', paywallVisible);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'bug_evidence_free_user_entered_vip_exam.png') });
  }

  await browser.close();
}

testFreeUserAccessingVipExam().catch(console.error);
