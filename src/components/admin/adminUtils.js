import { ANSWER_LABELS } from './adminConstants.js';

/* ============================================================
   LỖI — chuyển lỗi Supabase / mạng thành câu tiếng Việt dễ hiểu
   ============================================================ */
export function friendlyError(e) {
  if (!e) return 'Đã xảy ra lỗi không xác định.';
  const msg = String(e.message || e.error_description || e);
  const code = e.code || '';

  if (code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'Không đủ quyền thực hiện thao tác này (chính sách RLS của Supabase đang chặn). Hãy kiểm tra tài khoản có role "admin" và policy của bảng.';
  }
  if (code === '23503' || /foreign key/i.test(msg)) {
    return 'Dữ liệu này đang được bảng khác sử dụng (ví dụ đề đã có lượt làm bài). Hãy ẩn thay vì xóa, hoặc xóa dữ liệu liên quan trước.';
  }
  if (code === '23505' || /duplicate key/i.test(msg)) return 'Dữ liệu bị trùng với bản ghi đã có.';
  if (code === '23502' || /null value in column/i.test(msg)) {
    const col = msg.match(/column "([^"]+)"/)?.[1];
    return `Thiếu thông tin bắt buộc${col ? ` (cột "${col}")` : ''}.`;
  }
  if (code === '22P02' || /invalid input syntax/i.test(msg)) return 'Giá trị nhập không đúng định dạng (kiểm tra ID, số, ngày).';
  if (code === 'PGRST116') return 'Không tìm thấy bản ghi (có thể đã bị xóa).';
  if (code === '42P01' || /relation .* does not exist/i.test(msg)) return 'Bảng dữ liệu chưa tồn tại trong Supabase: ' + msg;
  if (code === '42703' || /column .* does not exist/i.test(msg)) return 'Cột dữ liệu không tồn tại: ' + msg;
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'Mất kết nối mạng hoặc máy chủ không phản hồi. Kiểm tra Internet rồi thử lại.';
  if (/jwt expired|invalid jwt/i.test(msg)) return 'Phiên đăng nhập đã hết hạn. Hãy đăng xuất và đăng nhập lại.';
  return msg;
}

/* Ném lỗi nếu truy vấn Supabase trả về error — dùng: unwrap(await supabase...) */
export function unwrap(res) {
  if (res?.error) throw res.error;
  return res;
}

