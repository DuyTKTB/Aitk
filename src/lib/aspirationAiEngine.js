/* ============================================================
   aspirationAiEngine.js — ĐỘNG CƠ AI PHÂN TÍCH NGUYỆN VỌNG & LỘ TRÌNH CHIẾN LƯỢC
   ------------------------------------------------------------
   • Thu thập & chuẩn hóa dữ liệu khối/ban thi chuẩn Bộ GD&ĐT (A00, B00, A01, D07, A02, B08...)
   • Phân loại xác suất trúng tuyển (Safe / Target / Reach) dựa trên điểm dự đoán & điểm chuẩn
   • Phân bổ điểm mục tiêu từng môn trong tổ hợp xét tuyển
   • Chẩn đoán chuyên đề trọng tâm & lỗ hổng kiến thức cần bứt phá
   • Sinh lộ trình chiến lược 3 giai đoạn (Xây nền 7.5+ -> Bứt phá 8.5+ -> Thực chiến 9+)
   • Tự động áp dụng chiến lược vào hệ thống học tập của học sinh
   ============================================================ */

import { CHAPTER_EXAM_WEIGHTS } from './autoRoadmapEngine.js';

const AI_STRATEGY_STORAGE_PREFIX = 'elec_ai_aspiration_strategy_v2:';
const STRATEGY_APPLIED_EVENT = 'elec-ai-strategy-applied';

/* ── Cấu hình tổ hợp xét tuyển chuẩn Bộ GD&ĐT ── */
export const ADMISSION_BLOCKS_INFO = {
  A00: {
    code: 'A00',
    name: 'Khối A00',
    subjects: ['Toán', 'Vật lí', 'Hóa học'],
    primaryKhtn: ['ly', 'hoa'],
    desc: 'Tổ hợp truyền thống Kỹ thuật, Công nghệ thông tin, Bách khoa',
  },
  B00: {
    code: 'B00',
    name: 'Khối B00',
    subjects: ['Toán', 'Hóa học', 'Sinh học'],
    primaryKhtn: ['hoa', 'sinh'],
    desc: 'Tổ hợp Y Dược, Y học cổ truyền, Công nghệ Sinh học',
  },
  A01: {
    code: 'A01',
    name: 'Khối A01',
    subjects: ['Toán', 'Vật lí', 'Tiếng Anh'],
    primaryKhtn: ['ly'],
    desc: 'Tổ hợp Công nghệ, Tự động hóa, Kinh tế quốc tế',
  },
  D07: {
    code: 'D07',
    name: 'Khối D07',
    subjects: ['Toán', 'Hóa học', 'Tiếng Anh'],
    primaryKhtn: ['hoa'],
    desc: 'Tổ hợp Kỹ thuật Hóa dược, Môi trường, Kinh tế số',
  },
  A02: {
    code: 'A02',
    name: 'Khối A02',
    subjects: ['Toán', 'Vật lí', 'Sinh học'],
    primaryKhtn: ['ly', 'sinh'],
    desc: 'Tổ hợp Nông nghiệp công nghệ cao, Kỹ thuật y sinh',
  },
  B08: {
    code: 'B08',
    name: 'Khối B08',
    subjects: ['Toán', 'Sinh học', 'Tiếng Anh'],
    primaryKhtn: ['sinh'],
    desc: 'Tổ hợp Y sinh học, Môi trường và Đời sống quốc tế',
  },
  D01: {
    code: 'D01',
    name: 'Khối D01',
    subjects: ['Toán', 'Ngữ văn', 'Tiếng Anh'],
    primaryKhtn: [],
    desc: 'Tổ hợp Ngoại ngữ, Kinh tế & Luật',
  },
  C03: {
    code: 'C03',
    name: 'Khối C03',
    subjects: ['Ngữ văn', 'Toán', 'Lịch sử'],
    primaryKhtn: [],
    desc: 'Tổ hợp Công an, Quân đội, Luật',
  },
};

