import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to 9study dashboard...');
  await page.goto('https://9study.vn/phong-luyen-thi/tot-nghiep-thpt', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Close modals if any
  const closeSelectors = ['button.close', '[aria-label="Close"]', 'button:has-text("Đóng")', 'button:has-text("Để sau")'];
  for (const sel of closeSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible()) {
        await el.click();
        await page.waitForTimeout(500);
      }
    } catch {}
  }

  // Also try clicking Escape or top right X
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'scripts/screenshot-9study-dashboard-clean.png', fullPage: false });
  console.log('Saved clean screenshot');

  // Let's also navigate to roadmap / practice if available
  const practiceLink = page.locator('a[href*="phong-luyen-tap"]').first();
  if (await practiceLink.isVisible()) {
    console.log('Navigating to phong-luyen-tap...');
    await practiceLink.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: 'scripts/screenshot-9study-practice.png', fullPage: false });
    console.log('Saved practice screenshot');
  }

  await browser.close();
}

main().catch(console.error);
