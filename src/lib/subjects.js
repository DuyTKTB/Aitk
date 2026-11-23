/* ============================================================
   subjects.js — Cấu hình môn học cho AI tạo đề
   ------------------------------------------------------------
   • Mỗi môn có hướng dẫn riêng đưa vào prompt (buildSubjectGuide)
   • Môn không có trong danh sách (môn tự đặt tên) → dùng GENERIC,
     nên AI vẫn tạo được đề cho MỌI môn.
   • math = true  → AI viết công thức bằng LaTeX ($...$), giao diện
     hiển thị bằng <MathText />.
   ============================================================ */

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const COMMON_RULES = `
- Mỗi câu có đúng 1 đáp án đúng; các đáp án nhiễu phải hợp lý, không quá hiển nhiên.
- Không lặp ý giữa các câu. Không dùng "tất cả các đáp án trên" / "không đáp án nào đúng".
- Lời giải ngắn gọn, nêu lý do chọn đáp án đúng và (nếu cần) vì sao các đáp án khác sai.
- Chỉ ra chủ đề (topic) và mức độ (level: nhận biết | thông hiểu | vận dụng | vận dụng cao) cho từng câu.
- Nếu không chắc chắn về một dữ kiện, đừng bịa: hãy chọn câu hỏi khác chắc chắn hơn.`.trim();

const MATH_RULE =
  'Mọi công thức, biểu thức, ký hiệu viết bằng LaTeX đặt trong dấu $...$ (VD: $x^2-5x+6=0$, $\\frac{a}{b}$, $\\sqrt{3}$). Không dùng ký tự Unicode thay cho LaTeX.';

