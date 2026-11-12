const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 300 } });
  await page.goto('file://' + path.join(__dirname, 'preview_student_avatars.html'));
  await page.screenshot({ path: path.join(__dirname, 'preview_student_avatars.png') });
  await browser.close();
  console.log('Saved preview_student_avatars.png');
})();
