/* ============================================================
   matrixAiService.js — Lập ma trận & sinh đề (GDPT 2018 / Bộ GD&ĐT)
   Dùng callModel + parseJsonLoose của examAiUtils.
   ============================================================ */
import {
  callModel,
  parseJsonLoose,
  normalizeQuestion,
  shuffleOptions,
  rid,
} from './examAiUtils.js';
import { buildFileContext } from './fileReader.js';

export const BLOOM_MAPPING = {
  nb: { vn: 'Nhận biết', en: 'Remembering', desc: 'Nhớ khái niệm, định nghĩa, công thức' },
  th: { vn: 'Thông hiểu', en: 'Understanding', desc: 'Giải thích, phân biệt, suy luận' },
  vd: { vn: 'Vận dụng', en: 'Applying', desc: 'Áp dụng công thức, tính toán một bước' },
  vdc: { vn: 'Vận dụng cao', en: 'Analyzing', desc: 'Tổng hợp, biện luận, nhiều bước' },
};

const LEVEL_KEYS = ['nb', 'th', 'vd', 'vdc'];
const GEN_BATCH = 6;

export function emptyLevel() {
  return { count: 0, points: 0 };
}

function asLevel(v) {
  const count = Math.max(0, Math.round(Number(v?.count) || 0));
  const points = Math.max(0, Number(v?.points) || 0);
  return { count, points: Math.round(points * 10) / 10 };
}

export function summarizeMatrix(matrix) {
  const summary = {
    nb: emptyLevel(),
    th: emptyLevel(),
    vd: emptyLevel(),
    vdc: emptyLevel(),
    total: emptyLevel(),
  };
  (matrix.parts || []).forEach((p) => {
    (p.topics || []).forEach((t) => {
      LEVEL_KEYS.forEach((k) => {
        const lv = asLevel(t[k]);
        t[k] = lv;
        summary[k].count += lv.count;
        summary[k].points = Math.round((summary[k].points + lv.points) * 10) / 10;
      });
    });
  });
  summary.total.count = LEVEL_KEYS.reduce((a, k) => a + summary[k].count, 0);
  summary.total.points = Math.round(LEVEL_KEYS.reduce((a, k) => a + summary[k].points, 0) * 10) / 10 || 10;
  return summary;
}

/** Phân bổ lại số câu cho khớp count, giữ tỷ lệ NB/TH/VD/VDC. */
export function scaleMatrixToCount(matrix, targetCount) {
  const n = Math.max(4, Math.min(60, Number(targetCount) || 10));
  const summary = summarizeMatrix(matrix);
  const current = summary.total.count || 1;
  if (current === n) {
    matrix.summary = summary;
    matrix.totalQuestions = n;
    return matrix;
  }

  const cells = [];
  (matrix.parts || []).forEach((part, pi) => {
    (part.topics || []).forEach((top, ti) => {
      LEVEL_KEYS.forEach((k) => {
        const c = top[k]?.count || 0;
        if (c > 0) cells.push({ pi, ti, k, count: c, points: top[k].points || 0 });
      });
    });
  });
  if (!cells.length) {
    matrix.summary = summary;
    matrix.totalQuestions = n;
    return matrix;
  }

  const scaled = cells.map((c) => ({
    ...c,
    count: Math.max(0, Math.round((c.count / current) * n)),
  }));
  let diff = n - scaled.reduce((a, c) => a + c.count, 0);
  let i = 0;
  while (diff !== 0 && scaled.length) {
    const cell = scaled[i % scaled.length];
    if (diff > 0) {
      cell.count += 1;
      diff -= 1;
    } else if (cell.count > 0) {
      cell.count -= 1;
      diff += 1;
    }
    i += 1;
    if (i > 400) break;
  }

  (matrix.parts || []).forEach((part) => {
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((k) => { top[k] = { count: 0, points: 0 }; });
    });
  });
  scaled.forEach((c) => {
    const top = matrix.parts[c.pi]?.topics?.[c.ti];
    if (!top) return;
    const ptsEach = c.count ? Math.round(((c.points || 0.7) / Math.max(1, c.count === 0 ? 1 : (cells.find((x) => x.pi === c.pi && x.ti === c.ti && x.k === c.k)?.count || 1))) * 10) / 10 : 0;
    top[c.k] = {
      count: c.count,
      points: Math.round((0.7 * c.count) * 10) / 10 || ptsEach,
    };
  });

  const sum = summarizeMatrix(matrix);
  const pointTarget = 10;
  const rawPts = sum.total.points || 1;
  (matrix.parts || []).forEach((part) => {
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((k) => {
        if (top[k].count > 0) {
          top[k].points = Math.round((top[k].points / rawPts) * pointTarget * 10) / 10;
        }
      });
    });
  });
  matrix.summary = summarizeMatrix(matrix);
  matrix.totalQuestions = n;
  matrix.totalPoints = 10;
  return matrix;
}

