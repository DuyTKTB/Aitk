import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.addInitScript(() => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    localStorage.setItem('elec-onboarding-dismissed', 'true');
  });

  await page.goto('http://localhost:5173/#games', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const cardsCount = await page.locator('.game-card-v2').count();
  console.log('Total game cards in ALL:', cardsCount);

  // Check filter tabs
  const tabLocators = page.locator('.cg-tab-btn');
  const tabsCount = await tabLocators.count();
  const tabs = [];
  for (let i = 0; i < tabsCount; i++) {
    tabs.push((await tabLocators.nth(i).innerText()).trim());
  }
  console.log('Filter tabs:', tabs);

  let sumCategorized = 0;
  for (let i = 1; i < tabsCount; i++) {
    await tabLocators.nth(i).click();
    await page.waitForTimeout(300);
    const count = await page.locator('.game-card-v2').count();
    console.log(`Tab '${tabs[i]}' has ${count} cards`);
    sumCategorized += count;
  }
  console.log(`Total categorized = ${sumCategorized} vs Total All = ${cardsCount}`);
  if (sumCategorized !== cardsCount) {
    console.log(`WARNING: Discrepancy! ${cardsCount - sumCategorized} games are orphan / not reachable in category filters!`);
  }

  // Check all game links
  await tabLocators.nth(0).click(); // back to all
  await page.waitForTimeout(300);
  const playLinks = await page.locator('.gc-play').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  console.log('Found game play links count:', playLinks.length);

  // Test routing to each game
  const routeResults = [];
  for (const link of playLinks) {
    const gameRoute = link.replace(/^#/, '');
    await page.goto(`http://localhost:5173/#${gameRoute}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const title = await page.title();
    const has404 = await page.locator('text=Không tìm thấy trang').count() > 0 || (await page.locator('.not-found').count()) > 0;
    const bodyText = await page.locator('body').innerText();
    const isEmpty = bodyText.trim().length === 0;
    routeResults.push({
      route: gameRoute,
      ok: !has404 && !isEmpty,
      has404,
      title
    });
  }

  console.log('Route test results:');
  const brokenRoutes = routeResults.filter((r) => !r.ok);
  if (brokenRoutes.length > 0) {
    console.log('BROKEN ROUTES FOUND:', brokenRoutes);
  } else {
    console.log('All 28 game routes loaded without 404!');
  }

  console.log('Console errors during test:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Sample console errors:', consoleErrors.slice(0, 5));
  }

  await browser.close();
})();
