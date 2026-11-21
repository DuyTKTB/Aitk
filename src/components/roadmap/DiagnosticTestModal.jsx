/* ============================================================================
   DiagnosticTestModal.jsx — PHÒNG ĐÁNH GIÁ NĂNG LỰC THÍCH ỨNG (STUDIO PRO 2026)
   ----------------------------------------------------------------------------
   • Khắc phục triệt để lỗi rút câu hỏi tuần tự 1 chương & lỗi trộn nhầm môn Hóa:
     - Rút phân tầng xoay vòng (Stratified Round-Robin) qua 100% chuyên đề của môn
     - Trộn ngẫu nhiên 4 đáp án (shuffleOptions) cho cả câu hỏi SGK & DEDICATED_LESSONS
     - Cho phép chọn quy mô đề: 15 câu (Nhanh) · 25 câu (Chuẩn ĐH) · 40 câu (Toàn diện)
     - Cho phép chọn trọng tâm: Cân bằng (NB→TH→VD) · Nền tảng (NB–TH) · Thực chiến 8+ (TH–VD)
   • Giao diện Phòng thi số hiện đại:
     - Bản đồ câu hỏi 1..N nhảy câu tự do, xem lại câu trước, đồng hồ bấm giờ, chuỗi đúng
     - Render công thức LaTeX/KaTeX chuẩn qua <MathText />
     - Báo cáo chẩn đoán đa chiều: Điểm hệ 10, Thống kê 3 cấp độ NB/TH/VD & Bản đồ lỗ hổng từng chương
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  builtinQuestions,
  LEVEL_META,
  shuffleOptions,
} from '../../data/roadmapExercises.js';
import { chapterName } from '../../data/roadmap.js';
import {
  CURRICULUM_NODES,
  getChapterMeta,
  SUBJECT_META,
} from '../../data/curriculumDag.js';
import { findLessonsByChapter } from '../../data/dedicatedLessonsData.js';
import { saveSession, saveStageCheckpoint } from '../../lib/roadmapStore.js';
import { IconClose, IconPin, IconBulb } from '../Icons.jsx';
import MathText from '../MathText.jsx';
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
} from '../ui/AnimateDialog.jsx';
import '../../styles/diagnostic-studio-pro.css';

function cleanStem(text) {
  if (!text) return '';
  return String(text)
    .replace(
      /^\[(?:Trọng tâm SGK mới|Thông hiểu\s*[–-]\s*ĐGNL|Phân tích bản chất|Vận dụng\s*[–-]\s*Đề chuẩn THPTQG)\]\s*/i,
      ''
    )
    .trim();
}

/**
 * Rút bộ đề Đánh giá năng lực phân tầng xoay vòng (Stratified Round-Robin)
 * - Tuyệt đối chỉ lấy câu hỏi thuộc đúng môn học (không bao giờ trộn Hóa sang Lý/Sinh)
 * - Rải đều qua tất cả các chương trong topicIds và xoay vòng cấp độ NB -> TH -> VD
 */
