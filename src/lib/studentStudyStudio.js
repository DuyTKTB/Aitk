/* ============================================================
   studentStudyStudio.js — Thuật toán Học tập Chủ động Cho Học sinh
   Lấy cảm hứng từ các dự án GitHub hàng đầu:
     1. Cloze Deletion Parser & Auto-Generator (ankitects/anki 33K★)
     2. Feynman Technique Self-Explanation Evaluator (ptah23/feynman-ai)
     3. Safe Mathematical Expression Parser + Root/Extrema/Tangent Solver
        (Desmos / geoochi/feynman-technique)
   100% an toàn (KHÔNG dùng eval/Function tùy tiện), thuần hàm, test đầy đủ.
   ============================================================ */

/* ============================================================
   1. CLOZE DELETION (ANKI STYLE {{c1::...}} + AUTO CLOZE)
   ============================================================ */
const STOP_WORDS_VI = new Set([
  'la', 'cua', 'va', 'cac', 'nhung', 'trong', 'voi', 'cho', 'khi', 'neu', 'thi',
  'duoc', 'mot', 'hai', 'ba', 'khong', 'co', 'de', 'tai', 'tu', 'den', 'theo',
  'bang', 'nhu', 'nay', 'do', 'se', 'da', 'dang', 'rat', 'nhieu', 'moi', 'hay',
]);

function normVi(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Tách văn bản chứa cú pháp Anki Cloze `{{c1::đáp án}}` hoặc `{{đáp án}}` thành segments + blanks.
 */
export function parseClozeText(rawText) {
  const s = String(rawText || '');
  const re = /\{\{(?:c\d+::)?([^}]+?)\}\}/g;
  const segments = [];
  const blanks = [];
  let last = 0;
  let m;

  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: s.slice(last, m.index) });
    }
    const rawInner = m[1];
    const [answer, hint] = rawInner.split('::');
    const blankIndex = blanks.length;
    blanks.push({
      index: blankIndex,
      answer: String(answer || '').trim(),
      hint: String(hint || '').trim(),
    });
    segments.push({ type: 'blank', index: blankIndex, answer: String(answer || '').trim(), hint: String(hint || '').trim() });
    last = m.index + m[0].length;
  }

  if (last < s.length) {
    segments.push({ type: 'text', value: s.slice(last) });
  }
  return { segments, blanks };
}

/**
 * Tự động tạo bài tập điền khuyết (Auto-Cloze) từ đoạn bài học bất kỳ:
 * Ưu tiên đục lỗ công thức, con số có đơn vị, và các cụm từ khóa học thuật quan trọng.
 */
