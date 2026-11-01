import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();

  const setupStorage = (page) => {
    return page.addInitScript(() => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem('elec-onboarding-dismissed', 'true');
      localStorage.setItem('elec-aspirations-v2', JSON.stringify({
        completed: true,
        targetSchool: 'NEU',
        targetMajor: 'Kinh doanh quốc tế',
        targetScore: '27.5'
      }));
      localStorage.setItem('cs-dev-mock-user', JSON.stringify({
        uid: 'mock-user-123',
        displayName: 'Duyyy nè',
        email: 'du****@gmail.com',
        photoURL: '',
        isVip: true,
        role: 'teacher_pro',
        joinedDays: 32,
        targetScore: '27.5',
        targetSchool: 'NEU'
      }));
      localStorage.setItem('cs-user-subscription:mock-user-123', JSON.stringify({
        planId: 'vip_yearly',
        planName: 'VIP',
        period: 'Trọn mùa thi 2027',
        quotaRemaining: 99,
        points: 499999308,
        streak: 1,
        hearts: 99
      }));
      localStorage.setItem('elec-user-points', '499999308');
    });
  };

  // 1. Profile Overview
  const ctxDesktop = await browser.newContext({ viewport: { width: 1366, height: 950 } });
  const p1 = await ctxDesktop.newPage();
  await setupStorage(p1);

  console.log('Navigating to Profile...');
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

  await p1.screenshot({ path: 'verify_screen2_profile.png' });
  console.log('Saved verify_screen2_profile.png');

  // 2. Pricing Tab
  const vipTabBtn = p1.locator('button:has-text("Gói VIP & Lộ trình")');
  if (await vipTabBtn.count() > 0) {
    await vipTabBtn.click({ force: true });
    await p1.waitForTimeout(1000);
    await p1.screenshot({ path: 'verify_screen1_pricing.png' });
    console.log('Saved verify_screen1_pricing.png');
  }

  // 3. Mobile Home (390x844)
  const ctxMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const p2 = await ctxMobile.newPage();
  await setupStorage(p2);

  console.log('Navigating to Mobile Home...');
  await p2.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: 'verify_screen3_mobile_home.png' });
  console.log('Saved verify_screen3_mobile_home.png');

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
})();