export function flattenMatrixSpecs(matrix) {
  const specs = [];
  (matrix.parts || []).forEach((part) => {
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((lvl) => {
        const count = top[lvl]?.count || 0;
        const pts = top[lvl]?.points || 0.7;
        const each = count ? Math.round((pts / count) * 10) / 10 : 0.7;
        for (let i = 0; i < count; i++) {
          specs.push({
            part: part.partName,
            format: part.format || 'multiple_choice',
            topic: top.name,
            levelKey: lvl,
            level: BLOOM_MAPPING[lvl].vn,
            points: each || 0.7,
          });
        }
      });
    });
  });
  return specs;
}

export function buildFallbackMatrix({
  topic = 'Tính số mol',
  grade = '11',
  subject = 'Hóa học',
  count = 10,
  duration = 30,
  intent = 'exam',
} = {}) {
  const t = String(topic || '');
  const isMol = /mol|khối lượng|the tich|nồng độ|nong do/i.test(t);
  const isEste = /este|lipit|chất béo|chat beo/i.test(t);
  const isRedox = /oxi hóa|oxi hoa|khử|electron|số oxi hóa/i.test(t);

  let p1Topics;
  let p2Topics;
  if (isMol) {
    p1Topics = [
      { name: 'Tính n = m/M từ khối lượng và khối lượng mol', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Số mol khí ở điều kiện chuẩn (V/22,4 hoặc 24,79)', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Số mol từ nồng độ mol (n = CM·V)', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Số mol nguyên tử / ion trong hợp chất', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Đổi C% và khối lượng riêng sang số mol', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Khí lý tưởng pV = nRT', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Hỗn hợp khí, tỷ khối, thành phần mol', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: 'Số mol chất trong PTHH (hệ số tỷ lượng)', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Ion trong dung dịch điện li', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Bảo toàn nguyên tố / electron với hỗn hợp kim loại', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 2.0 } },
    ];
  } else if (isEste) {
    p1Topics = [
      { name: 'Công thức tổng quát và đồng phân este', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Danh pháp este no đơn chức mạch hở', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Tính chất vật lý, mùi đặc trưng', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Thủy phân este trong axit và kiềm', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Xà phòng hóa este đơn chức', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Đốt cháy este: CO2, H2O', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Xác định CTPT este từ thủy phân', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: 'Tính chất hóa học của chất béo', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Chỉ số axit / xà phòng hóa', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Hỗn hợp este đa chức / este phenol', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 2.0 } },
    ];
  } else if (isRedox) {
    p1Topics = [
      { name: 'Số oxi hóa và quy tắc tính', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Nhận biết chất oxi hóa / chất khử', nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Cân bằng electron trong PTHH', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Dãy hoạt động kim loại và khả năng khử', nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: 'Bài toán oxi hóa – khử một chất', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Hiệu suất phản ứng oxi hóa – khử', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: 'Bảo toàn electron hỗn hợp', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: 'Cân bằng PTHH oxi hóa – khử', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Tính khối lượng chất oxi hóa / khử', nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: 'Biện luận hỗn hợp nhiều chất oxi hóa', nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 2.0 } },
    ];
  } else {
    const name = t || 'Kiến thức trọng tâm';
    p1Topics = [
      { name: `Khái niệm, định nghĩa ${name}`, nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: `Nhận biết / tính chất đặc trưng của ${name}`, nb: { count: 1, points: 0.7 }, th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() },
      { name: `Giải thích hiện tượng liên quan ${name}`, nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: `Phân biệt các trường hợp gần giống về ${name}`, nb: emptyLevel(), th: { count: 1, points: 0.7 }, vd: emptyLevel(), vdc: emptyLevel() },
      { name: `Tính toán một bước về ${name}`, nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: `Áp dụng định luật / công thức ${name} vào số liệu`, nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 0.7 }, vdc: emptyLevel() },
      { name: `Bài toán tổng hợp ${name}`, nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 0.9 } },
    ];
    p2Topics = [
      { name: `Chuỗi biến đổi / nhiều bước về ${name}`, nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: `Xác định thành phần hỗn hợp liên quan ${name}`, nb: emptyLevel(), th: emptyLevel(), vd: { count: 1, points: 1.5 }, vdc: emptyLevel() },
      { name: `Biện luận số liệu ${name}`, nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: { count: 1, points: 2.0 } },
    ];
  }

  if (intent === 'sheet') {
    p2Topics = p2Topics.slice(0, 2);
    p1Topics = p1Topics.map((row, idx) => (idx < 2
      ? { ...row, nb: { count: (row.nb.count || 0) + 1, points: 0.7 } }
      : row));
  }

  const matrix = {
    title: `Ma trận ${intent === 'sheet' ? 'phiếu bài tập' : intent === 'lecture' ? 'câu hỏi bài giảng' : 'đề thi'} ${topic} — ${subject} lớp ${grade}`,
    subject,
    grade,
    duration,
    totalPoints: 10,
    totalQuestions: count,
    source: 'fallback',
    parts: [
      { partName: 'Phần 1: Trắc nghiệm nhiều lựa chọn', format: 'multiple_choice', topics: p1Topics },
      { partName: 'Phần 2: Trả lời ngắn / tính toán', format: 'short_answer', topics: p2Topics },
    ],
    aiPedagogicalAdvice: `Đã lập khung ${count} câu / ${duration} phút cho “${topic}” lớp ${grade}. Ưu tiên 4 mức NB–TH–VD–VDC theo khảo thí. Xem bảng bên phải rồi xác nhận để sinh câu hỏi.`,
  };
  return scaleMatrixToCount(matrix, count);
}

