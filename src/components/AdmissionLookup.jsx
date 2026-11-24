/* ============================================================
   AdmissionLookup.jsx — TRẠM TRA CỨU ĐIỂM CHUẨN & XÉT NGUYỆN VỌNG ĐẠI HỌC (9STUDY PRO)
   ------------------------------------------------------------
   - Dữ liệu hợp nhất: Chế độ Trường Trọng Điểm (50+ ngành hot) & Toàn bộ 105 Trường ĐH (350+ ngành)
   - Bảng điều khiển "Rổ Nguyện vọng 3 Tầng" (NV1 Mơ ước · NV2 Vừa sức · NV3 Bảo hiểm) đồng bộ 2 chiều với Navbar
   - Tính điểm ưu tiên Khu vực (KV1..KV3) & Đối tượng (ƯT1, ƯT2) chuẩn công thức giảm trừ từ 22.5đ của Bộ GD&ĐT
   - Quy đổi điểm tương đương theo phân vị giữa 6 kỳ thi: THPTQG · HSA · TSA · V-ACT · SPT · H-SCA + IELTS
   - Xem trực tiếp Đề án Tuyển sinh 2026 (UniversityDetailModal) & So sánh đối đầu (AspirationPortfolioModal)
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { CUTOFF_DATA } from '../data/uniCutoffs.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../lib/supabase.js';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import {
  evaluateAdmissionFit,
  loadTargetUniversity,
  saveTargetUniversity,
} from '../lib/studentAnalytics.js';
import {
  getUserAspirationsState,
  subscribeAspirationChanges,
  deleteAspiration,
  reorderAspirations,
  getUnifiedAdmissionCatalog,
} from '../lib/aspirationService.js';
import { evaluatePortfolioHealth } from '../lib/aspirationPortfolioOptimizer.js';
import {
  MOET_PRIORITY_AREAS,
  MOET_PRIORITY_GROUPS,
  IELTS_CONVERSION_TABLE,
  calculateMoetPriorityScore,
  convertExamScoreEquivalence,
  computeMajorAdmissionChance,
  buildRecommended3TierPortfolio,
  pinMajorToAspirationSlot,
} from '../lib/admissionCareerEngine.js';
import { IconAlert, IconTarget, IconRobot, IconArrowUpRight } from './Icons.jsx';
import { getUniversityCover, getUniversityInfo } from '../data/universityCovers.js';
import { askAI } from './HomePlus.jsx';
import CareerFitModal from './CareerFitModal.jsx';
import UniversityDetailModal from './aspiration/UniversityDetailModal.jsx';
import AspirationPortfolioModal from './aspiration/AspirationPortfolioModal.jsx';
import ElecTutorOnboardingModal from './aspiration/ElecTutorOnboardingModal.jsx';
import '../styles/student-v9-upgrades.css';
import '../styles/career-admission-9study.css';

const GROUPS = [
  'Tất cả',
  'Y - Dược',
  'Kỹ thuật - Công nghệ',
  'Kinh tế - Quản trị',
  'Sư phạm - KHTN',
  'Luật - Ngoại giao',
  'Công an - Quân đội',
];

const METHODS = ['Tất cả', 'THPTQG', 'HSA', 'TSA', 'V-ACT', 'SPT', 'H-SCA'];
const LOCATION_FILTERS = ['Tất cả', 'Hà Nội', 'TP.HCM', 'Đà Nẵng / Huế', 'Miền Bắc', 'Miền Nam', 'Miền Trung'];

function primaryExamTypeOf(methods = []) {
  if (methods.includes('TSA')) return 'TSA';
  if (methods.includes('HSA')) return 'HSA';
  if (methods.includes('V-ACT')) return 'V-ACT';
  return 'THPTQG';
}

export default function AdmissionLookup() {
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';

  // Chế độ danh mục: 'flagship' (Trường trọng điểm 50+ ngành hot) | 'all105' (Toàn bộ 105 trường ĐH)
  const [catalogScope, setCatalogScope] = useState('all105');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('Tất cả');
  const [group, setGroup] = useState('Tất cả');
  const [method, setMethod] = useState('Tất cả');
  const [fitFilter, setFitFilter] = useState('all'); // 'all' | 'safe' | 'near' | 'reach'
  const [sort, setSort] = useState('s2025-desc');

  // Điểm năng lực thật & Bộ giả lập điểm xét tuyển chuẩn Bộ GD&ĐT
  const [myAvg, setMyAvg] = useState(null);
  const [customScore, setCustomScore] = useState('');
  const [use3Subjects, setUse3Subjects] = useState(false);
  const [subScores, setSubScores] = useState(['8.5', '8.5', '8.25']);
  const [areaId, setAreaId] = useState('KV3');
  const [prioGroupId, setPrioGroupId] = useState('NONE');
  const [ieltsBand, setIeltsBand] = useState('none');

  // Đồng bộ Rổ Nguyện vọng 3 Tầng (NV1, NV2, NV3) với Navbar
  const [aspState, setAspState] = useState(() => getUserAspirationsState(uid));
  const [targetMajor, setTargetMajor] = useState(() => loadTargetUniversity(uid));
  const [toastMsg, setToastMsg] = useState('');

  // Các Modal chuyên sâu
  const [careerOpen, setCareerOpen] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [detailSchoolId, setDetailSchoolId] = useState(null);

  const unifiedCatalog = useMemo(() => getUnifiedAdmissionCatalog(), []);
  const activeDataset = useMemo(
    () => (catalogScope === 'all105' ? unifiedCatalog : CUTOFF_DATA),
    [catalogScope, unifiedCatalog]
  );

  useEffect(() => {
    setTargetMajor(loadTargetUniversity(uid));
    setAspState(getUserAspirationsState(uid));
    return subscribeAspirationChanges(() => {
      setAspState(getUserAspirationsState(uid));
    });
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

  // Tính điểm gốc 3 môn trước ưu tiên
  const rawScore30 = useMemo(() => {
    if (use3Subjects) {
      const nums = subScores.map((s) => parseFloat(String(s).replace(',', '.')));
      if (nums.every((n) => Number.isFinite(n) && n >= 0 && n <= 10)) {
        return Math.round((nums[0] + nums[1] + nums[2]) * 100) / 100;
      }
    }
    const parsed = parseFloat(String(customScore).replace(',', '.'));
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 30) {
      return Math.round(parsed * 100) / 100;
    }
    return myAvg;
  }, [use3Subjects, subScores, customScore, myAvg]);

  // Tính điểm ưu tiên chuẩn Bộ GD&ĐT (giảm tuyến tính từ 22.5đ) + điểm cộng IELTS
  const ieltsInfo = useMemo(
    () => IELTS_CONVERSION_TABLE.find((x) => x.band === ieltsBand) || IELTS_CONVERSION_TABLE[0],
    [ieltsBand]
  );

  const priorityCalc = useMemo(() => {
    if (rawScore30 == null) return null;
    return calculateMoetPriorityScore({
      rawScore30,
      areaId,
      groupId: prioGroupId,
      extraBonus: ieltsInfo.bonus30,
    });
  }, [rawScore30, areaId, prioGroupId, ieltsInfo]);

  const effectiveScore = priorityCalc ? priorityCalc.finalScore30 : rawScore30;

  // Quy đổi tương đương sang 6 kỳ thi
  const examEquivalence = useMemo(
    () => convertExamScoreEquivalence(effectiveScore ?? 25.0, 'THPTQG'),
    [effectiveScore]
  );

  // Đánh giá sức khỏe Rổ Nguyện vọng 3 Tầng
  const portfolioHealth = useMemo(
    () => evaluatePortfolioHealth(aspState.aspirations, effectiveScore ?? 25.0, 30),
    [aspState.aspirations, effectiveScore]
  );

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3600);
  };

  // Ghim vào đúng vị trí NV1 / NV2 / NV3
  const handlePinToSlot = (record, priority = 1) => {
    const nextState = pinMajorToAspirationSlot(uid, record, priority, 'THPTQG');
    if (nextState) setAspState(nextState);
    if (priority === 1) {
      setTargetMajor(record);
    }
    showToast(`Đã đặt "${record.major} — ${record.uni}" vào Nguyện vọng ${priority} (NV${priority})!`);
  };

  // Backward-compatible toggle NV1
  const handlePinTarget = (record) => {
    const isSame = targetMajor?.id === record.id;
    if (isSame) {
      setTargetMajor(null);
      saveTargetUniversity(uid, null);
      const nv1 = aspState.aspirations[0];
      if (nv1 && (nv1.majorId === record.id || nv1.school?.code === record.code)) {
        setAspState(deleteAspiration(uid, nv1.id));
      }
      showToast('Đã bỏ ghim Nguyện vọng 1.');
    } else {
      handlePinToSlot(record, 1);
    }
  };

  // Tự động điền Rổ 3 Nguyện vọng Vàng (Mơ ước - Vừa sức - An toàn)
  const handleAutoBuild3TierPortfolio = () => {
    const recommended = buildRecommended3TierPortfolio({
      score30: effectiveScore ?? 25.0,
      group,
      city: city === 'Tất cả' || city.startsWith('Miền') ? 'Tất cả' : city,
      catalog: activeDataset,
    });
    if (!recommended.length) return;
    recommended.forEach((rec, idx) => {
      pinMajorToAspirationSlot(uid, rec, idx + 1, 'THPTQG');
    });
    setAspState(getUserAspirationsState(uid));
    setTargetMajor(recommended[0]);
    showToast('Đã tự động thiết lập Rổ 3 Nguyện vọng Vàng (NV1 Mơ ước · NV2 Vừa sức · NV3 An toàn)!');
  };

  // Tự động sửa lỗi nghịch đảo thứ tự ưu tiên (Sắp xếp điểm chuẩn từ Cao -> Thấp)
  const handleFixInversion = () => {
    const sortedIds = [...aspState.aspirations]
      .sort((a, b) => (b.cutoffScore || 0) - (a.cutoffScore || 0))
      .map((a) => a.id);
    const next = reorderAspirations(uid, sortedIds);
    setAspState(next);
    showToast('Đã sắp xếp lại thứ tự ưu tiên NV1 → NV2 → NV3 theo điểm chuẩn giảm dần chuẩn Bộ GD&ĐT!');
  };

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    let list = activeDataset.filter((r) => {
      if (city !== 'Tất cả') {
        if (city === 'Miền Bắc' && r.region !== 'Miền Bắc' && !/Hà Nội/i.test(r.city || '')) return false;
        else if (city === 'Miền Nam' && r.region !== 'Miền Nam' && !/TP\.HCM|Cần Thơ/i.test(r.city || '')) return false;
        else if (city === 'Miền Trung' && r.region !== 'Miền Trung' && !/Đà Nẵng|Huế/i.test(r.city || '')) return false;
        else if (!city.startsWith('Miền') && !(r.city || '').includes(city)) return false;
      }
      if (group !== 'Tất cả' && r.group !== group) return false;
      if (method !== 'Tất cả' && !(r.methods || []).includes(method)) return false;
      if (
        k &&
        !(r.uni || '').toLowerCase().includes(k) &&
        !(r.major || '').toLowerCase().includes(k) &&
        !(r.combo || '').toLowerCase().includes(k) &&
        !(r.code || '').toLowerCase().includes(k) &&
        !(r.majorCode || '').toLowerCase().includes(k)
      ) {
        return false;
      }
      if (fitFilter !== 'all' && effectiveScore != null) {
        const chance = computeMajorAdmissionChance(effectiveScore, r.s2025 ?? r.s2024);
        if (!chance) return false;
        if (fitFilter === 'safe' && chance.tier !== 'safety') return false;
        if (fitFilter === 'near' && chance.tier !== 'safety' && chance.tier !== 'target') return false;
        if (fitFilter === 'reach' && chance.tier !== 'reach') return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = a.s2025 ?? a.s2024 ?? 0;
      const bv = b.s2025 ?? b.s2024 ?? 0;
      return sort.includes('desc') ? bv - av : av - bv;
    });
    return list;
  }, [activeDataset, q, city, group, method, fitFilter, effectiveScore, sort]);

  const unis = useMemo(() => [...new Set(rows.map((r) => r.uni))], [rows]);

  const goPracticeForMethods = (methods = []) => {
    const examType = primaryExamTypeOf(methods);
    window.location.hash = `#virtual-exams?type=${encodeURIComponent(examType)}`;
  };

  const isPinnedInSlot = (record, slotPriority) => {
    const asp = aspState.aspirations.find((a) => a.priority === slotPriority);
    if (!asp) return false;
    return (
      asp.majorId === record.id ||
      (asp.school?.code === record.code && asp.major?.name === record.major)
    );
  };

  return (
    <div className="s9c-page ns9-adm-page">
      <div className="s9c-wrap">
        {/* ── 1. HERO BANNER CHUẨN 9STUDY ── */}
        <div className="ns9-tool-hero tone-indigo" style={{ marginBottom: '1rem' }}>
          <div className="ns9-th-left">
            <span className="ns9-th-badge">
              <IconTarget size={12} /> TRẠM XÉT NGUYỆN VỌNG ĐẠI HỌC · ĐIỂM CHUẨN 105 TRƯỜNG · LIÊN THÔNG PHÒNG THI
            </span>
            <h1>Tra cứu Điểm chuẩn &amp; Tối ưu Rổ Nguyện vọng</h1>
            <p>
              Đối chiếu điểm chuẩn <b>{unis.length} trường ({rows.length} ngành)</b> theo 6 phương thức <b>THPTQG · HSA · TSA · V-ACT · SPT · H-SCA</b>, tự động tính điểm ưu tiên giảm trừ từ 22.5đ chuẩn Bộ GD&amp;ĐT và thiết lập Rổ Nguyện vọng 3 tầng.
            </p>
            <div className="ns9-th-actions">
              <a href="#career" className="ns9-th-pillbtn">
                Trắc nghiệm Định hướng Ngành AI (RIASEC) <IconArrowUpRight size={13} />
              </a>
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setPortfolioModalOpen(true)}
              >
                So sánh Đối đầu &amp; Khám Sức khỏe NV
              </button>
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                style={{ cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setTutorModalOpen(true)}
              >
                Chọn NV cùng ELEC Tutor
              </button>
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                onClick={() =>
                  askAI(
                    `Điểm xét tuyển sau ưu tiên của em là ${
                      effectiveScore != null ? `${effectiveScore}/30` : 'chưa có dữ liệu'
                    } (${areaId}, ${prioGroupId})${
                      aspState.aspirations.length
                        ? `, danh sách nguyện vọng hiện tại: ${aspState.aspirations
                            .map((a) => `NV${a.priority}: ${a.major?.name} - ${a.school?.code} (chuẩn ${a.cutoffScore}đ)`)
                            .join('; ')}`
                        : ''
                    }. Hãy phân tích tỷ lệ đỗ từng nguyện vọng và tư vấn chiến lược điều chỉnh an toàn nhất.`
                  )
                }
              >
                <IconRobot size={14} /> Hỏi AI chiến lược xét tuyển
              </button>
            </div>
          </div>
          <img
            src="/img/elec/elec-fighting.png"
            alt="Bé Elec Xét tuyển"
            className="ns9-th-mascot"
            loading="eager"
          />
        </div>

        {/* Toast thông báo đồng bộ */}
        {toastMsg && (
          <div
            role="status"
            style={{
              marginBottom: '0.9rem',
              padding: '0.72rem 1.1rem',
              borderRadius: 14,
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1.5px solid rgba(37, 99, 235, 0.35)',
              color: 'var(--ink)',
              fontWeight: 700,
              fontSize: '0.83rem',
            }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* ── 2. BẢNG ĐIỀU KHIỂN RỔ NGUYỆN VỌNG 3 TẦNG (NV1 · NV2 · NV3) ĐỒNG BỘ NAVBAR ── */}
        <section className="s9a-portfolio-deck" aria-label="Bảng điều khiển Rổ Nguyện vọng 3 Tầng">
          <div className="s9a-deck-head">
            <div className="s9a-deck-title-group">
              <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--ink)' }}>
                Rổ Nguyện vọng 3 Tầng của bạn ({aspState.aspirations.length}/3)
              </h2>
              <span className={`s9a-health-pill tone-${portfolioHealth.statusTone}`}>
                Độ an toàn hồ sơ: {portfolioHealth.healthScore}/100 · {portfolioHealth.statusLabel}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="s9c-primary-btn"
                style={{ padding: '0.48rem 0.95rem', fontSize: '0.78rem', borderRadius: 11 }}
                onClick={handleAutoBuild3TierPortfolio}
              >
                ★ Tự động gợi ý Rổ 3 NV Vàng ({effectiveScore ?? 25.0}đ)
              </button>
              <button
                type="button"
                className="s9c-ghost-btn"
                style={{ padding: '0.46rem 0.85rem', fontSize: '0.77rem', borderRadius: 11 }}
                onClick={() => setPortfolioModalOpen(true)}
              >
                So sánh Đối đầu 2 Ngành
              </button>
              <button
                type="button"
                className="s9c-ghost-btn"
                style={{ padding: '0.46rem 0.85rem', fontSize: '0.77rem', borderRadius: 11 }}
                onClick={() => setCareerOpen(true)}
              >
                Test nhanh RIASEC 30s
              </button>
            </div>
          </div>

          {/* Cảnh báo nghịch đảo thứ tự ưu tiên nếu có */}
          {portfolioHealth.hasInversion && (
            <div
              role="alert"
              style={{
                marginBottom: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 13,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, flex: '1 1 320px' }}>
                <b>⚠ Phát hiện Nghịch đảo thứ tự Nguyện vọng:</b> Một nguyện vọng xếp trước đang có điểm chuẩn thấp hơn nguyện vọng xếp sau. Theo quy chế lọc ảo Bộ GD&amp;ĐT, khi đỗ NV trên thì các NV dưới sẽ tự động bị hủy!
              </div>
              <button
                type="button"
                onClick={handleFixInversion}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Sắp xếp lại chuẩn Bộ GD&amp;ĐT (Cao → Thấp)
              </button>
            </div>
          )}

          {/* 3 Khe Nguyện vọng NV1 - NV2 - NV3 */}
          <div className="s9a-slots-grid">
            {[1, 2, 3].map((slotNum) => {
              const asp = aspState.aspirations.find((a) => a.priority === slotNum);
              const roleHint =
                slotNum === 1
                  ? 'Tầng 1 · Mơ ước / Trọng tâm'
                  : slotNum === 2
                    ? 'Tầng 2 · Vừa sức cạnh tranh'
                    : 'Tầng 3 · Phao bảo hiểm an toàn';

              if (!asp) {
                return (
                  <div key={slotNum} className="s9a-slot-card is-empty">
                    <span className={`s9a-nv-badge nv-${slotNum}`}>NV{slotNum} · Trống</span>
                    <small style={{ fontSize: '0.76rem', color: 'var(--mut)', fontWeight: 600 }}>
                      {roleHint}
                    </small>
                    <button
                      type="button"
                      className="s9c-nv-btn"
                      onClick={() => setTutorModalOpen(true)}
                    >
                      + Chọn trường cho NV{slotNum}
                    </button>
                  </div>
                );
              }

              const chance = computeMajorAdmissionChance(
                effectiveScore ?? 25.0,
                asp.cutoffScore ?? 25.0
              );

              return (
                <div key={asp.id || slotNum} className="s9a-slot-card is-filled">
                  <div>
                    <div className="s9a-slot-top">
                      <span className={`s9a-nv-badge nv-${slotNum}`}>
                        NV{slotNum} · {asp.school?.code}
                      </span>
                      {chance && (
                        <span className={`s9a-tier-tag is-${chance.tier}`}>
                          {chance.chancePct}% đỗ · {chance.badgeLabel}
                        </span>
                      )}
                    </div>
                    <b
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        color: 'var(--ink)',
                        marginTop: '0.4rem',
                        lineHeight: 1.35,
                      }}
                    >
                      {asp.major?.name}
                    </b>
                    <span style={{ fontSize: '0.76rem', color: 'var(--mut)' }}>
                      {asp.school?.name}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.4rem',
                      paddingTop: '0.45rem',
                      borderTop: '1px solid var(--line, rgba(100,120,180,0.14))',
                      fontSize: '0.74rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>
                      Khối <b>{asp.block}</b> · Chuẩn <b>{asp.cutoffScore ?? '—'}đ</b>
                    </span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        type="button"
                        className="s9c-nv-btn"
                        onClick={() => setDetailSchoolId(asp.school?.id || asp.school?.code)}
                      >
                        Đề án
                      </button>
                      <button
                        type="button"
                        className="s9c-nv-btn"
                        onClick={() => goPracticeForMethods([asp.examId || 'THPTQG'])}
                      >
                        Luyện đề
                      </button>
                      <button
                        type="button"
                        className="s9c-nv-btn"
                        style={{ color: '#dc2626' }}
                        onClick={() => setAspState(deleteAspiration(uid, asp.id))}
                        title="Xóa nguyện vọng này"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. TRẠM TÍNH ĐIỂM ƯU TIÊN CHUẨN BỘ GD&ĐT & QUY ĐỔI ĐA KỲ THI ── */}
        <section className="s9a-calc-workbench" aria-label="Bộ tính điểm xét tuyển chuẩn Quy chế Bộ GD&ĐT">
          <div className="s9a-calc-grid">
            {/* CỘT TRÁI: NHẬP ĐIỂM + KHU VỰC + ĐỐI TƯỢNG + IELTS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="ns9-adm-myscore-badge" style={{ fontSize: '0.84rem' }}>
                    {effectiveScore != null
                      ? `Điểm xét tuyển chính thức: ${effectiveScore}/30đ`
                      : 'Chưa có điểm — Nhập thử điểm bên dưới'}
                  </span>
                  {priorityCalc && (priorityCalc.effectivePriority > 0 || priorityCalc.extraBonus > 0) && (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#059669',
                        background: 'rgba(16,185,129,0.12)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 999,
                      }}
                    >
                      Gốc {priorityCalc.rawScore30}đ + ƯT {priorityCalc.effectivePriority}đ
                      {priorityCalc.extraBonus > 0 ? ` + IELTS ${priorityCalc.extraBonus}đ` : ''}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="s9c-nv-btn"
                  onClick={() => setUse3Subjects((v) => !v)}
                >
                  {use3Subjects ? 'Chuyển sang Nhập tổng điểm /30' : 'Nhập lẻ 3 môn (M1 + M2 + M3)'}
                </button>
              </div>

              <div className="s9a-inputs-row">
                {!use3Subjects ? (
                  <div className="s9a-field">
                    <label>Điểm 3 môn (/30)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      step="0.1"
                      value={customScore}
                      onChange={(e) => setCustomScore(e.target.value)}
                      placeholder={myAvg != null ? `Điểm thật: ${myAvg}` : 'VD: 25.5'}
                      aria-label="Nhập điểm giả định trên thang 30"
                    />
                  </div>
                ) : (
                  [0, 1, 2].map((i) => (
                    <div key={i} className="s9a-field">
                      <label>Môn {i + 1} (/10)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.25"
                        value={subScores[i]}
                        onChange={(e) => {
                          const next = [...subScores];
                          next[i] = e.target.value;
                          setSubScores(next);
                        }}
                      />
                    </div>
                  ))
                )}

                <div className="s9a-field">
                  <label>Khu vực (KV)</label>
                  <select value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Chọn khu vực ưu tiên">
                    {MOET_PRIORITY_AREAS.map((a) => (
                      <option key={a.id} value={a.id}>{a.short}</option>
                    ))}
                  </select>
                </div>

                <div className="s9a-field">
                  <label>Đối tượng (ĐT)</label>
                  <select value={prioGroupId} onChange={(e) => setPrioGroupId(e.target.value)} aria-label="Chọn đối tượng ưu tiên">
                    {MOET_PRIORITY_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>{g.short}</option>
                    ))}
                  </select>
                </div>

                {!use3Subjects && (
                  <div className="s9a-field">
                    <label>Quy đổi IELTS</label>
                    <select value={ieltsBand} onChange={(e) => setIeltsBand(e.target.value)} aria-label="Chọn mức IELTS">
                      {IELTS_CONVERSION_TABLE.map((it) => (
                        <option key={it.band} value={it.band}>
                          {it.label} {it.bonus30 > 0 ? `(+${it.bonus30}đ)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {priorityCalc && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--mut, #64748b)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span>
                    <b>Quy chế Bộ GD&amp;ĐT:</b> {priorityCalc.formulaNote}
                  </span>
                  {(customScore || areaId !== 'KV3' || prioGroupId !== 'NONE' || ieltsBand !== 'none') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomScore('');
                        setAreaId('KV3');
                        setPrioGroupId('NONE');
                        setIeltsBand('none');
                        setUse3Subjects(false);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: 0,
                      }}
                    >
                      Đặt lại mặc định
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: BẢNG QUY ĐỔI TƯƠNG ĐƯƠNG 6 KỲ THI THEO PHÂN VỊ */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <b style={{ fontSize: '0.78rem', color: 'var(--ink)' }}>
                  Quy đổi tương đương 6 Kỳ thi (Phân vị quốc gia):
                </b>
                {examEquivalence && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed' }}>
                    Top {examEquivalence.topPercent}% Toàn quốc
                  </span>
                )}
              </div>

              {examEquivalence && (
                <div className="s9a-equiv-strip">
                  <div className="s9a-equiv-cell">
                    <small>THPTQG (/30)</small>
                    <b style={{ color: '#2563eb' }}>{examEquivalence.equivalents.THPTQG}đ</b>
                  </div>
                  <div className="s9a-equiv-cell">
                    <small>ĐGNL HSA (/150)</small>
                    <b>~{examEquivalence.equivalents.HSA}đ</b>
                  </div>
                  <div className="s9a-equiv-cell">
                    <small>ĐGTD TSA (/100)</small>
                    <b>~{examEquivalence.equivalents.TSA}đ</b>
                  </div>
                  <div className="s9a-equiv-cell">
                    <small>V-ACT HCM (/1200)</small>
                    <b>~{examEquivalence.equivalents['V-ACT']}đ</b>
                  </div>
                  <div className="s9a-equiv-cell">
                    <small>ĐHSP SPT (/30)</small>
                    <b>~{examEquivalence.equivalents.SPT}đ</b>
                  </div>
                  <div className="s9a-equiv-cell">
                    <small>H-SCA HCM (/100)</small>
                    <b>~{examEquivalence.equivalents['H-SCA']}đ</b>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="ns9-adm-notice">
          <IconAlert size={16} />
          <small>
            Số liệu <b>tham khảo 2024–2025 &amp; Đề án 2026</b> tổng hợp từ công bố công khai của 105 trường ĐH — luôn đối chiếu thông báo chính thức của trường trước khi chốt nguyện vọng trên Cổng Bộ GD&amp;ĐT.
          </small>
        </div>

        {/* ── 4. BỘ LỌC ĐA TẦNG KIỂU 9STUDY + CHUYỂN ĐỔI 105 TRƯỜNG ── */}
        <div className="ns9-adm-filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm trường, mã trường (BKA, NEU, FTU, YHA, HCMUE, UIT, ANND), ngành, mã ngành (7480201), tổ hợp (A00, B00, X06)…"
            className="ns9-adm-search"
          />
          <div className="ns9-adm-selects">
            <select
              value={catalogScope}
              onChange={(e) => setCatalogScope(e.target.value)}
              style={selStyle}
              aria-label="Chọn phạm vi trường đại học"
            >
              <option value="all105">Toàn bộ 105 Trường ĐH ({unifiedCatalog.length} ngành)</option>
              <option value="flagship">Trường Trọng Điểm ({CUTOFF_DATA.length} ngành hot)</option>
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={selStyle} aria-label="Lọc theo khu vực">
              {LOCATION_FILTERS.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  Chỉ hiện An toàn (≥70% đỗ)
                </button>
                <button
                  type="button"
                  className={`s9-adm-pill is-fit ${fitFilter === 'near' ? 'active' : ''}`}
                  onClick={() => setFitFilter((f) => (f === 'near' ? 'all' : 'near'))}
                >
                  Vừa sức &amp; Sát chuẩn
                </button>
                <button
                  type="button"
                  className={`s9-adm-pill is-fit ${fitFilter === 'reach' ? 'active' : ''}`}
                  onClick={() => setFitFilter((f) => (f === 'reach' ? 'all' : 'reach'))}
                >
                  Tầng Mơ ước (+0.5 → +1.7đ)
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── 5. DANH SÁCH TRƯỜNG & NGÀNH CHUẨN 9STUDY BENTO ── */}
        {unis.length === 0 ? (
          <div className="s9c-card" style={{ padding: '2.2rem', textAlign: 'center', color: 'var(--mut, #64748b)' }}>
            Không tìm thấy kết quả phù hợp. Thử mở rộng bộ lọc hoặc chuyển sang <b>Toàn bộ 105 Trường ĐH</b> nhé!
          </div>
        ) : (
          unis.map((u) => {
            const uniRows = rows.filter((r) => r.uni === u);
            const firstRow = uniRows[0];
            const schKey = firstRow?.schoolId || firstRow?.code;
            const uniInfo = getUniversityInfo(schKey);
            const uniCover = getUniversityCover(schKey);
            return (
              <div key={u} className="ns9-adm-unicard s9c-card" style={{ padding: 0, marginBottom: '0.9rem', overflow: 'hidden' }}>
                <div className="ns9-adm-unihead" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div className="s9-adm-uni-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={uniCover}
                      alt={u}
                      loading="lazy"
                      onClick={() => setDetailSchoolId(schKey)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/img/universities/neu.webp';
                      }}
                      style={{
                        width: 64,
                        height: 44,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid var(--line, rgba(100,120,180,0.2))',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {firstRow?.code && <span className="s9-adm-unicode">{firstRow.code}</span>}
                        <b
                          style={{ cursor: 'pointer' }}
                          onClick={() => setDetailSchoolId(schKey)}
                        >
                          {u}
                        </b>
                        {firstRow?.type && (
                          <small style={{ fontSize: '0.72rem', color: 'var(--mut)', fontWeight: 600 }}>
                            · {firstRow.type}
                          </small>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--mut, #64748b)', marginTop: 2 }}>
                        {uniInfo?.location || firstRow?.city}
                        {uniInfo?.foundedYear ? ` · Thành lập ${uniInfo.foundedYear}` : ''}
                        {uniInfo?.studentScale ? ` · ${uniInfo.studentScale}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>{firstRow?.city}</span>
                    <button
                      type="button"
                      className="s9c-nv-btn"
                      style={{ color: '#2563eb', borderColor: 'rgba(37,99,235,0.28)' }}
                      onClick={() => setDetailSchoolId(schKey)}
                    >
                      Đề án 2026 &amp; Hồ sơ trường ↗
                    </button>
                  </div>
                </div>

                {uniRows.map((r, i) => {
                  const cutoff = r.s2025 ?? r.s2024;
                  const chance = computeMajorAdmissionChance(effectiveScore, cutoff);
                  const f = evaluateAdmissionFit(effectiveScore, cutoff);
                  const delta =
                    r.s2025 != null && r.s2024 != null
                      ? Number((r.s2025 - r.s2024).toFixed(2))
                      : null;
                  const isPinnedNv1 = isPinnedInSlot(r, 1) || targetMajor?.id === r.id;

                  return (
                    <div
                      key={r.id || i}
                      className={`ns9-adm-row s9-adm-row ${isPinnedNv1 ? 'is-pinned' : ''}`}
                      style={{ borderTop: i > 0 ? '1px solid var(--line-soft, rgba(100,120,180,.08))' : 'none' }}
                    >
                      <div className="ns9-adm-major">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <b>{r.major}</b>
                          {r.majorCode && (
                            <code style={{ fontSize: '0.71rem', padding: '1px 6px', borderRadius: 6, background: 'var(--surface-2, #f1f5f9)', color: 'var(--mut)' }}>
                              Mã: {r.majorCode}
                            </code>
                          )}
                        </div>
                        <div className="s9-adm-row-meta">
                          <span>Tổ hợp: <b>{r.combo}</b></span>
                          {(r.methods || []).map((m) => (
                            <span key={m} className="s9-adm-method-tag">{m}</span>
                          ))}
                          {r.tuition && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--mut)' }}>
                              · Học phí: {r.tuition}
                            </span>
                          )}
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
                        <small>
                          2024: {r.s2024 ?? '—'}
                          {r.hsa2025 ? ` · HSA: ${r.hsa2025}` : ''}
                          {r.tsa2025 ? ` · TSA: ${r.tsa2025}` : ''}
                          {r.vact2025 ? ` · V-ACT: ${r.vact2025}` : ''}
                        </small>
                      </div>

                      <div className="s9-adm-row-actions">
                        {chance ? (
                          <span className={'ns9-adm-fit ' + (chance.status === 'safe' ? 'is-ok' : chance.status === 'near' ? 'is-near' : 'is-far')}>
                            {chance.text}
                          </span>
                        ) : f ? (
                          <span className={'ns9-adm-fit ' + (f.status === 'safe' ? 'is-ok' : f.status === 'near' ? 'is-near' : 'is-far')}>
                            {f.text}
                          </span>
                        ) : null}

                        <div className="s9-adm-btn-pair" style={{ display: 'flex', gap: '0.28rem', flexWrap: 'wrap' }}>
                          {[1, 2, 3].map((slotNum) => {
                            const active = isPinnedInSlot(r, slotNum) || (slotNum === 1 && targetMajor?.id === r.id);
                            return (
                              <button
                                key={slotNum}
                                type="button"
                                className={`s9-adm-mini-btn ${active ? 'is-pinned' : ''}`}
                                onClick={() =>
                                  slotNum === 1 && active
                                    ? handlePinTarget(r)
                                    : handlePinToSlot(r, slotNum)
                                }
                                title={`Đặt làm Nguyện vọng ${slotNum} (NV${slotNum})`}
                              >
                                {active ? `★ NV${slotNum}` : `NV${slotNum}`}
                              </button>
                            );
                          })}
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

      {/* Modal Trắc nghiệm RIASEC nhanh 30 giây */}
      <CareerFitModal
        open={careerOpen}
        onClose={() => setCareerOpen(false)}
        predictedScore30={effectiveScore}
        onPinTarget={(rec) => handlePinToSlot(rec, 1)}
      />

      {/* Modal Đề án Tuyển sinh 2026 chi tiết của từng trường */}
      <UniversityDetailModal
        open={Boolean(detailSchoolId)}
        schoolId={detailSchoolId || 'NEU'}
        uid={uid}
        onClose={() => setDetailSchoolId(null)}
      />

      {/* Modal Khám Sức Khỏe Rổ Nguyện Vọng & So Sánh Đối Đầu 2 Ngành */}
      <AspirationPortfolioModal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        aspirations={aspState.aspirations}
        predictedScore={effectiveScore ?? 25.0}
        examScale={30}
      />

      {/* Modal ELEC Tutor Chọn Nguyện Vọng Từng Bước */}
      <ElecTutorOnboardingModal
        open={tutorModalOpen}
        uid={uid}
        onClose={() => setTutorModalOpen(false)}
        onCompleted={(updated) => setAspState(updated)}
      />
    </div>
  );
}

const selStyle = {
  padding: '.55rem 1rem',
  borderRadius: 999,
  border: '1px solid var(--line, rgba(100,120,180,.16))',
  background: 'var(--surface, #fff)',
  color: 'var(--ink)',
  font: '600 .8rem var(--sans)',
  outline: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  minWidth: 162,
};
