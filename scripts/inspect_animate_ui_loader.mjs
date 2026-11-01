import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Nguyen The Duy\\.gemini\\antigravity\\brain\\2e3e62eb-9044-4017-b6c4-48c8b875d9c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to https://animate-ui.com/ ...');
  
  await page.goto('https://animate-ui.com/', { waitUntil: 'domcontentloaded' });
  console.log('DOM Content Loaded!');

  // Take immediate screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'animate_ui_0ms.png') });
  
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'animate_ui_300ms.png') });

  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'animate_ui_900ms.png') });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'animate_ui_1900ms.png') });

  // Get full page HTML structure and styles
  const pageDetails = await page.evaluate(() => {
    return {
      title: document.title,
      heroHtml: document.querySelector('main')?.innerHTML?.slice(0, 1500) || document.body.innerHTML.slice(0, 1500),
      hasSvg: document.querySelectorAll('svg').length,
      scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
    };
  });

  console.log('Page details:', pageDetails.title);
  console.log('Hero snippet:', pageDetails.heroHtml?.slice(0, 300));

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
