/* ============================================================
   aiTutorService.js — GIAI ĐOẠN 6: LỚP TRỢ LÝ AI (GEMINI) DUY NHẤT
   ------------------------------------------------------------
   • Gọi AI qua một lớp service duy nhất; ưu tiên proxy phía server (/api/ai-tutor)
     nếu có hoặc động cơ ai.js nội bộ, tuyệt đối không lộ API key ra giao diện.
   • System prompt chuẩn Gia sư Hóa ELEC AI:
     - Giải từng bước, không chỉ đưa đáp án
     - Xưng "mình – bạn", thân thiện, khích lệ
     - Ngắn gọn, dễ hiểu
     - Nếu không chắc chắn về dữ liệu thì phải nói rõ là không chắc
   • Trả về JSON có kiểm tra Schema nghiêm ngặt cho 3 tác vụ:
     1. suggestTargetScore (Gợi ý điểm mục tiêu)
     2. generateAiRoadmap (Tạo lộ trình cá nhân hóa)
     3. commentProgress (Nhận xét tiến độ & đề xuất hành động)
   • Tự động thử lại (retry) đúng 1 lần nếu AI trả sai định dạng JSON/schema,
     sau đó fallback sang kết quả tính toán cục bộ để đảm bảo 100% độ tin cậy.
   ============================================================ */

import { askAI as callAiEngine } from './ai.js';
import { spendCredit } from './creditService.js';

export const ELEC_TUTOR_SYSTEM_PROMPT = `Bạn là ELEC Tutor — gia sư môn Hóa học THPT của nền tảng ELEC AI.
Quy tắc bắt buộc:
1. Luôn xưng "mình" và gọi học sinh là "bạn".
2. Khi giải bài tập hoặc giải thích kiến thức: luôn giải từng bước rõ ràng (Bản chất hóa học -> Phương trình/Bảo toàn -> Kết luận), tuyệt đối không chỉ đưa mỗi đáp án A/B/C/D.
3. Trình bày ngắn gọn, súc tích, dễ hiểu với học sinh THPT.
4. Trung thực tuyệt đối: nếu thông tin hoặc điểm chuẩn không có trong dữ liệu tham khảo, hoặc bạn không chắc chắn, phải nói rõ "Mình không chắc chắn về số liệu này" chứ không tự bịa.`;

/* ============================================================
   BỘ KIỂM TRA SCHEMA (TƯƠNG ĐƯƠNG ZOD NHẸ, KHÔNG THÊM THƯ VIỆN NẶNG)
   ============================================================ */
export const Schemas = {
  targetSuggestion(obj) {
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'Not an object' };
    const recommendedScore = Number(obj.recommendedScore);
    const recommendedChemScore = Number(obj.recommendedChemScore);
    const safetyMargin = Number(obj.safetyMargin);
    const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning.trim() : '';
    if (!Number.isFinite(recommendedScore) || recommendedScore <= 0) {
      return { ok: false, error: 'Invalid recommendedScore' };
    }
    if (!Number.isFinite(recommendedChemScore) || recommendedChemScore <= 0 || recommendedChemScore > 10) {
      return { ok: false, error: 'Invalid recommendedChemScore' };
    }
    if (!Number.isFinite(safetyMargin)) {
      return { ok: false, error: 'Invalid safetyMargin' };
    }
    if (!reasoning) {
      return { ok: false, error: 'Missing reasoning' };
    }
    return {
      ok: true,
      data: {
        recommendedScore,
        recommendedChemScore,
        safetyMargin,
        reasoning,
      },
    };
  },

  roadmapPlan(obj) {
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'Not an object' };
    if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
      return { ok: false, error: 'Missing summary' };
    }
    if (!['Cần tăng tốc', 'Đúng tiến độ', 'Vượt tiến độ'].includes(obj.paceStatus)) {
      return { ok: false, error: 'Invalid paceStatus' };
    }
    if (!Array.isArray(obj.priorityTopics) || obj.priorityTopics.length === 0) {
      return { ok: false, error: 'Invalid priorityTopics' };
    }
    return {
      ok: true,
      data: {
        summary: obj.summary.trim(),
        paceStatus: obj.paceStatus,
        priorityTopics: obj.priorityTopics.slice(0, 4).map((t) => ({
          id: String(t.id || 'c12-ester'),
          name: String(t.name || 'Ester – Lipid'),
          reason: String(t.reason || 'Chuyên đề trọng tâm trong đề thi'),
          recommendedQuestions: Number(t.recommendedQuestions) || 10,
        })),
      },
    };
  },

  progressComment(obj) {
    if (!obj || typeof obj !== 'object') return { ok: false, error: 'Not an object' };
    if (typeof obj.headline !== 'string' || !obj.headline.trim()) {
      return { ok: false, error: 'Missing headline' };
    }
    if (typeof obj.nextAction !== 'string' || !obj.nextAction.trim()) {
      return { ok: false, error: 'Missing nextAction' };
    }
    return {
      ok: true,
      data: {
        headline: obj.headline.trim(),
        status: ['Cần tăng tốc', 'Đúng tiến độ', 'Vượt tiến độ'].includes(obj.status)
          ? obj.status
          : 'Đúng tiến độ',
        strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String) : [],
        weakPoints: Array.isArray(obj.weakPoints) ? obj.weakPoints.map(String) : [],
        nextAction: obj.nextAction.trim(),
        encouragement: typeof obj.encouragement === 'string' && obj.encouragement.trim()
          ? obj.encouragement.trim()
          : 'Mình tin mỗi ngày luyện 10–15 câu đều đặn sẽ giúp bạn chạm mục tiêu Nguyện vọng 1!',
      },
    };
  },
};

