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
        major: { id: 'an-ninh-mang', name: 'Ngành An ninh mạng (Thí sinh Nữ, miền Bắc)', blocks: ['A00'] },
        block: 'A00',
        targetScore: 26,
        targetChemScore: 8.75,
      }]
    }));
  });

  await page.goto('http://localhost:5173/#roadmap?chapter=c11-equilibrium', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Scroll .rm-sheet to algorithms & formulas
  await page.evaluate(() => {
    const sheet = document.querySelector('.rm-sheet');
    if (sheet) sheet.scrollTop = 550;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/screenshot-sheet-scroll-1.png' });
  console.log('Saved scratch/screenshot-sheet-scroll-1.png');

  // Scroll .rm-sheet further to formulas & traps
  await page.evaluate(() => {
    const sheet = document.querySelector('.rm-sheet');
    if (sheet) sheet.scrollTop = 1200;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/screenshot-sheet-scroll-2.png' });
  console.log('Saved scratch/screenshot-sheet-scroll-2.png');

  // Scroll to bottom (CTA)
  await page.evaluate(() => {
    const sheet = document.querySelector('.rm-sheet');
    if (sheet) sheet.scrollTop = 2000;
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/screenshot-sheet-scroll-3.png' });
  console.log('Saved scratch/screenshot-sheet-scroll-3.png');

  await browser.close();
}

main().catch(console.error);