export const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/* Đọc toàn bộ bảng, vượt giới hạn 1000 dòng của Supabase */
export async function fetchAllRows(makeQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export const newTempId = () => `new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const isTempId = (id) => typeof id === 'string' && id.startsWith('new-');

export const escapeLike = (s) => String(s).replace(/[\\%_]/g, (m) => '\\' + m);

/* ============================================================
   CLIPBOARD
   ============================================================ */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* thử cách dự phòng */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadFile(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
   PHÂN TÍCH JSON "LỎNG" — chịu được output của AI
   (code fence, lời dẫn, dấu phẩy thừa, dấu \ lạ trong công thức)
   ============================================================ */
function tryParse(t) {
  try {
    return { data: JSON.parse(t) };
  } catch (e) {
    return { error: e.message };
  }
}

function explainJsonError(message, text) {
  const pos = Number(message.match(/position (\d+)/)?.[1]);
  if (Number.isFinite(pos)) {
    const before = text.slice(0, pos);
    const line = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    const near = text.slice(Math.max(0, pos - 20), pos + 20).replace(/\s+/g, ' ');
    return `JSON sai cú pháp ở dòng ${line}, cột ${col} (gần: "…${near}…"). Thường do thiếu dấu phẩy, thiếu dấu nháy hoặc AI bị cắt giữa chừng.`;
  }
  if (/unexpected end/i.test(message)) return 'JSON bị cắt cụt (thiếu dấu đóng } hoặc ]). Hãy bảo AI "tiếp tục" rồi dán lại đầy đủ.';
  return 'JSON không hợp lệ: ' + message;
}

export function parseLooseJson(input) {
  if (typeof input !== 'string' || !input.trim()) return { error: 'Chưa có nội dung.' };
  let s = input.trim().replace(/^\uFEFF/, '');

  const first = tryParse(s);
  if (first.data !== undefined) return { data: first.data };

  const fence = s.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();

  const a = s.search(/[[{]/);
  const b = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (a >= 0 && b > a) s = s.slice(a, b + 1);

  const direct = tryParse(s);
  if (direct.data !== undefined) return { data: direct.data, repaired: true };

  const repaired = s
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  const second = tryParse(repaired);
  if (second.data !== undefined) return { data: second.data, repaired: true };

  return { error: explainJsonError(first.error, input) };
}

/* ============================================================
   CHUẨN HÓA CÂU HỎI — nhận nhiều biến thể mà AI hay trả về
   → { content, type, options:[{label,content}], correctAnswer, explanation, difficulty, topic, note }
   ============================================================ */
const DIFF_ALIASES = {
  easy: 'easy', de: 'easy', 'dễ': 'easy', 'nhận biết': 'easy', 'nhan biet': 'easy',
  medium: 'medium', 'trung bình': 'medium', 'trung binh': 'medium', 'thông hiểu': 'medium', 'thong hieu': 'medium',
  hard: 'hard', 'khó': 'hard', kho: 'hard', 'vận dụng': 'hard', 'van dung': 'hard',
  extreme: 'extreme', 'rất khó': 'extreme', 'rat kho': 'extreme', 'vận dụng cao': 'extreme', 'van dung cao': 'extreme',
};

export const normalizeDifficulty = (v) => DIFF_ALIASES[String(v ?? '').trim().toLowerCase()] || 'medium';

const cleanLabel = (v, fallback) =>
  String(v ?? '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1) || fallback;

export function pickQuestionList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return null;
  return data.questions || data.items || data.data?.questions || data.exam?.questions || null;
}

export function normalizeQuestions(data) {
  const list = pickQuestionList(data);
  if (!Array.isArray(list)) {
    return { questions: [], warnings: ['Không tìm thấy mảng "questions" trong JSON.'] };
  }
  const warnings = [];

  const questions = list.map((q, i) => {
    const item = q && typeof q === 'object' ? q : {};
    const content = String(item.content ?? item.question ?? item.text ?? item.title ?? '').trim();

    let rawOpts = item.options ?? item.choices ?? item.answers ?? [];
    if (rawOpts && !Array.isArray(rawOpts) && typeof rawOpts === 'object') {
      rawOpts = Object.entries(rawOpts).map(([label, c]) => ({ label, content: c }));
    }
    if (!Array.isArray(rawOpts)) rawOpts = [];

    let flaggedCorrect = null;
    let options = rawOpts.slice(0, ANSWER_LABELS.length).map((o, j) => {
      if (typeof o === 'string') {
        const m = o.match(/^\s*([A-Fa-f])\s*[.):\-]\s*([\s\S]*)$/);
        return m
          ? { label: m[1].toUpperCase(), content: m[2].trim() }
          : { label: ANSWER_LABELS[j], content: o.trim() };
      }
      const label = cleanLabel(o?.label ?? o?.key ?? o?.id, ANSWER_LABELS[j]);
      let text = String(o?.content ?? o?.text ?? o?.value ?? '').trim();
      const prefix = new RegExp(`^${label}\\s*[.)]\\s+`);
      if (prefix.test(text)) text = text.replace(prefix, '');
      if (o?.isCorrect === true || o?.is_correct === true || o?.correct === true) flaggedCorrect = label;
      return { label, content: text };
    });

    const unique = new Set(options.map((o) => o.label));
    if (unique.size !== options.length) {
      options = options.map((o, j) => ({ ...o, label: ANSWER_LABELS[j] }));
      warnings.push(`Câu ${i + 1}: nhãn đáp án bị trùng, đã đánh lại A, B, C…`);
    }

    let correct = item.correctAnswer ?? item.correct_answer ?? item.correct ?? item.answer ?? item.right ?? flaggedCorrect;
    if (typeof correct === 'number') {
      const idx = correct >= 1 && correct <= options.length ? correct - 1 : correct;
      correct = options[idx]?.label ?? '';
    } else if (typeof correct === 'string') {
      const t = correct.trim();
      const letter = t.match(/^(?:đáp án|dap an|answer)?\s*:?\s*([A-Fa-f])\b/i)?.[1];
      if (letter) correct = letter.toUpperCase();
      else correct = options.find((o) => o.content && o.content === t)?.label ?? '';
    } else {
      correct = '';
    }
    if (correct && !options.some((o) => o.label === correct)) correct = '';

    return {
      content,
      type: 'single_choice',
      options,
      correctAnswer: correct,
      explanation: String(item.explanation ?? item.solution ?? item.loi_giai ?? '').trim(),
      difficulty: normalizeDifficulty(item.difficulty ?? item.level),
      topic: String(item.topic ?? item.chapter ?? '').trim(),
      note: String(item.fixNote ?? item.note ?? '').trim(),
    };
  });

  return { questions, warnings };
}

/* Trả về danh sách vấn đề của từng câu (mảng rỗng = câu hợp lệ) */
export function questionProblems(q) {
  const p = [];
  if (!q.content?.trim()) p.push('Thiếu nội dung câu hỏi');
  const filled = (q.options || []).filter((o) => o.content?.trim());
  if ((q.options || []).length < 2) p.push('Cần ít nhất 2 đáp án');
  else if (filled.length !== q.options.length) p.push('Có đáp án bị bỏ trống');
  if (!q.correctAnswer) p.push('Chưa chọn đáp án đúng');
  else if (!q.options?.some((o) => o.label === q.correctAnswer)) p.push('Đáp án đúng không khớp nhãn nào');
  return p;
}

export function summarizeProblems(questions) {
  const bad = [];
  questions.forEach((q, i) => {
    const p = questionProblems(q);
    if (p.length) bad.push({ index: i, problems: p });
  });
  return bad;
}

/* Lấy meta đề (nếu JSON là cả đề) */
export function extractExamMeta(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') return {};
  const src = data.exam && typeof data.exam === 'object' ? data.exam : data;
  const meta = {};
  ['title', 'description', 'exam_type', 'difficulty', 'source'].forEach((k) => {
    if (src[k] != null && src[k] !== '') meta[k] = src[k];
  });
  ['grade_id', 'subject_id', 'duration'].forEach((k) => {
    if (src[k] != null && src[k] !== '') meta[k] = Number(src[k]);
  });
  if (src.grade && !meta.grade_id) meta.grade_name = String(src.grade);
  if (src.subject && !meta.subject_id) meta.subject_name = String(src.subject);
  return meta;
}

/* Khớp tên lớp/môn do AI viết (vd "Lớp 11", "11", "Hóa") với danh mục trong DB */
export function resolveByName(list, name) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  return (
    list.find((x) => x.name?.toLowerCase() === n) ||
    list.find((x) => x.name?.toLowerCase().includes(n) || n.includes(x.name?.toLowerCase())) ||
    null
  );
}

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—';
