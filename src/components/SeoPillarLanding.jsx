import { SEO_ROUTE_BY_SLUG, PSEO_HUB_LINKS } from '../data/seoPillarRoutes.js';

/**
 * SeoRouteFooterContent
 * ------------------------------------------------------------------
 * Render bên dưới các trang công cụ công khai (/bang-tuan-hoan,
 * /phong-thi-ao, /can-bang-phuong-trinh-hoa-hoc...) để ĐẢM BẢO
 * Rendered DOM sau khi React hydrate vẫn chứa đầy đủ H2, Quick Specs,
 * Hướng dẫn, FAQ và Internal Links khớp 100% với HTML prerender
 * (chống lệch nội dung SPA / thin content khi Googlebot render JS).
 */
export function SeoRouteFooterContent({ route }) {
  if (!route) return null;
  const related = (route.relatedSlugs || [])
    .map((s) => SEO_ROUTE_BY_SLUG[s])
    .filter(Boolean);

  return (
    <section
      aria-label={`Thông tin chi tiết về ${route.label}`}
      style={{
        maxWidth: 1040,
        margin: '32px auto 12px',
        padding: '0 20px',
        color: 'var(--ink, #0f172a)',
      }}
    >
      <div
        style={{
          background: 'var(--panel, rgba(255,255,255,0.78))',
          border: '1px solid var(--line, rgba(15,23,42,0.1))',
          borderRadius: 20,
          padding: '24px 24px',
          display: 'grid',
          gap: 20,
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.35 }}>
            {route.h1}
          </h2>
          <p id="aeo-direct-answer" style={{ margin: 0, opacity: 0.85, lineHeight: 1.7, fontSize: '0.96rem' }}>
            {route.intro}
          </p>
        </div>

        {route.specs && (
          <dl
            id="geo-key-specs"
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px 18px',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'var(--bg-soft, rgba(37,99,235,0.06))',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.72, fontSize: '0.82rem' }}>Phạm vi &amp; Môn học</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 600 }}>{route.specs.subject}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.72, fontSize: '0.82rem' }}>Phương pháp &amp; Công nghệ</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 600 }}>{route.specs.method}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.72, fontSize: '0.82rem' }}>Đối tượng sử dụng</dt>
              <dd style={{ margin: '2px 0 0', fontWeight: 600 }}>{route.specs.audience}</dd>
            </div>
          </dl>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {Array.isArray(route.highlights) && route.highlights.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>
                Điểm nổi bật của {route.label}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.88, fontSize: '0.93rem' }}>
                {route.highlights.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(route.steps) && route.steps.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>
                Hướng dẫn sử dụng từng bước
              </h3>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.88, fontSize: '0.93rem' }}>
                {route.steps.map((step, idx) => (
                  <li key={idx} id={`step-${idx + 1}`} style={{ marginBottom: 4 }}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {Array.isArray(route.faqs) && route.faqs.length > 0 && (
          <div id="route-faq">
            <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 700 }}>
              Câu hỏi thường gặp về {route.label}
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {route.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  open={idx === 0}
                  style={{
                    border: '1px solid var(--line, rgba(15,23,42,0.1))',
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.94rem' }}>
                    {faq.q}
                  </summary>
                  <p style={{ margin: '8px 0 0', opacity: 0.85, lineHeight: 1.65, fontSize: '0.92rem' }}>
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}

        {(related.length > 0 || PSEO_HUB_LINKS.length > 0) && (
          <div style={{ borderTop: '1px solid var(--line, rgba(15,23,42,0.1))', paddingTop: 14 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 700 }}>
              Khám phá thêm trên ELEC Science AI
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={`/${r.slug}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    background: 'var(--bg-soft, rgba(37,99,235,0.08))',
                    color: 'var(--pri, #2563eb)',
                    textDecoration: 'none',
                  }}
                >
                  {r.label}
                </a>
              ))}
              {PSEO_HUB_LINKS.map((hub) => (
                <a
                  key={hub.href}
                  href={hub.href}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    border: '1px solid var(--line, rgba(15,23,42,0.14))',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {hub.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * SeoPillarLanding
 * ------------------------------------------------------------------
 * Trang đích Pillar chuẩn SEO/AEO/GEO cho các nhóm từ khóa cạnh tranh cao
 * (/hoc-online-mien-phi, /ai-giao-duc, /gia-su-ai, /giai-bai-tap-bang-ai,
 *  /luyen-thi-thpt-quoc-gia, /cho-giao-vien, /phan-mem-tao-de-thi,
 *  /cham-bai-trac-nghiem-tu-dong, /hoc-tap-lop-10/11/12, /hoc-hoa-hoc-online...).
 */
export default function SeoPillarLanding({ route }) {
  if (!route) return null;
  const related = (route.relatedSlugs || [])
    .map((s) => SEO_ROUTE_BY_SLUG[s])
    .filter(Boolean);

  return (
    <article
      style={{
        maxWidth: 1040,
        margin: '0 auto',
        padding: '28px 20px 44px',
        color: 'var(--ink, #0f172a)',
      }}
    >
      <nav aria-label="Breadcrumb" style={{ fontSize: '0.86rem', opacity: 0.75, marginBottom: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <a href="/" style={{ color: 'var(--pri, #2563eb)', textDecoration: 'none', fontWeight: 600 }}>
          ELEC Science AI
        </a>
        <span>/</span>
        <span>{route.label}</span>
      </nav>

      <header
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 52%, #0ea5e9 100%)',
          color: '#fff',
          borderRadius: 24,
          padding: '32px 28px',
          marginBottom: 24,
          boxShadow: '0 14px 36px rgba(37,99,235,0.2)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.16)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          ELEC Science AI · Chuẩn GDPT 2018 &amp; THPT 2026
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.6rem, 3.2vw, 2.35rem)', lineHeight: 1.24, fontWeight: 900 }}>
          {route.h1}
        </h1>
        <p id="aeo-direct-answer" style={{ margin: '0 0 22px', fontSize: '1.02rem', lineHeight: 1.68, opacity: 0.95, maxWidth: 820 }}>
          {route.intro}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a
            href={`/${route.targetAppHash || '#home'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 999,
              background: '#fff',
              color: '#1d4ed8',
              fontWeight: 800,
              fontSize: '0.96rem',
              textDecoration: 'none',
            }}
          >
            {route.ctaLabel || 'Trải nghiệm ngay'} →
          </a>
          <a
            href="/#/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 20px',
              borderRadius: 999,
              border: '1.5px solid rgba(255,255,255,0.65)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.94rem',
              textDecoration: 'none',
            }}
          >
            Tạo tài khoản miễn phí
          </a>
        </div>
      </header>

      {route.specs && (
        <section
          style={{
            background: 'var(--panel, rgba(255,255,255,0.85))',
            border: '1px solid var(--line, rgba(15,23,42,0.1))',
            borderRadius: 18,
            padding: '20px 22px',
            marginBottom: 22,
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 800 }}>
            Thông số tổng quan (AEO / GEO Specs)
          </h2>
          <dl
            id="geo-key-specs"
            style={{
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px 20px',
              fontSize: '0.94rem',
            }}
          >
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.7, fontSize: '0.83rem' }}>Phạm vi &amp; Môn học</dt>
              <dd style={{ margin: '3px 0 0', fontWeight: 600 }}>{route.specs.subject}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.7, fontSize: '0.83rem' }}>Phương pháp &amp; Công nghệ</dt>
              <dd style={{ margin: '3px 0 0', fontWeight: 600 }}>{route.specs.method}</dd>
            </div>
            <div>
              <dt style={{ fontWeight: 700, opacity: 0.7, fontSize: '0.83rem' }}>Đối tượng phù hợp</dt>
              <dd style={{ margin: '3px 0 0', fontWeight: 600 }}>{route.specs.audience}</dd>
            </div>
          </dl>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 22 }}>
        <section
          style={{
            background: 'var(--panel, rgba(255,255,255,0.85))',
            border: '1px solid var(--line, rgba(15,23,42,0.1))',
            borderRadius: 18,
            padding: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '1.18rem', fontWeight: 800 }}>
            Tính năng nổi bật của {route.label}
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75, opacity: 0.9, fontSize: '0.95rem' }}>
            {(route.highlights || []).map((item, idx) => (
              <li key={idx} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        </section>

        <section
          style={{
            background: 'var(--panel, rgba(255,255,255,0.85))',
            border: '1px solid var(--line, rgba(15,23,42,0.1))',
            borderRadius: 18,
            padding: '22px',
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '1.18rem', fontWeight: 800 }}>
            Hướng dẫn bắt đầu trong 3 bước
          </h2>
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75, opacity: 0.9, fontSize: '0.95rem' }}>
            {(route.steps || []).map((step, idx) => (
              <li key={idx} id={`step-${idx + 1}`} style={{ marginBottom: 10 }}>
                <strong>Bước {idx + 1}:</strong> {step}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section
        id="route-faq"
        style={{
          background: 'var(--panel, rgba(255,255,255,0.85))',
          border: '1px solid var(--line, rgba(15,23,42,0.1))',
          borderRadius: 18,
          padding: '22px',
          marginBottom: 22,
        }}
      >
        <h2 style={{ margin: '0 0 14px', fontSize: '1.18rem', fontWeight: 800 }}>
          Câu hỏi thường gặp về {route.label}
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(route.faqs || []).map((faq, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--line, rgba(15,23,42,0.1))',
              }}
            >
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700 }}>
                {idx + 1}. {faq.q}
              </h3>
              <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.65, fontSize: '0.94rem' }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          background: 'var(--panel, rgba(255,255,255,0.85))',
          border: '1px solid var(--line, rgba(15,23,42,0.1))',
          borderRadius: 18,
          padding: '22px',
        }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 800 }}>
          Kho học liệu &amp; Phân hệ liên quan trên ELEC Science AI
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
          {related.map((r) => (
            <a
              key={r.slug}
              href={`/${r.slug}`}
              style={{
                display: 'block',
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--line, rgba(15,23,42,0.1))',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontWeight: 750, color: 'var(--pri, #2563eb)', marginBottom: 4, fontSize: '0.95rem' }}>
                {r.label} →
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.78, lineHeight: 1.5 }}>
                {r.description.slice(0, 110)}...
              </div>
            </a>
          ))}
          {PSEO_HUB_LINKS.map((hub) => (
            <a
              key={hub.href}
              href={hub.href}
              style={{
                display: 'block',
                padding: '14px 16px',
                borderRadius: 14,
                border: '1px solid var(--line, rgba(15,23,42,0.1))',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontWeight: 750, color: 'var(--pri, #2563eb)', marginBottom: 4, fontSize: '0.95rem' }}>
                {hub.label} →
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.78, lineHeight: 1.5 }}>
                {hub.desc}
              </div>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
