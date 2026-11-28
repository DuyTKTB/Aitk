import { useEffect } from 'react';

const SITE_ORIGIN = 'https://www.elecai.id.vn';
const NOINDEX_PAGES = new Set(['404', 'admin', 'settings', 'feedback', 'login', 'register']);

export const ROUTE_SEO = {
  home: {
    title: 'ELEC Science AI (ELEC AI) — Nền Tảng Học Online, Gia Sư AI & Luyện Thi THPT 2026',
    description:
      'ELEC Science AI (elecai.id.vn) là nền tảng học trực tuyến & AI giáo dục miễn phí: Gia sư AI giải bài tập từ ảnh, Phòng thi ảo THPTQG & ĐGNL, LMS tạo đề – chấm phiếu OMR cho giáo viên và 50+ công cụ học tập.',
    keywords:
      'ELEC AI, ELEC Science AI, elecai.id.vn, học online, học trực tuyến miễn phí, nền tảng học trực tuyến, AI giáo dục, gia sư AI, giải bài tập bằng AI, luyện thi THPT Quốc gia, phần mềm tạo đề thi, LMS giáo dục',
    path: '/',
    label: 'Trang chủ',
  },
  'biology-lab': {
    title: 'Phòng Thí Nghiệm Sinh Học Ảo 3D (20 Lab) · ELEC Science AI',
    description:
      '20 mô phỏng Phòng Lab Sinh học 3D trực tuyến: Tế bào 3D, DNA 3D, Giải phẫu người 3D, Kính hiển vi ảo, Di truyền và Sinh thái học chuẩn GDPT 2018.',
    path: '/phong-thi-nghiem-sinh-hoc',
    label: 'Phòng Lab Sinh học 3D',
  },
  login: {
    title: 'Đăng Nhập Tài Khoản Học Sinh & Giáo Viên · ELEC AI',
    description: 'Đăng nhập để vào lớp học, làm bài thi, lưu tiến độ học tập và sử dụng Trợ lý AI giáo dục ELEC Science AI.',
    path: '/login',
    label: 'Đăng nhập',
  },
  register: {
    title: 'Tạo Tài Khoản Học Sinh & Giáo Viên Miễn Phí · ELEC AI',
    description: 'Đăng ký tài khoản ELEC Science AI miễn phí để bắt đầu học online và luyện thi thông minh cùng Gia sư AI và lớp học trực tuyến.',
    path: '/register',
    label: 'Đăng ký',
  },
};

let pillarSeoMapCache = null;
async function loadPillarSeoMap() {
  if (pillarSeoMapCache) return pillarSeoMapCache;
  const { SEO_PILLAR_ROUTES } = await import('../data/seoPillarRoutes.js');
  pillarSeoMapCache = Object.fromEntries(
    SEO_PILLAR_ROUTES.map((r) => [
      r.appPage,
      {
        title: r.title,
        description: r.description,
        keywords: r.keywords,
        path: `/${r.slug}`,
        label: r.label,
        faqs: r.faqs || [],
        faqQ: r.faqs?.[0]?.q,
        faqA: r.faqs?.[0]?.a,
      },
    ])
  );
  return pillarSeoMapCache;
}

function updateRouteJsonLd(meta, url, isNoindex) {
  const SCRIPT_ID = 'elec-route-ld';
  let scriptEl = document.getElementById(SCRIPT_ID);
  if (isNoindex || meta.path === '/') {
    if (scriptEl) scriptEl.remove();
    return;
  }
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = SCRIPT_ID;
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${url}#app` },
      mainEntity: { '@id': `${url}#app` },
      author: { '@id': `${SITE_ORIGIN}/#founder` },
      publisher: { '@id': `${SITE_ORIGIN}/#org` },
      inLanguage: 'vi-VN',
      dateModified: '2026-11-28',
    },
    {
      '@type': ['SoftwareApplication', 'WebApplication'],
      '@id': `${url}#app`,
      name: `${meta.label || meta.title} — ELEC Science AI`,
      url,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, Android, iOS, Windows, macOS',
      inLanguage: 'vi-VN',
      isAccessibleForFree: true,
      description: meta.description,
      author: { '@id': `${SITE_ORIGIN}/#founder` },
      publisher: { '@id': `${SITE_ORIGIN}/#org` },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Trang chủ ELEC Science AI', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: meta.label || meta.title, item: url },
      ],
    },
  ];

  const faqList = Array.isArray(meta.faqs) && meta.faqs.length > 0
    ? meta.faqs
    : meta.faqQ && meta.faqA
      ? [{ q: meta.faqQ, a: meta.faqA }]
      : [];

  if (faqList.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: [
        ...faqList.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
        {
          '@type': 'Question',
          name: 'Ai là nhà sáng lập ELEC AI (ELEC Science AI)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nhà sáng lập (Founder) và kỹ sư phát triển chính của ELEC Science AI (ELEC AI) là Nguyễn Thế Duy (biệt danh Tk Media / Duy TK, sinh năm 2010 tại Thái Bình). Facebook chính thức: https://www.facebook.com/nguyentheduytk — Tiểu sử: https://www.elecai.id.vn/nha-sang-lap.',
          },
        },
      ],
    });
  }
  scriptEl.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}

function applySeoMeta(meta, isNoindex) {
  const url = `${SITE_ORIGIN}${meta.path}`;
  document.title = meta.title;

  let descEl = document.querySelector('meta[name="description"]');
  if (!descEl) {
    descEl = document.createElement('meta');
    descEl.name = 'description';
    document.head.appendChild(descEl);
  }
  descEl.content = meta.description;

  if (meta.keywords) {
    let kwEl = document.querySelector('meta[name="keywords"]');
    if (!kwEl) {
      kwEl = document.createElement('meta');
      kwEl.name = 'keywords';
      document.head.appendChild(kwEl);
    }
    kwEl.content = meta.keywords;
  }

  let robotsEl = document.querySelector('meta[name="robots"]');
  if (!robotsEl) {
    robotsEl = document.createElement('meta');
    robotsEl.name = 'robots';
    document.head.appendChild(robotsEl);
  }
  const robotsContent = isNoindex
    ? 'noindex,nofollow'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
  robotsEl.content = robotsContent;
  ['googlebot', 'bingbot'].forEach((botName) => {
    const botEl = document.querySelector(`meta[name="${botName}"]`);
    if (botEl) botEl.content = robotsContent;
  });

  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = url;

  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
    el.href = url;
  });

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = meta.title;

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = meta.description;

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = url;

  const twUrl = document.querySelector('meta[name="twitter:url"]');
  if (twUrl) twUrl.content = url;

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.content = meta.title;

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.content = meta.description;

  updateRouteJsonLd(meta, url, isNoindex);
}

export function useSeoHead(page) {
  useEffect(() => {
    const isNoindex = NOINDEX_PAGES.has(page);
    if (page === 'home' || page === 'login' || page === 'register' || isNoindex) {
      applySeoMeta(ROUTE_SEO[page] || ROUTE_SEO.home, isNoindex);
      return undefined;
    }

    let alive = true;
    loadPillarSeoMap()
      .then((map) => {
        if (!alive) return;
        applySeoMeta(map[page] || ROUTE_SEO[page] || ROUTE_SEO.home, isNoindex);
      })
      .catch(() => {
        if (!alive) return;
        applySeoMeta(ROUTE_SEO[page] || ROUTE_SEO.home, isNoindex);
      });
    return () => { alive = false; };
  }, [page]);
}
