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
  deleteAspiration,
  updateUserSettings,
} from '../../lib/aspirationService.js';
import { calculateSubjectScoreBreakdown } from '../../lib/aspirationAiEngine.js';
import { evaluatePortfolioHealth } from '../../lib/aspirationPortfolioOptimizer.js';
import '../../styles/elec-tutor-modal.css';

/* ============================================================
   BỘ ICON SVG CHO ELEC TUTOR (100% SVG THUẦN - 0 EMOJI)
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

const IcoLayers = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IcoShieldCheck = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const IcoAlertTriangle = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IcoTrash = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IcoBolt = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IcoTargetSmall = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IcoCompass = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IcoAward = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

/* ============================================================
   LINH VẬT ELEC AI NÂNG CẤP (ẢNH PNG TÁCH NỀN TRONG SUỐT CAO CẤP)
   ============================================================ */
const ELEC_TUTOR_MOOD_MAP = {
  default: '/img/elec/elec-hello.png',
  hello: '/img/elec/elec-hello.png',
  welcome: '/img/elec/elec-hello.png',
  think: '/img/elec/elec-think.png',
  thinking: '/img/elec/elec-think.png',
  wink: '/img/elec/elec-wink.png',
  happy: '/img/elec/elec-happy.png',
  celebrate: '/img/elec/elec-celebrate.png',
  fighting: '/img/elec/elec-fighting.png',
  test: '/img/elec/elec-fighting.png',
  diagnostic: '/img/elec/elec-fighting.png',
  cool: '/img/elec/elec-cool.png',
  shocked: '/img/elec/elec-shocked.png',
  love: '/img/elec/elec-love.png',
  sleepy: '/img/elec/elec-sleepy.png',
  saiyan: '/img/elec/elec-super-saiyan.png',
};

