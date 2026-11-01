import { chromium } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = 'C:/Users/Nguyen The Duy/.gemini/antigravity/brain/2e3e62eb-9044-4017-b6c4-48c8b875d9c0/qa_audit_evidence';

async function testMobileNav() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.addInitScript(() => {
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({
      uid: 'duyyy_uid_123',
      displayName: 'Duyyy',
      email: 'duyyy@gmail.com',
      providerData: [{ providerId: 'password' }],
      metadata: {
        creationTime: '2026-09-30T00:00:00.000Z',
        lastSignInTime: '2026-10-31T12:00:00.000Z'
      }
    }));
  });

  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // Chụp ảnh mobile home để so sánh trực tiếp với ảnh của user
  const outPath = path.join(EVIDENCE_DIR, 'compare_mobile_home_nav.png');
  await page.screenshot({ path: outPath, fullPage: false });

  // Kiểm tra thông tin BottomNav
  const navData = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.bn .bn-item')).map(el => {
      const label = el.querySelector('.bn-label')?.innerText?.trim();
      const badge = el.querySelector('.bn-badge-dot')?.innerText?.trim();
      const isActive = el.classList.contains('on');
      return { label, badge, isActive };
    });

    const mhead = document.querySelector('.mhead-bar');
    const mheadVisible = mhead && window.getComputedStyle(mhead).display !== 'none';
    const mheadPills = Array.from(mhead ? mhead.querySelectorAll('.mhead-right > *, .mhead-goal-slot') : []).map(el => el.innerText?.trim() || el.className);

    return { items, mheadVisible, mheadPills };
  });

  console.log('Mobile Nav Data:', JSON.stringify(navData, null, 2));

  await browser.close();
}

testMobileNav();
