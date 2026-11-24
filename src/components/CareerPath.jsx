/* ============================================================
   CareerPath.jsx — TRẠM ĐỊNH HƯỚNG NGHỀ NGHIỆP & CHỌN TRƯỜNG AI (9STUDY PRO)
   ------------------------------------------------------------
   - Mô hình chuẩn quốc tế Holland RIASEC (6 trục) × 11 môn GDPT 2018 × Điểm thật (/30)
   - 2 Chế độ test: Chuyên sâu 24 câu (nhóm 4 câu/trang hoặc từng câu) & Chẩn đoán nhanh 60s (6 câu)
   - Biểu đồ Radar Lục giác 6 trục SVG tương tác thời gian thực
   - Báo cáo khoa học đầy đủ cho 100% học sinh + Phân tích AI chuyên sâu cá nhân hóa
   - Ghim trực tiếp ngành/trường gợi ý vào NV1 / NV2 / NV3 (đồng bộ Navbar & #admission)
   - Xem trực tiếp Đề án Tuyển sinh 2026 (UniversityDetailModal) ngay trong báo cáo
   ============================================================ */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { resolveEntitlements } from '../lib/entitlements.js';
import { askAI } from '../lib/ai.js';
import { askAI as openChatWithAI } from './HomePlus.jsx';
import { runWithCredit, CREDIT_TARIFF } from '../lib/creditService.js';
import { useLocalStorage } from '../hooks.js';
import { supabase } from '../lib/supabase.js';
import { getVirtualExamHistory } from '../data/virtualExamsBank.js';
import { getStudentElo } from '../lib/studentAnalytics.js';
import {
  getUserAspirationsState,
  subscribeAspirationChanges,
  getUnifiedAdmissionCatalog,
} from '../lib/aspirationService.js';
import {
  RIASEC_DIMENSIONS,
  QUICK_RIASEC_QUESTIONS,
  GDPT2018_SUBJECTS,
  inferOptimalBlocksFromSubjects,
  buildDeepRiasecReport,
  pinMajorToAspirationSlot,
} from '../lib/admissionCareerEngine.js';
import UniversityDetailModal from './aspiration/UniversityDetailModal.jsx';
import { IconTarget, IconRobot, IconArrowUpRight } from './Icons.jsx';
import '../styles/student-v9-upgrades.css';
import '../styles/career-admission-9study.css';

const LIKERT_SCALE = [
  { val: 1, label: 'Rất không thích', short: '1 · Không' },
  { val: 2, label: 'Ít hứng thú', short: '2 · Ít' },
  { val: 3, label: 'Bình thường', short: '3 · Vừa' },
  { val: 4, label: 'Khá thích', short: '4 · Thích' },
  { val: 5, label: 'Rất đam mê', short: '5 · Rất mê' },
];

const CAREER_GOALS = [
  'Công việc lương cao & ổn định tại tập đoàn công nghệ / tài chính',
  'Làm chủ công nghệ lõi (AI, Bán dẫn, Khoa học dữ liệu, Kỹ thuật)',
  'Giúp đỡ cộng đồng, cứu chữa bệnh nhân hoặc đào tạo thế hệ trẻ (Y Dược / Sư phạm)',
  'Dẫn dắt đội ngũ, kinh doanh thương mại quốc tế hoặc tự khởi nghiệp',
  'Nghiên cứu khoa học chuyên sâu tại phòng Lab, viện nghiên cứu hoặc du học',
  'Tự do sáng tạo thiết kế, truyền thông đa phương tiện & nghệ thuật số',
];

const REGIONS = ['Tất cả', 'Miền Bắc', 'Miền Nam', 'Miền Trung'];

/* ── Biểu đồ Radar Lục Giác 6 Trục Holland RIASEC (SVG Thuần Nét Cao) ── */
function RiasecRadarSvg({ scores = {}, maxVal = 20, size = 240 }) {
  const vw = size + 90;
  const vh = size + 16;
  const cx = vw / 2;
  const cy = vh / 2;
  const radius = size * 0.32;
  const axes = RIASEC_DIMENSIONS;

  const pointAt = (idx, ratio) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / 6;
    return {
      x: cx + radius * ratio * Math.cos(angle),
      y: cy + radius * ratio * Math.sin(angle),
    };
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const safeMax = Math.max(1, maxVal);

  const dataPts = axes.map((a, idx) => {
    const raw = Number(scores[a.k]) || 0;
    const ratio = Math.min(1, Math.max(0.12, raw / safeMax));
    return { ...pointAt(idx, ratio), raw, dim: a };
  });

  const polygonPoints = dataPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      width="100%"
      height={vh}
      viewBox={`0 0 ${vw} ${vh}`}
      role="img"
      aria-label="Biểu đồ Radar Lục giác 6 trục Holland RIASEC"
      style={{ display: 'block', margin: '0 auto', maxWidth: vw }}
    >
      <defs>
        <linearGradient id="s9cRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* Lưới lục giác đồng tâm */}
      {rings.map((r) => {
        const pts = axes
          .map((_, idx) => {
            const p = pointAt(idx, r);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={r}
            points={pts}
            fill="none"
            stroke="var(--line, rgba(100, 120, 180, 0.22))"
            strokeWidth={r === 1 ? '1.4' : '1'}
            strokeDasharray={r < 1 ? '3 3' : undefined}
          />
        );
      })}

      {/* 6 trục từ tâm */}
      {axes.map((a, idx) => {
        const end = pointAt(idx, 1);
        const lbl = pointAt(idx, 1.24);
        return (
          <g key={a.k}>
            <line
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--line, rgba(100, 120, 180, 0.24))"
              strokeWidth="1"
            />
            <text
              x={lbl.x}
              y={lbl.y}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                fill: a.color,
                fontFamily: 'var(--sans, sans-serif)',
              }}
            >
              {a.shortName}
            </text>
          </g>
        );
      })}

      {/* Đa giác dữ liệu của học sinh */}
      <polygon
        points={polygonPoints}
        fill="url(#s9cRadarFill)"
        stroke="#2563eb"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Các đỉnh dữ liệu */}
      {dataPts.map((p) => (
        <circle
          key={p.dim.k}
          cx={p.x}
          cy={p.y}
          r="4.5"
          fill={p.dim.color}
          stroke="#ffffff"
          strokeWidth="1.8"
        />
      ))}
    </svg>
  );
}

