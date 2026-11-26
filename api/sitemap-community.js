/**
 * api/sitemap-community.js — Dynamic XML Sitemap cho Cộng đồng ELEC AI
 * --------------------------------------------------------------------
 * Tự động liệt kê:
 *   - /cong-dong (Hub xu hướng cộng đồng)
 *   - Các chuyên mục chủ đề KHTN (/chu-de/*)
 *   - Toàn bộ bài viết công khai đạt chuẩn Quality Gate (`indexable: true`)
 */

const SITE_ORIGIN = 'https://www.elecai.id.vn';
const PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'duyheheh-2a269';

const CORE_TOPIC_SLUGS = [
  'hoahoc12',
  'vatli12',
  'sinhhoc12',
  'thptqg2026',
  'estelipit',
  'hoccungelec',
];

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function decodeFsValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  return null;
}

function decodeDoc(doc) {
  const fields = doc?.fields || {};
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = decodeFsValue(v);
  }
  const parts = String(doc?.name || '').split('/');
  obj.id = obj.id || parts[parts.length - 1] || '';
  return obj;
}

function toIsoDate(ts) {
  try {
    return new Date(Number(ts) || Date.now()).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');

  let posts = [];
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      PROJECT_ID
    )}/databases/(default)/documents/communityPosts?pageSize=200`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      posts = (Array.isArray(data?.documents) ? data.documents : [])
        .map(decodeDoc)
        .filter((p) => {
          if (!p || p.status !== 'published' || p.hiddenByAdmin) return false;
          return Boolean(
            p.indexable ||
              p.featuredByAdmin ||
              String(p.text || '').trim().length >= 60 ||
              (p.category === 'question' && (Number(p.replyCount) || 0) >= 1)
          );
        })
        .sort((a, b) => (Number(b.updatedAt || b.createdAt) || 0) - (Number(a.updatedAt || a.createdAt) || 0));
    }
  } catch {
    posts = [];
  }

  const today = new Date().toISOString().split('T')[0];
  const entries = [
    { loc: `${SITE_ORIGIN}/cong-dong`, lastmod: today, changefreq: 'hourly', priority: '0.9' },
    ...CORE_TOPIC_SLUGS.map((slug) => ({
      loc: `${SITE_ORIGIN}/chu-de/${slug}`,
      lastmod: today,
      changefreq: 'daily',
      priority: '0.8',
    })),
    ...posts.map((p) => ({
      loc: `${SITE_ORIGIN}/cong-dong/${encodeURIComponent(p.slug || p.id)}`,
      lastmod: toIsoDate(p.updatedAt || p.createdAt),
      changefreq: 'weekly',
      priority: p.featuredByAdmin || p.bestReplyId ? '0.85' : '0.75',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
    <changefreq>${escapeXml(e.changefreq)}</changefreq>
    <priority>${escapeXml(e.priority)}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.status(200).send(xml);
}
