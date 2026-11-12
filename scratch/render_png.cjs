const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
  const svg = fs.readFileSync('public/img/user-tk-logo.svg', 'utf8');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><div style="width:256px;height:256px;">${svg}</div></body></html>`);
  await page.screenshot({ path: 'public/img/user-tk-logo.png', omitBackground: true });
  await browser.close();
  console.log('Saved public/img/user-tk-logo.png (256x256)');
})();
