/* ============================================================
   AdmissionLookup.jsx — Tra cứu điểm chuẩn & so sánh với bản thân
   Nguồn: dữ liệu tham khảo trong src/data/uniCutoffs.js
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import { CUTOFF_DATA, CITIES } from '../data/uniCutoffs.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { IconAlert, IconTarget, IconRobot, IconArrowUpRight } from './Icons.jsx';
import { askAI } from './HomePlus.jsx';

const A = {
  page: { minHeight: '100dvh', background: 'var(--bg, #f4f6fb)', color: 'var(--ink, #0f172a)', fontFamily: 'var(--sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 960, margin: '0 auto', padding: '1.2rem 1rem 3rem' },
  card: { background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(100,120,180,.16))', borderRadius: 20, boxShadow: 'var(--sh-1)' },
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
    <div style={A.page} className="ns9-adm-page">
      <div style={A.wrap}>
        <div className="ns9-tool-hero tone-indigo">
          <div className="ns9-th-left">
            <span className="ns9-th-badge">
              <IconTarget size={12} /> ĐIỂM CHUẨN ĐẠI HỌC · SO ĐỘ VỪA SỨC
            </span>
            <h1>Tra cứu điểm chuẩn</h1>
            <p>
              Đối chiếu trực tiếp điểm chuẩn các trường trọng tâm với năng lực thi thực tế của bạn qua {unis.length} trường và {rows.length} ngành lọc được.
            </p>
            <div className="ns9-th-actions">
              <a href="#roadmap" className="ns9-th-pillbtn">
                Mở Lộ trình Nguyện vọng <IconArrowUpRight size={13} />
              </a>
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                onClick={() => askAI(`Điểm trung bình hiện tại của em là ${myAvg != null ? `${myAvg}/30` : 'chưa có dữ liệu'}. Hãy tư vấn chiến lược chọn trường, sắp xếp nguyện vọng và các môn cần kéo điểm để đỗ ngành mục tiêu.`)}
              >
                <IconRobot size={14} /> Hỏi AI chiến lược xét tuyển
              </button>
            </div>
          </div>
          <img src="/img/elec/elec-fighting.png" alt="Bé Elec Xét tuyển" className="ns9-th-mascot" loading="eager" />
        </div>

        <div className="ns9-adm-notice">
          <IconAlert size={16} />
          <small>
            Số liệu <b>tham khảo 2024–2025</b>, làm tròn từ nguồn công khai — luôn đối chiếu công bố chính thức của trường trước khi đăng ký nguyện vọng.
          </small>
        </div>

        {/* Bộ lọc */}
        <div className="ns9-adm-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trường, ngành, tổ hợp (vd: A00, Bách khoa, Y Hà Nội)…"
            className="ns9-adm-search"
          />
          <div className="ns9-adm-selects">
            <select value={city} onChange={(e) => setCity(e.target.value)} style={selStyle} aria-label="Lọc theo khu vực">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={selStyle} aria-label="Sắp xếp điểm chuẩn">
              <option value="s2025-desc">Điểm cao → thấp</option>
              <option value="s2025-asc">Điểm thấp → cao</option>
            </select>
          </div>
        </div>

        {myAvg != null && (
          <div className="ns9-adm-myscore">
            <span className="ns9-adm-myscore-badge">Điểm TB năng lực: {myAvg}/30</span>
            <small>Quy đổi tự động từ các lần thi hoàn thành của bạn trên ELEC AI</small>
          </div>
        )}

        {unis.length === 0 ? (
          <div style={{ ...A.card, padding: '2rem', textAlign: 'center', color: 'var(--mut, #64748b)', font: '500 .88rem var(--sans)' }}>
            Không tìm thấy kết quả phù hợp. Thử từ khóa ngắn hơn nhé!
          </div>
        ) : (
          unis.map((u) => (
            <div key={u} className="ns9-adm-unicard" style={{ ...A.card, marginBottom: '.85rem', overflow: 'hidden' }}>
              <div className="ns9-adm-unihead">
                <b>{u}</b>
                <span>{rows.find((r) => r.uni === u)?.city}</span>
              </div>
              {rows.filter((r) => r.uni === u).map((r, i) => {
                const f = fit(r.s2025 ?? r.s2024);
                return (
                  <div key={i} className="ns9-adm-row" style={{ borderTop: i > 0 ? '1px solid var(--line-soft, rgba(100,120,180,.08))' : 'none' }}>
                    <div className="ns9-adm-major">
                      <b>{r.major}</b>
                      <small>Tổ hợp: {r.combo}</small>
                    </div>
                    <div className="ns9-adm-scores">
                      <b>{r.s2025 ?? '—'}</b>
                      <small>2024: {r.s2024 ?? '—'}</small>
                    </div>
                    {f && (
                      <span className={'ns9-adm-fit ' + (f.ok === true ? 'is-ok' : f.ok === 'near' ? 'is-near' : 'is-far')}>
                        {f.text}
                      </span>
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
  border: '1px solid var(--line, rgba(100,120,180,.16))',
  background: 'var(--surface, #fff)', color: 'var(--ink)',
  font: '600 .8rem var(--sans)', outline: 'none', cursor: 'pointer',
};
