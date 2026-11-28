/**
 * scripts/ping-indexnow.mjs
 * -------------------------------------------------------------------
 * Gửi toàn bộ URL Pillar, Công cụ, pSEO Hubs và trang thông tin của ELEC Science AI
 * tới IndexNow API (Bing, Yandex, Naver, Seznam, Yep và AI Search dùng Bing).
 */
import { SEO_PILLAR_ROUTES, PSEO_HUB_LINKS, SITE_ORIGIN } from '../src/data/seoPillarRoutes.js';

const HOST = 'www.elecai.id.vn';
const ORIGIN = SITE_ORIGIN;
const KEY = 'elecai2026indexnowkey771a44e1ad93';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

const URL_LIST = Array.from(
  new Set([
    `${ORIGIN}/`,
    `${ORIGIN}/nha-sang-lap`,
    `${ORIGIN}/gioi-thieu`,
    `${ORIGIN}/chinh-sach-bao-mat`,
    `${ORIGIN}/dieu-khoan-su-dung`,
    `${ORIGIN}/llms.txt`,
    `${ORIGIN}/llms-full.txt`,
    `${ORIGIN}/chu-de/hoahoc12`,
    `${ORIGIN}/chu-de/vatli12`,
    `${ORIGIN}/chu-de/sinhhoc12`,
    `${ORIGIN}/chu-de/thptqg2026`,
    ...PSEO_HUB_LINKS.map((h) => `${ORIGIN}${h.href}`),
    ...SEO_PILLAR_ROUTES.map((r) => `${ORIGIN}/${r.slug}`),
  ])
);

async function main() {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST,
  };

  const resp = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const body = await resp.text().catch(() => '');
  console.log(`[indexnow] HTTP ${resp.status} (${URL_LIST.length} URLs)${body ? ` — ${body}` : ''}`);
  if (!resp.ok && resp.status !== 202) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('[indexnow] Error:', err);
  process.exitCode = 1;
});
