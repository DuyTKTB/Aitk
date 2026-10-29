/* ============================================================
   ElecTutorOnboardingModal.jsx — GIAI ĐOẠN 3 (NÂNG CẤP MASCOT & VISIONOS UI)
   ------------------------------------------------------------
   • Ẩn toàn bộ thanh điều hướng (navbar, mobile header, bottom nav, FAB) khi hiển thị.
   • Linh vật ELEC AI thiết kế 3D vector cao cấp, mắt anime lấp lánh, hiệu ứng bay bổng & biểu cảm động.
   • Bố cục Bento Glassmorphism chuẩn Apple VisionOS với hào quang Aurora và lưới không gian sâu.
   • Hỗ trợ bàn phím đầy đủ (↑ ↓ Enter Esc) và tối ưu responsive từ 360px đến desktop.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getReferenceMetadata,
  searchSchools,
  getMajorsBySchool,
  getSchoolById,
  getMajorById,
  getExamById,
  suggestTargetScore,
  getUserAspirationsState,
  upsertAspiration,
  updateUserSettings,
} from '../../lib/aspirationService.js';
import '../../styles/elec-tutor-modal.css';

/* ============================================================
   BỘ ICON SVG CHO ELEC TUTOR
   ============================================================ */
const IcoClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7.5" />
    <line x1="20.5" y1="20.5" x2="16.2" y2="16.2" />
  </svg>
);

const IcoArrowLeft = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IcoArrowRight = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IcoPlus = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcoCheck = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ============================================================
   LINH VẬT ELEC AI NÂNG CẤP 3D VECTOR CAO CẤP (100% SVG THUẦN)
   ============================================================ */
