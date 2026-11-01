import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');
const isCrlf = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

// 1. Replace if (!ready)
const oldNotReady = `  /* ============ GUARDS ============ */
  if (!ready) {
    return (
      <div className="loader">
        <span>ELEC AI</span>
      </div>
    );
  }`;

const newNotReady = `  /* ============ GUARDS ============ */
  if (!ready) {
    return <ElecIntroLoader />;
  }`;

if (norm.includes(oldNotReady)) {
  norm = norm.replace(oldNotReady, newNotReady);
  console.log('✓ Replaced if (!ready) with ElecIntroLoader');
} else {
  console.log('✗ Did not find oldNotReady');
}

// 2. Remove redundant IntroProvider around Landing
norm = norm.replace('<IntroProvider>\n        <ElecIntroLoader />', '<ElecIntroLoader />');
norm = norm.replace('</IntroProvider>\n      </Suspense>', '</Suspense>');

// 3. Remove redundant IntroProvider around main return
norm = norm.replace('  return (\n    <IntroProvider>\n      <div data-page={page}', '  return (\n    <div data-page={page}');
norm = norm.replace('    </div>\n    </IntroProvider>\n  );', '    </div>\n  );');

// 4. Update import in App.jsx: only need ElecIntroLoader, { PageLoader }
norm = norm.replace(
  "import ElecIntroLoader, { IntroProvider, PageLoader } from './components/ElecIntroLoader.jsx';",
  "import ElecIntroLoader, { PageLoader } from './components/ElecIntroLoader.jsx';"
);

if (isCrlf) norm = norm.replace(/\n/g, '\r\n');
fs.writeFileSync('src/App.jsx', norm, 'utf8');
console.log('✓ Updated App.jsx successfully');
