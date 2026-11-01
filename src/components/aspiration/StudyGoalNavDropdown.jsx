/* ============================================================
   StudyGoalNavDropdown.jsx — GIAI ĐOẠN 3 (NÂNG CẤP SVG & MOBILE)
   ------------------------------------------------------------
   • Toàn bộ biểu tượng dùng SVG sắc nét (không dùng emoji/ký tự thô).
   • Nút pill kép trên Navbar: [🎓 Thi THPTQG | ANND ⌄] gọn gàng, không tràn.
   • Dropdown 2 cột trên Desktop & Bottom Sheet mượt mà trên Mobile.
   • Hỗ trợ kéo-thả (Drag & Drop) + nút SVG Lên/Xuống đổi thứ tự ưu tiên 1-2-3.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getExams,
  getReferenceMetadata,
  getUserAspirationsState,
  setSelectedExam,
  setActiveAspiration,
  deleteAspiration,
  reorderAspirations,
  subscribeAspirationChanges,
} from '../../lib/aspirationService.js';
import ElecTutorOnboardingModal from './ElecTutorOnboardingModal.jsx';
import UniversityDetailModal from './UniversityDetailModal.jsx';
import '../../styles/nav-dropdowns.css';

/* ============================================================
   BỘ BIỂU TƯỢNG SVG SẮC NÉT (TÍCH HỢP ANIMATE-UI MICRO-INTERACTIONS)
   ============================================================ */
const IcoSparkle = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`anim-ico-svg anim-ico-sparkle ${className}`} aria-hidden="true">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <polygon points="12 8 13.5 11 16.5 12 13.5 13 12 16 10.5 13 7.5 12 10.5 11 12 8" fill="currentColor" stroke="none" />
  </svg>
);

