import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const navHtml = await page.evaluate(() => {
    const desktopNav = document.querySelector('.desktop-nav, nav, header');
    return desktopNav ? desktopNav.outerHTML.slice(0, 1500) : 'No nav found';
  });
  console.log('Nav HTML:', navHtml);

  // Check if .sg-nav-wrap exists in DOM
  const sgNavWrap = await page.evaluate(() => {
    const el = document.querySelector('.sg-nav-wrap');
    if (!el) return 'Not found in DOM';
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      html: el.outerHTML.slice(0, 500)
    };
  });
  console.log('sgNavWrap info:', JSON.stringify(sgNavWrap, null, 2));

  await browser.close();
}

main().catch(console.error);