/* ── Ngân hàng chuyên đề trọng tâm theo môn KHTN chuẩn cấu trúc đề thi ── */
export const CORE_TOPICS_BY_SUBJECT = {
  hoa: [
    { id: 'c12-ester', name: 'Este & Lipit', examShare: '3–4 câu', weight: 10, phase: 1, gain: '+0.75đ' },
    { id: 'c12-electro', name: 'Điện hóa học & Pin Galvani', examShare: '3–4 câu', weight: 10, phase: 2, gain: '+0.75đ' },
    { id: 'c12-amine', name: 'Amine, Amino acid & Peptide', examShare: '3–4 câu', weight: 10, phase: 2, gain: '+0.75đ' },
    { id: 'c10-redox', name: 'Phản ứng Oxi hóa - Khử & Cân bằng electron', examShare: '2–3 câu', weight: 9, phase: 1, gain: '+0.5đ' },
    { id: 'c12-carb', name: 'Carbohydrate (Glucose, Fructose, Tinh bột)', examShare: '2–3 câu', weight: 9, phase: 1, gain: '+0.5đ' },
    { id: 'c12-metal', name: 'Đại cương Kim loại & Ăn mòn kim loại', examShare: '3 câu', weight: 9, phase: 2, gain: '+0.5đ' },
    { id: 'c12-complex', name: 'Hợp chất phức chất (Mới GDPT 2018)', examShare: '1–2 câu', weight: 8, phase: 3, gain: '+0.5đ' },
  ],
  ly: [
    { id: 'dao-dong-co', name: 'Dao động cơ học (Con lắc lò xo, Con lắc đơn)', examShare: '4–5 câu', weight: 10, phase: 1, gain: '+1.0đ' },
    { id: 'dong-dien-xc', name: 'Dòng điện xoay chiều (Mạch RLC, Cộng hưởng)', examShare: '4–5 câu', weight: 10, phase: 2, gain: '+1.0đ' },
    { id: 'song-co', name: 'Sóng cơ học & Giao thoa sóng', examShare: '3–4 câu', weight: 9, phase: 1, gain: '+0.75đ' },
    { id: 'quang-hoc', name: 'Sóng ánh sáng & Giao thoa khe Y-âng', examShare: '3 câu', weight: 9, phase: 2, gain: '+0.75đ' },
    { id: 'hat-nhan-nguyen-tu', name: 'Vật lí Hạt nhân & Phóng xạ', examShare: '3–4 câu', weight: 9, phase: 2, gain: '+0.75đ' },
    { id: 'luong-tu-anh-sang', name: 'Lượng tử ánh sáng & Hiện tượng quang điện', examShare: '3 câu', weight: 8, phase: 3, gain: '+0.5đ' },
    { id: 'nhiet-hoc', name: 'Nhiệt học & Thuyết động học chất khí (Mới)', examShare: '2–3 câu', weight: 8, phase: 1, gain: '+0.5đ' },
  ],
  sinh: [
    { id: 'di-truyen-hoc', name: 'Quy luật Menđen & Tương tác gen', examShare: '4–5 câu', weight: 10, phase: 1, gain: '+1.0đ' },
    { id: 'sinh-hoc-phan-tu', name: 'Cơ chế di truyền phân tử (ADN, ARN, Protein)', examShare: '4 câu', weight: 10, phase: 1, gain: '+0.75đ' },
    { id: 'bien-di-di-truyen', name: 'Đột biến gen & Đột biến nhiễm sắc thể', examShare: '3–4 câu', weight: 9, phase: 2, gain: '+0.75đ' },
    { id: 'sinh-thai-hoc', name: 'Sinh thái học & Hệ sinh thái', examShare: '4 câu', weight: 9, phase: 2, gain: '+0.75đ' },
    { id: 'ung-dung-di-truyen', name: 'Di truyền học quần thể & Chọn giống', examShare: '2–3 câu', weight: 8, phase: 2, gain: '+0.5đ' },
    { id: 'tien-hoa', name: 'Thuyết tiến hóa hiện đại & CLTN', examShare: '3 câu', weight: 8, phase: 3, gain: '+0.5đ' },
  ],
};

