/* ============================================================================
   DiagnosticTestModal.jsx — PHÒNG ĐÁNH GIÁ NĂNG LỰC THÍCH ỨNG (STUDIO PRO v4)
   ----------------------------------------------------------------------------
   Kiến trúc Khảo thí Chuyên sâu 3 Giai đoạn (Bluebook / Grade.vn / Azota Pro):
     • Giai đoạn 1 (BRIEFING & BẢNG ĐẶC TẢ MA TRẬN ĐỀ):
       - Bộ lọc Khối lớp (Tất cả 10-11-12 · Trọng tâm Lớp 12 · Lớp 11 · Lớp 10).
       - Chọn Quy mô đề (15 / 25 / 40 câu), Trọng tâm phân hóa (Chuẩn BGD / Gốc / 8.5+),
         Chế độ làm bài (Gia sư tức thì / Phòng thi thực chiến).
       - Bảng Ma trận Đặc tả 6 cột (Khối · Chuyên đề · NB · TH · VD · Tổng & Tỷ trọng %).
     • Giai đoạn 2 (TESTING — Phòng thi 2 cột + Công cụ Bluebook):
       - Bộ đếm thời gian suy nghĩ từng câu (giây/câu) + Tổng thời gian.
       - Công cụ "Gạch loại trừ phương án nhiễu" (Cross-out A/B/C/D kiểu SAT Bluebook).
       - Hồ sơ Sư phạm 3 tầng sau mỗi câu:
         (1) Lời giải chi tiết từng bước
         (2) Tóm tắt Lý thuyết cốt lõi SGK GDPT 2018 của chương đó
         (3) Cảnh báo các Bẫy kinh điển học sinh hay sai nhất + Nút Hỏi sâu Bé Elec AI.
     • Giai đoạn 3 (REPORT — Báo cáo Chẩn đoán & Phác đồ Cá nhân hóa 3 Chặng):
       - 4 KPI + Dự báo khoảng điểm thi THPTQG & Phân tích theo từng Khối lớp (10/11/12).
       - Phác đồ Ôn tập 3 Chặng (Khẩn cấp 48h · Tăng tốc tuần này · Duy trì 8.5+)
         kèm tóm tắt kiến thức gốc cần bù ngay cho từng chương yếu.
       - Rà soát từng câu kèm thời gian làm mỗi câu, phương án đã chọn & hỏi AI.
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  builtinQuestions,
  chapterGuide,
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
import { askAI } from '../HomePlus.jsx';
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
 * - Tuyệt đối chỉ lấy câu hỏi thuộc đúng môn học
 * - Hỗ trợ lọc theo khối lớp (gradeFilter: 'all' | 10 | 11 | 12)
 */
