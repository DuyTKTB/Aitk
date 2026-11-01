import { chromium } from 'playwright';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#profile?tab=overview');
  await page.waitForTimeout(2000);

  const html = await page.content();
  console.log('Page title:', await page.title());
  console.log('Contains CreditTopUp or ns9-cr:', html.includes('ns9-cr'));
  console.log('Contains Mua:', html.includes('Mua'));
  console.log('Contains ELEC:', html.includes('ELEC'));

  // Kiểm tra xem các component nào đang có trong DOM
  const elements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).map(el => el.className).filter(Boolean).slice(0, 30);
  });
  console.log('Sample classes:', elements);

  await browser.close();
}

inspect().catch(console.error);