/**
 * Phân bổ điểm thành phần từng môn dựa trên tổng điểm mục tiêu và khối xét tuyển
 */
export function calculateSubjectScoreBreakdown(blockCode = 'A00', targetTotal = 25.5, examScale = 30) {
  const block = ADMISSION_BLOCKS_INFO[blockCode] || ADMISSION_BLOCKS_INFO.A00;
  const subjects = block.subjects || ['Môn 1', 'Môn 2', 'Môn 3'];

  // Nếu là kỳ thi thang 30 (3 môn x 10)
  if (examScale === 30) {
    const avg = targetTotal / 3;
    // Phân bổ hợp lý: Môn Toán thường cần độ vững chắc, môn Chuyên ngành được tối ưu
    const m1 = Math.min(10, Math.round((avg + 0.15) * 4) / 4);
    const m2 = Math.min(10, Math.round((avg - 0.1) * 4) / 4);
    const m3 = Math.min(10, Math.round((targetTotal - m1 - m2) * 4) / 4);

    return [
      {
        subjectName: subjects[0],
        targetScore: m1,
        sharePct: Math.round((m1 / targetTotal) * 100),
        role: 'Môn nền tảng then chốt',
        roleTone: 'info',
        strategy: 'Rèn chắc các dạng bài 8.0+ và tốc độ làm 35 câu đầu.',
      },
      {
        subjectName: subjects[1],
        targetScore: m2,
        sharePct: Math.round((m2 / targetTotal) * 100),
        role: 'Môn đòn bẩy bứt phá',
        roleTone: 'warn',
        strategy: 'Tập trung các chuyên đề Vận dụng cao để kéo điểm tổng.',
      },
      {
        subjectName: subjects[2],
        targetScore: m3,
        sharePct: Math.round((m3 / targetTotal) * 100),
        role: 'Môn thế mạnh tăng tốc',
        roleTone: 'ok',
        strategy: 'Luyện đề bấm giờ để đạt tối đa điểm lý thuyết không sai sót.',
      },
    ];
  }

  // Đối với kỳ thi HSA / TSA / V-ACT
  const ratio = targetTotal / examScale;
  return subjects.map((subj, idx) => {
    const rawSubj = Math.round(ratio * 10 * 4) / 4;
    return {
      subjectName: subj,
      targetScore: Number(rawSubj.toFixed(2)),
      sharePct: Math.round(100 / subjects.length),
      role: idx === 0 ? 'Phần Tư duy định lượng' : 'Phần Khoa học giải quyết vấn đề',
      roleTone: idx === 0 ? 'info' : 'ok',
      strategy: 'Nắm vững phương pháp suy luận logic và đọc hiểu dữ liệu thực nghiệm.',
    };
  });
}

/**
 * Đánh giá xác suất trúng tuyển định lượng (Chính xác & Khách quan)
 */
