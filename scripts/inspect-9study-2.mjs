import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://9study.vn/phong-luyen-tap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const practiceBtn = page.locator('button:has-text("Bắt đầu luyện tập"), a:has-text("Bắt đầu luyện tập")').first();
  if (await practiceBtn.isVisible()) {
    await practiceBtn.click();
    await page.waitForTimeout(3000);
    console.log('After practice click URL:', page.url());
    await page.screenshot({ path: 'scripts/screenshot-9study-practice-detail.png', fullPage: false });
  }

  // Also check "THẦN SỐ HỌC / BÁO CÁO ĐỊNH HƯỚNG"
  await page.goto('https://9study.vn/bao-cao-dinh-huong', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('Orientation report URL:', page.url());
  await page.screenshot({ path: 'scripts/screenshot-9study-orientation.png', fullPage: false });

  await browser.close();
}

main().catch(console.error);
