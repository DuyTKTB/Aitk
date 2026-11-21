/* ============================================================
   tfcHelpers.js — Tiện ích cho ELEC AI Agent (Giáo viên)
   - Lời chào gọn, tự nhiên & cá nhân hóa theo môn dạy
   - 4 Chế độ Chuyên gia AI (Cố vấn / Chấm gắt / Nhanh gọn / Gia sư)
   - Thẻ Sức khỏe lớp học & Câu sai nhiều nhất từ dữ liệu thật
   - Thẻ Tin nhắn Zalo / Sổ liên lạc phụ huynh 3 giọng điệu
   - Nén & đọc ảnh đề bài (Vision / Ctrl+V)
   - Lịch sử hội thoại đa lượt (Multi-turn context + inlineData)
   - Lưu/khôi phục hội thoại an toàn theo tài khoản (localStorage)
   ============================================================ */

const HISTORY_STORAGE_PREFIX = 'elec_tfc_history_v1_';
const MAX_PERSISTED_MESSAGES = 30;
const MAX_HISTORY_TURNS = 8;

export const AI_MODES = [
  {
    id: 'balanced',
    label: 'Cố vấn',
    title: 'Cố vấn sư phạm cân bằng (mặc định)',
    directive: '',
  },
  {
    id: 'auditor',
    label: 'Chấm gắt',
    title: 'Giám khảo GDPT 2025 — soi bẫy, lỗi kiến thức & danh pháp IUPAC',
    directive:
      'CHẾ ĐỘ GIÁM KHẢO CHẤM GẮT GDPT 2025: Kiểm tra cực kỳ nghiêm ngặt tính chính xác khoa học, danh pháp IUPAC, đơn vị SI, mức độ nhận thức Bloom (NB/TH/VD/VDC) và các lỗi mơ hồ/đa nghĩa trong phương án nhiễu. Chỉ thẳng điểm sai và viết lại câu chuẩn.',
  },
  {
    id: 'concise',
    label: 'Nhanh gọn',
    title: 'Ngắn gọn, gạch đầu dòng để chép nhanh vào Word/Slide',
    directive:
      'CHẾ ĐỘ NHANH GỌN: Trả lời tối đa 5–7 gạch đầu dòng súc tích, đi thẳng vào đáp án/quy trình cốt lõi, không dài dòng mở bài hay kết bài, định dạng gọn để giáo viên sao chép ngay.',
  },
  {
    id: 'tutor',
    label: 'Gia sư',
    title: 'Giải thích từng bước cực dễ hiểu để giảng cho học sinh yếu',
    directive:
      'CHẾ ĐỘ GIA SƯ SƯ PHẠM: Trình bày từng bước thật chậm rãi, trực quan, nêu rõ "Vì sao làm bước này", chỉ ra 1 lỗi học sinh hay nhầm nhất và cho 1 mẹo nhớ nhanh để giáo viên giảng lại trên lớp.',
  },
];

export function getAiModeDirective(modeId = 'balanced') {
  return AI_MODES.find((m) => m.id === modeId)?.directive || '';
}

/**
 * Mô tả ma trận nhận thức Bloom chi tiết để bơm vào prompt sinh đề
 */
export function getMatrixPromptSpec(matrix = 'standard') {
  if (matrix === 'remedial') {
    return {
      label: 'Củng cố học sinh yếu (60% NB - 40% TH)',
      instruction:
        'MA TRẬN CỦNG CỐ HỌC SINH YẾU: 60% Nhận biết (NB) + 40% Thông hiểu (TH), KHÔNG đưa câu Vận dụng cao đánh đố. Ưu tiên câu hỏi nền tảng rõ ràng, giúp học sinh lấy gốc và tự tin.',
    };
  }
  if (matrix === 'advanced') {
    return {
      label: 'Phân hóa 9+ (30% TH - 40% VD - 30% VDC)',
      instruction:
        'MA TRẬN PHÂN HÓA 9+: 30% Thông hiểu (TH) + 40% Vận dụng (VD) + 30% Vận dụng cao (VDC). Tập trung bài toán nhiều bước, bẫy bản chất sâu và tình huống thực tiễn chuẩn đề thi tốt nghiệp THPT 2025.',
    };
  }
  return {
    label: 'Chuẩn Bộ GD (40% NB - 30% TH - 20% VD - 10% VDC)',
    instruction:
      'MA TRẬN CHUẨN BỘ GD&ĐT GDPT 2025: 40% Nhận biết (NB) + 30% Thông hiểu (TH) + 20% Vận dụng (VD) + 10% Vận dụng cao (VDC), phân tầng rõ ràng theo đúng tỷ lệ.',
  };
}