export function evaluateAdmissionProbability({ predictedScore, cutoffScore, examScale = 30 }) {
  if (!Number.isFinite(predictedScore) || !Number.isFinite(cutoffScore)) {
    return {
      probabilityPct: 50,
      levelKey: 'target',
      levelLabel: 'Vừa sức',
      levelTone: 'info',
      delta: 0,
      deltaLabel: 'Chưa đủ dữ liệu bài thi',
      summary: 'Hãy làm bài kiểm tra năng lực để AI đo chính xác xác suất trúng tuyển.',
    };
  }

  const delta = Number((predictedScore - cutoffScore).toFixed(2));
  const normalizedDelta = (delta / examScale) * 30; // Chuẩn hóa về thang 30

  let probabilityPct = 50;
  let levelKey = 'target';
  let levelLabel = 'Vừa sức';
  let levelTone = 'info';
  let summary = '';

  if (normalizedDelta >= 1.5) {
    probabilityPct = Math.min(96, Math.round(85 + (normalizedDelta - 1.5) * 5));
    levelKey = 'safe';
    levelLabel = 'An toàn cao';
    levelTone = 'ok';
    summary = `Điểm dự đoán đang cao hơn điểm chuẩn ${delta} điểm. Cửa trúng tuyển rất rộng mở, hãy duy trì phong độ và củng cố các câu Vận dụng cao.`;
  } else if (normalizedDelta >= 0.25) {
    probabilityPct = Math.min(84, Math.round(72 + (normalizedDelta - 0.25) * 10));
    levelKey = 'safe';
    levelLabel = 'Trong tầm tay';
    levelTone = 'ok';
    summary = `Điểm dự đoán đang cao hơn điểm chuẩn ${delta} điểm. Bạn có lợi thế tốt, cần tránh mất điểm ở các câu hỏi nhận biết dễ.`;
  } else if (normalizedDelta >= -0.75) {
    probabilityPct = Math.round(52 + (normalizedDelta + 0.75) * 18);
    levelKey = 'target';
    levelLabel = 'Vừa sức · Cần nỗ lực';
    levelTone = 'info';
    summary = `Cách điểm chuẩn ${Math.abs(delta)} điểm. Đây là vùng cạnh tranh gay cấn, chỉ cần nâng thêm 2-3 câu trắc nghiệm là nắm chắc tấm vé.`;
  } else if (normalizedDelta >= -2.0) {
    probabilityPct = Math.max(25, Math.round(35 + (normalizedDelta + 2.0) * 12));
    levelKey = 'reach';
    levelLabel = 'Thách thức · Cần tăng tốc';
    levelTone = 'warn';
    summary = `Đang cách điểm chuẩn ${Math.abs(delta)} điểm. Cần chiến lược ôn tập tập trung cao độ vào các chuyên đề trọng số lớn theo lộ trình AI đề xuất.`;
  } else {
    probabilityPct = Math.max(12, Math.round(20 + (normalizedDelta + 3.0) * 5));
    levelKey = 'reach';
    levelLabel = 'Mơ ước · Bứt phá mạnh';
    levelTone = 'err';
    summary = `Cách điểm chuẩn ${Math.abs(delta)} điểm. Cần xây lại nền tảng gấp trong Phase 1 và nâng thời gian học thêm 1.5 - 2 giờ mỗi tuần.`;
  }

  const deltaLabel = delta >= 0 ? `+${delta} điểm so với điểm chuẩn` : `${delta} điểm so với điểm chuẩn`;

  return {
    probabilityPct,
    levelKey,
    levelLabel,
    levelTone,
    delta,
    deltaLabel,
    summary,
  };
}

/**
 * Phân tích chuyên sâu và chẩn đoán lỗ hổng kiến thức theo ban KHTN
 */
