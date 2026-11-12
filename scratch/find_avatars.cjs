const { execSync } = require('child_process');
const out = execSync('git grep -n "avatar" src/components/', { encoding: 'utf8' });
const lines = out.split('\n');
const results = lines.filter(l => {
  return !l.includes('UserAvatar') &&
         !l.includes('tps-') &&
         !l.includes('AIMark') &&
         !l.includes('avatarUrl') &&
         !l.includes('AvatarStack') &&
         !l.includes('FlaskAvatar') &&
         !l.includes('class-card');
});
console.log(results.join('\n'));
