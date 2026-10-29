import fs from 'fs';
const s = fs.readFileSync('dist/index.html', 'utf8');
const assets = [...s.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]);
assets.forEach((a) => console.log(a));
console.log('has-pdf:', assets.some((a) => /pdf/i.test(a)));
console.log('has-three:', assets.some((a) => /three/i.test(a)));
