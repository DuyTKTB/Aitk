/* ============================================================
   insightAi.js — Dịch vụ Phân Tích Sư Phạm ELEC AI
   Chuyển đổi dữ liệu bài thi thành giải pháp giảng dạy cụ thể
   Chuẩn GDPT 2018 (Phân tích lỗi sai, Kế hoạch tiết tới, Đề ôn bù hổng)
   ============================================================ */

import { callModel, parseJsonLoose } from './examAiUtils.js';

const cacheMap = new Map();

/**
 * Tạo cache key từ đặc trưng dữ liệu lớp
 */
function makeCacheKey(className, data) {
  const tKey = (data?.weakestTopics || []).map((t) => `${t.topic}:${t.rate}`).join('|');
  const hKey = (data?.hardest || []).slice(0, 3).map((q) => `${q.index}:${q.rate}`).join('|');
  return `${className || 'class'}#${data?.submissionCount || 0}#${data?.avgPct || 0}#${data?.passRate || 0}#${tKey}#${hKey}`;
}

/**
 * Fallback tạo nhận xét tự động khi chưa có API key hoặc mạng gián đoạn
 */
function buildAlgorithmicFallback(insightsData, className = 'Lớp') {
  const avg = insightsData.avgPct ?? 0;
  const pass = insightsData.passRate ?? 0;
  const weakest = insightsData.weakestTopics || [];
  const hardest = insightsData.hardest || [];
  const atRiskCount = (insightsData.atRisk || []).length;

  const topWeakTopic = weakest[0]?.topic || 'Kiến thức trọng tâm';
  const secondWeakTopic = weakest[1]?.topic || 'Kỹ năng vận dụng bài tập';

  const causes = [];
  if (weakest.length > 0) {
    causes.push({
      topic: topWeakTopic,
      cause: `Tỷ lệ làm đúng chỉ đạt ${weakest[0].rate || 0}%. Học sinh có xu hướng nhầm lẫn giữa định nghĩa cơ bản và biến thể thực hành.`,
      severity: 'high',
    });
  }
  if (weakest.length > 1) {
    causes.push({
      topic: secondWeakTopic,
      cause: `Học sinh gặp khó khăn ở các bước suy luận trung gian và tốc độ tính toán chưa tối ưu.`,
      severity: 'medium',
    });
  }
  if (hardest.length > 0) {
    causes.push({
      topic: 'Các câu phân loại nâng cao',
      cause: `Tỉ lệ đúng ở câu khó nhất chỉ ${hardest[0].rate || 0}%. Học sinh bị bẫy ở các phương án nhiễu có độ tương đồng cao.`,
      severity: 'low',
    });
  }

  const actions = [
    {
      action: `Dành 10 phút đầu tiết học tới chữa chi tiết các phương án nhiễu của chuyên đề "${topWeakTopic}".`,
      target: 'Toàn bộ lớp học',
      timeframe: 'Ngay tiết tới',
    },
  ];

  if (atRiskCount > 0) {
    actions.push({
      action: `Mở quyền nộp bổ sung/thi lại có giới hạn thời gian cho ${atRiskCount} học sinh dưới 50% điểm.`,
      target: `${atRiskCount} học sinh cần trợ giúp`,
      timeframe: 'Trong tuần này',
    });
  }

  actions.push({
    action: `Giao bộ đề luyện tập ngắn (8–12 câu) tập trung vào mức Nhận biết và Thông hiểu để củng cố nền tảng.`,
    target: 'Nhóm học sinh trung bình & khá',
    timeframe: 'Bài tập về nhà',
  });

  return {
    isAiGenerated: false,
    headline: avg >= 75
      ? `Lớp ${className} nắm chắc kiến thức nền (${avg}%), cần mài giũa câu vận dụng`
      : avg >= 50
        ? `Lớp ${className} đạt chuẩn cơ bản (${avg}%), cần khắc phục điểm hổng chuyên đề "${topWeakTopic}"`
        : `Lớp ${className} cần củng cố gấp (${avg}%), ưu tiên bù đắp ${atRiskCount} học sinh yếu`,
    summary: insightsData.submissionCount > 0
      ? `Dựa trên phân tích ${insightsData.submissionCount} bài nộp: Điểm trung bình toàn lớp đạt ${avg}%, tỷ lệ đạt chuẩn (≥5.0) là ${pass}%. Điểm yếu lớn nhất tập trung ở chuyên đề "${topWeakTopic}" (${weakest[0]?.rate || 0}% đúng).`
      : 'Lớp chưa có đủ dữ liệu bài nộp để đưa ra đánh giá toàn diện. Khuyến nghị tạo một bài khảo sát ngắn để phân loại học lực.',
    causes,
    actions,
    nextLessonPlan: {
      focus: `Giải mã 2 bẫy lý thuyết phổ biến nhất trong "${topWeakTopic}"`,
      quickActivity: 'Kiểm tra miệng nhanh 3 phút hoặc mini-quiz 3 câu trắc nghiệm đầu giờ',
      keyQuestionType: 'Câu hỏi phân biệt khái niệm và bài toán 2 bước phản ứng/tính toán',
    },
    suggestedRemedialPlan: {
      title: `Đề ôn tập củng cố chuyên đề ${topWeakTopic}`,
      topics: [topWeakTopic, secondWeakTopic].filter(Boolean),
      questionCount: 10,
      difficultyRatio: '60% Nhận biết & Thông hiểu, 40% Vận dụng',
    },
  };
}