export function buildStratifiedDiagnosticQuestions(
  topicIds = [],
  desiredCount = 25,
  { subjectKey = 'hoa', focusMode = 'balanced' } = {}
) {
  const subjectNodes = CURRICULUM_NODES.filter((n) => n.subject === subjectKey);
  const subjectIdSet = new Set(subjectNodes.map((n) => n.id));

  // Chỉ giữ lại các topicId thuộc đúng môn học; nếu rỗng thì lấy toàn bộ chuyên đề của môn đó
  let validTopics = (topicIds || []).filter((id) => subjectIdSet.has(id));
  if (validTopics.length === 0) {
    validTopics = subjectNodes.map((n) => n.id);
  }

  // Gom kho câu hỏi theo từng chương (kết hợp builtinQuestions + DEDICATED_LESSONS đã trộn đáp án)
  const buckets = new Map();
  validTopics.forEach((tid) => {
    const meta = getChapterMeta(tid);
    const pool = [];
    const seenTexts = new Set();

    // 1. Nguồn chuẩn biên soạn trong roadmapExercises (đã có đủ 49/49 chương)
    const builtinList = builtinQuestions(tid, { level: 'all' });
    builtinList.forEach((q) => {
      const stem = cleanStem(q.q);
      if (!stem || seenTexts.has(stem)) return;
      seenTexts.add(stem);
      pool.push({
        ...q,
        q: stem,
        topicId: tid,
      });
    });

    // 2. Nguồn bài học chuyên sâu DEDICATED_LESSONS (trộn đáp án bằng shuffleOptions)
    const dedId = meta?.dedicatedChapterId || tid;
    const lessons = findLessonsByChapter(dedId);
    lessons.forEach((les) => {
      const rawQs = [...(les.sampleQuestions || []), ...(les.practiceQuestions || [])];
      rawQs.forEach((q, idx) => {
        if (!q || !Array.isArray(q.options) || q.options.length < 2) return;
        const stem = cleanStem(q.prompt || q.q || q.question);
        if (!stem || seenTexts.has(stem)) return;
        seenTexts.add(stem);
        const correctIdx = Number.isInteger(q.correct)
          ? Math.min(q.options.length - 1, Math.max(0, q.correct))
          : 0;
        const rawLv = String(q.level || '').toLowerCase();
        const level =
          rawLv.includes('vận dụng') || rawLv === 'vd'
            ? 'vd'
            : rawLv.includes('thông hiểu') || rawLv === 'th'
              ? 'th'
              : 'nb';
        const normalized = shuffleOptions({
          id: `dl-${tid}-${q.id || idx}`,
          topicId: tid,
          level,
          q: stem,
          options: q.options.slice(0, 4),
          correct: correctIdx,
          explain: q.solution || q.explain || '',
          tip: q.fastTip || q.trapAlert || '',
          tag: q.targetExam || meta?.title || '',
        });
        pool.push(normalized);
      });
    });

    if (pool.length > 0) {
      buckets.set(tid, pool);
    }
  });

  const activeTopics = Array.from(buckets.keys());
  if (activeTopics.length === 0) return [];

  const levelCycle =
    focusMode === 'foundation'
      ? ['nb', 'nb', 'th']
      : focusMode === 'advanced'
        ? ['th', 'vd', 'vd']
        : ['nb', 'th', 'vd'];

  const picked = [];
  const usedIds = new Set();
  let pass = 0;

  while (picked.length < desiredCount && pass < 24) {
    const targetLv = levelCycle[pass % levelCycle.length];
    let addedInPass = 0;

    for (let i = 0; i < activeTopics.length && picked.length < desiredCount; i += 1) {
      const tid = activeTopics[i];
      const pool = buckets.get(tid) || [];
      // Ưu tiên đúng cấp độ ở các vòng đầu; từ vòng 6 trở đi lấy bất kỳ câu chưa dùng của chương đó
      const candidate =
        pool.find((q) => !usedIds.has(q.id) && q.level === targetLv) ||
        (pass >= 5 ? pool.find((q) => !usedIds.has(q.id)) : null);

      if (candidate) {
        usedIds.add(candidate.id);
        picked.push(candidate);
        addedInPass += 1;
      }
    }

    if (addedInPass === 0 && pass >= 6) break;
    pass += 1;
  }

  return picked;
}

const MASCOT_BY_SUBJ = {
  hoa: '/img/elec/elec-think.png',
  ly: '/img/elec/elec-fighting.png',
  sinh: '/img/elec/elec-happy.png',
};