export function diagnoseKeyTopics({ blockCode = 'A00', chapters = [], dueByTopic = {} }) {
  const block = ADMISSION_BLOCKS_INFO[blockCode] || ADMISSION_BLOCKS_INFO.A00;
  const primarySubjects = block.primaryKhtn || ['hoa'];

  let candidateTopics = [];
  primarySubjects.forEach((sub) => {
    const list = CORE_TOPICS_BY_SUBJECT[sub] || [];
    candidateTopics.push(...list.map((item) => ({ ...item, subject: sub })));
  });

  // Nếu không có KHTN (ví dụ D01), mặc định lấy Hóa học làm nòng cốt
  if (!candidateTopics.length) {
    candidateTopics = (CORE_TOPICS_BY_SUBJECT.hoa || []).map((item) => ({ ...item, subject: 'hoa' }));
  }

  // Kết hợp dữ liệu thực tế học sinh làm bài
  const chaptersMap = new Map((chapters || []).map((c) => [c.chapter?.id || c.id, c]));

  const enriched = candidateTopics.map((topic) => {
    const chapData = chaptersMap.get(topic.id);
    const answers = chapData?.summary?.answers || 0;
    const correct = chapData?.summary?.correct || 0;
    const masteryPct = chapData?.mastery?.score ?? (answers > 0 ? Math.round((correct / answers) * 100) : 0);
    const wrongDue = dueByTopic[topic.id] || 0;

    let urgency = topic.weight * 10 + (100 - masteryPct) * 0.6 + wrongDue * 10;
    if (answers === 0) urgency += 15; // Chưa học chuyên đề trọng tâm

    let statusLabel = 'Cần củng cố';
    let statusTone = 'warn';
    if (masteryPct >= 80 && answers >= 10) {
      statusLabel = 'Vững vàng';
      statusTone = 'ok';
    } else if (wrongDue >= 2 || (answers >= 5 && masteryPct < 55)) {
      statusLabel = 'Hổng kiến thức';
      statusTone = 'err';
    } else if (answers === 0) {
      statusLabel = 'Chưa rèn luyện';
      statusTone = 'info';
    }

    return {
      ...topic,
      answers,
      masteryPct,
      wrongDue,
      urgency,
      statusLabel,
      statusTone,
    };
  });

  // Sắp xếp theo mức độ cấp bách
  return enriched.sort((a, b) => b.urgency - a.urgency);
}

/**
 * Sinh lộ trình chiến lược 3 giai đoạn (3-Phase Strategic Roadmap)
 */
export function generateStrategicRoadmap({
  targetScore = 25.5,
  predictedScore = 20.0,
  weeksUntilExam = 24,
  weeklyFreeHours = 4.5,
  blockCode = 'A00',
  diagnosedTopics = [],
}) {
  const safeWeeks = Math.max(4, weeksUntilExam);
  const phase1Weeks = Math.max(1, Math.round(safeWeeks * 0.3));
  const phase2Weeks = Math.max(2, Math.round(safeWeeks * 0.45));
  const phase3Weeks = Math.max(1, safeWeeks - phase1Weeks - phase2Weeks);

  const safePredicted = Number.isFinite(predictedScore) ? predictedScore : 18.0;
  const safeTarget = Number.isFinite(targetScore) ? targetScore : 25.5;
  const scoreGap = Math.max(0, safeTarget - safePredicted);

  // Mốc điểm kỳ vọng qua từng phase
  const targetPhase1 = Number((safePredicted + scoreGap * 0.4).toFixed(2));
  const targetPhase2 = Number((safePredicted + scoreGap * 0.8).toFixed(2));
  const targetPhase3 = safeTarget;

  // Phân chia chuyên đề vào từng phase
  const p1Topics = diagnosedTopics.filter((t) => t.phase === 1).slice(0, 3);
  const p2Topics = diagnosedTopics.filter((t) => t.phase === 2).slice(0, 3);
  const p3Topics = diagnosedTopics.filter((t) => t.phase === 3).slice(0, 2);

  // Fallback nếu thiếu
  const fallbackP1 = diagnosedTopics.slice(0, 2);
  const fallbackP2 = diagnosedTopics.slice(2, 4);

  return [
    {
      phaseId: 1,
      phaseName: 'Giai đoạn 1: Xây nền vững chắc',
      badge: 'Nền tảng 7.5+',
      badgeTone: 'info',
      durationLabel: `${phase1Weeks} tuần (${Math.round(phase1Weeks * weeklyFreeHours)} giờ)`,
      targetMilestone: `Chạm mốc ${targetPhase1}/30 điểm`,
      focusDesc: 'Khóa chặt toàn bộ lý thuyết cốt lõi, không để rơi điểm ở các câu Nhận biết - Thông hiểu.',
      keyTasks: [
        'Quét sạch lý thuyết cơ bản và các phản ứng cốt lõi',
        'Giải dứt điểm các câu hỏi hay sai trong Sổ tay lỗi sai',
        'Luyện phản xạ 30 câu đầu trong thời gian dưới 25 phút',
      ],
      recommendedTopics: p1Topics.length ? p1Topics : fallbackP1,
    },
    {
      phaseId: 2,
      phaseName: 'Giai đoạn 2: Bứt phá Vận dụng',
      badge: 'Bứt phá 8.5+',
      badgeTone: 'warn',
      durationLabel: `${phase2Weeks} tuần (${Math.round(phase2Weeks * weeklyFreeHours)} giờ)`,
      targetMilestone: `Chạm mốc ${targetPhase2}/30 điểm`,
      focusDesc: 'Tấn công các dạng toán Vận dụng: cân bằng phản ứng khó, đồ thị dao động, bài tập di truyền tổ hợp.',
      keyTasks: [
        'Thành thạo phương pháp giải nhanh: Bảo toàn electron, bảo toàn khối lượng, tỉ lệ kiểu gen',
        'Luyện bài tập phân hóa mức độ 8.0 – 9.0 điểm',
        'Thi thử từng phần và đo lường sự tiến bộ hàng tuần',
      ],
      recommendedTopics: p2Topics.length ? p2Topics : fallbackP2,
    },
    {
      phaseId: 3,
      phaseName: 'Giai đoạn 3: Thực chiến phòng thi & Đỉnh cao',
      badge: 'Chinh phục 9.0 – 10',
      badgeTone: 'ok',
      durationLabel: `${phase3Weeks} tuần (${Math.round(phase3Weeks * weeklyFreeHours)} giờ)`,
      targetMilestone: `Vượt ngưỡng mục tiêu: ${targetPhase3}/30 điểm`,
      focusDesc: 'Luyện đề chuẩn ma trận Bộ GD&ĐT, rèn bản lĩnh thi cử, tối ưu tốc độ và tránh bẫy tinh vi.',
      keyTasks: [
        'Luyện đề thi thử chuẩn cấu trúc 50 phút với đồng hồ đếm ngược',
        'Rà soát lần cuối toàn bộ chuyên đề bẫy điểm 9+',
        'Ổn định tâm lý, hoàn thiện chiến thuật phân bổ thời gian từng câu',
      ],
      recommendedTopics: p3Topics.length ? p3Topics : diagnosedTopics.slice(0, 2),
    },
  ];
}

