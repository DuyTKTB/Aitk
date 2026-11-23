import React, { useMemo, useState } from 'react';
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
          </div>
          <button type="button" className="s9-pm-close" onClick={onClose} aria-label="Đóng xem trước">
            ✕
          </button>
        </header>

        {/* Thanh chuyển 2 tab kiểu 9Study: Xem trước đề & Đáp án lời giải mẫu */}
        <div className="s9-pm-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            className={`s9-pm-tab ${tab === 'preview' ? 'active' : ''}`}
            onClick={() => setTab('preview')}
          >
            Xem trước đề ({previewQs.length} câu đầu)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'answers'}
            className={`s9-pm-tab ${tab === 'answers' ? 'active' : ''}`}
            onClick={() => setTab('answers')}
          >
            Đáp án &amp; Lời giải mẫu ({solvedQs.length} câu)
          </button>
        </div>

        <div className="s9-pm-body">
          {questions.length === 0 ? (
            <div className="s9-pm-empty">
              Đề thi này được khởi tạo động khi vào phòng thi. Bấm nút bên dưới để bắt đầu làm bài ngay!
            </div>
          ) : tab === 'preview' ? (
            <>
              <ol className="s9-pm-qlist">
                {previewQs.map((q, idx) => {
                  const p = partOf(q);
                  return (
                    <li key={q.id || idx} className="s9-pm-qcard">
                      <div className="s9-pm-qhead">
                        <b>Câu {idx + 1}</b>
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
                              <b>{String.fromCharCode(97 + si)})</b> <MathText as="span">{st.text}</MathText>
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
                              <b>{LETTERS[oi]}.</b> <MathText as="span">{String(opt).replace(/^[A-D]\.\s*/i, '')}</MathText>
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
                  <strong>Còn {remainingCount} câu hỏi tiếp theo trong đề này</strong>
                  <span>Vào phòng thi bấm giờ để làm trọn vẹn, chấm điểm tự động và nhận phân tích AI điểm yếu + ELO.</span>
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
                  <span>Bảng tra cứu nhanh đáp án (Câu 1 – Câu {solvedQs.length})</span>
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
                      <b>Câu {idx + 1}</b>
                      <span className="s9-pm-ans-pill">Đáp án: {formatAnswerLabel(q)}</span>
                    </div>
                    <div className="s9-pm-qtext">
                      <MathText as="div">{q.q || q.content || ''}</MathText>
                    </div>
                    <div className="s9-pm-explain">
                      <b>Lời giải chi tiết</b>
                      <MathText as="div">
                        {q.explain || q.explanation || 'Lời giải chi tiết được mở đầy đủ ngay sau khi hoàn thành bài thi.'}
                      </MathText>
                    </div>
                  </li>
                ))}
              </ol>

              {questions.length > solvedQs.length && (
                <div className="s9-pm-gate">
                  <strong>Đáp án &amp; lời giải chi tiết từ Câu {solvedQs.length + 1} – Câu {questions.length}</strong>
                  <span>Hoàn thành bài thi để mở khóa toàn bộ bảng đáp án, lời giải và tự động lưu câu sai vào Sổ lỗi sai.</span>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="s9-pm-foot">
          <button
            type="button"
            className={`s9-pm-btn is-ghost ${isFav ? 'is-fav' : ''}`}
            onClick={() => onToggleFav?.(exam.id)}
          >
            {isFav ? 'Đã lưu yêu thích' : 'Lưu đề yêu thích'}
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
            {canAccess ? 'Vào phòng thi bấm giờ ngay' : `Mở khóa đề ${exam.tier}`}
          </button>
        </footer>
      </div>
    </div>
    </MathTextConfigContext.Provider>
  );
}
