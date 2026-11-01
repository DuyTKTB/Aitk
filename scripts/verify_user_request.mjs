import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Nguyen The Duy\\.gemini\\antigravity\\brain\\2e3e62eb-9044-4017-b6c4-48c8b875d9c0';

async function verify() {
  const browser = await chromium.launch({ headless: true });

  // 1. Light Mode Verification
  console.log('Testing Light Mode...');
  const lightContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await lightContext.addInitScript(() => {
    localStorage.setItem('theme', 'light');
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
    sessionStorage.removeItem('elec-intro-played');
  });

  const page = await lightContext.newPage();
  await page.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });

  // Capture glowing logo in center
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_glowing_logo_center_light.png') });
  console.log('Saved verified_glowing_logo_center_light.png');

  // Capture glide transition
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_logo_gliding_to_nav.png') });
  console.log('Saved verified_logo_gliding_to_nav.png');

  // Capture final docked navbar
  await page.waitForTimeout(1100);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_logo_docked_in_nav.png') });
  console.log('Saved verified_logo_docked_in_nav.png');

  // Also close-up screenshot of navbar cluster
  const navLogo = page.locator('.nav-left-cluster');
  if (await navLogo.count() > 0) {
    await navLogo.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_navbar_logo_only.png') });
    console.log('Saved verified_navbar_logo_only.png');
  }

  // 2. Dark Mode Glowing Logo
  console.log('Testing Dark Mode...');
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
    localStorage.setItem(
      'elec-aspirations-v2:user-elec-demo',
      JSON.stringify({
        userId: 'user-elec-demo',
        selectedExamId: 'THPTQG',
        onboardingCompleted: true,
        aspirations: []
      })
    );
    sessionStorage.removeItem('elec-intro-played');
  });

  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:5173/#home', { waitUntil: 'domcontentloaded' });
  await darkPage.waitForTimeout(600);
  await darkPage.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_glowing_logo_center_dark.png') });
  console.log('Saved verified_glowing_logo_center_dark.png');

  await browser.close();
  console.log('All verifications finished!');
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
