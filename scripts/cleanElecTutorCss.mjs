import fs from 'fs';

let css = fs.readFileSync('src/styles/elec-tutor-modal.css', 'utf8');

// Find index of .et-overlay
const etIndex = css.indexOf('.et-overlay {');
if (etIndex > 0) {
  const header = `/* ============================================================
   elec-tutor-modal.css — FULL-SCREEN ONBOARDING ELEC TUTOR (.et-*)
   ============================================================ */\n\n`;
  let rest = css.slice(etIndex);

  // Also remove .sg- from media queries at the bottom
  rest = rest.replace(/\/\* Lớp nền mờ khi mở Bottom Sheet[\s\S]*?\.sg-panel-cols \{[\s\S]*?\}/g, '');
  rest = rest.replace(/\.sg-dropdown-panel,\s*/g, '');
  rest = rest.replace(/\.sg-mobile-backdrop,\s*/g, '');

  fs.writeFileSync('src/styles/elec-tutor-modal.css', header + rest, 'utf8');
  console.log('Successfully cleaned elec-tutor-modal.css!');
} else {
  console.log('etIndex not found');
}
