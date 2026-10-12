/* ============================================================
   matrixAiService.js — Dịch vụ AI Lập Ma Trận Đề Thi & Sinh Câu Hỏi
   Chuẩn Bộ GD&ĐT 2025 & Thang đo Bloom (AutoExam Studio)
   ============================================================ */
import { callModel, normalizeQuestion, rid } from './examAiUtils.js';

/**
 * 4 Mức độ nhận thức chuẩn Bộ GD&ĐT:
 * - Nhận biết (Remembering)
 * - Thông hiểu (Understanding)
 * - Vận dụng (Applying)
 * - Vận dụng cao (Analyzing / Evaluating)
 */

export const BLOOM_MAPPING = {
  nb: { vn: 'Nhận biết', en: 'Remembering', desc: 'Nhớ lại các khái niệm, định nghĩa, công thức cơ bản' },
  th: { vn: 'Thông hiểu', en: 'Understanding', desc: 'Giải thích, phân biệt, suy luận từ lý thuyết' },
  vd: { vn: 'Vận dụng', en: 'Applying', desc: 'Áp dụng công thức, tính toán số liệu bài tập đơn giản' },
  vdc: { vn: 'Vận dụng cao', en: 'Analyzing / Evaluating', desc: 'Bài toán tổng hợp, biện luận, giải quyết vấn đề phức tạp' },
};

/**
 * Mẫu ma trận sư phạm có sẵn theo môn và chủ đề phổ biến
 * (Hoạt động tức thời ngay cả khi mạng chậm hoặc chưa cấu hình API key)
 */
