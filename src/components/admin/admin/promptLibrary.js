/* ============================================================
   THƯ VIỆN PROMPT — sinh câu hỏi trắc nghiệm bằng AI
   Thiết kế để: (1) đáp án đúng khoa học, (2) JSON luôn import được,
   (3) phân bố mức độ như đề thi THPT, (4) tránh lỗi ký hiệu/LaTeX.
   ============================================================ */

export const TEMPLATES = [
  { id: 'fromText', name: 'Từ nội dung', desc: 'Dán SGK, bài giảng hoặc đề cũ → AI chuyển thành câu hỏi', needs: 'text' },
  { id: 'fromTopic', name: 'Từ chủ đề', desc: 'Chỉ cần tên chủ đề → AI tự soạn câu hỏi đa dạng', needs: 'topic' },
  { id: 'fromImage', name: 'Từ ảnh đề', desc: 'Chụp/ảnh đề giấy → AI đọc và số hóa', needs: 'image' },
  { id: 'fullExam', name: 'Đề hoàn chỉnh', desc: 'Sinh cả đề (tiêu đề, thời gian, câu hỏi) để Import một lần', needs: 'topic' },
  { id: 'reviewJson', name: 'Rà soát đáp án', desc: 'Dán JSON đã có → AI kiểm tra, sửa đáp án sai và báo lại', needs: 'json' },
];

export const DIFFICULTY_PLANS = {
  easy: { label: 'Dễ', mix: [70, 30, 0, 0] },
  medium: { label: 'Trung bình', mix: [30, 40, 30, 0] },
  hard: { label: 'Khó', mix: [10, 30, 40, 20] },
  extreme: { label: 'Rất khó', mix: [0, 10, 40, 50] },
  mix: { label: 'Phân hóa (giống đề THPT)', mix: [40, 30, 20, 10] },
};

const LEVELS = [
  { name: 'Nhận biết', diff: 'easy', desc: 'nhớ khái niệm, tên gọi, công thức, tính chất cơ bản; không cần tính toán' },
  { name: 'Thông hiểu', diff: 'medium', desc: 'giải thích, so sánh, nhận xét hiện tượng, tính toán 1 bước' },
  { name: 'Vận dụng', diff: 'hard', desc: 'bài toán hoặc tình huống nhiều bước, phải kết hợp 2–3 kiến thức' },
  { name: 'Vận dụng cao', diff: 'extreme', desc: 'tổng hợp nhiều chương, biện luận, bài toán thực tiễn, dữ kiện nhiễu' },
];

export const EXAM_TYPE_LABELS = {
  giua_ky: 'Giữa kỳ', cuoi_ky: 'Cuối kỳ', thpt: 'THPT Quốc gia', chuyen_de: 'Chuyên đề', khao_sat: 'Khảo sát',
};

/* Chia total thành các phần theo tỉ lệ, tổng luôn đúng bằng total (largest remainder) */
export function splitCount(total, mix) {
  const sum = mix.reduce((a, b) => a + b, 0) || 1;
  const raw = mix.map((m) => (total * m) / sum);
  const base = raw.map(Math.floor);
  let left = total - base.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (left > 0 && mix[i] > 0) { base[i] += 1; left -= 1; }
    });
  return base;
}

export const estimateTokens = (s) => Math.round(s.length / 3.2);

/* ----------------------------- các khối dùng chung ----------------------------- */
const isChem = (s) => /hóa|hoá/i.test(s || '');
const isCalc = (s) => /toán|lí|lý|vật|hóa|hoá|sinh/i.test(s || '');

const role = (o) =>
  `Bạn là giáo viên ${o.subject} ${o.grade} giàu kinh nghiệm ở trường THPT Việt Nam, đồng thời là người ra đề thi theo Chương trình GDPT 2018 và cấu trúc đề của Bộ GD&ĐT. Bạn ra đề chính xác, rõ ràng, không đánh đố vô nghĩa.`;

function levelPlan(o) {
  const plan = DIFFICULTY_PLANS[o.difficulty] || DIFFICULTY_PLANS.medium;
  const counts = splitCount(o.count, plan.mix);
  const lines = LEVELS.map((lv, i) => (counts[i] > 0
    ? `- ${lv.name}: ${counts[i]} câu — ${lv.desc}. Ghi "difficulty": "${lv.diff}".`
    : null)).filter(Boolean);
  return `CƠ CẤU MỨC ĐỘ (bắt buộc đúng số lượng, tổng ${o.count} câu — mức "${plan.label}"):\n${lines.join('\n')}\nTrộn thứ tự các mức độ trong đề; không xếp dồn câu dễ lên đầu.`;
}