function ElecTutorMascot({ mood = 'default' }) {
  return (
    <div className="et-mascot-stage" aria-hidden="true">
      <div className="et-mascot-ambient-glow" />
      <svg className={`et-mascot-svg mood-${mood}`} viewBox="0 0 380 440" fill="none">
        <defs>
          <radialGradient id="et-shadow-soft" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#071026" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="et-suit-3d" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="et-face-3d" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <linearGradient id="et-band-3d" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="et-bolt-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
          <linearGradient id="et-flask-fluid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="et-bolt-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Bóng tiếp đất thở theo nhịp nổi */}
        <ellipse className="et-ground-shadow" cx="190" cy="412" rx="92" ry="14" fill="url(#et-shadow-soft)" />

        {/* Vòng hào quang năng lượng công nghệ quay nghiêng */}
        <ellipse
          cx="190"
          cy="280"
          rx="145"
          ry="48"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.32"
          transform="rotate(-12 190 280)"
        />

        {/* Bình năng lượng Hóa học sau lưng (Balo hóa nghiệm) */}
        <g className="et-backpack-group">
          <rect x="240" y="225" width="56" height="88" rx="24" fill="url(#et-flask-fluid)" stroke="#1e293b" strokeWidth="3.5" />
          <path d="M252 245 H284" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
          <circle cx="268" cy="275" r="9" fill="#ffffff" opacity="0.4" />
          <circle cx="280" cy="258" r="5" fill="#ffffff" opacity="0.55" />
          <rect x="258" y="196" width="18" height="32" rx="7" fill="#f1f5f9" stroke="#1e293b" strokeWidth="3" transform="rotate(10 258 196)" />
          <circle cx="274" cy="184" r="5.5" fill="#38bdf8" />
          <circle cx="286" cy="172" r="3.5" fill="#7dd3fc" />
        </g>

        {/* Chân & Giày Sneaker công nghệ cao */}
        <g className="et-legs-group">
          <path d="M144 328 L140 380 Q140 392 158 392 L172 392 Q178 392 178 380 L176 328 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M194 328 L192 380 Q192 392 210 392 L224 392 Q230 392 228 380 L224 328 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="3.5" />

          {/* Giày trái */}
          <ellipse cx="156" cy="392" rx="27" ry="13" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M134 392 Q156 384 178 392" stroke="#3b82f6" strokeWidth="2.5" fill="none" />

          {/* Giày phải */}
          <ellipse cx="212" cy="392" rx="27" ry="13" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M190 392 Q212 384 234 392" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
        </g>

        {/* Thân áo Hoodie phi hành 3D */}
        <g className="et-torso-group">
          <path d="M126 238 Q190 220 252 238 Q268 296 250 348 Q190 364 128 348 Q110 296 126 238 Z" fill="url(#et-suit-3d)" stroke="#0f172a" strokeWidth="3.8" />
          {/* Vệt bóng sáng 3D */}
          <path d="M135 248 Q190 234 242 248 Q234 290 230 320" fill="none" stroke="#93c5fd" strokeWidth="2.5" opacity="0.55" />
          {/* Lõi tia chớp vàng phát sáng rực rỡ */}
          <path d="M194 260 L170 300 H190 L180 334 L212 288 H192 Z" fill="url(#et-bolt-gold)" stroke="#b45309" strokeWidth="2" filter="url(#et-bolt-glow)" />
        </g>

        {/* Tay trái chào vẫy */}
        <g className="et-left-arm">
          <path d="M128 254 Q92 262 96 292 Q98 312 124 308" fill="none" stroke="#2563eb" strokeWidth="24" strokeLinecap="round" />
          <circle cx="116" cy="304" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M108 300 Q116 295 124 300" stroke="#94a3b8" strokeWidth="2" fill="none" />
        </g>

        {/* Tay phải nhiệt tình */}
        <g className="et-right-arm">
          <path d="M248 254 Q278 260 274 290 Q270 310 246 304" fill="none" stroke="#2563eb" strokeWidth="24" strokeLinecap="round" />
          <circle cx="252" cy="298" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M244 294 Q252 289 260 294" stroke="#94a3b8" strokeWidth="2" fill="none" />
        </g>

        {/* Đầu & Khuôn mặt đáng yêu */}
        <g className="et-head-group">
          {/* Tóc công nghệ 3 chỏm */}
          <ellipse cx="158" cy="52" rx="22" ry="38" transform="rotate(-22 158 52)" fill="#2563eb" stroke="#0f172a" strokeWidth="3.5" />
          <ellipse cx="222" cy="54" rx="20" ry="36" transform="rotate(22 222 54)" fill="#2563eb" stroke="#0f172a" strokeWidth="3.5" />
          <ellipse cx="190" cy="40" rx="24" ry="42" fill="#3b82f6" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M186 16 Q194 14 196 28" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />

          {/* Ăng-ten phát sóng năng lượng */}
          <path d="M190 28 L190 6" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="190" cy="4" r="8" fill="#38bdf8" filter="url(#et-bolt-glow)" />
          <circle cx="190" cy="4" r="4" fill="#ffffff" />

          {/* Khuôn mặt sứ bóng bẩy */}
          <ellipse cx="190" cy="150" rx="112" ry="94" fill="url(#et-face-3d)" stroke="#0f172a" strokeWidth="4" />

          {/* Băng đô / Kính Visor công nghệ */}
          <path d="M82 110 Q190 88 298 110 L300 146 Q190 126 80 146 Z" fill="url(#et-band-3d)" stroke="#0f172a" strokeWidth="3.5" />
          <path d="M86 114 Q190 94 294 114" stroke="#93c5fd" strokeWidth="2" opacity="0.75" />
          <text
            x="190"
            y="132"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="21"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="2"
          >
            ELEC AI
          </text>

          {/* Má hồng hào rực rỡ */}
          <ellipse cx="122" cy="192" rx="18" ry="10" fill="#fda4af" opacity="0.75" />
          <ellipse cx="258" cy="192" rx="18" ry="10" fill="#fda4af" opacity="0.75" />
          <circle cx="126" cy="190" r="2.2" fill="#ffffff" />
          <circle cx="254" cy="190" r="2.2" fill="#ffffff" />

          {/* Mắt trái (Anime Tech Sparkle) */}
          <ellipse cx="152" cy="170" rx="18" ry="22" fill="#0f172a" />
          <path d="M138 178 Q152 190 166 178 Q166 186 152 188 Q138 186 138 178 Z" fill="#2563eb" />
          <circle cx="146" cy="162" r="7" fill="#ffffff" />
          <circle cx="158" cy="178" r="3.5" fill="#60a5fa" />
          <circle cx="144" cy="176" r="2" fill="#ffffff" />

          {/* Mắt phải (Biểu cảm tương tác: Nháy mắt / Hạnh phúc / Bình thường) */}
          {mood === 'wink' ? (
            <g className="et-eye-wink">
              <path d="M206 172 Q224 154 242 172" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <path d="M242 168 L248 162" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
              {/* Ngôi sao lấp lánh phóng ra từ cú nháy mắt */}
              <path d="M256 154 L260 162 L268 166 L260 170 L256 178 L252 170 L244 166 L252 162 Z" fill="#facc15" />
            </g>
          ) : mood === 'happy' ? (
            <g className="et-eye-happy">
              <path d="M206 172 Q224 154 242 172" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
              <path d="M136 172 Q152 154 168 172" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
            </g>
          ) : (
            <g className="et-eye-default">
              <ellipse cx="226" cy="170" rx="18" ry="22" fill="#0f172a" />
              <path d="M212 178 Q226 190 240 178 Q240 186 226 188 Q212 186 212 178 Z" fill="#2563eb" />
              <circle cx="220" cy="162" r="7" fill="#ffffff" />
              <circle cx="232" cy="178" r="3.5" fill="#60a5fa" />
              <circle cx="218" cy="176" r="2" fill="#ffffff" />
            </g>
          )}

          {/* Nụ cười vui tươi */}
          <path d="M172 194 Q190 188 208 194 Q206 222 190 222 Q174 222 172 194 Z" fill="#991b1b" stroke="#0f172a" strokeWidth="3" />
          <path d="M176 194 Q190 198 204 194" fill="#ffffff" />
          <ellipse cx="190" cy="214" rx="11" ry="6" fill="#f472b6" />
        </g>

        {/* Các vì sao công nghệ lấp lánh xung quanh */}
        <g className="et-sparkles">
          <path className="et-sparkle-1" d="M58 170 L64 184 L78 190 L64 196 L58 210 L52 196 L38 190 L52 184 Z" fill="#38bdf8" />
          <path className="et-sparkle-2" d="M316 112 L320 122 L330 126 L320 130 L316 140 L312 130 L302 126 L312 122 Z" fill="#60a5fa" />
          <path className="et-sparkle-3" d="M328 238 L331 246 L339 249 L331 252 L328 260 L325 252 L317 249 L325 246 Z" fill="#facc15" />
        </g>
      </svg>
    </div>
  );
}