/**
 * Phân tích thông minh câu lệnh soạn đề tự nhiên (đa môn, đa khối, đúng chủ đề & ma trận)
 * VD: "Soạn đề 15p Tiêu hóa ở động vật lớp 11 cho học sinh yếu"
 */
export function extractExamIntentFromQuery(
  query = '',
  { detectedSubject = '', detectedGrade = '', fallbackSubject = 'Toán học', fallbackGrade = '12', getTopics } = {}
) {
  const raw = String(query || '').trim();
  const norm = raw.toLowerCase();

  let grade = detectedGrade || '';
  if (!grade) {
    if (/(?:lớp|khối)\s*10\b|\b10[a-z]\d*\b/i.test(raw)) grade = '10';
    else if (/(?:lớp|khối)\s*11\b|\b11[a-z]\d*\b/i.test(raw)) grade = '11';
    else if (/(?:lớp|khối)\s*12\b|\b12[a-z]\d*\b/i.test(raw)) grade = '12';
    else grade = String(fallbackGrade || '12');
  }

  const subject = detectedSubject || fallbackSubject || 'Toán học';
  const format = /(?:15\s*p|15\s*phút|ngắn|nhanh|10\s*câu)/i.test(norm) ? '15min' : 'gdpt2025';

  let matrix = 'standard';
  if (/(?:học sinh yếu|củng cố|lấy gốc|cơ bản|trung bình yếu|phụ đạo)/i.test(norm)) {
    matrix = 'remedial';
  } else if (/(?:phân hóa|9\+|nâng cao|hsg|học sinh giỏi|vận dụng cao|khó)/i.test(norm)) {
    matrix = 'advanced';
  }

  // Thử đối chiếu với danh mục chuyên đề chuẩn trước
  const knownTopics = typeof getTopics === 'function' ? getTopics(subject, grade) || [] : [];
  let topic = knownTopics.find((tp) => {
    const firstPart = tp.split(/[-–&]/)[0].trim().toLowerCase();
    return firstPart.length >= 3 && norm.includes(firstPart);
  }) || '';

  // Nếu không khớp danh mục có sẵn -> bóc tách chính xác cụm chủ đề tự do giáo viên gõ
  if (!topic) {
    let cleaned = raw
      .replace(/^(?:hãy|giúp\s*(?:tôi|mình|em)?|em\s+hãy)?\s*(?:soạn|tạo|ra|làm|viết)\s*(?:cho\s*(?:tôi|mình))?\s*(?:\d+\s*)?(?:đề\s*(?:thi|kiểm\s*tra)?|bài\s*kiểm\s*tra)\s*/i, '')
      .replace(/\b(?:chuẩn\s*3\s*phần|chuẩn\s*gdpt\s*2025|gdpt\s*2025|3\s*phần|15\s*phút|15p|45\s*phút|45p|50\s*phút|50p|1\s*tiết)\b/gi, ' ')
      .replace(/\b(?:môn\s+(?:toán(?:\s+học)?|vật\s*l[ií]|hóa(?:\s+học)?|sinh(?:\s+học)?|tiếng\s+anh))\b/gi, ' ')
      .replace(/\b(?:lớp|khối)\s*(?:10|11|12)[a-z0-9]*/gi, ' ')
      .replace(/\b(?:cho\s+học\s+sinh\s+(?:yếu|giỏi|khá)|củng\s+cố|lấy\s+gốc|nâng\s+cao|phân\s+hóa\s*9\+?)\b/gi, ' ')
      .replace(/^(?:về|phần|chủ\s*đề|chuyên\s*đề|bài|chương)\s+/i, '')
      .replace(/[\s,.:;!?]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length >= 3 && cleaned.length <= 70) {
      topic = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    } else {
      topic = knownTopics[0] || `Kiến thức trọng tâm ${subject} ${grade}`;
    }
  }

  return { subject, grade, format, matrix, topic };
}

/**
 * Ước lượng mức độ nhận thức Bloom (NB/TH/VD/VDC) khi câu hỏi nạp từ Word chưa gắn nhãn level
 */
