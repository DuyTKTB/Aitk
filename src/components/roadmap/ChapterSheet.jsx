/* ============================================================
   ChapterSheet.jsx — CHI TIẾT MỘT CHƯƠNG
   ------------------------------------------------------------
   Hiển thị:
     • mô tả chương (data/roadmap.js)
     • điểm thành thạo / độ chính xác / số câu (roadmapEngine)
     • lịch ôn + lần học gần nhất
     • kiến thức cần học trước (prereq, chỉ để gợi ý)
     • trọng tâm kiến thức & lỗi hay gặp (data/roadmapExercises.js)
     • luyện trắc nghiệm theo mức độ (Nhận biết / Thông hiểu / Vận dụng)
     • phân bố bằng chứng theo nguồn (bài lớp / bài trên máy chủ / phiên luyện)
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { STATE_META, agoLabel } from '../../lib/roadmapEngine.js';
import { chapterName } from '../../data/roadmap.js';
import { IconClose, IconBook, IconTarget, IconZap, IconChart } from '../Icons.jsx';
import {
  chapterGuide,
  builtinCount,
  builtinLevelCounts,
  LEVEL_META,
} from '../../data/roadmapExercises.js';
import PracticeRunner from './PracticeRunner.jsx';
import FlashcardSession from './FlashcardSession.jsx';
import { dueCards as dueCardsOf } from '../../lib/flashcardStore.js';
import { getChapterPedagogy } from '../../lib/roadmapPedagogy.js';
import { findLessonsByChapter } from '../../data/dedicatedLessonsData.js';
import MathText from '../MathText.jsx';

const SOURCE_LABEL = {
  exam: 'Bài cô giao',
  attempt: 'Bài luyện trên máy chủ',
  practice: 'Luyện trong Lộ trình',
  review: 'Ôn câu từng sai',
};

export default function ChapterSheet({
  view, levelKey, uid, onClose, onOpenChapter, onAi, onRefresh,
  initialMode = null, dueCount = 0,
}) {
  const [tab, setTab] = useState(initialMode ? 'practice' : 'overview');
  const [practice, setPractice] = useState(!!initialMode);
  const [mode, setMode] = useState(initialMode === 'review' ? 'review' : 'fresh');
  const [size, setSize] = useState(8);
  const [diffLevel, setDiffLevel] = useState('all');
  const [flash, setFlash] = useState(false);
  const [flashQids, setFlashQids] = useState(null);   // null = thẻ mới · mảng = thẻ đến hạn của chương
  const [cardTick, setCardTick] = useState(0);
  const ref = useRef(null);
  const bodyRef = useRef(null);
  const { chapter, summary, mastery, state, review, missingPrereq } = view;
  const meta = STATE_META[state] || STATE_META.none;

  const guide = useMemo(() => (chapter.id ? chapterGuide(chapter.id) : null), [chapter.id]);
  const pedagogy = useMemo(() => getChapterPedagogy(chapter.id, chapter.name), [chapter.id, chapter.name]);
  const totalBuiltin = useMemo(() => (chapter.id ? builtinCount(chapter.id) : 0), [chapter.id]);
  const lvCounts = useMemo(() => (chapter.id ? builtinLevelCounts(chapter.id) : { nb: 0, th: 0, vd: 0 }), [chapter.id]);
  const subLessons = useMemo(() => (chapter.id ? findLessonsByChapter(chapter.id) : []), [chapter.id]);
  const [copiedFormulaId, setCopiedFormulaId] = useState(null);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  const handleCopyFormula = (fId, text) => {
    try {
      navigator?.clipboard?.writeText(text);
      setCopiedFormulaId(fId);
      setTimeout(() => setCopiedFormulaId(null), 2000);
    } catch { /* ignore */ }
  };

  const scrollToAnchor = (anchorId) => {
    const el = ref.current?.querySelector(`#${anchorId}`) || document.getElementById(anchorId);
    if (!el || !ref.current) return;
    const sheetTop = ref.current.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const targetScroll = ref.current.scrollTop + (elTop - sheetTop) - 65;
    ref.current.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
  };

  /* Thẻ của CHƯƠNG NÀY đã đến hạn (đọc lại sau mỗi phiên) */
  const dueFlash = useMemo(
    () => (uid && chapter.id ? dueCardsOf(uid, { topicId: chapter.id }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, chapter.id, cardTick],
  );

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    if (ref.current?.focus) ref.current.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };

  const startPractice = (nextMode = 'fresh') => {
    if (chapter.bank === false || !chapter.id) return;
    switchTab('practice');
    setMode(nextMode);
    setPractice(true);
  };

  const isActiveQuiz = (tab === 'practice' && practice) || (tab === 'flash' && flash);

  /* Portal ra document.body: <main> nằm trong stacking context riêng nên nếu render
     tại chỗ, panel sẽ bị thanh nav dính (z-index 9999) vẽ đè lên phần đầu. */
  return createPortal(
    <div className="rm-sheet-backdrop ns9-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`rm-sheet ns9-centered-sheet${isActiveQuiz ? ' is-quiz-mode' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết chương ${chapter.name}`}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rm-sheet-grip" aria-hidden="true" />

        <header className="rm-sheet-head ns9-sheet-head">
          <div className="ns9-sheet-title-wrap">
            <div className="ns9-sheet-eyebrow">
              <span className="ns9-ch-pill">{levelKey} · Chương {view.index + 1}</span>
              <span className={`rm-badge tone-${meta.tone}`}>{meta.icon} {meta.label}</span>
              {review.isDue && <span className="rm-badge tone-warn">◷ Cần ôn lại</span>}
              <span className="ns9-bank-count-pill">{totalBuiltin} câu chuẩn cấu trúc ĐH</span>
            </div>
            <h2>{chapter.name}</h2>
            {!isActiveQuiz && chapter.desc && <p className="rm-sheet-desc">{chapter.desc}</p>}
          </div>
          <button type="button" className="rm-x ns9-sheet-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        {!isActiveQuiz && (
          <div className="rm-sheet-metrics ns9-sheet-metrics">
            <div>
              <small>Độ thành thạo</small>
              <b>{mastery.score === null ? '—' : `${mastery.score}%`}</b>
              <i>{mastery.score === null ? 'Chưa đủ dữ liệu (cần ≥5 câu)' : `${mastery.confidence === 'low' ? 'Ít dữ liệu' : mastery.confidence === 'medium' ? 'Đủ dùng' : 'Độ tin cậy cao'}`}</i>
            </div>
            <div>
              <small>Độ chính xác</small>
              <b>{summary ? `${summary.correct}/${summary.answers} câu` : '—'}</b>
              <i>{summary ? `Tỉ lệ đúng ${mastery.accuracy}%` : 'Chưa làm câu nào'}</i>
            </div>
            <div>
              <small>Nhịp ôn tập</small>
              <b>{summary ? agoLabel(summary.lastAt) : 'Chưa học'}</b>
              <i>{review.dueAt ? `Lịch ôn tiếp sau ${review.intervalDays} ngày` : 'Làm bài để kích hoạt lịch ôn'}</i>
            </div>
          </div>
        )}

        <div className="rm-tabs ns9-sheet-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'on' : ''} onClick={() => switchTab('overview')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconBook size={14} /> Lý thuyết &amp; Trọng tâm
          </button>
          <button type="button" role="tab" aria-selected={tab === 'practice'} className={tab === 'practice' ? 'on' : ''} onClick={() => switchTab('practice')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconTarget size={14} /> Luyện đề ({totalBuiltin} câu)
          </button>
          <button type="button" role="tab" aria-selected={tab === 'flash'} className={tab === 'flash' ? 'on' : ''} onClick={() => switchTab('flash')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconZap size={14} /> Thẻ ghi nhớ (Flashcard)
          </button>
          <button type="button" role="tab" aria-selected={tab === 'evidence'} className={tab === 'evidence' ? 'on' : ''} onClick={() => switchTab('evidence')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconChart size={14} /> Lịch sử &amp; Bằng chứng
          </button>
        </div>

        {tab === 'overview' && (
          <div className="rm-sheet-body" ref={bodyRef}>
            {/* ── LỘ TRÌNH ÔN TẬP LOGIC 4 BƯỚC ── */}
            <div className="ns9-ch-pipeline" style={{ margin: '0 0 16px' }} aria-label="Lộ trình ôn tập logic 4 bước">
              <div className="ns9-pipe-header">
                <span className="ns9-pipe-label">⚡ Lộ trình ôn tập logic 4 bước chuẩn sư phạm (GDPT 2018)</span>
              </div>
              <div className="ns9-pipe-steps">
                <button
                  type="button"
                  className="ns9-pipe-step"
                  onClick={() => scrollToAnchor('sec-concepts')}
                  title="Bước 1: Nắm vững khái niệm cốt lõi, quy trình giải và sơ đồ tư duy"
                >
                  <span className="ns9-pipe-num">1</span>
                  <span className="ns9-pipe-txt">Lý thuyết &amp; Mindmap</span>
                </button>
                <span className="ns9-pipe-arrow">›</span>
                <button
                  type="button"
                  className="ns9-pipe-step"
                  onClick={() => { switchTab('practice'); setMode('fresh'); setPractice(true); }}
                  title="Bước 2: Luyện trắc nghiệm 3 cấp độ Nhận biết - Thông hiểu - Vận dụng"
                >
                  <span className="ns9-pipe-num">2</span>
                  <span className="ns9-pipe-txt">Luyện 3 cấp độ</span>
                </button>
                <span className="ns9-pipe-arrow">›</span>
                <button
                  type="button"
                  className="ns9-pipe-step"
                  onClick={() => { switchTab('flash'); setFlash(true); }}
                  title="Bước 3: Flashcards phản xạ và nhận diện các bẫy đề thi hay gặp"
                >
                  <span className="ns9-pipe-num">3</span>
                  <span className="ns9-pipe-txt">Flashcard &amp; Bẫy thi</span>
                </button>
                <span className="ns9-pipe-arrow">›</span>
                <button
                  type="button"
                  className="ns9-pipe-step"
                  onClick={() => { switchTab('practice'); setMode('review'); setPractice(true); }}
                  title="Bước 4: Ôn tập lại câu sai và làm đề kiểm tra đánh giá năng lực"
                >
                  <span className="ns9-pipe-num">4</span>
                  <span className="ns9-pipe-txt">{dueCount > 0 ? `Ôn ${dueCount} câu sai` : 'Đề kiểm tra'}</span>
                </button>
              </div>
            </div>

            {/* ── DANH SÁCH BÀI HỌC CHI TIẾT THEO CHƯƠNG ── */}
            {subLessons.length > 0 && (
              <div className="ns9-ch-lessons-box" style={{ margin: '0 0 16px' }}>
                <div className="ns9-ch-lessons-header">
                  <span className="ns9-ch-lessons-title">
                    📚 Danh sách bài học chi tiết của chương ({subLessons.length} bài)
                  </span>
                  <span className="ns9-ch-lessons-hint">Bấm để học chuyên sâu &rarr;</span>
                </div>
                <div className="ns9-ch-lessons-list">
                  {subLessons.map((les) => (
                    <button
                      key={les.id}
                      type="button"
                      className="ns9-ch-lesson-pill"
                      onClick={() => onOpenChapter(les.id)}
                      title={`Mở bài học chuyên sâu: ${les.title}`}
                    >
                      <span className="ns9-les-idx">Bài {les.lessonIndex}</span>
                      <span className="ns9-les-title">{les.title}</span>
                      <span className="ns9-les-meta">⏱️ {les.duration || '25p'} · {les.practiceCount || 8} câu</span>
                      {les.tag && <span className="ns9-les-tag">{les.tag}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thanh mục lục chuyển nhanh (Anchor Quick-Nav) */}
            <nav className="ns9-anchor-bar" aria-label="Mục lục chuyên đề">
              <button type="button" className="ns9-anchor-pill" onClick={() => scrollToAnchor('sec-concepts')}>
                <IconBook size={13} /> Khái niệm ({pedagogy.concepts.length})
              </button>
              <button type="button" className="ns9-anchor-pill" onClick={() => scrollToAnchor('sec-algorithms')}>
                <IconZap size={13} /> Quy trình giải ({pedagogy.algorithms.length})
              </button>
              {pedagogy.formulas.length > 0 && (
                <button type="button" className="ns9-anchor-pill" onClick={() => scrollToAnchor('sec-formulas')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="4" y1="9" x2="20" y2="9" />
                    <line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="8" y2="21" />
                    <line x1="16" y1="3" x2="14" y2="21" />
                  </svg>
                  Công thức ({pedagogy.formulas.length})
                </button>
              )}
              {pedagogy.infographics?.length > 0 && (
                <button type="button" className="ns9-anchor-pill" onClick={() => scrollToAnchor('sec-infographics')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Sơ đồ ({pedagogy.infographics.length})
                </button>
              )}
              {pedagogy.traps.length > 0 && (
                <button type="button" className="ns9-anchor-pill" onClick={() => scrollToAnchor('sec-traps')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Bẫy sai ({pedagogy.traps.length})
                </button>
              )}
              {chapter.bank !== false && (
                <button type="button" className="ns9-anchor-pill cta-pill" onClick={() => startPractice('fresh')}>
                  <IconTarget size={13} /> Luyện tập ngay
                </button>
              )}
            </nav>

            {/* Kiến thức cần học trước */}
            {(chapter.prereq || []).length > 0 && (
              <section className="ns9-pedagogy-section" style={{ marginBottom: 18 }}>
                <div className="ns9-pedagogy-head">
                  <h3>Kiến thức cần học trước</h3>
                  <span className="ns9-pedagogy-count-badge">Gợi ý lộ trình</span>
                </div>
                <ul className="rm-prereq">
                  {chapter.prereq.map((pid) => {
                    const miss = missingPrereq.find((p) => p.id === pid);
                    const name = chapterName(pid) || pid;
                    return (
                      <li key={pid} className={miss ? 'miss' : 'ok'}>
                        <span aria-hidden="true">{miss ? '!' : '✓'}</span>
                        <span>{name}</span>
                        <em>{miss ? 'chưa đạt 60%' : 'đã đạt'}</em>
                        <button type="button" className="rm-link" onClick={() => onOpenChapter?.(pid)}>Mở</button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* TRỤ CỘT 1: KHÁI NIỆM CỐT LÕI */}
            <section id="sec-concepts" className="ns9-pedagogy-section">
              <div className="ns9-pedagogy-head">
                <h3>
                  <IconBook size={16} />
                  <span>1. Khái niệm &amp; Bản chất cốt lõi</span>
                </h3>
                <span className="ns9-pedagogy-count-badge">{pedagogy.concepts.length} trọng tâm</span>
              </div>
              <div className="ns9-concept-list">
                {pedagogy.concepts.map((c, i) => (
                  <div key={i} className="ns9-concept-card">
                    <div className="ns9-concept-title">
                      <span className="ns9-concept-tag">Trọng tâm {i + 1}</span>
                      <span><MathText text={c.title} /></span>
                    </div>
                    <div className="ns9-concept-desc">
                      <MathText text={c.desc} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TRỤ CỘT 2: QUY TRÌNH & THUẬT TOÁN GIẢI BÀI */}
            <section id="sec-algorithms" className="ns9-pedagogy-section">
              <div className="ns9-pedagogy-head">
                <h3>
                  <IconZap size={16} />
                  <span>2. Quy trình &amp; Thuật toán giải bài toán</span>
                </h3>
                <span className="ns9-pedagogy-count-badge">{pedagogy.algorithms.length} bước</span>
              </div>
              <div className="ns9-algo-list">
                {pedagogy.algorithms.map((step) => (
                  <div key={step.step} className="ns9-algo-step">
                    <div className="ns9-step-badge">Bước {step.step}</div>
                    <div className="ns9-step-content">
                      <h4><MathText text={step.title} /></h4>
                      <p><MathText text={step.instruction} /></p>
                      {step.tip && (
                        <div className="ns9-step-tip">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <span><MathText text={step.tip} /></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TRỤ CỘT 3: THẺ CÔNG THỨC TRỌNG TÂM */}
            {pedagogy.formulas.length > 0 && (
              <section id="sec-formulas" className="ns9-pedagogy-section">
                <div className="ns9-pedagogy-head">
                  <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                    <span>3. Thẻ công thức cần nhớ (Chuẩn KaTeX)</span>
                  </h3>
                  <span className="ns9-pedagogy-count-badge">{pedagogy.formulas.length} công thức</span>
                </div>
                <div className="ns9-formula-list">
                  {pedagogy.formulas.map((f) => (
                    <div key={f.id} className="ns9-pedagogy-formula-card">
                      <div className="ns9-formula-head">
                        <div className="ns9-formula-title">
                          <span className="ns9-concept-tag">Công thức</span>
                          <b><MathText text={f.name} /></b>
                        </div>
                        <button
                          type="button"
                          className={`ns9-formula-copy-btn ${copiedFormulaId === f.id ? 'copied' : ''}`}
                          onClick={() => handleCopyFormula(f.id, f.displayLatex)}
                          title="Sao chép công thức dạng LaTeX"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>{copiedFormulaId === f.id ? 'Đã copy LaTeX' : 'Copy LaTeX'}</span>
                        </button>
                      </div>

                      <div className="ns9-formula-display">
                        <MathText text={`$$${f.displayLatex}$$`} />
                      </div>

                      {f.symbols && f.symbols.length > 0 && (
                        <div className="ns9-formula-symbols">
                          {f.symbols.map((sym, sIdx) => (
                            <div key={sIdx} className="ns9-symbol-row">
                              <span className="ns9-symbol-badge">
                                <MathText text={`$${sym.s}$`} />
                              </span>
                              <span>{sym.name}</span>
                              {sym.unit && <span className="ns9-symbol-unit">[{sym.unit}]</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {f.notes && (
                        <div className="ns9-formula-note">
                          <b>Ghi chú:</b> <MathText text={f.notes} />
                        </div>
                      )}

                      {f.example && (
                        <div className="ns9-formula-example">
                          <b>Ví dụ áp dụng:</b> <MathText text={f.example} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TRỤ CỘT 4: BẪY TRẮC NGHIỆM & LỖI THƯỜNG GẶP */}
            {pedagogy.traps.length > 0 && (
              <section id="sec-traps" className="ns9-pedagogy-section">
                <div className="ns9-pedagogy-head">
                  <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>4. Bẫy đề thi &amp; Lỗi học sinh hay mắc</span>
                  </h3>
                  <span className="ns9-pedagogy-count-badge" style={{ color: '#ef4444' }}>{pedagogy.traps.length} bẫy đề thi</span>
                </div>
                <div className="ns9-trap-list">
                  {pedagogy.traps.map((tr, i) => (
                    <div key={i} className="ns9-trap-card">
                      <div className="ns9-trap-head">
                        <span className="ns9-trap-tag">Cảnh báo bẫy #{i + 1}</span>
                        <span><MathText text={tr.title} /></span>
                      </div>
                      <div className="ns9-trap-text">
                        <b>Bẫy thường gặp:</b> <MathText text={tr.trap} />
                      </div>
                      {tr.advice && (
                        <div className="ns9-trap-advice">
                          <b>Lời khuyên thầy cô:</b> <MathText text={tr.advice} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SƠ ĐỒ TƯ DUY & INFOGRAPHIC SGK CHUYÊN SÂU */}
            {pedagogy.infographics?.length > 0 && (
              <section id="sec-infographics" className="ns9-pedagogy-section">
                <div className="ns9-pedagogy-head">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Sơ đồ tóm tắt &amp; Infographic chuẩn SGK</span>
                  </h3>
                  <span className="ns9-pedagogy-count-badge" style={{ color: '#2563eb', background: '#eff6ff' }}>
                    {pedagogy.infographics.length} sơ đồ trực quan
                  </span>
                </div>
                <div className="ns9-infographics-grid">
                  {pedagogy.infographics.map((info) => (
                    <div
                      key={info.id}
                      className="ns9-infographic-card"
                      onClick={() => setSelectedModalImage(info)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="ns9-info-img-wrapper">
                        <img src={info.url} alt={info.title} loading="lazy" />
                        <span className="ns9-info-zoom-hint">🔍 Xem phóng to / Tải về</span>
                      </div>
                      <div className="ns9-info-content">
                        <h4 className="ns9-info-title">{info.title}</h4>
                        {info.desc && <p className="ns9-info-desc">{info.desc}</p>}
                        {info.tags && info.tags.length > 0 && (
                          <div className="ns9-info-tags">
                            {info.tags.map((t, idx) => (
                              <span key={idx} className="ns9-info-tag">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CẦU NỐI LUYỆN TẬP NGAY (DIRECT ACTION CTA) */}
            <div className="ns9-overview-action-cta">
              <div className="ns9-cta-left">
                <h4>Sẵn sàng làm chủ chuyên đề {chapter.name}?</h4>
                <p>Bộ câu hỏi biên soạn chuẩn ma trận Bộ GD&ĐT ({totalBuiltin} câu trắc nghiệm)</p>
              </div>
              <div className="ns9-cta-acts">
                <button type="button" className="ns9-cta-ai-btn" onClick={() => onAi?.('summary')}>
                  ✦ Nhờ Gia sư AI giảng sâu hơn
                </button>
                {chapter.bank !== false && (
                  <button type="button" className="ns9-cta-btn" onClick={() => startPractice('fresh')}>
                    <IconTarget size={16} /> Bắt đầu luyện ({totalBuiltin} câu)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'practice' && (
          <div className="rm-sheet-body" ref={bodyRef}>
            {practice ? (
              <PracticeRunner
                chapterId={chapter.id}
                chapterName={chapter.name}
                uid={uid}
                mode={mode}
                size={size}
                level={diffLevel}
                onAi={onAi}
                onDone={() => onRefresh?.()}
                onClose={() => setPractice(false)}
              />
            ) : (
              <div className="rm-state inline">
                <b>Luyện trắc nghiệm theo chương</b>
                <p>
                  Kết hợp ngân hàng đề của giáo viên và <b>{totalBuiltin} câu biên soạn chuẩn SGK</b> cho
                  chuyên đề <b>{chapter.name}</b> ({lvCounts.nb} Nhận biết · {lvCounts.th} Thông hiểu · {lvCounts.vd} Vận dụng).
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <div className="rm-size" role="group" aria-label="Mức độ câu hỏi">
                    {[
                      { k: 'all', label: 'Tất cả' },
                      { k: 'nb', label: `${LEVEL_META.nb.label} (${lvCounts.nb})` },
                      { k: 'th', label: `${LEVEL_META.th.label} (${lvCounts.th})` },
                      { k: 'vd', label: `${LEVEL_META.vd.label} (${lvCounts.vd})` },
                    ].map((opt) => (
                      <button
                        key={opt.k}
                        type="button"
                        className={diffLevel === opt.k ? 'on' : ''}
                        aria-pressed={diffLevel === opt.k}
                        onClick={() => setDiffLevel(opt.k)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="rm-size" role="group" aria-label="Số câu mỗi phiên">
                    {[5, 8, 12].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={size === n ? 'on' : ''}
                        aria-pressed={size === n}
                        onClick={() => setSize(n)}
                      >
                        {n} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rm-quiz-foot">
                  <button
                    type="button"
                    className="rm-btn"
                    onClick={() => startPractice('review')}
                    disabled={chapter.bank === false || dueCount === 0}
                  >
                    {dueCount > 0 ? `Ôn ${Math.min(size, dueCount)} câu từng sai` : 'Không có câu từng sai'}
                  </button>
                  <button
                    type="button"
                    className="rm-btn primary"
                    onClick={() => startPractice('fresh')}
                    disabled={chapter.bank === false}
                  >
                    {chapter.bank === false ? 'Chưa có ngân hàng câu hỏi' : `Bắt đầu luyện (${size} câu)`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'evidence' && (
          <div className="rm-sheet-body" ref={bodyRef}>
            <section>
              <h3>Bằng chứng đang dùng để tính điểm</h3>
              {!summary ? (
                <p className="rm-muted">
                  Chưa có câu trả lời nào thuộc chương này. Điểm thành thạo để trống thay vì gán 0%.
                </p>
              ) : (
                <>
                  <ul className="rm-evidence">
                    {Object.entries(summary.bySource || {}).map(([src, n]) => (
                      <li key={src}>
                        <span>{SOURCE_LABEL[src] || src}</span>
                        <b>{n} câu</b>
                      </li>
                    ))}
                  </ul>
                  <p className="rm-muted sm">
                    {summary.sessions} phiên · từ {agoLabel(summary.firstAt)} đến {agoLabel(summary.lastAt)}.
                    Điểm thành thạo = độ chính xác × độ dày bằng chứng × độ mới, không dùng % số bài đã mở.
                  </p>
                </>
              )}
            </section>
          </div>
        )}

        {tab === 'flash' && (
          <div className="rm-sheet-body" ref={bodyRef}>
            {flash ? (
              <FlashcardSession
                chapterId={chapter.id}
                chapterName={chapter.name}
                uid={uid}
                size={size}
                qids={flashQids}
                onClose={() => { setFlash(false); setFlashQids(null); setCardTick((t) => t + 1); }}
                onDone={() => { setCardTick((t) => t + 1); onRefresh?.(); }}
              />
            ) : (
              <div className="rm-state inline">
                <b>Học bằng thẻ ghi nhớ</b>
                <p>
                  Mặt trước là câu hỏi, mặt sau là đáp án và giải thích. Bạn tự đánh giá 3 mức
                  (chưa nhớ / nhớ một phần / nhớ tốt) để hệ thống hẹn ngày ôn lại.
                </p>
                <div className="rm-size" role="group" aria-label="Số thẻ mỗi phiên">
                  {[5, 8, 12].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={size === n ? 'on' : ''}
                      aria-pressed={size === n}
                      onClick={() => setSize(n)}
                    >
                      {n} thẻ
                    </button>
                  ))}
                </div>
                <div className="rm-quiz-foot">
                  <button
                    type="button"
                    className="rm-btn"
                    onClick={() => { setFlashQids(dueFlash.map((c) => c.qid)); setFlash(true); }}
                    disabled={chapter.bank === false || dueFlash.length === 0}
                  >
                    {dueFlash.length > 0 ? `Ôn ${Math.min(size, dueFlash.length)} thẻ đến hạn` : 'Chưa có thẻ đến hạn'}
                  </button>
                  <button
                    type="button"
                    className="rm-btn primary"
                    onClick={() => { setFlashQids(null); setFlash(true); }}
                    disabled={chapter.bank === false}
                  >
                    {chapter.bank === false ? 'Chưa có ngân hàng câu hỏi' : `Bắt đầu ${size} thẻ`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isActiveQuiz && (
          <footer className="rm-sheet-foot ns9-sheet-foot">
            {chapter.bank !== false && (
              <button
                type="button"
                className="rm-btn primary"
                onClick={() => startPractice('fresh')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <IconTarget size={15} /> Bắt đầu luyện tập ngay
              </button>
            )}
            <button type="button" className="rm-btn" onClick={() => onAi?.('summary')}>✦ Học cùng Gia sư AI</button>
            <button
              type="button"
              className="rm-btn"
              onClick={() => { window.location.hash = 'notebook?topic=' + encodeURIComponent(chapter.id || ''); }}
              disabled={!chapter.id}
            >
              Sổ lỗi sai
            </button>
          </footer>
        )}
      </div>

      {/* Lightbox Modal phóng to Infographic */}
      {selectedModalImage && (
        <div className="ns9-lightbox-overlay" onClick={() => setSelectedModalImage(null)}>
          <div className="ns9-lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="ns9-lightbox-title-box">
              <h3>{selectedModalImage.title}</h3>
              <p>{selectedModalImage.desc || 'Sơ đồ tóm tắt kiến thức chuẩn CT GDPT 2018'}</p>
            </div>
            <div className="ns9-lightbox-actions">
              <a
                href={selectedModalImage.url}
                download
                target="_blank"
                rel="noreferrer"
                className="ns9-lightbox-btn"
                title="Tải ảnh về máy"
              >
                📥 Tải về
              </a>
              <button
                type="button"
                className="ns9-lightbox-btn close-btn"
                onClick={() => setSelectedModalImage(null)}
                aria-label="Đóng cửa sổ"
              >
                ✕ Đóng
              </button>
            </div>
          </div>
          <div className="ns9-lightbox-body" onClick={() => setSelectedModalImage(null)}>
            <img
              src={selectedModalImage.url}
              alt={selectedModalImage.title}
              className="ns9-lightbox-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
