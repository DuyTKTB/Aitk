import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const trigger = page.locator('.sg-nav-trigger').first();
  const isVis = await trigger.isVisible();
  console.log('sg-nav-trigger visible:', isVis);
  if (isVis) {
    console.log('trigger text:', await trigger.innerText());
    await trigger.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scratch/screenshot-home-goal-dropdown.png' });
    console.log('Saved scratch/screenshot-home-goal-dropdown.png');
  }

  await browser.close();
}

main().catch(console.error);
