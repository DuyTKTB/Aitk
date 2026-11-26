/**
 * scripts/ping-indexnow.mjs
 * -------------------------------------------------------------------
 * Gửi danh sách URL mới/cập nhật của ELEC Science AI tới IndexNow API
 * (Bing, Yandex, Naver, Seznam, Yep, và hệ sinh thái tìm kiếm AI sử dụng Bing).
 */
const HOST = 'www.elecai.id.vn';
const ORIGIN = `https://${HOST}`;
const KEY = 'elecai2026indexnowkey771a44e1ad93';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;

const URL_LIST = [
  `${ORIGIN}/`,
  `${ORIGIN}/nha-sang-lap`,
  `${ORIGIN}/gioi-thieu`,
  `${ORIGIN}/cong-dong`,
  `${ORIGIN}/chu-de/hoahoc12`,
  `${ORIGIN}/chu-de/vatli12`,
  `${ORIGIN}/chu-de/sinhhoc12`,
  `${ORIGIN}/chu-de/thptqg2026`,
  `${ORIGIN}/tro-ly-ai-giai-hoa`,
  `${ORIGIN}/phong-thi-ao`,
  `${ORIGIN}/phong-thi-nghiem-vat-li`,
  `${ORIGIN}/bang-tuan-hoan`,
  `${ORIGIN}/can-bang-phuong-trinh-hoa-hoc`,
  `${ORIGIN}/lo-trinh-on-thi-thpt-quoc-gia`,
  `${ORIGIN}/cong-thuc-hoa-hoc`,
  `${ORIGIN}/tai-lieu-hoa-hoc`,
  `${ORIGIN}/tinh-diem-xet-tuyen-dai-hoc`,
  `${ORIGIN}/tra-cuu-diem-chuan`,
  `${ORIGIN}/dinh-huong-nghe-nghiep`,
  `${ORIGIN}/tro-choi-khoa-hoc`,
  `${ORIGIN}/ai-doc-studio`,
  `${ORIGIN}/bang-phan-tuong-tac`,
  `${ORIGIN}/quiz`,
  `${ORIGIN}/bang-xep-hang`,
  `${ORIGIN}/chinh-sach-bao-mat`,
  `${ORIGIN}/dieu-khoan-su-dung`,
  `${ORIGIN}/llms.txt`,
  `${ORIGIN}/llms-full.txt`,
];

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
