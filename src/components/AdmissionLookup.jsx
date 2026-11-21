/* ============================================================
   AdmissionLookup.jsx — Tra cứu điểm chuẩn ĐH & Liên thông Phòng thi
   - Lọc đa tầng theo Nhóm ngành, Phương thức (THPTQG/HSA/TSA/V-ACT),
     Khu vực & Độ vừa sức
   - Tự tổng hợp điểm thật (Supabase + Phòng thi ảo) hoặc cho nhập điểm giả định
   - Ghim Nguyện vọng 1 (NV1) kèm thanh tiến độ khoảng cách & CTA nhảy thẳng
     vào đúng kỳ thi mục tiêu (#virtual-exams?type=...)
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import { CUTOFF_DATA, CITIES } from '../data/uniCutoffs.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import {
  evaluateAdmissionFit,
  loadTargetUniversity,
  saveTargetUniversity,
} from '../lib/studentAnalytics.js';
import { IconAlert, IconTarget, IconRobot, IconArrowUpRight } from './Icons.jsx';
import { askAI } from './HomePlus.jsx';
import CareerFitModal from './CareerFitModal.jsx';
import '../styles/student-v9-upgrades.css';

const A = {
  page: { minHeight: '100dvh', background: 'var(--bg, #f4f6fb)', color: 'var(--ink, #0f172a)', fontFamily: 'var(--sans, -apple-system, sans-serif)', WebkitFontSmoothing: 'antialiased' },
  wrap: { maxWidth: 980, margin: '0 auto', padding: '1.2rem 1rem 3rem' },
  card: { background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(100,120,180,.16))', borderRadius: 20, boxShadow: 'var(--sh-1)' },
};

const GROUPS = ['Tất cả', ...Array.from(new Set(CUTOFF_DATA.map((r) => r.group).filter(Boolean)))];
const METHODS = ['Tất cả', 'THPTQG', 'HSA', 'TSA', 'V-ACT'];

function primaryExamTypeOf(methods = []) {
  if (methods.includes('TSA')) return 'TSA';
  if (methods.includes('HSA')) return 'HSA';
  if (methods.includes('V-ACT')) return 'V-ACT';
  return 'THPTQG';
}

export default function AdmissionLookup() {
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';

  const [q, setQ] = useState('');
  const [city, setCity] = useState('Tất cả');
  const [group, setGroup] = useState('Tất cả');
  const [method, setMethod] = useState('Tất cả');
  const [fitFilter, setFitFilter] = useState('all'); // 'all' | 'safe' | 'near'
  const [sort, setSort] = useState('s2025-desc');
  const [myAvg, setMyAvg] = useState(null);
  const [customScore, setCustomScore] = useState('');
  const [targetMajor, setTargetMajor] = useState(() => loadTargetUniversity(uid));
  const [careerOpen, setCareerOpen] = useState(false);

  useEffect(() => {
    setTargetMajor(loadTargetUniversity(uid));
  }, [uid]);

  /* Tổng hợp điểm năng lực thật từ cả Supabase lẫn Phòng thi ảo ELEC AI */
  useEffect(() => {
    let active = true;
    const localHist = getVirtualExamHistory(uid) || [];
    const localScores30 = localHist
      .filter((h) => typeof h?.score === 'number' && (h.totalPoints || 10) > 0)
      .map((h) => (h.score / (h.totalPoints || 10)) * 30);

    (async () => {
      const combined = [...localScores30];
      if (user?.uid || user?.id) {
        try {
          const { data } = await supabase
            .from('exam_attempts')
            .select('correct_count, total_questions')
            .eq('user_id', user.uid || user.id)
            .eq('is_completed', true)
            .limit(50);
          (data || [])
            .filter((r) => (r.total_questions || 0) > 0)
            .forEach((r) => combined.push((r.correct_count / r.total_questions) * 30));
        } catch { /* bỏ qua nếu offline */ }
      }
      if (active && combined.length > 0) {
        const avg = combined.reduce((s, v) => s + v, 0) / combined.length;
        setMyAvg(Math.round(avg * 10) / 10);
      }
    })();

    return () => { active = false; };
  }, [uid, user?.uid, user?.id]);

  const effectiveScore = useMemo(() => {
    const parsed = parseFloat(String(customScore).replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 30) return Math.round(parsed * 10) / 10;
    return myAvg;
  }, [customScore, myAvg]);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    let list = CUTOFF_DATA.filter((r) => {
      if (city !== 'Tất cả' && r.city !== city) return false;
      if (group !== 'Tất cả' && r.group !== group) return false;
      if (method !== 'Tất cả' && !(r.methods || []).includes(method)) return false;
      if (
        k &&
        !r.uni.toLowerCase().includes(k) &&
        !r.major.toLowerCase().includes(k) &&
        !r.combo.toLowerCase().includes(k) &&
        !(r.code || '').toLowerCase().includes(k)
      ) {
        return false;
      }
      if (fitFilter !== 'all' && effectiveScore != null) {
        const f = evaluateAdmissionFit(effectiveScore, r.s2025 ?? r.s2024);
        if (!f) return false;
        if (fitFilter === 'safe' && f.status !== 'safe') return false;
        if (fitFilter === 'near' && f.status !== 'safe' && f.status !== 'near') return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = a.s2025 ?? a.s2024 ?? 0;
      const bv = b.s2025 ?? b.s2024 ?? 0;
      return sort.includes('desc') ? bv - av : av - bv;
    });
    return list;
  }, [q, city, group, method, fitFilter, effectiveScore, sort]);

  const unis = useMemo(() => [...new Set(rows.map((r) => r.uni))], [rows]);

  const handlePinTarget = (record) => {
    const isSame = targetMajor?.id === record.id;
    const next = isSame ? null : record;
    setTargetMajor(next);
    saveTargetUniversity(uid, next);
  };

  const goPracticeForMethods = (methods = []) => {
    const examType = primaryExamTypeOf(methods);
    window.location.hash = `#virtual-exams?type=${encodeURIComponent(examType)}`;
  };

  const targetFit = targetMajor
    ? evaluateAdmissionFit(effectiveScore, targetMajor.s2025 ?? targetMajor.s2024)
    : null;
  const targetProgressPct =
    targetMajor && effectiveScore != null && (targetMajor.s2025 ?? targetMajor.s2024)
      ? Math.min(100, Math.round((effectiveScore / (targetMajor.s2025 ?? targetMajor.s2024)) * 100))
      : 0;

  return (
    <div style={A.page} className="ns9-adm-page">
      <div style={A.wrap}>
        <div className="ns9-tool-hero tone-indigo">
          <div className="ns9-th-left">
            <span className="ns9-th-badge">
              <IconTarget size={12} /> ĐIỂM CHUẨN ĐẠI HỌC · LIÊN THÔNG PHÒNG THI
            </span>
            <h1>Tra cứu điểm chuẩn &amp; Mục tiêu NV1</h1>
            <p>
              Đối chiếu điểm chuẩn {unis.length} trường ({rows.length} ngành) theo 4 phương thức THPTQG · HSA · TSA · V-ACT với năng lực thực tế của bạn và nhảy thẳng vào đề luyện mục tiêu.
            </p>
            <div className="ns9-th-actions">
              <button
                type="button"
                className="ns9-th-pillbtn"
                style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setCareerOpen(true)}
              >
                Định hướng Ngành AI (RIASEC)
              </button>
              <a href="#roadmap" className="ns9-th-pillbtn is-ghost">
                Mở Lộ trình Nguyện vọng <IconArrowUpRight size={13} />
              </a>
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                onClick={() =>
                  askAI(
                    `Điểm hiện tại của em là ${effectiveScore != null ? `${effectiveScore}/30` : 'chưa có dữ liệu'}${
                      targetMajor ? `, mục tiêu NV1 là ${targetMajor.major} — ${targetMajor.uni} (điểm chuẩn ${targetMajor.s2025 ?? targetMajor.s2024})` : ''
                    }. Hãy tư vấn chiến lược chọn trường, sắp xếp nguyện vọng và các môn cần kéo điểm để đỗ.`
                  )
                }
              >
                <IconRobot size={14} /> Hỏi AI chiến lược xét tuyển
              </button>
            </div>
          </div>
          <img src="/img/elec/elec-fighting.png" alt="Bé Elec Xét tuyển" className="ns9-th-mascot" loading="eager" />
        </div>

        {/* Thẻ Mục tiêu Nguyện vọng 1 (NV1) gắn trực tiếp với Phòng thi */}
        {targetMajor && (
          <section className="s9-adm-target-card" aria-label="Nguyện vọng 1 đang ghim">
            <div className="s9-adm-target-top">
              <div>
                <span className="s9-adm-target-tag">NGUYỆN VỌNG 1 CỦA BẠN</span>
                <h3>
                  {targetMajor.major} — {targetMajor.uni}
                </h3>
                <p>
                  Mã trường: <b>{targetMajor.code}</b> · Tổ hợp: <b>{targetMajor.combo}</b> · Chuẩn 2025:{' '}
                  <b>{targetMajor.s2025 ?? targetMajor.s2024 ?? '—'}đ</b>
                </p>
              </div>
              <div className="s9-adm-target-actions">
                <button
                  type="button"
                  className="s9-adm-practice-btn"
                  onClick={() => goPracticeForMethods(targetMajor.methods)}
                >
                  Luyện đề {primaryExamTypeOf(targetMajor.methods)} ngay →
                </button>
                <button
                  type="button"
                  className="s9-adm-unpin-btn"
                  onClick={() => handlePinTarget(targetMajor)}
                >
                  Bỏ ghim
                </button>
              </div>
            </div>

            {effectiveScore != null && (targetMajor.s2025 ?? targetMajor.s2024) ? (
              <div className="s9-adm-target-meter">
                <div className="s9-adm-target-meter-lbl">
                  <span>
                    Điểm hiện tại: <b>{effectiveScore}/30</b>
                  </span>
                  {targetFit && (
                    <span className={`s9-adm-fit-txt is-${targetFit.status}`}>{targetFit.text}</span>
                  )}
                </div>
                <div className="s9-adm-bar-track">
                  <div
                    className={`s9-adm-bar-fill is-${targetFit?.status || 'near'}`}
                    style={{ width: `${targetProgressPct}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="s9-adm-target-hint">
                Nhập điểm giả định bên dưới hoặc hoàn thành 1 đề trong Phòng thi ảo để đo khoảng cách tới NV1!
              </div>
            )}
          </section>
        )}

        <div className="ns9-adm-notice">
          <IconAlert size={16} />
          <small>
            Số liệu <b>tham khảo 2024–2025</b>, làm tròn từ nguồn công khai — luôn đối chiếu công bố chính thức của trường trước khi đăng ký nguyện vọng.
          </small>
        </div>

        {/* Thanh nhập điểm của bạn / điểm giả định để so độ vừa sức ngay */}
        <div className="s9-adm-scorebar">
          <div className="s9-adm-scorebar-l">
            <span className="ns9-adm-myscore-badge">
              {effectiveScore != null ? `Điểm so sánh: ${effectiveScore}/30` : 'Chưa có điểm thi thử'}
            </span>
            <small>
              {customScore
                ? 'Đang dùng điểm giả định bạn nhập'
                : myAvg != null
                  ? 'Quy đổi tự động từ lịch sử thi của bạn trên ELEC AI'
                  : 'Nhập thử điểm (VD: 25.5) để lọc ngay các trường vừa sức'}
            </small>
          </div>
          <div className="s9-adm-scorebar-r">
            <input
              type="number"
              min="0"
              max="30"
              step="0.1"
              value={customScore}
              onChange={(e) => setCustomScore(e.target.value)}
              placeholder={myAvg != null ? `Thử điểm khác (${myAvg})` : 'Nhập điểm /30...'}
              className="s9-adm-score-input"
              aria-label="Nhập điểm giả định trên thang 30"
            />
            {customScore && (
              <button type="button" className="s9-adm-clear-score" onClick={() => setCustomScore('')}>
                Dùng điểm thật
              </button>
            )}
          </div>
        </div>

        {/* Bộ lọc đa tầng kiểu 9Study */}
        <div className="ns9-adm-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trường, mã trường (BKA, NEU, YHA), ngành, tổ hợp (A00, B00)…"
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

        {/* Hàng chip lọc Nhóm ngành + Phương thức xét tuyển + Độ vừa sức */}
        <div className="s9-adm-pill-groups">
          <div className="s9-adm-pills" role="group" aria-label="Lọc theo nhóm ngành">
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`s9-adm-pill ${group === g ? 'active' : ''}`}
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="s9-adm-pills" role="group" aria-label="Lọc theo phương thức">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                className={`s9-adm-pill is-method ${method === m ? 'active' : ''}`}
                onClick={() => setMethod(m)}
              >
                {m === 'Tất cả' ? 'Mọi phương thức' : m}
              </button>
            ))}
            {effectiveScore != null && (
              <>
                <button
                  type="button"
                  className={`s9-adm-pill is-fit ${fitFilter === 'safe' ? 'active' : ''}`}
                  onClick={() => setFitFilter((f) => (f === 'safe' ? 'all' : 'safe'))}
                >
                  Chỉ hiện vừa sức
                </button>
                <button
                  type="button"
                  className={`s9-adm-pill is-fit ${fitFilter === 'near' ? 'active' : ''}`}
                  onClick={() => setFitFilter((f) => (f === 'near' ? 'all' : 'near'))}
                >
                  Sát chuẩn ≤ 1.5đ
                </button>
              </>
            )}
          </div>
        </div>

        {unis.length === 0 ? (
          <div style={{ ...A.card, padding: '2rem', textAlign: 'center', color: 'var(--mut, #64748b)', font: '500 .88rem var(--sans)' }}>
            Không tìm thấy kết quả phù hợp. Thử mở rộng bộ lọc hoặc nhập từ khóa ngắn hơn nhé!
          </div>
        ) : (
          unis.map((u) => {
            const firstRow = rows.find((r) => r.uni === u);
            return (
              <div key={u} className="ns9-adm-unicard" style={{ ...A.card, marginBottom: '.85rem', overflow: 'hidden' }}>
                <div className="ns9-adm-unihead">
                  <div className="s9-adm-uni-title">
                    {firstRow?.code && <span className="s9-adm-unicode">{firstRow.code}</span>}
                    <b>{u}</b>
                  </div>
                  <span>{firstRow?.city}</span>
                </div>
                {rows
                  .filter((r) => r.uni === u)
                  .map((r, i) => {
                    const f = evaluateAdmissionFit(effectiveScore, r.s2025 ?? r.s2024);
                    const delta =
                      r.s2025 != null && r.s2024 != null
                        ? Number((r.s2025 - r.s2024).toFixed(2))
                        : null;
                    const isPinned = targetMajor?.id === r.id;
                    return (
                      <div
                        key={r.id || i}
                        className={`ns9-adm-row s9-adm-row ${isPinned ? 'is-pinned' : ''}`}
                        style={{ borderTop: i > 0 ? '1px solid var(--line-soft, rgba(100,120,180,.08))' : 'none' }}
                      >
                        <div className="ns9-adm-major">
                          <b>{r.major}</b>
                          <div className="s9-adm-row-meta">
                            <span>Tổ hợp: {r.combo}</span>
                            {(r.methods || []).map((m) => (
                              <span key={m} className="s9-adm-method-tag">{m}</span>
                            ))}
                          </div>
                        </div>

                        <div className="ns9-adm-scores">
                          <b>
                            {r.s2025 ?? '—'}
                            {delta != null && delta !== 0 && (
                              <em className={`s9-adm-delta ${delta > 0 ? 'up' : 'down'}`}>
                                {delta > 0 ? `+${delta}` : delta}
                              </em>
                            )}
                          </b>
                          <small>2024: {r.s2024 ?? '—'}</small>
                        </div>

                        <div className="s9-adm-row-actions">
                          {f && (
                            <span className={'ns9-adm-fit ' + (f.status === 'safe' ? 'is-ok' : f.status === 'near' ? 'is-near' : 'is-far')}>
                              {f.text}
                            </span>
                          )}
                          <div className="s9-adm-btn-pair">
                            <button
                              type="button"
                              className={`s9-adm-mini-btn ${isPinned ? 'is-pinned' : ''}`}
                              onClick={() => handlePinTarget(r)}
                              title="Đặt làm Nguyện vọng 1 để theo dõi tiến độ"
                            >
                              {isPinned ? '★ NV1' : '☆ Ghim NV1'}
                            </button>
                            <button
                              type="button"
                              className="s9-adm-mini-btn is-go"
                              onClick={() => goPracticeForMethods(r.methods)}
                              title={`Luyện đề ${primaryExamTypeOf(r.methods)} cho ngành này`}
                            >
                              Luyện đề
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>

      <CareerFitModal
        open={careerOpen}
        onClose={() => setCareerOpen(false)}
        predictedScore30={effectiveScore}
        onPinTarget={handlePinTarget}
      />
    </div>
  );
}

const selStyle = {
  padding: '.55rem 1rem', borderRadius: 999,
  border: '1px solid var(--line, rgba(100,120,180,.16))',
  background: 'var(--surface, #fff)', color: 'var(--ink)',
  font: '600 .8rem var(--sans)', outline: 'none', cursor: 'pointer',
  whiteSpace: 'nowrap', minWidth: 162,
};
