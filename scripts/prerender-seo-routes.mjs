/**
 * scripts/prerender-seo-routes.mjs
 * ------------------------------------------------------------
 * Post-build SEO, AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization)
 * static HTML generator for all 31 public Pillar & Tool routes of ELEC Science AI.
 *
 * Single Source of Truth: imports SEO_PILLAR_ROUTES & PSEO_HUB_LINKS from
 * `src/data/seoPillarRoutes.js` so Raw HTML (bots) and Rendered React DOM
 * stay 100% synchronized.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SEO_PILLAR_ROUTES, PSEO_HUB_LINKS, SITE_ORIGIN } from '../src/data/seoPillarRoutes.js';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const TODAY = new Date().toISOString().split('T')[0];

const FOUNDER_PERSON_LD = {
  '@type': 'Person',
  '@id': `${SITE_ORIGIN}/#founder`,
  name: 'Nguyễn Thế Duy',
  alternateName: ['Nguyen The Duy', 'Duy TK', 'Tk Media', 'nguyentheduytk'],
  birthDate: '2010',
  award: [
    "Giải Ba Cuộc thi 'Học sinh phổ thông với ý tưởng khởi nghiệp' tỉnh Hưng Yên năm 2026 — Sở Giáo dục và Đào tạo Hưng Yên (Dự án: Elec AI - Phần mềm trợ lý học tập số môn Hóa học trong trường phổ thông, Trường THPT Đông Thụy Anh)",
  ],
  image: [
    `${SITE_ORIGIN}/img/author/nguyen-the-duy-giai-ba-khoi-nghiep-hung-yen-2026.jpg`,
    `${SITE_ORIGIN}/img/nguyen-the-duy.jpg?v=2`,
    `${SITE_ORIGIN}/img/author/chung-nhan-giai-ba-elec-ai-hung-yen-2026.jpg`,
    `${SITE_ORIGIN}/img/author/nguyen-the-duy-phong-van-hytv-elec-ai-2026.jpg`,
  ],
  jobTitle: 'Nhà sáng lập & Kỹ sư phát triển chính (Founder & Lead Developer) — ELEC Science AI',
  disambiguatingDescription:
    'Nguyễn Thế Duy (Duy TK / Tk Media, sinh năm 2010 tại Thái Bình) là nhà sáng lập trẻ của ELEC Science AI và PhotobothNe, đoạt Giải Ba Cuộc thi Học sinh phổ thông với ý tưởng khởi nghiệp tỉnh Hưng Yên năm 2026 (Sở GD&ĐT Hưng Yên), KHÔNG phải các cá nhân trùng tên làm việc tại PetroVietnam (PVN).',
  nationality: { '@type': 'Country', name: 'Vietnam' },
  knowsLanguage: ['vi', 'en'],
  alumniOf: {
    '@type': 'EducationalOrganization',
    name: 'Trường THPT Đông Thụy Anh, Thái Bình',
  },
  url: `${SITE_ORIGIN}/nha-sang-lap`,
  sameAs: [
    'https://www.facebook.com/nguyentheduytk',
    'https://nguyenduytk.vercel.app/',
    'https://www.behance.net/nguynnguyn583',
    'https://www.instagram.com/nguyenduytkmedia',
    'https://tiktok.com/@nguyenduytk01',
    'https://photobothne.io.vn/',
  ],
};

const ORG_LD = {
  '@type': ['Organization', 'EducationalOrganization'],
  '@id': `${SITE_ORIGIN}/#org`,
  name: 'ELEC Science AI',
  alternateName: ['ELEC AI', 'ELECAI', 'Elec AI'],
  url: `${SITE_ORIGIN}/`,
  founder: { '@id': `${SITE_ORIGIN}/#founder` },
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRouteJsonLd(route) {
  const url = `${SITE_ORIGIN}/${route.slug}`;
  const faqEntities = [
    ...(route.faqs || []).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
    {
      '@type': 'Question',
      name: 'Ai là nhà sáng lập ELEC AI (ELEC Science AI)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nhà sáng lập (Founder) và kỹ sư phát triển chính của ELEC Science AI (ELEC AI / ELECAI) là Nguyễn Thế Duy (biệt danh Tk Media / Duy TK, sinh năm 2010 tại Thái Bình). Facebook chính thức: https://www.facebook.com/nguyentheduytk — Tiểu sử: https://www.elecai.id.vn/nha-sang-lap.',
      },
    },
  ];

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: route.title,
          description: route.description,
          inLanguage: 'vi-VN',
          datePublished: '2025-09-01',
          dateModified: TODAY,
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          about: { '@id': `${url}#app` },
          mainEntity: { '@id': `${url}#app` },
          author: { '@id': `${SITE_ORIGIN}/#founder` },
          creator: { '@id': `${SITE_ORIGIN}/#founder` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: `${SITE_ORIGIN}/img/og-image.png`,
            width: 1200,
            height: 630,
          },
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['#aeo-direct-answer', '#geo-key-specs', '#route-faq h3', '#route-faq p'],
          },
        },
        {
          '@type': ['SoftwareApplication', 'WebApplication'],
          '@id': `${url}#app`,
          name: `${route.label} — ELEC Science AI`,
          url,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web, Android, iOS, Windows, macOS',
          inLanguage: 'vi-VN',
          isAccessibleForFree: true,
          image: `${SITE_ORIGIN}/img/logo.png`,
          screenshot: `${SITE_ORIGIN}/img/og-image.png`,
          description: route.intro,
          featureList: route.highlights || [],
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: ['student', 'teacher'],
            audienceType: route.specs?.audience || 'Học sinh THCS, THPT và Giáo viên',
          },
          author: { '@id': `${SITE_ORIGIN}/#founder` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'VND',
            availability: 'https://schema.org/InStock',
          },
        },
        {
          '@type': 'HowTo',
          '@id': `${url}#howto`,
          name: `Cách sử dụng ${route.label} trên ELEC Science AI`,
          description: route.description,
          step: (route.steps || []).map((stepText, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: `Bước ${idx + 1}`,
            text: stepText,
            url: `${url}#step-${idx + 1}`,
          })),
        },
        FOUNDER_PERSON_LD,
        ORG_LD,
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumb`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ ELEC Science AI', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: route.label, item: url },
          ],
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: faqEntities,
        },
      ],
    },
    null,
    2
  );
}

function buildStaticRootHtml(route) {
  const relatedSet = new Set(route.relatedSlugs || []);
  const prioritized = [
    ...SEO_PILLAR_ROUTES.filter((r) => relatedSet.has(r.slug)),
    ...SEO_PILLAR_ROUTES.filter((r) => r.slug !== route.slug && !relatedSet.has(r.slug)).slice(0, 10),
  ];

  const otherLinks = prioritized
    .map(
      (r) =>
        `<li><a href="/${r.slug}" style="color:#2563eb;text-decoration:none;font-weight:600">${escapeHtml(r.label)}</a> — ${escapeHtml(r.description)}</li>`
    )
    .join('\n          ');

  const pseoLinks = PSEO_HUB_LINKS.map(
    (hub) =>
      `<li><a href="${hub.href}" style="color:#2563eb;text-decoration:none;font-weight:600">${escapeHtml(hub.label)}</a> — ${escapeHtml(hub.desc)}</li>`
  ).join('\n          ');

  const highlightsHtml = (route.highlights || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('\n          ');

  const stepsHtml = (route.steps || [])
    .map((stepText, idx) => `<li id="step-${idx + 1}"><strong>Bước ${idx + 1}:</strong> ${escapeHtml(stepText)}</li>`)
    .join('\n          ');

  const faqsHtml = (route.faqs || [])
    .map(
      (item, idx) => `<article style="margin-bottom:14px">
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">${idx + 1}. ${escapeHtml(item.q)}</h3>
            <p style="margin:0;color:#475569">${escapeHtml(item.a)}</p>
          </article>`
    )
    .join('\n          ');

  return `<div id="root">
      <header style="max-width:960px;margin:28px auto 16px;padding:0 20px;text-align:center">
        <nav aria-label="Breadcrumb" style="font-size:14px;color:#64748b;margin:0 0 8px">
          <a href="/" style="color:#2563eb;text-decoration:none">ELEC Science AI (ELEC AI)</a> · <span>${escapeHtml(route.label)}</span>
        </nav>
        <h1 style="font-size:28px;font-weight:800;color:#0f172a;line-height:1.3;margin-bottom:8px">
          ${escapeHtml(route.h1)}
        </h1>
        <p id="aeo-direct-answer" style="font-size:17px;color:#475569;max-width:800px;margin:0 auto">
          ${escapeHtml(route.intro)}
        </p>
      </header>
      <main style="max-width:960px;margin:0 auto;padding:0 20px;font:16px/1.7 system-ui,Arial,sans-serif;color:#1e293b">
        <section style="margin-bottom:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px">
          <h2 style="font-size:19px;font-weight:700;color:#0f172a;margin:0 0 10px">Thông Số Tóm Tắt (AEO / GEO Quick Specs)</h2>
          <dl id="geo-key-specs" style="margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px 18px;font-size:15px">
            <dt style="font-weight:700;color:#0f172a">Phân hệ công cụ:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.label)} (<a href="${SITE_ORIGIN}/${route.slug}" style="color:#2563eb">${SITE_ORIGIN}/${route.slug}</a>)</dd>
            <dt style="font-weight:700;color:#0f172a">Phạm vi &amp; Môn học:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs?.subject || '')}</dd>
            <dt style="font-weight:700;color:#0f172a">Phương pháp &amp; Công nghệ:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs?.method || '')}</dd>
            <dt style="font-weight:700;color:#0f172a">Đối tượng sử dụng:</dt>
            <dd style="margin:0 0 4px;color:#334155">${escapeHtml(route.specs?.audience || '')}</dd>
            <dt style="font-weight:700;color:#0f172a">Nhà sáng lập &amp; Phát triển:</dt>
            <dd style="margin:0 0 4px;color:#334155"><a href="/nha-sang-lap" style="color:#2563eb;font-weight:600">Nguyễn Thế Duy (Duy TK / Tk Media)</a></dd>
          </dl>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Tính năng nổi bật của ${escapeHtml(route.label)}</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${highlightsHtml}
          </ul>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Hướng dẫn sử dụng từng bước</h2>
          <ol style="padding-left:20px;line-height:1.8">
          ${stepsHtml}
          </ol>
        </section>
        <section id="route-faq" style="margin-bottom:24px">
          <h2 style="font-size:21px;font-weight:700;color:#0f172a;margin-bottom:10px">Câu hỏi thường gặp về ${escapeHtml(route.label)}</h2>
          ${faqsHtml}
          <article>
            <h3 style="font-size:17px;font-weight:600;color:#1e293b;margin-bottom:4px">${(route.faqs || []).length + 1}. Ai là nhà sáng lập ELEC AI (ELEC Science AI)?</h3>
            <p style="margin:0;color:#475569">
              Nhà sáng lập (Founder) và kỹ sư phát triển chính của ELEC Science AI là <strong>Nguyễn Thế Duy</strong> (Tk Media / Duy TK, sinh năm 2010 tại Thái Bình).
              Xem <a href="/nha-sang-lap" style="color:#2563eb">tiểu sử nhà sáng lập</a> hoặc kết nối qua
              <a href="https://www.facebook.com/nguyentheduytk" rel="me noopener noreferrer" style="color:#2563eb">Facebook chính thức</a>.
            </p>
          </article>
        </section>
        <section style="margin-bottom:24px">
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:10px">Kho dữ liệu học tập &amp; Phân hệ liên quan trên ELEC Science AI</h2>
          <ul style="padding-left:20px;line-height:1.8">
          ${pseoLinks}
          ${otherLinks}
            <li><a href="/gioi-thieu" style="color:#2563eb;text-decoration:none">Giới thiệu chi tiết ELEC Science AI</a> · <a href="/nha-sang-lap" style="color:#2563eb;text-decoration:none">Nhà sáng lập Nguyễn Thế Duy</a> · <a href="/chinh-sach-bao-mat" style="color:#2563eb;text-decoration:none">Chính sách bảo mật</a> · <a href="/dieu-khoan-su-dung" style="color:#2563eb;text-decoration:none">Điều khoản</a> · <a href="/llms.txt" style="color:#2563eb;text-decoration:none">LLMs.txt</a> · <a href="/llms-full.txt" style="color:#2563eb;text-decoration:none">LLMs-Full.txt</a></li>
          </ul>
        </section>
      </main>
    </div>`;
}

function renderRouteHtml(baseHtml, route) {
  const url = `${SITE_ORIGIN}/${route.slug}`;
  const escTitle = escapeHtml(route.title);
  const escDesc = escapeHtml(route.description);

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escTitle}</title>`);
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escDesc}" />`
  );
  if (route.keywords) {
    html = html.replace(
      /<meta\s+name="keywords"\s+content="[\s\S]*?"\s*\/>/,
      `<meta name="keywords" content="${escapeHtml(route.keywords)}" />`
    );
  }
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`
  );
  html = html.replaceAll(
    /<link rel="alternate" hreflang="(vi|x-default)" href="[^"]*" \/>/g,
    '<link rel="alternate" hreflang="$1" href="' + url + '" />'
  );
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escTitle}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escDesc}" />`);
  html = html.replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${url}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escTitle}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escDesc}" />`);

  const jsonLd = buildRouteJsonLd(route);
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${jsonLd}\n    </script>`
  );

  const staticRoot = buildStaticRootHtml(route);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<noscript>)/, `${staticRoot}\n    `);

  return html;
}

function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Missing built index.html at ${INDEX_PATH}`);
  }
  const baseHtml = fs.readFileSync(INDEX_PATH, 'utf8');
  let count = 0;
  for (const route of SEO_PILLAR_ROUTES) {
    const outPath = path.join(DIST_DIR, `${route.slug}.html`);
    const outHtml = renderRouteHtml(baseHtml, route);
    const ldMatch = outHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!ldMatch) throw new Error(`Missing JSON-LD for ${route.slug}`);
    JSON.parse(ldMatch[1]);
    if (
      !outHtml.includes(escapeHtml(route.h1)) ||
      !outHtml.includes(`<link rel="canonical" href="${SITE_ORIGIN}/${route.slug}" />`)
    ) {
      throw new Error(`Prerender verification failed for ${route.slug}`);
    }
    fs.writeFileSync(outPath, outHtml, 'utf8');
    count += 1;
  }
  console.log(`[prerender-seo-routes] Generated ${count} static Pillar/Tool SEO HTML files in dist/`);
}

main();
