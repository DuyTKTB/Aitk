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
   BỘ BIỂU TƯỢNG SVG SẮC NÉT
   ============================================================ */
const IcoCap = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IcoChevron = ({ size = 12, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IcoPencil = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IcoTrash = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IcoPlus = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IcoArrowRight = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IcoUp = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const IcoClose = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IcoUniversity = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <span className="sg-ref-badge">Đề án tuyển sinh 2026</span>
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
                    : ex.defaultTarget;
                  const showCircle = isSelected || ex.id === 'THPTQG' || ex.id === 'HSA';

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
                  <small className="sg-via-exam">Qua kỳ thi {activeExam.name}</small>
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
                          style={{ background: asp.school.cover || '#2f6bff' }}
                          aria-hidden="true"
                        >
                          <IcoUniversity size={15} />
                          <small>{asp.school.code.slice(0, 4)}</small>
                        </div>

                        <div className="sg-wish-body">
                          <div className="sg-wish-title">
                            <b className="code">{asp.school?.code || 'ĐH'}</b>
                            <span className="name"> · {asp.school?.name || 'Trường Đại học'}</span>
                          </div>
                          <div className="sg-wish-major-line">
                            <span className="major" title={asp.major?.name}>{asp.major?.name || 'Ngành xét tuyển'}</span>
                            <span className="meta-tag">Khối {asp.block || 'A00'}</span>
                            <span className="meta-score">Mục tiêu <b>{asp.targetScore}đ</b></span>
                          </div>
                        </div>

                        <div className="sg-wish-actions">
                          {idx > 0 && (
                            <button
                              type="button"
                              className="sg-icon-btn"
                              title="Đẩy lên ưu tiên cao hơn"
                              aria-label={`Đưa ${asp.school.name} lên ưu tiên cao hơn`}
                              onClick={(e) => handlePromoteUp(e, idx)}
                            >
                              <IcoUp size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="sg-icon-btn"
                            title="Sửa nguyện vọng & điểm mục tiêu"
                            aria-label={`Sửa nguyện vọng ${asp.school.name}`}
                            onClick={(e) => handleOpenEditAspiration(e, asp)}
                          >
                            <IcoPencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="sg-icon-btn danger"
                            title="Xóa nguyện vọng này"
                            aria-label={`Xóa nguyện vọng ${asp.school.name}`}
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
                      <span>Xem Đề án tuyển sinh chi tiết {activeAsp?.school?.code || 'trường'} (2026)</span>
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