export function autoGenerateCloze(plainText, maxBlanks = 5) {
  const src = String(plainText || '').trim();
  if (!src) return '';
  if (/\{\{[^}]+\}\}/.test(src)) return src; // Đã có cloze sẵn

  let out = src;
  let count = 0;
  const target = Math.max(1, Math.min(10, Number(maxBlanks) || 5));

  // 1. Ưu tiên công thức hóa học / số kèm đơn vị (H2SO4, 9,8 m/s2, 22,4 lít, 100°C...)
  out = out.replace(
    /\b([A-Z][a-z]?\d+(?:[A-Z][a-z]?\d*)*|\d+(?:[.,]\d+)?\s*(?:°C|K|mol|g\/mol|m\/s²?|km\/h|Hz|Ω|V|A|W|J|Pa|atm|nm|μm|mm|cm|m|kg|g|lít|ml|%)?)\b/g,
    (full) => {
      if (count >= target || full.length < 2) return full;
      if (/^\d{1,2}$/.test(full)) return full;
      count++;
      return `{{c${count}::${full}}}`;
    }
  );

  // 2. Nếu chưa đủ lỗ, đục thêm các từ khóa dài có nghĩa học thuật
  if (count < target) {
    const tokens = out.split(/(\s+)/);
    const step = Math.max(4, Math.floor(tokens.length / ((target - count) * 2 + 1)));
    for (let i = step; i < tokens.length && count < target; i += step) {
      const tk = tokens[i];
      if (!tk || /^\s+$/.test(tk) || tk.includes('{{') || tk.includes('}}')) continue;
      const clean = tk.replace(/^[.,;:!?()"'«»]+|[.,;:!?()"'«»]+$/g, '');
      const n = normVi(clean);
      if (clean.length >= 4 && !STOP_WORDS_VI.has(n) && !/^\d+$/.test(clean)) {
        count++;
        tokens[i] = tk.replace(clean, `{{c${count}::${clean}}}`);
      }
    }
    out = tokens.join('');
  }

  return out;
}

/**
 * Chấm điểm bài điền khuyết Cloze (so sánh linh hoạt không phân biệt hoa/thường, khoảng trắng thừa).
 */
export function gradeClozeAnswers(blanks = [], userAnswers = []) {
  const details = blanks.map((b, i) => {
    const expected = String(b?.answer || '').trim();
    const actual = String(userAnswers[i] || '').trim();
    const ok = Boolean(actual) && (
      expected.toLowerCase().replace(/\s+/g, '') === actual.toLowerCase().replace(/\s+/g, '') ||
      normVi(expected) === normVi(actual)
    );
    return { index: i, expected, actual, ok };
  });
  const correct = details.filter((d) => d.ok).length;
  const pct = blanks.length ? Math.round((correct / blanks.length) * 100) : 0;
  return { correct, total: blanks.length, pct, details };
}

/* ============================================================
   2. FEYNMAN SELF-EXPLANATION EVALUATOR (0-CREDIT FAST RUBRIC)
   ============================================================ */
export const FEYNMAN_PROMPTS = [
  {
    id: 'momentum',
    subject: 'Vật lí',
    concept: 'Định luật bảo toàn động lượng',
    keywords: ['hệ kín', 'ngoại lực', 'tổng động lượng', 'không đổi', 'va chạm', 'khối lượng', 'vận tốc'],
    reference: 'Trong một hệ kín (không có ngoại lực tác dụng hoặc tổng ngoại lực bằng 0), tổng vectơ động lượng p = m·v của các vật luôn được bảo toàn (không đổi) trước và sau va chạm.',
  },
  {
    id: 'ester',
    subject: 'Hóa học',
    concept: 'Phản ứng este hóa',
    keywords: ['axit cacboxylic', 'ancol', 'este', 'nước', 'thuận nghịch', 'H2SO4 đặc', 'nhiệt độ'],
    reference: 'Phản ứng este hóa là phản ứng thuận nghịch giữa axit cacboxylic và ancol, có xúc tác H2SO4 đặc và đun nóng, tạo thành este và nước (H2SO4 đặc vừa làm xúc tác vừa hút nước để chuyển dịch cân bằng).',
  },
  {
    id: 'transcription',
    subject: 'Sinh học',
    concept: 'Cơ chế phiên mã tổng hợp mARN',
    keywords: ['ADN', 'mARN', 'ARN polimeraza', 'mạch gốc', '3\' đến 5\'', 'bổ sung', 'A-U'],
    reference: 'Phiên mã là quá trình tổng hợp phân tử mARN từ mạch gốc 3\'→5\' của gen nhờ enzim ARN polimeraza theo nguyên tắc bổ sung (A-U, T-A, G-X, X-G) trong nhân tế bào.',
  },
  {
    id: 'derivative',
    subject: 'Toán học',
    concept: 'Ý nghĩa hình học của đạo hàm',
    keywords: ['tiếp tuyến', 'hệ số góc', 'tốc độ biến thiên', 'đồ thị', 'cực trị', 'đồng biến'],
    reference: 'Đạo hàm f\'(x₀) chính là hệ số góc của tiếp tuyến đồ thị hàm số tại điểm x₀, đồng thời biểu thị tốc độ biến thiên tức thời (f\' > 0 hàm đồng biến, f\' = 0 và đổi dấu tạo cực trị).',
  },
];

/**
 * Chấm nhanh bài tự giảng Feynman tại máy (0 credit) dựa trên 4 trụ cột:
 *   1. Độ phủ ý cốt lõi (keyword coverage)
 *   2. Độ diễn đạt dễ hiểu (câu rõ ràng, có ví dụ / từ nối giải thích "vì", "nghĩa là", "ví dụ")
 *   3. Độ đầy đủ (không quá ngắn)
 */
export function evaluateFeynmanLocally({ explanation = '', keywords = [] } = {}) {
  const raw = String(explanation || '').trim();
  const nText = normVi(raw);
  const words = nText ? nText.split(/\s+/).filter(Boolean) : [];

  if (words.length < 5) {
    return {
      score: 0,
      grade: 'Quá ngắn',
      matchedKeywords: [],
      missingKeywords: keywords,
      hasExample: false,
      feedback: 'Hãy viết ít nhất 1–2 câu giải thích bằng chính lời của bạn (như đang giảng cho bạn cùng lớp).',
    };
  }

  const matchedKeywords = [];
  const missingKeywords = [];
  (keywords || []).forEach((kw) => {
    const nKw = normVi(kw);
    // Cho phép khớp theo cụm hoặc phần gốc quan trọng
    const parts = nKw.split(/\s+/).filter((p) => p.length >= 2);
    const hit = nText.includes(nKw) || (parts.length >= 2 && parts.every((p) => nText.includes(p)));
    if (hit) matchedKeywords.push(kw);
    else missingKeywords.push(kw);
  });

  const kwScore = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 65) : Math.min(60, words.length * 2);
  const hasExample = /\b(?:vi du|chang han|giong nhu|tuong tu|trong thuc te|co nghia la|tuc la|vi vay|do do)\b/.test(nText);
  const clarityScore = Math.min(20, Math.round(Math.min(words.length, 45) / 45 * 20));
  const exampleScore = hasExample ? 15 : 5;
  const score = Math.max(0, Math.min(100, kwScore + clarityScore + exampleScore));

  const grade =
    score >= 85 ? 'Hiểu sâu chuẩn Feynman'
    : score >= 65 ? 'Khá chắc bản chất'
    : score >= 45 ? 'Hiểu một phần — còn lỗ hổng'
    : 'Cần ôn lại bản chất';

  const feedback =
    missingKeywords.length === 0
      ? 'Tuyệt vời! Bạn đã giải thích trúng toàn bộ bản chất cốt lõi một cách mạch lạc.'
      : `Bạn đã nêu đúng ${matchedKeywords.length}/${keywords.length} ý chính. Hãy bổ sung thêm: ${missingKeywords.slice(0, 3).join(', ')}.${!hasExample ? ' Gợi ý: thêm 1 ví dụ thực tế để nhớ lâu gấp đôi!' : ''}`;

  return {
    score,
    grade,
    matchedKeywords,
    missingKeywords,
    hasExample,
    feedback,
  };
}