function intentLabel(intent) {
  if (intent === 'sheet') return 'phiếu bài tập luyện tập (nhiều câu nhận biết/thông hiểu, số liệu đơn)';
  if (intent === 'lecture') return 'câu hỏi kiểm tra ngay sau bài giảng (ngắn, bám đúng nội dung vừa dạy)';
  return 'đề kiểm tra/thi (phân hóa, có câu vận dụng cao)';
}

export async function planMatrixWithAI({
  topic,
  grade,
  subject = 'Hóa học',
  count = 10,
  duration = 30,
  format = '',
  intent = 'exam',
  customPrompt = '',
  classInsights = '',
  files = [],
  signal,
} = {}) {
  const n = Math.max(4, Math.min(60, Number(count) || 10));
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);

  const system = `Bạn là chuyên gia khảo thí chương trình GDPT 2018 (Việt Nam).
Nhiệm vụ: lập MA TRẬN đề cho môn ${subject}, lớp ${grade}, chủ đề "${topic}".
Loại sản phẩm: ${intentLabel(intent)}.
Số câu: đúng ${n}. Thời lượng: ${duration} phút. Tổng điểm 10.
Định dạng giáo viên chọn: ${format || 'linh hoạt theo chuẩn Bộ GD&ĐT'}.

Phân bổ gợi ý (có thể lệch ±5% nếu chủ đề đòi hỏi):
- Nhận biết 20–30%
- Thông hiểu 20–30%
- Vận dụng 30–40%
- Vận dụng cao 10–20%
Với phiếu bài tập: tăng NB+TH; với đề thi: giữ VDC.

Mỗi dòng chủ đề phải là DẠNG BÀI cụ thể (không viết chung chung kiểu "kiến thức trọng tâm").
Với Hóa: ghi rõ công thức/định luật (n=m/M, bảo toàn nguyên tố, số oxi hóa…).
Không bịa chuẩn ngoài chương trình lớp ${grade}.

Chỉ trả JSON:
{
  "title": "...",
  "subject": "${subject}",
  "grade": "${grade}",
  "duration": ${duration},
  "totalPoints": 10,
  "totalQuestions": ${n},
  "parts": [
    {
      "partName": "Phần 1: Trắc nghiệm khách quan",
      "format": "multiple_choice",
      "topics": [
        { "name": "Dạng bài cụ thể", "nb": {"count":1,"points":0.7}, "th":{"count":0,"points":0}, "vd":{"count":0,"points":0}, "vdc":{"count":0,"points":0} }
      ]
    },
    {
      "partName": "Phần 2: Trả lời ngắn hoặc tính toán",
      "format": "short_answer",
      "topics": [
        { "name": "Dạng bài vận dụng", "nb":{"count":0,"points":0}, "th":{"count":0,"points":0}, "vd":{"count":1,"points":1.5}, "vdc":{"count":0,"points":0} }
      ]
    }
  ],
  "aiPedagogicalAdvice": "2–4 câu: vì sao phân bổ như vậy, tiết tới nên nhấn gì",
  "focusSkills": ["kỹ năng 1", "kỹ năng 2"]
}`;

  const user = [
    `Lập ma trận ${n} câu, ${duration} phút, chủ đề: ${topic}.`,
    customPrompt ? `Yêu cầu thêm: ${customPrompt}` : '',
    classInsights ? `Phân tích lớp (bám vào đây khi phân bổ VDC/NB):\n${classInsights}` : '',
    textParts.length ? textParts.join('\n\n') : '',
  ].filter(Boolean).join('\n\n');

  try {
    const raw = await callModel({
      system,
      parts: [...imageParts, ...pdfParts, { text: user }],
      temperature: 0.35,
      signal,
    });
    const data = parseJsonLoose(raw);
    if (data && Array.isArray(data.parts) && data.parts.length) {
      data.subject = data.subject || subject;
      data.grade = data.grade || grade;
      data.duration = Number(data.duration) || duration;
      data.source = 'ai';
      const scaled = scaleMatrixToCount(data, n);
      if (!scaled.aiPedagogicalAdvice) {
        scaled.aiPedagogicalAdvice = `Ma trận ${n} câu cho “${topic}” lớp ${grade}, bám 4 mức nhận thức.`;
      }
      return scaled;
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[matrix] AI plan failed, fallback:', err);
  }

  const fb = buildFallbackMatrix({ topic, grade, subject, count: n, duration, intent });
  fb.aiPedagogicalAdvice = `${fb.aiPedagogicalAdvice} (Khung dự phòng — AI chưa lập được ma trận động.)`;
  return fb;
}