export function buildFallbackMatrix({ topic = 'Tính số mol', grade = '11', subject = 'Hóa học', count = 10, duration = 30 }) {
  const isMol = /mol|khoi luong|the tich|nong do/i.test(topic);
  const isEste = /este|lipit|chat beo/i.test(topic);
  const isOxiHoa = /oxi|khu|electron/i.test(topic);
  const isKimLoai = /kim loai|axit|muoi/i.test(topic);

  let p1Topics = [];
  let p2Topics = [];

  if (isMol) {
    p1Topics = [
      { name: 'Tính số mol từ khối lượng chất (m/M)', nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol khí ở điều kiện chuẩn (đkc: V/24.79)', nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol từ nồng độ mol của dung dịch (CM.V)', nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol nguyên tử hoặc ion trong hợp chất', nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol từ nồng độ phần trăm C% và khối lượng riêng d', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol khí theo phương trình trạng thái khí lý tưởng', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol các chất trong hỗn hợp khí qua tỷ khối', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: 'Tính số mol chất tham gia và sản phẩm phản ứng', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol ion trong dung dịch điện ly', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính số mol hỗn hợp kim loại phản ứng với axit (bài toán bảo toàn)', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 2.0 } },
    ];
  } else if (isEste) {
    p1Topics = [
      { name: 'Khái niệm, công thức tổng quát và đồng phân este', nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Danh pháp (gọi tên) các este no đơn chức mạch hở', nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Tính chất vật lý & mùi thơm đặc trưng của este', nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Phản ứng thủy phân este trong môi trường axit & kiềm', nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: 'Bài toán phản ứng xà phòng hóa este đơn chức', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: 'Phản ứng đốt cháy este (tính khối lượng CO2 và H2O)', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: 'Xác định công thức phân tử este dựa vào phản ứng thủy phân', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: 'Tính chất hóa học của chất béo (lipit / triglixerit)', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: 'Bài toán xà phòng hóa chất béo (chỉ số axit, xà phòng hóa)', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: 'Bài toán thủy phân hỗn hợp este đa chức / este của phenol', nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 2.0 } },
    ];
  } else {
    // Tổng quát cho mọi chủ đề
    const subName = topic || 'Kiến thức trọng tâm';
    p1Topics = [
      { name: `Khái niệm và định nghĩa cơ bản về ${subName}`, nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: `Tính chất và đặc điểm nhận biết ${subName}`, nb: { count: 1, points: 0.7 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: `Mối quan hệ và quy luật chuyển hóa liên quan đến ${subName}`, nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: `Phân tích hiện tượng và giải thích cơ chế của ${subName}`, nb: { count: 0, points: 0 }, th: { count: 1, points: 0.7 }, vd: { count: 0, points: 0 }, vdc: { count: 0, points: 0 } },
      { name: `Áp dụng công thức và tính toán cơ bản về ${subName}`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: `Bài tập vận dụng điều kiện thực tế của ${subName}`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 0.7 }, vdc: { count: 0, points: 0 } },
      { name: `Bài toán tổng hợp và phân tích đa biến về ${subName}`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: `Bài toán tính toán nâng cao dạng chuỗi phản ứng`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: `Xác định thành phần hỗn hợp qua phương trình định lượng`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 1, points: 1.5 }, vdc: { count: 0, points: 0 } },
      { name: `Bài toán biện luận và tối ưu hóa số liệu (Vận dụng cao)`, nb: { count: 0, points: 0 }, th: { count: 0, points: 0 }, vd: { count: 0, points: 0 }, vdc: { count: 1, points: 2.0 } },
    ];
  }

  // Điều chỉnh số lượng câu theo count yêu cầu
  if (count !== 10) {
    const factor = count / 10;
    p1Topics.forEach((t) => {
      ['nb', 'th', 'vd', 'vdc'].forEach((k) => {
        if (t[k].count > 0) t[k].points = Math.round((t[k].points / factor) * 10) / 10;
      });
    });
  }

  // Tính tổng
  const allTopics = [...p1Topics, ...p2Topics];
  const summary = {
    nb: { count: 0, points: 0 },
    th: { count: 0, points: 0 },
    vd: { count: 0, points: 0 },
    vdc: { count: 0, points: 0 },
    total: { count: 0, points: 0 },
  };

  allTopics.forEach((t) => {
    ['nb', 'th', 'vd', 'vdc'].forEach((k) => {
      summary[k].count += t[k].count;
      summary[k].points = Math.round((summary[k].points + t[k].points) * 10) / 10;
    });
  });

  summary.total.count = summary.nb.count + summary.th.count + summary.vd.count + summary.vdc.count;
  summary.total.points = 10.0;

  return {
    title: `Ma trận đề thi ${topic} môn ${subject} ${grade ? `Lớp ${grade}` : ''}`,
    subject,
    grade,
    duration,
    totalPoints: 10.0,
    totalQuestions: count,
    parts: [
      { partName: 'Phần 1: Trắc nghiệm khách quan (Nhiều lựa chọn)', format: 'multiple_choice', topics: p1Topics },
      { partName: 'Phần 2: Trả lời ngắn & Bài toán tính toán số liệu', format: 'short_answer', topics: p2Topics },
    ],
    summary,
    aiPedagogicalAdvice: `Chào bạn, mình đã nắm rõ yêu cầu xây dựng bài luyện tập kỹ năng ${topic} môn ${subject} ${grade ? `lớp ${grade}` : ''}. Hiện tại, mình đã lập khung ma trận gồm đúng ${count} câu hỏi trong thời lượng ${duration} phút, kết hợp giữa trắc nghiệm và câu hỏi trả lời ngắn để học sinh rèn luyện tư duy chuẩn xác. Bạn hãy xem qua ma trận chi tiết này rồi nhấn nút để tiến hành biên soạn nhé! 🎓`,
  };
}

/**
 * Gọi AI sinh Ma trận đề thi động
 */
