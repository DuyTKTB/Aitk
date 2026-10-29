/* ============================================================
   MyClasses.jsx — Lớp học học sinh, chuẩn Apple HIG & visionOS
   ------------------------------------------------------------
   Nâng cấp toàn diện:
     1. Bố cục 2 Tab thông minh: "Bài tập & Đề thi" vs "Bảng xếp hạng lớp"
     2. Khối "Bài tập cần nộp gấp" (Urgent Tasks Hero) với Live Countdown
     3. Thanh Mini Leaderboard Ribbon cho phép xem nhanh thứ hạng
     4. Mini Sparkline trực quan hóa biểu đồ điểm 4 bài gần nhất
     5. Huy hiệu "Lớp học chính thức" (Verified Badge SVG)
     6. Sửa lỗi xưng hô "Xin chào, [Tên]" (loại bỏ từ lóng "nè", "ạ")
     7. Tích hợp Sổ tay lỗi sai & Trợ lý AI chữa đề trực tiếp
     8. Modal "Luyện nhanh 5 câu gỡ điểm" (ELEC AI Quick Drill)
     9. Modal xác nhận Rời lớp nội bộ an toàn (không dùng window.confirm)
     10. Đồng bộ trạng thái duyệt thi lại từ `examRetryPermits`
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  getClassesByStudent,
  getPendingClassesByStudent,
  joinClassByKey,
  getExamsByClass,
  getSubmissionForStudent,
  getAttempt,
  requestRetry,
  leaveClass,
  cancelJoinRequest,
  listenMyRetryRequests,
} from '../lib/classroom.js';
import RetryRequestModal from './RetryRequestModal.jsx';
import LeaderboardCard from './LeaderboardCard.jsx';
import { classifyPct, bandLabel, resolveBands } from '../lib/learningAnalytics.js';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { getUserRole } from '../lib/userRole.js';
import { recordWrongAnswers } from '../lib/wrongQuestionService.js';
import { recordGamificationResult } from '../hooks/useGamification.js';
import { recordActivity } from '../lib/progress.js';
import '../styles/class-apple.css';

/* ============ ICONS (100% SVG NÉT MẢNH) ============ */
const Svg = ({ size = 18, sw = 1.8, children, title }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : 'true'}
  >
    {children}
  </svg>
);

