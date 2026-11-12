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
        major: { id: 'an-ninh-mang', name: 'Ngành An ninh mạng và phòng chống tội phạm công nghệ cao (Thí sinh Nữ, miền Bắc)', blocks: ['A00'] },
        block: 'A00',
        targetScore: 26,
        targetChemScore: 8.75,
      }]
    }));
  });

  await page.goto('http://localhost:5173/#roadmap', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Scroll down to chapters list
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/screenshot-roadmap-chapters.png' });
  console.log('Saved scratch/screenshot-roadmap-chapters.png');

  await browser.close();
}

main().catch(console.error);
