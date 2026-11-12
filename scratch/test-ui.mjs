import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on StudyGoalNavDropdown trigger
  const pill = page.locator('.sg-nav-pill, button:has-text("ANND")').first();
  if (await pill.isVisible()) {
    console.log('Clicking goal pill...');
    await pill.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scratch/screenshot-home-goal-dropdown.png' });
    console.log('Saved scratch/screenshot-home-goal-dropdown.png');
  } else {
    console.log('Pill not found!');
  }

  // Now go to roadmap
  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/screenshot-roadmap.png' });
  console.log('Saved scratch/screenshot-roadmap.png');

  // Open first chapter's Ly thuyet
  const theoryBtn = page.locator('.ns9-btn-theory, button:has-text("Lý thuyết"), button:has-text("Chi tiết")').first();
  if (await theoryBtn.isVisible()) {
    console.log('Clicking theory button...');
    await theoryBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'scratch/screenshot-chapter-sheet.png' });
    console.log('Saved scratch/screenshot-chapter-sheet.png');
  } else {
    console.log('Theory button not found, clicking first card');
    const firstCard = page.locator('.ns9-ch-card, .rm-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'scratch/screenshot-chapter-sheet.png' });
    }
  }

  await browser.close();
}

main().catch(console.error);