function ElecTutorMascot({ mood = 'default' }) {
  const imgSrc = ELEC_TUTOR_MOOD_MAP[mood] || ('/img/elec/elec-' + mood + '.png') || '/img/elec/elec-default.png';

  return (
    <div className="et-mascot-stage" aria-hidden="true">
      <div className="et-mascot-ambient-glow" />
      <img
        src={imgSrc}
        alt="Linh vật ELEC AI"
        className={'et-mascot-img mood-' + mood}
        draggable={false}
        onError={(e) => {
          e.currentTarget.src = '/img/elec/elec-default.png';
        }}
      />
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
  onStartDiagnostic,
}) {
  const meta = useMemo(() => getReferenceMetadata(), []);
  const [userState, setUserState] = useState(() => getUserAspirationsState(uid));

  const [step, setStep] = useState(1); // 1: Trường, 2: Ngành, 3: Mục tiêu, 4: Hồ sơ, 5: Ôn tập & Test
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
    } else if (latest.aspirations && latest.aspirations.length > 0) {
      setStep(4);
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

  const subjectBreakdown = useMemo(() => {
    return calculateSubjectScoreBreakdown(selectedBlock, targetScore, exam.scale);
  }, [selectedBlock, targetScore, exam.scale]);

  const portfolioEvaluation = useMemo(() => {
    const nv1Target = Number(userState.aspirations?.[0]?.targetScore);
    const fallbackPred = exam.scale === 30 ? 24.5 : Number((exam.scale * 0.82).toFixed(1));
    const estimatedPred = Number.isFinite(nv1Target) && nv1Target > 0 && nv1Target <= exam.scale
      ? Number((nv1Target * 0.94).toFixed(1))
      : fallbackPred;
    return evaluatePortfolioHealth(userState.aspirations, estimatedPred, exam.scale);
  }, [userState.aspirations, exam.scale]);

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

  const handleStartDiagnostic = () => {
    updateUserSettings(uid, { onboardingCompleted: true });
    onCompleted?.(getUserAspirationsState(uid));
    onClose?.();
    onStartDiagnostic?.();
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

  const handleDeleteAspiration = (aspId) => {
    const nextState = deleteAspiration(uid, aspId);
    setUserState(nextState);
  };

  let bubbleMessage = '';
  let mood = 'hello';
  if (step === 1) {
    bubbleMessage = 'Chào bạn! Mình cùng chọn một trường đại học mục tiêu nhé. Bạn đang nhắm tới trường nào?';
    mood = 'hello';
  } else if (step === 2) {
    bubbleMessage = `Ở ${selectedSchool?.name || selectedSchool?.code}, bạn muốn học ngành nào? Chọn ngành để ELEC AI đề xuất mục tiêu tuyển sinh chính xác nhé.`;
    mood = 'think';
  } else if (step === 3) {
    const cutoffText = suggestion?.cutoffScore != null
      ? `điểm chuẩn gần nhất là ${suggestion.cutoffScore} (${suggestion.referenceLabel})`
      : 'xét tuyển theo ngưỡng riêng';
    bubbleMessage = `Ngành ${selectedMajor?.name} (${selectedSchool?.code}) có ${cutoffText}. Mình đề xuất mục tiêu ${suggestion?.suggestedTarget}/${exam.scale} điểm (đã cộng biên an toàn). Bạn điều chỉnh thanh trượt nếu muốn nhé!`;
    mood = 'wink';
  } else if (step === 4) {
    if (portfolioEvaluation.hasInversion) {
      bubbleMessage = 'Cảnh báo! Danh mục nguyện vọng của bạn có lỗi nghịch đảo điểm chuẩn: Nguyện vọng sau có điểm chuẩn cao hơn nguyện vọng trước. Bạn hãy kiểm tra lại nhé!';
      mood = 'shocked';
    } else if (portfolioEvaluation.healthScore >= 75) {
      bubbleMessage = `Tuyệt vời! Danh mục của bạn có độ an toàn ${portfolioEvaluation.healthScore}% (${portfolioEvaluation.statusLabel}). Bạn đã lưu ${userState.aspirations.length}/3 nguyện vọng.`;
      mood = 'celebrate';
    } else {
      bubbleMessage = `Hồ sơ hiện có ${userState.aspirations.length}/3 nguyện vọng (${portfolioEvaluation.statusLabel}). Bạn nên bổ sung thêm trường bảo hiểm an toàn để hồ sơ vững vàng nhất nhé!`;
      mood = 'wink';
    }
  } else {
    const nv1 = userState.aspirations[0] || (selectedSchool && selectedMajor ? { school: selectedSchool, major: selectedMajor, targetScore } : null);
    const nv1Label = nv1 ? `${nv1.school?.name || nv1.school?.code} · ${nv1.major?.name || ''}` : 'Mục tiêu';
    bubbleMessage = `Chúc mừng bạn đã hoàn thiện hồ sơ cho ${nv1Label}! Để đạt ${nv1?.targetScore || targetScore} điểm, ELEC AI đã lên sẵn quy trình học 3 bước chuẩn ELEC AI KHTN. Cùng làm bài test chẩn đoán 12 câu để đo xuất phát điểm nhé!`;
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
        <div className="et-step-indicator" aria-label={`Bước ${step} trên 5`}>
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
          <div className="et-step-connector" />
          <div className={`et-step-dot ${step >= 5 ? 'is-active' : ''} ${step === 5 ? 'is-current' : ''}`}>
            <span>5</span>
            <small>Ôn tập &amp; Test</small>
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
                    <span>Mục tiêu KHTN: <b>{targetChemScore}/10đ</b></span>
                  </div>
                </div>
              </div>

              {/* Bảng phân rã điểm số 3 môn theo tổ hợp chuẩn ban */}
              <div className="et-subject-breakdown-card">
                <div className="et-breakdown-head">
                  <div className="et-breakdown-title-wrap">
                    <IcoLayers size={14} />
                    <span className="et-breakdown-title">
                      Phân rã mục tiêu 3 môn ({selectedBlock}) · Chuẩn ban GD&amp;ĐT
                    </span>
                  </div>
                  <span className="et-breakdown-sub">
                    Tổng: <b>{targetScore.toFixed(1)}/{exam.scale}đ</b>
                  </span>
                </div>

                <div className="et-subject-breakdown-grid">
                  {subjectBreakdown.map((subj) => (
                    <div key={subj.subjectName} className={`et-subj-pill tone-${subj.roleTone || 'info'}`}>
                      <div className="et-subj-top">
                        <span className="et-subj-name">{subj.subjectName}</span>
                        <span className="et-subj-score">
                          <b>{subj.targetScore}</b>
                          <small>/10đ</small>
                        </span>
                      </div>
                      <div className="et-subj-role-bar">
                        <span className="et-subj-role">{subj.role}</span>
                      </div>
                      <p className="et-subj-strategy">{subj.strategy}</p>
                    </div>
                  ))}
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

          {/* ── BƯỚC 4: TÓM TẮT NGUYỆN VỌNG & TỐI ƯU RỔ 3 TẦNG ── */}
          {step === 4 && (
            <div className="et-interact-box et-summary-panel et-step-anim">
              <div className="et-summary-head">
                <span>Hồ sơ nguyện vọng của bạn ({aspirationsCount}/3)</span>
                <small>{meta.nhanHienThi}</small>
              </div>

              {/* Cảnh báo nghịch đảo thứ tự nguyện vọng */}
              {portfolioEvaluation.hasInversion && (
                <div className="et-inversion-alert" role="alert">
                  <div className="et-inversion-head">
                    <IcoAlertTriangle size={16} />
                    <strong>Cảnh báo nghịch đảo thứ tự nguyện vọng (Quy chế Bộ GD&amp;ĐT)</strong>
                  </div>
                  <p className="et-inversion-desc">
                    Hệ thống lọc ảo của Bộ GD&amp;ĐT xét lần lượt từ NV1 đến NV3. Khi đã đỗ một nguyện vọng, tất cả các nguyện vọng xếp sau sẽ tự động bị hủy bỏ.
                  </p>
                  <ul className="et-inversion-list">
                    {portfolioEvaluation.warnings
                      .filter((w) => w.includes('Nghịch đảo'))
                      .map((w, wIdx) => (
                        <li key={wIdx}>{w}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Đánh giá độ an toàn rổ nguyện vọng */}
              {aspirationsCount > 0 && (
                <div className={`et-health-banner tone-${portfolioEvaluation.statusTone || 'info'}`}>
                  <div className="et-health-left">
                    <IcoShieldCheck size={16} />
                    <div className="et-health-text">
                      <div className="et-health-title">
                        Độ an toàn rổ nguyện vọng: <b>{portfolioEvaluation.healthScore}%</b> — {portfolioEvaluation.statusLabel}
                      </div>
                      <small className="et-health-tip">
                        {portfolioEvaluation.recommendations[0] || 'Phân bổ 3 tầng: Mơ ước - Vừa sức - Bảo hiểm an toàn'}
                      </small>
                    </div>
                  </div>
                </div>
              )}

              <ol className="et-summary-list">
                {userState.aspirations.map((asp, idx) => {
                  const analysis = portfolioEvaluation.analyzedList[idx];
                  const tier = analysis?.classification;
                  return (
                    <li key={asp.id} className="et-summary-item">
                      <div className="et-prio-col">
                        <span className={`et-prio-badge p${asp.priority}`}>NV{asp.priority}</span>
                        {tier && (
                          <span className={`et-tier-pill tone-${tier.tierTone || 'info'}`}>
                            {tier.tierKey === 'safety'
                              ? 'Bảo hiểm'
                              : tier.tierKey === 'target'
                              ? 'Vừa sức'
                              : tier.tierKey === 'reach'
                              ? 'Mơ ước'
                              : 'Rủi ro'}
                          </span>
                        )}
                      </div>
                      <div className="et-summary-body">
                        <b>{asp.school.code} — {asp.school.name}</b>
                        <small>
                          {asp.major.name} · Khối {asp.block}
                          {asp.cutoffScore != null && (
                            <span> · Điểm chuẩn: <b>{asp.cutoffScore}đ</b></span>
                          )}
                        </small>
                        {tier?.desc && <span className="et-tier-desc">{tier.desc}</span>}
                      </div>
                      <div className="et-summary-score">
                        <b>{asp.targetScore}<small>/{asp.exam?.scale || 30}</small></b>
                        <span>KHTN {asp.targetChemScore}đ</span>
                        <button
                          type="button"
                          className="et-item-del-btn"
                          onClick={() => handleDeleteAspiration(asp.id)}
                          title="Xóa nguyện vọng này"
                          aria-label={`Xóa nguyện vọng ${asp.priority}`}
                        >
                          <IcoTrash size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
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
                <button
                  type="button"
                  className="et-primary-btn"
                  onClick={() => setStep(5)}
                >
                  <span>Xem hướng dẫn ôn tập &amp; Test thử</span>
                  <IcoArrowRight size={15} />
                </button>
              </div>

              <div className="et-step-footer" style={{ marginTop: 12, justifyContent: 'center' }}>
                <button
                  type="button"
                  className="et-skip-link"
                  onClick={handleFinish}
                >
                  <span>Lưu hồ sơ &amp; vào thẳng bảng Lộ trình</span>
                  <IcoArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ── BƯỚC 5: QUY TRÌNH HƯỚNG DẪN ÔN TẬP & BÀI TEST CHẨN ĐOÁN ĐẦU VÀO (12 CÂU) ── */}
          {step === 5 && (() => {
            const nv1 = userState.aspirations[0] || (selectedSchool && selectedMajor ? {
              school: selectedSchool,
              major: selectedMajor,
              block: selectedBlock,
              targetScore,
              targetChemScore,
              cutoffScore: suggestion?.cutoffScore,
            } : null);
            const nv1Breakdown = calculateSubjectScoreBreakdown(
              nv1?.block || selectedBlock || 'A00',
              nv1?.targetScore || targetScore || 25.5,
              exam.scale,
            );

            return (
              <div className="et-interact-box et-study-guide-box et-step-anim">
                {/* 1. Tóm tắt mục tiêu NV1 */}
                {nv1 && (
                  <div className="et-guide-goal-card">
                    <div className="et-guide-goal-top">
                      <div className="et-guide-goal-school">
                        <span className="et-code-badge large">{nv1.school?.code}</span>
                        <div className="et-guide-goal-meta">
                          <strong>{nv1.school?.name}</strong>
                          <div className="et-guide-goal-sub">
                            {nv1.major?.name} · Tổ hợp <b>{nv1.block}</b>
                            {nv1.cutoffScore != null && (
                              <span> · Điểm chuẩn gần nhất: <b>{nv1.cutoffScore}đ</b></span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="et-guide-goal-score">
                        <small>Mục tiêu NV1</small>
                        <b>{nv1.targetScore}<small>/{exam.scale}đ</small></b>
                      </div>
                    </div>

                    <div className="et-guide-subjs-strip">
                      {nv1Breakdown.map((subj) => (
                        <div key={subj.subjectName} className="et-guide-subj-chip">
                          <span className="et-guide-subj-name">{subj.subjectName}</span>
                          <span className="et-guide-subj-val"><b>{subj.targetScore}</b>đ</span>
                          <span className="et-guide-subj-role">{subj.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Quy trình 3 bước học chuẩn ELEC AI */}
                <div className="et-guide-strategy-card">
                  <div className="et-guide-strategy-head">
                    <div className="et-guide-strategy-title">
                      <IcoCompass size={16} />
                      <strong>Quy trình ôn tập thông minh 3 bước (Chuẩn ELEC AI KHTN)</strong>
                    </div>
                    <span className="et-guide-strategy-tag">Phương pháp ELEC AI</span>
                  </div>

                  <div className="et-guide-steps-list">
                    <div className="et-guide-step-item">
                      <div className="et-step-num-badge">1</div>
                      <div className="et-step-item-content">
                        <div className="et-step-item-title-row">
                          <b>Làm bài test chẩn đoán đầu vào (12 câu · ~10 phút)</b>
                          <span className="et-step-badge blue">Khởi điểm</span>
                        </div>
                        <p>
                          12 câu trắc nghiệm bao quát nhận biết - thông hiểu - vận dụng để xác định chính xác điểm số xuất phát điểm, gán chỉ số Elo ban đầu và khoanh vùng lỗ hổng kiến thức.
                        </p>
                      </div>
                    </div>

                    <div className="et-guide-step-item">
                      <div className="et-step-num-badge">2</div>
                      <div className="et-step-item-content">
                        <div className="et-step-item-title-row">
                          <b>Ôn theo Lộ trình 3 Giai đoạn Cá nhân hóa</b>
                          <span className="et-step-badge purple">Tăng tốc</span>
                        </div>
                        <p>
                          Ăn chắc 35 câu nền tảng (7.0+) → Tăng tốc các chuyên đề đòn bẩy trọng tâm (8.0 - 8.5đ) → Về đích vận dụng cao và né bẫy đề thi trắc nghiệm (9.0+).
                        </p>
                      </div>
                    </div>

                    <div className="et-guide-step-item">
                      <div className="et-step-num-badge">3</div>
                      <div className="et-step-item-content">
                        <div className="et-step-item-title-row">
                          <b>Thi thử định kỳ &amp; Khắc phục câu sai tự động</b>
                          <span className="et-step-badge green">Về đích</span>
                        </div>
                        <p>
                          Luyện đề bấm giờ chuẩn ma trận Bộ GD&amp;ĐT, chấm OMR tự động, ôn lại câu sai trong Sổ tay lỗi sai và theo dõi biểu đồ tăng trưởng Elo theo từng ngày.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Thẻ Kêu Gọi Làm Bài Test Chẩn Đoán Đầu Vào (12 câu) */}
                <div className="et-diag-cta-card">
                  <div className="et-diag-cta-glow" aria-hidden="true" />
                  <div className="et-diag-cta-header">
                    <div className="et-diag-cta-badge">
                      <IcoAward size={13} />
                      <span>BƯỚC ĐẦU TIÊN QUAN TRỌNG · KHUYÊN DÙNG NGAY</span>
                    </div>
                    <h3 className="et-diag-cta-title">
                      Bài test chẩn đoán năng lực đầu vào (12 câu)
                    </h3>
                    <p className="et-diag-cta-desc">
                      Hệ thống ELEC AI đã chuẩn bị sẵn 12 câu trắc nghiệm phủ đều các chương trọng tâm. Hoàn thành ngay để kích hoạt Điểm dự đoán cá nhân hóa, hệ số Elo và mở khóa bản đồ chuyên đề!
                    </p>
                  </div>

                  <div className="et-diag-features-grid">
                    <div className="et-diag-feat-pill">
                      <IcoTargetSmall size={14} />
                      <span>12 câu phân loại 3 mức độ</span>
                    </div>
                    <div className="et-diag-feat-pill">
                      <IcoBolt size={14} />
                      <span>Mở khóa Điểm dự đoán &amp; Elo ngay</span>
                    </div>
                    <div className="et-diag-feat-pill">
                      <IcoCompass size={14} />
                      <span>Khoanh vùng chuyên đề yếu cần bù đắp</span>
                    </div>
                  </div>

                  <div className="et-diag-cta-actions">
                    <button
                      type="button"
                      className="et-primary-btn et-diag-cta-btn"
                      onClick={handleStartDiagnostic}
                    >
                      <IcoBolt size={18} />
                      <span>Bắt đầu làm bài test chẩn đoán ngay (12 câu)</span>
                      <IcoArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* 4. Điều hướng quay lại hoặc bỏ qua */}
                <div className="et-step-footer">
                  <button type="button" className="et-back-link" onClick={() => setStep(4)}>
                    <IcoArrowLeft size={14} />
                    <span>Quay lại hồ sơ</span>
                  </button>
                  <button type="button" className="et-skip-link" onClick={handleFinish}>
                    <span>Để sau, vào thẳng Lộ trình học tập</span>
                    <IcoArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })()}
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