/* ============================================================
   3. SAFE MATHEMATICAL EXPRESSION PARSER & FUNCTION ANALYZER
      (KHÔNG dùng eval — dùng Recursive Descent Parser chuẩn!)
   ============================================================ */
const MATH_FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: (v) => Math.log10(v),
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
};

function tokenizeMath(expr) {
  const s = String(expr || '')
    .replace(/\s+/g, '')
    .replace(/π/g, 'pi')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  const rawTokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      rawTokens.push({ type: 'num', value: parseFloat(num) });
    } else if (/[a-zA-Z]/.test(ch)) {
      let id = '';
      while (i < s.length && /[a-zA-Z]/.test(s[i])) id += s[i++];
      rawTokens.push({ type: 'id', value: id.toLowerCase() });
    } else if ('+-*/^()'.includes(ch)) {
      rawTokens.push({ type: 'op', value: ch });
      i++;
    } else {
      return null; // Ký tự không hợp lệ
    }
  }

  // Chèn phép nhân ngầm: 2x -> 2*x, 2(x+1) -> 2*(x+1), xsin(x) -> x*sin(x), )( -> )*(
  const tokens = [];
  for (let k = 0; k < rawTokens.length; k++) {
    const cur = rawTokens[k];
    const prev = tokens[tokens.length - 1];
    if (prev) {
      const prevIsVal = prev.type === 'num' || (prev.type === 'id' && !MATH_FUNCS[prev.value]) || (prev.type === 'op' && prev.value === ')');
      const curStartsVal = cur.type === 'num' || cur.type === 'id' || (cur.type === 'op' && cur.value === '(');
      if (prevIsVal && curStartsVal) {
        tokens.push({ type: 'op', value: '*' });
      }
    }
    tokens.push(cur);
  }
  return tokens;
}

/**
 * Biên dịch biểu thức hàm số y = f(x) thành hàm đánh giá an toàn (0 eval).
 */
