/* ============================================================
   autoRoadmapEngine.js — ĐỘNG CƠ LỘ TRÌNH TỰ ĐỘNG (GIAI ĐOẠN 4 & 5)
   ------------------------------------------------------------
   • Đồng bộ trực tiếp với nguyện vọng đang chọn từ aspirationService.js
   • Tính toán thực tế:
     1. Điểm Hóa dự đoán (thang 10) & Điểm quy đổi theo thang kỳ thi (30 / 150 / 100...)
     2. Đường tiến độ lý tưởng (Ideal Trajectory) từ hôm nay đến ngày thi
     3. Công thức tiến độ: so sánh Điểm thực tế vs Đường lý tưởng
        (chênh lệch >= 1 điểm -> "Cần tăng tốc" + tự tăng khối lượng chương yếu)
     4. Lộ trình tự động theo mốc: Tháng -> Tuần -> Ngày (chương Hóa, số câu,
        ngày ôn lỗi sai, ngày thi thử, điểm kỳ vọng từng mốc)
     5. Gom nhóm Sổ lỗi sai theo từng chương Hóa học
   ============================================================ */

import {
  getExams,
  getUserAspirationsState,
  computeStudentProgress,
} from './aspirationService.js';
import { builtinRawById } from '../data/roadmapExercises.js';
import { chapterName } from '../data/roadmap.js';

const WEEKLY_SETTINGS_KEY = 'elec_ai_roadmap_schedule_v1:';
const DAY_MS = 86400000;

/* Trọng số thực tế của từng chuyên đề trong đề thi THPTQG / ĐGNL */
export const CHAPTER_EXAM_WEIGHTS = {
  // Lớp 12 — Trọng tâm thi Đại học (chiếm ~70-75% đề thi)
  'c12-ester': { questionsInExam: '3–4 câu', weightLabel: 'Trọng tâm đề thi', priorityWeight: 10 },
  'c12-carb': { questionsInExam: '2–3 câu', weightLabel: 'Trọng tâm đề thi', priorityWeight: 9 },
  'c12-amine': { questionsInExam: '3–4 câu', weightLabel: 'Hay ra câu phân loại', priorityWeight: 10 },
  'c12-poly': { questionsInExam: '2–3 câu', weightLabel: 'Dễ lấy điểm trọn vẹn', priorityWeight: 8 },
  'c12-electro': { questionsInExam: '3–4 câu', weightLabel: 'Trọng tâm chương trình mới', priorityWeight: 10 },
  'c12-metal': { questionsInExam: '3–4 câu', weightLabel: 'Trọng tâm vô cơ', priorityWeight: 9 },
  'c12-group': { questionsInExam: '2–3 câu', weightLabel: 'Thực tiễn & Nhận biết', priorityWeight: 8 },
  'c12-complex': { questionsInExam: '1–2 câu', weightLabel: 'Điểm 8.5–10 (Mới GDPT 2018)', priorityWeight: 7 },
  // Lớp 11 — Nền tảng Hữu cơ & Cân bằng (~20% đề thi)
  'c11-eq': { questionsInExam: '2 câu', weightLabel: 'Nền tảng tính pH & chuẩn độ', priorityWeight: 9 },
  'c11-n-s': { questionsInExam: '1–2 câu', weightLabel: 'Hóa vô cơ thực tiễn', priorityWeight: 7 },
  'c11-organic': { questionsInExam: '1–2 câu', weightLabel: 'Gốc hữu cơ & phổ IR/MS', priorityWeight: 9 },
  'c11-hc': { questionsInExam: '2 câu', weightLabel: 'Nền tảng Hydrocarbon', priorityWeight: 8 },
  'c11-halide': { questionsInExam: '1 câu', weightLabel: 'Bổ trợ chuỗi phản ứng', priorityWeight: 6 },
  'c11-alcohol': { questionsInExam: '2 câu', weightLabel: 'Hay gặp trong bài tổng hợp', priorityWeight: 8 },
  'c11-carbonyl': { questionsInExam: '2 câu', weightLabel: 'Tráng bạc & Carboxylic acid', priorityWeight: 9 },
  // Lớp 10 — Gốc Nguyên tử, Liên kết, Nhiệt & Động hóa học (~10% đề thi)
  'c10-atom': { questionsInExam: '1 câu', weightLabel: 'Gốc cấu hình electron', priorityWeight: 8 },
  'c10-table': { questionsInExam: '1 câu', weightLabel: 'Quy luật tuần hoàn', priorityWeight: 8 },
  'c10-bond': { questionsInExam: '1 câu', weightLabel: 'Liên kết & tương tác phân tử', priorityWeight: 7 },
  'c10-redox': { questionsInExam: '1–2 câu', weightLabel: 'Bảo toàn electron cốt lõi', priorityWeight: 10 },
  'c10-thermo': { questionsInExam: '1–2 câu', weightLabel: 'Biến thiên Enthalpy (Mới)', priorityWeight: 8 },
  'c10-rate': { questionsInExam: '1 câu', weightLabel: 'Tốc độ phản ứng', priorityWeight: 7 },
  'c10-halogen': { questionsInExam: '1–2 câu', weightLabel: 'Nhóm Halogen', priorityWeight: 7 },
};

