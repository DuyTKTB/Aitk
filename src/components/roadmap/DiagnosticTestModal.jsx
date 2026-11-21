/* ============================================================
   DiagnosticTestModal.jsx — BÀI ĐÁNH GIÁ NĂNG LỰC ĐẦU VÀO (12 CÂU)
   ------------------------------------------------------------
   • Giúp học sinh mới (hoặc muốn đo lại trình độ) làm 12 câu phân loại
     (Nhận biết -> Thông hiểu -> Vận dụng) phủ đều các chương trọng tâm.
   • Nộp bài xong tự động ghi nhận vào roadmapStore theo từng chương để
     mở khóa ngay Điểm Hóa dự đoán, Hệ số Elo, Sổ lỗi sai và Lộ trình cá nhân hóa.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDiagnosticQuestions, LEVEL_META } from '../../data/roadmapExercises.js';
import { chapterName } from '../../data/roadmap.js';
import { getChapterMeta, SUBJECT_META } from '../../data/curriculumDag.js';
import { findLessonsByChapter } from '../../data/dedicatedLessonsData.js';
import { saveSession, saveStageCheckpoint } from '../../lib/roadmapStore.js';
import { IconClose, IconPin, IconBulb } from '../Icons.jsx';
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
} from '../ui/AnimateDialog.jsx';

function buildMultiSubjectQuestions(topicIds = [], desiredCount = 12) {
  const fromChemBank = buildDiagnosticQuestions(topicIds, desiredCount);
  const picked = [];
  const seenIds = new Set();

  // Trích câu hỏi thực từ DEDICATED_LESSONS cho các chuyên đề Lý / Sinh (hoặc bổ sung nếu thiếu)
  (topicIds || []).forEach((tid) => {
    const meta = getChapterMeta(tid);
    const dedId = meta?.dedicatedChapterId || tid;
    const lessons = findLessonsByChapter(dedId);
    lessons.forEach((les) => {
      const pool = [...(les.sampleQuestions || []), ...(les.practiceQuestions || [])];
      pool.forEach((q, idx) => {
        if (!q || !Array.isArray(q.options) || q.options.length < 2) return;
        const qText = q.prompt || q.q || q.question;
        if (!qText) return;
        const qid = `dl-${tid}-${q.id || idx}`;
        if (seenIds.has(qid)) return;
        seenIds.add(qid);
        const correctIdx = Number.isInteger(q.correct) ? q.correct : 0;
        const rawLv = String(q.level || '').toLowerCase();
        const level = rawLv.includes('vận dụng') || rawLv === 'vd'
          ? 'vd'
          : (rawLv.includes('thông hiểu') || rawLv === 'th' ? 'th' : 'nb');
        picked.push({
          id: qid,
          topicId: tid,
          level,
          q: qText,
          options: q.options,
          correct: Math.min(q.options.length - 1, Math.max(0, correctIdx)),
          explain: q.solution || q.explain || '',
          tip: q.fastTip || q.trapAlert || '',
          tag: q.targetExam || '',
        });
      });
    });
  });

  // Ưu tiên câu thuộc đúng các topicIds được yêu cầu
  const topicSet = new Set(topicIds);
  const matchingChem = fromChemBank.filter((q) => topicSet.has(q.topicId));
  const combined = [...matchingChem, ...picked];
  if (combined.length >= desiredCount) return combined.slice(0, desiredCount);
  // Nếu vẫn chưa đủ số câu, bổ sung từ ngân hàng chuẩn
  fromChemBank.forEach((q) => {
    if (combined.length < desiredCount && !combined.some((x) => x.id === q.id)) {
      combined.push(q);
    }
  });
  return combined.slice(0, desiredCount);
}

export default function DiagnosticTestModal({
  open,
  uid,
  levelKey = 'Lớp 12',
  subjectKey = 'hoa',
  chapters = [],
  checkpointStage = null,
  onClose,
  onCompleted,
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]); // [{ q, chosen, ok }]
  const [finished, setFinished] = useState(false);
  const startedAtRef = useRef(Date.now());

  const isCheckpoint = Boolean(checkpointStage);
  const targetCount = isCheckpoint ? 8 : 12;
  const subMeta = SUBJECT_META[checkpointStage?.subjectKey || subjectKey] || SUBJECT_META.hoa;

  const topicIds = useMemo(() => {
    if (checkpointStage?.chapterIds?.length) return checkpointStage.chapterIds;
    return (chapters || []).map((c) => c.chapter?.id || c.id).filter(Boolean);
  }, [chapters, checkpointStage]);

  const questions = useMemo(() => {
    if (!open) return [];
    return buildMultiSubjectQuestions(topicIds, targetCount);
  }, [open, topicIds, targetCount]);

  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
    startedAtRef.current = Date.now();
  }, [open, checkpointStage?.id]);

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

    // Hoàn tất bài kiểm tra -> gom theo từng chương và lưu vào roadmapStore
    const byTopic = new Map();
    nextAnswers.forEach((item) => {
      const tId = item.q.topicId;
      if (!byTopic.has(tId)) byTopic.set(tId, []);
      byTopic.get(tId).push(item);
    });

    const elapsedSec = Math.max(30, Math.round((Date.now() - startedAtRef.current) / 1000));
    const secPerTopic = Math.max(10, Math.round(elapsedSec / Math.max(1, byTopic.size)));
    const totalCorrect = nextAnswers.filter((a) => a.ok).length;
    const scorePct = Math.round((totalCorrect / Math.max(1, nextAnswers.length)) * 100);

    if (isCheckpoint && checkpointStage) {
      const passed = scorePct >= 85;
      saveStageCheckpoint(uid, {
        stageId: checkpointStage.id,
        subjectKey: checkpointStage.subjectKey || subjectKey,
        scorePct,
        passed,
        chapterIds: checkpointStage.chapterIds || topicIds,
      });
    }

    if (uid) {
      byTopic.forEach((list, tId) => {
        const correctCount = list.filter((x) => x.ok).length;
        saveSession(uid, {
          topicId: tId,
          total: list.length,
          correct: correctCount,
          durationMs: secPerTopic * 1000,
          source: isCheckpoint ? 'checkpoint' : 'practice',
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

  const totalQ = questions.length || targetCount;
  const correctTotal = answers.filter((a) => a.ok).length;
  const scorePct = Math.round((correctTotal / Math.max(1, totalQ)) * 100);
  const checkpointPassed = isCheckpoint && scorePct >= 85;
  const estimatedScore10 = Math.round((correctTotal / Math.max(1, totalQ)) * 10 * 4) / 4;
  const progressPct = Math.round(((stepIdx + (picked !== null ? 1 : 0)) / Math.max(1, totalQ)) * 100);

  return (
    <DialogRoot open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          from="top"
          size="lg"
          className="ns9-diag-animate-popup"
          aria-label={isCheckpoint ? `Checkpoint ${checkpointStage.title}` : `Bài đánh giá năng lực môn ${subMeta.name}`}
        >
          <div className="rm-sheet ns9-centered-sheet ns9-diag-modal" style={{ maxWidth: '100%', margin: 0, boxShadow: 'none' }}>
            <div className="rm-sheet-grip" aria-hidden="true" />

            <header className="rm-sheet-head ns9-sheet-head">
          <div className="ns9-sheet-title-wrap">
            <div className="ns9-sheet-eyebrow">
              <span className="ns9-ch-pill">
                {isCheckpoint
                  ? `CHECKPOINT NHẢY CÓC ${checkpointStage.code || ''} · ${subMeta.name.toUpperCase()} (ĐẠT ≥ 85%)`
                  : `ĐÁNH GIÁ NĂNG LỰC · ${subMeta.name.toUpperCase()} · ${String(levelKey).toUpperCase()}`}
              </span>
            </div>
            <h2>
              {finished
                ? (isCheckpoint
                  ? (checkpointPassed
                    ? `Vượt Checkpoint thành công (${scorePct}% · Mở khóa chặng!)`
                    : `Đạt ${scorePct}% (${correctTotal}/${totalQ} câu) — Cần ≥ 85% để nhảy cóc`)
                  : `Kết quả: ${correctTotal}/${totalQ} câu đúng (${estimatedScore10}/10 điểm)`)
                : `Câu ${stepIdx + 1}/${totalQ} · ${chapterName(currentQ?.topicId) || subMeta.name}`}
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
                <span>
                  {isCheckpoint
                    ? (checkpointPassed ? `Chứng nhận vượt ${checkpointStage.code}` : `Điểm Checkpoint ${checkpointStage.code}`)
                    : `Điểm ${subMeta.name} khởi điểm của bạn`}
                </span>
                <strong>{isCheckpoint ? `${scorePct}% (${correctTotal}/${totalQ})` : `${estimatedScore10} / 10 điểm`}</strong>
              </div>
              <p>
                {isCheckpoint
                  ? (checkpointPassed
                    ? `Xuất sắc! Hệ thống đã đánh dấu hoàn thành toàn bộ chặng "${checkpointStage.title}" để bạn tiến thẳng lên chặng tiếp theo.`
                    : `Hệ thống đã lưu kết quả và đánh dấu đúng các chuyên đề còn hổng trong "${checkpointStage.title}" để bạn ôn nhanh rồi thử lại.`)
                  : `Hệ thống đã cập nhật điểm dự đoán 3 phần đề thi ${subMeta.name} (I · II · III) và đẩy các chuyên đề còn yếu lên đầu danh sách ưu tiên!`}
              </p>
            </div>

            <h4>Chi tiết {totalQ} câu vừa làm</h4>
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
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
