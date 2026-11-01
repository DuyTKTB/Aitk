import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Nguyen The Duy\\.gemini\\antigravity\\brain\\2e3e62eb-9044-4017-b6c4-48c8b875d9c0';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Mock user so it doesn't show guest modal blocking view
  await context.addInitScript(() => {
    localStorage.setItem(
      'cs-dev-mock-user',
      JSON.stringify({
        uid: 'user-elec-demo',
        email: 'student@elec.ai',
        displayName: 'Học sinh ELEC',
      })
    );
    localStorage.setItem(
      'elec-aspirations-v2:user-elec-demo',
      JSON.stringify({
        userId: 'user-elec-demo',
        selectedExamId: 'THPTQG',
        onboardingCompleted: true,
        aspirations: []
      })
    );
    // Clear session storage so intro always runs fresh
    sessionStorage.removeItem('elec-intro-played');
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/#home ...');
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });

  // Frame 1: ~100ms
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'elec_intro_01_tracing.png') });
  console.log('Saved elec_intro_01_tracing.png');

  // Frame 2: ~600ms (blooming)
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'elec_intro_02_blooming.png') });
  console.log('Saved elec_intro_02_blooming.png');

  // Frame 3: ~1450ms (gliding toward navbar)
  await page.waitForTimeout(850);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'elec_intro_03_gliding.png') });
  console.log('Saved elec_intro_03_gliding.png');

  // Frame 4: ~2400ms (navbar docked, page revealed)
  await page.waitForTimeout(950);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'elec_intro_04_docked.png') });
  console.log('Saved elec_intro_04_docked.png');

  // Also capture Dark mode intro
  const darkContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await darkContext.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem(
      'cs-dev-mock-user',
      JSON.stringify({
        uid: 'user-elec-demo',
        email: 'student@elec.ai',
        displayName: 'Học sinh ELEC',
      })
    );
    sessionStorage.removeItem('elec-intro-played');
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await darkPage.waitForTimeout(400);
  await darkPage.screenshot({ path: path.join(ARTIFACT_DIR, 'elec_intro_dark_mode.png') });
  console.log('Saved elec_intro_dark_mode.png');

  await browser.close();
  console.log('All verification screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