function quality(o) {
  const rules = [
    'Chính xác khoa học tuyệt đối. TỰ GIẢI LẠI từng câu trước khi chốt đáp án; câu nào chưa chắc chắn thì thay bằng câu khác, không đoán.',
    'Mỗi câu có ĐÚNG 1 đáp án đúng, 4 phương án A, B, C, D.',
    'Phương án nhiễu phải hợp lý, bám sát sai lầm học sinh hay mắc (nhầm khái niệm, sai dấu, quên đổi đơn vị, nhầm tỉ lệ mol…). Không dùng phương án vô lý. Các phương án có độ dài và văn phong tương đương.',
    'Hạn chế tối đa "Cả A và B đúng", "Tất cả đều đúng", "Không có đáp án nào đúng".',
    'Đáp án đúng phân bố gần đều giữa A, B, C, D; không quá 2 câu liên tiếp trùng đáp án.',
    'Các câu không trùng ý nhau. Mỗi câu chỉ có một cách hiểu duy nhất, văn phong chuẩn sách giáo khoa.',
    'Lời giải (explanation) dài 2–5 câu: nêu căn cứ → phép tính/lập luận → chỉ rõ vì sao phương án gây nhầm lẫn nhất là sai. Câu có tính toán phải ghi rõ các bước và kết quả.',
  ];
  if (isChem(o.subject)) {
    rules.push(
      'Nguyên tử khối dùng thống nhất: H=1; C=12; N=14; O=16; F=19; Na=23; Mg=24; Al=27; P=31; S=32; Cl=35,5; K=39; Ca=40; Cr=52; Mn=55; Fe=56; Cu=64; Zn=65; Br=80; Ag=108; Ba=137; Pb=207.',
      'Thể tích khí: nếu đề không nói rõ, dùng điều kiện chuẩn 25 °C, 1 bar (1 mol khí = 24,79 lít) theo chương trình 2018; chỉ dùng 22,4 lít/mol khi đề ghi "đktc".',
      'Phương trình hóa học phải cân bằng đúng, nêu điều kiện phản ứng khi cần. Gọi tên theo danh pháp IUPAC, có thể kèm tên thông thường.',
    );
  } else if (isCalc(o.subject)) {
    rules.push('Câu có tính toán: ghi đủ đơn vị, nêu quy ước làm tròn trong đề bài nếu cần, kết quả các phương án phải khác nhau rõ rệt.');
  }
  rules.push(
    'KÝ HIỆU: KHÔNG dùng LaTeX và KHÔNG dùng dấu gạch chéo ngược (\\). Viết công thức bằng ký tự Unicode: H₂SO₄, Fe³⁺, CO₃²⁻, x², √, ½, π, →, ⇌, ≥, ≤, ≠, °C. Ví dụ phản ứng: 2H₂ + O₂ → 2H₂O.',
    'Trong giá trị chuỗi không dùng định dạng markdown (**, #, `). Muốn xuống dòng dùng \\n. Dấu nháy kép bên trong nội dung phải viết là \\".',
  );
  return `QUY TẮC CHẤT LƯỢNG:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
}

const QUESTION_SCHEMA = `    {
      "content": "Nội dung câu hỏi?",
      "type": "single_choice",
      "options": [
        { "label": "A", "content": "Phương án A" },
        { "label": "B", "content": "Phương án B" },
        { "label": "C", "content": "Phương án C" },
        { "label": "D", "content": "Phương án D" }
      ],
      "correctAnswer": "B",
      "explanation": "Lời giải 2–5 câu",
      "difficulty": "easy | medium | hard | extreme",
      "topic": "Chủ đề ngắn gọn (tối đa 6 từ)"
    }`;

function output(o, { exam = false, review = false } = {}) {
  const meta = exam
    ? `  "title": "Tiêu đề đề thi",
  "description": "Mô tả ngắn 1–2 câu về phạm vi kiến thức",
  "grade_id": ${o.gradeId ?? 'null'},
  "subject_id": ${o.subjectId ?? 'null'},
  "exam_type": "${o.examType || 'giua_ky'}",
  "duration": ${o.duration || 45},
  "difficulty": "${o.difficulty === 'mix' ? 'medium' : o.difficulty}",
  "source": "AI tạo",
`
    : '';
  const extra = review
    ? '\nThêm vào MỖI câu một trường "fixNote": mô tả ngắn điều bạn đã sửa (ví dụ "Đổi đáp án đúng từ A sang C vì …"); nếu không sửa gì thì để "".'
    : '';
  return `ĐỊNH DẠNG ĐẦU RA:
Trả lời CHỈ bằng MỘT code block \`\`\`json chứa JSON hợp lệ theo mẫu dưới đây; không viết thêm bất kỳ chữ nào ngoài code block.

{
${meta}  "questions": [
${QUESTION_SCHEMA}
  ]
}${extra}

Ràng buộc JSON: "correctAnswer" là MỘT chữ cái in hoa trùng với "label" của một phương án; "difficulty" chỉ nhận easy, medium, hard hoặc extreme; không có dấu phẩy thừa; không có chú thích // trong JSON.`;
}