export async function refineMatrixWithAI({ matrix, instruction, classInsights = '', signal } = {}) {
  if (!matrix) throw new Error('Chưa có ma trận để chỉnh.');
  const n = matrix.totalQuestions || matrix.summary?.total?.count || 10;
  const system = `Bạn chỉnh MA TRẬN đề thi JSON theo yêu cầu giáo viên.
Giữ tổng số câu ≈ ${n}, tổng điểm 10, 4 mức nb/th/vd/vdc.
Chỉ trả cùng schema JSON (title, subject, grade, duration, parts, aiPedagogicalAdvice).`;
  const raw = await callModel({
    system,
    parts: [{
      text: `Yêu cầu: ${instruction}\n${classInsights ? `Dữ liệu lớp:\n${classInsights}\n` : ''}Ma trận hiện tại:\n${JSON.stringify({
        title: matrix.title,
        parts: matrix.parts,
        summary: matrix.summary,
      })}`,
    }],
    temperature: 0.3,
    signal,
  });
  const data = parseJsonLoose(raw);
  if (!data?.parts) throw new Error('AI không trả về ma trận hợp lệ.');
  data.subject = data.subject || matrix.subject;
  data.grade = data.grade || matrix.grade;
  data.duration = Number(data.duration) || matrix.duration;
  data.source = 'ai';
  return scaleMatrixToCount(data, n);
}

function listFromPayload(p) {
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.questions)) return p.questions;
  return [];
}