/**
 * TỔNG HỢP TOÀN BỘ PHÂN TÍCH AI CHIẾN LƯỢC CHO NGUYỆN VỌNG & LỘ TRÌNH
 */
export function buildComprehensiveAiStrategy({
  uid = 'guest',
  activeAspiration = null,
  progress = {},
  schedule = {},
  chapters = [],
  dueByTopic = {},
}) {
  const schoolName = activeAspiration?.school?.name || 'Trường Đại học Mục tiêu';
  const schoolCode = activeAspiration?.school?.code || 'ĐH';
  const majorName = activeAspiration?.major?.name || 'Ngành xét tuyển';
  const majorCode = activeAspiration?.major?.majorCode || '';
  const blockCode = activeAspiration?.block || 'A00';
  const examName = activeAspiration?.exam?.name || 'Thi THPTQG';
  const examScale = activeAspiration?.exam?.scale || 30;

  const targetScore = Number.isFinite(activeAspiration?.targetScore)
    ? activeAspiration.targetScore
    : (examScale === 30 ? 25.5 : 85);

  const cutoffScore = Number.isFinite(activeAspiration?.cutoffScore)
    ? activeAspiration.cutoffScore
    : targetScore - 0.5;

  const predictedScore = Number.isFinite(progress?.predictedScore)
    ? progress.predictedScore
    : null;

  const weeksUntilExam = schedule?.weeksUntilExam || 24;
  const weeklyFreeHours = schedule?.weeklyFreeHours || 4.5;

  // 1. Đánh giá xác suất trúng tuyển
  const probability = evaluateAdmissionProbability({
    predictedScore,
    cutoffScore,
    examScale,
  });

  // 2. Phân bổ điểm từng môn chuẩn ban
  const subjectBreakdown = calculateSubjectScoreBreakdown(blockCode, targetScore, examScale);

  // 3. Chẩn đoán chuyên đề trọng tâm & lỗ hổng kiến thức
  const diagnosedTopics = diagnoseKeyTopics({
    blockCode,
    chapters,
    dueByTopic,
  });

  // 4. Lập lộ trình chiến lược 3 giai đoạn
  const strategicRoadmap = generateStrategicRoadmap({
    targetScore,
    predictedScore: predictedScore || 18.0,
    weeksUntilExam,
    weeklyFreeHours,
    blockCode,
    diagnosedTopics,
  });

  // 5. Khuyến nghị AI cốt lõi
  const keyRecommendations = [
    `Khối thi ${blockCode}: Tập trung cao độ cho 2 môn KHTN chủ lực (${subjectBreakdown.map((s) => s.subjectName).join(' + ')}) để tối ưu tổng điểm.`,
    `Chuyên đề bứt phá nhanh nhất: "${diagnosedTopics[0]?.name || 'Este & Lipit'}" (${diagnosedTopics[0]?.examShare || '3–4 câu'}), dự kiến tăng ngay ${diagnosedTopics[0]?.gain || '+0.75đ'}.`,
    `Thời gian khuyến nghị: Dành đều đặn ${weeklyFreeHours} giờ/tuần (~40 phút mỗi ngày) để giữ nhịp phản xạ bài tập.`,
  ];

  return {
    uid,
    timestamp: Date.now(),
    school: {
      name: schoolName,
      code: schoolCode,
      city: activeAspiration?.school?.city || 'Hà Nội',
    },
    major: {
      name: majorName,
      code: majorCode,
      cutoffScore,
      targetScore,
      blockCode,
      blocks: activeAspiration?.major?.blocks || [blockCode],
    },
    exam: {
      name: examName,
      scale: examScale,
    },
    probability,
    subjectBreakdown,
    diagnosedTopics: diagnosedTopics.slice(0, 6),
    strategicRoadmap,
    keyRecommendations,
    appliedAt: getSavedAiStrategy(uid)?.appliedAt || null,
  };
}