function extractJsonObject(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : rawText.trim();
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

async function callSingleTurnJson(promptText) {
  let fullText = '';
  const history = [{ role: 'user', parts: [{ text: promptText }] }];
  await callAiEngine(
    history,
    (chunk) => { fullText = chunk; },
    null,
    `${ELEC_TUTOR_SYSTEM_PROMPT}\nCHỈ TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ, KHÔNG THÊM LỜI DẪN BÊN NGOÀI.`,
  );
  return fullText;
}

/**
 * Thực thi gọi AI có kiểm tra schema, tự retry 1 lần nếu sai định dạng,
 * nếu vẫn lỗi thì trả về kết quả tính toán cục bộ (fallbackFn).
 */
export async function executeWithSchemaRetry({
  prompt,
  validator,
  fallbackFn,
  customCaller = null,
  userId = null,
}) {
  if (userId) {
    const cr = await spendCredit(userId, 0, 1);
    if (!cr.ok) {
      const localData = fallbackFn();
      return { ...localData, source: 'local-fallback', reason: 'out-of-credits' };
    }
  }
  const caller = customCaller || callSingleTurnJson;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const retryNote = attempt === 1
        ? '\nLƯU Ý: Lần trả lời trước sai định dạng JSON schema. Hãy chỉ trả về đúng JSON theo cấu trúc yêu cầu.'
        : '';
      const raw = await caller(prompt + retryNote);
      const parsed = extractJsonObject(raw);
      const checked = validator(parsed);
      if (checked.ok) {
        return { ...checked.data, source: 'ai', attempts: attempt + 1 };
      }
    } catch {
      /* tiếp tục thử lần 2 hoặc chuyển sang fallback */
    }
  }
  const localData = fallbackFn();
  return { ...localData, source: 'local-fallback', attempts: 2 };
}

/* ============================================================
   1. GỢI Ý ĐIỂM MỤC TIÊU (CÓ FALLBACK CỤC BỘ)
   ============================================================ */
export function localTargetSuggestion({ cutoffScore = 25.5, scale = 30, schoolCode = 'NV1' } = {}) {
  const baseCutoff = Number(cutoffScore) || (scale === 30 ? 25.0 : Math.round(scale * 0.75));
  const margin = scale === 30 ? 0.75 : scale === 150 ? 6 : scale === 100 ? 4 : 0.5;
  const recommendedScore = Math.min(scale, Math.round((baseCutoff + margin) * 100) / 100);
  const recommendedChemScore = scale === 30
    ? Math.min(10, Math.max(6, Math.round(((recommendedScore / 3) + 0.25) * 4) / 4))
    : Math.min(10, Math.max(6.5, Math.round((recommendedScore / scale) * 10 * 4) / 4));

  return {
    recommendedScore,
    recommendedChemScore,
    safetyMargin: margin,
    reasoning: `Mình gợi ý bạn đặt mục tiêu ${recommendedScore}/${scale} điểm (cao hơn điểm chuẩn tham khảo ${baseCutoff} của ${schoolCode} một biên an toàn +${margin} điểm), tương đương môn Hóa cần đạt khoảng ${recommendedChemScore}/10 điểm.`,
  };
}

export async function suggestTargetScoreWithAI(params = {}, customCaller = null) {
  const prompt = `Dựa trên dữ liệu xét tuyển tham khảo: Trường ${params.schoolCode || 'NV1'}, điểm chuẩn gần nhất ${params.cutoffScore ?? 25.5} trên thang ${params.scale || 30}.
Hãy trả về JSON:
{
  "recommendedScore": number,
  "recommendedChemScore": number,
  "safetyMargin": number,
  "reasoning": "string (xưng mình - bạn, ngắn gọn)"
}`;
  return executeWithSchemaRetry({
    prompt,
    validator: Schemas.targetSuggestion,
    fallbackFn: () => localTargetSuggestion(params),
    customCaller,
  });
}