/**
 * Gọi Gemini AI phân tích sư phạm chuyên sâu từ dữ liệu bài nộp thật
 */
export async function generatePedagogicalInsights({
  insightsData,
  className = 'Lớp học',
  subject = 'Hóa học',
  forceRefresh = false,
  signal,
} = {}) {
  if (!insightsData || !insightsData.submissionCount) {
    return buildAlgorithmicFallback(insightsData || {}, className);
  }

  const cacheKey = makeCacheKey(className, insightsData);
  if (!forceRefresh && cacheMap.has(cacheKey)) {
    return cacheMap.get(cacheKey);
  }

  const weakSummary = (insightsData.weakestTopics || [])
    .map((t) => `- Chuyên đề "${t.topic}": ${t.rate}% học sinh làm đúng (trên ${t.rated} lượt kiểm tra)`)
    .join('\n');

  const hardSummary = (insightsData.hardest || [])
    .slice(0, 4)
    .map((q, idx) => `- Câu #${idx + 1} (${q.topic}): tỉ lệ đúng ${q.rate}% | Nội dung vắn tắt: "${q.text?.slice(0, 90) || '...'}"`)
    .join('\n');

  const atRiskCount = (insightsData.atRisk || []).length;

  const prompt = `Bạn là Chuyên gia Khảo thí và Phương pháp Dạy học môn ${subject} THPT theo chương trình GDPT 2018.
Hãy phân tích dữ liệu kết quả thi thật của ${className} dưới đây và đưa ra nhận xét sư phạm sắc bén, thực tế, mang tính hành động cao:

DỮ LIỆU ĐÁNH GIÁ THỰC TẾ:
- Lớp: ${className}
- Môn học: ${subject}
- Tổng số bài kiểm tra đã nộp: ${insightsData.submissionCount}
- Điểm trung bình toàn lớp: ${insightsData.avgPct}%
- Tỷ lệ đạt chuẩn (≥ 5.0 điểm): ${insightsData.passRate}%
- Xếp loại năng lực lớp: ${insightsData.health?.grade || '—'} (${insightsData.health?.label || '—'})
- Số học sinh cần phụ đạo (< 50% điểm): ${atRiskCount} học sinh

CHUYÊN ĐỀ HỌC SINH SAI NHIỀU NHẤT:
${weakSummary || 'Không có chuyên đề nổi bật'}

DANH SÁCH CÂU HỎI TỈ LỆ ĐÚNG THẤP NHẤT:
${hardSummary || 'Không có câu hỏi nổi bật'}

YÊU CẦU:
Xuất kết quả duy nhất ở định dạng JSON hợp lệ (không kèm markdown ngoài mã json), cấu trúc chính xác:
{
  "headline": "Tiêu đề cô đọng, sắc sảo (dưới 15 từ) tóm lược chính xác tình trạng lớp",
  "summary": "Đoạn nhận xét sư phạm 2-3 câu vừa đánh giá trung thực vừa động viên thầy cô và học trò",
  "causes": [
    {
      "topic": "Tên chuyên đề",
      "cause": "Nguyên nhân cốt lõi học sinh hay mắc lỗi (phân tích tâm lý làm bài, bẫy trắc nghiệm)",
      "severity": "high" hoặc "medium" hoặc "low"
    }
  ],
  "actions": [
    {
      "action": "Giải pháp hành động cụ thể, chi tiết cho giáo viên",
      "target": "Đối tượng áp dụng (Toàn lớp / Nhóm cần kèm / Nhóm giỏi)",
      "timeframe": "Thời điểm thực hiện (Tiết tới / Trong tuần / Bài về nhà)"
    }
  ],
  "nextLessonPlan": {
    "focus": "Trọng tâm cần giải quyết trong 10-15 phút đầu tiết tiếp theo",
    "quickActivity": "Hoạt động hoặc trò chơi/quiz khởi động gợi ý",
    "keyQuestionType": "Dạng bài tập then chốt cần cho luyện lại"
  },
  "suggestedRemedialPlan": {
    "title": "Tên đề ôn luyện bù hổng kiến thức đề xuất",
    "topics": ["Chuyên đề 1", "Chuyên đề 2"],
    "questionCount": 10,
    "difficultyRatio": "Tỷ lệ phân bố mức độ nhận thức (VD: 50% NB - 30% TH - 20% VD)"
  }
}`;

  try {
    const raw = await callModel({
      system: `Bạn là trợ lý AI sư phạm cao cấp cho giáo viên ELEC AI. Phân tích sư phạm phải chuẩn GDPT 2018, ngôn ngữ chuẩn mực giáo dục Việt Nam, đi thẳng vào giải pháp thực hành trên lớp. Luôn trả về JSON hợp lệ.`,
      parts: [{ text: prompt }],
      temperature: 0.4,
      signal,
    });

    const parsed = parseJsonLoose(raw);
    const result = {
      ...parsed,
      isAiGenerated: true,
      generatedAt: Date.now(),
    };

    cacheMap.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[insightAi] Không gọi được AI, dùng fallback thuật toán:', err.message);
    const fallback = buildAlgorithmicFallback(insightsData, className);
    return fallback;
  }
}