export const SUBJECTS = [
  {
    id: 'toan', label: 'Toán học', aliases: ['toan', 'toan hoc', 'math', 'mathematics'], math: true,
    examFamily: 'math_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.5, essay: 0 },
    standardCounts: { p1: 12, p2: 4, p3: 6, essay: 0, total: 22, duration: 90, weights: { multiple_choice: 1, true_false: 4, short_answer: 2 } },
    guide: `${MATH_RULE} Số liệu phải tính ra được đáp án chính xác; giải lại từng bước trước khi chốt đáp án. Với Phần III Trả lời ngắn (0,5đ/câu), đáp án là số tối đa 4 ký tự (gồm dấu '-' hoặc ',', không kèm đơn vị) theo chuẩn phiếu OMR Bộ GD&ĐT. Đa dạng: tính toán, nhận dạng đồ thị/hàm số, hình học, xác suất – thống kê, bài toán thực tế.`,
  },
  {
    id: 'ly', label: 'Vật lý', aliases: ['vat ly', 'vat li', 'ly', 'li', 'physics'], math: true,
    examFamily: 'science_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
    standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
    guide: `${MATH_RULE} Ghi rõ đơn vị SI (dùng \\text{m/s}, \\text{N}…). Kiểm tra lại đáp án bằng cách thay số. Với Phần III Trả lời ngắn (0,25đ/câu), đáp án là số tối đa 4 ký tự (không kèm đơn vị) theo chuẩn phiếu OMR Bộ GD&ĐT. Có cả câu lý thuyết, câu tính toán và câu đọc đồ thị/thí nghiệm.`,
  },
  {
    id: 'hoa', label: 'Hóa học', aliases: ['hoa', 'hoa hoc', 'chemistry'], math: true,
    examFamily: 'science_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
    standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
    guide: `${MATH_RULE} Viết công thức hóa học và phương trình phản ứng bằng mhchem: $\\ce{H2SO4}$, $\\ce{2H2 + O2 -> 2H2O}$, ion: $\\ce{SO4^2-}$. Khối lượng mol và số liệu phải chính xác, phương trình phải cân bằng. Với Phần III Trả lời ngắn (0,25đ/câu), đáp án là số tối đa 4 ký tự (không kèm đơn vị). Có cả câu lý thuyết, tính toán, nhận biết chất, thực hành thí nghiệm.`,
  },
  {
    id: 'sinh', label: 'Sinh học', aliases: ['sinh', 'sinh hoc', 'biology'], math: true,
    examFamily: 'science_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
    standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
    guide: `${MATH_RULE} (Chỉ dùng LaTeX cho bài tập di truyền/xác suất.) Dùng thuật ngữ chuẩn theo SGK; có câu phân tích sơ đồ, thí nghiệm, bài tập di truyền. Với Phần III Trả lời ngắn (0,25đ/câu), đáp án là số tối đa 4 ký tự (không kèm đơn vị).`,
  },
  {
    id: 'van', label: 'Ngữ văn', aliases: ['van', 'van hoc', 'ngu van', 'literature'], math: false,
    examFamily: 'literature_essay',
    pointPerQuestion: { single_choice: 0, true_false: 0, short_answer: 0, essay: 1.5 },
    standardCounts: { p1: 0, p2: 0, p3: 0, essay: 6, total: 6, duration: 120, weights: { multiple_choice: 1, true_false: 4, short_answer: 1, essay: 4 } },
    guide: `Theo cấu trúc QĐ 764/QĐ-BGDĐT 2025: 100% Tự luận gồm Phần I Đọc hiểu (4,0đ — thường 4–5 câu trên ngữ liệu văn bản/thơ <=150–250 từ) + Phần II Viết (6,0đ — câu viết đoạn văn ~200 chữ 2,0đ + câu viết bài văn nghị luận ~600 chữ 4,0đ). Chỉ trích dẫn tác phẩm có thật và đúng nguyên văn; nếu không chắc nguyên văn, hãy tự viết đoạn mới và nói rõ là đoạn do AI viết. Không bịa thông tin về tác giả.`,
  },
  {
    id: 'anh', label: 'Tiếng Anh', aliases: ['anh', 'anh van', 'tieng anh', 'english'], math: false,
    examFamily: 'mcq_only',
    pointPerQuestion: { single_choice: 0.25, true_false: 0, short_answer: 0, essay: 0 },
    standardCounts: { p1: 40, p2: 0, p3: 0, essay: 0, total: 40, duration: 50, weights: { multiple_choice: 1, true_false: 0, short_answer: 0 } },
    guide: `Viết câu hỏi và đáp án bằng tiếng Anh (lời giải bằng tiếng Việt). Đa dạng: ngữ pháp, từ vựng, phát âm/trọng âm, giao tiếp, tìm lỗi sai, đọc hiểu (đoạn văn ngắn rồi 2–4 câu hỏi). Đúng trình độ lớp được chọn.`,
  },
  {
    id: 'su', label: 'Lịch sử', aliases: ['su', 'lich su', 'history'], math: false,
    examFamily: 'social_2part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0, essay: 0 },
    standardCounts: { p1: 24, p2: 4, p3: 0, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 0 } },
    guide: `Ghi rõ mốc thời gian, nhân vật, sự kiện chính xác theo SGK Việt Nam. Với câu Đúng/Sai chuẩn 2025, kèm đoạn tư liệu lịch sử ngắn trước 4 nhận định. Có câu về nguyên nhân – diễn biến – kết quả – ý nghĩa, và câu so sánh. Không bịa số liệu hay niên đại.`,
  },
  {
    id: 'dia', label: 'Địa lí', aliases: ['dia', 'dia li', 'dia ly', 'geography'], math: false,
    examFamily: 'geo_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
    standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
    guide: `Có câu về tự nhiên, dân cư, kinh tế, câu Đúng/Sai kèm bảng số liệu hoặc biểu đồ văn bản, và câu Trả lời ngắn (0,25đ/câu) tính mật độ, năng suất, tốc độ tăng trưởng, tỉ trọng (làm tròn rõ ràng, đáp án số tối đa 4 ký tự, không kèm đơn vị). Số liệu phải nhất quán, không bịa nguồn.`,
  },
  {
    id: 'gdcd', label: 'GDKT&PL', aliases: ['gdcd', 'gdkt&pl', 'gdkt pl', 'gdktpl', 'kinh te phap luat', 'giao duc cong dan', 'giao duc kinh te phap luat', 'giao duc kinh te va phap luat'], math: false,
    examFamily: 'social_2part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0, essay: 0 },
    standardCounts: { p1: 24, p2: 4, p3: 0, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 0 } },
    guide: `Dùng tình huống kinh tế/pháp luật thực tế để hỏi vận dụng; hỗ trợ câu hỏi chùm từ đoạn thông tin và câu Đúng/Sai phân tích hành vi pháp lý. Trích dẫn đúng tên luật/nguyên tắc hiện hành, không bịa số điều khoản.`,
  },
  {
    id: 'tin', label: 'Tin học', aliases: ['tin', 'tin hoc', 'cong nghe thong tin', 'informatics'], math: false,
    examFamily: 'social_2part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0, essay: 0 },
    standardCounts: { p1: 24, p2: 4, p3: 0, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 0 } },
    guide: `Câu hỏi có thể kèm đoạn mã ngắn (đặt trong khối \`\`\`). Hỏi: kết quả chạy chương trình Python/C++, SQL, HTML/CSS, thuật toán, mạng máy tính, cơ sở dữ liệu, an toàn thông tin. Đoạn mã phải chạy đúng và đáp án phải được kiểm tra bằng cách chạy tay.`,
  },
  {
    id: 'congnghe', label: 'Công nghệ', aliases: ['cong nghe', 'technology'], math: false,
    examFamily: 'social_2part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0, essay: 0 },
    standardCounts: { p1: 24, p2: 4, p3: 0, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 0 } },
    guide: `Gắn với ứng dụng thực tế (kỹ thuật điện, cơ khí, thiết kế, trồng trọt, chăn nuôi, lâm – ngư nghiệp). Có câu nhận biết dụng cụ/quy trình và câu Đúng/Sai tình huống sản xuất/mạch điện.`,
  },
  {
    id: 'khtn', label: 'Khoa học tự nhiên', aliases: ['khtn', 'khoa hoc tu nhien'], math: true,
    examFamily: 'science_3part',
    pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
    standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
    guide: `${MATH_RULE} Trộn đều các phân môn Lí – Hóa – Sinh theo chủ đề được chọn; công thức hóa học dùng mhchem ($\\ce{...}$). Với Phần III Trả lời ngắn, đáp án số tối đa 4 ký tự (không kèm đơn vị).`,
  },
];