export default function CareerPath() {
  const { user, tier } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const pro = useTeacherPro();
  const isVip = resolveEntitlements({ user, pro, tier }).hasVipAccess;

  // Đồng bộ dữ liệu học sinh thật từ ELEC AI
  const [aspState, setAspState] = useState(() => getUserAspirationsState(uid));
  const [myRealScore30, setMyRealScore30] = useState(null);
  const [customScore30, setCustomScore30] = useState(25.5);
  const [useCustomScore, setUseCustomScore] = useState(false);

  // Chế độ làm bài test: 'deep' (24 câu chuẩn Holland) | 'quick' (6 câu 60 giây)
  const [testMode, setTestMode] = useState('deep');
  // Kiểu hiển thị trong chế độ 24 câu: 'paged' (6 nhóm x 4 câu) | 'single' (từng câu 1..24)
  const [viewStyle, setViewStyle] = useState('paged');
  const [step, setStep] = useState('intro'); // 'intro' | 'test' | 'profile_step' | 'loading' | 'report'
  const [groupPageIdx, setGroupPageIdx] = useState(0); // 0..5 cho 6 nhóm R-I-A-S-E-C
  const [singleQIdx, setSingleQIdx] = useState(0); // 0..23
  const [quickStepIdx, setQuickStepIdx] = useState(0); // 0..5

  const [answers, setAnswers] = useState({});
  const [quickAnswers, setQuickAnswers] = useState([]);
  const [subjects, setSubjects] = useState(['Toán', 'Vật lý', 'Hóa học']);
  const [preferredRegion, setPreferredRegion] = useState('Tất cả');
  const [goal, setGoal] = useState(CAREER_GOALS[0]);

  const [activeExplorerDim, setActiveExplorerDim] = useState('I');
  const [reportTierFilter, setReportTierFilter] = useState('all'); // 'all' | 'safety' | 'target' | 'reach'
  const [pinToast, setPinToast] = useState('');
  const [detailSchoolId, setDetailSchoolId] = useState(null);

  const [savedReport, setSavedReport] = useLocalStorage('cs-career-report', null);
  const [aiNarrative, setAiNarrative] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const catalog = useMemo(() => getUnifiedAdmissionCatalog(), []);
  const studentElo = useMemo(() => getStudentElo(uid), [uid]);

  useEffect(() => {
    setAspState(getUserAspirationsState(uid));
    return subscribeAspirationChanges(() => {
      setAspState(getUserAspirationsState(uid));
    });
  }, [uid]);

  // Lấy điểm thi thử thật từ Phòng thi ảo & Supabase
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
            .limit(40);
          (data || [])
            .filter((r) => (r.total_questions || 0) > 0)
            .forEach((r) => combined.push((r.correct_count / r.total_questions) * 30));
        } catch { /* offline fallback */ }
      }
      if (active && combined.length > 0) {
        const avg = Math.round((combined.reduce((s, v) => s + v, 0) / combined.length) * 10) / 10;
        setMyRealScore30(avg);
        setCustomScore30(avg);
      }
    })();

    return () => { active = false; };
  }, [uid, user?.uid, user?.id]);

  const effectiveScore30 = useCustomScore
    ? customScore30
    : (myRealScore30 ?? customScore30);

  // Danh sách 24 câu phẳng
  const all24Qs = useMemo(
    () =>
      RIASEC_DIMENSIONS.flatMap((g, gIdx) =>
        g.qs.map((q, qIdx) => ({
          idx: gIdx * 4 + qIdx,
          g: g.k,
          groupName: g.name,
          color: g.color,
          q,
        }))
      ),
    []
  );

  // Điểm 6 trục tính theo chế độ đang chọn
  const currentRiasecScores = useMemo(() => {
    const s = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    if (testMode === 'quick') {
      quickAnswers.forEach((optIdx, qIdx) => {
        const weights = QUICK_RIASEC_QUESTIONS[qIdx]?.options?.[optIdx]?.weights || {};
        Object.entries(weights).forEach(([k, v]) => {
          s[k] = (s[k] || 0) + Number(v);
        });
      });
    } else {
      for (const [qIndex, val] of Object.entries(answers)) {
        const g = all24Qs[Number(qIndex)]?.g;
        if (g) s[g] += Number(val) || 0;
      }
    }
    return s;
  }, [testMode, answers, quickAnswers, all24Qs]);

  const optimalBlocks = useMemo(() => inferOptimalBlocksFromSubjects(subjects), [subjects]);

  // Xây dựng báo cáo đầy đủ từ dữ liệu hiện tại hoặc báo cáo đã lưu
  const computedReport = useMemo(() => {
    const baseScores =
      savedReport?.profile?.scores && Object.values(currentRiasecScores).every((v) => v === 0)
        ? savedReport.profile.scores
        : currentRiasecScores;

    return buildDeepRiasecReport({
      riasecScores: baseScores,
      subjects: subjects.length ? subjects : savedReport?.profile?.subjects || ['Toán', 'Vật lý', 'Hóa học'],
      goal: goal || savedReport?.profile?.goal || CAREER_GOALS[0],
      predictedScore30: effectiveScore30,
      preferredRegion,
      cutoffCatalog: catalog,
    });
  }, [currentRiasecScores, savedReport, subjects, goal, effectiveScore30, preferredRegion, catalog]);

  const toggleSubject = (subjId) => {
    setSubjects((prev) =>
      prev.includes(subjId) ? prev.filter((x) => x !== subjId) : [...prev, subjId]
    );
  };

  const handleStartTest = (mode = testMode) => {
    setTestMode(mode);
    if (mode === 'quick') {
      setQuickAnswers([]);
      setQuickStepIdx(0);
    } else {
      setGroupPageIdx(0);
      setSingleQIdx(0);
    }
    setStep('test');
  };

  const handleLoadSampleReport = () => {
    const sampleScores = { I: 19, R: 17, C: 14, S: 11, E: 10, A: 8 };
    const built = buildDeepRiasecReport({
      riasecScores: sampleScores,
      subjects: ['Toán', 'Vật lý', 'Hóa học', 'Tin học'],
      goal: CAREER_GOALS[0],
      predictedScore30: effectiveScore30,
      preferredRegion,
      cutoffCatalog: catalog,
    });
    setAnswers({
      0: 4, 1: 5, 2: 4, 3: 4,
      4: 5, 5: 5, 6: 5, 7: 4,
      8: 2, 9: 2, 10: 2, 11: 2,
      12: 3, 13: 3, 14: 3, 15: 2,
      16: 3, 17: 2, 18: 2, 19: 3,
      20: 4, 21: 4, 22: 3, 23: 3,
    });
    setSavedReport({
      ...built,
      at: Date.now(),
      profile: { scores: sampleScores, subjects: ['Toán', 'Vật lý', 'Hóa học', 'Tin học'], goal: CAREER_GOALS[0] },
    });
    setStep('report');
  };

  const finalizeReport = () => {
    const built = buildDeepRiasecReport({
      riasecScores: currentRiasecScores,
      subjects,
      goal,
      predictedScore30: effectiveScore30,
      preferredRegion,
      cutoffCatalog: catalog,
    });
    setSavedReport({
      ...built,
      at: Date.now(),
      profile: {
        scores: currentRiasecScores,
        subjects,
        goal,
        predictedScore30: effectiveScore30,
        preferredRegion,
      },
    });
    setStep('report');
  };

  // Gọi AI tạo thêm bản phân tích chuyên sâu cá nhân hóa (tùy chọn trên màn hình Báo cáo)
  const handleAskDeepAiAnalysis = async () => {
    setAiLoading(true);
    setAiNarrative('');
    const prompt =
      `Học sinh lớp 12 Việt Nam có kết quả trắc nghiệm Holland RIASEC: Mã ${computedReport.hollandCode} ` +
      `(${computedReport.dimensions.map((d) => `${d.k}=${d.pct}%`).join(', ')}). ` +
      `Môn học thế mạnh: ${subjects.join(', ')}. Tổ hợp tối ưu: ${computedReport.optimalBlocks.map((b) => b.code).join(', ')}. ` +
      `Điểm năng lực hiện tại: ${effectiveScore30}/30. Khu vực ưu tiên: ${preferredRegion}. Mục tiêu: ${goal}. ` +
      `Hãy viết bản tư vấn hướng nghiệp chuyên sâu (khoảng 180-250 từ, chia 3 gạch đầu dòng rõ ràng): ` +
      `1) Giải mã điểm mạnh độc bản & nghề nghiệp hợp nhất giai đoạn 2026-2035; ` +
      `2) Chiến thuật chọn tổ hợp & rổ 3 nguyện vọng (Mơ ước - Vừa sức - An toàn) sát với mức điểm ${effectiveScore30}/30; ` +
      `3) Lộ trình ôn thi và kỹ năng cần chuẩn bị ngay trong tuần này.`;

    try {
      await runWithCredit(
        {
          userId: user?.uid,
          cost: CREDIT_TARIFF.CAREER_REPORT,
          actionType: 'career_report',
          reason: 'Báo cáo cố vấn hướng nghiệp AI chuyên sâu 1-1',
        },
        async () => {
          let full = '';
          const res = await askAI(
            [{ role: 'user', text: prompt }],
            (chunk) => {
              full = chunk || '';
              setAiNarrative(full);
            },
            null,
            'Bạn là Chuyên gia Cố vấn Hướng nghiệp & Tuyển sinh Đại học hàng đầu Việt Nam (chuẩn 9Study & ELEC AI).'
          );
          if (res?.text) full = res.text;
          if (!full.trim()) {
            throw new Error('AI tạm bận, số dư ELEC Credit của bạn không bị trừ.');
          }
          setAiNarrative(full);
          return full;
        }
      );
    } catch (e) {
      setAiNarrative(
        e?.message ||
          'Hệ thống AI đang bận, bạn vẫn có thể xem toàn bộ báo cáo định lượng RIASEC & danh sách trường đại học bên dưới (không trừ Credit).'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handlePinMajorToSlot = (majorRow, slotPriority = 1) => {
    const nextState = pinMajorToAspirationSlot(uid, majorRow, slotPriority, 'THPTQG');
    if (nextState) setAspState(nextState);
    setPinToast(`Đã ghim "${majorRow.major} — ${majorRow.uni}" vào Nguyện vọng ${slotPriority} (NV${slotPriority})!`);
    setTimeout(() => setPinToast(''), 3800);
  };

  const isPinnedInSlot = (majorRow, slotPriority) => {
    const slotAsp = aspState?.aspirations?.find((a) => a.priority === slotPriority);
    if (!slotAsp) return false;
    return (
      slotAsp.majorId === majorRow.id ||
      (slotAsp.school?.code === majorRow.code && slotAsp.major?.name === majorRow.major)
    );
  };

  const explorerDimObj =
    RIASEC_DIMENSIONS.find((d) => d.k === activeExplorerDim) || RIASEC_DIMENSIONS[1];

  const answered24Count = Object.keys(answers).length;
  const currentGroupDim = RIASEC_DIMENSIONS[groupPageIdx] || RIASEC_DIMENSIONS[0];
  const currentGroupAnswered = [0, 1, 2, 3].every(
    (offset) => answers[groupPageIdx * 4 + offset] != null
  );

  const activeNv1 = aspState?.aspirations?.[0] || null;

  const filteredReportMajors = useMemo(() => {
    const list = computedReport.matchedMajors || [];
    if (reportTierFilter === 'all') return list;
    return list.filter((m) => m.admissionChance?.tier === reportTierFilter);
  }, [computedReport.matchedMajors, reportTierFilter]);

  return (
    <div className="s9c-page">
      <div className="s9c-wrap">
        {/* ── 1. HERO BANNER CHUẨN 9STUDY ── */}
        <div className="ns9-tool-hero tone-purple" style={{ marginBottom: '1rem' }}>
          <div className="ns9-th-left">
            <span className="ns9-th-badge">
              <IconTarget size={12} /> TRẮC NGHIỆM RIASEC · ĐỊNH HƯỚNG NGÀNH &amp; TRƯỜNG ĐẠI HỌC AI
            </span>
            <h1>Định hướng nghề nghiệp &amp; Chọn trường AI</h1>
            <p>
              Phân tích đa chiều theo chuẩn quốc tế <b>Holland RIASEC (6 trục)</b> kết hợp <b>11 môn học GDPT 2018</b> và <b>Điểm năng lực thực tế (/30)</b> để tìm đúng ngành, chọn đúng trường và lắp thẳng vào Rổ Nguyện vọng 1–2–3.
            </p>
            <div className="ns9-th-actions">
              <a href="#admission" className="ns9-th-pillbtn">
                Tra cứu điểm chuẩn &amp; Xét NV (105 trường) <IconArrowUpRight size={13} />
              </a>
              {savedReport && step !== 'report' && (
                <button
                  type="button"
                  className="ns9-th-pillbtn is-ghost"
                  onClick={() => setStep('report')}
                >
                  Xem báo cáo RIASEC đã lưu ({savedReport.hollandCode || 'Mới nhất'})
                </button>
              )}
              <button
                type="button"
                className="ns9-th-pillbtn is-ghost"
                onClick={() =>
                  openChatWithAI(
                    `Em muốn được tư vấn chọn ngành học và trường đại học phù hợp với tổ hợp ${optimalBlocks
                      .slice(0, 3)
                      .map((b) => b.code)
                      .join(', ')}, điểm dự kiến khoảng ${effectiveScore30}/30 theo xu hướng việc làm 2026–2030.`
                  )
                }
              >
                <IconRobot size={14} /> Nhờ Gia sư AI tư vấn 1-1
              </button>
            </div>
          </div>
          <img
            src="/img/elec/elec-think.png"
            alt="Bé Elec Hướng nghiệp"
            className="ns9-th-mascot"
            loading="eager"
          />
        </div>

        {/* ── 2. THANH CHỈ SỐ ĐỒNG BỘ HỒ SƠ HỌC SINH (4 THẺ KPI) ── */}
        <section className="s9c-live-strip" aria-label="Hồ sơ năng lực và hướng nghiệp hiện tại">
          <div className="s9c-stat-card" style={{ '--stat-accent': '#7c3aed' }}>
            <span className="s9c-stat-lbl">Mã Holland RIASEC</span>
            <div className="s9c-stat-val">
              <span>
                {savedReport?.hollandCode ||
                  (Object.values(currentRiasecScores).some((v) => v > 0)
                    ? computedReport.hollandCode
                    : 'Chưa làm test')}
              </span>
            </div>
            <span className="s9c-stat-sub">
              {savedReport ? 'Đã lưu hồ sơ tính cách nghề nghiệp' : 'Làm test 60s hoặc 24 câu để giải mã'}
            </span>
          </div>

          <div className="s9c-stat-card" style={{ '--stat-accent': '#2563eb' }}>
            <span className="s9c-stat-lbl">Điểm năng lực đối chiếu</span>
            <div className="s9c-stat-val">
              <span>{effectiveScore30}/30đ</span>
              <small style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>
                ELO {studentElo.elo}
              </small>
            </div>
            <span className="s9c-stat-sub">
              {myRealScore30 != null && !useCustomScore
                ? 'Đồng bộ từ lịch sử Phòng thi ảo ELEC AI'
                : 'Điểm giả định để lọc trường vừa sức'}
            </span>
          </div>

          <div className="s9c-stat-card" style={{ '--stat-accent': '#10b981' }}>
            <span className="s9c-stat-lbl">Tổ hợp tối ưu (GDPT 2018)</span>
            <div className="s9c-stat-val">
              <span>{optimalBlocks.slice(0, 3).map((b) => b.code).join(' · ')}</span>
            </div>
            <span className="s9c-stat-sub">
              Từ môn mạnh: {subjects.slice(0, 4).join(', ') || 'Toán, Lý, Hóa'}
            </span>
          </div>

          <div className="s9c-stat-card" style={{ '--stat-accent': '#f59e0b' }}>
            <span className="s9c-stat-lbl">Nguyện vọng 1 (NV1)</span>
            <div className="s9c-stat-val">
              <span>
                {activeNv1
                  ? `${activeNv1.school?.code} · ${activeNv1.major?.name}`
                  : 'Chưa ghim NV1'}
              </span>
            </div>
            <span className="s9c-stat-sub">
              {activeNv1
                ? `Mục tiêu ${activeNv1.targetScore}đ (Chuẩn ${activeNv1.cutoffScore ?? '—'}đ)`
                : 'Có thể ghim trực tiếp từ kết quả bên dưới'}
            </span>
          </div>
        </section>

        {/* Thông báo khi ghim NV1/NV2/NV3 thành công */}
        {pinToast && (
          <div
            role="status"
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1.1rem',
              borderRadius: 14,
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--ink, #065f46)',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span>✓ {pinToast}</span>
            <a
              href="#admission"
              style={{
                color: '#059669',
                fontWeight: 800,
                textDecoration: 'underline',
                fontSize: '0.8rem',
              }}
            >
              Mở Rổ Nguyện vọng &amp; Điểm chuẩn →
            </a>
          </div>
        )}

        {/* ============================================================
            MÀN HÌNH 1: INTRO — STUDIO KHÁM PHÁ NGHỀ NGHIỆP & BẮT ĐẦU TEST
            ============================================================ */}
        {step === 'intro' && (
          <div className="s9c-bento-grid">
            {/* CỘT TRÁI: CHỌN CHẾ ĐỘ TRẮC NGHIỆM + BỘ LỌC MÔN HỌC THẾ MẠNH */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="s9c-card">
                <div className="s9c-sec-head">
                  <h2 className="s9c-sec-title">1. Chọn chế độ Trắc nghiệm Holland RIASEC</h2>
                  <span className="s9c-badge-pill">Chuẩn tâm lý học John Holland</span>
                </div>

                <div className="s9c-mode-cards">
                  <button
                    type="button"
                    className={`s9c-mode-card ${testMode === 'deep' ? 'is-active' : ''}`}
                    onClick={() => setTestMode('deep')}
                  >
                    <div className="s9c-mode-top">
                      <span className="s9c-mode-tag is-pro">Khuyên dùng · Chuyên sâu</span>
                      <b style={{ fontSize: '0.76rem', color: '#2563eb' }}>24 câu (~4 phút)</b>
                    </div>
                    <h3>Bài test Holland RIASEC 24 câu</h3>
                    <p>
                      Đánh giá toàn diện 6 trục tính cách nghề nghiệp (4 câu/trục), kết hợp tổ hợp môn GDPT 2018 và điểm thi để gợi ý chính xác Top 3 nhóm ngành &amp; 12 trường ĐH.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`s9c-mode-card ${testMode === 'quick' ? 'is-active' : ''}`}
                    onClick={() => setTestMode('quick')}
                  >
                    <div className="s9c-mode-top">
                      <span className="s9c-mode-tag is-fast">Tốc độ · Thực chiến</span>
                      <b style={{ fontSize: '0.76rem', color: '#d97706' }}>6 câu (~60 giây)</b>
                    </div>
                    <h3>Chẩn đoán nhanh 6 tình huống</h3>
                    <p>
                      6 câu hỏi tình huống chọn đáp án trực tiếp giúp xác định nhanh Mã Holland 3 ký tự (VD: I-R-C) và lọc ngay các ngành Đại học hợp điểm nhất.
                    </p>
                  </button>
                </div>

                {/* Quy trình 3 bước minh bạch */}
                <div
                  style={{
                    padding: '0.9rem 1.05rem',
                    borderRadius: 16,
                    background: 'var(--surface-2, #f8fafc)',
                    border: '1px solid var(--line, rgba(100,120,180,0.16))',
                    marginBottom: '1.1rem',
                  }}
                >
                  <b style={{ fontSize: '0.84rem', color: 'var(--ink)' }}>
                    Lộ trình phân tích 3 tầng chuẩn 9Study × ELEC AI:
                  </b>
                  <ol
                    style={{
                      margin: '0.45rem 0 0',
                      paddingLeft: '1.2rem',
                      fontSize: '0.81rem',
                      lineHeight: 1.65,
                      color: 'var(--mut, #475569)',
                    }}
                  >
                    <li>
                      <b>Tầng 1 — Tố chất &amp; Đam mê:</b> Đo tỷ trọng 6 đỉnh lục giác Holland (Kỹ thuật, Nghiên cứu, Sáng tạo, Xã hội, Quản trị, Nghiệp vụ).
                    </li>
                    <li>
                      <b>Tầng 2 — Sở trường học thuật GDPT 2018:</b> Ghép môn mạnh thành tổ hợp xét tuyển có lợi thế cạnh tranh cao nhất (A00, A01, B00, D07, D01, X06, X26...).
                    </li>
                    <li>
                      <b>Tầng 3 — Đối chiếu Điểm chuẩn 105 Trường ĐH:</b> Phân tầng ngành gợi ý thành 3 nhóm <i>Mơ ước · Vừa sức · An toàn</i> theo điểm <b>/30</b> của bạn.
                    </li>
                  </ol>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="s9c-primary-btn"
                    onClick={() => handleStartTest(testMode)}
                  >
                    <span>
                      {testMode === 'deep'
                        ? 'Bắt đầu bài test 24 câu →'
                        : 'Bắt đầu chẩn đoán 60 giây →'}
                    </span>
                  </button>

                  {savedReport && (
                    <button
                      type="button"
                      className="s9c-ghost-btn"
                      onClick={() => setStep('report')}
                    >
                      Xem lại báo cáo lần trước ({savedReport.hollandCode})
                    </button>
                  )}

                  <button
                    type="button"
                    className="s9c-ghost-btn"
                    onClick={handleLoadSampleReport}
                    title="Xem ngay báo cáo mẫu chi tiết mà không cần chờ làm bài"
                  >
                    Xem thử Báo cáo mẫu (I-R-C)
                  </button>
                </div>
              </div>

              {/* BỘ KHÁM PHÁ NHANH: CHỌN MÔN MẠNH -> GỢI Ý TỔ HỢP & ĐIỂM ĐỐI CHIẾU */}
              <div className="s9c-card">
                <div className="s9c-sec-head">
                  <h2 className="s9c-sec-title">2. Chọn trước Môn học Thế mạnh &amp; Điểm dự kiến</h2>
                  <span className="s9c-badge-pill">11 môn GDPT 2018</span>
                </div>
                <p style={{ margin: '0 0 0.7rem', fontSize: '0.81rem', color: 'var(--mut, #64748b)' }}>
                  Chọn từ 3 môn học bạn tự tin nhất ở trường để hệ thống tự động tính tổ hợp xét tuyển tối ưu khi chấm báo cáo:
                </p>

                <div className="s9c-chip-row" style={{ marginBottom: '0.9rem' }}>
                  {GDPT2018_SUBJECTS.map((s) => {
                    const active = subjects.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSubject(s.id)}
                        style={{
                          padding: '0.42rem 0.85rem',
                          borderRadius: 999,
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          border: `1.5px solid ${active ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                          background: active ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface-2, #f8fafc)',
                          color: active ? '#2563eb' : 'var(--ink, #0f172a)',
                          transition: 'all 0.14s ease',
                        }}
                      >
                        {active ? '✓ ' : ''}{s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tổ hợp suy ra tự động */}
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    borderRadius: 14,
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8' }}>
                    Tổ hợp xét tuyển đề xuất cho bạn:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {optimalBlocks.map((b) => (
                      <span
                        key={b.code}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 8,
                          background: b.isFullMatch ? '#2563eb' : 'var(--surface, #fff)',
                          color: b.isFullMatch ? '#fff' : 'var(--ink)',
                          border: '1px solid rgba(37,99,235,0.25)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BẢN ĐỒ 6 NHÓM TÍNH CÁCH HOLLAND RIASEC TƯƠNG TÁC */}
            <div className="s9c-card">
              <div className="s9c-sec-head">
                <h2 className="s9c-sec-title">Cẩm nang 6 Nhóm Holland RIASEC</h2>
                <span className="s9c-badge-pill">Bấm để khám phá</span>
              </div>

              <div className="s9c-riasec-tabs" role="tablist" aria-label="6 nhóm tính cách Holland">
                {RIASEC_DIMENSIONS.map((d) => (
                  <button
                    key={d.k}
                    type="button"
                    role="tab"
                    aria-selected={activeExplorerDim === d.k}
                    className={`s9c-riasec-tab ${activeExplorerDim === d.k ? 'is-active' : ''}`}
                    style={{ '--dim-color': d.color, '--dim-soft': d.bgSoft }}
                    onClick={() => setActiveExplorerDim(d.k)}
                  >
                    <b>{d.k}</b>
                    <span>{d.shortName.replace(/\s*\([A-Z]\)/, '')}</span>
                  </button>
                ))}
              </div>

              <div className="s9c-dim-detail">
                <div className="s9c-dim-head">
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.18rem 0.55rem',
                        borderRadius: 999,
                        background: explorerDimObj.color,
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        marginBottom: '0.3rem',
                      }}
                    >
                      NHÓM {explorerDimObj.k} · HOLLAND ARCHETYPE
                    </span>
                    <h4>{explorerDimObj.name}</h4>
                    <p>{explorerDimObj.tagline}</p>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem' }}>
                  <small style={{ fontWeight: 800, fontSize: '0.73rem', color: 'var(--mut)' }}>
                    TỐ CHẤT ĐẶC TRƯNG:
                  </small>
                  <div className="s9c-chip-row">
                    {explorerDimObj.traits.map((t) => (
                      <span key={t} className="s9c-chip">{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem' }}>
                  <small style={{ fontWeight: 800, fontSize: '0.73rem', color: 'var(--mut)' }}>
                    NGÀNH HỌC TIÊU BIỂU 2026–2030:
                  </small>
                  <div className="s9c-chip-row">
                    {explorerDimObj.topMajors.map((m) => (
                      <span key={m} className="s9c-chip is-accent">{m}</span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--line, rgba(100,120,180,0.16))',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.77rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--mut)', display: 'block', fontSize: '0.7rem' }}>
                      Thu nhập tham khảo:
                    </span>
                    <b style={{ color: 'var(--ink)' }}>{explorerDimObj.salaryRange}</b>
                  </div>
                  <div>
                    <span style={{ color: 'var(--mut)', display: 'block', fontSize: '0.7rem' }}>
                      Khối xét tuyển chính:
                    </span>
                    <b style={{ color: '#2563eb' }}>{explorerDimObj.bestBlocks.join(' · ')}</b>
                  </div>
                </div>
              </div>

              {/* Biểu đồ Radar xem trước */}
              <div style={{ marginTop: '0.9rem', textAlign: 'center' }}>
                <RiasecRadarSvg
                  scores={
                    savedReport?.profile?.scores || {
                      R: activeExplorerDim === 'R' ? 18 : 11,
                      I: activeExplorerDim === 'I' ? 19 : 13,
                      A: activeExplorerDim === 'A' ? 18 : 9,
                      S: activeExplorerDim === 'S' ? 18 : 11,
                      E: activeExplorerDim === 'E' ? 18 : 11,
                      C: activeExplorerDim === 'C' ? 18 : 12,
                    }
                  }
                  maxVal={20}
                  size={230}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MÀN HÌNH 2: LÀM BÀI TEST (24 CÂU HOẶC 6 CÂU NHANH) + RADAR LIVE
            ============================================================ */}
        {step === 'test' && (
          <div className="s9c-test-layout">
            {/* CỘT TRÁI: CÂU HỎI TRẮC NGHIỆM */}
            <div className="s9c-card">
              {testMode === 'quick' ? (
                /* ── CHẾ ĐỘ CHẨN ĐOÁN NHANH 6 CÂU (60 GIÂY) ── */
                <div>
                  <div className="s9c-sec-head">
                    <div>
                      <span className="s9c-badge-pill">
                        Chẩn đoán nhanh 60 giây · Câu {quickStepIdx + 1}/{QUICK_RIASEC_QUESTIONS.length}
                      </span>
                      <h2 className="s9c-sec-title" style={{ marginTop: '0.4rem' }}>
                        {QUICK_RIASEC_QUESTIONS[quickStepIdx].q}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="s9c-ghost-btn"
                      onClick={() => setStep('intro')}
                    >
                      Đổi chế độ
                    </button>
                  </div>

                  <div
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--surface-3, #e2e8f0)',
                      overflow: 'hidden',
                      marginBottom: '1.1rem',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(((quickStepIdx + 1) / QUICK_RIASEC_QUESTIONS.length) * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                        transition: 'width 0.25s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {QUICK_RIASEC_QUESTIONS[quickStepIdx].options.map((opt, oIdx) => {
                      const isPicked = quickAnswers[quickStepIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            const next = [...quickAnswers];
                            next[quickStepIdx] = oIdx;
                            setQuickAnswers(next);
                            if (quickStepIdx + 1 < QUICK_RIASEC_QUESTIONS.length) {
                              setQuickStepIdx(quickStepIdx + 1);
                            } else {
                              setStep('profile_step');
                            }
                          }}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 14,
                            border: `1.5px solid ${isPicked ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                            background: isPicked ? 'rgba(37,99,235,0.1)' : 'var(--surface-2, #f8fafc)',
                            color: 'var(--ink)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontFamily: 'inherit',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            transition: 'all 0.14s ease',
                          }}
                        >
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isPicked ? '#2563eb' : 'var(--surface, #fff)',
                              color: isPicked ? '#fff' : '#2563eb',
                              border: '1px solid rgba(37,99,235,0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '1rem',
                    }}
                  >
                    {quickStepIdx > 0 ? (
                      <button
                        type="button"
                        className="s9c-ghost-btn"
                        onClick={() => setQuickStepIdx((i) => Math.max(0, i - 1))}
                      >
                        ← Câu trước
                      </button>
                    ) : <span />}
                    {quickAnswers.length >= QUICK_RIASEC_QUESTIONS.length && (
                      <button
                        type="button"
                        className="s9c-primary-btn"
                        onClick={() => setStep('profile_step')}
                      >
                        Sang Bước 2: Môn mạnh &amp; Điểm →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ── CHẾ ĐỘ CHUYÊN SÂU 24 CÂU HOLLAND RIASEC ── */
                <div>
                  <div className="s9c-sec-head">
                    <div>
                      <span
                        className="s9c-badge-pill"
                        style={{
                          background: currentGroupDim.bgSoft,
                          color: currentGroupDim.color,
                        }}
                      >
                        Đã trả lời {answered24Count}/24 câu ({Math.round((answered24Count / 24) * 100)}%)
                      </span>
                      <h2 className="s9c-sec-title" style={{ marginTop: '0.35rem' }}>
                        {viewStyle === 'paged'
                          ? `Nhóm ${groupPageIdx + 1}/6: ${currentGroupDim.name}`
                          : `Câu hỏi ${singleQIdx + 1}/24 · ${all24Qs[singleQIdx]?.groupName}`}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="s9c-ghost-btn"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => setViewStyle((v) => (v === 'paged' ? 'single' : 'paged'))}
                      >
                        {viewStyle === 'paged' ? 'Chuyển sang Từng câu' : 'Chuyển sang 4 câu/trang'}
                      </button>
                      <button
                        type="button"
                        className="s9c-ghost-btn"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => setStep('intro')}
                      >
                        Quay lại
                      </button>
                    </div>
                  </div>

                  {/* Thanh tiến độ 6 nhóm R-I-A-S-E-C */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      gap: '0.35rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {RIASEC_DIMENSIONS.map((d, idx) => {
                      const doneInGroup = [0, 1, 2, 3].filter(
                        (off) => answers[idx * 4 + off] != null
                      ).length;
                      const isCur = viewStyle === 'paged' ? groupPageIdx === idx : Math.floor(singleQIdx / 4) === idx;
                      return (
                        <button
                          key={d.k}
                          type="button"
                          onClick={() => {
                            if (viewStyle === 'paged') setGroupPageIdx(idx);
                            else setSingleQIdx(idx * 4);
                          }}
                          style={{
                            padding: '0.4rem 0.3rem',
                            borderRadius: 10,
                            border: `1.5px solid ${isCur ? d.color : 'var(--line, rgba(100,120,180,0.18))'}`,
                            background: doneInGroup === 4 ? d.bgSoft : 'var(--surface-2, #f8fafc)',
                            color: 'var(--ink)',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            fontFamily: 'inherit',
                          }}
                        >
                          {d.k} ({doneInGroup}/4)
                        </button>
                      );
                    })}
                  </div>

                  {viewStyle === 'paged' ? (
                    /* Hiển thị 4 câu của nhóm hiện tại trên 1 trang */
                    <div>
                      {[0, 1, 2, 3].map((offset) => {
                        const qIdx = groupPageIdx * 4 + offset;
                        const qItem = all24Qs[qIdx];
                        const curVal = answers[qIdx];
                        return (
                          <div
                            key={qIdx}
                            className={`s9c-q-block ${curVal != null ? 'is-answered' : ''}`}
                          >
                            <div className="s9c-q-title">
                              <span className="s9c-q-num">Câu {qIdx + 1}</span>
                              <span>{qItem.q}</span>
                            </div>
                            <div className="s9c-likert-row">
                              {LIKERT_SCALE.map((lv) => (
                                <button
                                  key={lv.val}
                                  type="button"
                                  className={`s9c-likert-btn ${curVal === lv.val ? 'is-on' : ''}`}
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [qIdx]: lv.val }))
                                  }
                                >
                                  <span>{lv.short}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.6rem',
                          marginTop: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                          {groupPageIdx > 0 && (
                            <button
                              type="button"
                              className="s9c-ghost-btn"
                              onClick={() => setGroupPageIdx((p) => p - 1)}
                            >
                              ← Nhóm trước
                            </button>
                          )}
                          <button
                            type="button"
                            className="s9c-ghost-btn"
                            onClick={() => {
                              // Điền nhanh mức "Khá thích (4)" cho các câu chưa chọn trong trang này
                              setAnswers((prev) => {
                                const next = { ...prev };
                                [0, 1, 2, 3].forEach((off) => {
                                  const qi = groupPageIdx * 4 + off;
                                  if (next[qi] == null) next[qi] = 3;
                                });
                                return next;
                              });
                            }}
                          >
                            Điền nhanh câu trống = Bình thường
                          </button>
                        </div>

                        {groupPageIdx < 5 ? (
                          <button
                            type="button"
                            className="s9c-primary-btn"
                            onClick={() => {
                              if (!currentGroupAnswered) {
                                // Tự động gán 3 (Bình thường) cho câu bị bỏ sót trong trang để không kẹt
                                setAnswers((prev) => {
                                  const next = { ...prev };
                                  [0, 1, 2, 3].forEach((off) => {
                                    const qi = groupPageIdx * 4 + off;
                                    if (next[qi] == null) next[qi] = 3;
                                  });
                                  return next;
                                });
                              }
                              setGroupPageIdx((p) => p + 1);
                            }}
                          >
                            Sang nhóm {RIASEC_DIMENSIONS[groupPageIdx + 1]?.shortName} →
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="s9c-primary-btn"
                            onClick={() => {
                              setAnswers((prev) => {
                                const next = { ...prev };
                                for (let i = 0; i < 24; i++) {
                                  if (next[i] == null) next[i] = 3;
                                }
                                return next;
                              });
                              setStep('profile_step');
                            }}
                          >
                            Hoàn tất 24 câu · Sang Bước 2 →
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Hiển thị từng câu 1..24 */
                    <div>
                      <div className="s9c-q-block is-answered">
                        <div className="s9c-q-title" style={{ fontSize: '1.02rem' }}>
                          <span className="s9c-q-num">#{singleQIdx + 1}</span>
                          <span>{all24Qs[singleQIdx]?.q}</span>
                        </div>
                        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.8rem' }}>
                          {LIKERT_SCALE.map((lv) => {
                            const isPicked = answers[singleQIdx] === lv.val;
                            return (
                              <button
                                key={lv.val}
                                type="button"
                                onClick={() => {
                                  setAnswers((prev) => ({ ...prev, [singleQIdx]: lv.val }));
                                  if (singleQIdx < 23) setSingleQIdx(singleQIdx + 1);
                                  else setStep('profile_step');
                                }}
                                style={{
                                  padding: '0.7rem 1rem',
                                  borderRadius: 12,
                                  border: `1.5px solid ${isPicked ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                                  background: isPicked ? 'rgba(37,99,235,0.12)' : 'var(--surface-2, #f8fafc)',
                                  color: 'var(--ink)',
                                  fontWeight: 700,
                                  fontSize: '0.88rem',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {lv.val}. {lv.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.85rem' }}>
                        {singleQIdx > 0 ? (
                          <button
                            type="button"
                            className="s9c-ghost-btn"
                            onClick={() => setSingleQIdx((q) => Math.max(0, q - 1))}
                          >
                            ← Câu trước
                          </button>
                        ) : <span />}
                        <button
                          type="button"
                          className="s9c-primary-btn"
                          onClick={() => setStep('profile_step')}
                        >
                          Sang Bước 2: Môn mạnh &amp; Mục tiêu →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: BIỂU ĐỒ RADAR LỤC GIÁC LIVE CẬP NHẬT THEO TỪNG CÂU TRẢ LỜI */}
            <div className="s9c-card">
              <div className="s9c-sec-head">
                <h3 className="s9c-sec-title" style={{ fontSize: '0.95rem' }}>
                  Biểu đồ Radar RIASEC Thời gian thực
                </h3>
                <span className="s9c-badge-pill">{computedReport.hollandCode}</span>
              </div>

              <RiasecRadarSvg
                scores={currentRiasecScores}
                maxVal={testMode === 'quick' ? 12 : 20}
                size={235}
              />

              <div className="s9c-dim-bars">
                {computedReport.dimensions.map((d) => (
                  <div key={d.k} className="s9c-dim-bar-row">
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{d.shortName}</span>
                    <div className="s9c-dim-bar-track">
                      <div
                        className="s9c-dim-bar-fill"
                        style={{ width: `${d.pct}%`, background: d.color }}
                      />
                    </div>
                    <b style={{ textAlign: 'right', color: d.color }}>{d.pct}%</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MÀN HÌNH 2B: BƯỚC HOÀN THIỆN HỒ SƠ MÔN MẠNH, KHU VỰC & ĐIỂM DỰ KIẾN
            ============================================================ */}
        {step === 'profile_step' && (
          <div className="s9c-card" style={{ maxWidth: 840, margin: '0 auto' }}>
            <div className="s9c-sec-head">
              <div>
                <span className="s9c-badge-pill">Bước cuối · Cá nhân hóa Tuyển sinh Đại học</span>
                <h2 className="s9c-sec-title" style={{ marginTop: '0.35rem' }}>
                  Ghép Sở trường Môn học GDPT 2018 &amp; Điểm Xét tuyển Thực tế
                </h2>
              </div>
              <button
                type="button"
                className="s9c-ghost-btn"
                onClick={() => setStep('test')}
              >
                ← Sửa câu trả lời
              </button>
            </div>

            {/* 1. Chọn môn học mạnh */}
            <div style={{ marginBottom: '1.15rem' }}>
              <b style={{ fontSize: '0.86rem', color: 'var(--ink)' }}>
                1. Chọn các môn học bạn tự tin nhất (gợi ý chọn 3–4 môn):
              </b>
              <div className="s9c-chip-row" style={{ marginTop: '0.5rem' }}>
                {GDPT2018_SUBJECTS.map((s) => {
                  const active = subjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        border: `1.5px solid ${active ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                        background: active ? 'rgba(37, 99, 235, 0.14)' : 'var(--surface-2, #f8fafc)',
                        color: active ? '#2563eb' : 'var(--ink)',
                      }}
                    >
                      {active ? '✓ ' : ''}{s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Điểm đối chiếu /30 & Khu vực ưu tiên */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                marginBottom: '1.15rem',
                padding: '1rem',
                borderRadius: 16,
                background: 'var(--surface-2, #f8fafc)',
                border: '1px solid var(--line, rgba(100,120,180,0.16))',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <b style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
                    2. Điểm tổng 3 môn dự kiến (Thang 30):
                  </b>
                  <strong style={{ fontSize: '0.96rem', color: '#2563eb' }}>
                    {effectiveScore30}/30đ
                  </strong>
                </div>
                <input
                  type="range"
                  min="16"
                  max="29.5"
                  step="0.25"
                  value={effectiveScore30}
                  onChange={(e) => {
                    setUseCustomScore(true);
                    setCustomScore30(Number(e.target.value));
                  }}
                  style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                  aria-label="Thanh trượt điểm tổng 3 môn dự kiến trên thang 30"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--mut)' }}>
                  <span>16.0đ</span>
                  <span>22.5đ</span>
                  <span>26.0đ</span>
                  <span>29.5đ</span>
                </div>
              </div>

              <div>
                <b style={{ fontSize: '0.82rem', color: 'var(--ink)', display: 'block', marginBottom: '0.45rem' }}>
                  3. Khu vực trường Đại học mong muốn:
                </b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {REGIONS.map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setPreferredRegion(reg)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 10,
                        border: `1.5px solid ${preferredRegion === reg ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                        background: preferredRegion === reg ? '#2563eb' : 'var(--surface, #fff)',
                        color: preferredRegion === reg ? '#fff' : 'var(--ink)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Mục tiêu nghề nghiệp hàng đầu */}
            <div style={{ marginBottom: '1.25rem' }}>
              <b style={{ fontSize: '0.86rem', color: 'var(--ink)', display: 'block', marginBottom: '0.5rem' }}>
                4. Định hướng giá trị nghề nghiệp bạn ưu tiên nhất:
              </b>
              <div style={{ display: 'grid', gap: '0.45rem' }}>
                {CAREER_GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      border: `1.5px solid ${goal === g ? '#2563eb' : 'var(--line, rgba(100,120,180,0.18))'}`,
                      background: goal === g ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-2, #f8fafc)',
                      color: 'var(--ink)',
                      font: '600 0.84rem var(--sans)',
                    }}
                  >
                    {goal === g ? '✓ ' : ''}{g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="s9c-primary-btn"
              style={{ width: '100%', padding: '0.9rem 1.5rem', fontSize: '0.96rem' }}
              onClick={finalizeReport}
            >
              Xuất Báo cáo Định hướng Nghề nghiệp &amp; Danh sách Trường ĐH →
            </button>
          </div>
        )}

        {/* ============================================================
            MÀN HÌNH 3: BÁO CÁO ĐỊNH HƯỚNG NGHỀ NGHIỆP & TRƯỜNG ĐH CHUẨN 9STUDY
            ============================================================ */}
        {step === 'report' && (
          <div>
            {/* KHỐI 1: HERO KẾT QUẢ MÃ HOLLAND + BIỂU ĐỒ RADAR 6 TRỤC */}
            <div className="s9c-report-hero">
              <div className="s9c-card">
                <div className="s9c-sec-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="s9c-code-pill-big">{computedReport.hollandCode}</span>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                        CHÂN DUNG HƯỚNG NGHIỆP HOLLAND RIASEC
                      </span>
                      <h2 style={{ margin: '0.15rem 0 0', fontSize: '1.12rem', fontWeight: 800, color: 'var(--ink)' }}>
                        {computedReport.dimensions
                          .filter((d) => computedReport.topCodes.slice(0, 2).includes(d.k))
                          .map((d) => d.shortName)
                          .join(' × ')}
                      </h2>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="s9c-ghost-btn"
                      onClick={() => handleStartTest(testMode)}
                    >
                      Làm lại test
                    </button>
                    <button
                      type="button"
                      className="s9c-ghost-btn"
                      onClick={() => window.print()}
                    >
                      In / Lưu PDF A4
                    </button>
                  </div>
                </div>

                <p style={{ margin: '0 0 0.85rem', fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--ink)' }}>
                  {computedReport.summary}
                </p>

                {/* Tổ hợp GDPT 2018 & Điểm đối chiếu */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 15,
                    background: 'var(--surface-2, #f8fafc)',
                    border: '1px solid var(--line, rgba(100,120,180,0.16))',
                    marginBottom: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.45rem' }}>
                    <b style={{ fontSize: '0.8rem', color: 'var(--ink)' }}>
                      Tổ hợp xét tuyển tối ưu theo môn mạnh ({subjects.join(', ') || 'Toán, Lý, Hóa'}):
                    </b>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb' }}>
                      Điểm đối chiếu: {effectiveScore30}/30đ
                    </span>
                  </div>
                  <div className="s9c-chip-row">
                    {computedReport.optimalBlocks.map((b) => (
                      <span key={b.code} className="s9c-chip is-accent">
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lời khuyên chiến lược */}
                <div
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: 14,
                    borderLeft: '4px solid #2563eb',
                    background: 'rgba(37, 99, 235, 0.06)',
                    fontSize: '0.83rem',
                    lineHeight: 1.55,
                    color: 'var(--ink)',
                  }}
                >
                  <b style={{ color: '#2563eb', display: 'block', marginBottom: '0.2rem' }}>
                    Chiến lược đăng ký Nguyện vọng khuyến nghị:
                  </b>
                  {computedReport.advice}
                </div>
              </div>

              {/* CỘT PHẢI: BIỂU ĐỒ RADAR LỤC GIÁC + THANH TỶ TRỌNG 6 TRỤC */}
              <div className="s9c-card">
                <div className="s9c-sec-head" style={{ marginBottom: '0.4rem' }}>
                  <h3 className="s9c-sec-title" style={{ fontSize: '0.96rem' }}>
                    Đồ thị Lục giác 6 Trục RIASEC
                  </h3>
                  <span className="s9c-badge-pill">Chuẩn hóa 100%</span>
                </div>

                <RiasecRadarSvg
                  scores={
                    Object.fromEntries(computedReport.dimensions.map((d) => [d.k, d.pct]))
                  }
                  maxVal={100}
                  size={230}
                />

                <div className="s9c-dim-bars">
                  {computedReport.dimensions.map((d) => (
                    <div key={d.k} className="s9c-dim-bar-row">
                      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{d.name.split('·')[0]} ({d.k})</span>
                      <div className="s9c-dim-bar-track">
                        <div
                          className="s9c-dim-bar-fill"
                          style={{ width: `${d.pct}%`, background: d.color }}
                        />
                      </div>
                      <b style={{ textAlign: 'right', color: d.color }}>{d.pct}%</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KHỐI 2: TOP 3 NHÓM NGÀNH PHÙ HỢP NHẤT & TRIỂN VỌNG LƯƠNG 2026–2030 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div className="s9c-sec-head">
                <h2 className="s9c-sec-title">
                  Top 3 Nhóm Ngành Phù Hợp Nhất &amp; Dự báo Nhân lực 2026–2030
                </h2>
                <span className="s9c-badge-pill">Xếp hạng theo % Độ hợp RIASEC × Tổ hợp môn</span>
              </div>

              <div className="s9c-family-grid">
                {computedReport.groups.map((g, idx) => (
                  <article key={g.id || idx} className={`s9c-family-card rank-${idx}`}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            padding: '0.22rem 0.65rem',
                            borderRadius: 999,
                            background: idx === 0 ? '#2563eb' : idx === 1 ? '#7c3aed' : '#059669',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                          }}
                        >
                          TOP {idx + 1} · {g.match}% HỢP
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--mut)' }}>
                          Mã: {(g.riasecPrimary || []).join('-')}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 0.45rem', fontSize: '0.98rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.35 }}>
                        {g.name}
                      </h3>
                      <p style={{ margin: '0 0 0.65rem', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--mut, #475569)' }}>
                        {g.why}
                      </p>

                      <small style={{ fontWeight: 800, fontSize: '0.71rem', color: 'var(--mut)' }}>
                        CHUYÊN NGÀNH MŨI NHỌN:
                      </small>
                      <div className="s9c-chip-row" style={{ marginBottom: '0.65rem' }}>
                        {(g.majors || []).map((m) => (
                          <span key={m} className="s9c-chip">{m}</span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: '0.7rem',
                        borderTop: '1px solid var(--line, rgba(100,120,180,0.16))',
                        fontSize: '0.76rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div>
                        <b style={{ color: 'var(--ink)' }}>Khung lương: </b>
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          Mới ra trường {g.salaryJunior || '14–25 triệu'} · Chuyên gia {g.salarySenior || '35–75+ triệu'}
                        </span>
                      </div>
                      <div>
                        <b style={{ color: 'var(--ink)' }}>Trường tiêu biểu: </b>
                        <span style={{ color: 'var(--mut)' }}>{(g.unis || []).slice(0, 4).join(' · ')}</span>
                      </div>
                      {Array.isArray(g.roadmapSteps) && g.roadmapSteps[0] && (
                        <div style={{ color: '#2563eb', fontWeight: 600 }}>
                          ★ Trọng tâm lớp 12: {g.roadmapSteps[0]}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* KHỐI 3: DANH SÁCH NGÀNH & TRƯỜNG ĐẠI HỌC ĐỀ XUẤT (GHIM TRỰC TIẾP NV1-NV2-NV3) */}
            <div className="s9c-card" style={{ marginBottom: '1.1rem' }}>
              <div className="s9c-sec-head">
                <div>
                  <h2 className="s9c-sec-title">
                    Ngành &amp; Trường Đại học Khớp Nhất Với Hồ Sơ Của Bạn
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--mut)' }}>
                    Đã đối chiếu với điểm dự kiến <b>{effectiveScore30}/30đ</b> · Bấm <b>+NV1 / +NV2 / +NV3</b> để lưu thẳng vào Rổ Nguyện vọng trên thanh điều hướng!
                  </p>
                </div>

                {/* Bộ lọc tầng nguyện vọng */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Tất cả đề xuất' },
                    { id: 'safety', label: 'An toàn (≥70% đỗ)' },
                    { id: 'target', label: 'Vừa sức' },
                    { id: 'reach', label: 'Mơ ước · Bứt phá' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReportTierFilter(tab.id)}
                      style={{
                        padding: '0.38rem 0.78rem',
                        borderRadius: 999,
                        border: `1.5px solid ${reportTierFilter === tab.id ? '#2563eb' : 'var(--line, rgba(100,120,180,0.2))'}`,
                        background: reportTierFilter === tab.id ? '#2563eb' : 'var(--surface-2, #f8fafc)',
                        color: reportTierFilter === tab.id ? '#fff' : 'var(--ink)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="s9c-major-grid">
                {filteredReportMajors.map((m) => {
                  const chance = m.admissionChance;
                  const cutoff = m.s2025 ?? m.s2024;
                  return (
                    <article key={m.id} className="s9c-major-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  padding: '0.16rem 0.5rem',
                                  borderRadius: 6,
                                  background: 'rgba(37,99,235,0.12)',
                                  color: '#2563eb',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                }}
                              >
                                {m.code}
                              </span>
                              <b style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>{m.major}</b>
                            </div>
                            <div style={{ fontSize: '0.79rem', color: 'var(--mut)', marginTop: '0.15rem' }}>
                              {m.uni} ({m.city})
                            </div>
                          </div>

                          <span
                            style={{
                              padding: '0.24rem 0.62rem',
                              borderRadius: 999,
                              background: 'rgba(124, 58, 237, 0.12)',
                              color: '#7c3aed',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {m.fitPct}% hợp ngành
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                          <span className="s9c-chip">Khối: <b>{m.combo}</b></span>
                          <span className="s9c-chip">Chuẩn 2025: <b>{cutoff ?? '—'}đ</b></span>
                          {m.tuition && <span className="s9c-chip">Học phí: {m.tuition}</span>}
                          {chance && (
                            <span
                              className={`s9a-tier-tag is-${chance.tier}`}
                              style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                              {chance.text}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          paddingTop: '0.6rem',
                          borderTop: '1px solid var(--line, rgba(100,120,180,0.14))',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div className="s9c-nv-btns">
                          {[1, 2, 3].map((p) => {
                            const active = isPinnedInSlot(m, p);
                            return (
                              <button
                                key={p}
                                type="button"
                                className={`s9c-nv-btn ${active ? 'is-active' : ''}`}
                                onClick={() => handlePinMajorToSlot(m, p)}
                                title={`Đặt làm Nguyện vọng ${p}`}
                              >
                                {active ? `✓ NV${p}` : `+ NV${p}`}
                              </button>
                            );
                          })}
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="s9c-nv-btn"
                            onClick={() => setDetailSchoolId(m.schoolId || m.code)}
                          >
                            Đề án 2026
                          </button>
                          <button
                            type="button"
                            className="s9c-nv-btn"
                            style={{ color: '#2563eb', borderColor: 'rgba(37,99,235,0.3)' }}
                            onClick={() => {
                              const examType = (m.methods || []).includes('TSA')
                                ? 'TSA'
                                : (m.methods || []).includes('HSA')
                                  ? 'HSA'
                                  : (m.methods || []).includes('V-ACT')
                                    ? 'V-ACT'
                                    : 'THPTQG';
                              window.location.hash = `#virtual-exams?type=${examType}`;
                            }}
                          >
                            Luyện đề →
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* KHỐI 4: CỐ VẤN AI CHUYÊN SÂU 1-1 */}
            <div className="s9c-card">
              <div className="s9c-sec-head">
                <div>
                  <h2 className="s9c-sec-title">
                    <IconRobot size={18} /> Cố vấn Hướng nghiệp AI Chuyên sâu Cá nhân hóa
                  </h2>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--mut)' }}>
                    AI tổng hợp riêng một bản chiến lược chọn trường &amp; kế hoạch ôn tập từ Mã Holland <b>{computedReport.hollandCode}</b> và điểm <b>{effectiveScore30}/30</b> của bạn.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="s9c-primary-btn"
                    onClick={handleAskDeepAiAnalysis}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'AI đang viết chiến lược…' : 'Phân tích Chiến lược 1-1 bằng AI'}
                  </button>
                  <button
                    type="button"
                    className="s9c-ghost-btn"
                    onClick={() =>
                      openChatWithAI(
                        `Em vừa hoàn thành bài test hướng nghiệp Holland RIASEC trên ELEC AI, đạt mã ${computedReport.hollandCode}, môn mạnh: ${subjects.join(', ')}, điểm năng lực: ${effectiveScore30}/30. Nhóm ngành hợp nhất: ${computedReport.groups[0]?.name}. Hãy tư vấn chi tiết cho em cách sắp xếp 3 nguyện vọng và kế hoạch ôn tập từ nay đến lúc thi.`
                      )
                    }
                  >
                    Chat trực tiếp với Gia sư AI →
                  </button>
                </div>
              </div>

              {aiNarrative && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '1rem 1.15rem',
                    borderRadius: 16,
                    background: 'var(--surface-2, #f8fafc)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    fontSize: '0.86rem',
                    lineHeight: 1.7,
                    color: 'var(--ink)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {aiNarrative}
                </div>
              )}

              {!isVip && (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.85rem 1.1rem',
                    borderRadius: 14,
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(37,99,235,0.06))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: 600 }}>
                    Mở khóa <b>Học sinh VIP</b> để không giới hạn lượt Cố vấn Chiến lược AI 1-1 và luyện trọn bộ đề Phòng thi ảo HSA · TSA · V-ACT · THPTQG.
                  </span>
                  <a
                    href="#profile?tab=vip"
                    className="s9c-ghost-btn"
                    style={{ borderColor: '#f59e0b', color: '#d97706', fontWeight: 800 }}
                  >
                    Xem đặc quyền VIP →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Đề án Tuyển sinh 2026 chi tiết của trường */}
      <UniversityDetailModal
        open={Boolean(detailSchoolId)}
        schoolId={detailSchoolId || 'NEU'}
        uid={uid}
        onClose={() => setDetailSchoolId(null)}
      />
    </div>
  );
}
