import fs from 'node:fs';
import path from 'node:path';

const v = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
console.log(`vercel.json OK | redirects=${v.redirects.length} | rewrites=${v.rewrites.length}`);

const idx = fs.readFileSync('dist/index.html', 'utf8');
const idxLd = idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!idxLd) throw new Error('Missing JSON-LD in dist/index.html');
JSON.parse(idxLd[1]);
if (idxLd[1].includes('aggregateRating')) {
  throw new Error('Synthetic aggregateRating still present in dist/index.html');
}
console.log('dist/index.html JSON-LD OK (no synthetic aggregateRating)');

function collectHtml(dir, isRoot = true) {
  let out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!isRoot || ['nguyen-to', 'de-thi', 'phuong-trinh', 'kien-thuc'].includes(ent.name)) {
        out = out.concat(collectHtml(full, false));
      }
    } else if (
      ent.isFile() &&
      ent.name.endsWith('.html') &&
      ent.name !== 'offline.html' &&
      !ent.name.startsWith('google')
    ) {
      out.push(full);
    }
  }
  return out;
}

const files = collectHtml('dist', true);
let jsonLdBlocks = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  if (!html.includes('<link rel="canonical"')) throw new Error(`Missing canonical in ${f}`);
  if (!html.includes('<h1')) throw new Error(`Missing h1 in ${f}`);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (scripts.length === 0) throw new Error(`Missing JSON-LD in ${f}`);
  for (const m of scripts) {
    JSON.parse(m[1]);
    jsonLdBlocks += 1;
  }
}

const mainSitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
const pseoSitemap = fs.readFileSync('dist/sitemap-pseo.xml', 'utf8');
const mainCount = (mainSitemap.match(/<url>/g) || []).length;
const pseoCount = (pseoSitemap.match(/<url>/g) || []).length;

console.log(`ALL static SEO HTML files verified: ${files.length} pages | JSON-LD blocks valid: ${jsonLdBlocks}`);
console.log(`sitemap.xml=${mainCount} URLs | sitemap-pseo.xml=${pseoCount} URLs | Total static URLs=${mainCount + pseoCount}`);