/* Môn không nằm trong danh sách → vẫn tạo được đề */
export const GENERIC_SUBJECT = {
  id: 'generic', label: 'Môn khác', aliases: [], math: true,
  examFamily: 'science_3part',
  pointPerQuestion: { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 },
  standardCounts: { p1: 18, p2: 4, p3: 6, essay: 0, total: 28, duration: 50, weights: { multiple_choice: 1, true_false: 4, short_answer: 1 } },
  guide: `Đây là môn do giáo viên tự đặt tên. Dựa vào tên môn, khối lớp và chủ đề giáo viên cung cấp để soạn câu hỏi đúng kiến thức phổ thông/chuyên môn tương ứng. Nếu có công thức, viết bằng LaTeX trong $...$. Nếu chủ đề quá hẹp hoặc bạn không chắc kiến thức, ưu tiên các câu hỏi chắc chắn đúng thay vì suy đoán.`,
};

/** Tìm môn theo tên (bỏ dấu, không phân biệt hoa thường). */
export function getSubject(name) {
  const n = norm(name);
  if (!n) return GENERIC_SUBJECT;
  const hit = SUBJECTS.find(
    (s) => norm(s.label) === n || s.aliases.some((a) => norm(a) === n)
  );
  if (hit) return hit;
  const partial = SUBJECTS.find(
    (s) =>
      n.includes(norm(s.label)) ||
      norm(s.label).includes(n) ||
      s.aliases.some((a) => a.length >= 4 && (n.includes(a) || a.includes(n)))
  );
  return partial || GENERIC_SUBJECT;
}

/** Hồ sơ cấu trúc đề thi chuẩn GDPT 2018 / THPT 2025 theo môn học. */
function getDefaultPointPerQuestion(fam) {
  if (fam === 'literature_essay') {
    return { single_choice: 0, true_false: 0, short_answer: 0, essay: 1.5 };
  }
  if (fam === 'mcq_only') {
    return { single_choice: 0.25, true_false: 0, short_answer: 0, essay: 0 };
  }
  if (fam === 'social_2part') {
    return { single_choice: 0.25, true_false: 1.0, short_answer: 0, essay: 0 };
  }
  if (fam === 'math_3part') {
    return { single_choice: 0.25, true_false: 1.0, short_answer: 0.5, essay: 0 };
  }
  return { single_choice: 0.25, true_false: 1.0, short_answer: 0.25, essay: 0 };
}

export function getSubjectExamProfile(name) {
  const s = getSubject(name);
  const fam = s.examFamily || 'science_3part';
  return {
    ...s,
    examFamily: fam,
    pointPerQuestion: s.pointPerQuestion || getDefaultPointPerQuestion(fam),
    hasShortAnswer: fam === 'math_3part' || fam === 'science_3part' || fam === 'geo_3part',
    hasTrueFalse: fam !== 'mcq_only' && fam !== 'literature_essay',
    hasEssay: fam === 'literature_essay',
    usesPassages: ['anh', 'van', 'su', 'dia', 'gdcd', 'tin', 'congnghe'].includes(s.id),
    hasCodeBlocks: s.id === 'tin',
    supportsThreeParts: fam === 'math_3part' || fam === 'science_3part' || fam === 'geo_3part',
    supportsTwoParts: fam === 'social_2part',
  };
}

/** Đoạn hướng dẫn gắn vào prompt gửi AI. */
export function buildSubjectGuide(name) {
  const s = getSubject(name);
  const title = name?.trim() || s.label;
  return `MÔN HỌC: ${title}\n${s.guide}\n\nQUY TẮC CHUNG:\n${COMMON_RULES}`;
}

export const subjectUsesMath = (name) => getSubject(name).math;
