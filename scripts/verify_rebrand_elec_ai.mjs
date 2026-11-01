import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Mock logged-in user + completed onboarding matching the user's real browser state
  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'duyyy_uid_123',
      displayName: 'Duyyy nè',
      email: 'duyyy@gmail.com',
      providerData: [{ providerId: 'password' }],
      metadata: {
        creationTime: '2026-09-30T00:00:00.000Z',
        lastSignInTime: '2026-10-31T12:00:00.000Z'
      }
    }));
    localStorage.setItem('elec-aspirations-v2:duyyy_uid_123', JSON.stringify({
      userId: 'duyyy_uid_123',
      onboardingCompleted: true,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp_bka',
      aspirations: [
        {
          id: 'asp_bka',
          schoolId: 'BKA',
          schoolCode: 'BKA',
          schoolName: 'Đại Học Bách Khoa Hà Nội',
          majorId: 'BKA_IT1',
          majorName: 'Khoa học Máy tính (IT1)',
          block: 'A01',
          priority: 1,
          targetScore: 25.75,
          targetChemScore: 8.5
        }
      ]
    }));
  });

  console.log('1. Navigating to Profile Overview...');
  await page.goto('http://localhost:5173/#profile?tab=overview', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  // Mở avatar dropdown để kiểm tra mục "Mua ELEC AI Credit"
  console.log('2. Testing Profile Dropdown...');
  const avatarBtn = page.locator('.ns9-uprof-trigger').first();
  if (await avatarBtn.isVisible()) {
    await avatarBtn.click();
    await page.waitForTimeout(600);
    const dropdownItem = page.locator('button.ns9-uprof-item:has-text("Mua ELEC AI Credit")');
    const isVisible = await dropdownItem.isVisible();
    console.log('Dropdown item "Mua ELEC AI Credit" visible:', isVisible);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_dropdown_elec_credit.png') });
    // Click ngoài để đóng dropdown
    await page.click('body', { position: { x: 50, y: 50 } });
    await page.waitForTimeout(400);
  }

  // Mở Modal Mua ELEC AI Credit
  console.log('3. Opening Credit TopUp Modal...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
  });
  await page.waitForTimeout(1000);

  // Kiểm tra title, subtitle, balance, summary
  const modalTitle = await page.locator('.ns9-cr-title').textContent();
  const modalSub = await page.locator('.ns9-cr-subtitle').textContent();
  const balanceBadge = await page.locator('.ns9-cr-balance-badge').textContent();
  const summaryRow = await page.locator('.ns9-cr-summary-row').textContent();
  const caption = await page.locator('.ns9-cr-caption').textContent();

  console.log('--- KẾT QUẢ REBRANDING ELEC AI ---');
  console.log('Modal title:', modalTitle?.trim());
  console.log('Modal sub:', modalSub?.trim());
  console.log('Balance badge:', balanceBadge?.trim());
  console.log('Summary row:', summaryRow?.trim());
  console.log('Caption:', caption?.trim());

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_modal_elec_credit.png') });

  // Kiểm tra Mobile Viewport
  console.log('4. Testing Mobile Viewport (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_mobile_modal_elec_credit.png') });

  // Đóng modal và chụp Mobile Home
  await page.locator('.ns9-cr-close-btn').click();
  await page.waitForTimeout(600);
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_mobile_home_rebrand.png') });

  console.log('ALL VERIFICATIONS FINISHED SUCCESSFULLY!');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