export function buildStratifiedDiagnosticQuestions(
  topicIds = [],
  desiredCount = 25,
  { subjectKey = 'hoa', focusMode = 'balanced', gradeFilter = 'all' } = {}
) {
  const subjectNodes = CURRICULUM_NODES.filter((n) => n.subject === subjectKey);
  const subjectIdSet = new Set(subjectNodes.map((n) => n.id));

  let validTopics = (topicIds || []).filter((id) => subjectIdSet.has(id));
  if (validTopics.length === 0) {
    validTopics = subjectNodes.map((n) => n.id);
  }

  if (gradeFilter !== 'all') {
    const targetGrade = Number(gradeFilter);
    const gradeFiltered = validTopics.filter((tid) => {
      const meta = getChapterMeta(tid);
      return Number(meta?.grade) === targetGrade;
    });
    if (gradeFiltered.length > 0) {
      validTopics = gradeFiltered;
    }
  }

  const buckets = new Map();
  validTopics.forEach((tid) => {
    const meta = getChapterMeta(tid);
    const guide = chapterGuide(tid);
    const defaultTip = guide?.mistakes?.[0] || guide?.points?.[0] || '';
    const pool = [];
    const seenTexts = new Set();

    // 1. Nguồn chuẩn biên soạn trong roadmapExercises (đủ 49/49 chương)
    const builtinList = builtinQuestions(tid, { level: 'all' });
    builtinList.forEach((q) => {
      const stem = cleanStem(q.q);
      if (!stem || seenTexts.has(stem)) return;
      seenTexts.add(stem);
      pool.push({
        ...q,
        q: stem,
        topicId: tid,
        grade: meta?.grade || 12,
        tip: q.tip || defaultTip,
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
          grade: meta?.grade || 12,
          level,
          q: stem,
          options: q.options.slice(0, 4),
          correct: correctIdx,
          explain: q.solution || q.explain || '',
          tip: q.fastTip || q.trapAlert || defaultTip,
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

  while (picked.length < desiredCount && pass < 28) {
    const targetLv = levelCycle[pass % levelCycle.length];
    let addedInPass = 0;

    for (let i = 0; i < activeTopics.length && picked.length < desiredCount; i += 1) {
      const tid = activeTopics[i];
      const pool = buckets.get(tid) || [];
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

const GRADE_FILTERS = [
  { key: 'all', label: 'Trọn bộ THPT (Lớp 10 · 11 · 12)', sub: 'Rải đều toàn bộ chương trình' },
  { key: '12', label: 'Trọng tâm Lớp 12 (Thi THPTQG)', sub: 'Chiếm 70–80% cấu trúc đề thi' },
  { key: '11', label: 'Chuyên đề Lớp 11 (Nền tảng)', sub: 'Phần câu hỏi phân hóa liên thông' },
  { key: '10', label: 'Chuyên đề Lớp 10 (Kiến thức gốc)', sub: 'Củng cố gốc bản chất KHTN' },
];

const SCALE_OPTIONS = [
  {
    count: 15,
    title: '15 câu · Khảo sát nhanh',
    durationText: '~12 phút',
    desc: 'Kiểm tra nhanh phản xạ các chuyên đề cốt lõi trước giờ học.',
  },
  {
    count: 25,
    title: '25 câu · Chuẩn Đánh giá ĐH',
    durationText: '~20 phút',
    desc: 'Độ phủ rộng khắp các chương, đo chính xác điểm dự đoán thang 10.',
  },
  {
    count: 40,
    title: '40 câu · Toàn diện THPT',
    durationText: '~35 phút',
    desc: 'Quét sâu toàn bộ lỗ hổng kiến thức và độ bền tâm lý phòng thi.',
  },
];

const FOCUS_OPTIONS = [
  {
    key: 'balanced',
    title: 'Ma trận Phân tầng chuẩn',
    ratioText: '40% NB · 35% TH · 25% VD',
    desc: 'Cân bằng 3 mức độ nhận thức theo đúng ma trận đề thi THPT Quốc gia.',
  },
  {
    key: 'foundation',
    title: 'Củng cố Nền tảng SGK',
    ratioText: '65% NB · 35% TH',
    desc: 'Tập trung rà soát khái niệm, công thức gốc và chống liệt / mất điểm câu dễ.',
  },
  {
    key: 'advanced',
    title: 'Thực chiến Mục tiêu 8.5+',
    ratioText: '35% TH · 65% VD',
    desc: 'Tăng cường câu hỏi vận dụng, bài toán thực nghiệm và bẫy lý thuyết sâu.',
  },
];

const MODE_OPTIONS = [
  {
    key: 'tutor',
    title: 'Chế độ Gia sư (Chấm & Mở hồ sơ lý thuyết ngay)',
    desc: 'Chọn đáp án xong chấm ngay, mở lời giải từng bước + Tóm tắt SGK chương đó + Bẫy cần tránh.',
  },
  {
    key: 'exam',
    title: 'Chế độ Phòng thi (Nộp bài mới chấm)',
    desc: 'Đổi phương án tự do, gạch loại trừ đáp án nhiễu, đánh dấu câu phân vân; chỉ chấm khi Nộp bài.',
  },
];

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

  const [phase, setPhase] = useState(isCheckpoint ? 'testing' : 'briefing');
  const [gradeFilter, setGradeFilter] = useState('all'); // 'all' | '10' | '11' | '12'
  const [desiredCount, setDesiredCount] = useState(isCheckpoint ? 12 : 25);
  const [focusMode, setFocusMode] = useState('balanced');
  const [examMode, setExamMode] = useState('tutor'); // 'tutor' | 'exam'
  const [stepIdx, setStepIdx] = useState(0);
  const [pickedMap, setPickedMap] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [showHintMap, setShowHintMap] = useState({});
  // Map lưu các phương án học sinh gạch loại trừ (Cross-out): { [`${stepIdx}-${optIdx}`]: true }
  const [eliminatedMap, setEliminatedMap] = useState({});
  // Map lưu số giây học sinh suy nghĩ trên từng câu: { [stepIdx]: seconds }
  const [timeSpentMap, setTimeSpentMap] = useState({});
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'wrong' | 'flagged'
  const [elapsedSec, setElapsedSec] = useState(0);
  const [quizSeed, setQuizSeed] = useState(0);
  const [copiedId, setCopiedId] = useState('');
  const startedAtRef = useRef(Date.now());
  const stepIdxRef = useRef(0);
  stepIdxRef.current = stepIdx;

  const topicIds = useMemo(() => {
    if (checkpointStage?.chapterIds?.length) return checkpointStage.chapterIds;
    return (chapters || []).map((c) => c.chapter?.id || c.id).filter(Boolean);
  }, [chapters, checkpointStage]);

  useEffect(() => {
    if (!open) return;
    setPhase(isCheckpoint ? 'testing' : 'briefing');
    setGradeFilter('all');
    setDesiredCount(isCheckpoint ? 12 : 25);
    setStepIdx(0);
    setPickedMap({});
    setFlaggedMap({});
    setShowHintMap({});
    setEliminatedMap({});
    setTimeSpentMap({});
    setReviewFilter('all');
    setElapsedSec(0);
    startedAtRef.current = Date.now();
  }, [open, isCheckpoint, checkpointStage?.id, effSubject]);

  // Đồng hồ bấm giờ toàn đề + đo thời gian từng câu
  useEffect(() => {
    if (!open || phase !== 'testing') return undefined;
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      const curIdx = stepIdxRef.current;
      setTimeSpentMap((prev) => ({ ...prev, [curIdx]: (prev[curIdx] || 0) + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [open, phase]);

  const questions = useMemo(() => {
    if (!open) return [];
    return buildStratifiedDiagnosticQuestions(topicIds, desiredCount, {
      subjectKey: effSubject,
      focusMode,
      gradeFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicIds, desiredCount, effSubject, focusMode, gradeFilter, quizSeed]);

  const totalQ = questions.length;
  const currentQ = questions[stepIdx] || null;
  const currentPicked = pickedMap[stepIdx] !== undefined ? pickedMap[stepIdx] : null;
  const answeredCount = Object.keys(pickedMap).length;
  const flaggedCount = Object.keys(flaggedMap).filter((k) => flaggedMap[k]).length;
  const currentQuestionSec = timeSpentMap[stepIdx] || 0;

  // Phân tích chi tiết Bảng Đặc tả Ma trận Đề (hiển thị từng chương × NB/TH/VD)
  const blueprintSummary = useMemo(() => {
    const lvCounts = { nb: 0, th: 0, vd: 0 };
    const gradeCounts = { 10: 0, 11: 0, 12: 0 };
    const chMap = new Map();
    questions.forEach((q) => {
      lvCounts[q.level] = (lvCounts[q.level] || 0) + 1;
      const tid = q.topicId;
      const meta = getChapterMeta(tid);
      const g = Number(meta?.grade || q.grade || 12);
      gradeCounts[g] = (gradeCounts[g] || 0) + 1;
      if (!chMap.has(tid)) {
        chMap.set(tid, {
          tid,
          title: chapterName(tid) || meta?.title || tid,
          grade: g,
          nb: 0,
          th: 0,
          vd: 0,
          count: 0,
        });
      }
      const row = chMap.get(tid);
      row[q.level] = (row[q.level] || 0) + 1;
      row.count += 1;
    });
    return {
      lvCounts,
      gradeCounts,
      chapters: Array.from(chMap.values()),
    };
  }, [questions]);

  const currentStreak = useMemo(() => {
    if (examMode === 'exam') return 0;
    let s = 0;
    for (let i = stepIdx; i >= 0; i -= 1) {
      if (pickedMap[i] === undefined) continue;
      if (questions[i] && pickedMap[i] === questions[i].correct) s += 1;
      else break;
    }
    return s;
  }, [pickedMap, questions, stepIdx, examMode]);

  const startTestingPhase = () => {
    setStepIdx(0);
    setPickedMap({});
    setFlaggedMap({});
    setShowHintMap({});
    setEliminatedMap({});
    setTimeSpentMap({});
    setElapsedSec(0);
    startedAtRef.current = Date.now();
    setPhase('testing');
  };

  const regenerateAndReset = (
    nextCount = desiredCount,
    nextFocus = focusMode,
    nextGrade = gradeFilter
  ) => {
    setDesiredCount(nextCount);
    setFocusMode(nextFocus);
    setGradeFilter(nextGrade);
    setStepIdx(0);
    setPickedMap({});
    setFlaggedMap({});
    setShowHintMap({});
    setEliminatedMap({});
    setTimeSpentMap({});
    setQuizSeed((s) => s + 1);
  };

  const handlePickOption = (optIdx) => {
    if (!currentQ) return;
    if (examMode === 'tutor' && currentPicked !== null) return;
    setPickedMap((prev) => ({ ...prev, [stepIdx]: optIdx }));
  };

  const toggleEliminateOption = (e, optIdx) => {
    e.stopPropagation();
    const key = `${stepIdx}-${optIdx}`;
    setEliminatedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFlagCurrent = () => {
    setFlaggedMap((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  const toggleHintCurrent = () => {
    setShowHintMap((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
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

    setPhase('report');
    onCompleted?.();
  };

  const handleNext = () => {
    if (stepIdx + 1 < totalQ) {
      setStepIdx(stepIdx + 1);
      return;
    }
    finishAssessment(pickedMap);
  };

  const jumpToFirstUnanswered = () => {
    const idx = questions.findIndex((_, i) => pickedMap[i] === undefined);
    if (idx >= 0) setStepIdx(idx);
  };

  const handleAskAiAboutQuestion = (qObj, chosenIdx) => {
    if (!qObj) return;
    const code = String(qObj.id || 'ELEC-Q').toUpperCase();
    const optsText = (qObj.options || [])
      .map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`)
      .join(' | ');
    const userChoiceText =
      chosenIdx !== null && chosenIdx >= 0
        ? `Mình đã chọn đáp án ${String.fromCharCode(65 + chosenIdx)} (${qObj.options[chosenIdx]}).`
        : 'Mình đang phân vân câu này.';
    onClose?.();
    askAI(
      `Giải thích thật chi tiết bản chất câu hỏi [${code}] thuộc chuyên đề "${chapterName(qObj.topicId) || subMeta.name}":\n"${qObj.q}"\nCác phương án: ${optsText}.\n${userChoiceText} Hãy phân tích tại sao đáp án đúng là ${String.fromCharCode(65 + qObj.correct)} và tại sao các phương án còn lại là bẫy.`
    );
  };

  useEffect(() => {
    if (!open || phase !== 'testing') return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (!currentQ) return;
      const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
      const k = map[String(e.key).toLowerCase()];
      if (k !== undefined && k < currentQ.options.length) {
        if (examMode === 'exam' || currentPicked === null) {
          e.preventDefault();
          handlePickOption(k);
          return;
        }
      }
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && currentPicked !== null) {
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

  const answersList = questions.map((q, idx) => ({
    q,
    idx,
    chosen: pickedMap[idx] ?? -1,
    ok: pickedMap[idx] === q.correct,
    flagged: Boolean(flaggedMap[idx]),
    spentSec: timeSpentMap[idx] || 0,
  }));
  const correctTotal = answersList.filter((a) => a.ok).length;
  const scorePct = Math.round((correctTotal / Math.max(1, totalQ)) * 100);
  const estimatedScoreNum = Math.round((correctTotal / Math.max(1, totalQ)) * 10 * 20) / 20;
  const estimatedScore10 = estimatedScoreNum.toFixed(2);
  const predictedBandLow = Math.max(0, estimatedScoreNum - 0.5).toFixed(2);
  const predictedBandHigh = Math.min(10, estimatedScoreNum + 0.5).toFixed(2);
  const avgSecPerQ = Math.max(1, Math.round(elapsedSec / Math.max(1, answeredCount || totalQ)));

  const tierStats = ['nb', 'th', 'vd'].map((lv) => {
    const items = answersList.filter((a) => a.q.level === lv);
    const ok = items.filter((a) => a.ok).length;
    const pct = items.length ? Math.round((ok / items.length) * 100) : 0;
    const avgTime = items.length
      ? Math.round(items.reduce((s, a) => s + a.spentSec, 0) / items.length)
      : 0;
    let advice = 'Đạt yêu cầu, tiếp tục duy trì phản xạ.';
    if (pct < 50) {
      advice = lv === 'nb'
        ? 'Lỗ hổng lý thuyết nền: Cần đọc lại khái niệm, danh pháp IUPAC & công thức gốc SGK GDPT 2018.'
        : lv === 'th'
          ? 'Cần luyện thêm kỹ năng biến đổi công thức, bảo toàn và đọc bảng số liệu thí nghiệm.'
          : 'Tập trung làm chắc 100% nhóm Nhận biết – Thông hiểu trước khi giải câu Vận dụng cao.';
    } else if (pct >= 80) {
      advice = 'Nền tảng rất vững và tốc độ xử lý tốt ở nhóm câu hỏi này!';
    }
    return {
      lv,
      label: LEVEL_META[lv]?.label || lv,
      total: items.length,
      ok,
      pct,
      avgTime,
      advice,
    };
  });

  // Thống kê theo Khối lớp 10 / 11 / 12
  const gradeStats = [10, 11, 12]
    .map((g) => {
      const items = answersList.filter((a) => Number(getChapterMeta(a.q.topicId)?.grade || a.q.grade || 12) === g);
      const ok = items.filter((a) => a.ok).length;
      const pct = items.length ? Math.round((ok / items.length) * 100) : 0;
      return { grade: g, total: items.length, ok, pct };
    })
    .filter((g) => g.total > 0);

  const chapterBreakdown = (() => {
    const map = new Map();
    answersList.forEach((a) => {
      const tid = a.q.topicId;
      const meta = getChapterMeta(tid);
      const guide = chapterGuide(tid);
      if (!map.has(tid)) {
        map.set(tid, {
          tid,
          name: chapterName(tid) || meta?.title || tid,
          grade: meta?.grade || a.q.grade || 12,
          total: 0,
          ok: 0,
          nbOk: 0,
          nbTot: 0,
          thOk: 0,
          thTot: 0,
          vdOk: 0,
          vdTot: 0,
          points: guide?.points || [],
          mistakes: guide?.mistakes || [],
        });
      }
      const rec = map.get(tid);
      rec.total += 1;
      if (a.ok) rec.ok += 1;
      if (a.q.level === 'nb') { rec.nbTot += 1; if (a.ok) rec.nbOk += 1; }
      if (a.q.level === 'th') { rec.thTot += 1; if (a.ok) rec.thOk += 1; }
      if (a.q.level === 'vd') { rec.vdTot += 1; if (a.ok) rec.vdOk += 1; }
    });
    return Array.from(map.values())
      .map((r) => {
        const pct = Math.round((r.ok / Math.max(1, r.total)) * 100);
        const status =
          pct >= 75
            ? { label: 'Đã nắm vững (≥75%)', tone: 'good', stage: 3 }
            : pct >= 50
              ? { label: 'Cần luyện thêm TH–VD', tone: 'mid', stage: 2 }
              : { label: 'Lỗ hổng ưu tiên bù gấp', tone: 'weak', stage: 1 };
        return { ...r, pct, status };
      })
      .sort((a, b) => a.pct - b.pct);
  })();

  const masteredChaptersCount = chapterBreakdown.filter((c) => c.pct >= 75).length;
  const urgentChapters = chapterBreakdown.filter((c) => c.pct < 50);
  const midChapters = chapterBreakdown.filter((c) => c.pct >= 50 && c.pct < 75);

  const filteredReview =
    reviewFilter === 'wrong'
      ? answersList.filter((a) => !a.ok)
      : reviewFilter === 'flagged'
        ? answersList.filter((a) => a.flagged)
        : answersList;

  const currentCode = currentQ
    ? String(currentQ.id || `${effSubject}-${stepIdx + 1}`).toUpperCase()
    : '';
  const currentMeta = currentQ ? getChapterMeta(currentQ.topicId) : null;
  const currentGuide = currentQ ? chapterGuide(currentQ.topicId) : null;
  const currentHintText =
    currentQ?.tip ||
    currentGuide?.points?.[0] ||
    'Áp dụng định luật bảo toàn hoặc công thức cơ bản của chuyên đề này, chú ý đổi đơn vị chuẩn GDPT 2018.';

  return (
    <DialogRoot open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup
          from="top"
          size="xl"
          className="ns9-diag-animate-popup"
          aria-label={isCheckpoint ? `Checkpoint ${checkpointStage.title}` : `Đánh giá năng lực môn ${subMeta.name}`}
        >
          <div className={`dsp-modal tone-${effSubject}`}>
            {/* ============================================================
                HEADER STUDIO PRO — THANH TIẾN TRÌNH 3 BƯỚC RÕ RÀNG & LOGIC
               ============================================================ */}
            <header className="dsp-head">
              <div className="dsp-head-top">
                <div className="dsp-brand-row">
                  <img
                    src={MASCOT_BY_SUBJ[effSubject] || MASCOT_BY_SUBJ.hoa}
                    alt="Bé Elec Khảo Thí"
                    className="dsp-mascot"
                    width="48"
                    height="48"
                  />
                  <div>
                    <div className="dsp-eyebrow">
                      <span className="dsp-pill-subj">
                        {isCheckpoint
                          ? `CHECKPOINT ${checkpointStage.code || ''} · ${subMeta.name} (ĐẠT ≥ 85%)`
                          : `PHÒNG KHẢO THÍ & CHẨN ĐOÁN NĂNG LỰC · ${subMeta.name.toUpperCase()}`}
                      </span>
                      {phase === 'testing' && (
                        <>
                          <span className="dsp-pill-stat">⏱ Tổng: {formatTimer(elapsedSec)}</span>
                          <span className="dsp-pill-stat">Câu này: {currentQuestionSec}s</span>
                          <span className="dsp-pill-stat">
                            Đã làm: {answeredCount}/{totalQ}
                          </span>
                          {flaggedCount > 0 && (
                            <span className="dsp-pill-stat">★ Đánh dấu: {flaggedCount}</span>
                          )}
                          {currentStreak >= 2 && (
                            <span className="dsp-pill-streak">Chuỗi đúng {currentStreak}x</span>
                          )}
                        </>
                      )}
                    </div>
                    <h2 className="dsp-title">
                      {phase === 'briefing'
                        ? `Thiết lập Ma trận & Bảng Đặc tả Đề Đánh giá Năng lực ${subMeta.name}`
                        : phase === 'report'
                          ? `Báo cáo Chẩn đoán Năng lực ${subMeta.name}: ${estimatedScore10}/10 điểm (${correctTotal}/${totalQ} câu)`
                          : `Câu ${stepIdx + 1}/${totalQ} · ${chapterName(currentQ?.topicId) || currentMeta?.title || subMeta.name}`}
                    </h2>
                  </div>
                </div>

                <div className="dsp-head-right">
                  {!isCheckpoint && (
                    <div className="dsp-stepper" aria-label="Quy trình khảo thí 3 bước">
                      <span className={`dsp-step-chip ${phase === 'briefing' ? 'is-active' : 'is-done'}`}>
                        1. Ma trận &amp; Đặc tả
                      </span>
                      <span className={`dsp-step-chip ${phase === 'testing' ? 'is-active' : phase === 'report' ? 'is-done' : ''}`}>
                        2. Phòng thi ({totalQ} câu)
                      </span>
                      <span className={`dsp-step-chip ${phase === 'report' ? 'is-active' : ''}`}>
                        3. Báo cáo &amp; Phác đồ
                      </span>
                    </div>
                  )}
                  <button type="button" className="dsp-close" onClick={onClose} aria-label="Đóng">
                    <IconClose size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* ============================================================
                GIAI ĐOẠN 1 (BRIEFING): CẤU HÌNH ĐỀ & BẢNG ĐẶC TẢ MA TRẬN 6 CỘT
               ============================================================ */}
            {phase === 'briefing' && (
              <div className="dsp-body dsp-briefing-body">
                <div className="dsp-brief-grid">
                  {/* Cột trái: 4 Bước cấu hình đề thi */}
                  <div className="dsp-brief-config">
                    <div className="dsp-config-block">
                      <div className="dsp-config-head">
                        <span className="dsp-config-step">BƯỚC 1</span>
                        <h4>Chọn phạm vi Khối lớp khảo sát</h4>
                      </div>
                      <div className="dsp-choice-cards dsp-choice-2col">
                        {GRADE_FILTERS.map((gf) => (
                          <button
                            key={gf.key}
                            type="button"
                            className={`dsp-choice-card ${gradeFilter === gf.key ? 'is-selected' : ''}`}
                            onClick={() => regenerateAndReset(desiredCount, focusMode, gf.key)}
                          >
                            <div className="dsp-choice-top">
                              <strong>{gf.label}</strong>
                            </div>
                            <p>{gf.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dsp-config-block">
                      <div className="dsp-config-head">
                        <span className="dsp-config-step">BƯỚC 2</span>
                        <h4>Chọn quy mô đề &amp; thời lượng khuyến nghị</h4>
                      </div>
                      <div className="dsp-choice-cards">
                        {SCALE_OPTIONS.map((opt) => (
                          <button
                            key={opt.count}
                            type="button"
                            className={`dsp-choice-card ${desiredCount === opt.count ? 'is-selected' : ''}`}
                            onClick={() => regenerateAndReset(opt.count, focusMode, gradeFilter)}
                          >
                            <div className="dsp-choice-top">
                              <strong>{opt.title}</strong>
                              <span className="dsp-choice-badge">{opt.durationText}</span>
                            </div>
                            <p>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dsp-config-block">
                      <div className="dsp-config-head">
                        <span className="dsp-config-step">BƯỚC 3</span>
                        <h4>Chọn ma trận phân hóa cấp độ nhận thức</h4>
                      </div>
                      <div className="dsp-choice-cards">
                        {FOCUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            className={`dsp-choice-card ${focusMode === opt.key ? 'is-selected' : ''}`}
                            onClick={() => regenerateAndReset(desiredCount, opt.key, gradeFilter)}
                          >
                            <div className="dsp-choice-top">
                              <strong>{opt.title}</strong>
                              <span className="dsp-choice-badge">{opt.ratioText}</span>
                            </div>
                            <p>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dsp-config-block">
                      <div className="dsp-config-head">
                        <span className="dsp-config-step">BƯỚC 4</span>
                        <h4>Chọn chế độ tương tác phòng thi</h4>
                      </div>
                      <div className="dsp-choice-cards dsp-choice-2col">
                        {MODE_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            className={`dsp-choice-card ${examMode === opt.key ? 'is-selected' : ''}`}
                            onClick={() => setExamMode(opt.key)}
                          >
                            <div className="dsp-choice-top">
                              <strong>{opt.title}</strong>
                            </div>
                            <p>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Bảng Đặc tả Ma trận Đề 6 cột chi tiết từng chương × NB/TH/VD */}
                  <aside className="dsp-blueprint-card">
                    <div className="dsp-bp-head">
                      <div>
                        <span className="dsp-bp-kicker">BẢNG ĐẶC TẢ MA TRẬN ĐỀ (CHUẨN CV 7991 / BGD&amp;ĐT)</span>
                        <h4>Cấu trúc {totalQ} câu hỏi · Môn {subMeta.name}</h4>
                      </div>
                      <button
                        type="button"
                        className="dsp-btn-sm"
                        onClick={() => setQuizSeed((s) => s + 1)}
                        title="Sinh mã đề ngẫu nhiên khác theo đúng bảng đặc tả này"
                      >
                        Trộn mã đề mới ↻
                      </button>
                    </div>

                    <div className="dsp-bp-tiers">
                      <div className="dsp-bp-tier">
                        <span>Nhận biết (NB)</span>
                        <strong>{blueprintSummary.lvCounts.nb} câu</strong>
                        <small>{Math.round((blueprintSummary.lvCounts.nb / Math.max(1, totalQ)) * 100)}% toàn đề</small>
                      </div>
                      <div className="dsp-bp-tier">
                        <span>Thông hiểu (TH)</span>
                        <strong>{blueprintSummary.lvCounts.th} câu</strong>
                        <small>{Math.round((blueprintSummary.lvCounts.th / Math.max(1, totalQ)) * 100)}% toàn đề</small>
                      </div>
                      <div className="dsp-bp-tier">
                        <span>Vận dụng (VD)</span>
                        <strong>{blueprintSummary.lvCounts.vd} câu</strong>
                        <small>{Math.round((blueprintSummary.lvCounts.vd / Math.max(1, totalQ)) * 100)}% toàn đề</small>
                      </div>
                    </div>

                    {/* Bảng Ma trận Đặc tả 6 cột chi tiết */}
                    <div className="dsp-bp-table-wrap">
                      <table className="dsp-bp-table">
                        <thead>
                          <tr>
                            <th>Khối</th>
                            <th>Chuyên đề SGK ({blueprintSummary.chapters.length} chương)</th>
                            <th>NB</th>
                            <th>TH</th>
                            <th>VD</th>
                            <th>Tổng (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blueprintSummary.chapters.map((ch) => (
                            <tr key={ch.tid}>
                              <td><span className="dsp-bp-grade">Lớp {ch.grade}</span></td>
                              <td className="dsp-bp-td-title">{ch.title}</td>
                              <td>{ch.nb || '–'}</td>
                              <td>{ch.th || '–'}</td>
                              <td>{ch.vd || '–'}</td>
                              <td>
                                <strong>{ch.count}c</strong>{' '}
                                <small>({Math.round((ch.count / Math.max(1, totalQ)) * 100)}%)</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="dsp-bp-note">
                      <strong>Cơ chế đảm bảo công bằng khảo thí:</strong> Rút xoay vòng phân tầng (Stratified Round-Robin) không trùng câu, chuẩn hóa khí đkc <code>24,79 L/mol</code> và tự động trộn vị trí 4 phương án A/B/C/D.
                    </div>
                  </aside>
                </div>

                <footer className="dsp-foot">
                  <span className="dsp-foot-hint">
                    Sau khi nộp bài, hệ thống sẽ lập Phác đồ Ôn tập 3 Chặng &amp; tự động đẩy các chuyên đề dưới 50% lên đầu Lộ trình.
                  </span>
                  <div className="dsp-foot-actions">
                    <button type="button" className="dsp-btn" onClick={onClose}>
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="dsp-btn dsp-btn-primary"
                      onClick={startTestingPhase}
                    >
                      Bắt đầu làm bài đánh giá ({totalQ} câu) →
                    </button>
                  </div>
                </footer>
              </div>
            )}

            {/* ============================================================
                GIAI ĐOẠN 2 (TESTING): PHÒNG THI 2 CỘT + CÔNG CỤ BLUEBOOK
               ============================================================ */}
            {phase === 'testing' && currentQ && (
              <div className="dsp-body dsp-testing-body">
                <div className="dsp-workbench-2col">
                  {/* CỘT TRÁI: CÂU HỎI, LOẠI TRỪ ĐÁP ÁN & HỒ SƠ SƯ PHẠM 3 TẦNG */}
                  <div className="dsp-question-col">
                    <div className="dsp-qmeta-bar">
                      <div className="dsp-qmeta-left">
                        <button
                          type="button"
                          className="dsp-id-badge"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(currentCode);
                              setCopiedId(currentCode);
                              setTimeout(() => setCopiedId(''), 1800);
                            }
                          }}
                          title="Bấm để sao chép Mã định danh câu hỏi [ELEC-ID]"
                        >
                          {copiedId === currentCode ? `✓ Đã chép ${currentCode}` : `ID: ${currentCode}`}
                        </button>
                        <span className="dsp-grade-badge">
                          Lớp {currentMeta?.grade || currentQ.grade || 12}
                        </span>
                        <span className="dsp-ch-badge">
                          {chapterName(currentQ.topicId) || currentMeta?.title || subMeta.name}
                        </span>
                        {currentQ.level && LEVEL_META[currentQ.level] && (
                          <span className={`dsp-lv-badge lv-${currentQ.level}`}>
                            Mức độ: {LEVEL_META[currentQ.level].label}
                          </span>
                        )}
                      </div>

                      <div className="dsp-qmeta-tools">
                        <button
                          type="button"
                          className={`dsp-tool-chip ${showHintMap[stepIdx] ? 'is-on' : ''}`}
                          onClick={toggleHintCurrent}
                        >
                          <IconBulb size={13} />
                          <span>{showHintMap[stepIdx] ? 'Ẩn gợi ý' : 'Gợi ý công thức'}</span>
                        </button>
                        <button
                          type="button"
                          className={`dsp-tool-chip ${flaggedMap[stepIdx] ? 'is-flagged' : ''}`}
                          onClick={toggleFlagCurrent}
                        >
                          <IconPin size={12} />
                          <span>{flaggedMap[stepIdx] ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
                        </button>
                      </div>
                    </div>

                    {showHintMap[stepIdx] && (
                      <div className="dsp-hint-banner">
                        <strong>Gợi ý định luật &amp; công thức cốt lõi ({chapterName(currentQ.topicId) || subMeta.name}):</strong>{' '}
                        <MathText>{currentHintText}</MathText>
                      </div>
                    )}

                    <div className="dsp-qbox">
                      <div className="dsp-qnumber-row">
                        <span>CÂU HỎI SỐ {stepIdx + 1} / {totalQ}</span>
                        <small>
                          {currentQ.tag ? `Chủ điểm: ${currentQ.tag} · ` : ''}
                          Thời gian suy nghĩ: {currentQuestionSec}s (Chuẩn: 45s)
                        </small>
                      </div>
                      <div className="dsp-qtext">
                        <MathText>{currentQ.q}</MathText>
                      </div>
                    </div>

                    {/* 4 Phương án A/B/C/D kèm nút "Gạch loại trừ" kiểu SAT Bluebook */}
                    <div className="dsp-options">
                      {currentQ.options.map((opt, idx) => {
                        const isPicked = currentPicked === idx;
                        const isRight = idx === currentQ.correct;
                        const isEliminated = Boolean(eliminatedMap[`${stepIdx}-${idx}`]);
                        let cls = 'dsp-opt';
                        if (isEliminated && currentPicked === null) cls += ' is-eliminated';
                        if (examMode === 'exam') {
                          if (isPicked) cls += ' is-selected';
                        } else if (currentPicked !== null) {
                          if (isRight) cls += ' is-correct';
                          else if (isPicked) cls += ' is-wrong';
                        }
                        return (
                          <div key={idx} className="dsp-opt-row">
                            <button
                              type="button"
                              className={cls}
                              disabled={examMode === 'tutor' && currentPicked !== null}
                              onClick={() => handlePickOption(idx)}
                            >
                              <span className="dsp-opt-key">{String.fromCharCode(65 + idx)}</span>
                              <span className="dsp-opt-txt">
                                <MathText>{opt}</MathText>
                              </span>
                              {examMode === 'tutor' && currentPicked !== null && isRight && (
                                <span className="dsp-opt-tag is-ok">✓ Đáp án đúng</span>
                              )}
                              {examMode === 'tutor' && currentPicked !== null && isPicked && !isRight && (
                                <span className="dsp-opt-tag is-bad">✕ Bạn chọn</span>
                              )}
                              {examMode === 'exam' && isPicked && (
                                <span className="dsp-opt-tag is-picked">Đã chọn</span>
                              )}
                            </button>
                            {(examMode === 'exam' || currentPicked === null) && (
                              <button
                                type="button"
                                className={`dsp-elim-btn ${isEliminated ? 'is-on' : ''}`}
                                onClick={(e) => toggleEliminateOption(e, idx)}
                                title={isEliminated ? 'Bỏ gạch loại trừ phương án này' : 'Gạch loại trừ phương án nhiễu này (Kiểu Bluebook)'}
                              >
                                {isEliminated ? 'Khôi phục' : 'Loại trừ'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* HỒ SƠ SƯ PHẠM 3 TẦNG SAU KHI CHỌN ĐÁP ÁN (CHẾ ĐỘ GIA SƯ) */}
                    {examMode === 'tutor' && currentPicked !== null && (
                      <div className={`dsp-solution ${currentPicked === currentQ.correct ? 'is-ok' : 'is-bad'}`}>
                        <div className="dsp-sol-head">
                          <b>
                            {currentPicked === currentQ.correct
                              ? `✓ Chính xác (${currentQuestionSec}s)! Đáp án chuẩn là ${String.fromCharCode(65 + currentQ.correct)}`
                              : `✕ Chưa chính xác — Đáp án đúng phải là ${String.fromCharCode(65 + currentQ.correct)}`}
                          </b>
                          <button
                            type="button"
                            className="dsp-ask-ai-btn"
                            onClick={() => handleAskAiAboutQuestion(currentQ, currentPicked)}
                          >
                            Hỏi sâu Bé Elec AI về câu này ↗
                          </button>
                        </div>

                        {/* Tầng 1: Lời giải chi tiết của câu hỏi */}
                        <div className="dsp-sol-block">
                          <span className="dsp-sol-label">1. PHÂN TÍCH &amp; HƯỚNG DẪN GIẢI CHI TIẾT</span>
                          {currentQ.explain ? (
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
                          ) : (
                            <p className="dsp-sol-fallback">
                              Đáp án đúng là <strong>{String.fromCharCode(65 + currentQ.correct)}</strong> (<MathText>{currentQ.options[currentQ.correct]}</MathText>).
                            </p>
                          )}
                        </div>

                        {/* Tầng 2: Kiến thức cốt lõi SGK GDPT 2018 của chuyên đề này */}
                        {currentGuide?.points?.length > 0 && (
                          <div className="dsp-sol-block">
                            <span className="dsp-sol-label">
                              2. KIẾN THỨC GỐC SGK GDPT 2018 ({chapterName(currentQ.topicId) || subMeta.name})
                            </span>
                            <ul className="dsp-sol-list">
                              {currentGuide.points.slice(0, 3).map((pt, pIdx) => (
                                <li key={pIdx}><MathText>{pt}</MathText></li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tầng 3: Bẫy đề thi thường gặp ở chương này */}
                        {(currentGuide?.mistakes?.length > 0 || currentHintText) && (
                          <div className="dsp-sol-tip">
                            <b style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <IconBulb size={14} /> 3. Bẫy đề thi &amp; Lỗi sai kinh điển cần tránh:
                            </b>
                            <ul className="dsp-sol-list" style={{ marginTop: 4 }}>
                              {(currentGuide?.mistakes?.length
                                ? currentGuide.mistakes.slice(0, 2)
                                : [currentHintText]
                              ).map((mItem, mIdx) => (
                                <li key={mIdx}><MathText>{mItem}</MathText></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CỘT PHẢI: BẢNG ĐIỀU HƯỚNG CÂU HỎI 1..N & THỐNG KÊ TỨC THÌ */}
                  <aside className="dsp-nav-sidebar" aria-label="Bảng điều khiển và bản đồ câu hỏi">
                    <div className="dsp-nav-card">
                      <div className="dsp-nav-head">
                        <span>BẢN ĐỒ CÂU HỎI (1..{totalQ})</span>
                        <strong>{Math.round((answeredCount / Math.max(1, totalQ)) * 100)}%</strong>
                      </div>

                      <div className="dsp-nav-progress-bar">
                        <div
                          className="dsp-nav-progress-fill"
                          style={{ width: `${Math.round((answeredCount / Math.max(1, totalQ)) * 100)}%` }}
                        />
                      </div>

                      {/* Thống kê trực tiếp trong lúc làm bài */}
                      <div className="dsp-live-mini-stats">
                        <div>
                          <small>Đã trả lời</small>
                          <b>{answeredCount}/{totalQ}</b>
                        </div>
                        <div>
                          <small>Còn trống</small>
                          <b>{totalQ - answeredCount}</b>
                        </div>
                        <div>
                          <small>Tốc độ TB</small>
                          <b>{avgSecPerQ}s/câu</b>
                        </div>
                      </div>

                      <div className="dsp-palette-grid" role="navigation" aria-label="Chọn câu hỏi">
                        {questions.map((q, idx) => {
                          const ans = pickedMap[idx];
                          const isCur = idx === stepIdx;
                          const isFlagged = Boolean(flaggedMap[idx]);
                          let cls = 'dsp-qdot';
                          if (isCur) cls += ' is-current';
                          else if (ans !== undefined) {
                            if (examMode === 'exam') cls += ' is-answered';
                            else cls += ans === q.correct ? ' is-ok' : ' is-bad';
                          }
                          if (isFlagged) cls += ' is-flagged';
                          return (
                            <button
                              key={q.id || idx}
                              type="button"
                              className={cls}
                              onClick={() => setStepIdx(idx)}
                              title={`Câu ${idx + 1} (${LEVEL_META[q.level]?.short || 'NB'}): ${chapterName(q.topicId) || subMeta.name}`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      <div className="dsp-palette-legend">
                        <span><i className="dot-cur" /> Đang xem</span>
                        {examMode === 'exam' ? (
                          <span><i className="dot-ans" /> Đã chọn ({answeredCount})</span>
                        ) : (
                          <>
                            <span><i className="dot-ok" /> Đúng</span>
                            <span><i className="dot-bad" /> Sai</span>
                          </>
                        )}
                        <span><i className="dot-flag" /> Đánh dấu ({flaggedCount})</span>
                      </div>

                      <div className="dsp-nav-actions">
                        {answeredCount < totalQ && (
                          <button
                            type="button"
                            className="dsp-btn-sm dsp-w-full"
                            onClick={jumpToFirstUnanswered}
                          >
                            Đi tới câu chưa làm ({totalQ - answeredCount} câu) →
                          </button>
                        )}
                        {!isCheckpoint && (
                          <button
                            type="button"
                            className="dsp-btn-sm dsp-w-full"
                            onClick={() => setPhase('briefing')}
                          >
                            ⚙ Xem lại Ma trận / Đổi cấu hình
                          </button>
                        )}
                        <button
                          type="button"
                          className="dsp-btn dsp-btn-primary dsp-w-full"
                          disabled={answeredCount === 0}
                          onClick={() => finishAssessment(pickedMap)}
                        >
                          Nộp bài &amp; Xem Báo cáo ({answeredCount}/{totalQ})
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>

                <footer className="dsp-foot">
                  <span className="dsp-foot-hint">
                    Phím tắt: A/B/C/D chọn đáp án · ← / → hoặc Enter chuyển câu · Bấm "Loại trừ" để gạch phương án nhiễu
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
                    <button
                      type="button"
                      className="dsp-btn dsp-btn-primary"
                      disabled={currentPicked === null && examMode === 'tutor'}
                      onClick={handleNext}
                    >
                      {stepIdx + 1 < totalQ ? 'Câu tiếp theo →' : 'Hoàn thành & Chấm điểm →'}
                    </button>
                  </div>
                </footer>
              </div>
            )}

            {/* ============================================================
                GIAI ĐOẠN 3 (REPORT): BÁO CÁO ĐA CHIỀU & PHÁC ĐỒ ÔN TẬP 3 CHẶNG
               ============================================================ */}
            {phase === 'report' && (
              <div className="dsp-body dsp-report-body">
                {/* 4 Thẻ KPI Tổng quan + Dự báo khoảng điểm THPTQG */}
                <div className="dsp-kpi-grid">
                  <div className="dsp-kpi-card is-primary">
                    <span>ĐIỂM NĂNG LỰC &amp; DỰ BÁO THI THPT</span>
                    <strong>{isCheckpoint ? `${scorePct}%` : `${estimatedScore10} / 10`}</strong>
                    <small>
                      Khoảng điểm dự báo thực tế: <b>{predictedBandLow} – {predictedBandHigh}đ</b>
                    </small>
                  </div>
                  <div className="dsp-kpi-card">
                    <span>ĐỘ CHÍNH XÁC TOÀN ĐỀ</span>
                    <strong>{correctTotal} / {totalQ} câu</strong>
                    <small>Tỷ lệ đúng: {scorePct}% ({totalQ - correctTotal} câu cần bù lỗ hổng)</small>
                  </div>
                  <div className="dsp-kpi-card">
                    <span>NHỊP ĐỘ XỬ LÝ TRUNG BÌNH</span>
                    <strong>{avgSecPerQ} giây/câu</strong>
                    <small>
                      Tổng: {formatTimer(elapsedSec)} · {avgSecPerQ <= 45 ? 'Đạt tốc độ phòng thi' : 'Cần tăng tốc phản xạ'}
                    </small>
                  </div>
                  <div className="dsp-kpi-card">
                    <span>CHUYÊN ĐỀ ĐẠT CHUẨN (≥75%)</span>
                    <strong>{masteredChaptersCount} / {chapterBreakdown.length} chương</strong>
                    <small>Còn {urgentChapters.length} chương lỗ hổng đỏ cần ưu tiên</small>
                  </div>
                </div>

                {/* Phân tích theo 3 Cấp độ nhận thức + Theo từng Khối lớp 10 / 11 / 12 */}
                <div className="dsp-section-card">
                  <div className="dsp-section-head">
                    <h4>1. Chẩn đoán Chiều sâu theo 3 Cấp độ Nhận thức &amp; Khối lớp SGK</h4>
                    {gradeStats.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {gradeStats.map((gs) => (
                          <span key={gs.grade} className="dsp-pill-stat">
                            <b>Lớp {gs.grade}:</b> {gs.ok}/{gs.total} câu ({gs.pct}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dsp-tier-grid">
                    {tierStats.map((t) => (
                      <div key={t.lv} className="dsp-tier-card">
                        <div className="dsp-tier-top">
                          <span>Cấp độ {t.label}</span>
                          <b>{t.ok}/{t.total} câu ({t.pct}%)</b>
                        </div>
                        <div className="dsp-ch-track">
                          <div
                            className="dsp-ch-fill"
                            style={{
                              width: `${t.pct}%`,
                              background: t.pct >= 75 ? '#10b981' : t.pct >= 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <small style={{ fontSize: '11px', fontWeight: 700, color: '#2f6bff' }}>
                          Thời gian suy nghĩ TB: {t.avgTime}s / câu
                        </small>
                        <p className="dsp-tier-advice">{t.advice}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHÁC ĐỒ ÔN TẬP CÁ NHÂN HÓA 3 CHẶNG KÈM TÓM TẮT LÝ THUYẾT CẦN BÙ */}
                <div className="dsp-section-card">
                  <div className="dsp-section-head">
                    <h4>2. Phác đồ Ôn tập Cá nhân hóa &amp; Kiến thức Gốc Cần Bù Ngay ({chapterBreakdown.length} chuyên đề)</h4>
                  </div>

                  <div className="dsp-ch-bars">
                    {chapterBreakdown.map((ch, idx) => {
                      const barColor = ch.pct >= 75 ? '#10b981' : ch.pct >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <div key={ch.tid} className="dsp-ch-bar-item">
                          <div className="dsp-ch-bar-top">
                            <div className="dsp-ch-title-wrap">
                              <span className="dsp-bp-grade">Lớp {ch.grade}</span>
                              <strong>#{idx + 1}. {ch.name}</strong>
                              <span className={`dsp-status-tag tone-${ch.status.tone}`}>
                                {ch.status.label}
                              </span>
                            </div>
                            <span style={{ color: barColor, fontWeight: 850 }}>
                              {ch.ok}/{ch.total} ({ch.pct}%)
                            </span>
                          </div>

                          <div className="dsp-ch-track">
                            <div className="dsp-ch-fill" style={{ width: `${ch.pct}%`, background: barColor }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--dsp-muted)' }}>
                            <span>
                              NB: {ch.nbOk}/{ch.nbTot} · TH: {ch.thOk}/{ch.thTot} · VD: {ch.vdOk}/{ch.vdTot}
                            </span>
                            <span>
                              {ch.pct < 50
                                ? 'Chặng 1: Bù gốc trong 48h tới'
                                : ch.pct < 75
                                  ? 'Chặng 2: Luyện thêm bài tập TH-VD'
                                  : 'Chặng 3: Duy trì đề tổng hợp'}
                            </span>
                          </div>

                          {/* Nếu chương yếu (< 75%), hiển thị ngay kiến thức cốt lõi & bẫy cần đọc lại */}
                          {ch.pct < 75 && ch.points.length > 0 && (
                            <div className="dsp-ch-prescription">
                              <strong>Trọng tâm cần ôn lại ngay:</strong> <MathText>{ch.points[0]}</MathText>
                              {ch.mistakes[0] && (
                                <div style={{ marginTop: 2, color: '#b45309' }}>
                                  <strong>Lưu ý tránh bẫy:</strong> <MathText>{ch.mistakes[0]}</MathText>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chi tiết đáp án & lời giải từng câu */}
                <div className="dsp-section-card">
                  <div className="dsp-section-head">
                    <h4>3. Hồ sơ Rà soát Chi tiết Từng Câu hỏi ({filteredReview.length} câu)</h4>
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
                        Câu làm sai ({answersList.filter((a) => !a.ok).length})
                      </button>
                      {flaggedCount > 0 && (
                        <button
                          type="button"
                          className={`dsp-seg-btn${reviewFilter === 'flagged' ? ' is-on' : ''}`}
                          onClick={() => setReviewFilter('flagged')}
                        >
                          Câu đánh dấu ({flaggedCount})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="dsp-review-list">
                    {filteredReview.map((item) => {
                      const qCode = String(item.q.id || `Q-${item.idx + 1}`).toUpperCase();
                      const itemGuide = chapterGuide(item.q.topicId);
                      return (
                        <article
                          key={item.q.id || item.idx}
                          className={`dsp-review-item ${item.ok ? 'is-ok' : 'is-bad'}`}
                        >
                          <div className="dsp-review-top">
                            <div className="dsp-review-badges">
                              <span className="dsp-review-num">Câu {item.idx + 1}</span>
                              <span className="dsp-id-badge">ID: {qCode}</span>
                              <span className="dsp-ch-badge">
                                {chapterName(item.q.topicId) || getChapterMeta(item.q.topicId)?.title || subMeta.name}
                              </span>
                              {item.q.level && LEVEL_META[item.q.level] && (
                                <span className={`dsp-lv-badge lv-${item.q.level}`}>
                                  {LEVEL_META[item.q.level].label}
                                </span>
                              )}
                              <span className="dsp-pill-stat">⏱ {item.spentSec}s</span>
                            </div>
                            <button
                              type="button"
                              className="dsp-ask-ai-btn"
                              onClick={() => handleAskAiAboutQuestion(item.q, item.chosen)}
                            >
                              Nhờ Bé Elec AI giảng sâu ↗
                            </button>
                          </div>

                          <div className="dsp-review-stem">
                            <MathText>{item.q.q}</MathText>
                          </div>

                          <div className="dsp-review-opts-grid">
                            {item.q.options.map((opt, oIdx) => {
                              const isRight = oIdx === item.q.correct;
                              const isChosen = oIdx === item.chosen;
                              let optCls = 'dsp-review-opt';
                              if (isRight) optCls += ' is-right';
                              else if (isChosen) optCls += ' is-chosen-wrong';
                              return (
                                <div key={oIdx} className={optCls}>
                                  <span className="dsp-opt-key">{String.fromCharCode(65 + oIdx)}</span>
                                  <span className="dsp-opt-txt"><MathText>{opt}</MathText></span>
                                  {isRight && <em className="dsp-rv-tag ok">✓ Đáp án đúng</em>}
                                  {isChosen && !isRight && <em className="dsp-rv-tag bad">✕ Bạn chọn</em>}
                                </div>
                              );
                            })}
                          </div>

                          {item.q.explain && (
                            <div className="dsp-review-explain">
                              <strong>Hướng dẫn giải chi tiết:</strong> <MathText>{item.q.explain}</MathText>
                            </div>
                          )}

                          {!item.ok && itemGuide?.points?.[0] && (
                            <div className="dsp-ch-prescription">
                              <strong>Kiến thức gốc SGK cần nhớ:</strong> <MathText>{itemGuide.points[0]}</MathText>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>

                <footer className="dsp-foot">
                  <span className="dsp-foot-hint">
                    Kết quả chẩn đoán và {urgentChapters.length} chuyên đề ưu tiên đã được đồng bộ vào Lộ trình cá nhân hóa.
                  </span>
                  <div className="dsp-foot-actions">
                    <button
                      type="button"
                      className="dsp-btn"
                      onClick={() => setPhase('briefing')}
                    >
                      Thiết lập đề đánh giá khác
                    </button>
                    <button type="button" className="dsp-btn dsp-btn-primary" onClick={onClose}>
                      Áp dụng Phác đồ vào Lộ trình ngay →
                    </button>
                  </div>
                </footer>
              </div>
            )}
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}