export function inferQuestionBloomLevel(q = {}) {
  const rawLvl = String(q.level || '').trim().toUpperCase();
  if (rawLvl === 'VDC' || rawLvl.includes('CAO')) return 'VDC';
  if (rawLvl === 'VD' || rawLvl.includes('DUNG') || rawLvl.includes('DỤNG')) return 'VD';
  if (rawLvl === 'TH' || rawLvl.includes('HIEU') || rawLvl.includes('HIỂU')) return 'TH';
  if (rawLvl === 'NB' || rawLvl.includes('BIET') || rawLvl.includes('BIẾT')) return 'NB';

  const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
  const text = `${q.q || ''} ${(q.statements || []).map((s) => s.text || '').join(' ')}`.toLowerCase();
  const len = text.length;
  const hasCalc = /(?:tính|bao nhiêu|giá trị|khối lượng|thể tích|nồng độ|mol|gam|hiệu suất|tích phân|đạo hàm|xác suất|cực trị|vận tốc|gia tốc|công suất|điện trở|biên độ|chu kì|tần số|tỷ lệ kiểu hình)/i.test(text);
  const hasMultiStep = (text.match(/\d+(?:[.,]\d+)?/g) || []).length >= 3 || /(?:hỗn hợp|đồng thời|cực đại|nhỏ nhất|lớn nhất|tối đa|tối thiểu|để.*thỏa mãn|biết rằng.*sau phản ứng)/i.test(text);

  if (part === 3) {
    return hasMultiStep || len > 190 ? 'VDC' : 'VD';
  }
  if (part === 2) {
    return hasMultiStep || len > 280 ? 'VD' : 'TH';
  }
  if (hasCalc && hasMultiStep) return 'VDC';
  if (hasCalc || len > 170) return 'VD';
  if (/(?:phát biểu nào|nhận định nào|giải thích|nguyên nhân|so sánh|khác nhau|vì sao|tại sao|điều nào sau đây (?:đúng|sai)|số phát biểu)/i.test(text) || len > 95) {
    return 'TH';
  }
  return 'NB';
}

/**
 * Xây dựng khối ngữ cảnh thời gian thực sâu sắc (lớp đang xem, đề đang mở, chuyên đề yếu, câu sai nhiều)
 */
export function buildRichCopilotContext({
  user,
  inferredSubject,
  currentTabInfo,
  classes = [],
  exams = [],
  realInsights = {},
  activeLiveRooms = [],
  selectedClass = null,
  selectedExam = null,
} = {}) {
  const lines = [
    `- Giáo viên: ${user?.displayName || user?.email || 'Thầy/Cô'}`,
    `- Môn giảng dạy chính: ${inferredSubject || 'Chưa xác định'}`,
    `- Tab đang mở: ${currentTabInfo?.name || 'Tổng Quan'}`,
    `- Quy mô: ${classes.length} lớp (${classes.map((c) => c.name).filter(Boolean).join(', ') || 'Chưa tạo'}), ${exams.length} đề thi, ${realInsights.submissionCount || 0} bài nộp thật (Điểm TB: ${realInsights.avgPct || 0}%, Tỷ lệ đạt: ${realInsights.passRate || 0}%)`,
    `- Phòng thi LIVE đang mở: ${activeLiveRooms.length}`,
  ];

  if (selectedClass?.name) {
    lines.push(`- Lớp đang xem chi tiết: ${selectedClass.name} (Khối ${selectedClass.grade || '?'}, Môn ${selectedClass.subject || inferredSubject})`);
  }

  if (selectedExam?.title) {
    const qs = selectedExam.questions || [];
    const sample = qs
      .slice(0, 4)
      .map((q, i) => `  + Câu ${i + 1}: ${String(q.q || '').replace(/\s+/g, ' ').trim().slice(0, 110)}`)
      .join('\n');
    lines.push(`- Đề thi đang mở: "${selectedExam.title}" (${qs.length} câu, ${selectedExam.duration || 45}p, môn ${selectedExam.subject || inferredSubject})`);
    if (sample) lines.push(`- Một số câu tiêu biểu trong đề đang mở:\n${sample}`);
  }

  if (realInsights.weakestTopics?.length) {
    lines.push(
      `- Chuyên đề học sinh yếu nhất: ${realInsights.weakestTopics
        .slice(0, 3)
        .map((t) => `${t.topic} (${t.rate}% đúng)`)
        .join('; ')}`
    );
  }

  if (realInsights.atRisk?.length) {
    lines.push(
      `- Học sinh điểm dưới 50% cần chú ý (${realInsights.atRisk.length} em): ${realInsights.atRisk
        .slice(0, 4)
        .map((s) => `${s.studentName} (${s.pct}%)`)
        .join(', ')}`
    );
  }

  if (realInsights.hardest?.length) {
    const h0 = realInsights.hardest[0];
    lines.push(`- Câu sai nhiều nhất (${h0.rate}% đúng): "${String(h0.text || '').replace(/\s+/g, ' ').trim().slice(0, 120)}"`);
  }

  return lines.join('\n');
}

