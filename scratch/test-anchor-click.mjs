import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:5173/', { waitUntil: 'commit' });
  await page.evaluate(() => {
    const uid = 'test-duy';
    localStorage.setItem('cs-dev-mock-user', JSON.stringify({ uid, displayName: 'Nguyen Duy TK', email: 'duyfamebo@gmail.com' }));
    localStorage.setItem(`elec-aspirations-v2:${uid}`, JSON.stringify({
      userId: uid,
      selectedExamId: 'THPTQG',
      activeAspirationId: 'asp-1',
      aspirations: [{
        id: 'asp-1',
        priority: 1,
        schoolId: 'ANND',
        school: { id: 'ANND', code: 'ANND', name: 'Học Viện An Ninh Nhân Dân', city: 'Hà Nội' },
        majorId: 'an-ninh-mang',
        major: { id: 'an-ninh-mang', name: 'Ngành An ninh mạng', blocks: ['A00'] },
        block: 'A00',
        targetScore: 26,
        targetChemScore: 8.75,
      }]
    }));
  });

  await page.goto('http://localhost:5173/#roadmap?chapter=c11-equilibrium', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on "Công thức" anchor pill
  const formulaPill = page.locator('.ns9-anchor-pill:has-text("Công thức")').first();
  console.log('Clicking formula pill...');
  await formulaPill.click();
  await page.waitForTimeout(1000);

  const scrollTop = await page.evaluate(() => {
    const sheet = document.querySelector('.rm-sheet');
    return sheet ? sheet.scrollTop : 0;
  });
  console.log('Sheet scrollTop after click:', scrollTop);
  await page.screenshot({ path: 'scratch/screenshot-anchor-clicked.png' });
  console.log('Saved scratch/screenshot-anchor-clicked.png');

  // Click on Copy LaTeX button
  const copyBtn = page.locator('.ns9-formula-copy-btn').first();
  if (await copyBtn.isVisible()) {
    console.log('Clicking copy LaTeX button...');
    await copyBtn.click();
    await page.waitForTimeout(500);
    const copyText = await copyBtn.innerText();
    console.log('Copy button text after click:', copyText);
  }

  await browser.close();
}

main().catch(console.error);