export function getDefaultExamDateISO() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-06-26`; // Kỳ thi THPT Quốc gia cuối tháng 6
}

export function readScheduleConfig(uid) {
  const fallback = {
    weeklyFreeHours: 4.5, // ~4.5 giờ/tuần (mặc định ~40 phút/ngày)
    examDate: getDefaultExamDateISO(),
    configuredOnce: false,
  };
  try {
    const raw = localStorage.getItem(`${WEEKLY_SETTINGS_KEY}${uid || 'guest'}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      weeklyFreeHours: Math.min(20, Math.max(1.5, Number(parsed.weeklyFreeHours) || 4.5)),
      examDate: parsed.examDate || fallback.examDate,
      configuredOnce: Boolean(parsed.configuredOnce),
    };
  } catch {
    return fallback;
  }
}

export function saveScheduleConfig(uid, partial = {}) {
  const cur = readScheduleConfig(uid);
  const next = {
    ...cur,
    ...partial,
    configuredOnce: true,
  };
  try {
    localStorage.setItem(`${WEEKLY_SETTINGS_KEY}${uid || 'guest'}`, JSON.stringify(next));
  } catch {
    /* ignore storage quota */
  }
  return next;
}

/**
 * Tính toán toàn diện bảng điều khiển "Lộ trình của em" và Lộ trình tự động
 */