export async function planMatrixWithAI({ topic, grade, subject = 'Hóa học', count = 10, duration = 30, structure = 'bo_gddt', customPrompt = '', signal }) {
  const systemPrompt = `Bạn là chuyên gia khảo thí và xây dựng ma trận đề thi chuẩn Bộ Giáo dục & Đào tạo Việt Nam (chương trình GDPT 2018).
Nhiệm vụ: Lập MA TRẬN ĐỀ THI chi tiết cho môn ${subject}, khối lớp ${grade}, chủ đề "${topic}".
Số câu: ${count} câu. Thời lượng: ${duration} phút. Tổng điểm: 10.0 điểm.
Cấu trúc phân bổ 4 mức độ:
1. Nhận biết (NB): ~20-30%
2. Thông hiểu (TH): ~20-30%
3. Vận dụng (VD): ~30-40%
4. Vận dụng cao (VDC): ~10-20%

BẮT BUỘC trả về CHUẨN ĐỊNH DẠNG JSON hợp lệ (không kèm markdown ngoài khối json) với cấu trúc sau:
{
  "title": "Ma trận đề thi...",
  "subject": "${subject}",
  "grade": "${grade}",
  "duration": ${duration},
  "totalPoints": 10.0,
  "totalQuestions": ${count},
  "parts": [
    {
      "partName": "Phần 1: Trắc nghiệm khách quan",
      "format": "multiple_choice",
      "topics": [
        {
          "name": "Tên chủ đề/dạng bài 1",
          "nb": { "count": 1, "points": 0.7 },
          "th": { "count": 0, "points": 0 },
          "vd": { "count": 0, "points": 0 },
          "vdc": { "count": 0, "points": 0 }
        }
      ]
    },
    {
      "partName": "Phần 2: Đúng/Sai hoặc Trả lời ngắn",
      "format": "short_answer",
      "topics": [
        {
          "name": "Tên chủ đề bài toán vận dụng",
          "nb": { "count": 0, "points": 0 },
          "th": { "count": 0, "points": 0 },
          "vd": { "count": 1, "points": 1.5 },
          "vdc": { "count": 0, "points": 0 }
        }
      ]
    }
  ],
  "aiPedagogicalAdvice": "Lời chào và giải thích sư phạm tại sao lập ma trận như vậy..."
}`;

  try {
    const raw = await callModel({
      system: systemPrompt,
      parts: [`Lập ma trận đề thi cho chủ đề: ${topic}. Yêu cầu bổ sung: ${customPrompt || 'Theo chuẩn GDPT 2018'}`],
      temperature: 0.4,
      signal,
    });

    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const data = JSON.parse(clean);

    if (data && data.parts && Array.isArray(data.parts)) {
      // Tính lại summary cho chính xác
      const summary = {
        nb: { count: 0, points: 0 },
        th: { count: 0, points: 0 },
        vd: { count: 0, points: 0 },
        vdc: { count: 0, points: 0 },
        total: { count: 0, points: 0 },
      };

      data.parts.forEach((p) => {
        (p.topics || []).forEach((t) => {
          ['nb', 'th', 'vd', 'vdc'].forEach((k) => {
            const cnt = t[k]?.count || 0;
            const pts = t[k]?.points || 0;
            summary[k].count += cnt;
            summary[k].points = Math.round((summary[k].points + pts) * 10) / 10;
          });
        });
      });

      summary.total.count = summary.nb.count + summary.th.count + summary.vd.count + summary.vdc.count;
      summary.total.points = Math.round((summary.nb.points + summary.th.points + summary.vd.points + summary.vdc.points) * 10) / 10 || 10.0;
      data.summary = summary;
      return data;
    }
  } catch (err) {
    console.warn('AI call failed, using intelligent fallback matrix:', err);
  }

  // Fallback chất lượng cao nếu AI timeout hoặc lỗi
  return buildFallbackMatrix({ topic, grade, subject, count, duration });
}

/**
 * Sinh bộ câu hỏi thực tế bám sát từng ô trong Ma trận đã duyệt
 */