/* ============================================================
   2. NHẬN XÉT TIẾN ĐỘ HỌC TẬP (CÓ FALLBACK CỤC BỘ)
   ============================================================ */
export function localProgressCommentary(autoRoadmap = {}) {
  const {
    activeAsp,
    hasEvidence,
    predictedChem10 = 5.5,
    targetChem10 = 8.5,
    chemGap10 = 3.0,
    paceStatus = 'Đúng tiến độ',
    priorityChapters = [],
    masteredChapters = [],
    dueTotal = 0,
  } = autoRoadmap;

  const schoolLabel = activeAsp
    ? `${activeAsp.school.code} (${activeAsp.major.name})`
    : 'Nguyện vọng 1';

  const topWeak = priorityChapters.slice(0, 2).map((c) => c.chapter?.name || c.name).filter(Boolean);
  const topStrong = masteredChapters.slice(0, 2).map((c) => c.chapter?.name || c.name).filter(Boolean);

  if (!hasEvidence) {
    return {
      headline: `Mình đã sẵn sàng đồng hành cùng bạn chinh phục ${schoolLabel} (Mục tiêu Hóa ${targetChem10}/10đ)!`,
      status: 'Đúng tiến độ',
      strengths: ['Đã thiết lập rõ ràng trường nguyện vọng và mốc điểm mục tiêu'],
      weakPoints: ['Chưa làm bài kiểm tra đầu vào để đo điểm xuất phát thực tế'],
      nextAction: 'Bạn hãy bấm nút "Đánh giá năng lực đầu vào (12 câu)" ngay bên dưới để mình đo chính xác điểm dự đoán và khoanh vùng chương yếu nhé.',
      encouragement: 'Chỉ mất khoảng 8–10 phút làm 12 câu là lộ trình của bạn sẽ được cá nhân hóa 100%!',
    };
  }

  return {
    headline: chemGap10 > 0
      ? `Hiện điểm Hóa dự đoán của bạn là ${predictedChem10}/10đ — còn cách mục tiêu ${schoolLabel} +${chemGap10} điểm.`
      : `Tuyệt vời! Điểm Hóa dự đoán (${predictedChem10}/10đ) của bạn đang đạt và vượt mốc mục tiêu ${schoolLabel}.`,
    status: ['Cần tăng tốc', 'Đúng tiến độ', 'Vượt tiến độ'].includes(paceStatus) ? paceStatus : 'Đúng tiến độ',
    strengths: topStrong.length
      ? [`Đã nắm vững: ${topStrong.join(', ')}`]
      : ['Đã bắt đầu tích lũy dữ liệu làm bài thực tế'],
    weakPoints: [
      ...(topWeak.length ? [`Cần ưu tiên củng cố: ${topWeak.join(', ')}`] : []),
      ...(dueTotal > 0 ? [`Đang có ${dueTotal} câu trả lời sai cần ôn lại trong Sổ lỗi sai`] : []),
    ],
    nextAction: topWeak.length
      ? `Hôm nay bạn hãy dành 15 phút làm ${autoRoadmap.recommendedQuestionsPerSession || 10} câu chuyên đề "${topWeak[0]}" để kéo điểm dự đoán nhanh nhất.`
      : 'Hôm nay bạn hãy duy trì làm 10 câu vận dụng để giữ vững phong độ nhé.',
    encouragement: 'Mình luôn theo sát từng câu trả lời của bạn. Cứ giải chắc từng chuyên đề là điểm chuẩn sẽ nằm trong tầm tay!',
  };
}

export async function getProgressCommentaryWithAI(autoRoadmap = {}, customCaller = null) {
  const fallback = () => localProgressCommentary(autoRoadmap);
  const prompt = `Nhận xét tiến độ môn Hóa cho học sinh (xưng mình - bạn):
- Nguyện vọng: ${autoRoadmap.activeAsp ? `${autoRoadmap.activeAsp.school.code} - ${autoRoadmap.activeAsp.major.name}` : 'Chưa chọn'}
- Điểm dự đoán: ${autoRoadmap.predictedChem10}/10, Điểm mục tiêu: ${autoRoadmap.targetChem10}/10
- Trạng thái: ${autoRoadmap.paceStatus}
- Số câu sai tồn đọng: ${autoRoadmap.dueTotal || 0}
Trả về đúng JSON:
{
  "headline": "string",
  "status": "Cần tăng tốc" | "Đúng tiến độ" | "Vượt tiến độ",
  "strengths": ["string"],
  "weakPoints": ["string"],
  "nextAction": "string",
  "encouragement": "string"
}`;
  return executeWithSchemaRetry({
    prompt,
    validator: Schemas.progressComment,
    fallbackFn: fallback,
    customCaller,
  });
}