const selfCheck = (o, { review = false } = {}) =>
  `TỰ KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ:
- ${review ? 'Giữ nguyên số câu của dữ liệu đầu vào' : o.countMax ? `Không vượt quá ${o.count} câu` : `Đủ đúng ${o.count} câu`}${review ? '.' : ' và đúng cơ cấu mức độ.'}
- Mỗi câu có đúng 1 đáp án đúng; "correctAnswer" khớp với lời giải.
- Đã giải lại mọi câu có tính toán và kết quả khớp phương án được chọn.
- Không có LaTeX, không có dấu \\ lạ, JSON mở/đóng ngoặc đầy đủ.${o.count > 25 ? '\n- Nếu sắp hết độ dài cho phép, hãy dừng ở câu hoàn chỉnh cuối cùng thay vì cắt giữa chừng.' : ''}`;

const extraBlock = (o) => (o.extra?.trim() ? `YÊU CẦU BỔ SUNG CỦA NGƯỜI DÙNG:\n${o.extra.trim()}` : null);

const join = (parts) => parts.filter(Boolean).join('\n\n');

/* ----------------------------- các mẫu prompt ----------------------------- */
const BUILDERS = {
  fromText: (o) => join([
    role(o),
    `NHIỆM VỤ: Dựa vào NỘI DUNG dưới đây, soạn ${o.count} câu hỏi trắc nghiệm môn ${o.subject} ${o.grade}.`,
    `NỘI DUNG NGUỒN:\n"""\n${o.text?.trim() || '(Dán nội dung bài học / đề thi vào đây)'}\n"""`,
    `QUY ĐỊNH VỀ NGUỒN:
- Đáp án đúng của mỗi câu phải suy ra được từ NỘI DUNG NGUỒN hoặc kiến thức chuẩn SGK liên quan trực tiếp; tuyệt đối không bịa số liệu.
- Nếu nguồn đã có sẵn câu hỏi trắc nghiệm: giữ nguyên ý và đáp án gốc, chỉ chuẩn hóa câu chữ và định dạng.
- Phân bố câu hỏi đều theo các phần của nguồn, không tập trung vào một đoạn.
- Nếu nguồn không đủ dữ kiện cho ${o.count} câu chất lượng, chỉ tạo số câu thật sự đủ tốt, không độn câu.`,
    levelPlan(o),
    quality(o),
    extraBlock(o),
    output(o),
    selfCheck(o),
  ]),

  fromTopic: (o) => join([
    role(o),
    `NHIỆM VỤ: Soạn ${o.count} câu hỏi trắc nghiệm môn ${o.subject} ${o.grade} về chủ đề: "${o.topic?.trim() || '(nhập chủ đề)'}".`,
    `PHẠM VI NỘI DUNG:
- Bám sát yêu cầu cần đạt của Chương trình GDPT 2018 cho chủ đề trên ở ${o.grade}.
- Bao quát nhiều khía cạnh của chủ đề: khái niệm, tính chất, ứng dụng thực tiễn${isCalc(o.subject) ? ', bài tập tính toán (khoảng 60% lý thuyết – 40% bài tập)' : ''}.
- Không lặp lại cùng một dạng câu hỏi quá 2 lần.`,
    levelPlan(o),
    quality(o),
    extraBlock(o),
    output(o),
    selfCheck(o),
  ]),

  fromImage: (o) => join([
    role(o),
    `NHIỆM VỤ: Ảnh đề thi ${o.subject} ${o.grade} được đính kèm cùng tin nhắn này. Hãy số hóa thành tối đa ${o.count} câu trắc nghiệm có cấu trúc.`,
    `QUY TRÌNH:
Bước 1 — Đọc ảnh và chép lại đầy đủ từng câu, giữ nguyên số liệu, công thức, đơn vị (viết theo quy tắc ký hiệu bên dưới).
Bước 2 — Nếu ảnh có khóa đáp án thì dùng làm tham chiếu; sau đó TỰ GIẢI LẠI từng câu để kiểm tra. Khi khóa trong ảnh mâu thuẫn với lời giải đúng khoa học, chọn đáp án đúng khoa học và ghi vào lời giải: "Lưu ý: khóa đề ghi X".
Bước 3 — Nếu ảnh không có khóa đáp án, tự giải và chọn đáp án đúng.
Bước 4 — Hình vẽ, đồ thị, bảng số liệu: mô tả bằng lời ngay trong nội dung câu hỏi, đặt trong ngoặc vuông, ví dụ [Hình: đồ thị …].
Bước 5 — Chỗ nào bị mờ, cắt mất chữ hoặc không chắc chắn: bỏ qua câu đó, KHÔNG đoán.`,
    `Mức độ: ${DIFFICULTY_PLANS[o.difficulty]?.label || 'Trung bình'} — nếu ảnh không cho biết mức độ, tự đánh giá từng câu và điền "difficulty" cho phù hợp.`,
    quality(o),
    extraBlock(o),
    output(o),
    selfCheck({ ...o, countMax: true }),
  ]),

  fullExam: (o) => join([
    role(o),
    `NHIỆM VỤ: Soạn MỘT ĐỀ THI HOÀN CHỈNH loại "${EXAM_TYPE_LABELS[o.examType] || 'Giữa kỳ'}" môn ${o.subject} ${o.grade}, gồm ${o.count} câu trắc nghiệm, thời gian ${o.duration || 45} phút${o.topic?.trim() ? `, phạm vi: "${o.topic.trim()}"` : ''}.`,
    `YÊU CẦU CẤU TRÚC ĐỀ:
- Tiêu đề đề thi rõ ràng, có loại đề, môn, lớp (ví dụ "Đề kiểm tra giữa kỳ 1 — Hóa học 11").
- Số câu hợp lý với thời gian (khoảng 1 phút/câu với câu lý thuyết, 1,5–2 phút/câu với câu tính toán).
- Nội dung bao quát phạm vi, mỗi chủ đề nhỏ có ít nhất 1 câu.`,
    levelPlan(o),
    quality(o),
    extraBlock(o),
    output(o, { exam: true }),
    selfCheck(o),
  ]),

  reviewJson: (o) => join([
    role(o),
    `NHIỆM VỤ: Rà soát và sửa lỗi bộ câu hỏi ${o.subject} ${o.grade} dưới đây (định dạng JSON).`,
    `DỮ LIỆU CẦN RÀ SOÁT:\n"""\n${o.text?.trim() || '(Dán JSON câu hỏi cần kiểm tra vào đây)'}\n"""`,
    `VIỆC CẦN LÀM VỚI TỪNG CÂU:
1. Tự giải lại câu hỏi và xác định đáp án đúng khoa học.
2. Kiểm tra "correctAnswer" có đúng không; kiểm tra có phương án nhiễu nào cũng đúng (nhiều đáp án đúng) hoặc không có phương án nào đúng.
3. Kiểm tra lời giải có khớp đáp án, tính toán đúng, dùng đúng nguyên tử khối/đơn vị.
4. Sửa lỗi chính tả, lỗi diễn đạt gây hiểu nhầm, ký hiệu LaTeX (đổi sang Unicode).
5. Nếu câu quá sai hoặc không cứu được, viết lại thành câu mới cùng chủ đề và ghi rõ trong "fixNote".
Không thay đổi ý định của câu hỏi nếu câu đã đúng.`,
    quality({ ...o, count: 0 }),
    extraBlock(o),
    output(o, { review: true }),
    selfCheck(o, { review: true }),
  ]),
};

export function buildPrompt(templateId, options) {
  const o = { count: 10, difficulty: 'medium', subject: 'Hóa học', grade: 'Lớp 11', ...options };
  const build = BUILDERS[templateId] || BUILDERS.fromText;
  return build(o);
}

/* Kiểm tra đã nhập đủ thông tin chưa → thông báo thiếu hoặc null */
export function missingInput(templateId, o) {
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (t?.needs === 'text' && !o.text?.trim()) return 'Hãy dán nội dung bài học hoặc đề thi ở bước 2.';
  if (t?.needs === 'json' && !o.text?.trim()) return 'Hãy dán JSON cần rà soát ở bước 2.';
  if (templateId === 'fromTopic' && !o.topic?.trim()) return 'Hãy nhập chủ đề ở bước 2.';
  return null;
}
