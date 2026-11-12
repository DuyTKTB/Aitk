const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const svg = fs.readFileSync('scratch/tk-logo-test.svg', 'utf8');
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="background:#f1f5f9;display:flex;align-items:center;gap:24px;padding:40px;font-family:sans-serif;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:72px;height:72px;">${svg}</div>
          <span style="font-size:12px;color:#64748b;">72px (Home Hero)</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:40px;height:40px;">${svg}</div>
          <span style="font-size:12px;color:#64748b;">40px (Menu/Card)</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;">${svg}</div>
          <span style="font-size:12px;color:#64748b;">32px (Navbar/Chat)</span>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({ path: 'scratch/tk-logo-preview.png' });
  await browser.close();
  console.log('Saved scratch/tk-logo-preview.png');
})();
