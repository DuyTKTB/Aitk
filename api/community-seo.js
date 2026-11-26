/**
 * api/community-seo.js — SSR Public SEO / AEO / GEO Renderer cho Cộng đồng ELEC
 * -----------------------------------------------------------------------------
 * Phục vụ các đường dẫn công khai không cần đăng nhập để Google, Bing và AI Search
 * (ChatGPT, Perplexity, Gemini) lập chỉ mục bài thảo luận & hỏi đáp KHTN:
 *   - /cong-dong                  (mode=hub)
 *   - /cong-dong/:slug            (mode=post&slug=...)
 *   - /chu-de/:tag                (mode=topic&tag=...)
 *
 * Tính năng SEO/AEO/GEO chuẩn MXH lớn:
 *   1. Đọc trực tiếp collection công khai `communityPosts` qua Firestore REST API
 *   2. Quality Gate tự động: `index, follow` cho bài chất lượng (>= 60 ký tự hoặc Q&A có lời giải),
 *      `noindex, follow` cho cap ngắn để bảo vệ crawl budget
 *   3. Schema.org JSON-LD: `QAPage` (bài Hỏi bài KHTN), `DiscussionForumPosting` (thảo luận),
 *      `CollectionPage` + `ItemList` + `BreadcrumbList`
 *   4. Edge Cache Vercel CDN (`s-maxage=300, stale-while-revalidate=3600`)
 */

const SITE_ORIGIN = 'https://www.elecai.id.vn';
const PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'duyheheh-2a269';

const CATEGORY_META = {
  discussion: { label: 'Thảo luận', color: '#0071e3' },
  question: { label: 'Hỏi bài KHTN', color: '#059669' },
  tip: { label: 'Mẹo học hay', color: '#d97706' },
  study_invite: { label: 'Học chung', color: '#7c3aed' },
};

const CORE_TOPICS = [
  { slug: 'hoahoc12', tag: '#HoaHoc12', title: 'Hóa học 12 & Luyện đề THPTQG' },
  { slug: 'vatli12', tag: '#VatLi12', title: 'Vật lí 12 — Dao động, Sóng, Điện xoay chiều' },
  { slug: 'sinhhoc12', tag: '#SinhHoc12', title: 'Sinh học 12 — Di truyền & Tiến hóa' },
  { slug: 'thptqg2026', tag: '#THPTQG2026', title: 'Ôn thi THPT Quốc Gia & Đánh giá năng lực' },
  { slug: 'estelipit', tag: '#EsteLipit', title: 'Chuyên đề Este – Lipit Hóa học' },
  { slug: 'hoccungelec', tag: '#HocCungELEC', title: 'Phòng Học chung Pomodoro ELEC AI' },
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function normalizeTagSlug(raw) {
  return String(raw || '')
    .replace(/^#/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function decodeFsValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return new Date(val.timestampValue).getTime();
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(decodeFsValue);
  }
  if ('mapValue' in val) {
    const out = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = decodeFsValue(v);
    }
    return out;
  }
  return null;
}

function decodeFsDoc(doc) {
  const fields = doc?.fields || {};
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = decodeFsValue(v);
  }
  const nameParts = String(doc?.name || '').split('/');
  obj.id = obj.id || nameParts[nameParts.length - 1] || '';
  return obj;
}