/**
 * Lưu & Đọc kế hoạch AI chiến lược từ localStorage
 */
export function saveAiStrategy(uid, strategyPlan) {
  try {
    const key = `${AI_STRATEGY_STORAGE_PREFIX}${uid || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(strategyPlan));
  } catch (e) {
    console.warn('[aspirationAiEngine] save error:', e);
  }
}

export function getSavedAiStrategy(uid) {
  try {
    const key = `${AI_STRATEGY_STORAGE_PREFIX}${uid || 'guest'}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ÁP DỤNG CHIẾN LƯỢC AI VÀO HỆ THỐNG LỘ TRÌNH CỦA HỌC SINH
 * (Đẩy các chuyên đề AI gợi ý lên đầu danh sách ưu tiên, lưu trạng thái kích hoạt)
 */
export function applyAiStrategyToRoadmap(uid, strategyPlan) {
  if (!strategyPlan) return false;
  try {
    const updatedPlan = {
      ...strategyPlan,
      appliedAt: Date.now(),
    };
    saveAiStrategy(uid, updatedPlan);

    // Kích hoạt custom event thông báo toàn hệ thống
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STRATEGY_APPLIED_EVENT, {
        detail: { uid, plan: updatedPlan },
      }));
      window.dispatchEvent(new Event('cs-aspirations'));
    }
    return true;
  } catch (e) {
    console.error('[aspirationAiEngine] apply error:', e);
    return false;
  }
}

export function subscribeAiStrategyApplied(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => callback(e.detail);
  window.addEventListener(STRATEGY_APPLIED_EVENT, handler);
  return () => {
    window.removeEventListener(STRATEGY_APPLIED_EVENT, handler);
  };
}
