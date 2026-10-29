/* ============================================================
   DiagnosticTestModal.jsx — BÀI ĐÁNH GIÁ NĂNG LỰC ĐẦU VÀO (12 CÂU)
   ------------------------------------------------------------
   • Giúp học sinh mới (hoặc muốn đo lại trình độ) làm 12 câu phân loại
     (Nhận biết -> Thông hiểu -> Vận dụng) phủ đều các chương trọng tâm.
   • Nộp bài xong tự động ghi nhận vào roadmapStore theo từng chương để
     mở khóa ngay Điểm Hóa dự đoán, Hệ số Elo, Sổ lỗi sai và Lộ trình cá nhân hóa.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildDiagnosticQuestions, LEVEL_META } from '../../data/roadmapExercises.js';
import { chapterName } from '../../data/roadmap.js';
import { saveSession } from '../../lib/roadmapStore.js';
import { IconClose, IconPin, IconBulb } from '../Icons.jsx';

export default function DiagnosticTestModal({
  open,
  uid,
  levelKey = 'Lớp 12',
  chapters = [],
  onClose,
  onCompleted,
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]); // [{ q, chosen, ok }]
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(Date.now());

  const topicIds = useMemo(
    () => (chapters || []).map((c) => c.chapter?.id || c.id).filter(Boolean),
    [chapters],
  );

  const questions = useMemo(() => {
    if (!open) return [];
    return buildDiagnosticQuestions(topicIds, 12);
  }, [open, topicIds]);

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
    startedAtRef.current = Date.now();
  }, [open]);

  const currentQ = questions[stepIdx] || null;

  const handlePickOption = (optIdx) => {
    if (picked !== null || !currentQ) return;
    setPicked(optIdx);
  };

  const handleNext = () => {
    if (picked === null || !currentQ) return;
    const isOk = picked === currentQ.correct;
    const nextAnswers = [...answers, { q: currentQ, chosen: picked, ok: isOk }];
    setAnswers(nextAnswers);
    setPicked(null);

    if (stepIdx + 1 < questions.length) {
      setStepIdx(stepIdx + 1);
      return;
    }

    // Hoàn tất 12 câu -> gom theo từng chương và lưu vào roadmapStore
    const byTopic = new Map();
    nextAnswers.forEach((item) => {
      const tId = item.q.topicId;
      if (!byTopic.has(tId)) byTopic.set(tId, []);
      byTopic.get(tId).push(item);
    });

    const elapsedSec = Math.max(30, Math.round((Date.now() - startedAtRef.current) / 1000));
    const secPerTopic = Math.max(10, Math.round(elapsedSec / Math.max(1, byTopic.size)));

    if (uid) {
      byTopic.forEach((list, tId) => {
        const correctCount = list.filter((x) => x.ok).length;
        saveSession(uid, {
          topicId: tId,
          total: list.length,
          correct: correctCount,
          durationSec: secPerTopic,
          source: 'practice',
          answers: list.map((x) => ({ qid: x.q.id, ok: x.ok })),
        });
      });
    }

    setFinished(true);
    onCompleted?.();
  };

  useEffect(() => {
    if (!open || finished) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (!currentQ) return;
      if (picked === null) {
        const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
        const k = map[String(e.key).toLowerCase()];
        if (k !== undefined && k < currentQ.options.length) {
          e.preventDefault();
          handlePickOption(k);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!open) return null;

  const totalQ = questions.length || 12;
  const correctTotal = answers.filter((a) => a.ok).length;
  const estimatedScore10 = Math.round((correctTotal / Math.max(1, totalQ)) * 10 * 4) / 4;
  const progressPct = Math.round(((stepIdx + (picked !== null ? 1 : 0)) / Math.max(1, totalQ)) * 100);

  return createPortal(
    <div className="rm-sheet-backdrop ns9-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="rm-sheet ns9-centered-sheet ns9-diag-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Bài đánh giá năng lực đầu vào môn Hóa ${levelKey}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rm-sheet-grip" aria-hidden="true" />

        <header className="rm-sheet-head ns9-sheet-head">
          <div className="ns9-sheet-title-wrap">
            <div className="ns9-sheet-eyebrow">
              <span className="ns9-ch-pill">ĐÁNH GIÁ NĂNG LỰC ĐẦU VÀO · {levelKey.toUpperCase()}</span>
            </div>
            <h2>
              {finished
                ? `Kết quả: ${correctTotal}/${totalQ} câu đúng (${estimatedScore10}/10 điểm)`
                : `Câu ${stepIdx + 1}/${totalQ} · ${chapterName(currentQ?.topicId) || 'Chuyên đề Hóa học'}`}
            </h2>
          </div>
          <button type="button" className="rm-x ns9-sheet-close" onClick={onClose} aria-label="Đóng">
            <IconClose size={18} />
          </button>
        </header>

        {!finished && currentQ && (
          <div className="rm-sheet-body ns9-diag-body">
            <div className="rm-flash-progress" aria-hidden="true">
              <i style={{ width: `${progressPct}%` }} />
            </div>

            <div className="ns9-diag-qmeta">
              <span className="ns9-ch-index">{chapterName(currentQ.topicId)}</span>
              {currentQ.level && LEVEL_META[currentQ.level] && (
                <span className={`rm-badge tone-${LEVEL_META[currentQ.level].tone}`}>
                  Mức độ: {LEVEL_META[currentQ.level].label}
                </span>
              )}
              {currentQ.tag && (
                <span className="ns9-q-skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconPin size={12} /> {currentQ.tag}
                </span>
              )}
            </div>

            <div className="ns9-quiz-qbox">
              <p className="ns9-diag-qtext">{currentQ.q}</p>
            </div>

            <div className="ns9-diag-options">
              {currentQ.options.map((opt, idx) => {
                const isPicked = picked === idx;
                const isRight = idx === currentQ.correct;
                let cls = 'ns9-diag-opt';
                if (picked !== null) {
                  if (isRight) cls += ' is-correct';
                  else if (isPicked) cls += ' is-wrong';
                } else if (isPicked) {
                  cls += ' is-picked';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    disabled={picked !== null}
                    onClick={() => handlePickOption(idx)}
                  >
                    <span className="ns9-opt-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="ns9-opt-text">{opt}</span>
                  </button>
                );
              })}
            </div>

            {picked !== null && (
              <div className={`ns9-diag-feedback ns9-quiz-solution ${picked === currentQ.correct ? 'ok' : 'bad'}`}>
                <div className="ns9-sol-head">
                  <b>
                    {picked === currentQ.correct
                      ? '✓ Chính xác! Bạn nắm rất vững phần này'
                      : `✕ Chưa đúng — Đáp án đúng là ${String.fromCharCode(65 + currentQ.correct)}: ${currentQ.options[currentQ.correct]}`}
                  </b>
                </div>
                {currentQ.explain && (
                  <div className="ns9-sol-steps">
                    {String(currentQ.explain)
                      .split(/\n|(?=• )/)
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((step, sIdx) => (
                        <p key={sIdx} className="ns9-sol-step-line">{step}</p>
                      ))}
                  </div>
                )}
                {currentQ.tip && (
                  <div className="ns9-sol-tip">
                    <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <IconBulb size={14} /> Mẹo giải nhanh &amp; Bẫy cần tránh:
                    </b> <span>{currentQ.tip}</span>
                  </div>
                )}
              </div>
            )}

            <div className="ns9-diag-foot">
              <span className="rm-muted sm">Mẹo: Nhấn phím A/B/C/D để chọn nhanh, Enter để sang câu tiếp.</span>
              <button
                type="button"
                className="ns9-primary-cta-btn"
                disabled={picked === null}
                onClick={handleNext}
              >
                <span>{stepIdx + 1 < totalQ ? 'Câu tiếp theo' : 'Xem kết quả & Mở khóa Lộ trình'}</span>
              </button>
            </div>
          </div>
        )}

        {finished && (
          <div className="rm-sheet-body ns9-diag-body">
            <div className="ns9-diag-summary-box">
              <div>
                <span>Điểm Hóa khởi điểm của bạn</span>
                <strong>{estimatedScore10} / 10 điểm</strong>
              </div>
              <p>
                Hệ thống đã cập nhật Điểm dự đoán, Hệ số Elo và tự động đẩy các chuyên đề bạn vừa trả lời sai lên đầu danh sách ưu tiên!
              </p>
            </div>

            <h4>Chi tiết 12 câu vừa làm</h4>
            <ul className="rm-done-list">
              {answers.map((item, i) => (
                <li key={item.q.id} className={item.ok ? 'ok' : 'bad'}>
                  <div className="rm-done-q">
                    <b>Câu {i + 1} ({chapterName(item.q.topicId)}):</b> {item.q.q}
                  </div>
                  <div className="rm-done-ans">
                    <span className={item.ok ? 'correct' : 'picked'}>
                      Bạn chọn: {item.q.options[item.chosen]}
                    </span>
                    {!item.ok && (
                      <span className="correct">
                        · Đáp án đúng: {item.q.options[item.q.correct]}
                      </span>
                    )}
                  </div>
                  {item.q.explain && (
                    <div className="rm-done-expl" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <IconBulb size={13} /> {item.q.explain}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="ns9-diag-foot">
              <button type="button" className="ns9-primary-cta-btn" onClick={onClose}>
                <span>Vào Lộ trình học cá nhân hóa ngay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