async function fetchPublishedPosts() {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    PROJECT_ID
  )}/databases/(default)/documents/communityPosts?pageSize=120`;
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return [];
    const data = await resp.json();
    const docs = Array.isArray(data?.documents) ? data.documents : [];
    return docs
      .map(decodeFsDoc)
      .filter((p) => p && p.status === 'published' && !p.hiddenByAdmin && String(p.text || '').trim().length > 0);
  } catch {
    return [];
  }
}

function computeTrendingScore(post, nowMs = Date.now()) {
  const createdAt = Number(post.createdAt) || nowMs;
  const ageHours = Math.max(0, (nowMs - createdAt) / 3600000);
  const reactions = Number(post.reactionCount) || 0;
  const replies = Number(post.replyCount) || 0;
  const saves = Number(post.saveCount) || 0;
  const reposts = Number(post.repostCount) || 0;
  const coldBoost = ageHours < 6 ? 12 * Math.exp(-ageHours / 3) : 0;
  const catBoost = post.category === 'question' ? 1.15 : post.category === 'tip' ? 1.1 : 1;
  const adminBoost = post.featuredByAdmin ? 45 : 0;
  const raw = 1 + reactions * 1 + replies * 3.5 + saves * 5 + reposts * 4 + coldBoost;
  return (raw * catBoost) / Math.pow(ageHours + 2, 1.5) + adminBoost;
}

function sortPostsTrending(posts) {
  const now = Date.now();
  return [...posts].sort((a, b) => {
    if (Boolean(a.pinnedGlobal) !== Boolean(b.pinnedGlobal)) return a.pinnedGlobal ? -1 : 1;
    return computeTrendingScore(b, now) - computeTrendingScore(a, now);
  });
}

function fmtDateVi(ts) {
  try {
    return new Date(Number(ts) || Date.now()).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '2026';
  }
}

function isoDate(ts) {
  try {
    return new Date(Number(ts) || Date.now()).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function renderShell({
  title,
  description,
  canonicalUrl,
  robots = 'index, follow',
  jsonLdList = [],
  bodyHtml,
}) {
  const scripts = jsonLdList
    .map((schema) => `<script type="application/ld+json">${safeJsonLd(schema)}</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="${escapeHtml(robots)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ELEC Science AI" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${SITE_ORIGIN}/img/elec/elec-cool.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  ${scripts}
  <style>
    :root {
      --bg: #f6f8fc;
      --card: #ffffff;
      --ink: #0f172a;
      --ink-2: #475569;
      --ink-3: #64748b;
      --blue: #0071e3;
      --blue-soft: rgba(0, 113, 227, 0.1);
      --border: rgba(15, 23, 42, 0.09);
      --radius: 20px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0d12;
        --card: #13161e;
        --ink: #f1f5f9;
        --ink-2: #94a3b8;
        --ink-3: #64748b;
        --blue: #3b82f6;
        --blue-soft: rgba(59, 130, 246, 0.18);
        --border: rgba(255, 255, 255, 0.1);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Be Vietnam Pro', 'Inter', sans-serif;
      background: var(--bg);
      color: var(--ink);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .nav {
      position: sticky; top: 0; z-index: 20;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--border);
    }
    @media (prefers-color-scheme: dark) {
      .nav { background: rgba(19, 22, 30, 0.86); }
    }
    .nav-in {
      max-width: 1040px; margin: 0 auto; padding: 12px 20px;
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
    }
    .brand {
      display: inline-flex; align-items: center; gap: 10px;
      color: var(--ink); font-weight: 800; font-size: 16px; letter-spacing: -0.02em;
    }
    .brand img { width: 32px; height: 32px; object-fit: contain; }
    .brand em { font-style: normal; color: var(--blue); }
    .nav-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 999px;
      background: var(--blue); color: #fff; font-weight: 700; font-size: 13.5px;
    }
    .nav-cta:hover { text-decoration: none; opacity: 0.92; }
    .wrap { max-width: 1040px; margin: 0 auto; padding: 28px 20px 64px; }
    .crumb { font-size: 13px; color: var(--ink-3); margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 6px; }
    .hero {
      background: linear-gradient(135deg, #0058cc 0%, #0071e3 55%, #38bdf8 100%);
      color: #fff; border-radius: 24px; padding: 28px 28px;
      display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .hero h1 { margin: 0 0 8px; font-size: clamp(22px, 3vw, 30px); line-height: 1.25; }
    .hero p { margin: 0; max-width: 640px; opacity: 0.92; font-size: 15px; }
    .hero-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 20px; border-radius: 999px; background: #fff; color: #0058cc;
      font-weight: 800; font-size: 14px; white-space: nowrap;
    }
    .hero-btn:hover { text-decoration: none; transform: translateY(-1px); }
    .topics { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
    .topic-pill {
      padding: 6px 13px; border-radius: 999px; background: var(--card);
      border: 1px solid var(--border); color: var(--ink); font-size: 13px; font-weight: 700;
    }
    .topic-pill.is-active, .topic-pill:hover {
      background: var(--blue); color: #fff; border-color: transparent; text-decoration: none;
    }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 22px; align-items: start; }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 20px 22px; margin-bottom: 14px;
    }
    .meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--ink-3); margin-bottom: 8px; }
    .author { color: var(--ink); font-weight: 750; }
    .badge {
      display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px;
      font-size: 11.5px; font-weight: 750; background: var(--blue-soft); color: var(--blue);
    }
    .badge.is-hot { background: rgba(249, 115, 22, 0.14); color: #ea580c; }
    .badge.is-best { background: #059669; color: #fff; }
    .post-title { margin: 4px 0 8px; font-size: 19px; line-height: 1.38; color: var(--ink); }
    .post-title a { color: inherit; }
    .post-body { margin: 0; font-size: 15.5px; white-space: pre-wrap; word-break: break-word; color: var(--ink); }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .tag { font-size: 12.5px; font-weight: 700; color: var(--blue); background: var(--blue-soft); padding: 2px 9px; border-radius: 999px; }
    .stats { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 13px; color: var(--ink-3); display: flex; gap: 14px; flex-wrap: wrap; }
    .reply-card {
      padding: 14px 16px; border-radius: 14px; border: 1px solid var(--border);
      background: var(--bg); margin-top: 10px;
    }
    .reply-card.is-best { border-color: rgba(5, 150, 105, 0.45); background: rgba(16, 185, 129, 0.08); }
    .side-box {
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 18px 18px; margin-bottom: 14px;
    }
    .side-box h3 { margin: 0 0 10px; font-size: 15px; }
    .side-links { display: flex; flex-direction: column; gap: 8px; font-size: 13.5px; font-weight: 600; }
    .footer {
      margin-top: 42px; padding-top: 20px; border-top: 1px solid var(--border);
      text-align: center; font-size: 13px; color: var(--ink-3);
    }
  </style>
</head>
<body>
  <header class="nav">
    <div class="nav-in">
      <a class="brand" href="${SITE_ORIGIN}/cong-dong">
        <img src="/img/elec/elec-cool.png" alt="ELEC Science AI" />
        <span>Cộng đồng <em>ELEC</em></span>
      </a>
      <a class="nav-cta" href="${SITE_ORIGIN}/#home">Mở ứng dụng ELEC AI →</a>
    </div>
  </header>
  <main class="wrap">
    ${bodyHtml}
    <footer class="footer">
      © 2026 ELEC Science AI · Cộng đồng hỏi đáp Khoa học Tự nhiên (Lý – Hóa – Sinh – THPTQG) chính chủ tại <a href="${SITE_ORIGIN}/">elecai.id.vn</a>
    </footer>
  </main>
</body>
</html>`;
}

function renderSidebarHtml() {
  return `
  <aside>
    <div class="side-box">
      <h3>Học cùng Trợ lý ELEC AI</h3>
      <p style="margin:0 0 12px;font-size:13.5px;color:var(--ink-2)">Giải bài Lý – Hóa – Sinh từng bước, luyện Phòng thi ảo GDPT 2025 và bật bàn Học chung Pomodoro trực tiếp.</p>
      <a class="nav-cta" style="width:100%;justify-content:center" href="${SITE_ORIGIN}/#home">Vào Cộng đồng ELEC →</a>
    </div>
    <div class="side-box">
      <h3>Công cụ KHTN nổi bật</h3>
      <div class="side-links">
        <a href="${SITE_ORIGIN}/tro-ly-ai-giai-hoa">Trợ lý AI giải Hóa – Lý – Sinh</a>
        <a href="${SITE_ORIGIN}/phong-thi-ao">Phòng thi ảo THPTQG 2026</a>
        <a href="${SITE_ORIGIN}/can-bang-phuong-trinh-hoa-hoc">Cân bằng phương trình hóa học</a>
        <a href="${SITE_ORIGIN}/bang-tuan-hoan">Bảng tuần hoàn nguyên tố 3D</a>
        <a href="${SITE_ORIGIN}/lo-trinh-on-thi-thpt-quoc-gia">Lộ trình ôn thi THPT Quốc Gia</a>
      </div>
    </div>
  </aside>`;
}

function renderPostSummaryCard(post) {
  const cat = CATEGORY_META[post.category] || CATEGORY_META.discussion;
  const slug = post.slug || post.id;
  const titleText = String(post.title || post.text || '').slice(0, 110);
  const tags = Array.isArray(post.hashtags) ? post.hashtags : [];
  return `
  <article class="card">
    <div class="meta">
      <span class="author">${escapeHtml(post.authorName || 'Thành viên ELEC')}</span>
      <span>·</span>
      <time datetime="${isoDate(post.createdAt)}">${fmtDateVi(post.createdAt)}</time>
      <span class="badge" style="background:${cat.color}18;color:${cat.color}">${escapeHtml(cat.label)}</span>
      ${post.featuredByAdmin ? '<span class="badge is-hot">Xu hướng nổi bật</span>' : ''}
      ${post.bestReplyId ? '<span class="badge is-best">Đã có lời giải chuẩn</span>' : ''}
    </div>
    <h2 class="post-title">
      <a href="${SITE_ORIGIN}/cong-dong/${encodeURIComponent(slug)}">${escapeHtml(titleText)}</a>
    </h2>
    <p class="post-body">${escapeHtml(String(post.text || '').slice(0, 320))}${String(post.text || '').length > 320 ? '…' : ''}</p>
    ${
      tags.length > 0
        ? `<div class="tags">${tags
            .slice(0, 5)
            .map((t) => `<a class="tag" href="${SITE_ORIGIN}/chu-de/${encodeURIComponent(normalizeTagSlug(t))}">${escapeHtml(t)}</a>`)
            .join('')}</div>`
        : ''
    }
    <div class="stats">
      <span>${Number(post.reactionCount) || 0} lượt thích</span>
      <span>${Number(post.replyCount) || 0} câu trả lời</span>
      <span>${Number(post.saveCount) || 0} lượt lưu</span>
      <a href="${SITE_ORIGIN}/cong-dong/${encodeURIComponent(slug)}" style="margin-left:auto;font-weight:700">Xem thảo luận →</a>
    </div>
  </article>`;
}

export default async function handler(req, res) {
  const mode = String(req.query?.mode || 'hub').toLowerCase();
  const slugParam = String(req.query?.slug || '').trim();
  const tagParam = String(req.query?.tag || '').trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');

  const allPosts = sortPostsTrending(await fetchPublishedPosts());

  /* ── 1. TRANG CHI TIẾT BÀI VIẾT (/cong-dong/:slug) ── */
  if (mode === 'post' && slugParam) {
    const post = allPosts.find(
      (p) => p.slug === slugParam || p.id === slugParam || slugParam.endsWith(`-${p.id}`)
    );

    if (!post) {
      res.status(404).send(
        renderShell({
          title: 'Không tìm thấy bài viết | Cộng đồng ELEC Science AI',
          description: 'Bài viết đã bị xóa hoặc không tồn tại trên Cộng đồng ELEC Science AI.',
          canonicalUrl: `${SITE_ORIGIN}/cong-dong`,
          robots: 'noindex, follow',
          bodyHtml: `
            <div class="card" style="text-align:center;padding:42px 24px">
              <h1>Bài viết không tồn tại hoặc đã bị gỡ</h1>
              <p style="color:var(--ink-2)">Khám phá các câu hỏi KHTN và bài thảo luận đang lên xu hướng trên Cộng đồng ELEC.</p>
              <a class="nav-cta" href="${SITE_ORIGIN}/cong-dong">Quay lại Cộng đồng ELEC</a>
            </div>`,
        })
      );
      return;
    }

    const cat = CATEGORY_META[post.category] || CATEGORY_META.discussion;
    const canonicalUrl = `${SITE_ORIGIN}/cong-dong/${encodeURIComponent(post.slug || post.id)}`;
    const cleanTitle = `${String(post.title || post.text || '').slice(0, 72)} | Cộng đồng ELEC AI`;
    const cleanDesc = String(post.text || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    const replies = Array.isArray(post.topReplies) ? post.topReplies : [];
    const bestReply = replies.find((r) => post.bestReplyId && r.id === post.bestReplyId) || null;
    const isIndexable = Boolean(
      post.indexable ||
        post.featuredByAdmin ||
        String(post.text || '').trim().length >= 60 ||
        (post.category === 'question' && replies.length >= 1)
    );

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ELEC Science AI', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Cộng đồng ELEC', item: `${SITE_ORIGIN}/cong-dong` },
        { '@type': 'ListItem', position: 3, name: String(post.title || '').slice(0, 60), item: canonicalUrl },
      ],
    };

    const mainSchema =
      post.category === 'question' && (replies.length > 0 || bestReply)
        ? {
            '@context': 'https://schema.org',
            '@type': 'QAPage',
            mainEntity: {
              '@type': 'Question',
              name: String(post.title || post.text || '').slice(0, 110),
              text: post.text,
              datePublished: isoDate(post.createdAt),
              answerCount: Number(post.replyCount) || replies.length,
              upvoteCount: Number(post.reactionCount) || 0,
              author: { '@type': 'Person', name: post.authorName || 'Thành viên ELEC' },
              ...(bestReply
                ? {
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: bestReply.text,
                      datePublished: isoDate(bestReply.createdAt),
                      upvoteCount: 1,
                      url: `${canonicalUrl}#answer-${bestReply.id}`,
                      author: { '@type': 'Person', name: bestReply.authorName || 'Thành viên ELEC' },
                    },
                  }
                : {}),
              suggestedAnswer: replies
                .filter((r) => !bestReply || r.id !== bestReply.id)
                .map((r) => ({
                  '@type': 'Answer',
                  text: r.text,
                  datePublished: isoDate(r.createdAt),
                  url: `${canonicalUrl}#answer-${r.id}`,
                  author: { '@type': 'Person', name: r.authorName || 'Thành viên ELEC' },
                })),
            },
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: String(post.title || post.text || '').slice(0, 110),
            text: post.text,
            url: canonicalUrl,
            datePublished: isoDate(post.createdAt),
            dateModified: isoDate(post.updatedAt || post.createdAt),
            author: { '@type': 'Person', name: post.authorName || 'Thành viên ELEC' },
            interactionStatistic: [
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/LikeAction',
                userInteractionCount: Number(post.reactionCount) || 0,
              },
              {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/CommentAction',
                userInteractionCount: Number(post.replyCount) || replies.length,
              },
            ],
            comment: replies.map((r) => ({
              '@type': 'Comment',
              text: r.text,
              datePublished: isoDate(r.createdAt),
              author: { '@type': 'Person', name: r.authorName || 'Thành viên ELEC' },
            })),
          };

    const related = allPosts.filter((p) => p.id !== post.id).slice(0, 4);
    const tags = Array.isArray(post.hashtags) ? post.hashtags : [];

    const bodyHtml = `
      <nav class="crumb" aria-label="Breadcrumb">
        <a href="${SITE_ORIGIN}/">Trang chủ</a>
        <span>/</span>
        <a href="${SITE_ORIGIN}/cong-dong">Cộng đồng ELEC</a>
        <span>/</span>
        <span>${escapeHtml(cat.label)}</span>
      </nav>
      <div class="grid">
        <div>
          <article class="card">
            <div class="meta">
              <span class="author">${escapeHtml(post.authorName || 'Thành viên ELEC')}</span>
              <span>·</span>
              <time datetime="${isoDate(post.createdAt)}">${fmtDateVi(post.createdAt)}</time>
              <span class="badge" style="background:${cat.color}18;color:${cat.color}">${escapeHtml(cat.label)}</span>
              ${post.featuredByAdmin ? '<span class="badge is-hot">Xu hướng nổi bật</span>' : ''}
            </div>
            <h1 style="margin:6px 0 12px;font-size:24px;line-height:1.34">${escapeHtml(post.title || post.text.slice(0, 90))}</h1>
            <div class="post-body">${escapeHtml(post.text)}</div>
            ${
              tags.length > 0
                ? `<div class="tags">${tags
                    .map((t) => `<a class="tag" href="${SITE_ORIGIN}/chu-de/${encodeURIComponent(normalizeTagSlug(t))}">${escapeHtml(t)}</a>`)
                    .join('')}</div>`
                : ''
            }
            <div class="stats">
              <span>${Number(post.reactionCount) || 0} lượt thích</span>
              <span>${Number(post.replyCount) || replies.length} câu trả lời</span>
              <span>${Number(post.saveCount) || 0} lượt lưu</span>
            </div>
          </article>

          <section class="card">
            <h2 style="margin:0 0 10px;font-size:17px">Thảo luận &amp; Lời giải (${replies.length})</h2>
            ${
              replies.length === 0
                ? `<p style="color:var(--ink-2);margin:0 0 12px">Chưa có câu trả lời nào. Hãy vào ứng dụng ELEC AI để giải đáp hoặc nhờ Trợ lý AI hỗ trợ ngay!</p>`
                : replies
                    .map((r) => {
                      const isBest = post.bestReplyId && r.id === post.bestReplyId;
                      return `
                      <div id="answer-${escapeHtml(r.id)}" class="reply-card ${isBest ? 'is-best' : ''}">
                        <div class="meta" style="margin-bottom:4px">
                          <span class="author">${escapeHtml(r.authorName || 'Thành viên ELEC')}</span>
                          <span>·</span>
                          <time datetime="${isoDate(r.createdAt)}">${fmtDateVi(r.createdAt)}</time>
                          ${isBest ? '<span class="badge is-best">Lời giải chuẩn ✓</span>' : ''}
                        </div>
                        <p class="post-body" style="font-size:14.5px">${escapeHtml(r.text)}</p>
                      </div>`;
                    })
                    .join('')
            }
            <div style="margin-top:16px">
              <a class="nav-cta" href="${SITE_ORIGIN}/#home">Trả lời bài viết này trên ELEC AI →</a>
            </div>
          </section>

          ${
            related.length > 0
              ? `<section><h2 style="font-size:17px;margin:24px 0 12px">Bài viết nổi bật khác</h2>${related
                  .map(renderPostSummaryCard)
                  .join('')}</section>`
              : ''
          }
        </div>
        ${renderSidebarHtml()}
      </div>`;

    res.status(200).send(
      renderShell({
        title: cleanTitle,
        description: cleanDesc,
        canonicalUrl,
        robots: isIndexable ? 'index, follow' : 'noindex, follow',
        jsonLdList: [breadcrumbSchema, mainSchema],
        bodyHtml,
      })
    );
    return;
  }

  /* ── 2. TRANG CHỦ ĐỀ / HASHTAG (/chu-de/:tag) ── */
  if (mode === 'topic' && tagParam) {
    const norm = normalizeTagSlug(tagParam);
    const topicMeta = CORE_TOPICS.find((t) => t.slug === norm);
    const matched = allPosts.filter((p) => {
      const tags = Array.isArray(p.hashtags) ? p.hashtags : [];
      return (
        tags.some((t) => normalizeTagSlug(t) === norm) ||
        normalizeTagSlug(p.text || '').includes(norm)
      );
    });
    const displayTag = topicMeta?.tag || `#${tagParam}`;
    const heading = topicMeta?.title || `Chủ đề ${displayTag} trên Cộng đồng ELEC`;
    const canonicalUrl = `${SITE_ORIGIN}/chu-de/${encodeURIComponent(norm || tagParam)}`;
    const hasEnough = matched.length > 0 || Boolean(topicMeta);

    const collectionSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      url: canonicalUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: matched.length,
        itemListElement: matched.slice(0, 20).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${SITE_ORIGIN}/cong-dong/${encodeURIComponent(p.slug || p.id)}`,
          name: String(p.title || p.text || '').slice(0, 90),
        })),
      },
    };

    const bodyHtml = `
      <nav class="crumb" aria-label="Breadcrumb">
        <a href="${SITE_ORIGIN}/">Trang chủ</a>
        <span>/</span>
        <a href="${SITE_ORIGIN}/cong-dong">Cộng đồng ELEC</a>
        <span>/</span>
        <span>${escapeHtml(displayTag)}</span>
      </nav>
      <section class="hero">
        <div>
          <h1>${escapeHtml(heading)}</h1>
          <p>Tổng hợp câu hỏi, mẹo giải nhanh và thảo luận nổi bật thuộc chủ đề ${escapeHtml(displayTag)} trên Cộng đồng ELEC Science AI.</p>
        </div>
        <a class="hero-btn" href="${SITE_ORIGIN}/#home">Đăng bài với ${escapeHtml(displayTag)} →</a>
      </section>
      <div class="topics">
        <a class="topic-pill" href="${SITE_ORIGIN}/cong-dong">Tất cả xu hướng</a>
        ${CORE_TOPICS.map(
          (t) =>
            `<a class="topic-pill ${t.slug === norm ? 'is-active' : ''}" href="${SITE_ORIGIN}/chu-de/${t.slug}">${escapeHtml(t.tag)}</a>`
        ).join('')}
      </div>
      <div class="grid">
        <div>
          ${
            matched.length === 0
              ? `<div class="card"><p style="margin:0;color:var(--ink-2)">Chưa có bài viết công khai nào gắn thẻ ${escapeHtml(displayTag)}. Hãy là người đầu tiên chia sẻ kiến thức trên ELEC AI!</p></div>`
              : matched.slice(0, 30).map(renderPostSummaryCard).join('')
          }
        </div>
        ${renderSidebarHtml()}
      </div>`;

    res.status(200).send(
      renderShell({
        title: `${heading} | Cộng đồng ELEC Science AI`,
        description: `Thảo luận, hỏi bài và mẹo học hay về ${displayTag} cùng cộng đồng học sinh & Trợ lý ELEC Science AI.`,
        canonicalUrl,
        robots: hasEnough ? 'index, follow' : 'noindex, follow',
        jsonLdList: [collectionSchema],
        bodyHtml,
      })
    );
    return;
  }

  /* ── 3. TRANG CHỦ CỘNG ĐỒNG ELEC (/cong-dong) ── */
  const canonicalUrl = `${SITE_ORIGIN}/cong-dong`;
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Cộng đồng ELEC Science AI — Hỏi đáp Lý, Hóa, Sinh & Ôn thi THPTQG',
    url: canonicalUrl,
    description:
      'Mạng xã hội học tập Khoa học Tự nhiên: hỏi bài Lý Hóa Sinh, chia sẻ mẹo học hay, rủ học chung Pomodoro và trao đổi kiến thức ôn thi THPTQG.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: Math.min(allPosts.length, 30),
      itemListElement: allPosts.slice(0, 30).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${SITE_ORIGIN}/cong-dong/${encodeURIComponent(p.slug || p.id)}`,
        name: String(p.title || p.text || '').slice(0, 90),
      })),
    },
  };

  const bodyHtml = `
    <section class="hero">
      <div>
        <h1>Cộng đồng ELEC Science AI</h1>
        <p>Không gian hỏi đáp Lý – Hóa – Sinh, chia sẻ bí kíp ôn thi THPTQG GDPT 2025 và kết nối phòng Học chung Pomodoro trực tiếp cùng bạn học toàn quốc.</p>
      </div>
      <a class="hero-btn" href="${SITE_ORIGIN}/#home">Tham gia thảo luận ngay →</a>
    </section>
    <div class="topics">
      <a class="topic-pill is-active" href="${SITE_ORIGIN}/cong-dong">Xu hướng nổi bật</a>
      ${CORE_TOPICS.map(
        (t) => `<a class="topic-pill" href="${SITE_ORIGIN}/chu-de/${t.slug}">${escapeHtml(t.tag)}</a>`
      ).join('')}
    </div>
    <div class="grid">
      <div>
        ${
          allPosts.length === 0
            ? `<div class="card"><h2>Cộng đồng ELEC đang sẵn sàng đón bài viết mới</h2><p style="color:var(--ink-2)">Đăng nhập vào ELEC Science AI để đặt câu hỏi KHTN, chia sẻ mẹo học hay và bật bàn học chung cùng bạn bè.</p><a class="nav-cta" href="${SITE_ORIGIN}/#home">Mở Cộng đồng ELEC →</a></div>`
            : allPosts.slice(0, 30).map(renderPostSummaryCard).join('')
        }
      </div>
      ${renderSidebarHtml()}
    </div>`;

  res.status(200).send(
    renderShell({
      title: 'Cộng đồng ELEC Science AI — Hỏi đáp Lý, Hóa, Sinh & Học chung THPTQG',
      description:
        'Khám phá bài thảo luận, hỏi đáp KHTN có lời giải chuẩn, mẹo ôn thi THPTQG và phòng học chung Pomodoro trên Cộng đồng ELEC Science AI.',
      canonicalUrl,
      robots: 'index, follow',
      jsonLdList: [collectionSchema],
      bodyHtml,
    })
  );
}
