import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.message));

  console.log('Navigating...');
  await page.goto('http://localhost:5173/#profile?tab=overview', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log('Dispatching elec-open-credit-topup...');
  const res = await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
    return {
      hasModal: !!document.querySelector('.ns9-cr-modal'),
      hasTitle: !!document.querySelector('.ns9-cr-title'),
      titleText: document.querySelector('.ns9-cr-title')?.textContent,
      backdrop: !!document.querySelector('.ns9-cr-backdrop'),
    };
  });
  console.log('Result right after dispatch:', res);

  await page.waitForTimeout(500);
  const res2 = await page.evaluate(() => {
    return {
      hasModal: !!document.querySelector('.ns9-cr-modal'),
      hasTitle: !!document.querySelector('.ns9-cr-title'),
      titleText: document.querySelector('.ns9-cr-title')?.textContent,
    };
  });
  console.log('Result after 500ms:', res2);

  await browser.close();
}

test().catch(console.error);
