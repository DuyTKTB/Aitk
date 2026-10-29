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
  const totalBuiltin = useMemo(() => (chapter.id ? builtinCount(chapter.id) : 0), [chapter.id]);
  const lvCounts = useMemo(() => (chapter.id ? builtinLevelCounts(chapter.id) : { nb: 0, th: 0, vd: 0 }), [chapter.id]);

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
            <section>
              <h3>Kiến thức cần học trước</h3>
              {(chapter.prereq || []).length === 0 ? (
                <p className="rm-muted">Chương mở đầu của khối — không yêu cầu kiến thức trước.</p>
              ) : (
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
              )}
              <p className="rm-muted sm">
                Điều kiện tiên quyết chỉ mang tính gợi ý — bạn vẫn có thể học chương bất kỳ.
              </p>
            </section>

            <section>
              <h3>Trọng tâm kiến thức</h3>
              {guide ? (
                <>
                  <ul className="rm-prereq">
                    {guide.points.map((pt, i) => (
                      <li key={i} className="ok">
                        <span aria-hidden="true">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                  {guide.mistakes.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <h3 style={{ marginBottom: 6 }}>Lỗi học sinh hay mắc</h3>
                      <ul className="rm-prereq">
                        {guide.mistakes.map((ms, i) => (
                          <li key={i} className="miss">
                            <span aria-hidden="true">!</span>
                            <span>{ms}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rm-quiz-foot" style={{ marginTop: 10 }}>
                    <button type="button" className="rm-btn" onClick={() => onAi?.('summary')}>✦ Nhờ AI giảng chi tiết hơn</button>
                    {chapter.bank !== false && (
                      <button type="button" className="rm-btn primary" onClick={() => startPractice('fresh')}>
                        Làm bài tập ngay ({totalBuiltin} câu)
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="rm-state inline">
                  <b>Chuyên đề nâng cao — học cùng trợ lý AI</b>
                  <p>
                    Bạn có thể dùng trợ lý AI để tóm tắt lý thuyết và đặt câu hỏi chuyên sâu cho chương này.
                  </p>
                  <button type="button" className="rm-btn" onClick={() => onAi?.('summary')}>Tóm tắt bằng AI</button>
                </div>
              )}
            </section>
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
    </div>,
    document.body
  );
}
