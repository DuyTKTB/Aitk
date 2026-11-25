import React, { useMemo, useRef, useState } from 'react';
import MathText, { MathTextConfigContext } from '../MathText.jsx';
import { subjectUsesMath } from '../../lib/subjects.js';
import { buildExamQuestionsForPaper } from '../../data/virtualExamsBank.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function ExamPreviewModal({
  exam,
  isFav,
  canAccess,
  onClose,
  onStart,
  onRequireUpgrade,
  onToggleFav,
}) {
  const [tab, setTab] = useState('preview'); // 'preview' | 'answers'
  const [quickTableOpen, setQuickTableOpen] = useState(true);
  const bodyRef = useRef(null);

  const switchTab = (nextTab) => {
    setTab(nextTab);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };

  const questions = useMemo(() => {
    if (!exam) return [];
    try {
      return buildExamQuestionsForPaper(exam) || [];
    } catch {
      return exam.questions || [];
    }
  }, [exam]);

  const partOf = (q) =>
    q.type === 'essay' || q.part === 4
      ? 4
      : q.part || (q.type === 'true_false' || Array.isArray(q.statements) ? 2 : q.type === 'short_answer' ? 3 : 1);

  const structure = useMemo(() => {
    let p1 = 0; let p2 = 0; let p3 = 0; let p4 = 0;
    questions.forEach((q) => {
      const p = partOf(q);
      if (p === 2) p2++;
      else if (p === 3) p3++;
      else if (p === 4) p4++;
      else p1++;
    });
    return { p1, p2, p3, p4, total: questions.length };
  }, [questions]);

  if (!exam) return null;

  const previewQs = questions.slice(0, 5);
  const solvedQs = questions.slice(0, 4);
  const remainingCount = Math.max(0, questions.length - previewQs.length);
  const disableChem = Boolean(exam?.subject) && !subjectUsesMath(exam.subject);

  const formatAnswerLabel = (q) => {
    const p = partOf(q);
    if (p === 4) return 'Tự luận';
    if (p === 2 && Array.isArray(q.statements)) {
      return q.statements.map((s, i) => `${String.fromCharCode(97 + i)}-${s.answer ? 'Đ' : 'S'}`).join(' · ');
    }
    if (p === 3) return String(q.answer ?? q.accepted?.[0] ?? '—');
    const idx = typeof q.correct === 'number' ? q.correct : 0;
    return LETTERS[idx] || 'A';
  };

  return (
    <MathTextConfigContext.Provider value={{ disableChemFormat: disableChem }}>
    <div
      className="s9-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem trước đề ${exam.title}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="s9-preview-modal">
        <header className="s9-pm-head">
          <div className="s9-pm-head-main">
            <div className={`emm-hero-mascot ${tab === 'answers' ? 'is-emerald' : ''}`} aria-hidden="true">
              <img
                src={tab === 'answers' ? '/img/elec/elec-wink.png' : '/img/elec/elec-hello.png'}
                alt="Bé Elec đồng hành xem trước đề"
                draggable={false}
              />
            </div>
            <div className="s9-pm-head-info">
              <div className="s9-pm-badges">
                <span className="s9-pm-badge is-type">{exam.examType || 'THPTQG'}</span>
                <span className={`s9-pm-badge is-${String(exam.tier || 'free').toLowerCase()}`}>
                  {exam.tier || 'FREE'}
                </span>
                {exam.duration && <span className="s9-pm-badge is-neutral">{exam.duration} phút</span>}
                <span className="s9-pm-badge is-neutral">{structure.total || exam.questionCount || 0} câu</span>
              </div>
              <h3>{exam.title}</h3>
              <p className="s9-pm-sub">
                Cấu trúc đề:{' '}
                {structure.p1 > 0 && <><b>Phần I: {structure.p1} câu</b></>}
                {structure.p2 > 0 && <>{structure.p1 > 0 ? ' · ' : ''}<b>Phần II: {structure.p2} câu</b></>}
                {structure.p3 > 0 && <>{(structure.p1 + structure.p2) > 0 ? ' · ' : ''}<b>Phần III: {structure.p3} câu</b></>}
                {structure.p4 > 0 && <>{(structure.p1 + structure.p2 + structure.p3) > 0 ? ' · ' : ''}<b>Tự luận: {structure.p4} câu</b></>}
                {exam.author ? ` · Biên soạn: ${exam.author}` : ''}
              </p>
              <div className="emm-speech-pill">
                <span className="emm-speech-dot" aria-hidden="true" />
                <span>
                  {tab === 'answers'
                    ? 'Elec bật mí: xem kỹ bẫy đáp án mẫu rồi vào phòng thi bấm giờ nhé!'
                    : 'Elec gợi ý: đọc lướt 5 câu đầu để ước lượng tốc độ làm bài chuẩn!'}
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="s9-pm-close" onClick={onClose} aria-label="Đóng xem trước">
            ✕
          </button>
        </header>

        {/* Thanh chuyển 2 tab kiểu 9Study kèm linh vật Bé Elec */}
        <div className="s9-pm-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            className={`s9-pm-tab ${tab === 'preview' ? 'active' : ''}`}
            onClick={() => switchTab('preview')}
          >
            <img src="/img/elec/elec-think.png" alt="" className="emm-tab-mascot" aria-hidden="true" />
            <span>Xem trước đề</span>
            <span className="s9-pm-tab-count">{previewQs.length} câu đầu</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'answers'}
            className={`s9-pm-tab ${tab === 'answers' ? 'active' : ''}`}
            onClick={() => switchTab('answers')}
          >
            <img src="/img/elec/elec-celebrate.png" alt="" className="emm-tab-mascot" aria-hidden="true" />
            <span>Đáp án &amp; Lời giải mẫu</span>
            <span className="s9-pm-tab-count">{solvedQs.length} câu</span>
          </button>
        </div>

        <div className="s9-pm-body" ref={bodyRef}>
          {questions.length === 0 ? (
            <div className="s9-pm-empty">
              <img src="/img/elec/elec-hello.png" alt="Bé Elec chào đón" />
              <span>Đề thi này được khởi tạo động khi vào phòng thi. Bấm nút bên dưới để bắt đầu làm bài ngay!</span>
            </div>
          ) : tab === 'preview' ? (
            <>
              <ol className="s9-pm-qlist">
                {previewQs.map((q, idx) => {
                  const p = partOf(q);
                  return (
                    <li key={q.id || idx} className="s9-pm-qcard">
                      <div className="s9-pm-qhead">
                        <b className="s9-pm-qnum">Câu {idx + 1}</b>
                        <span className="s9-pm-qpart">
                          {p === 2 ? 'Đúng / Sai' : p === 3 ? 'Trả lời ngắn' : p === 4 ? 'Tự luận / Đọc hiểu mở' : 'Trắc nghiệm 4 lựa chọn'}
                        </span>
                      </div>
                      {q.passage && (
                        <div className="s9-pm-passage" style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(14,165,233,0.06)', fontSize: '0.88rem' }}>
                          <MathText as="div">{q.passage}</MathText>
                        </div>
                      )}
                      <div className="s9-pm-qtext">
                        <MathText as="div">{q.q || q.content || (q.passage ? '(Chọn phương án / trả lời theo ngữ liệu trên)' : '')}</MathText>
                      </div>

                      {p === 2 && Array.isArray(q.statements) ? (
                        <ul className="s9-pm-opts">
                          {q.statements.map((st, si) => (
                            <li key={si} className="s9-pm-opt">
                              <b className="s9-pm-opt-letter">{String.fromCharCode(97 + si)}</b>
                              <span><MathText as="span">{st.text}</MathText></span>
                            </li>
                          ))}
                        </ul>
                      ) : p === 3 ? (
                        <div className="s9-pm-sa-hint">Điền đáp án số ngắn gọn khi vào phòng thi</div>
                      ) : p === 4 ? (
                        <div className="s9-pm-sa-hint">Trình bày câu trả lời tự luận khi vào phòng thi</div>
                      ) : (
                        <ul className="s9-pm-opts">
                          {(q.options || []).map((opt, oi) => (
                            <li key={oi} className="s9-pm-opt">
                              <b className="s9-pm-opt-letter">{LETTERS[oi]}</b>
                              <span><MathText as="span">{String(opt).replace(/^[A-D]\.\s*/i, '')}</MathText></span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>

              {remainingCount > 0 && (
                <div className="s9-pm-gate">
                  <img
                    src="/img/elec/elec-super-saiyan.png"
                    alt="Bé Elec sẵn sàng bứt phá"
                    className="s9-pm-gate-mascot"
                  />
                  <div className="s9-pm-gate-text">
                    <strong>Còn {remainingCount} câu hỏi tiếp theo đang chờ bạn chinh phục!</strong>
                    <span>Vào phòng thi bấm giờ để làm trọn vẹn, chấm điểm tự động và nhận phân tích AI điểm yếu + ELO.</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Bảng tra cứu nhanh đáp án mẫu */}
              <div className="s9-pm-quick-box">
                <button
                  type="button"
                  className="s9-pm-quick-toggle"
                  onClick={() => setQuickTableOpen((v) => !v)}
                >
                  <span className="s9-pm-quick-toggle-l">
                    <img src="/img/elec/elec-cool.png" alt="" className="emm-tab-mascot" aria-hidden="true" />
                    <span>Bảng tra cứu nhanh đáp án (Câu 1 – Câu {solvedQs.length})</span>
                  </span>
                  <span>{quickTableOpen ? 'Thu gọn ▴' : 'Mở rộng ▾'}</span>
                </button>
                {quickTableOpen && (
                  <div className="s9-pm-quick-grid">
                    {solvedQs.map((q, idx) => (
                      <div key={idx} className="s9-pm-quick-cell">
                        <span>Câu {idx + 1}</span>
                        <b>{formatAnswerLabel(q)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ol className="s9-pm-qlist">
                {solvedQs.map((q, idx) => (
                  <li key={q.id || idx} className="s9-pm-qcard is-solved">
                    <div className="s9-pm-qhead">
                      <b className="s9-pm-qnum">Câu {idx + 1}</b>
                      <span className="s9-pm-ans-pill">Đáp án: {formatAnswerLabel(q)}</span>
                    </div>
                    <div className="s9-pm-qtext">
                      <MathText as="div">{q.q || q.content || ''}</MathText>
                    </div>
                    <div className="s9-pm-explain">
                      <img src="/img/elec/elec-wink.png" alt="" className="emm-mini-mascot" aria-hidden="true" />
                      <div className="s9-pm-explain-body">
                        <b>Lời giải chi tiết · Bé Elec phân tích</b>
                        <MathText as="div">
                          {q.explain || q.explanation || 'Lời giải chi tiết được mở đầy đủ ngay sau khi hoàn thành bài thi.'}
                        </MathText>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              {questions.length > solvedQs.length && (
                <div className="s9-pm-gate">
                  <img
                    src="/img/elec/elec-fighting.png"
                    alt="Bé Elec cổ vũ hoàn thành đề"
                    className="s9-pm-gate-mascot"
                  />
                  <div className="s9-pm-gate-text">
                    <strong>Đáp án &amp; lời giải chi tiết từ Câu {solvedQs.length + 1} – Câu {questions.length}</strong>
                    <span>Hoàn thành bài thi để mở khóa toàn bộ bảng đáp án, lời giải và tự động lưu câu sai vào Sổ lỗi sai.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="s9-pm-foot">
          <div className="s9-pm-foot-buddy">
            <img
              src={isFav ? '/img/elec/elec-heart-eyes.png' : '/img/elec/elec-happy.png'}
              alt=""
              className="emm-mini-mascot"
              aria-hidden="true"
            />
            <span>{isFav ? 'Đề yêu thích đã lưu trong tủ ôn!' : 'Sẵn sàng bấm giờ cùng Bé Elec!'}</span>
          </div>
          <div className="s9-pm-foot-actions">
            <button
              type="button"
              className={`s9-pm-btn is-ghost ${isFav ? 'is-fav' : ''}`}
              onClick={() => onToggleFav?.(exam.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{isFav ? 'Đã lưu yêu thích' : 'Lưu đề yêu thích'}</span>
            </button>
            <button
              type="button"
              className="s9-pm-btn is-primary"
              onClick={() => {
                onClose?.();
                if (canAccess) onStart?.(exam);
                else onRequireUpgrade?.(exam);
              }}
            >
              <span>{canAccess ? 'Vào phòng thi bấm giờ ngay' : `Mở khóa đề ${exam.tier}`}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
    </MathTextConfigContext.Provider>
  );
}