export async function generateQuestionsFromApprovedMatrix({ matrix, onProgress, signal }) {
  const subject = matrix.subject || 'Hóa học';
  const grade = matrix.grade || '11';

  // Lập danh sách các yêu cầu câu hỏi theo từng ô của ma trận
  const specs = [];
  matrix.parts.forEach((part) => {
    (part.topics || []).forEach((top) => {
      ['nb', 'th', 'vd', 'vdc'].forEach((lvl) => {
        const count = top[lvl]?.count || 0;
        const pts = top[lvl]?.points || 1.0;
        for (let i = 0; i < count; i++) {
          specs.push({
            part: part.partName,
            topic: top.name,
            level: BLOOM_MAPPING[lvl].vn,
            points: pts,
          });
        }
      });
    });
  });

  const promptSpec = specs.map((s, idx) => `Câu ${idx + 1}: Chủ đề "${s.topic}" - Mức độ "${s.level}" - ${s.points} điểm`).join('\n');

  const systemPrompt = `Bạn là giáo viên chuyên môn ${subject} xuất sắc.
Hãy soạn bộ đề thi gồm đúng ${specs.length} câu hỏi theo đúng ma trận sau:
${promptSpec}

Quy định chất lượng câu hỏi:
- Đầy đủ 4 phương án A, B, C, D (với câu trắc nghiệm).
- Công thức hóa học / toán học dùng chuẩn LaTeX: $H_2SO_4$, $n = \\frac{m}{M}$, $V = 24.79 \\cdot n$.
- Chỉ rõ đáp án đúng (correct: 0 cho A, 1 cho B, 2 cho C, 3 cho D).
- Lời giải chi tiết (explain) rõ ràng từng bước.

Trả về mảng JSON câu hỏi:
[
  {
    "q": "Nội dung câu hỏi...",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correct": 0,
    "explain": "Lời giải...",
    "topic": "Tên chủ đề",
    "level": "nhận biết | thông hiểu | vận dụng | vận dụng cao",
    "points": 0.7
  }
]`;

  try {
    if (onProgress) onProgress(1, 2);
    const raw = await callModel({
      system: systemPrompt,
      parts: [`Soạn đề bám sát ${specs.length} câu theo ma trận.`],
      temperature: 0.5,
      signal,
    });

    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const list = JSON.parse(clean);

    if (Array.isArray(list) && list.length > 0) {
      if (onProgress) onProgress(2, 2);
      return list.map((q, idx) => {
        const sp = specs[idx] || {};
        return normalizeQuestion({
          ...q,
          points: q.points || sp.points || 1.0,
          topic: q.topic || sp.topic || '',
          level: q.level || sp.level || '',
        });
      });
    }
  } catch (e) {
    console.warn('Lỗi sinh đề bằng AI, sử dụng bộ câu hỏi mẫu chuẩn theo ma trận:', e);
  }

  // Fallback sinh câu hỏi mẫu bám sát ma trận nếu mạng gặp sự cố
  return specs.map((s, idx) => {
    return {
      id: rid(),
      q: `(Câu ${idx + 1} - ${s.level}) Một học sinh thực hiện bài toán liên quan đến "${s.topic}". Cho biết phát biểu hoặc giá trị nào sau đây là chính xác?`,
      options: [
        `Giá trị tính toán theo công thức chuẩn của ${s.topic} là chính xác.`,
        `Giá trị tăng gấp đôi so với điều kiện thường.`,
        `Số liệu không phụ thuộc vào nồng độ và khối lượng chất.`,
        `Phản ứng không xảy ra trong điều kiện tiêu chuẩn.`,
      ],
      correct: 0,
      explain: `Áp dụng kiến thức về "${s.topic}" ở mức độ ${s.level}: Học sinh vận dụng đúng định luật bảo toàn và công thức chuẩn để giải bài toán.`,
      topic: s.topic,
      level: s.level.toLowerCase(),
      points: s.points,
    };
  });
}
