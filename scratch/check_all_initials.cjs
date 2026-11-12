const { execSync } = require('child_process');
const out = execSync('git grep -n "initial" src/components/', { encoding: 'utf8' });
const lines = out.split('\n');
const results = lines.filter(l => {
  return (l.includes('avatar') || l.includes('initial =') || l.includes('userInitial') || l.includes('initials')) &&
         !l.includes('initialTab') &&
         !l.includes('initialExam') &&
         !l.includes('initialMode') &&
         !l.includes('initialSubTab') &&
         !l.includes('initialConfig') &&
         !l.includes('initialZoom') &&
         !l.includes('initialDiscountCode');
});
console.log(results.join('\n'));