export async function generateQuestionsFromApprovedMatrix({
  matrix,
  files = [],
  classInsights = '',
  onProgress,
  signal,
} = {}) {
  const subject = matrix.subject || 'Hóa học';
  const grade = matrix.grade || '11';
  const specs = flattenMatrixSpecs(matrix);
  if (!specs.length) throw new Error('Ma trận chưa có ô câu hỏi nào.');

  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const nBatches = Math.ceil(specs.length / GEN_BATCH);
  const batches = [];
  for (let i = 0; i < specs.length; i += GEN_BATCH) batches.push(specs.slice(i, i + GEN_BATCH));

  const system = `Bạn là giáo viên ${subject} lớp ${grade}, ra đề theo ma trận khảo thí Việt Nam.
Mỗi câu trắc nghiệm đúng 4 phương án, đúng 1 đáp án.
YÊU CẦU CHẤT LƯỢNG:
- Giải trong "work" (nháp ≤ 200 ký tự) TRƯỚC khi chốt "correct".
- Đáp án nhiễu = sai lầm thật (nhầm công thức, quên đổi đơn vị, nhầm khái niệm gần).
- Không để đáp án đúng dài hơn hẳn; không dùng "tất cả đều đúng".
- Lời giải không nhắc A/B/C/D (đáp án sẽ bị trộn).
- Công thức LaTeX trong $...$; trong JSON viết \\\\frac, \\\\ce.
- Đúng chương trình lớp ${grade}; số liệu phải tính ra khớp đáp án.
- Câu trả lời ngắn: options vẫn 4 lựa chọn (giá trị số / biểu thức), học sinh chọn 1.

Trả JSON: {"questions":[{"q":"...","options":["...","...","...","..."],"work":"...","correct":0,"explain":"...","topic":"...","level":"nhận biết|thông hiểu|vận dụng|vận dụng cao","points":0.7}]}`;

  onProgress?.(0, nBatches);
  const results = new Array(nBatches).fill(null);
  let firstErr = null;
  let done = 0;

  const run = async (b) => {
    const slice = batches[b];
    const specText = slice.map((s, i) =>
      `Câu ${i + 1}: dạng "${s.topic}" | mức ${s.level} | ${s.points} điểm | phần ${s.part}`
    ).join('\n');
    try {
      const raw = await callModel({
        system,
        parts: [
          ...imageParts,
          ...pdfParts,
          {
            text: [
              `Soạn đúng ${slice.length} câu, mỗi câu một dòng spec, không trùng ý.`,
              specText,
              classInsights ? `Bám điểm yếu lớp:\n${classInsights}` : '',
              textParts.length ? `Tài liệu:\n${textParts.join('\n')}` : '',
            ].filter(Boolean).join('\n\n'),
          },
        ],
        temperature: 0.45,
        signal,
      });
      results[b] = listFromPayload(parseJsonLoose(raw));
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      firstErr = firstErr || e;
    }
    onProgress?.(++done, nBatches);
  };

  let next = 0;
  const parallel = Math.min(3, nBatches);
  await Promise.all(Array.from({ length: parallel }, async () => {
    while (next < nBatches) {
      const b = next;
      next += 1;
      await run(b);
    }
  }));

  const raws = [];
  results.forEach((list) => { (list || []).forEach((q) => raws.push(q)); });
  if (!raws.length) {
    throw firstErr || new Error('AI không sinh được câu hỏi. Thử mô tả chủ đề rõ hơn hoặc thử lại.');
  }

  const normalized = raws.slice(0, specs.length).map((q, idx) => {
    const sp = specs[idx] || {};
    return shuffleOptions(normalizeQuestion({
      ...q,
      points: q.points || sp.points || 0.7,
      topic: q.topic || sp.topic || '',
      level: q.level || sp.level || '',
    }));
  });

  if (normalized.length < specs.length) {
    const missing = specs.length - normalized.length;
    throw new Error(`AI mới soạn ${normalized.length}/${specs.length} câu (thiếu ${missing}). Hãy bấm sinh lại.`);
  }
  return normalized;
}

export async function askPedagogyAI({ question, matrix, classInsights = '', signal } = {}) {
  const raw = await callModel({
    system: `Bạn là trợ lý sư phạm Hóa học phổ thông Việt Nam.
Trả lời ngắn, cụ thể, có ví dụ số liệu hoặc câu hỏi gợi ý dạy ngay được.
Chỉ trả JSON: {"answer":"..."}.`,
    parts: [{
      text: [
        question,
        matrix?.title ? `Đề/ma trận đang mở: ${matrix.title}` : '',
        classInsights ? `Dữ liệu lớp:\n${classInsights}` : '',
      ].filter(Boolean).join('\n\n'),
    }],
    temperature: 0.5,
    signal,
  });
  try {
    const p = parseJsonLoose(raw);
    return String(p?.answer || p?.text || '').trim() || 'Chưa nhận được gợi ý.';
  } catch {
    return String(raw || '').trim() || 'Chưa nhận được gợi ý.';
  }
}

export const ridMatrix = rid;