export default function DiagnosticTestModal({
  open,
  uid,
  levelKey = 'Trọn bộ THPT',
  subjectKey = 'hoa',
  chapters = [],
  checkpointStage = null,
  onClose,
  onCompleted,
}) {
  const isCheckpoint = Boolean(checkpointStage);
  const effSubject = checkpointStage?.subjectKey || subjectKey || 'hoa';
  const subMeta = SUBJECT_META[effSubject] || SUBJECT_META.hoa;

  const [desiredCount, setDesiredCount] = useState(isCheckpoint ? 12 : 25);
  const [focusMode, setFocusMode] = useState('balanced'); // 'balanced' | 'foundation' | 'advanced'
  const [stepIdx, setStepIdx] = useState(0);
  // Map lưu đáp án đã chọn theo index câu: { [idx]: chosenOptionIdx }
  const [pickedMap, setPickedMap] = useState({});
  const [finished, setFinished] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'wrong'
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizSeed, setQuizSeed] = useState(0);
  const startedAtRef = useRef(Date.now());

  const topicIds = useMemo(() => {
    if (checkpointStage?.chapterIds?.length) return checkpointStage.chapterIds;
    return (chapters || []).map((c) => c.chapter?.id || c.id).filter(Boolean);
  }, [chapters, checkpointStage]);

  useEffect(() => {
    if (!open) return;
    setDesiredCount(isCheckpoint ? 12 : 25);
    setStepIdx(0);
    setPickedMap({});
    setFinished(false);
    setReviewFilter('all');
    setElapsedSec(0);
    startedAtRef.current = Date.now();
  }, [open, isCheckpoint, checkpointStage?.id, effSubject]);

  // Đồng hồ bấm giờ thời gian thực
  useEffect(() => {
    if (!open || finished) return undefined;
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [open, finished]);

  const questions = useMemo(() => {
    if (!open) return [];
    return buildStratifiedDiagnosticQuestions(topicIds, desiredCount, {
      subjectKey: effSubject,
      focusMode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicIds, desiredCount, effSubject, focusMode, quizSeed]);

  const totalQ = questions.length;
  const currentQ = questions[stepIdx] || null;
  const currentPicked = pickedMap[stepIdx] !== undefined ? pickedMap[stepIdx] : null;
  const answeredCount = Object.keys(pickedMap).length;

  // Chuỗi trả lời đúng liên tiếp
  const currentStreak = useMemo(() => {
    let s = 0;
    for (let i = stepIdx; i >= 0; i -= 1) {
      if (pickedMap[i] === undefined) continue;
      if (questions[i] && pickedMap[i] === questions[i].correct) s += 1;
      else break;
    }
    return s;
  }, [pickedMap, questions, stepIdx]);

  const changeScaleOrMode = (nextCount, nextMode) => {
    setDesiredCount(nextCount);
    setFocusMode(nextMode);
    setStepIdx(0);
    setPickedMap({});
    setFinished(false);
    startedAtRef.current = Date.now();
    setQuizSeed((s) => s + 1);
  };

  const handlePickOption = (optIdx) => {
    if (currentPicked !== null || !currentQ) return;
    setPickedMap((prev) => ({ ...prev, [stepIdx]: optIdx }));
  };

  const finishAssessment = (finalMap = pickedMap) => {
    const answerList = questions
      .map((q, idx) => {
        const chosen = finalMap[idx];
        if (chosen === undefined) return null;
        return { q, chosen, ok: chosen === q.correct };
      })
      .filter(Boolean);

    const byTopic = new Map();
    answerList.forEach((item) => {
      const tId = item.q.topicId;
      if (!byTopic.has(tId)) byTopic.set(tId, []);
      byTopic.get(tId).push(item);
    });

    const totalSec = Math.max(30, Math.round((Date.now() - startedAtRef.current) / 1000));
    const secPerTopic = Math.max(10, Math.round(totalSec / Math.max(1, byTopic.size)));
    const totalCorrect = answerList.filter((a) => a.ok).length;
    const scorePct = Math.round((totalCorrect / Math.max(1, questions.length)) * 100);

    if (isCheckpoint && checkpointStage) {
      const passed = scorePct >= 85;
      saveStageCheckpoint(uid, {
        stageId: checkpointStage.id,
        subjectKey: effSubject,
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

  const handleNext = () => {
    if (stepIdx + 1 < totalQ) {
      setStepIdx(stepIdx + 1);
      return;
    }
    finishAssessment(pickedMap);
  };

  useEffect(() => {
    if (!open || finished) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (!currentQ) return;
      if (currentPicked === null) {
        const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
        const k = map[String(e.key).toLowerCase()];
        if (k !== undefined && k < currentQ.options.length) {
          e.preventDefault();
          handlePickOption(k);
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && stepIdx > 0) {
        e.preventDefault();
        setStepIdx(stepIdx - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!open) return null;

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Tổng hợp số liệu báo cáo khi hoàn thành
  const answersList = questions.map((q, idx) => ({
    q,
    chosen: pickedMap[idx] ?? -1,
    ok: pickedMap[idx] === q.correct,
  }));
  const correctTotal = answersList.filter((a) => a.ok).length;
  const scorePct = Math.round((correctTotal / Math.max(1, totalQ)) * 100);
  const checkpointPassed = isCheckpoint && scorePct >= 85;
  const estimatedScore10 = (Math.round((correctTotal / Math.max(1, totalQ)) * 10 * 20) / 20).toFixed(2);

  // Thống kê theo 3 cấp độ nhận thức
  const tierStats = ['nb', 'th', 'vd'].map((lv) => {
    const items = answersList.filter((a) => a.q.level === lv);
    const ok = items.filter((a) => a.ok).length;
    return {
      lv,
      label: LEVEL_META[lv]?.label || lv,
      total: items.length,
      ok,
      pct: items.length ? Math.round((ok / items.length) * 100) : 0,
    };
  });

  // Thống kê theo từng chương (sắp xếp từ yếu nhất → mạnh nhất để học sinh biết lỗ hổng cần vá)
  const chapterBreakdown = (() => {
    const map = new Map();
    answersList.forEach((a) => {
      const tid = a.q.topicId;
      if (!map.has(tid)) map.set(tid, { tid, name: chapterName(tid) || getChapterMeta(tid)?.title || tid, total: 0, ok: 0 });
      const rec = map.get(tid);
      rec.total += 1;
      if (a.ok) rec.ok += 1;
    });
    return Array.from(map.values())
      .map((r) => ({ ...r, pct: Math.round((r.ok / Math.max(1, r.total)) * 100) }))
      .sort((a, b) => a.pct - b.pct);
  })();

  const filteredReview = reviewFilter === 'wrong' ? answersList.filter((a) => !a.ok) : answersList;

  return (
    <DialogRoot open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          from="top"
          size="lg"
          className="ns9-diag-animate-popup"
          aria-label={isCheckpoint ? `Checkpoint ${checkpointStage.title}` : `Đánh giá năng lực môn ${subMeta.name}`}
        >
          <div className={`dsp-modal tone-${effSubject}`}>
            {/* HEADER STUDIO PRO */}
            <header className="dsp-head">
              <div className="dsp-head-top">
                <div className="dsp-brand-row">
                  <img
                    src={MASCOT_BY_SUBJ[effSubject] || MASCOT_BY_SUBJ.hoa}
                    alt="Bé Elec Khảo Thí"
                    className="dsp-mascot"
                    width="46"
                    height="46"
                  />
                  <div>
                    <div className="dsp-eyebrow">
                      <span className="dsp-pill-subj">
                        {isCheckpoint
                          ? `CHECKPOINT ${checkpointStage.code || ''} · ${subMeta.name} (ĐẠT ≥ 85%)`
                          : `ĐÁNH GIÁ NĂNG LỰC · ${subMeta.name.toUpperCase()} · ${String(levelKey).toUpperCase()}`}
                      </span>
                      <span className="dsp-pill-stat">⏱ {formatTimer(elapsedSec)}</span>
                      <span className="dsp-pill-stat">Đã làm {answeredCount}/{totalQ}</span>
                      {currentStreak >= 2 && !finished && (
                        <span className="dsp-pill-streak">Chuỗi đúng {currentStreak}x</span>
                      )}
                    </div>
                    <h2 className="dsp-title">
                      {finished
                        ? isCheckpoint
                          ? checkpointPassed
                            ? `Vượt Checkpoint thành công (${scorePct}% · Mở khóa chặng!)`
                            : `Đạt ${scorePct}% (${correctTotal}/${totalQ} câu) — Cần ≥ 85% để nhảy cóc`
                          : `Báo cáo Năng lực ${subMeta.name}: ${correctTotal}/${totalQ} câu đúng (${estimatedScore10}/10 điểm)`
                        : `Câu ${stepIdx + 1}/${totalQ} · ${chapterName(currentQ?.topicId) || getChapterMeta(currentQ?.topicId)?.title || subMeta.name}`}
                    </h2>
                  </div>
                </div>

                <button type="button" className="dsp-close" onClick={onClose} aria-label="Đóng">
                  <IconClose size={18} />
                </button>
              </div>

              {/* Thanh chọn quy mô đề (15 / 25 / 40 câu) & Trọng tâm phân hóa */}
              {!finished && !isCheckpoint && (
                <div className="dsp-toolbar">
                  <div className="dsp-seg-group" role="group" aria-label="Chọn số lượng câu hỏi">
                    <span className="dsp-seg-lbl">QUY MÔ ĐỀ:</span>
                    {[
                      [15, '15 câu (Nhanh)'],
                      [25, '25 câu (Chuẩn ĐH)'],
                      [40, '40 câu (Toàn diện)'],
                    ].map(([cnt, lbl]) => (
                      <button
                        key={cnt}
                        type="button"
                        className={`dsp-seg-btn${desiredCount === cnt ? ' is-on' : ''}`}
                        onClick={() => changeScaleOrMode(cnt, focusMode)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  <div className="dsp-seg-group" role="group" aria-label="Chọn chế độ phân hóa">
                    <span className="dsp-seg-lbl">MỨC ĐỘ:</span>
                    {[
                      ['balanced', 'Phân tầng chuẩn'],
                      ['foundation', 'Củng cố gốc'],
                      ['advanced', 'Thực chiến 8+'],
                    ].map(([mKey, mLbl]) => (
                      <button
                        key={mKey}
                        type="button"
                        className={`dsp-seg-btn${focusMode === mKey ? ' is-on' : ''}`}
                        onClick={() => changeScaleOrMode(desiredCount, mKey)}
                      >
                        {mLbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bản đồ câu hỏi tương tác 1..N (Nhảy câu tự do) */}
              {!finished && totalQ > 0 && (
                <div className="dsp-palette" role="navigation" aria-label="Bản đồ câu hỏi">
                  {questions.map((q, idx) => {
                    const ans = pickedMap[idx];
                    const isCur = idx === stepIdx;
                    let cls = 'dsp-qdot';
                    if (isCur) cls += ' is-current';
                    else if (ans !== undefined) cls += ans === q.correct ? ' is-ok' : ' is-bad';
                    return (
                      <button
                        key={q.id || idx}
                        type="button"
                        className={cls}
                        onClick={() => setStepIdx(idx)}
                        title={`Câu ${idx + 1}: ${chapterName(q.topicId) || subMeta.name}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </header>

            {/* KHÔNG GIAN LÀM BÀI */}
            {!finished && currentQ && (
              <div className="dsp-body">
                <div className="dsp-qmeta-bar">
                  <div className="dsp-qmeta-left">
                    <span
                      className="dsp-ch-badge"
                      style={{
                        background: 'rgba(47, 107, 255, 0.12)',
                        color: '#1d4ed8',
                        fontFamily: 'var(--mono, monospace)',
                        fontWeight: 800,
                      }}
                      title="Mã định danh câu hỏi toàn cục ELEC ID (Bấm để sao chép mã tra cứu)"
                    >
                      ID: {String(currentQ.id || `${effSubject}-${stepIdx + 1}`).toUpperCase()}
                    </span>
                    <span className="dsp-ch-badge">
                      {chapterName(currentQ.topicId) || getChapterMeta(currentQ.topicId)?.title || subMeta.name}
                    </span>
                    {currentQ.level && LEVEL_META[currentQ.level] && (
                      <span className={`dsp-lv-badge lv-${currentQ.level}`}>
                        Mức độ: {LEVEL_META[currentQ.level].label}
                      </span>
                    )}
                    {currentQ.tag && (
                      <span className="dsp-skill-tag">
                        <IconPin size={12} /> {currentQ.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Khung câu hỏi hỗ trợ đầy đủ công thức KaTeX */}
                <div className="dsp-qbox">
                  <div className="dsp-qtext">
                    <MathText>{currentQ.q}</MathText>
                  </div>
                </div>

                {/* 4 Phương án A/B/C/D */}
                <div className="dsp-options">
                  {currentQ.options.map((opt, idx) => {
                    const isPicked = currentPicked === idx;
                    const isRight = idx === currentQ.correct;
                    let cls = 'dsp-opt';
                    if (currentPicked !== null) {
                      if (isRight) cls += ' is-correct';
                      else if (isPicked) cls += ' is-wrong';
                    }
                    return (
                      <button
                        key={idx}
                        type="button"
                        className={cls}
                        disabled={currentPicked !== null}
                        onClick={() => handlePickOption(idx)}
                      >
                        <span className="dsp-opt-key">{String.fromCharCode(65 + idx)}</span>
                        <span className="dsp-opt-txt">
                          <MathText>{opt}</MathText>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Lời giải sư phạm & Mẹo tránh bẫy tức thì */}
                {currentPicked !== null && (
                  <div className={`dsp-solution ${currentPicked === currentQ.correct ? 'is-ok' : 'is-bad'}`}>
                    <div className="dsp-sol-head">
                      <b>
                        {currentPicked === currentQ.correct
                          ? '✓ Chính xác! Bạn nắm rất chắc bản chất phần này'
                          : `✕ Chưa đúng — Đáp án đúng là ${String.fromCharCode(65 + currentQ.correct)}`}
                      </b>
                    </div>
                    {currentQ.explain && (
                      <div className="dsp-sol-steps">
                        {String(currentQ.explain)
                          .split(/\n|(?=• )/)
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((step, sIdx) => (
                            <p key={sIdx}>
                              <MathText>{step}</MathText>
                            </p>
                          ))}
                      </div>
                    )}
                    {currentQ.tip && (
                      <div className="dsp-sol-tip">
                        <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <IconBulb size={14} /> Mẹo giải nhanh &amp; Bẫy cần tránh:
                        </b>{' '}
                        <MathText>{currentQ.tip}</MathText>
                      </div>
                    )}
                  </div>
                )}

                <footer className="dsp-foot">
                  <span className="dsp-foot-hint">
                    Phím tắt: A/B/C/D để chọn đáp án · ← / → hoặc Enter để chuyển câu
                  </span>
                  <div className="dsp-foot-actions">
                    <button
                      type="button"
                      className="dsp-btn"
                      disabled={stepIdx === 0}
                      onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
                    >
                      ← Câu trước
                    </button>
                    {answeredCount >= Math.min(5, totalQ) && stepIdx + 1 < totalQ && (
                      <button
                        type="button"
                        className="dsp-btn"
                        onClick={() => finishAssessment(pickedMap)}
                        title="Nộp bài sớm với các câu đã làm"
                      >
                        Nộp bài ({answeredCount}/{totalQ})
                      </button>
                    )}
                    <button
                      type="button"
                      className="dsp-btn dsp-btn-primary"
                      disabled={currentPicked === null}
                      onClick={handleNext}
                    >
                      {stepIdx + 1 < totalQ ? 'Câu tiếp theo →' : 'Hoàn thành & Xem Báo cáo →'}
                    </button>
                  </div>
                </footer>
              </div>
            )}

            {/* BÁO CÁO CHẨN ĐOÁN ĐA CHIỀU KHI HOÀN THÀNH */}
            {finished && (
              <div className="dsp-body">
                <div className="dsp-report-hero">
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dsp-muted)', textTransform: 'uppercase' }}>
                      {isCheckpoint ? `Kết quả Checkpoint ${checkpointStage.code}` : `Điểm năng lực ${subMeta.name} quy đổi`}
                    </div>
                    <div className="dsp-score-big">
                      {isCheckpoint ? `${scorePct}% (${correctTotal}/${totalQ})` : `${estimatedScore10} / 10 điểm`}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--dsp-muted)', maxWidth: 560 }}>
                      {isCheckpoint
                        ? checkpointPassed
                          ? `Xuất sắc! Hệ thống đã mở khóa toàn bộ chặng "${checkpointStage.title}".`
                          : `Hệ thống đã lưu kết quả và đánh dấu các chuyên đề cần ôn thêm trong "${checkpointStage.title}".`
                        : `Đã khảo sát ${chapterBreakdown.length} chuyên đề trong ${formatTimer(elapsedSec)} — hệ thống đã tự động cập nhật Điểm dự đoán & đẩy các chương còn yếu lên đầu Lộ trình!`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="dsp-btn"
                    onClick={() => changeScaleOrMode(desiredCount, focusMode)}
                  >
                    Làm đề mới ({desiredCount} câu)
                  </button>
                </div>

                {/* Thống kê theo 3 cấp độ Nhận biết / Thông hiểu / Vận dụng */}
                <div className="dsp-tier-grid">
                  {tierStats.map((t) => (
                    <div key={t.lv} className="dsp-tier-card">
                      <span>Cấp độ {t.label}</span>
                      <b>
                        {t.ok}/{t.total} câu ({t.pct}%)
                      </b>
                    </div>
                  ))}
                </div>

                {/* Bản đồ độ vững theo từng Chuyên đề (từ yếu nhất -> vững nhất) */}
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800 }}>
                    Chẩn đoán độ vững theo từng chuyên đề ({chapterBreakdown.length} chuyên đề)
                  </h4>
                  <div className="dsp-ch-bars">
                    {chapterBreakdown.map((ch) => {
                      const barColor = ch.pct >= 75 ? '#10b981' : ch.pct >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <div key={ch.tid} className="dsp-ch-bar-item">
                          <div className="dsp-ch-bar-top">
                            <span>{ch.name}</span>
                            <span style={{ color: barColor }}>
                              {ch.ok}/{ch.total} ({ch.pct}%)
                            </span>
                          </div>
                          <div className="dsp-ch-track">
                            <div className="dsp-ch-fill" style={{ width: `${ch.pct}%`, background: barColor }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Danh sách rà soát câu hỏi */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>
                      Chi tiết đáp án &amp; lời giải ({filteredReview.length} câu)
                    </h4>
                    <div className="dsp-seg-group">
                      <button
                        type="button"
                        className={`dsp-seg-btn${reviewFilter === 'all' ? ' is-on' : ''}`}
                        onClick={() => setReviewFilter('all')}
                      >
                        Tất cả ({answersList.length})
                      </button>
                      <button
                        type="button"
                        className={`dsp-seg-btn${reviewFilter === 'wrong' ? ' is-on' : ''}`}
                        onClick={() => setReviewFilter('wrong')}
                      >
                        Câu cần ôn lại ({answersList.filter((a) => !a.ok).length})
                      </button>
                    </div>
                  </div>

                  <ul className="rm-done-list">
                    {filteredReview.map((item, i) => (
                      <li key={item.q.id || i} className={item.ok ? 'ok' : 'bad'}>
                        <div className="rm-done-q">
                          <b>
                            Câu ({chapterName(item.q.topicId) || getChapterMeta(item.q.topicId)?.title || subMeta.name}):
                          </b>{' '}
                          <MathText>{item.q.q}</MathText>
                        </div>
                        <div className="rm-done-ans">
                          <span className={item.ok ? 'correct' : 'picked'}>
                            Bạn chọn:{' '}
                            {item.chosen >= 0 ? (
                              <MathText>{item.q.options[item.chosen]}</MathText>
                            ) : (
                              'Chưa chọn'
                            )}
                          </span>
                          {!item.ok && (
                            <span className="correct">
                              {' '}
                              · Đáp án đúng: <MathText>{item.q.options[item.q.correct]}</MathText>
                            </span>
                          )}
                        </div>
                        {item.q.explain && (
                          <div className="rm-done-expl" style={{ marginTop: 4 }}>
                            <IconBulb size={13} /> <MathText>{item.q.explain}</MathText>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <footer className="dsp-foot">
                  <span className="dsp-foot-hint">
                    Toàn bộ câu làm sai đã được đồng bộ vào lộ trình ưu tiên của bạn.
                  </span>
                  <button type="button" className="dsp-btn dsp-btn-primary" onClick={onClose}>
                    Vào Lộ trình học cá nhân hóa ngay →
                  </button>
                </footer>
              </div>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