export function compileSafeMathFn(expr) {
  const tokens = tokenizeMath(expr);
  if (!tokens || !tokens.length) return null;

  const evalAt = (xVal) => {
    let pos = 0;
    const peek = () => tokens[pos];
    const eat = () => tokens[pos++];

    const parseAdd = () => {
      let left = parseMul();
      while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = eat().value;
        const right = parseMul();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };

    const parseMul = () => {
      let left = parseUnary();
      while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/')) {
        const op = eat().value;
        const right = parseUnary();
        left = op === '*' ? left * right : left / right;
      }
      return left;
    };

    const parseUnary = () => {
      if (peek()?.type === 'op' && peek().value === '-') {
        eat();
        return -parseUnary();
      }
      if (peek()?.type === 'op' && peek().value === '+') {
        eat();
        return parseUnary();
      }
      return parsePow();
    };

    const parsePow = () => {
      const base = parsePrimary();
      if (peek()?.type === 'op' && peek().value === '^') {
        eat();
        const exp = parseUnary();
        return Math.pow(base, exp);
      }
      return base;
    };

    const parsePrimary = () => {
      const tk = peek();
      if (!tk) return NaN;
      if (tk.type === 'num') {
        eat();
        return tk.value;
      }
      if (tk.type === 'id') {
        eat();
        if (tk.value === 'x') return xVal;
        if (tk.value === 'pi') return Math.PI;
        if (tk.value === 'e') return Math.E;
        const fn = MATH_FUNCS[tk.value];
        if (fn && peek()?.type === 'op' && peek().value === '(') {
          eat(); // '('
          const arg = parseAdd();
          if (peek()?.type === 'op' && peek().value === ')') eat();
          return fn(arg);
        }
        return NaN;
      }
      if (tk.type === 'op' && tk.value === '(') {
        eat();
        const val = parseAdd();
        if (peek()?.type === 'op' && peek().value === ')') eat();
        return val;
      }
      return NaN;
    };

    const res = parseAdd();
    return pos === tokens.length && Number.isFinite(res) ? res : NaN;
  };

  // Kiểm thử nhanh tại vài điểm để xác nhận biểu thức hợp lệ
  const testVals = [-1.37, 0.23, 1.71, 2.5];
  const anyFinite = testVals.some((v) => Number.isFinite(evalAt(v)));
  if (!anyFinite) return null;
  return evalAt;
}

/**
 * Tìm xấp xỉ nghiệm (giao trục Ox) và cực trị (f'(x) đổi dấu) trong đoạn [xMin, xMax].
 */
export function analyzeMathFunction(fn, xMin = -10, xMax = 10, steps = 400) {
  if (typeof fn !== 'function') return { roots: [], extrema: [] };
  const roots = [];
  const extrema = [];
  const dx = (xMax - xMin) / steps;
  const h = 1e-4;
  const deriv = (x) => (fn(x + h) - fn(x - h)) / (2 * h);

  let prevX = xMin;
  let prevY = fn(prevX);
  let prevD = deriv(prevX);

  for (let i = 1; i <= steps; i++) {
    const x = xMin + i * dx;
    const y = fn(x);
    const d = deriv(x);

    if (Number.isFinite(prevY) && Number.isFinite(y) && Math.abs(y - prevY) < 50) {
      if (Math.abs(y) < 1e-6) {
        roots.push({ x: Math.round(x * 100) / 100, y: 0 });
      } else if (prevY * y < 0) {
        // Bisection 12 vòng để ra nghiệm chính xác 2 chữ số
        let a = prevX;
        let b = x;
        let fa = prevY;
        for (let iter = 0; iter < 12; iter++) {
          const mid = (a + b) / 2;
          const fm = fn(mid);
          if (fa * fm <= 0) b = mid;
          else { a = mid; fa = fm; }
        }
        const rx = Math.round(((a + b) / 2) * 100) / 100;
        if (!roots.some((r) => Math.abs(r.x - rx) < 0.08)) {
          roots.push({ x: rx, y: 0 });
        }
      }
    }

    if (Number.isFinite(prevD) && Number.isFinite(d) && prevD * d < 0 && Math.abs(d - prevD) < 80) {
      const ex = Math.round(((prevX + x) / 2) * 100) / 100;
      const ey = fn(ex);
      if (Number.isFinite(ey) && !extrema.some((e) => Math.abs(e.x - ex) < 0.12)) {
        extrema.push({
          x: ex,
          y: Math.round(ey * 100) / 100,
          kind: prevD > 0 ? 'max' : 'min',
        });
      }
    }

    prevX = x;
    prevY = y;
    prevD = d;
  }

  return { roots: roots.slice(0, 12), extrema: extrema.slice(0, 10) };
}
