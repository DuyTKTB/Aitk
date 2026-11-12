import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem(
      'cs-dev-mock-user',
      JSON.stringify({
        uid: 'test-user-study',
        email: 'ha8487172@gmail.com',
        displayName: 'Ha Hoang',
      })
    );
    localStorage.setItem('cs-theme-v2', '"light"');
    document.documentElement.dataset.theme = 'light';
  });

  console.log('Navigating to #study in LIGHT mode...');
  await page.goto('http://localhost:5173/#study');
  await page.waitForTimeout(1500);

  // Screenshot 1: Top view with perfect topbar and sidebar
  await page.screenshot({ path: 'scratch/study-clean-top.png' });
  console.log('Saved scratch/study-clean-top.png');

  // Scroll to traps section
  await page.evaluate(() => {
    const el = document.getElementById('sec-traps');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(500);

  // Screenshot 2: Traps section with red (x) icons, footer bar and floating AI button
  await page.screenshot({ path: 'scratch/study-clean-traps-footer.png' });
  console.log('Saved scratch/study-clean-traps-footer.png');

  await browser.close();
  console.log('All done!');
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