export function createWelcomeMessage(displayName = '') {
  const cleanName = String(displayName || '').trim();
  const greeting = cleanName ? `Chào ${cleanName}!` : 'Chào Thầy/Cô!';
  return {
    id: 'welcome_ultra',
    sender: 'bot',
    isWelcome: true,
    text: `${greeting} Em là trợ lý AI giảng dạy GDPT 2025 — hỗ trợ soạn đề 3 phần, đọc ảnh đề (Ctrl+V), chẩn đoán sức khỏe lớp và soạn tin nhắn phụ huynh.`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function getSubjectExamplePlaceholder(subject = '') {
  const s = String(subject || '').toLowerCase();
  if (s.includes('toán')) return 'Hỏi AI, dán ảnh hoặc gõ / (VD: Tích phân)...';
  if (s.includes('lý') || s.includes('lí')) return 'Hỏi AI, dán ảnh hoặc gõ / (VD: Dao động cơ)...';
  if (s.includes('hóa')) return 'Hỏi AI, dán ảnh hoặc gõ / (VD: Đề Este 15p)...';
  if (s.includes('sinh')) return 'Hỏi AI, dán ảnh hoặc gõ / (VD: Di truyền 12)...';
  if (s.includes('anh')) return 'Hỏi AI, dán ảnh hoặc gõ / (VD: Reading 12)...';
  return 'Hỏi AI, dán ảnh (Ctrl+V) hoặc gõ /...';
}

export function getWelcomeQuickCards(subject = '') {
  const subj = String(subject || '').trim() || 'GDPT 2025';
  return [
    {
      id: 'wizard',
      icon: 'sparkles',
      tone: 'blue',
      title: 'Soạn đề 3 phần',
      desc: `Chuẩn Bộ GD 2025 (${subj})`,
      action: 'start_wizard',
    },
    {
      id: 'health',
      icon: 'chart',
      tone: 'emerald',
      title: 'Sức khỏe lớp học',
      desc: 'Câu sai nhiều & lỗ hổng thật',
      action: 'class_health',
    },
    {
      id: 'word_doctor',
      icon: 'doc',
      tone: 'amber',
      title: 'Bác sĩ sửa Word',
      desc: 'Nạp .docx / PDF & chuẩn hóa',
      action: 'pick_file',
    },
    {
      id: 'vision',
      icon: 'image',
      tone: 'violet',
      title: 'Giải & soi ảnh đề',
      desc: 'Tải ảnh hoặc dán Ctrl+V',
      action: 'pick_image',
    },
  ];
}

export const SLASH_COMMANDS = [
  {
    cmd: '/soande',
    label: 'Soạn đề chuẩn 3 phần GDPT 2025',
    desc: 'Mở trình tạo đề 18 TN + 4 Đ/S + 6 TLN',
    action: 'start_wizard',
  },
  {
    cmd: '/suckhoelop',
    label: 'Chẩn đoán sức khỏe lớp & câu sai nhiều nhất',
    desc: 'Xem điểm TB, chuyên đề yếu, top câu học sinh hay sai',
    action: 'class_health',
  },
  {
    cmd: '/nhanxet',
    label: 'Soạn tin nhắn Zalo / Sổ liên lạc phụ huynh',
    desc: 'Mẫu nhận xét 3 giọng điệu từ điểm thật, copy 1 chạm',
    action: 'parent_report',
  },
  {
    cmd: '/anhde',
    label: 'Tải ảnh đề bài để AI giải & thẩm định',
    desc: 'Hỗ trợ ảnh chụp màn hình đề thi (.png, .jpg) hoặc Ctrl+V',
    action: 'pick_image',
  },
  {
    cmd: '/suaword',
    label: 'Mở Bác sĩ sửa file Word (.docx)',
    desc: 'Nạp file Word/PDF để tự động chẩn đoán & bổ sung',
    action: 'pick_file',
  },
  {
    cmd: '/worda4',
    label: 'Soạn thảo đề trực quan A4',
    desc: 'Mở trình soạn thảo Word Office A4',
    action: 'word_editor',
  },
  {
    cmd: '/thamdinh',
    label: 'Thẩm định & Phán xét câu hỏi',
    desc: 'Dán câu hỏi để AI kiểm tra kiến thức & mức Bloom',
    action: 'prefill_audit',
  },
  {
    cmd: '/mophong',
    label: 'Mô phỏng 100 học sinh ảo giải đề',
    desc: 'Dự báo điểm TB, phổ điểm và chỉ số phân hóa',
    action: 'run_sim_latest',
  },
  {
    cmd: '/hocsinhyeu',
    label: 'Lọc học sinh điểm dưới 5.0',
    desc: 'Xem danh sách cần bồi dưỡng & kê đơn phục hồi',
    query: 'Lớp nào đang có học sinh điểm dưới 5.0?',
  },
  {
    cmd: '/phantich',
    label: 'Phân tích tab hiện tại',
    desc: 'Tóm tắt số liệu thực tế & quy trình thao tác chuẩn',
    action: 'analyze_tab',
  },
  {
    cmd: '/live',
    label: 'Kiểm tra phòng thi LIVE',
    desc: 'Rà soát cảnh báo vi phạm trong ca thi trực tiếp',
    query: 'Phòng thi trực tiếp hiện có ai vi phạm không?',
  },
  {
    cmd: '/xoa',
    label: 'Làm mới cuộc trò chuyện',
    desc: 'Xóa lịch sử hiện tại để bắt đầu phiên mới',
    action: 'clear_chat',
  },
];

export function filterSlashCommands(inputValue = '') {
  const trimmed = String(inputValue || '').trim();
  if (!trimmed.startsWith('/')) return [];
  if (trimmed.includes(' ')) return [];
  const needle = trimmed.toLowerCase();
  return SLASH_COMMANDS.filter(
    (item) =>
      item.cmd.toLowerCase().includes(needle) ||
      item.label.toLowerCase().includes(needle.slice(1))
  );
}

/**
 * Dữ liệu thẻ Chẩn đoán Sức khỏe Lớp học & Top câu sai nhiều nhất (từ buildClassInsights thật)
 */
export function buildClassHealthCardData(realInsights, { classCount = 0, examCount = 0, subject = '' } = {}) {
  const ins = realInsights || {};
  const subCount = ins.submissionCount || 0;
  return {
    grade: ins.health?.grade || '—',
    gradeLabel: ins.health?.label || 'Chưa có bài nộp',
    avgPct: ins.avgPct || 0,
    passRate: ins.passRate || 0,
    submissionCount: subCount,
    atRiskCount: (ins.atRisk || []).length,
    classCount,
    examCount,
    subject: subject || 'GDPT 2025',
    diagnosis: ins.diagnosis || '',
    nextLesson: ins.nextLesson || '',
    weakestTopics: (ins.weakestTopics || []).slice(0, 4),
    hardestQuestions: (ins.hardest || []).slice(0, 4).map((q) => ({
      examTitle: q.examTitle || 'Đề kiểm tra',
      index: q.index,
      text: String(q.text || '').replace(/\s+/g, ' ').trim(),
      topic: q.topic || '',
      level: q.level || '',
      rate: q.rate,
      rated: q.rated,
    })),
  };
}

/**
 * Tạo bộ 3 mẫu tin nhắn Zalo / Sổ liên lạc phụ huynh theo số liệu thực tế của học sinh
 */
export function buildParentReportCardData({
  studentName = 'em học sinh',
  pct = null,
  subCount = 0,
  weakTopic = '',
  subject = 'bộ môn',
  teacherName = 'Thầy/Cô',
} = {}) {
  const hasScore = typeof pct === 'number' && !Number.isNaN(pct);
  const score10 = hasScore ? (pct / 10).toFixed(1) : null;
  const topicNote = weakTopic ? `phần "${weakTopic}"` : `một số chuyên đề trọng tâm môn ${subject}`;
  const isStrong = hasScore && pct >= 80;
  const isRisk = hasScore && pct < 50;

  const warm = isStrong
    ? `Kính gửi Quý Phụ huynh em ${studentName},\n\nThầy/Cô rất vui thông báo kết quả học tập môn ${subject} gần đây của em rất ấn tượng: đạt ${score10}/10 (${pct}%${subCount ? ` qua ${subCount} bài làm` : ''}). Em có tư duy tốt và ý thức làm bài nghiêm túc. Gia đình hãy tiếp tục động viên để em giữ vững phong độ và bứt phá nhóm điểm 9+ sắp tới nhé!\n\nTrân trọng,\n${teacherName}`
    : `Kính gửi Quý Phụ huynh em ${studentName},\n\nThầy/Cô gửi gia đình cập nhật tình hình học tập môn ${subject} của em${hasScore ? ` (hiện đạt ${score10}/10 — ${pct}%${subCount ? ` qua ${subCount} bài kiểm tra` : ''})` : ''}. Em có cố gắng nhưng hiện còn hơi lúng túng ở ${topicNote}. Trên lớp thầy/cô sẽ kèm thêm dạng bài cơ bản; rất mong gia đình động viên em dành 15–20 phút mỗi tối ôn lại phiếu bài tập phục hồi để em tự tin hơn ở bài kiểm tra tới.\n\nTrân trọng,\n${teacherName}`;

  const professional = `Kính gửi Quý Phụ huynh học sinh ${studentName},\n\nThông báo kết quả đánh giá môn ${subject}:${hasScore ? `\n- Điểm trung bình hiện tại: ${score10}/10 (${pct}%)${subCount ? ` trên ${subCount} bài nộp` : ''}.` : ''}\n- Đánh giá chuyên môn: ${isStrong ? 'Nắm chắc kiến thức nền tảng và vận dụng tốt.' : isRisk ? `Cần củng cố gấp kiến thức nền tại ${topicNote}.` : `Mức đạt khá, cần rèn thêm độ chính xác ở ${topicNote}.`}\n- Đề xuất phối hợp: Gia đình hỗ trợ nhắc em hoàn thành đúng hạn bài luyện tập củng cố trên hệ thống ELEC AI trong tuần này.\n\nTrân trọng thông báo,\n${teacherName}`;

  const urgent = isStrong
    ? `Kính gửi Quý Phụ huynh em ${studentName},\n\nEm ${studentName} hiện đang thuộc nhóm dẫn đầu môn ${subject} (${score10}/10 — ${pct}%). Thầy/Cô đề xuất bồi dưỡng thêm các dạng bài Vận dụng cao chuẩn GDPT 2025 để hướng tới mục tiêu điểm tối đa. Rất mong gia đình tạo điều kiện thời gian cho em luyện thêm bộ đề nâng cao.\n\nTrân trọng,\n${teacherName}`
    : `Kính gửi Quý Phụ huynh em ${studentName},\n\nThầy/Cô cần trao đổi sớm với gia đình về kết quả môn ${subject} của em ${studentName}${hasScore ? ` (đạt ${score10}/10 — ${pct}%, thuộc nhóm cần hỗ trợ sát sao)` : ''}. Em đang hổng kiến thức ở ${topicNote}, nếu không kịp bù đắp sẽ ảnh hưởng trực tiếp tới bài kiểm tra giữa/cuối kỳ. Thầy/Cô đã chuẩn bị gói bài tập đặc trị riêng cho em — rất mong Phụ huynh phối hợp đôn đốc em hoàn thành trong 3 ngày tới và phản hồi lại giúp thầy/cô.\n\nTrân trọng,\n${teacherName}`;

  return {
    studentName,
    pct: hasScore ? Math.round(pct) : null,
    score10,
    subCount,
    subject,
    weakTopic: weakTopic || '',
    tones: [
      { id: 'warm', label: 'Khích lệ nhẹ nhàng', text: warm },
      { id: 'professional', label: 'Khách quan chuẩn mực', text: professional },
      { id: 'urgent', label: isStrong ? 'Bồi dưỡng 9+' : 'Phối hợp sát sao', text: urgent },
    ],
  };
}

/**
 * Đọc và tối ưu kích thước ảnh đề bài để gửi Vision AI nhanh & gọn
 */
export function readImageFileAsAttachment(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (.png, .jpg, .webp).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const mimeType = file.type || 'image/jpeg';
      const fallbackBase64 = rawDataUrl.includes(',') ? rawDataUrl.split(',')[1] : '';
      const sizeLabel = `${(file.size / 1024).toFixed(0)} KB`;

      // Downscale images wider than 1400px in browser canvas to keep payloads fast
      if (typeof Image === 'undefined' || typeof document === 'undefined') {
        resolve({ name: file.name || 'anh-de-bai.png', mimeType, base64: fallbackBase64, dataUrl: rawDataUrl, sizeLabel });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1400;
          let { width, height } = img;
          if (width <= maxDim && height <= maxDim && file.size <= 1.2 * 1024 * 1024) {
            resolve({ name: file.name || 'anh-de-bai.png', mimeType, base64: fallbackBase64, dataUrl: rawDataUrl, sizeLabel });
            return;
          }
          const scale = Math.min(1, maxDim / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const outMime = 'image/jpeg';
          const outUrl = canvas.toDataURL(outMime, 0.86);
          const outBase64 = outUrl.split(',')[1] || fallbackBase64;
          resolve({
            name: file.name || 'anh-de-bai.jpg',
            mimeType: outMime,
            base64: outBase64,
            dataUrl: outUrl,
            sizeLabel: `${Math.round((outBase64.length * 3) / 4 / 1024)} KB`,
          });
        } catch {
          resolve({ name: file.name || 'anh-de-bai.png', mimeType, base64: fallbackBase64, dataUrl: rawDataUrl, sizeLabel });
        }
      };
      img.onerror = () => {
        resolve({ name: file.name || 'anh-de-bai.png', mimeType, base64: fallbackBase64, dataUrl: rawDataUrl, sizeLabel });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Chuyển các tin nhắn gần nhất thành lịch sử chuẩn Gemini cho askAI()
 * để AI nhớ ngữ cảnh hội thoại đa lượt (+ đính kèm ảnh Vision nếu có).
 */
export function buildConversationHistory(
  messages = [],
  currentUserPrompt = '',
  maxTurns = MAX_HISTORY_TURNS,
  imageAttachment = null
) {
  const recent = (messages || [])
    .filter((m) => m && !m.isWelcome && m.id !== 'welcome_ultra' && typeof m.text === 'string' && m.text.trim())
    .slice(-maxTurns);

  const history = [];
  for (const m of recent) {
    const role = m.sender === 'user' ? 'user' : 'model';
    const text = m.text.trim().slice(0, 1800);
    if (history.length > 0 && history[history.length - 1].role === role) {
      history[history.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      history.push({ role, parts: [{ text }] });
    }
  }

  while (history.length > 0 && history[0].role !== 'user') {
    history.shift();
  }

  if (currentUserPrompt) {
    const parts = [{ text: currentUserPrompt }];
    if (imageAttachment?.base64 && imageAttachment?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: imageAttachment.mimeType,
          data: imageAttachment.base64,
        },
      });
    }
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      history[history.length - 1] = { role: 'user', parts };
    } else {
      history.push({ role: 'user', parts });
    }
  }

  return history;
}

function storageKeyFor(uid) {
  return `${HISTORY_STORAGE_PREFIX}${uid || 'guest'}`;
}

export function loadPersistedMessages(uid, displayName = '') {
  const welcome = createWelcomeMessage(displayName);
  if (typeof window === 'undefined' || !window.localStorage) return [welcome];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(uid));
    if (!raw) return [welcome];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [welcome];
    const valid = parsed
      .filter((m) => m && m.id && m.sender && typeof m.text === 'string')
      .map((m) =>
        m.id === 'welcome_ultra'
          ? { ...welcome, time: m.time || welcome.time }
          : { ...m, streaming: false }
      );
    if (valid.length === 0) return [welcome];
    if (valid[0].id !== 'welcome_ultra') {
      return [welcome, ...valid].slice(0, MAX_PERSISTED_MESSAGES);
    }
    return valid.slice(-MAX_PERSISTED_MESSAGES);
  } catch {
    return [welcome];
  }
}

export function savePersistedMessages(uid, messages = []) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const trimmed = (messages || [])
      .filter((m) => m && !m.streaming)
      .slice(-MAX_PERSISTED_MESSAGES)
      .map((m) => {
        const copy = { ...m };
        delete copy.realSummary;
        // Do not store large image base64 strings inside localStorage
        if (copy.imagePreview) {
          copy.imagePreview = { name: copy.imagePreview.name, sizeLabel: copy.imagePreview.sizeLabel };
        }
        return copy;
      });
    window.localStorage.setItem(storageKeyFor(uid), JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function clearPersistedMessages(uid) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(storageKeyFor(uid));
  } catch {
    // ignore
  }
}