export default function ElecTutorOnboardingModal({
  open,
  uid,
  initialAspiration = null,
  initialExamId = null,
  onClose,
  onCompleted,
}) {
  const meta = useMemo(() => getReferenceMetadata(), []);
  const [userState, setUserState] = useState(() => getUserAspirationsState(uid));

  const [step, setStep] = useState(1); // 1: Trường, 2: Ngành, 3: Mục tiêu, 4: Tóm tắt
  const [schoolQuery, setSchoolQuery] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState('A00');
  const [targetScore, setTargetScore] = useState(25.5);
  const [targetChemScore, setTargetChemScore] = useState(8.5);

  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const examId = initialExamId || userState.selectedExamId || 'THPTQG';
  const exam = useMemo(() => getExamById(examId), [examId]);

  // Ẩn hoàn toàn navbar & các phần tử nổi trên trang khi modal mở
  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('et-modal-open');
    return () => {
      document.body.classList.remove('et-modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const latest = getUserAspirationsState(uid);
    setUserState(latest);

    if (initialAspiration) {
      const sch = getSchoolById(initialAspiration.schoolId) || initialAspiration.school;
      const maj = getMajorById(initialAspiration.majorId) || initialAspiration.major;
      setSelectedSchool(sch);
      setSelectedMajor(maj);
      setSelectedBlock(initialAspiration.block || maj?.blocks?.[0] || 'A00');
      setTargetScore(initialAspiration.targetScore || 25.5);
      setTargetChemScore(initialAspiration.targetChemScore || 8.5);
      setStep(3);
    } else {
      setSelectedSchool(null);
      setSelectedMajor(null);
      setSchoolQuery('');
      setMajorQuery('');
      setHighlightIdx(0);
      setStep(1);
    }
  }, [open, uid, initialAspiration]);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const schools = useMemo(() => searchSchools(schoolQuery), [schoolQuery]);
  const majors = useMemo(
    () => (selectedSchool ? getMajorsBySchool(selectedSchool.id, majorQuery) : []),
    [selectedSchool, majorQuery],
  );

  const suggestion = useMemo(
    () => (selectedMajor ? suggestTargetScore(selectedMajor, exam.id) : null),
    [selectedMajor, exam.id],
  );

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-highlighted="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, step]);

  if (!open) return null;

  const pickSchool = (sch) => {
    if (!sch) return;
    setSelectedSchool(sch);
    setMajorQuery('');
    setHighlightIdx(0);
    setStep(2);
  };

  const pickMajor = (maj) => {
    if (!maj) return;
    setSelectedMajor(maj);
    setSelectedBlock(maj.blocks?.[0] || 'A00');
    const sug = suggestTargetScore(maj, exam.id);
    setTargetScore(sug.suggestedTarget);
    setTargetChemScore(sug.targetChemScore);
    setStep(3);
  };

  const handleConfirmTarget = () => {
    if (!selectedSchool || !selectedMajor) return;
    const updated = upsertAspiration(uid, {
      id: initialAspiration?.id,
      examId: exam.id,
      schoolId: selectedSchool.id,
      majorId: selectedMajor.id,
      block: selectedBlock,
      targetScore,
      targetChemScore,
      setActive: true,
    });
    setUserState(updated);
    setStep(4);
  };

  const handleAddAnother = () => {
    if (userState.aspirations.length >= 3) return;
    setSelectedSchool(null);
    setSelectedMajor(null);
    setSchoolQuery('');
    setMajorQuery('');
    setHighlightIdx(0);
    setStep(1);
  };

  const handleFinish = () => {
    updateUserSettings(uid, { onboardingCompleted: true });
    onCompleted?.(getUserAspirationsState(uid));
    onClose?.();
  };

  const handleKeyDownStep1 = (e) => {
    if (!schools.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % schools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + schools.length) % schools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickSchool(schools[highlightIdx] || schools[0]);
    }
  };

  const handleKeyDownStep2 = (e) => {
    if (!majors.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % majors.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i - 1 + majors.length) % majors.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickMajor(majors[highlightIdx] || majors[0]);
    }
  };

  const handleTargetSlider = (val) => {
    const num = Number(val);
    setTargetScore(num);
    const ratio = num / (exam.scale || 30);
    const chem = Math.min(10, Math.max(5, Math.round((ratio * 10 + 0.25) * 4) / 4));
    setTargetChemScore(chem);
  };

  let bubbleMessage = '';
  let mood = 'default';
  if (step === 1) {
    bubbleMessage = 'Chào bạn! Mình cùng chọn một trường đại học mục tiêu nhé. Bạn đang nhắm tới trường nào?';
    mood = 'default';
  } else if (step === 2) {
    bubbleMessage = `Ở ${selectedSchool?.name || selectedSchool?.code}, bạn muốn học ngành nào? Chọn ngành để ELEC AI đề xuất mục tiêu tuyển sinh chính xác nhé.`;
    mood = 'think';
  } else if (step === 3) {
    const cutoffText = suggestion?.cutoffScore != null
      ? `điểm chuẩn gần nhất là ${suggestion.cutoffScore} (${suggestion.referenceLabel})`
      : 'xét tuyển theo ngưỡng riêng';
    bubbleMessage = `Ngành ${selectedMajor?.name} (${selectedSchool?.code}) có ${cutoffText}. Mình đề xuất mục tiêu ${suggestion?.suggestedTarget}/${exam.scale} điểm (đã cộng biên an toàn). Bạn điều chỉnh thanh trượt nếu muốn nhé!`;
    mood = 'wink';
  } else {
    bubbleMessage = `Tuyệt vời! Bạn đã lưu ${userState.aspirations.length}/3 nguyện vọng ưu tiên. Bạn muốn thêm nguyện vọng khác hay hoàn tất để vào lộ trình học ngay?`;
    mood = 'happy';
  }

  const aspirationsCount = userState.aspirations.length;
  const isMaxReached = aspirationsCount >= 3;

  return createPortal(
    <div
      className="et-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="ELEC Tutor — Chọn nguyện vọng đại học và đặt mục tiêu"
    >
      {/* ── Hào quang Aurora & Lưới nền công nghệ ── */}
      <div className="et-ambient-glow-1" aria-hidden="true" />
      <div className="et-ambient-glow-2" aria-hidden="true" />
      <div className="et-grid-pattern" aria-hidden="true" />

      {/* ── Thanh Header trên cùng ── */}
      <header className="et-topbar">
        <div className="et-brand">
          <div className="et-brand-pill">
            <div className="et-brand-logo-frame">
              <img
                src="/img/logo.png"
                alt="ELEC AI Logomark"
                className="et-brand-logomark"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="et-brand-logo-glow" aria-hidden="true" />
            </div>
            <div className="et-brand-meta">
              <div className="et-brand-title-row">
                <strong>ELEC AI</strong>
                <span className="et-brand-sub-badge">TUTOR</span>
              </div>
              <span>HỌC CÙNG ELEC · {meta.nhanHienThi.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* ── Bộ đếm bước trực quan ── */}
        <div className="et-step-indicator" aria-label={`Bước ${step} trên 4`}>
          <div className={`et-step-dot ${step >= 1 ? 'is-active' : ''} ${step === 1 ? 'is-current' : ''}`}>
            <span>1</span>
            <small>Trường</small>
          </div>
          <div className="et-step-connector" />
          <div className={`et-step-dot ${step >= 2 ? 'is-active' : ''} ${step === 2 ? 'is-current' : ''}`}>
            <span>2</span>
            <small>Ngành</small>
          </div>
          <div className="et-step-connector" />
          <div className={`et-step-dot ${step >= 3 ? 'is-active' : ''} ${step === 3 ? 'is-current' : ''}`}>
            <span>3</span>
            <small>Mục tiêu</small>
          </div>
          <div className="et-step-connector" />
          <div className={`et-step-dot ${step >= 4 ? 'is-active' : ''} ${step === 4 ? 'is-current' : ''}`}>
            <span>4</span>
            <small>Hồ sơ</small>
          </div>
        </div>

        <div className="et-topbar-right">
          <span className="et-count-pill" title="Tối đa 3 nguyện vọng">
            Nguyện vọng: <b>{aspirationsCount}/3</b>
          </span>
          <button
            type="button"
            className="et-close-btn"
            onClick={onClose}
            aria-label="Đóng cửa sổ chọn nguyện vọng"
          >
            <span>Đóng</span>
            <IcoClose size={15} />
          </button>
        </div>
      </header>

      {/* ── Nội dung chính 2 cột ── */}
      <div className="et-stage">
        <div className="et-left-col" key={`step-${step}`}>
          <div className="et-tutor-header">
            <div className="et-tutor-avatar-frame" aria-hidden="true">
              <img
                src="/img/logo.png"
                alt="ELEC Tutor Logomark"
                className="et-tutor-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="et-tutor-status-badge" title="Đang trực tuyến">
                <span className="et-tutor-status-live" />
              </span>
            </div>
            <div className="et-tutor-info">
              <div className="et-tutor-title-row">
                <b>ELEC Tutor</b>
                <span className="et-tutor-tag">TRỢ LÝ AI</span>
              </div>
              <span>Trợ lý học tập đồng hành cùng bạn</span>
            </div>
          </div>

          <div className="et-speech-bubble" role="status" aria-live="polite">
            <div className="et-speech-bubble-tag">
              <img src="/img/logo.png" alt="" className="et-bubble-tag-logo" />
              <span>ELEC Tutor · Hướng dẫn đặt mục tiêu</span>
            </div>
            <p>{bubbleMessage}</p>
          </div>

          {/* ── BƯỚC 1: CHỌN TRƯỜNG ĐẠI HỌC ── */}
          {step === 1 && (
            <div className="et-interact-box et-step-anim">
              <div className="et-search-wrap">
                <span className="et-search-ico" aria-hidden="true">
                  <IcoSearch size={16} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={schoolQuery}
                  onChange={(e) => {
                    setSchoolQuery(e.target.value);
                    setHighlightIdx(0);
                  }}
                  onKeyDown={handleKeyDownStep1}
                  placeholder="Tìm trường (vd Bách Khoa, ANND, NEU, Y Hà Nội)..."
                  aria-label="Tìm trường đại học theo tên hoặc mã viết tắt"
                />
                <span className="et-search-kbd">↑↓ Enter</span>
              </div>

              <div className="et-scroll-list" role="listbox" aria-label="Danh sách trường đại học" ref={listRef}>
                {schools.length === 0 ? (
                  <div className="et-empty">
                    Không tìm thấy trường phù hợp với &ldquo;{schoolQuery}&rdquo;.
                  </div>
                ) : (
                  schools.map((sch, idx) => {
                    const isHi = idx === highlightIdx;
                    return (
                      <button
                        key={sch.id}
                        type="button"
                        role="option"
                        aria-selected={isHi}
                        data-highlighted={isHi}
                        className={`et-list-item ${isHi ? 'is-hi' : ''}`}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        onClick={() => pickSchool(sch)}
                      >
                        <span className="et-item-title">{sch.name}</span>
                        <span className="et-code-badge">{sch.code}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {aspirationsCount > 0 && (
                <div className="et-step-footer">
                  <button type="button" className="et-back-link" onClick={() => setStep(4)}>
                    <IcoArrowLeft size={14} />
                    <span>Xem danh sách đã chọn ({aspirationsCount}/3)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── BƯỚC 2: CHỌN NGÀNH CỦA TRƯỜNG ĐÃ CHỌN ── */}
          {step === 2 && (
            <div className="et-interact-box et-step-anim">
              <div className="et-search-wrap">
                <span className="et-search-ico" aria-hidden="true">
                  <IcoSearch size={16} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={majorQuery}
                  onChange={(e) => {
                    setMajorQuery(e.target.value);
                    setHighlightIdx(0);
                  }}
                  onKeyDown={handleKeyDownStep2}
                  placeholder="Tìm ngành (vd CNTT, Hóa dược, Y khoa, 7860114)..."
                  aria-label="Tìm ngành theo tên hoặc mã ngành"
                />
                <span className="et-search-kbd">↑↓ Enter</span>
              </div>

              <div className="et-scroll-list" role="listbox" aria-label="Danh sách ngành đào tạo" ref={listRef}>
                {majors.length === 0 ? (
                  <div className="et-empty">
                    Không tìm thấy ngành khớp với &ldquo;{majorQuery}&rdquo;.
                  </div>
                ) : (
                  majors.map((maj, idx) => {
                    const isHi = idx === highlightIdx;
                    const cutoff = maj.cutoffs?.[0];
                    return (
                      <button
                        key={maj.id}
                        type="button"
                        role="option"
                        aria-selected={isHi}
                        data-highlighted={isHi}
                        className={`et-list-item major-row ${isHi ? 'is-hi' : ''}`}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        onClick={() => pickMajor(maj)}
                      >
                        <div className="et-major-info">
                          <span className="et-item-title">{maj.name}</span>
                          <small className="et-major-meta">
                            <span>Tổ hợp: <b>{(maj.blocks || []).join(', ')}</b></span>
                            {maj.note && <span> · {maj.note}</span>}
                            {cutoff?.score != null && (
                              <span> · Điểm chuẩn {cutoff.year}: <b>{cutoff.score}</b></span>
                            )}
                          </small>
                        </div>
                        <span className="et-code-badge">{maj.majorCode}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="et-step-footer">
                <button type="button" className="et-back-link" onClick={() => setStep(1)}>
                  <IcoArrowLeft size={14} />
                  <span>Quay lại</span>
                </button>
                <span className="et-ref-tag">{meta.nhanHienThi}</span>
              </div>
            </div>
          )}

          {/* ── BƯỚC 3: XÁC NHẬN & ĐẶT ĐIỂM MỤC TIÊU BẰNG THANH TRƯỢT ── */}
          {step === 3 && selectedSchool && selectedMajor && (
            <div className="et-interact-box et-target-panel et-step-anim">
              <div className="et-target-summary">
                <div className="et-target-school-badge">
                  <span className="et-code-badge large">{selectedSchool.code}</span>
                  <strong>{selectedSchool.name}</strong>
                </div>
                <p className="et-target-major">{selectedMajor.name}</p>
                <div className="et-target-chips">
                  <span className="et-chip">Mã ngành: <b>{selectedMajor.majorCode}</b></span>
                  <span className="et-chip cutoff">
                    Điểm chuẩn {suggestion?.cutoffYear || meta.nam}:{' '}
                    <b>{suggestion?.cutoffScore ?? 'Xét riêng'}</b>
                  </span>
                  <span className="et-chip ref">{suggestion?.referenceLabel || meta.nhanHienThi}</span>
                </div>
              </div>

              {Array.isArray(selectedMajor.blocks) && selectedMajor.blocks.length > 0 && (
                <div className="et-block-picker">
                  <span className="et-block-label">Tổ hợp môn xét tuyển:</span>
                  <div className="et-block-pills">
                    {selectedMajor.blocks.map((blk) => (
                      <button
                        key={blk}
                        type="button"
                        className={`et-block-pill ${selectedBlock === blk ? 'on' : ''}`}
                        onClick={() => setSelectedBlock(blk)}
                      >
                        {blk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="et-slider-card">
                <div className="et-slider-head">
                  <span className="et-slider-title">Điểm mục tiêu xét tuyển ({exam.name})</span>
                  <div className="et-slider-target-val">
                    <strong>{targetScore.toFixed(1)}</strong>
                    <small>/ {exam.scale}đ</small>
                  </div>
                </div>

                <div className="et-slider-range-wrap">
                  <input
                    type="range"
                    min={suggestion?.min || 15}
                    max={suggestion?.max || exam.scale}
                    step={suggestion?.step || 0.25}
                    value={targetScore}
                    onChange={(e) => handleTargetSlider(e.target.value)}
                    className="et-range-input"
                    aria-label={`Mục tiêu điểm thi ${exam.name}`}
                  />
                </div>

                <div className="et-slider-insights">
                  <div className="et-insight-pill safe">
                    <span className="et-insight-dot" />
                    <span>
                      {suggestion?.cutoffScore != null && targetScore >= suggestion.cutoffScore
                        ? `Biên an toàn: +${(targetScore - suggestion.cutoffScore).toFixed(1)}đ so với điểm chuẩn`
                        : `Mục tiêu an toàn: ${suggestion?.suggestedTarget || 25.5}/${exam.scale}đ`}
                    </span>
                  </div>
                  <div className="et-insight-pill chem">
                    <span>🧪 Mục tiêu môn Hóa: <b>{targetChemScore}/10đ</b></span>
                  </div>
                </div>
              </div>

              <div className="et-step-footer">
                <button type="button" className="et-back-link" onClick={() => setStep(2)}>
                  <IcoArrowLeft size={14} />
                  <span>Quay lại</span>
                </button>
                <button type="button" className="et-primary-btn" onClick={handleConfirmTarget}>
                  <span>Xác nhận nguyện vọng</span>
                  <IcoArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 4: TÓM TẮT NGUYỆN VỌNG (1..3) ── */}
          {step === 4 && (
            <div className="et-interact-box et-summary-panel et-step-anim">
              <div className="et-summary-head">
                <span>Hồ sơ nguyện vọng của bạn ({aspirationsCount}/3)</span>
                <small>{meta.nhanHienThi}</small>
              </div>

              <ol className="et-summary-list">
                {userState.aspirations.map((asp) => (
                  <li key={asp.id} className="et-summary-item">
                    <span className={`et-prio-badge p${asp.priority}`}>{asp.priority}</span>
                    <div className="et-summary-body">
                      <b>{asp.school.code} — {asp.school.name}</b>
                      <small>{asp.major.name} · Tổ hợp {asp.block}</small>
                    </div>
                    <div className="et-summary-score">
                      <b>{asp.targetScore}<small>/{asp.exam.scale}</small></b>
                      <span>Hóa {asp.targetChemScore}đ</span>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="et-summary-actions">
                <button
                  type="button"
                  className="et-secondary-btn"
                  disabled={isMaxReached}
                  onClick={handleAddAnother}
                >
                  <IcoPlus size={15} />
                  <span>
                    {isMaxReached
                      ? 'Đã đủ 3/3 nguyện vọng'
                      : `Thêm nguyện vọng khác (${aspirationsCount}/3)`}
                  </span>
                </button>
                <button type="button" className="et-primary-btn" onClick={handleFinish}>
                  <IcoCheck size={15} />
                  <span>Hoàn tất &amp; Bắt đầu học</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Cột phải: Linh vật ELEC AI ── */}
        <div className="et-right-col">
          <ElecTutorMascot mood={mood} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
