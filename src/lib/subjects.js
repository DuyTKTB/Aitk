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
    id: 'toan', label: 'Toán', aliases: ['toan hoc'], math: true,
    guide: `${MATH_RULE} Số liệu phải tính ra được đáp án chính xác; giải lại từng bước trước khi chốt đáp án. Đa dạng: tính toán, nhận dạng đồ thị/hàm số, hình học, xác suất – thống kê, bài toán thực tế.`,
  },
  {
    id: 'ly', label: 'Vật lí', aliases: ['vat ly', 'vat li', 'ly'], math: true,
    guide: `${MATH_RULE} Ghi rõ đơn vị SI (dùng \\text{m/s}, \\text{N}…). Kiểm tra lại đáp án bằng cách thay số. Có cả câu lý thuyết, câu tính toán và câu đọc đồ thị/thí nghiệm.`,
  },
  {
    id: 'hoa', label: 'Hóa học', aliases: ['hoa', 'hoa hoc'], math: true,
    guide: `${MATH_RULE} Viết công thức hóa học và phương trình phản ứng bằng mhchem: $\\ce{H2SO4}$, $\\ce{2H2 + O2 -> 2H2O}$, ion: $\\ce{SO4^2-}$. Khối lượng mol và số liệu phải chính xác, phương trình phải cân bằng. Có cả câu lý thuyết, tính toán, nhận biết chất, thực hành thí nghiệm.`,
  },
  {
    id: 'sinh', label: 'Sinh học', aliases: ['sinh', 'sinh hoc'], math: true,
    guide: `${MATH_RULE} (Chỉ dùng LaTeX cho bài tập di truyền/xác suất.) Dùng thuật ngữ chuẩn theo SGK; có câu phân tích sơ đồ, thí nghiệm, bài tập di truyền.`,
  },
  {
    id: 'van', label: 'Ngữ văn', aliases: ['van', 'van hoc', 'ngu van'], math: false,
    guide: `Ưu tiên câu đọc hiểu: cung cấp một đoạn văn bản ngắn (<=150 từ) trong phần câu hỏi rồi hỏi về nội dung, biện pháp tu từ, thể loại, từ ngữ. Chỉ trích dẫn tác phẩm có thật và đúng nguyên văn; nếu không chắc nguyên văn, hãy tự viết đoạn mới và nói rõ là đoạn do AI viết. Không bịa thông tin về tác giả.`,
  },
  {
    id: 'anh', label: 'Tiếng Anh', aliases: ['anh', 'anh van', 'english'], math: false,
    guide: `Viết câu hỏi và đáp án bằng tiếng Anh (lời giải bằng tiếng Việt). Đa dạng: ngữ pháp, từ vựng, phát âm/trọng âm, giao tiếp, tìm lỗi sai, đọc hiểu (đoạn văn ngắn rồi 2–4 câu hỏi). Đúng trình độ lớp được chọn.`,
  },
  {
    id: 'su', label: 'Lịch sử', aliases: ['su', 'lich su'], math: false,
    guide: `Ghi rõ mốc thời gian, nhân vật, sự kiện chính xác theo SGK Việt Nam. Có câu về nguyên nhân – diễn biến – kết quả – ý nghĩa, và câu so sánh. Không bịa số liệu hay niên đại.`,
  },
  {
    id: 'dia', label: 'Địa lí', aliases: ['dia', 'dia li', 'dia ly'], math: false,
    guide: `Có câu về tự nhiên, dân cư, kinh tế, và câu đọc bảng số liệu/biểu đồ (mô tả số liệu ngay trong câu hỏi dưới dạng bảng văn bản). Số liệu phải nhất quán, không bịa nguồn.`,
  },
  {
    id: 'gdcd', label: 'GDCD / Kinh tế và Pháp luật', aliases: ['gdcd', 'giao duc cong dan', 'giao duc kinh te phap luat', 'kinh te phap luat'], math: false,
    guide: `Dùng tình huống thực tế để hỏi vận dụng; trích dẫn đúng tên luật/điều khoản theo chương trình hiện hành, không chắc thì nêu nguyên tắc chung thay vì số điều.`,
  },
  {
    id: 'tin', label: 'Tin học', aliases: ['tin', 'cong nghe thong tin'], math: false,
    guide: `Câu hỏi có thể kèm đoạn mã ngắn (đặt trong khối \`\`\`). Hỏi: kết quả chạy chương trình, tìm lỗi, thuật toán, mạng, cơ sở dữ liệu, an toàn thông tin. Đoạn mã phải chạy đúng và đáp án phải được kiểm tra bằng cách chạy tay.`,
  },
  {
    id: 'congnghe', label: 'Công nghệ', aliases: ['cong nghe'], math: false,
    guide: `Gắn với ứng dụng thực tế (kỹ thuật, nông nghiệp, thiết kế). Có câu nhận biết dụng cụ/quy trình và câu tình huống.`,
  },
  {
    id: 'khtn', label: 'Khoa học tự nhiên', aliases: ['khtn', 'khoa hoc tu nhien'], math: true,
    guide: `${MATH_RULE} Trộn đều các phân môn Lí – Hóa – Sinh theo chủ đề được chọn; công thức hóa học dùng mhchem ($\\ce{...}$).`,
  },
];

/* Môn không nằm trong danh sách → vẫn tạo được đề */
export const GENERIC_SUBJECT = {
  id: 'generic', label: 'Môn khác', aliases: [], math: true,
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
    (s) => n.includes(norm(s.label)) || norm(s.label).includes(n)
  );
  return partial || GENERIC_SUBJECT;
}

/** Đoạn hướng dẫn gắn vào prompt gửi AI. */
export function buildSubjectGuide(name) {
  const s = getSubject(name);
  const title = name?.trim() || s.label;
  return `MÔN HỌC: ${title}\n${s.guide}\n\nQUY TẮC CHUNG:\n${COMMON_RULES}`;
}

export const subjectUsesMath = (name) => getSubject(name).math;
