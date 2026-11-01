import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();

  const setupStorage = (page) => {
    return page.addInitScript(() => {
      const uid = 'mock-user-123';
      localStorage.setItem('cs-theme-v2', JSON.stringify('light'));
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem('elec-onboarding-dismissed', 'true');
      
      const aspData = {
        userId: uid,
        selectedExamId: 'THPTQG',
        activeAspirationId: 'asp-1',
        onboardingCompleted: true,
        aspirations: [
          {
            id: 'asp-1',
            priority: 1,
            examId: 'THPTQG',
            schoolId: 'BKA',
            schoolCode: 'BKA',
            schoolName: 'Đại Học Bách Khoa Hà Nội',
            majorId: 'bka-it1',
            majorName: 'Khoa học Máy tính (IT1)',
            majorCode: 'IT1',
            combination: 'A01',
            targetScore: 25.75
          }
        ]
      };
      localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify(aspData));
      localStorage.setItem('elec-aspirations-v2:guest', JSON.stringify(aspData));

      const mockUser = {
        uid: uid,
        displayName: 'Duyyy nè',
        email: 'du****@gmail.com',
        photoURL: '',
        isVip: true,
        role: 'teacher_pro',
        joinedDays: 32,
        targetScore: '25.75',
        targetSchool: 'BKA',
        streak: 1,
        points: 499999308,
        examCount: 19,
        avgScore: 0.3
      };
      localStorage.setItem('cs-dev-mock-user', JSON.stringify(mockUser));
      localStorage.setItem(`cs-user-subscription:${uid}`, JSON.stringify({
        planId: 'vip_yearly',
        planName: 'VIP',
        period: 'Trọn mùa thi 2027',
        quotaRemaining: 99,
        points: 499999308,
        streak: 1,
        hearts: 99
      }));
      localStorage.setItem(`elec-sub-quota:${uid}`, JSON.stringify({
        planId: 'vip_yearly',
        planName: 'VIP',
        period: 'Trọn mùa thi 2027',
        quotaRemaining: 99,
        points: 499999308,
        streak: 1,
        hearts: 99
      }));
      localStorage.setItem('elec-user-points', '499999308');
      localStorage.setItem('elec-vip-status', 'true');
    });
  };

  // 1. Profile Overview (Light Mode)
  const ctxDesktop = await browser.newContext({ viewport: { width: 1366, height: 950 } });
  const p1 = await ctxDesktop.newPage();
  await setupStorage(p1);

  console.log('Navigating to Profile Light...');
  await p1.goto('http://localhost:5173/#profile', { waitUntil: 'domcontentloaded' });
  await p1.waitForTimeout(1500);

  // Close any modal overlay if exists
  try {
    const closeBtn = p1.locator('.et-close-btn, .et-btn-ghost, [aria-label="Đóng"]');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await p1.waitForTimeout(500);
    }
  } catch (e) {}

  await p1.screenshot({ path: 'verify_light_profile.png' });
  console.log('Saved verify_light_profile.png');

  // 2. Pricing Tab (Light Mode)
  const vipTabBtn = p1.locator('button:has-text("Gói VIP & Lộ trình")');
  if (await vipTabBtn.count() > 0) {
    await vipTabBtn.click({ force: true });
    await p1.waitForTimeout(1000);
    await p1.screenshot({ path: 'verify_light_pricing.png' });
    console.log('Saved verify_light_pricing.png');
  }

  // 3. Mobile Home (Light Mode 390x844)
  const ctxMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const p2 = await ctxMobile.newPage();
  await setupStorage(p2);

  console.log('Navigating to Mobile Home Light...');
  await p2.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: 'verify_light_mobile_home.png' });
  console.log('Saved verify_light_mobile_home.png');

  await browser.close();
  console.log('ALL LIGHT SCREENSHOTS CAPTURED!');
})();