const IcoCap = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-cap anim-ico-quiz ${className}`} aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IcoChevron = ({ size = 12, className = '' }) => (
  <svg className={`anim-ico-svg anim-ico-chevron ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcoPencil = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-pencil anim-ico-edit ${className}`} aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IcoTrash = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-trash ${className}`} aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IcoPlus = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-plus ${className}`} aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcoArrowRight = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-arrow ${className}`} aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IcoUp = ({ size = 13, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-up ${className}`} aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IcoDown = ({ size = 13, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-down ${className}`} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const DEFAULT_EXAM_TARGETS = {
  THPTQG: 24,
  HSA: 95,
  TSA: 65,
  'V-ACT': 800,
  SPT: 22,
  'H-SCA': 68,
};

function getSchoolThumbBg(school) {
  const color = school?.coverColor || school?.badgeColor || '#2563eb';
  return `linear-gradient(135deg, ${color}, #0f172a)`;
}

function getSafetyBadge(targetScore, cutoffScore) {
  if (cutoffScore === null || cutoffScore === undefined) {
    return { label: 'Xét đề án riêng', cls: 'neutral' };
  }
  const diff = Math.round((Number(targetScore) - Number(cutoffScore)) * 100) / 100;
  if (diff >= 1.0) return { label: `An toàn (+${diff}đ)`, cls: 'safe' };
  if (diff >= 0) return { label: `Bám sát chuẩn (${diff >= 0 ? '+' : ''}${diff}đ)`, cls: 'match' };
  return { label: `Cần nỗ lực (${diff}đ)`, cls: 'gap' };
}

const IcoClose = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-close ${className}`} aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoUniversity = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
    className={`anim-ico-svg anim-ico-university ${className}`} aria-hidden="true">
    <path d="M12 3L2 8l10 5 10-5-10-5z" />
    <path d="M5 10.5v6.5M9.5 12.5v4.5M14.5 12.5v4.5M19 10.5v6.5" />
    <path d="M3 20h18" />
  </svg>
);

/* Vòng tròn tiến độ điểm mục tiêu / thang điểm kỳ thi (VD: 23/30, 100/150) */
function ScoreCircle({ value, scale }) {
  const R = 17;
  const C = 2 * Math.PI * R;
  const pct = Math.min(1, Math.max(0.08, (Number(value) || 0) / (Number(scale) || 30)));
  return (
    <div className="sg-score-ring" aria-label={`Mục tiêu ${value} trên ${scale} điểm`}>
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r={R} className="sg-ring-bg" />
        <circle
          cx="21"
          cy="21"
          r={R}
          className="sg-ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 21 21)"
        />
      </svg>
      <div className="sg-ring-txt">
        <b>{value}</b>
        <small>/{scale}</small>
      </div>

    </div>
  );
}

export default function StudyGoalNavDropdown({ uid, autoOpenForNewStudent = false }) {
  const [state, setState] = useState(() => getUserAspirationsState(uid));
  const [panelOpen, setPanelOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [editingAsp, setEditingAsp] = useState(null);
  const [editingExamId, setEditingExamId] = useState(null);
  const [tempExamScore, setTempExamScore] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showAdmissionNote, setShowAdmissionNote] = useState(false);
  
  const [universityModalOpen, setUniversityModalOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  // Tự động đóng khi hash thay đổi hoặc khi dropdown khác mở
  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e.detail?.except !== 'study-goal') {
        setPanelOpen(false);
        setEditingExamId(null);
      }
    };
    const onHash = () => {
      setPanelOpen(false);
      setEditingExamId(null);
    };
    const onOpenUni = (e) => {
      if (e.detail?.schoolId) {
        setSelectedSchoolId(e.detail.schoolId);
        setUniversityModalOpen(true);
        setPanelOpen(false);
      }
    };
    window.addEventListener('elec-close-nav-dropdowns', onCloseOthers);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('elec-open-university-detail', onOpenUni);
    return () => {
      window.removeEventListener('elec-close-nav-dropdowns', onCloseOthers);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('elec-open-university-detail', onOpenUni);
    };
  }, []);

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'study-goal' } })
        );
      }
      return next;
    });
  };

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  const wrapRef = useRef(null);
  const dialogRef = useRef(null);

  const exams = useMemo(() => getExams(), []);
  const meta = useMemo(() => getReferenceMetadata(), []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (panelOpen && isMobile && typeof document !== 'undefined') {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [panelOpen, isMobile]);

  useEffect(() => {
    setState(getUserAspirationsState(uid));
  }, [uid]);

  useEffect(() => subscribeAspirationChanges(() => {
    setState(getUserAspirationsState(uid));
  }), [uid]);

  /* Học sinh mới đăng nhập chưa có nguyện vọng -> tự động dẫn vào luồng chọn nguyện vọng */
  useEffect(() => {
    if (!autoOpenForNewStudent || !uid) return;
    const cur = getUserAspirationsState(uid);
    if (!cur.onboardingCompleted && cur.aspirations.length === 0) {
      setTutorOpen(true);
    }
  }, [autoOpenForNewStudent, uid]);

  /* Đóng dropdown bằng phím Esc hoặc click ra ngoài + Focus Trap */
  useEffect(() => {
    if (!panelOpen) return undefined;

    const onMouseDown = (e) => {
      if (dialogRef.current && dialogRef.current.contains(e.target)) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPanelOpen(false);
        setEditingExamId(null);
        setShowAdmissionNote(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setPanelOpen(false);
        setEditingExamId(null);
        setShowAdmissionNote(false);
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panelOpen]);

  const activeExam = exams.find((e) => e.id === state.selectedExamId) || exams[0];
  const activeAsp = state.activeAspiration || state.aspirations[0] || null;
  const count = state.aspirations.length;
  const isMax = count >= 3;

  const handleSelectExam = (examId) => {
    const next = setSelectedExam(uid, examId);
    setState(next);
  };

  const handleStartEditExamScore = (e, exam) => {
    e.stopPropagation();
    const curTarget = exam.id === activeExam.id && activeAsp
      ? activeAsp.targetScore
      : exam.defaultTarget;
    setEditingExamId(exam.id);
    setTempExamScore(String(curTarget));
  };

  const handleSaveExamScore = (exam) => {
    const parsed = parseFloat(tempExamScore);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(exam.scale, Math.max(exam.step, parsed));
      const next = setSelectedExam(uid, exam.id, clamped);
      setState(next);
    }
    setEditingExamId(null);
  };

  const handleOpenAddSchool = () => {
    if (isMax) return;
    setPanelOpen(false);
    setEditingAsp(null);
    setTutorOpen(true);
  };

  const handleOpenEditAspiration = (e, asp) => {
    e.stopPropagation();
    setPanelOpen(false);
    setEditingAsp(asp);
    setTutorOpen(true);
  };

  const handleDeleteAspiration = (e, aspId) => {
    e.stopPropagation();
    const next = deleteAspiration(uid, aspId);
    setState(next);
  };

  const handleSelectAspiration = (aspId) => {
    const next = setActiveAspiration(uid, aspId);
    setState(next);
  };

  const handlePromoteUp = (e, index) => {
    e.stopPropagation();
    if (index <= 0) return;
    const ids = state.aspirations.map((a) => a.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index - 1, 0, moved);
    const next = reorderAspirations(uid, ids);
    setState(next);
  };

  const handleDemoteDown = (e, index) => {
    e.stopPropagation();
    if (index >= state.aspirations.length - 1) return;
    const ids = state.aspirations.map((a) => a.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + 1, 0, moved);
    const next = reorderAspirations(uid, ids);
    setState(next);
  };

  /* Kéo-thả đổi thứ tự ưu tiên 1-2-3 */
  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = state.aspirations.map((a) => a.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx >= 0 && toIdx >= 0) {
      ids.splice(fromIdx, 1);
      ids.splice(toIdx, 0, draggedId);
      const next = reorderAspirations(uid, ids);
      setState(next);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const renderPanel = () => {
    if (!panelOpen) return null;
    const content = (
      <>
        <div
          className="sg-mobile-backdrop"
          aria-hidden="true"
          onClick={() => setPanelOpen(false)}
        />
        <div
          ref={dialogRef}
          className="sg-dropdown-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Mục tiêu học tập — Chọn kỳ thi và trường đang hướng tới"
        >
          <div className="sg-sheet-grip" aria-hidden="true" />

          <div className="sg-panel-head">
            <div className="sg-head-main">
              <div className="sg-head-row-top">
                <h3>Mục tiêu học tập &amp; Nguyện vọng</h3>
                <button
                  type="button"
                  className="sg-close-btn"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Đóng bảng mục tiêu học tập"
                >
                  <IcoClose size={18} />
                </button>
              </div>
              <div className="sg-head-row-sub">
                <p>Chọn kỳ thi mục tiêu và theo dõi tiến độ 3 nguyện vọng đại học ưu tiên</p>
                <button
                  type="button"
                  className="sg-ref-badge sg-ref-badge-btn"
                  onClick={() => {
                    setPanelOpen(false);
                    window.location.hash = '#truong';
                  }}
                  title="Xem toàn bộ đề án tuyển sinh các trường đại học năm 2026"
                >
                  <span>Đề án tuyển sinh 2026</span>
                  <IcoArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>

          <div className="sg-panel-cols">
            {/* CỘT TRÁI: DANH SÁCH 6 KỲ THI */}
            <div className="sg-col-exams">
              <span className="sg-col-title">Kỳ thi</span>
              <div className="sg-exam-list" role="listbox" aria-label="Danh sách kỳ thi">
                {exams.map((ex) => {
                  const isSelected = ex.id === activeExam.id;
                  const scoreVal = isSelected && activeAsp
                    ? activeAsp.targetScore
                    : (state.examTargets?.[ex.id] ?? (ex.defaultTarget || DEFAULT_EXAM_TARGETS[ex.id] || Math.round(ex.scale * 0.75)));
                  const showCircle = true;

                  return (
                    <div
                      key={ex.id}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={`sg-exam-item ${isSelected ? 'is-active' : ''}`}
                      onClick={() => handleSelectExam(ex.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectExam(ex.id);
                        }
                      }}
                    >
                      <div className="sg-exam-info">
                        <b>{ex.name}</b>
                        <small>{ex.subtitle}</small>
                      </div>

                      <div className="sg-exam-right">
                        {editingExamId === ex.id ? (
                          <div className="sg-exam-edit-inline" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="number"
                              min={ex.step}
                              max={ex.scale}
                              step={ex.step}
                              value={tempExamScore}
                              onChange={(e) => setTempExamScore(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveExamScore(ex);
                              }}
                              aria-label={`Điểm mục tiêu ${ex.name}`}
                            />
                            <button type="button" onClick={() => handleSaveExamScore(ex)}>Lưu</button>
                          </div>
                        ) : (
                          <>
                            {showCircle && (
                              <ScoreCircle value={scoreVal} scale={ex.scale} />
                            )}
                            <button
                              type="button"
                              className="sg-icon-btn"
                              title={`Chỉnh điểm mục tiêu ${ex.name}`}
                              aria-label={`Chỉnh điểm mục tiêu ${ex.name}`}
                              onClick={(e) => handleStartEditExamScore(e, ex)}
                            >
                              <IcoPencil size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CỘT PHẢI: TRƯỜNG ĐANG HƯỚNG TỚI (1-2-3) */}
            <div className="sg-col-schools">
              <div className="sg-schools-top">
                <div>
                  <span className="sg-col-title">Trường đang hướng tới</span>
                  <small className="sg-via-exam">Qua kỳ thi {activeExam.name.replace(/^Thi\s+/i, '')}</small>
                </div>
                <button
                  type="button"
                  className="sg-add-school-btn"
                  disabled={isMax}
                  onClick={handleOpenAddSchool}
                >
                  <IcoPlus size={14} />
                  <span>Thêm trường</span>
                </button>
              </div>

              <div className="sg-schools-counter">
                <b>{count} trường</b>
                <span className="sg-ratio-pill">{count}/3</span>
                <div className="sg-dots" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <i key={n} className={n <= count ? 'on' : ''} />
                  ))}
                </div>
              </div>

              {count === 0 ? (
                <div className="sg-empty-wishes">
                  <div className="sg-empty-ico" aria-hidden="true">
                    <IcoUniversity size={22} />
                  </div>
                  <p>Chưa có trường nguyện vọng nào trong hồ sơ của bạn.</p>
                  <button type="button" className="sg-add-school-btn" onClick={handleOpenAddSchool}>
                    <IcoPlus size={14} />
                    <span>Chọn nguyện vọng cùng ELEC Tutor</span>
                  </button>
                </div>
              ) : (
                <ol className="sg-wish-list" aria-label="Danh sách nguyện vọng ưu tiên 1 đến 3">
                  {state.aspirations.map((asp, idx) => {
                    const isSelected = activeAsp?.id === asp.id;
                    const isDragOver = dragOverId === asp.id;
                    const aspTargetChem = asp.targetChemScore || (
                      activeExam.scale === 30
                        ? Math.min(10, Math.round(((asp.targetScore || 24) / 3) * 4) / 4)
                        : 8.5
                    );
                    return (
                      <li
                        key={asp.id}
                        draggable
                        onDragStart={() => handleDragStart(asp.id)}
                        onDragOver={(e) => handleDragOver(e, asp.id)}
                        onDrop={(e) => handleDrop(e, asp.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                        className={`sg-wish-item ${isSelected ? 'is-selected' : ''} ${isDragOver ? 'is-drag-over' : ''}`}
                        onClick={() => handleSelectAspiration(asp.id)}
                      >
                        <span className={`sg-wish-num n${asp.priority}`} title="Kéo thả để đổi thứ tự ưu tiên">
                          {asp.priority}
                        </span>

                        <div
                          className="sg-wish-thumb"
                          style={{ background: getSchoolThumbBg(asp.school) }}
                          aria-hidden="true"
                        >
                          <IcoUniversity size={15} />
                          <small>{(asp.school?.code || 'NV' + asp.priority).slice(0, 4)}</small>
                        </div>

                        <div className="sg-wish-body">
                          <div className="sg-wish-title">
                            <b className="code">{asp.school?.code || 'NV' + asp.priority}</b>
                            <span className="name"> · {asp.school?.name || 'Trường Đại học'}</span>
                          </div>
                          <div className="sg-wish-major-line">
                            <span className="major" title={asp.major?.name}>{asp.major?.name || 'Ngành xét tuyển'}</span>
                            <span className="meta-tag">Khối {asp.block || 'A00'}</span>
                            <span className="meta-score">Mục tiêu <b>{asp.targetScore}đ</b></span>
                            <span className="meta-chem" title="Mục tiêu điểm môn Hóa học">Hóa ~{aspTargetChem}đ</span>
                          </div>
                        </div>

                        <div className="sg-wish-actions">
                          {idx > 0 && (
                            <button
                              type="button"
                              className="sg-icon-btn"
                              title="Đẩy lên ưu tiên cao hơn"
                              aria-label={`Đưa ${asp.school?.name || 'trường'} lên ưu tiên cao hơn`}
                              onClick={(e) => handlePromoteUp(e, idx)}
                            >
                              <IcoUp size={13} />
                            </button>
                          )}
                          {idx < state.aspirations.length - 1 && (
                            <button
                              type="button"
                              className="sg-icon-btn"
                              title="Hạ xuống ưu tiên thấp hơn"
                              aria-label={`Đưa ${asp.school?.name || 'trường'} xuống ưu tiên thấp hơn`}
                              onClick={(e) => handleDemoteDown(e, idx)}
                            >
                              <IcoDown size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="sg-icon-btn"
                            title="Sửa nguyện vọng & điểm mục tiêu"
                            aria-label={`Sửa nguyện vọng ${asp.school?.name || 'trường'}`}
                            onClick={(e) => handleOpenEditAspiration(e, asp)}
                          >
                            <IcoPencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="sg-icon-btn danger"
                            title="Xóa nguyện vọng này"
                            aria-label={`Xóa nguyện vọng ${asp.school?.name || 'trường'}`}
                            onClick={(e) => handleDeleteAspiration(e, asp.id)}
                          >
                            <IcoTrash size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* ── KHỐI GIA SƯ ELEC AI TỰ ĐIỀU TRA & HOẠCH ĐỊNH LỘ TRÌNH DẪN TỚI LỘ TRÌNH ── */}
              {activeAsp && (
                <div className="sg-ai-investigate-card">
                  {/* 1. Header: Avatar + Title + Status Pill */}
                  <div className="sg-ai-card-head">
                    <div className="sg-ai-brand-group">
                      <div className="sg-ai-avatar">
                        <IcoSparkle size={15} />
                      </div>
                      <div className="sg-ai-title-wrap">
                        <div className="sg-ai-eyebrow">
                          <span>ELEC AI TUTOR</span>
                          <span className="sg-ai-live-dot" title="Đã đồng bộ dữ liệu thời gian thực" />
                        </div>
                        <h4 className="sg-ai-title">
                          Chiến lược đỗ <b>{activeAsp.school?.code || 'Đại học'}</b> · {activeAsp.major?.name || 'Ngành xét tuyển'}
                        </h4>
                      </div>
                    </div>
                    {(() => {
                      const safety = getSafetyBadge(activeAsp.targetScore, activeAsp.cutoffScore);
                      return (
                        <span className={`sg-ai-safety-badge ${safety.cls}`}>
                          <span className="sg-ai-dot" />
                          {safety.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* 2. Three-Cell Metric Strip */}
                  <div className="sg-ai-metrics-strip">
                    <div className="sg-ai-metric-cell">
                      <span className="sg-ai-metric-label">Chuẩn tham khảo</span>
                      <span className="sg-ai-metric-val">{activeAsp.cutoffScore ?? '24.50'}đ</span>
                    </div>
                    <div className="sg-ai-metric-cell">
                      <span className="sg-ai-metric-label">Mục tiêu ({activeAsp.block || 'A00'})</span>
                      <span className="sg-ai-metric-val is-target">{activeAsp.targetScore}đ</span>
                    </div>
                    <div className="sg-ai-metric-cell">
                      <span className="sg-ai-metric-label">Hóa cần đạt</span>
                      <span className="sg-ai-metric-val is-chem">
                        ~{activeAsp.targetChemScore || (activeExam.scale === 30 ? Math.min(10, Math.round(((activeAsp.targetScore || 24) / 3) * 4) / 4) : 8.5)}đ
                      </span>
                    </div>
                  </div>

                  {/* 3. Connected Timeline Stepper */}
                  <div className="sg-ai-timeline">
                    <div className="sg-ai-tl-step">
                      <div className="sg-ai-tl-indicator s1">
                        <span>1</span>
                      </div>
                      <div className="sg-ai-tl-content">
                        <div className="sg-ai-tl-top">
                          <span className="sg-ai-tl-name">Nền tảng &amp; Lấp lỗ hổng chuyên đề</span>
                          <span className="sg-ai-tl-target s1">6.5+</span>
                        </div>
                        <p className="sg-ai-tl-desc">Este-Lipid, Cân bằng hóa học, Đại cương kim loại</p>
                      </div>
                    </div>

                    <div className="sg-ai-tl-step">
                      <div className="sg-ai-tl-indicator s2">
                        <span>2</span>
                      </div>
                      <div className="sg-ai-tl-content">
                        <div className="sg-ai-tl-top">
                          <span className="sg-ai-tl-name">Luyện đề thực chiến &amp; Tối ưu tốc độ</span>
                          <span className="sg-ai-tl-target s2">8.0+</span>
                        </div>
                        <p className="sg-ai-tl-desc">Điện phân, Bài toán CO₂ + kiềm, Phản ứng tráng bạc</p>
                      </div>
                    </div>

                    <div className="sg-ai-tl-step">
                      <div className="sg-ai-tl-indicator s3">
                        <span>3</span>
                      </div>
                      <div className="sg-ai-tl-content">
                        <div className="sg-ai-tl-top">
                          <span className="sg-ai-tl-name">Bứt phá 9+ Ma trận {activeAsp.school?.code || 'ĐH'}</span>
                          <span className="sg-ai-tl-target s3">9.0+</span>
                        </div>
                        <p className="sg-ai-tl-desc">4 câu phân loại cuối đề, Rèn phản xạ áp lực 50 phút</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Action Buttons (Không bao giờ tràn viền) */}
                  <div className="sg-ai-inv-actions">
                    <button
                      type="button"
                      className="sg-ai-btn-primary"
                      onClick={() => {
                        setPanelOpen(false);
                        window.location.hash = '#roadmap';
                      }}
                    >
                      <span>Vào Lộ trình cá nhân</span>
                      <IcoArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="sg-ai-btn-secondary"
                      onClick={() => {
                        setPanelOpen(false);
                        window.location.hash = '#roadmap?mode=diagnostic';
                      }}
                    >
                      <span>Test đầu vào (12 câu)</span>
                    </button>
                  </div>
                </div>
              )}

              {activeAsp && (
                <div className="sg-admission-footer">
                  <button
                    type="button"
                    className="sg-admission-btn"
                    onClick={() => {
                      setSelectedSchoolId(activeAsp?.school?.code || activeAsp?.school?.id || 'NEU');
                      setUniversityModalOpen(true);
                      setPanelOpen(false);
                    }}
                  >
                    <span className="sg-adm-btn-left">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10" />
                        <path d="M6 10h10" />
                      </svg>
                      <span>Xem Đề án tuyển sinh chi tiết {activeAsp?.school?.shortName || activeAsp?.school?.code || 'trường'} (2026)</span>
                    </span>
                    <IcoArrowRight size={16} />
                  </button>
                  {showAdmissionNote && (
                    <div className="sg-admission-detail">
                      <p>
                        <b>{activeAsp?.school?.name || 'Trường Đại học'}</b> ({activeAsp?.school?.city || 'Việt Nam'}) — Ngành{' '}
                        <b>{activeAsp?.major?.name || 'Ngành xét tuyển'}</b> (Mã: <code>{activeAsp?.major?.majorCode || ''}</code>).
                      </p>
                      <p>
                        Tổ hợp xét tuyển: <b>{(activeAsp?.major?.blocks || ['A00']).join(', ')}</b> · Điểm chuẩn tham khảo:{' '}
                        <b>{activeAsp.cutoffScore ?? 'Xét riêng'}</b> ({activeAsp.referenceLabel}).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
    if (isMobile && typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  };

  return (
    <div className="sg-nav-wrap" ref={wrapRef}>
      {/* ── NÚT PILL KÉP TRÊN THANH ĐIỀU HƯỚNG (NHƯ ẢNH 1 & 4) ── */}
      <button
        type="button"
        className={`sg-nav-trigger ${panelOpen ? 'is-open' : ''}`}
        onClick={togglePanel}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        aria-label={`Mục tiêu học tập: ${activeExam?.name || 'Kỳ thi'}, trường ${activeAsp?.school?.code || 'chưa chọn'}`}
      >
        <span className="sg-trigger-exam">
          <IcoCap size={14} />
          <span>{activeExam.name}</span>
        </span>
        <span className="sg-trigger-school">
          <b>{activeAsp?.school?.code || 'Chọn NV'}</b>
          <IcoChevron size={12} className="sg-chev" />
        </span>
      </button>

      {/* ── DROPDOWN PANEL "MỤC TIÊU HỌC TẬP" ── */}
      {renderPanel()}

      {/* ── MODAL FULL-SCREEN "ELEC TUTOR" (NHƯ ẢNH 2 & 3) ── */}
      <ElecTutorOnboardingModal
        open={tutorOpen}
        uid={uid}
        initialAspiration={editingAsp}
        initialExamId={activeExam.id}
        onClose={() => {
          setTutorOpen(false);
          setEditingAsp(null);
        }}
        onCompleted={(updatedState) => {
          setState(updatedState);
        }}
      />

      {/* ── MODAL CHI TIẾT ĐỀ ÁN TUYỂN SINH TRƯỜNG ĐH (CHUẨN 9STUDY) ── */}
      <UniversityDetailModal
        open={universityModalOpen}
        schoolId={selectedSchoolId || activeAsp?.school?.code || 'NEU'}
        uid={uid}
        onClose={() => setUniversityModalOpen(false)}
      />
    </div>
  );
}
