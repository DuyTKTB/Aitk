import fs from 'fs';

// 1. Patch BottomNav.jsx
let bn = fs.readFileSync('src/components/BottomNav.jsx', 'utf8');
if (!bn.includes('elec-close-nav-dropdowns')) {
  bn = bn.replace(
    'buzz();\n              if (isAction && onOpenMore) {',
    "buzz();\n              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));\n              if (isAction && onOpenMore) {"
  );
  fs.writeFileSync('src/components/BottomNav.jsx', bn, 'utf8');
  console.log('✓ Patched BottomNav.jsx');
}

// 2. Patch DesktopNav.jsx
let dn = fs.readFileSync('src/components/DesktopNav.jsx', 'utf8');
dn = dn.replace(
  `onClick={(e) => {
              if (window.location.hash === '#leaderboard') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}`,
  `onClick={(e) => {
              window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
              if (window.location.hash === '#leaderboard') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }
            }}`
);
fs.writeFileSync('src/components/DesktopNav.jsx', dn, 'utf8');
console.log('✓ Patched DesktopNav.jsx');

// 3. Patch MobileHeader.jsx
let mh = fs.readFileSync('src/components/MobileHeader.jsx', 'utf8');
mh = mh.replace(
  `href="#leaderboard"
          className={\`mhead-streak-pill \${hasStreakToday ? 'is-active' : 'is-idle'}\`}`,
  `href="#leaderboard"
          className={\`mhead-streak-pill \${hasStreakToday ? 'is-active' : 'is-idle'}\`}
          onClick={(e) => {
            window.dispatchEvent(new CustomEvent('elec-close-nav-dropdowns'));
            if (window.location.hash === '#leaderboard') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.dispatchEvent(new HashChangeEvent('hashchange'));
            }
          }}`
);
fs.writeFileSync('src/components/MobileHeader.jsx', mh, 'utf8');
console.log('✓ Patched MobileHeader.jsx');
