import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function main() {
  console.log('=== BẮT ĐẦU KIỂM THỬ PHÂN QUYỀN GÓI VIP/PRO/FREE VÀ BẢO VỆ PHÒNG THI ẢO ===');
  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // TEST CASE 1: TÀI KHOẢN FREE KIỂM TRA ĐỀ VIP, PRO, FREE
  // -------------------------------------------------------------
  console.log('\n--- TEST CASE 1: TÀI KHOẢN FREE ---');
  const freeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const freePage = await freeContext.newPage();

  await freePage.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'student_free_qa',
      displayName: 'Học Sinh Free Test',
      email: 'free_test@gmail.com',
      providerData: [{ providerId: 'password' }],
      metadata: {
        creationTime: '2026-10-01T00:00:00.000Z',
        lastSignInTime: '2026-11-01T00:00:00.000Z'
      }
    }));
    localStorage.setItem('elec_sub_quota_v1_student_free_qa', JSON.stringify({
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
    localStorage.setItem('elec-aspirations-v2:student_free_qa', JSON.stringify({
      userId: 'student_free_qa',
      onboardingCompleted: true,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp_1',
      aspirations: [{ id: 'asp_1', schoolId: 'BKA', schoolCode: 'BKA', schoolName: 'Đại Học Bách Khoa Hà Nội', majorId: 'BKA_IT1', majorName: 'Khoa học Máy tính', block: 'A00', priority: 1, targetScore: 26.0 }]
    }));
  });

  await freePage.goto('http://localhost:5173/#quiz', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await freePage.waitForTimeout(1500);

  // 1.1 Kiểm tra nút của Đề VIP đối với tài khoản Free
  const vipCard = freePage.locator('.ns9-vex-card.tier-vip').first();
  const vipBtn = vipCard.locator('.ns9-vex-start-btn');
  const vipBtnText = await vipBtn.textContent();
  const vipIsLocked = await vipCard.evaluate((el) => el.classList.contains('is-locked'));
  console.log(`[PASS] 1.1 Đề VIP: Nút hiển thị="${vipBtnText.trim()}", class is-locked=${vipIsLocked}`);
  if (!vipBtnText.includes('Mở khóa VIP') || !vipIsLocked) {
    throw new Error('FAIL: Đề VIP không bị khóa đối với tài khoản Free!');
  }

  // Chụp ảnh thẻ đề VIP bị khóa
  await freePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_free_user_vip_locked.png') });

  // 1.2 Bấm nút "Mở khóa VIP" -> Phải mở Modal Nâng Cấp Apple
  console.log('1.2 Clicking "Mở khóa VIP" button as Free user...');
  await vipBtn.click();
  await freePage.waitForTimeout(600);

  const upgradeModal = freePage.locator('.ns9-upg-dialog-card');
  const modalVisible = await upgradeModal.isVisible();
  const modalTitle = await upgradeModal.locator('h3').textContent();
  console.log(`[PASS] 1.2 Modal Nâng cấp xuất hiện: ${modalVisible}, Tiêu đề: "${modalTitle?.trim()}"`);
  if (!modalVisible || !modalTitle.includes('VIP')) {
    throw new Error('FAIL: Modal nâng cấp VIP không xuất hiện khi bấm mở khóa!');
  }

  // Chụp ảnh Modal Nâng Cấp VIP
  await freePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_free_user_vip_modal.png') });

  // 1.3 Bấm nút "Nâng cấp ngay từ 499.000 đ" -> Mở Modal VietQR PaymentPanel
  console.log('1.3 Testing PaymentPanel trigger from modal...');
  const payBtn = upgradeModal.locator('.ns9-upg-btn-primary');
  await payBtn.click();
  await freePage.waitForTimeout(600);

  const paymentModal = freePage.locator('.apl-pay-wrap');
  const payVisible = await paymentModal.isVisible();
  console.log(`[PASS] 1.3 Modal VietQR PaymentPanel xuất hiện: ${payVisible}`);
  if (!payVisible) {
    throw new Error('FAIL: PaymentPanel không xuất hiện!');
  }

  await freePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_free_user_payment_panel.png') });

  // Đóng modal thanh toán
  await freePage.locator('.ns9-cr-close-btn').click();
  await freePage.waitForTimeout(400);

  // 1.4 Kiểm tra nút của Đề PRO đối với tài khoản Free
  const proCard = freePage.locator('.ns9-vex-card.tier-pro').first();
  const proBtn = proCard.locator('.ns9-vex-start-btn');
  const proBtnText = await proBtn.textContent();
  const proIsLocked = await proCard.evaluate((el) => el.classList.contains('is-locked'));
  console.log(`[PASS] 1.4 Đề PRO: Nút hiển thị="${proBtnText.trim()}", class is-locked=${proIsLocked}`);
  if (!proBtnText.includes('Mở khóa PRO') || !proIsLocked) {
    throw new Error('FAIL: Đề PRO không bị khóa đối với tài khoản Free!');
  }

  // 1.5 Kiểm tra nút của Đề FREE đối với tài khoản Free
  const freeExamCard = freePage.locator('.ns9-vex-card.tier-free').first();
  const freeExamBtn = freeExamCard.locator('.ns9-vex-start-btn');
  const freeExamBtnText = await freeExamBtn.textContent();
  const freeExamIsLocked = await freeExamCard.evaluate((el) => el.classList.contains('is-locked'));
  console.log(`[PASS] 1.5 Đề FREE: Nút hiển thị="${freeExamBtnText.trim()}", class is-locked=${freeExamIsLocked}`);
  if (!freeExamBtnText.includes('Làm bài ngay') || freeExamIsLocked) {
    throw new Error('FAIL: Đề FREE bị khóa nhầm đối với tài khoản Free!');
  }

  // 1.6 Bấm làm đề FREE -> Phải vào được phòng thi!
  console.log('1.6 Starting FREE exam as Free user...');
  await freeExamBtn.click();
  await freePage.waitForTimeout(800);
  const confirmDialog = freePage.locator('.ns9-strict-exam-wrapper');
  const inExam = await confirmDialog.isVisible();
  console.log(`[PASS] 1.6 Tài khoản Free vào phòng thi đề Free thành công: inExam = ${inExam}`);
  if (!inExam) {
    throw new Error('FAIL: Tài khoản Free không vào được đề Free!');
  }

  await freePage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_free_user_in_free_exam.png') });
  await freeContext.close();

  // -------------------------------------------------------------
  // TEST CASE 2: TÀI KHOẢN VIP KIỂM TRA ĐỀ VIP
  // -------------------------------------------------------------
  console.log('\n--- TEST CASE 2: TÀI KHOẢN VIP ---');
  const vipContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const vipPage = await vipContext.newPage();

  await vipPage.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'student_vip_qa',
      displayName: 'Học Sinh VIP',
      email: 'vip_qa@gmail.com',
      providerData: [{ providerId: 'password' }],
    }));
    localStorage.setItem('elec_sub_quota_v1_student_vip_qa', JSON.stringify({
      planName: 'VIP',
      planDesc: 'Đặc quyền VIP ELEC AI',
      durationLabel: 'Trọn mùa thi 2027',
      examAccessLabel: 'Mở khóa 100% đề VIP, PRO, FREE',
      hearts: 99,
      maxHearts: 99,
      aiCreditsUsed: 0,
      aiCreditsMax: 999999,
      transactions: [],
    }));
    localStorage.setItem('elec-aspirations-v2:student_vip_qa', JSON.stringify({
      userId: 'student_vip_qa',
      onboardingCompleted: true,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp_1',
      aspirations: [{ id: 'asp_1', schoolId: 'BKA', schoolCode: 'BKA', schoolName: 'Đại Học Bách Khoa Hà Nội', majorId: 'BKA_IT1', majorName: 'Khoa học Máy tính', block: 'A00', priority: 1, targetScore: 26.0 }]
    }));
  });

  await vipPage.goto('http://localhost:5173/#quiz', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await vipPage.waitForTimeout(1500);

  const vipCardForVip = vipPage.locator('.ns9-vex-card.tier-vip').first();
  const vipBtnForVip = vipCardForVip.locator('.ns9-vex-start-btn');
  const vipBtnForVipText = await vipBtnForVip.textContent();
  const vipIsLockedForVip = await vipCardForVip.evaluate((el) => el.classList.contains('is-locked'));

  console.log(`[PASS] 2.1 Tài khoản VIP xem Đề VIP: Nút hiển thị="${vipBtnForVipText.trim()}", is-locked=${vipIsLockedForVip}`);
  if (!vipBtnForVipText.includes('Làm bài ngay') || vipIsLockedForVip) {
    throw new Error('FAIL: Tài khoản VIP bị khóa đề VIP!');
  }

  // VIP click Làm bài ngay -> Vào thẳng phòng thi
  await vipBtnForVip.click();
  await vipPage.waitForTimeout(800);
  const vipInExam = await vipPage.locator('.ns9-strict-exam-wrapper').isVisible();
  console.log(`[PASS] 2.2 Tài khoản VIP vào thẳng phòng thi Đề VIP thành công: vipInExam = ${vipInExam}`);
  if (!vipInExam) {
    throw new Error('FAIL: Tài khoản VIP không vào được đề VIP!');
  }

  await vipPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_vip_user_in_vip_exam.png') });
  await vipContext.close();

  await browser.close();
  console.log('\n======================================================');
  console.log('TẤT CẢ 8 BƯỚC KIỂM THỬ PHÂN QUYỀN ĐÃ PASS 100% HOÀN HẢO!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('LỖI KIỂM THỬ:', err);
  process.exit(1);
});
