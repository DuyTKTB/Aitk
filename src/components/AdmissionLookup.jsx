/* ============================================================
   AdmissionLookup.jsx — Tra cứu điểm chuẩn & so sánh với bản thân
   Nguồn: dữ liệu tham khảo trong src/data/uniCutoffs.js
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import { CUTOFF_DATA, CITIES } from '../data/uniCutoffs.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';

const A = {
  page: { minHeight: '100dvh', background: 'var(--t-bg, #f4f6fb)', color: 'var(--t-ink, #0f172a)', fontFamily: 'var(--t-font-sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 960, margin: '0 auto', padding: '1.2rem 1rem 3rem' },
  card: { background: 'var(--t-surface-2, #fff)', border: '1px solid var(--t-border, rgba(100,120,180,.16))', borderRadius: 20, boxShadow: 'var(--t-shadow-sm)' },
};

export default function AdmissionLookup() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Tất cả');
  const [sort, setSort] = useState('s2025-desc');
  const [myAvg, setMyAvg] = useState(null);

  /* Điểm trung bình của chính mình (từ các lần thi đã hoàn thành) */
  useEffect(() => {
    const uid = user?.uid || user?.id;
    if (!uid) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('exam_attempts')
          .select('correct_count, total_questions')
          .eq('user_id', uid)
          .eq('is_completed', true)
          .limit(50);
        const rows = (data || []).filter((r) => (r.total_questions || 0) > 0);
        if (rows.length) {
          const avg = rows.reduce((s, r) => s + (r.correct_count / r.total_questions) * 30, 0) / rows.length;
          setMyAvg(Math.round(avg * 10) / 10);
        }
      } catch { /* bỏ qua */ }
    })();
  }, [user?.uid]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    let list = CUTOFF_DATA.filter((r) =>
      (city === 'Tất cả' || r.city === city) &&
      (!k || r.uni.toLowerCase().includes(k) || r.major.toLowerCase().includes(k) || r.combo.toLowerCase().includes(k))
    );
    list = [...list].sort((a, b) => {
      const av = a.s2025 ?? a.s2024 ?? 0;
      const bv = b.s2025 ?? b.s2024 ?? 0;
      return sort.includes('desc') ? bv - av : av - bv;
    });
    return list;
  }, [q, city, sort]);

  const unis = useMemo(() => [...new Set(rows.map((r) => r.uni))], [rows]);

  const fit = (score) => {
    if (myAvg == null || score == null) return null;
    const d = score - myAvg;
    if (d <= 0) return { text: 'Trong tầm tay với!', ok: true, d: Math.abs(d) };
    if (d <= 1.5) return { text: `Cách ${d.toFixed(1)} điểm — cố gắng!`, ok: 'near' };
    return { text: `Cách ${d.toFixed(1)} điểm`, ok: false };
  };

  return (
    <div style={A.page}>
      <div style={A.wrap}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, font: '800 1.4rem var(--t-font-sans)', color: 'var(--t-ink)' }}>Tra cứu điểm chuẩn</h1>
          <p style={{ margin: '.15rem 0 0', color: 'var(--t-ink-muted, #64748b)', font: '500 .84rem var(--t-font-sans)' }}>
            Điểm chuẩn các trường trọng tâm — so sánh trực tiếp với năng lực của bạn
          </p>
        </div>

        <div style={{
          ...A.card, marginBottom: '.9rem', padding: '.8rem 1rem',
          borderLeft: '3px solid #f59e0b', display: 'flex', gap: '.5rem', alignItems: 'flex-start',
        }}>
          <span style={{ color: '#f59e0b', fontWeight: 800 }}>!</span>
          <small style={{ color: 'var(--t-ink-muted, #64748b)', font: '500 .76rem var(--t-font-sans)', lineHeight: 1.5 }}>
            Số liệu <b>tham khảo 2024–2025</b>, làm tròn từ nguồn công khai — luôn đối chiếu công bố chính thức của trường trước khi đăng ký nguyện vọng.
          </small>
        </div>

        {/* Bộ lọc */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.9rem' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trường, ngành, tổ hợp…"
            style={{
              flex: '1 1 220px', padding: '.55rem .9rem', borderRadius: 999,
              border: '1px solid var(--t-border, rgba(100,120,180,.16))',
              background: 'var(--t-surface-2, #fff)', color: 'var(--t-ink)',
              font: '500 .85rem var(--t-font-sans)', outline: 'none',
            }}
          />
          <select value={city} onChange={(e) => setCity(e.target.value)} style={selStyle}>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selStyle}>
            <option value="s2025-desc">Điểm cao → thấp</option>
            <option value="s2025-asc">Điểm thấp → cao</option>
          </select>
        </div>

        {myAvg != null && (
          <div style={{ ...A.card, marginBottom: '.9rem', padding: '.7rem 1rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{ font: '800 .8rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)' }}>Điểm TB của bạn: {myAvg}/30</span>
            <small style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '500 .72rem var(--t-font-sans)' }}>(quy đổi từ kết quả thi trên web — thang 30)</small>
          </div>
        )}

        {unis.length === 0 ? (
          <div style={{ ...A.card, padding: '2rem', textAlign: 'center', color: 'var(--t-ink-muted, #64748b)', font: '500 .88rem var(--t-font-sans)' }}>
            Không tìm thấy kết quả phù hợp.
          </div>
        ) : (
          unis.map((u) => (
            <div key={u} style={{ ...A.card, marginBottom: '.8rem', overflow: 'hidden' }}>
              <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid var(--t-border-subtle, rgba(100,120,180,.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ font: '800 .92rem var(--t-font-sans)', color: 'var(--t-ink)' }}>{u}</b>
                <small style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '600 .72rem var(--t-font-sans)' }}>
                  {rows.find((r) => r.uni === u)?.city}
                </small>
              </div>
              {rows.filter((r) => r.uni === u).map((r, i) => {
                const f = fit(r.s2025 ?? r.s2024);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '.7rem',
                    padding: '.55rem 1rem', borderTop: i > 0 ? '1px solid var(--t-border-subtle, rgba(100,120,180,.08))' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ font: '600 .82rem var(--t-font-sans)', color: 'var(--t-ink)', display: 'block' }}>{r.major}</b>
                      <small style={{ color: 'var(--t-ink-faint, #94a3b8)', font: '500 .7rem var(--t-font-sans)' }}>Tổ hợp: {r.combo}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <b style={{ font: '800 .95rem var(--t-font-sans)', color: 'var(--t-accent, #5b6cff)', fontVariantNumeric: 'tabular-nums' }}>
                        {r.s2025 ?? '—'}
                      </b>
                      <small style={{ display: 'block', color: 'var(--t-ink-faint, #94a3b8)', font: '500 .66rem var(--t-font-sans)' }}>
                        2024: {r.s2024 ?? '—'}
                      </small>
                    </div>
                    {f && (
                      <small style={{
                        font: '600 .68rem var(--t-font-sans)', whiteSpace: 'nowrap',
                        color: f.ok === true ? 'var(--t-status-ok, #16a34a)' : f.ok === 'near' ? '#f59e0b' : 'var(--t-status-err, #dc2626)',
                      }}>{f.text}</small>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const selStyle = {
  padding: '.55rem .8rem', borderRadius: 999,
  border: '1px solid var(--t-border, rgba(100,120,180,.16))',
  background: 'var(--t-surface-2, #fff)', color: 'var(--t-ink)',
  font: '600 .8rem var(--t-font-sans)', outline: 'none', cursor: 'pointer',
};