export function buildAutoRoadmapData({
  uid,
  overview = {},
  chapters = [],
  events = [],
  dueByTopic = {},
  dueTotal = 0,
  cardsDue = 0,
  now = Date.now(),
} = {}) {
  const aspState = getUserAspirationsState(uid);
  const exams = getExams();
  const activeExam = exams.find((e) => e.id === aspState.selectedExamId) || exams[0];
  const activeAsp = aspState.activeAspiration || aspState.aspirations[0] || null;
  const schedule = readScheduleConfig(uid);

  const progress = computeStudentProgress(uid, {
    overview,
    events,
    now,
  });

  const examScale = progress.scale || activeExam.scale || 30;

  // Điểm môn Hóa trên thang 10 để học sinh dễ hình dung sát thực tế nhất
  const targetChem10 = Number.isFinite(activeAsp?.targetChemScore)
    ? activeAsp.targetChemScore
    : (examScale === 30 ? Math.min(10, Math.round(((progress.targetScore || 24) / 3) * 4) / 4) : 8.5);

  const rawMastery = overview?.avgMastery ?? overview?.accuracy ?? (overview?.hasEvidence ? 55 : null);
  const validMastery = rawMastery !== null && rawMastery !== undefined && Number.isFinite(Number(rawMastery))
    ? Number(rawMastery)
    : null;
  const hasEvidence = Boolean(overview?.hasEvidence && validMastery !== null);
  const predictedChem10 = hasEvidence
    ? Math.min(10, Math.max(2, Math.round((validMastery / 10) * 4) / 4))
    : 5.5; // Điểm nền khởi điểm tham chiếu khi mới bắt đầu

  const chemGap10 = Number.isFinite(targetChem10) && Number.isFinite(predictedChem10)
    ? Math.round((targetChem10 - predictedChem10) * 100) / 100
    : 0;

  // Tính số ngày còn lại tới kỳ thi
  const examTime = Date.parse(schedule.examDate) || (now + 120 * DAY_MS);
  const daysUntilExam = Math.max(14, Math.ceil((examTime - now) / DAY_MS));
  const weeksUntilExam = Math.max(2, Math.ceil(daysUntilExam / 7));

  // Công thức tiến độ: So sánh điểm dự đoán với đường lý tưởng tại thời điểm hiện tại
  // Nếu chênh lệch >= 1.0 điểm Hóa (hoặc >= 1.0 điểm thang kỳ thi) -> "Cần tăng tốc"
  let paceStatus = 'Đúng tiến độ';
  let paceTone = 'info';
  let paceAdvice = 'Bạn đang bám sát lộ trình mục tiêu. Hãy duy trì đều đặn nhiệm vụ mỗi ngày.';

  if (!hasEvidence) {
    paceStatus = 'Chưa đo điểm';
    paceTone = 'muted';
    paceAdvice = 'Làm thử 10 câu đầu tiên để hệ thống đo chính xác điểm dự đoán và Elo của bạn.';
  } else if (chemGap10 >= 1.0) {
    paceStatus = 'Cần tăng tốc';
    paceTone = 'warn';
    paceAdvice = `Đang thấp hơn mục tiêu ${chemGap10} điểm Hóa. Hệ thống đã tự động ưu tiên các chuyên đề trọng tâm bên dưới để bạn bứt phá nhanh nhất.`;
  } else if (chemGap10 <= 0) {
    paceStatus = 'Vượt tiến độ';
    paceTone = 'ok';
    paceAdvice = `Tuyệt vời! Điểm dự đoán đã chạm mốc mục tiêu (${targetChem10}đ). Hãy luyện thêm câu Vận dụng và giữ chuỗi ôn tập.`;
  }

  // Phân loại và chấm điểm ưu tiên cho từng chương Hóa học
  const enrichedChapters = (chapters || []).map((c, idx) => {
    const chId = c.chapter.id;
    const weightInfo = CHAPTER_EXAM_WEIGHTS[chId] || {
      questionsInExam: '1–2 câu',
      weightLabel: 'Chuyên đề nền tảng',
      priorityWeight: 7,
    };
    const answers = c.summary?.answers || 0;
    const correct = c.summary?.correct || 0;
    const accuracyPct = answers > 0 ? Math.round((correct / answers) * 100) : 0;
    const masteryPct = c.mastery?.score ?? 0;
    const targetQuestions = 20; // Mỗi chương cần tối thiểu ~20 câu để vững 3 mức độ NB-TH-VD
    const completionPct = Math.min(100, Math.round((answers / targetQuestions) * 100));
    const wrongDue = dueByTopic[chId] || 0;

    // Trạng thái dễ hiểu cho học sinh
    let studentStatus = 'Chưa học';
    let studentTone = 'muted';
    let groupKey = 'priority'; // 'priority' | 'learning' | 'mastered'

    if (answers === 0) {
      studentStatus = 'Chưa bắt đầu';
      studentTone = 'muted';
      groupKey = 'priority';
    } else if (masteryPct >= 78 && answers >= 8) {
      studentStatus = 'Đã nắm vững';
      studentTone = 'ok';
      groupKey = 'mastered';
    } else if (accuracyPct < 60 || wrongDue >= 3) {
      studentStatus = 'Đang yếu · Cần ôn ngay';
      studentTone = 'err';
      groupKey = 'priority';
    } else {
      studentStatus = 'Đang luyện tập';
      studentTone = 'info';
      groupKey = 'learning';
    }

    // Điểm ưu tiên để xếp lịch tự động (chương trọng số cao + đang yếu/nhiều câu sai lên đầu)
    const urgencyScore =
      weightInfo.priorityWeight * 10
      + (100 - masteryPct) * 0.65
      + wrongDue * 12
      + (answers === 0 ? 18 : 0);

    return {
      ...c,
      orderIndex: idx + 1,
      questionsInExam: weightInfo.questionsInExam,
      weightLabel: weightInfo.weightLabel,
      answers,
      correct,
      accuracyPct,
      masteryPct,
      completionPct,
      wrongDue,
      studentStatus,
      studentTone,
      groupKey,
      urgencyScore,
    };
  });

  // Sắp xếp chương cần ưu tiên nhất lên đầu cho hành động chính
  const sortedByUrgency = [...enrichedChapters]
    .filter((c) => c.chapter.bank !== false)
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const primaryChapter = sortedByUrgency[0] || enrichedChapters[0] || null;

  // Khi ở trạng thái "Cần tăng tốc", tự động tăng số câu luyện mỗi phiên từ 10 lên 15 câu
  const isAccelerating = paceStatus === 'Cần tăng tốc';
  const recommendedQuestionsPerSession = isAccelerating ? 15 : 10;

  // 1 Hành động chính nổi bật duy nhất trên màn hình
  const primaryAction = primaryChapter
    ? {
        chapterId: primaryChapter.chapter.id,
        chapterName: primaryChapter.chapter.name,
        mode: primaryChapter.wrongDue >= 3 ? 'review' : 'fresh',
        buttonLabel: primaryChapter.wrongDue >= 3
          ? `Ôn ngay ${primaryChapter.wrongDue} câu hay sai`
          : 'Luyện tập ngay',
        headline: primaryChapter.answers === 0
          ? `Bắt đầu chuyên đề trọng tâm: ${primaryChapter.chapter.name}`
          : primaryChapter.wrongDue >= 3
            ? `Xử lý ${primaryChapter.wrongDue} câu sai ở chuyên đề ${primaryChapter.chapter.name}`
            : `Tăng tốc chuyên đề ${primaryChapter.chapter.name} (Hiện đạt ${primaryChapter.masteryPct}%)`,
        subline: `${primaryChapter.weightLabel} (${primaryChapter.questionsInExam}) · Làm ${recommendedQuestionsPerSession} câu để nâng khoảng +0.25đ dự đoán`,
      }
    : null;

  // Sinh lộ trình theo mốc: Tháng -> Tuần -> Ngày (4 tuần tới)
  const weeklyMinutes = Math.round(schedule.weeklyFreeHours * 60);
  const sessionsPerWeek = Math.min(7, Math.max(3, Math.round(schedule.weeklyFreeHours * 1.2)));
  const scoreStepPerWeek = chemGap10 > 0
    ? Math.round((chemGap10 / Math.min(8, weeksUntilExam)) * 100) / 100
    : 0.15;

  const milestones = [1, 2, 3, 4].map((weekNum) => {
    const pickA = sortedByUrgency[(weekNum - 1) * 2 % Math.max(1, sortedByUrgency.length)];
    const pickB = sortedByUrgency[((weekNum - 1) * 2 + 1) % Math.max(1, sortedByUrgency.length)];
    const expectedChemScore = Math.min(
      10,
      Math.round((predictedChem10 + scoreStepPerWeek * weekNum) * 100) / 100,
    );

    const days = [
      {
        dayLabel: 'Thứ 2 & Thứ 3',
        type: 'study',
        title: pickA ? `Học trọng tâm & luyện ${recommendedQuestionsPerSession} câu: ${pickA.chapter.name}` : 'Luyện chuyên đề trọng tâm',
        chapterId: pickA?.chapter?.id || null,
        questionCount: recommendedQuestionsPerSession,
        badge: pickA?.questionsInExam || '2–3 câu đề thi',
      },
      {
        dayLabel: 'Thứ 4 & Thứ 5',
        type: 'study',
        title: pickB ? `Luyện phân loại NB → TH → VD: ${pickB.chapter.name}` : 'Củng cố chuyên đề tiếp theo',
        chapterId: pickB?.chapter?.id || null,
        questionCount: recommendedQuestionsPerSession,
        badge: pickB?.questionsInExam || '2–3 câu đề thi',
      },
      {
        dayLabel: 'Thứ 6',
        type: 'review',
        title: 'Ngày ôn lại Sổ lỗi sai & Thẻ ghi nhớ chống quên',
        chapterId: pickA?.chapter?.id || null,
        questionCount: Math.max(10, dueTotal || 10),
        badge: 'Ôn lỗi sai',
      },
      {
        dayLabel: 'Cuối tuần',
        type: 'mock',
        title: weekNum % 2 === 0
          ? `Làm 1 đề kiểm tra tổng hợp chuẩn ${activeExam.name} (50 phút)`
          : 'Hệ thống hóa công thức & làm 15 câu vận dụng tổng hợp',
        chapterId: pickA?.chapter?.id || null,
        questionCount: weekNum % 2 === 0 ? 28 : 15,
        badge: weekNum % 2 === 0 ? 'Thi thử định kỳ' : 'Tổng ôn tuần',
      },
    ];

    return {
      weekNum,
      title: `Tuần ${weekNum}`,
      phaseLabel: weekNum === 1
        ? 'Xây gốc & Xử lý chương yếu nhất'
        : weekNum === 2
          ? 'Bứt phá chuyên đề trọng số cao'
          : weekNum === 3
            ? 'Nâng cấp câu hỏi Thông hiểu – Vận dụng'
            : 'Luyện đề chuẩn cấu trúc & Về đích',
      expectedChemScore,
      sessionsPerWeek,
      weeklyMinutes,
      days,
    };
  });

  // Gom nhóm câu sai theo từng chương cho Sổ lỗi sai
  const wrongByChapter = enrichedChapters
    .filter((c) => c.wrongDue > 0 || (c.answers > c.correct))
    .map((c) => ({
      chapterId: c.chapter.id,
      chapterName: c.chapter.name,
      wrongCount: Math.max(c.wrongDue, c.answers - c.correct),
      dueCount: c.wrongDue,
      accuracyPct: c.accuracyPct,
    }))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  // Trích xuất chi tiết từng câu hỏi đã làm sai (từ events thực tế)
  const qErrorMap = new Map();
  (events || []).forEach((ev) => {
    if (!ev || !ev.qid) return;
    const prev = qErrorMap.get(ev.qid) || { qid: ev.qid, topicId: ev.topicId, wrongTimes: 0, rightTimes: 0, lastAt: 0 };
    if (ev.ok === false) prev.wrongTimes += 1;
    else if (ev.ok === true) prev.rightTimes += 1;
    if ((ev.at || 0) > prev.lastAt) prev.lastAt = ev.at || 0;
    qErrorMap.set(ev.qid, prev);
  });

  const wrongQuestionsList = [...qErrorMap.values()]
    .filter((item) => item.wrongTimes > 0)
    .map((item) => {
      const rawQ = builtinRawById(item.qid);
      return {
        qid: item.qid,
        topicId: item.topicId || rawQ?.topicId || '',
        chapterTitle: chapterName(item.topicId || rawQ?.topicId) || 'Chuyên đề Hóa học',
        wrongTimes: item.wrongTimes,
        rightTimes: item.rightTimes,
        lastAt: item.lastAt,
        q: rawQ?.q || `Câu hỏi mã #${item.qid}`,
        correctAnswer: rawQ?.options?.[0] || null,
        distractors: rawQ?.options ? rawQ.options.slice(1) : [],
        options: rawQ?.options || [],
        explain: rawQ?.explain || '',
        level: rawQ?.level || 'th',
      };
    })
    .sort((a, b) => (b.lastAt - a.lastAt) || (b.wrongTimes - a.wrongTimes))
    .slice(0, 30);

  return {
    aspState,
    activeExam,
    activeAsp,
    schedule,
    daysUntilExam,
    weeksUntilExam,
    hasEvidence,
    predictedChem10: Number.isFinite(predictedChem10) ? predictedChem10 : 5.5,
    targetChem10: Number.isFinite(targetChem10) ? targetChem10 : 8.5,
    chemGap10: Number.isFinite(chemGap10) ? chemGap10 : 0,
    predictedExamScore: (Number.isFinite(progress.predictedScore) ? progress.predictedScore : null) ?? (hasEvidence && Number.isFinite(predictedChem10) ? Number((Math.round((predictedChem10 / 10) * examScale * 4) / 4).toFixed(2)) : null),
    targetExamScore: (Number.isFinite(progress.targetScore) ? progress.targetScore : null) || (Number.isFinite(activeAsp?.targetScore) ? activeAsp.targetScore : null) || activeExam.defaultTarget || Math.round(examScale * 0.8),
    examScale: examScale || 30,
    elo: Number.isFinite(progress.elo) ? progress.elo : 1000,
    eloHistory: progress.eloHistory || [],
    paceStatus,
    paceTone,
    paceAdvice,
    isAccelerating,
    recommendedQuestionsPerSession,
    primaryAction,
    enrichedChapters,
    priorityChapters: enrichedChapters.filter((c) => c.groupKey === 'priority'),
    learningChapters: enrichedChapters.filter((c) => c.groupKey === 'learning'),
    masteredChapters: enrichedChapters.filter((c) => c.groupKey === 'mastered'),
    milestones,
    wrongByChapter,
    wrongQuestionsList,
    dueTotal,
    cardsDue,
  };
}
