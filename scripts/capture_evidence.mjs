import { chromium } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function captureEvidence() {
  const browser = await chromium.launch({ headless: true });

  const setupPage = async (viewport) => {
    const page = await browser.newPage({ viewport });
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
    });
    return page;
  };

  // 1. Desktop Profile Overview
  {
    const page = await setupPage({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#profile?tab=overview', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'verified_desktop_overview.png') });
    await page.close();
  }

  // 2. Mobile Profile Overview
  {
    const page = await setupPage({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/#profile?tab=overview', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'verified_mobile_390_overview.png') });
    await page.close();
  }

  // 3. Desktop VIP Pricing
  {
    const page = await setupPage({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/#profile?tab=vip', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'verified_desktop_vip.png') });
    await page.close();
  }

  // 4. Modal Mua Study Credit với Invoice Validation
  {
    const page = await setupPage({ width: 1200, height: 800 });
    await page.goto('http://localhost:5173/#profile?tab=overview', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('elec-open-credit-topup')));
    await page.waitForTimeout(400);

    // Xóa ô nhập để trigger validation
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('.ns9-cr-input'));
      for (const input of inputs) {
        const prototype = Object.getPrototypeOf(input);
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set || Object.getOwnPropertyDescriptor(input, 'value')?.set;
        if (setter) setter.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const payBtn = document.querySelector('.ns9-cr-pay-btn');
      if (payBtn) payBtn.click();
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'verified_credit_modal_validation.png') });
    await page.close();
  }

  // 5. Tablet 768px Header + BottomNav
  {
    const page = await setupPage({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'verified_tablet_768_nav.png') });
    await page.close();
  }

  await browser.close();
  console.log('Đã chụp toàn bộ ảnh chứng minh kết quả!');
}

captureEvidence();