const IconBook = (p) => <Svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" /><path d="M4 20a2 2 0 0 0 2 1h13v-3" /><path d="M8 7h7" /></Svg>;
const IconKey = (p) => <Svg {...p}><circle cx="7.5" cy="15.5" r="4.5" /><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></Svg>;
const IconUsers = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5S15 16.6 15.6 20" /><circle cx="17" cy="9" r="2.6" /></Svg>;
const IconPlay = (p) => <Svg {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" /></Svg>;
const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
const IconCheck = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></Svg>;
const IconBan = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></Svg>;
const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>;
const IconRefresh = (p) => <Svg {...p}><path d="M20 11a8 8 0 0 0-14.3-4.2L4 8.5M4 4v4.5h4.5" /><path d="M4 13a8 8 0 0 0 14.3 4.2L20 15.5M20 20v-4.5h-4.5" /></Svg>;
const IconAlert = (p) => <Svg {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></Svg>;
const IconClose = (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
const IconBell = (p) => <Svg {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>;
const IconHourglass = (p) => <Svg {...p}><path d="M6 2h12M6 22h12M6 2v4c0 3 3 5 6 6-3 1-6 3-6 6v4M18 2v4c0 3-3 5-6 6 3 1 6 3 6 6v4" /></Svg>;
const IconLock = (p) => <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
const IconSparkles = (p) => <Svg {...p}><path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" /></Svg>;
const IconPin = (p) => <Svg {...p}><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-2l-2-2V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8l-2 2z" /></Svg>;
const IconTrophy = (p) => <Svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.45 1-1 1H7" /><path d="M14 14.66V17c0 .55.45 1 1 1h2" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></Svg>;
const IconTeacher = (p) => <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10" /><path d="M6 10h10" /><path d="M6 14h6" /></Svg>;
const IconNotebook = (p) => <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="10" x2="6.01" y2="10" /><line x1="6" y1="14" x2="6.01" y2="14" /><line x1="6" y1="18" x2="6.01" y2="18" /></Svg>;
const IconShieldCheck = (p) => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></Svg>;
const IconFlask = (p) => <Svg {...p}><path d="M9 3h6M10 3v5.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V3" /><line x1="8.5" y1="14" x2="15.5" y2="14" /></Svg>;
const IconCalculator = (p) => <Svg {...p}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" /></Svg>;
const IconAtom = (p) => <Svg {...p}><circle cx="12" cy="12" r="2" /><path d="M20.2 20.2c2.4-2.4 2.4-6.3 0-8.7-4.4-4.4-12.7-2.3-16.9 1.9s-6.3 12.5-1.9 16.9c2.4 2.4 6.3 2.4 8.7 0" /><path d="M3.8 20.2c-2.4-2.4-2.4-6.3 0-8.7 4.4-4.4 12.7-2.3 16.9 1.9s6.3 12.5 1.9 16.9c-2.4 2.4-6.3 2.4-8.7 0" /></Svg>;
const IconDna = (p) => <Svg {...p}><path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6" /><path d="M7 11.5v3M12 9v6M17 11.5v3" /></Svg>;
const IconGlobe = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Svg>;
const IconArrowRight = (p) => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Svg>;

/* ============ HELPERS ============ */
const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } };

const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v?.seconds) return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const fmtDeadline = (deadline) => {
  if (!deadline) return null;
  const diff = tsMs(deadline) - Date.now();
  if (diff <= 0) {
    const over = Math.floor(-diff / 86400000);
    return { text: over === 0 ? 'Quá hạn hôm nay' : `Quá hạn ${over} ngày`, tone: 'over', isUrgent: false, diff };
  }
  const h = Math.floor(diff / 3600000);
  if (h < 1) {
    const mins = Math.max(1, Math.floor(diff / 60000));
    return { text: `Còn ${mins} phút`, tone: 'urgent', isUrgent: true, diff };
  }
  if (h < 24) return { text: `Còn ${h} giờ`, tone: 'urgent', isUrgent: true, diff };
  const d = Math.floor(diff / 86400000);
  return { text: `Còn ${d} ngày`, tone: d < 3 ? 'soon' : 'normal', isUrgent: false, diff };
};

/** Lấy tên gọi thân thiện cho học sinh (loại bỏ từ lóng nè, ạ, ơi, cute) */
export function getFriendlyStudentName(fullName = '') {
  if (!fullName) return 'bạn';
  const cleaned = fullName
    .replace(/\s+(?:nè|ạ|ơi|cute|hihi|hehe|vip|pro|thcs|thpt|[0-9]{1,2}[A-Za-z0-9]*)$/i, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (!parts.length) return cleaned || 'bạn';
  return parts[parts.length - 1];
}

/** Icon theo môn học */
function SubjectIcon({ subject = '', size = 15 }) {
  const s = String(subject).toLowerCase();
  if (s.includes('hóa') || s.includes('chem')) return <IconFlask size={size} />;
  if (s.includes('toán') || s.includes('math')) return <IconCalculator size={size} />;
  if (s.includes('lý') || s.includes('physic')) return <IconAtom size={size} />;
  if (s.includes('sinh') || s.includes('bio')) return <IconDna size={size} />;
  if (s.includes('anh') || s.includes('english')) return <IconGlobe size={size} />;
  return <IconBook size={size} />;
}

function readJoinKeyFromHash() {
  const h = (typeof window === 'undefined' ? '' : window.location.hash.slice(1));
  const m = h.match(/^(?:join|my-classes)\/([A-Z0-9-]{4,24})$/i);
  return m ? m[1].toUpperCase() : '';
}

/* ============ APPLE ACTIVITY RINGS ============ */
function AppleActivityRings({ completionPct = 0, avgPct = 0, onTimePct = 100 }) {
  const size = 104;
  const stroke = 7;
  const center = size / 2;

  const r1 = 42;
  const c1 = 2 * Math.PI * r1;
  const p1 = Math.min(1, Math.max(0, completionPct / 100));

  const r2 = 32;
  const c2 = 2 * Math.PI * r2;
  const p2 = Math.min(1, Math.max(0, avgPct / 100));

  const r3 = 22;
  const c3 = 2 * Math.PI * r3;
  const p3 = Math.min(1, Math.max(0, onTimePct / 100));

  return (
    <div className="ap-rings-box">
      <svg className="ap-rings-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        {/* Track 1 (Blue) */}
        <circle cx={center} cy={center} r={r1} stroke="#0071e3" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r1}
          stroke="#0071e3"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c1 * p1} ${c1}`}
        />

        {/* Track 2 (Purple) */}
        <circle cx={center} cy={center} r={r2} stroke="#af52de" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r2}
          stroke="#af52de"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c2 * p2} ${c2}`}
        />

        {/* Track 3 (Amber) */}
        <circle cx={center} cy={center} r={r3} stroke="#ff9500" strokeWidth={stroke} fill="none" opacity="0.18" />
        <circle
          cx={center}
          cy={center}
          r={r3}
          stroke="#ff9500"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c3 * p3} ${c3}`}
        />
      </svg>

      <div className="ap-rings-legend">
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot blue" /> Hoàn thành đề
          </span>
          <b className="ap-ring-val">{Math.round(completionPct)}%</b>
        </div>
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot purple" /> Điểm TB (GPA)
          </span>
          <b className="ap-ring-val">{Math.round(avgPct)}%</b>
        </div>
        <div className="ap-ring-item">
          <span className="ap-ring-label">
            <i className="ap-ring-dot amber" /> Nộp đúng hạn
          </span>
          <b className="ap-ring-val">{Math.round(onTimePct)}%</b>
        </div>
      </div>
    </div>
  );
}

/* ============ MODAL XÁC NHẬN RỜI LỚP NỘI BỘ ============ */
function LeaveClassConfirmModal({ cls, busy, onCancel, onConfirm }) {
  if (!cls) return null;
  return (
    <div className="ap-sheet-bg" role="alertdialog" aria-modal="true">
      <div className="ap-confirm-modal">
        <div className="ap-confirm-icon-box">
          <IconAlert size={26} />
        </div>
        <h3>Xác nhận rời lớp học?</h3>
        <p>
          Bạn đang yêu cầu rời khỏi <b>{cls.name}</b>. Sau khi rời lớp, bạn sẽ không còn nhận được các bài tập và thông báo mới của lớp này. Lịch sử bài làm trước đây vẫn được lưu trong hồ sơ cá nhân.
        </p>
        <div className="ap-confirm-actions">
          <button type="button" className="ap-btn" onClick={onCancel} disabled={busy}>
            Ở lại lớp
          </button>
          <button type="button" className="ap-btn danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Xác nhận rời lớp'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ MODAL LUYỆN 5 CÂU GỠ ĐIỂM (ELEC AI QUICK DRILL) ============ */
const DRILL_QUESTIONS_FALLBACK = [
  {
    q: 'Cho phản ứng: 2NO2 (khí, nâu đỏ) ⇄ N2O4 (khí, không màu). Khi ngâm bình phản ứng vào nước đá, màu nâu đỏ nhạt dần. Chiều thuận của phản ứng là:',
    options: ['Tỏa nhiệt (ΔH < 0)', 'Thu nhiệt (ΔH > 0)', 'Không tỏa cũng không thu nhiệt', 'Tự phát ở nhiệt độ cao'],
    correct: 0,
    explain: 'Theo nguyên lý Le Chatelier: Khi hạ nhiệt độ (nước đá), cân bằng chuyển dịch theo chiều tỏa nhiệt để chống lại sự giảm nhiệt độ. Màu nhạt dần chứng tỏ chuyển dịch theo chiều thuận → Chiều thuận tỏa nhiệt (ΔH < 0).',
  },
  {
    q: 'Chất nào sau đây là chất điện li mạnh trong dung dịch nước?',
    options: ['NaCl (Muối ăn)', 'CH3COOH (Axit axetic)', 'H2O (Nước tinh khiết)', 'C2H5OH (Rượu etylic)'],
    correct: 0,
    explain: 'NaCl là muối tan, phân li hoàn toàn thành các ion Na+ và Cl- trong dung dịch nên là chất điện li mạnh.',
  },
  {
    q: 'Để trung hòa hoàn toàn 100 mL dung dịch HCl 0,1M cần dùng vừa đủ V mL dung dịch NaOH 0,1M. Giá trị của V là:',
    options: ['100 mL', '50 mL', '200 mL', '150 mL'],
    correct: 0,
    explain: 'n(HCl) = 0,1 × 0,1 = 0,01 mol. Phương trình: HCl + NaOH → NaCl + H2O. n(NaOH) = n(HCl) = 0,01 mol → V = 0,01 / 0,1 = 0,1 L = 100 mL.',
  },
  {
    q: 'Kim loại nào sau đây có tính khử mạnh nhất trong dãy hoạt động hóa học?',
    options: ['K (Kali)', 'Fe (Sắt)', 'Cu (Đồng)', 'Ag (Bạc)'],
    correct: 0,
    explain: 'Theo dãy thế điện hóa, Kali đứng đầu nhóm kim loại kiềm nên có tính khử mạnh nhất.',
  },
  {
    q: 'Hợp chất hữu cơ nào sau đây thuộc loại este no, đơn chức, mạch hở?',
    options: ['CH3COOC2H5 (Etyl axetat)', 'CH3COOH (Axit axetic)', 'C2H5OH (Etanol)', 'CH3CHO (Axetanđehit)'],
    correct: 0,
    explain: 'CH3COOC2H5 có công thức C4H8O2 thuộc dạng CnH2nO2 (n ≥ 2), là este no, đơn chức, mạch hở.',
  },
];

function QuickDrillModal({ topic, uid, onClose, onReward }) {
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  const curQ = DRILL_QUESTIONS_FALLBACK[qIdx] || DRILL_QUESTIONS_FALLBACK[0];

  const handlePick = (idx) => {
    if (picked !== null) return;
    setPicked(idx);
    const isOk = idx === curQ.correct;
    const nextAnswers = [...answers, { q: curQ, picked: idx, ok: isOk }];
    setAnswers(nextAnswers);

    // Lưu câu sai vào sổ tay nếu trả lời sai
    if (!isOk) {
      try {
        recordWrongAnswers(uid, [{
          question: { content: curQ.q, explanation: curQ.explain },
          userPicked: curQ.options[idx],
          isCorrect: false,
          examTitle: `Luyện gỡ điểm: ${topic}`,
          source: 'quick-drill',
        }]);
      } catch { /* ignore */ }
    }
  };

  const handleNext = () => {
    if (qIdx < DRILL_QUESTIONS_FALLBACK.length - 1) {
      setQIdx(qIdx + 1);
      setPicked(null);
    } else {
      setDone(true);
      const correctCount = answers.filter((a) => a.ok).length;
      try {
        recordGamificationResult(uid, {
          correctCount,
          wrongCount: DRILL_QUESTIONS_FALLBACK.length - correctCount,
        });
        recordActivity({
          type: 'drill',
          title: `Luyện gỡ điểm: ${topic}`,
          hash: 'my-classes',
          count: 1,
        });
      } catch { /* ignore */ }
      onReward?.(correctCount);
    }
  };

  const correctTotal = answers.filter((a) => a.ok).length;

  return (
    <div className="ap-sheet-bg" role="dialog" aria-modal="true" aria-label="Luyện gỡ điểm ELEC AI">
      <div className="ap-drill-modal">
        <div className="ap-drill-head">
          <div>
            <div className="ap-verified-pill" style={{ marginBottom: 4 }}>
              <IconSparkles size={12} /> ELEC AI Quick Drill
            </div>
            <h3>Luyện 5 câu gỡ điểm: {topic}</h3>
          </div>
          <button type="button" className="ap-x" onClick={onClose} aria-label="Đóng">
            <IconClose size={15} />
          </button>
        </div>

        {!done ? (
          <>
            <div className="ap-drill-progress-bar">
              <div
                className="ap-drill-progress-fill"
                style={{ width: `${((qIdx + (picked !== null ? 1 : 0)) / DRILL_QUESTIONS_FALLBACK.length) * 100}%` }}
              />
            </div>

            <div className="ap-drill-qbox">
              <div style={{ fontSize: '0.78rem', color: 'var(--mut)', fontWeight: 600, marginBottom: 4 }}>
                Câu {qIdx + 1} / {DRILL_QUESTIONS_FALLBACK.length}
              </div>
              <div className="ap-drill-qtitle">{curQ.q}</div>

              <div className="ap-drill-options">
                {curQ.options.map((opt, i) => {
                  let cls = '';
                  if (picked !== null) {
                    if (i === curQ.correct) cls = 'correct';
                    else if (i === picked) cls = 'wrong';
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`ap-drill-opt ${cls}`}
                      onClick={() => handlePick(i)}
                      disabled={picked !== null}
                    >
                      <b style={{ opacity: 0.7 }}>{String.fromCharCode(65 + i)}.</b>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div className="ap-drill-explain">
                  <b>Lời giải chi tiết:</b> {curQ.explain}
                </div>
              )}
            </div>

            {picked !== null && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="ap-btn primary" onClick={handleNext}>
                  {qIdx < DRILL_QUESTIONS_FALLBACK.length - 1 ? (
                    <>Câu tiếp theo <IconArrowRight size={14} /></>
                  ) : (
                    'Hoàn thành & Nhận điểm XP'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.2rem 0' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>🎉</div>
            <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem' }}>Hoàn thành bài luyện gỡ điểm!</h4>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--mut)', fontSize: '0.88rem' }}>
              Bạn đã làm đúng <b>{correctTotal}/{DRILL_QUESTIONS_FALLBACK.length} câu</b>. Hệ thống đã cộng <b>+{correctTotal * 10} XP</b> vào hồ sơ học tập và lưu các câu sai vào Sổ tay lỗi!
            </p>
            <button type="button" className="ap-btn primary" onClick={onClose}>
              Đóng và quay lại Lớp học
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ MAIN COMPONENT ============ */
export default function MyClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [pendingClasses, setPendingClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [joinKey, setJoinKey] = useState(() => readJoinKeyFromHash());
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinPendingMsg, setJoinPendingMsg] = useState('');
  const [showJoin, setShowJoin] = useState(() => !!readJoinKeyFromHash());
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState(() => lsGet('cs-mc-sort', 'deadline'));
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);
  const searchRef = useRef(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [retryExam, setRetryExam] = useState(null);
  const [retrySending, setRetrySending] = useState(false);
  const [retryError, setRetryError] = useState('');
  const [busyLeave, setBusyLeave] = useState(false);

  /* CÁC STATE MỚI CHO BỐ CỤC 2 TAB & TÍNH NĂNG NÂNG CAO */
  const [mainView, setMainView] = useState('exams'); // 'exams' | 'leaderboard'
  const [confirmLeaveCls, setConfirmLeaveCls] = useState(null);
  const [drillTopic, setDrillTopic] = useState(null);
  const [retryPermitsMap, setRetryPermitsMap] = useState({});

  const say = useCallback((msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* Lắng nghe yêu cầu thi lại thời gian thực */
  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsub = listenMyRetryRequests(
      user.uid,
      (list) => {
        const map = {};
        (list || []).forEach((r) => { if (r.examId) map[r.examId] = r; });
        setRetryPermitsMap(map);
      },
      () => {}
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [user?.uid]);

  const loadClasses = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [list, pending] = await Promise.all([
        getClassesByStudent(user.uid),
        getPendingClassesByStudent(user.uid),
      ]);
      setClasses(list);
      setPendingClasses(pending);
      if (list.length && !selectedId) {
        const saved = lsGet('cs-mc-class', '');
        setSelectedId((list.find((c) => c.id === saved) || list[0]).id);
      }
    } catch (e) {
      say(e.message || 'Không tải được danh sách lớp.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedId, say]);

  useEffect(() => { loadClasses(); }, [user?.uid]); // eslint-disable-line

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedId) || null,
    [classes, selectedId]
  );

  const loadExams = useCallback(async (classId) => {
    if (!classId || !user?.uid) return;
    setLoadingExams(true);
    try {
      const list = await getExamsByClass(classId);
      setExams(list);
      const subsMap = {};
      const attMap = {};
      await Promise.all(list.map(async (ex) => {
        try {
          const sub = await getSubmissionForStudent(ex.id, user.uid);
          if (sub) subsMap[ex.id] = sub;
        } catch { /* */ }
        try {
          const att = await getAttempt({ examId: ex.id, studentId: user.uid });
          if (att && !att.submittedAt && att.startedAt) attMap[ex.id] = att;
        } catch { /* */ }
      }));
      setSubmissions(subsMap);
      setAttempts(attMap);
    } catch {
      say('Không tải được đề của lớp.');
    } finally {
      setLoadingExams(false);
    }
  }, [user?.uid, say]);

  useEffect(() => {
    if (selectedClass) loadExams(selectedClass.id);
  }, [selectedClass, loadExams]);

  const handleJoin = async (e) => {
    e?.preventDefault?.();
    const key = joinKey.trim().toUpperCase();
    if (!key) { setJoinError('Vui lòng nhập mã lớp.'); return; }
    setJoinLoading(true);
    setJoinError('');
    setJoinPendingMsg('');
    try {
      const res = await joinClassByKey(key, {
        id: user.uid,
        name: user.displayName || user.email,
        email: user.email,
      });
      if (!res.ok) {
        setJoinError(res.error || 'Không vào được lớp.');
        return;
      }
      if (res.pending) {
        setJoinPendingMsg('Đã gửi yêu cầu. Chờ giáo viên duyệt.');
        say('Đã gửi yêu cầu vào lớp.');
      } else if (res.already && !res.pending) {
        say('Bạn đã ở trong lớp này.');
      } else {
        say('Đã tham gia lớp thành công.');
      }
      setJoinKey('');
      await loadClasses();
      if (!res.pending && res.class?.id) {
        setSelectedId(res.class.id);
        setTimeout(() => setShowJoin(false), 700);
      }
    } catch (err) {
      setJoinError(err.message || 'Lỗi kết nối.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleConfirmLeave = async () => {
    if (!confirmLeaveCls || busyLeave) return;
    setBusyLeave(true);
    try {
      const r = await leaveClass(confirmLeaveCls.id, user.uid);
      if (!r.ok) { say(r.error || 'Không rời được lớp.'); return; }
      say(`Đã rời khỏi lớp ${confirmLeaveCls.name}.`);
      setConfirmLeaveCls(null);
      setSelectedId(null);
      await loadClasses();
    } finally {
      setBusyLeave(false);
    }
  };

  const handleCancelPending = async (cls) => {
    const r = await cancelJoinRequest(cls.id, user.uid);
    if (!r.ok) { say(r.error || 'Không hủy được.'); return; }
    say('Đã hủy yêu cầu.');
    await loadClasses();
  };

  const getExamStatus = (exam) => {
    const now = Date.now();
    const opensAt = tsMs(exam.opensAt);
    const closesAt = tsMs(exam.closesAt);
    if (opensAt && now < opensAt) return { key: 'soon', label: 'Chưa mở', Icon: IconClock };
    const isClosed = !!(closesAt && now > closesAt);
    if (submissions[exam.id]) {
      if (isClosed) return { key: 'done', label: 'Đã nộp · Đã đóng', Icon: IconLock, locked: true, closed: true };
      if (exam.allowRetry) return { key: 'done', label: 'Đã hoàn thành', Icon: IconCheck, canRetry: true };
      return { key: 'done', label: 'Đã hoàn thành', Icon: IconCheck, locked: true };
    }
    if (isClosed) return { key: 'closed', label: 'Đã đóng', Icon: IconBan };
    if (attempts[exam.id]) return { key: 'doing', label: 'Đang làm dở', Icon: IconPlay };
    return { key: 'todo', label: 'Chưa làm', Icon: IconPlay };
  };

  const enrichedExams = useMemo(() => exams.map((ex) => ({
    ...ex, _st: getExamStatus(ex), _sub: submissions[ex.id], _att: attempts[ex.id],
  })), [exams, submissions, attempts]); // eslint-disable-line

  const filteredExams = useMemo(() => {
    let list = enrichedExams;
    if (filter === 'todo') list = list.filter((e) => e._st.key === 'todo' || e._st.key === 'doing');
    else if (filter === 'done') list = list.filter((e) => e._st.key === 'done');
    else if (filter === 'urgent') list = list.filter((e) => {
      const dl = fmtDeadline(e.closesAt);
      return dl?.isUrgent && (e._st.key === 'todo' || e._st.key === 'doing');
    });
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => (e.title || '').toLowerCase().includes(q));
    const copy = [...list];
    const dl = (e) => tsMs(e.closesAt) || Infinity;
    if (sort === 'deadline') {
      copy.sort((a, b) => ((a._st.key === 'done' ? 1 : 0) - (b._st.key === 'done' ? 1 : 0)) || (dl(a) - dl(b)));
    } else if (sort === 'newest') {
      copy.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
    } else if (sort === 'score') {
      copy.sort((a, b) => {
        const sa = a._sub ? (a._sub.score / (a._sub.totalPoints || 1)) : -1;
        const sb = b._sub ? (b._sub.score / (b._sub.totalPoints || 1)) : -1;
        return sb - sa;
      });
    }
    return copy;
  }, [enrichedExams, filter, sort, search]);

  const stats = useMemo(() => {
    const done = enrichedExams.filter((e) => e._sub).length;
    const scores = enrichedExams.filter((e) => e._sub?.totalPoints > 0).map((e) => (e._sub.score / e._sub.totalPoints) * 100);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const pendingCount = enrichedExams.filter((e) => e._st.key === 'todo' || e._st.key === 'doing').length;

    // Tỷ lệ nộp đúng hạn
    let onTimeCount = 0;
    enrichedExams.forEach((e) => {
      if (e._sub) {
        const subTime = tsMs(e._sub.submittedAt);
        const deadline = tsMs(e.closesAt);
        if (!deadline || subTime <= deadline) onTimeCount++;
      }
    });
    const onTimePct = done > 0 ? Math.round((onTimeCount / done) * 100) : 100;

    return { total: enrichedExams.length, done, avg, pending: pendingCount, onTimePct };
  }, [enrichedExams]);

  /* BÀI TẬP CẦN NỘP GẤP NHẤT */
  const urgentExam = useMemo(() => {
    const pendingList = enrichedExams.filter((e) => (e._st.key === 'todo' || e._st.key === 'doing') && e.closesAt);
    if (!pendingList.length) return null;
    const sorted = [...pendingList].sort((a, b) => tsMs(a.closesAt) - tsMs(b.closesAt));
    const first = sorted[0];
    const dl = fmtDeadline(first.closesAt);
    if (dl && (dl.isUrgent || dl.diff < 86400000 * 2)) {
      return { exam: first, dl };
    }
    return null;
  }, [enrichedExams]);

  /* TIẾN ĐỘ 4 BÀI GẦN NHẤT (MINI SPARKLINE) */
  const recentScoreBars = useMemo(() => {
    const completed = enrichedExams
      .filter((e) => e._sub && e._sub.totalPoints > 0)
      .sort((a, b) => tsMs(b._sub.submittedAt || b.createdAt) - tsMs(a._sub.submittedAt || a.createdAt))
      .slice(0, 4)
      .reverse();

    return completed.map((ex) => {
      const pct = Math.round((ex._sub.score / ex._sub.totalPoints) * 100);
      const score10 = Number(((ex._sub.score / ex._sub.totalPoints) * 10).toFixed(1));
      return { title: ex.title, pct, score10 };
    });
  }, [enrichedExams]);

  const bandCfg = resolveBands(selectedClass?.bandThresholds);

  const subjectGroups = useMemo(() => {
    const map = new Map();
    filteredExams.forEach((ex) => {
      const name = ex.subject || ex.questions?.[0]?.subject || selectedClass?.subject || 'Chung';
      if (!map.has(name)) map.set(name, { name, items: [], pcts: [] });
      const g = map.get(name);
      g.items.push(ex);
      if (ex._sub?.totalPoints > 0) g.pcts.push((ex._sub.score / ex._sub.totalPoints) * 100);
    });
    return [...map.values()].map((g) => {
      const avg = g.pcts.length ? Math.round(g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length) : null;
      return {
        ...g,
        avg,
        band: avg === null ? null : classifyPct(avg, selectedClass?.bandThresholds),
        done: g.items.filter((i) => i._sub).length,
      };
    });
  }, [filteredExams, selectedClass?.subject, selectedClass?.bandThresholds]);

  const overallBand = stats.avg === null ? null : classifyPct(stats.avg, bandCfg);

  /* ELEC AI DIAGNOSTIC */
  const aiDiagnostic = useMemo(() => {
    const completedSubs = enrichedExams.filter((e) => e._sub && e._sub.totalPoints > 0);
    if (!completedSubs.length) return null;

    const weakExams = completedSubs
      .map((e) => ({
        title: e.title,
        topic: e.topic || e.title,
        pct: Math.round((e._sub.score / e._sub.totalPoints) * 100),
      }))
      .filter((e) => e.pct < 75)
      .sort((a, b) => a.pct - b.pct);

    if (weakExams.length > 0) {
      const topWeak = weakExams[0];
      return {
        status: 'need_review',
        topic: topWeak.topic || topWeak.title,
        pct: topWeak.pct,
        recommendation: `AI phát hiện bạn cần củng cố chủ đề "${topWeak.topic || topWeak.title}" (${topWeak.pct}%). Hãy làm bài luyện gỡ điểm hoặc nhờ ELEC AI hướng dẫn nhé!`,
      };
    }

    return {
      status: 'excellent',
      topic: 'Toàn diện',
      pct: stats.avg || 100,
      recommendation: `Phong độ rất tốt! Bạn đã đạt điểm TB ${stats.avg || 90}%. Hãy tiếp tục giữ vững nhé!`,
    };
  }, [enrichedExams, stats.avg]);

  const handleAskAITutor = (topic) => {
    const prompt = `Chào ELEC AI, mình đang học lớp "${selectedClass?.name || 'Hóa học'}". Mình cần ôn tập và củng cố lại chủ đề "${topic}". Bạn hãy hướng dẫn tóm tắt lý thuyết cốt lõi, các bẫy thường gặp và đưa ra 3 câu trắc nghiệm minh họa có lời giải chi tiết giúp mình nhé!`;
    try {
      localStorage.setItem('cs-ai-draft', prompt);
    } catch { /* */ }
    window.location.hash = 'ai';
  };

  const handleSaveWrongToNotebook = (ex, sub) => {
    if (!ex?.questions?.length) {
      say('Đang chuyển tới trang xem chi tiết câu sai…');
      window.location.hash = `exam/${ex.token || ex.id}`;
      return;
    }
    const wrongItems = [];
    const ansMap = sub?.answers || {};
    ex.questions.forEach((q, idx) => {
      const userPicked = Array.isArray(ansMap) ? ansMap[idx] : ansMap[q.id || idx];
      const correct = q.correctAnswer ?? q.answer;
      const isCorrect = userPicked != null && correct != null && String(userPicked).trim().toUpperCase() === String(correct).trim().toUpperCase();
      if (!isCorrect) {
        wrongItems.push({
          question: q,
          userPicked,
          isCorrect: false,
          examTitle: ex.title,
          examId: ex.id,
          source: `class-exam:${ex.id}`,
          topicId: q.topicId || ex.topic || 'class',
        });
      }
    });

    if (wrongItems.length === 0) {
      say('Chúc mừng! Bài thi này bạn không làm sai câu nào.');
      return;
    }

    try {
      recordWrongAnswers(user?.uid || 'guest', wrongItems);
      say(`Đã lưu ${wrongItems.length} câu sai vào Sổ tay lỗi!`);
    } catch (e) {
      say('Không lưu được vào sổ tay: ' + e.message);
    }
  };

  const handleAskAIAboutExam = (ex, sub) => {
    const prompt = `Chào ELEC AI, mình vừa làm bài kiểm tra "${ex.title}" trong lớp ${selectedClass?.name || ''} và đạt ${sub?.score || 0}/${sub?.totalPoints || 10} điểm. Bạn hãy phân tích các dạng bài hay gặp trong đề này, chỉ ra các lỗi học sinh thường mắc phải và đưa ra phương pháp giải tối ưu giúp mình nhé!`;
    try {
      localStorage.setItem('cs-ai-draft', prompt);
    } catch { /* */ }
    window.location.hash = 'ai';
  };

  const openExam = (exam) => {
    if (exam._st.key === 'soon' || exam._st.key === 'closed') return;
    if (exam._st.key === 'done' && exam._st.closed) return;
    window.location.hash = `exam/${exam.token || exam.id}`;
  };

  const handleSubmitRetry = async (reason) => {
    if (!retryExam) return;
    setRetrySending(true);
    setRetryError('');
    try {
      const res = await requestRetry({
        examId: retryExam.id,
        classId: retryExam.classId,
        teacherId: retryExam.created_by || retryExam.teacherId || null,
        student: { id: user.uid, name: user.displayName || user.email },
        reason,
      });
      if (!res.ok) { setRetryError(res.error || 'Không gửi được yêu cầu.'); return; }
      setRetryExam(null);
      say('Đã gửi yêu cầu thi lại tới giáo viên thành công!');
    } catch (e) {
      setRetryError(e.message || 'Lỗi gửi yêu cầu.');
    } finally {
      setRetrySending(false);
    }
  };

  useEffect(() => { if (selectedId) lsSet('cs-mc-class', selectedId); }, [selectedId]);
  useEffect(() => { lsSet('cs-mc-sort', sort); }, [sort]);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const progressPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const empty = !loading && classes.length === 0 && pendingClasses.length === 0;

  /* TÊN HỌC SINH THÂN THIỆN */
  const friendlyName = useMemo(
    () => getFriendlyStudentName(user?.displayName || user?.email),
    [user?.displayName, user?.email]
  );

  const teacherPro = useTeacherPro();
  const isTeacher = Boolean(getUserRole(user) === 'teacher' || teacherPro?.isPro);

  return (
    <div className="ap-class">
      <div className="ap-class-ambient" aria-hidden="true" />

      {/* HEADER */}
      <header className="ap-head">
        <div>
          <h1>Lớp học của tôi</h1>
          <p>
            {classes.length} lớp tham gia
            {stats.total ? ` · ${stats.total} bài tập/đề thi` : ''}
            {stats.avg != null ? ` · Điểm TB ${stats.avg}%` : ''}
          </p>
        </div>
        <div className="ap-actions">
          {isTeacher && (
            <a
              href="#classroom"
              className="ap-btn ghost"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Chuyển sang Khu vực Quản lý Giáo viên"
            >
              <IconTeacher size={15} /> Vào quản lý lớp học (GV)
            </a>
          )}
          <button
            type="button"
            className="ap-btn primary"
            onClick={() => { setShowJoin(true); setJoinError(''); setJoinPendingMsg(''); }}
          >
            <IconKey size={15} /> Tham gia lớp mới
          </button>
        </div>
      </header>

      {/* THÔNG BÁO GHIM CỦA LỚP TỪ GIÁO VIÊN */}
      {selectedClass?.announcement?.text && (
        <div className="ap-notice" role="alert">
          <div className="ap-notice-icon">
            <IconPin size={17} />
          </div>
          <div className="ap-notice-body">
            <div className="ap-notice-kicker">Thông báo từ GV {selectedClass.teacherName || 'bộ môn'}</div>
            <div className="ap-notice-text">{selectedClass.announcement.text}</div>
          </div>
        </div>
      )}

      {loading && empty && (
        <div className="ap-loading">
          <div className="ap-spinner" />
          <p>Đang đồng bộ dữ liệu lớp học…</p>
        </div>
      )}

      {empty && !loading && (
        <div className="ap-card ap-empty">
          <IconBook size={40} />
          <h2>Bạn chưa vào lớp nào</h2>
          <p>Nhận mã lớp (VD: 11A7-X8K9) từ giáo viên của bạn để tham gia làm bài.</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="ap-btn primary" onClick={() => setShowJoin(true)}>
              <IconKey size={14} /> Nhập mã lớp ngay
            </button>
            {isTeacher && (
              <a href="#classroom" className="ap-btn ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <IconTeacher size={14} /> Vào quản lý lớp học (Giáo viên)
              </a>
            )}
          </div>
        </div>
      )}

      {!loading && (classes.length > 0 || pendingClasses.length > 0) && (
        <>
          {/* THANH CHUYỂN LỚP HỌC (CLASS DOCK) */}
          <div className="ap-chip-row" role="tablist" aria-label="Danh sách lớp">
            {classes.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={'ap-chip' + (isSelected ? ' on' : '')}
                  onClick={() => setSelectedId(c.id)}
                  aria-pressed={isSelected}
                >
                  <span className="ap-ava">
                    <SubjectIcon subject={c.subject || c.name} size={15} />
                  </span>
                  <span>
                    {c.name}
                    <small>
                      <IconUsers size={10} /> {c.members?.length || c.memberIds?.length || 0} học sinh
                      {c.subject ? ` · ${c.subject}` : ''}
                    </small>
                  </span>
                </button>
              );
            })}
            {pendingClasses.map((c) => (
              <span key={c.id} className="ap-chip pending">
                <span className="ap-ava"><IconHourglass size={13} /></span>
                <span>
                  {c.name}
                  <small>Chờ giáo viên duyệt</small>
                </span>
              </span>
            ))}
          </div>

          <div className="ap-grid">
            {/* CỘT TRÁI (ASIDE BENTO CARDS) */}
            <aside className="ap-aside">
              {selectedClass ? (
                <>
                  {/* BENTO CARD 1: LỚP HỌC & ACTIVITY RINGS */}
                  <div className="ap-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p className="ap-kicker">
                        <SubjectIcon subject={selectedClass.subject} size={14} />
                        {selectedClass.subject || 'Hóa học'}
                        <span className="ap-verified-pill">
                          <IconShieldCheck size={12} /> Lớp chính thức
                        </span>
                      </p>
                    </div>

                    <p className="ap-sub" style={{ marginTop: '0.4rem', fontWeight: 600 }}>
                      Xin chào, {friendlyName}
                    </p>
                    <h2>{selectedClass.name}</h2>
                    <p className="ap-sub">GV phụ trách: {selectedClass.teacherName || 'Giáo viên bộ môn'}</p>

                    {/* VÒNG NĂNG LƯỢNG APPLE FITNESS RINGS */}
                    <AppleActivityRings
                      completionPct={progressPct}
                      avgPct={stats.avg || 0}
                      onTimePct={stats.onTimePct}
                    />

                    <div className="ap-stats">
                      <div className="ap-stat">
                        <b>{stats.done}/{stats.total}</b>
                        <span>Đã làm</span>
                      </div>
                      <div className="ap-stat">
                        <b>{stats.avg == null ? '—' : `${stats.avg}%`}</b>
                        <span>Điểm TB</span>
                      </div>
                      <div className="ap-stat">
                        <b>{stats.pending}</b>
                        <span>Chưa làm</span>
                      </div>
                    </div>

                    {/* MINI SPARKLINE TIẾN ĐỘ 4 BÀI GẦN NHẤT */}
                    {recentScoreBars.length > 0 && (
                      <div className="ap-sparkline-box">
                        <div className="ap-sparkline-head">
                          <span>Tiến độ 4 bài gần nhất</span>
                          <span style={{ color: 'var(--acc)' }}>Điểm thang 10</span>
                        </div>
                        <div className="ap-sparkline-bars">
                          {recentScoreBars.map((b, i) => (
                            <div key={i} className="ap-sparkline-col" title={`${b.title}: ${b.score10}/10`}>
                              <div
                                className={`ap-sparkline-bar ${b.pct >= 75 ? 'high' : b.pct >= 50 ? 'med' : 'low'}`}
                                style={{ height: `${Math.max(15, b.pct)}%` }}
                              />
                              <span className="ap-sparkline-lbl">{b.score10}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="ap-overall-band">
                      Học lực tổng hợp:{' '}
                      <b style={{ color: overallBand === 'yeu' ? '#f59e0b' : 'inherit' }}>
                        {overallBand === 'yeu' ? 'Cần nỗ lực thêm' : bandLabel(overallBand)}
                      </b>
                      <small>
                        {stats.done > 0
                          ? ` · ${stats.done} bài đã làm${stats.avg != null ? ` · TB ${stats.avg}%` : ''}`
                          : ' · chưa có bài nào được chấm'}
                      </small>
                    </p>

                    <div className="ap-foot-actions" style={{ marginTop: '0.85rem' }}>
                      <button
                        type="button"
                        className="ap-btn ghost sm danger"
                        onClick={() => setConfirmLeaveCls(selectedClass)}
                      >
                        Rời lớp
                      </button>
                    </div>
                  </div>

                  {/* BENTO CARD 2: ELEC AI DIAGNOSTIC RADAR */}
                  {aiDiagnostic && (
                    <div className="ap-card ap-ai-card">
                      <div className="ap-ai-badge">
                        <IconSparkles size={13} /> ELEC AI Diagnostic
                      </div>
                      <p className="ap-kicker">Chẩn đoán năng lực</p>
                      <div className="ap-ai-topic">
                        <div>
                          <div className="ap-ai-topic-name">{aiDiagnostic.topic}</div>
                          <small style={{ color: 'var(--mut)' }}>Hiệu suất: {aiDiagnostic.pct}%</small>
                        </div>
                        <span className="ap-ai-topic-tag">
                          {aiDiagnostic.status === 'need_review' ? 'Cần ôn thêm' : 'Nắm vững'}
                        </span>
                      </div>
                      <p style={{ margin: '0.4rem 0 0.8rem', fontSize: '0.8rem', color: 'var(--mut)', lineHeight: 1.45 }}>
                        {aiDiagnostic.recommendation}
                      </p>
                      {aiDiagnostic.status === 'need_review' && (
                        <div className="ap-ai-cta" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="ap-btn sm primary"
                            onClick={() => setDrillTopic(aiDiagnostic.topic)}
                            title="Luyện 5 câu trắc nghiệm để gỡ điểm và nhận XP"
                          >
                            <IconSparkles size={12} /> Luyện 5 câu gỡ điểm
                          </button>
                          <button
                            type="button"
                            className="ap-btn sm ghost"
                            onClick={() => handleAskAITutor(aiDiagnostic.topic)}
                          >
                            Nhờ AI hướng dẫn
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BENTO CARD 3: THÀNH TÍCH & VINH DANH CÁ NHÂN */}
                  <div className="ap-card ap-honor-card">
                    <p className="ap-kicker">
                      <IconTrophy size={13} /> Thành tích của bạn
                    </p>
                    <ul className="ap-honor-list">
                      <li className="ap-honor-item me">
                        <span className="ap-honor-rank gold">★</span>
                        <span className="ap-honor-name">
                          {user.displayName || user.email}
                          <small style={{ display: 'block', color: 'var(--mut)', fontWeight: 500 }}>
                            {stats.done >= stats.total && stats.total > 0 ? 'Chiến binh xuất sắc' : 'Đang tích cực ôn luyện'}
                          </small>
                        </span>
                        <span className="ap-honor-score">
                          {stats.avg != null ? `${stats.avg}%` : 'Chưa thi'}
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="ap-card">
                  <p className="ap-kicker">Chờ duyệt</p>
                  <h2>Yêu cầu đang gửi</h2>
                  <p className="ap-sub">{pendingClasses.length} lớp đang chờ giáo viên xác nhận.</p>
                  <div className="ap-foot-actions">
                    {pendingClasses.map((c) => (
                      <button key={c.id} type="button" className="ap-btn sm" onClick={() => handleCancelPending(c)}>
                        Hủy yêu cầu {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* CỘT PHẢI (MAIN EXAM & LEADERBOARD SECTION) */}
            <section className="ap-card">
              {/* THANH CHUYỂN 2 TAB THÔNG MINH */}
              <div className="ap-main-tabs" role="tablist">
                <button
                  type="button"
                  className={`ap-main-tab ${mainView === 'exams' ? 'active' : ''}`}
                  onClick={() => setMainView('exams')}
                  aria-selected={mainView === 'exams'}
                >
                  <IconBook size={15} /> Bài tập & Đề thi
                  {stats.pending > 0 && <span className="ap-tab-badge urgent">{stats.pending}</span>}
                </button>

                <button
                  type="button"
                  className={`ap-main-tab ${mainView === 'leaderboard' ? 'active' : ''}`}
                  onClick={() => setMainView('leaderboard')}
                  aria-selected={mainView === 'leaderboard'}
                >
                  <IconTrophy size={15} /> Bảng xếp hạng lớp
                  <span className="ap-tab-badge">Top 10</span>
                </button>
              </div>

              {/* TAB 1: BÀI TẬP & ĐỀ THI */}
              {mainView === 'exams' && (
                <>
                  {/* BANNER BÀI TẬP CẦN NỘP GẤP (NẾU CÓ) */}
                  {urgentExam && (
                    <div className="ap-urgent-hero">
                      <div className="ap-urgent-hero-left">
                        <div className="ap-urgent-icon-pulse">
                          <IconClock size={20} />
                        </div>
                        <div className="ap-urgent-hero-text">
                          <h4>Bài tập sắp hết hạn: {urgentExam.exam.title}</h4>
                          <p>
                            Thời hạn: <b style={{ color: 'var(--err)' }}>{urgentExam.dl.text}</b> · {urgentExam.exam.questions?.length || 0} câu · {urgentExam.exam.duration || 45} phút
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ap-btn primary sm"
                        onClick={() => openExam(urgentExam.exam)}
                      >
                        Vào làm ngay <IconArrowRight size={13} />
                      </button>
                    </div>
                  )}

                  {/* THANH MINI XẾP HẠNG THU GỌN */}
                  <div className="ap-mini-leaderboard-bar">
                    <div className="ap-mini-lb-left">
                      <IconTrophy size={15} />
                      <span>Xem thứ hạng và điểm thi đua của bạn cùng các bạn trong lớp</span>
                    </div>
                    <button
                      type="button"
                      className="ap-mini-lb-link"
                      onClick={() => setMainView('leaderboard')}
                    >
                      Mở Bảng xếp hạng <IconArrowRight size={12} />
                    </button>
                  </div>

                  {classes.length > 0 && (
                    <div className="ap-toolbar">
                      <label className="ap-search">
                        <IconSearch size={15} />
                        <input
                          ref={searchRef}
                          type="search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Tìm kiếm đề thi theo tên..."
                          aria-label="Tìm đề"
                        />
                      </label>

                      {/* SEGMENTED FILTER */}
                      <div className="ap-seg" role="group">
                        {[
                          ['all', 'Tất cả', stats.total],
                          ['todo', 'Chưa làm', stats.pending],
                          ['urgent', 'Sắp hết hạn', enrichedExams.filter((e) => fmtDeadline(e.closesAt)?.isUrgent && (e._st.key === 'todo' || e._st.key === 'doing')).length],
                          ['done', 'Đã làm', stats.done],
                        ].map(([k, label, n]) => (
                          <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
                            {label}{n > 0 && <em>{n}</em>}
                          </button>
                        ))}
                      </div>

                      {/* SORT SELECT */}
                      <select className="ap-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp">
                        <option value="deadline">Sắp tới hạn</option>
                        <option value="newest">Mới giao</option>
                        <option value="score">Điểm cao</option>
                      </select>

                      <button
                        type="button"
                        className="ap-btn sm ghost"
                        onClick={() => selectedClass && loadExams(selectedClass.id)}
                        disabled={loadingExams}
                        aria-label="Làm mới danh sách"
                        title="Làm mới đề thi"
                      >
                        <IconRefresh size={14} />
                      </button>
                    </div>
                  )}

                  {loadingExams && exams.length === 0 ? (
                    <div className="ap-loading">
                      <div className="ap-spinner" />
                      <p>Đang tải danh sách bài tập…</p>
                    </div>
                  ) : filteredExams.length === 0 ? (
                    <div className="ap-empty" style={{ padding: '2.5rem 0.5rem' }}>
                      <h3>Không tìm thấy đề thi</h3>
                      <p>{filter !== 'all' || search ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Lớp này hiện chưa có bài tập nào. Chờ giáo viên giao đề nhé!'}</p>
                    </div>
                  ) : (
                    /* CHIA MỤC THEO MÔN */
                    <div className="ap-subject-groups">
                      {subjectGroups.map((g) => (
                        <section key={g.name} className="ap-subject-group">
                          <header className="ap-subject-head">
                            <h3 className="ap-subject-name">{g.name}</h3>
                            <span className="ap-subject-meta">{g.items.length} đề · {g.done} đã làm</span>
                            {g.avg === null ? (
                              <span className="ap-band band-na">Chưa có điểm</span>
                            ) : (
                              <span className={`ap-band band-${g.band}`}>
                                {bandLabel(g.band)} · TB {g.avg}%
                              </span>
                            )}
                          </header>
                          <ul className="ap-exams">
                            {g.items.map((ex) => {
                              const dl = fmtDeadline(ex.closesAt);
                              const st = ex._st;
                              const sub = ex._sub;
                              const StatusIcon = st.Icon;
                              const pct = sub?.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : null;
                              const retryPermit = retryPermitsMap[ex.id];
                              const isRetryPending = retryPermit?.status === 'pending';
                              const isRetryApproved = retryPermit?.status === 'approved';

                              return (
                                <li key={ex.id} className="ap-exam">
                                  <div>
                                    <div className="ap-exam-top">
                                      <span className={'ap-pill ' + st.key}>
                                        <StatusIcon size={12} /> {st.label}
                                      </span>

                                      {dl && st.key !== 'done' && (
                                        <span className={'ap-pill ' + dl.tone}>
                                          <IconClock size={11} /> {dl.text}
                                        </span>
                                      )}

                                      {isRetryPending && (
                                        <span className="ap-pill soon" title="Đơn xin thi lại đã được gửi đến giáo viên">
                                          <IconHourglass size={11} /> Đang chờ GV duyệt thi lại
                                        </span>
                                      )}

                                      {isRetryApproved && (
                                        <span className="ap-pill done" title="Giáo viên đã cho phép bạn thi lại">
                                          <IconCheck size={11} /> Được phép thi lại
                                        </span>
                                      )}
                                    </div>
                                    <h3>{ex.title}</h3>
                                    <p>
                                      <span>{ex.questions?.length || 0} câu hỏi</span>
                                      <span>·</span>
                                      <span>{ex.duration || '—'} phút</span>
                                      <span>·</span>
                                      <span>{ex.totalPoints || 10} điểm</span>
                                      {pct != null && (
                                        <>
                                          <span>·</span>
                                          <b style={{ color: pct >= 50 ? 'var(--ok)' : 'var(--warn)' }}>
                                            Điểm đạt: {sub.score}/{sub.totalPoints} ({pct}%)
                                          </b>
                                        </>
                                      )}
                                    </p>
                                  </div>

                                  <div className="ap-exam-cta">
                                    {sub ? (
                                      <>
                                        <button
                                          type="button"
                                          className="ap-btn sm"
                                          onClick={() => { window.location.hash = `exam/${ex.token || ex.id}`; }}
                                          title="Xem lại chi tiết từng câu trong bài thi"
                                        >
                                          Xem lại bài
                                        </button>

                                        <button
                                          type="button"
                                          className="ap-btn sm ghost"
                                          onClick={() => handleSaveWrongToNotebook(ex, sub)}
                                          title="Lưu câu làm sai vào Sổ tay lỗi"
                                        >
                                          <IconNotebook size={12} /> Lưu câu sai
                                        </button>

                                        <button
                                          type="button"
                                          className="ap-btn sm ghost"
                                          onClick={() => handleAskAIAboutExam(ex, sub)}
                                          title="Nhờ Trợ lý AI phân tích và chữa đề"
                                        >
                                          <IconSparkles size={12} /> Nhờ AI chữa
                                        </button>

                                        {ex.allowRetry || isRetryApproved ? (
                                          <button
                                            type="button"
                                            className="ap-btn sm primary"
                                            onClick={() => openExam(ex)}
                                          >
                                            Làm lại
                                          </button>
                                        ) : st.locked && !isRetryPending ? (
                                          <button
                                            type="button"
                                            className="ap-btn sm"
                                            onClick={() => { setRetryExam(ex); setRetryError(''); }}
                                            title="Gửi lý do xin phép giáo viên mở lại bài thi"
                                          >
                                            <IconBell size={12} /> Xin thi lại
                                          </button>
                                        ) : null}
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        className="ap-btn sm primary"
                                        disabled={st.key !== 'todo' && st.key !== 'doing'}
                                        onClick={() => openExam(ex)}
                                      >
                                        {st.key === 'doing' ? (
                                          <><IconPlay size={13} /> Tiếp tục làm</>
                                        ) : st.key === 'soon' ? (
                                          <><IconClock size={13} /> Chưa mở</>
                                        ) : st.key === 'closed' ? (
                                          <><IconBan size={13} /> Đã hết hạn</>
                                        ) : (
                                          <><IconPlay size={13} /> Vào thi ngay</>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: BẢNG XẾP HẠNG TOÀN LỚP */}
              {mainView === 'leaderboard' && (
                selectedClass ? (
                  <LeaderboardCard
                    classId={selectedClass.id}
                    className={selectedClass.name}
                    uid={user?.uid}
                  />
                ) : (
                  <div className="ap-empty">
                    <IconTrophy size={36} />
                    <p>Vui lòng chọn một lớp để xem bảng xếp hạng.</p>
                  </div>
                )
              )}
            </section>
          </div>
        </>
      )}

      {/* MODAL NHẬP MÃ VÀO LỚP */}
      {showJoin && (
        <div className="ap-sheet-bg" role="dialog" aria-modal="true" aria-label="Tham gia lớp">
          <div className="ap-sheet">
            <header>
              <h2>Tham gia lớp mới</h2>
              <button
                type="button"
                className="ap-x"
                onClick={() => setShowJoin(false)}
                aria-label="Đóng modal"
              >
                <IconClose size={16} />
              </button>
            </header>
            <p>Dán mã lớp gồm chữ và số do thầy cô cung cấp (ví dụ: 11A7-X8K9).</p>

            <form onSubmit={handleJoin}>
              <div className="ap-field">
                <span>MÃ LỚP HỌC</span>
                <input
                  type="text"
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                  placeholder="VD: 11A7-X8K9"
                  autoFocus
                />
              </div>

              {joinError && <div className="ap-err"><IconAlert size={14} /> {joinError}</div>}
              {joinPendingMsg && <div className="ap-ok"><IconCheck size={14} /> {joinPendingMsg}</div>}

              <div className="ap-sheet-actions">
                <button type="button" className="ap-btn" onClick={() => setShowJoin(false)}>
                  Hủy
                </button>
                <button type="submit" className="ap-btn primary" disabled={joinLoading || !joinKey.trim()}>
                  {joinLoading ? 'Đang kiểm tra…' : 'Tham gia lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XIN THI LẠI */}
      {retryExam && (
        <RetryRequestModal
          exam={retryExam}
          loading={retrySending}
          error={retryError}
          onClose={() => setRetryExam(null)}
          onSubmit={handleSubmitRetry}
        />
      )}

      {/* MODAL XÁC NHẬN RỜI LỚP NỘI BỘ */}
      {confirmLeaveCls && (
        <LeaveClassConfirmModal
          cls={confirmLeaveCls}
          busy={busyLeave}
          onCancel={() => setConfirmLeaveCls(null)}
          onConfirm={handleConfirmLeave}
        />
      )}

      {/* MODAL LUYỆN 5 CÂU GỠ ĐIỂM (ELEC AI QUICK DRILL) */}
      {drillTopic && (
        <QuickDrillModal
          topic={drillTopic}
          uid={user?.uid}
          onClose={() => setDrillTopic(null)}
          onReward={(score) => {
            say(`Hoàn thành xuất sắc! Đã cộng +${score * 10} XP vào hồ sơ của bạn.`);
          }}
        />
      )}

      {/* TOAST THÔNG BÁO NỔI */}
      {toast && (
        <div className="ap-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
