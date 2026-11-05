/* ============================================================
   examTemplates.js — BỘ KHUNG ĐỀ THI & HỒ SƠ KHẢO THÍ CHUẨN GDPT 2025
   Phục vụ liên kết thực tế: Trường học, Tổ chuyên môn, Thi giấy & Chấm OMR
   ============================================================ */

export const STANDARD_TEMPLATES = {
  natural_28: {
    id: 'natural_28',
    name: 'Khung Môn Tự Nhiên (Hóa / Lý / Sinh / Sử / Địa) — 28 câu chuẩn GDPT 2025',
    tag: 'Chuẩn Bộ 10.0đ',
    desc: 'Phần I (18 câu trắc nghiệm 4 lựa chọn: 4.5đ) + Phần II (4 câu Đúng/Sai: 4.0đ) + Phần III (6 câu Trả lời ngắn điền số: 1.5đ)',
    counts: { p1: 18, p2: 4, p3: 6 },
    duration: 50,
  },
  math_34: {
    id: 'math_34',
    name: 'Khung Môn Toán Học — 22 câu (34 ý hỏi) chuẩn GDPT 2025',
    tag: 'Chuẩn Bộ 10.0đ',
    desc: 'Phần I (12 câu trắc nghiệm 4 lựa chọn: 3.0đ) + Phần II (4 câu Đúng/Sai: 4.0đ) + Phần III (6 câu Trả lời ngắn điền số: 3.0đ)',
    counts: { p1: 12, p2: 4, p3: 6 },
    duration: 90,
  },
  quick_15: {
    id: 'quick_15',
    name: 'Khung Kiểm Tra 15 Phút / 1 Tiết Rút Gọn — 15 câu chuẩn cấu trúc 3 phần',
    tag: 'Rút gọn 10.0đ',
    desc: 'Phần I (8 câu: 4.0đ) + Phần II (3 câu Đúng/Sai: 3.0đ) + Phần III (4 câu Trả lời ngắn: 3.0đ)',
    counts: { p1: 8, p2: 3, p3: 4 },
    duration: 15,
  },
};

/**
 * Sinh danh sách câu hỏi mẫu chuẩn kiến thức theo Môn và Khối lớp
 */
export function generateTemplateQuestions(templateId = 'natural_28', subject = 'Hóa học', grade = '12') {
  const tpl = STANDARD_TEMPLATES[templateId] || STANDARD_TEMPLATES.natural_28;
  const { p1, p2, p3 } = tpl.counts;

  const questions = [];
  let globalIndex = 1;

  // PHẦN I: Trắc nghiệm 4 lựa chọn
  for (let i = 1; i <= p1; i++) {
    const level = i <= Math.ceil(p1 * 0.4) ? 'nb' : i <= Math.ceil(p1 * 0.75) ? 'th' : 'vd';
    const optLetters = ['A', 'B', 'C', 'D'];
    const correctIdx = (i - 1) % 4;

    questions.push({
      id: `q_p1_${i}`,
      part: 1,
      type: 'single_choice',
      number: globalIndex++,
      level,
      question: getPart1QuestionText(subject, grade, i, level),
      options: optLetters.map((l, oIdx) => `${l}. ${getOptionText(subject, grade, i, oIdx)}`),
      correct: correctIdx,
      answer: optLetters[correctIdx],
      explanation: `Lời giải câu ${i}: Vận dụng kiến thức ${subject} khối ${grade} (Mức độ: ${level.toUpperCase()}). Chọn phương án ${optLetters[correctIdx]}.`,
    });
  }

  // PHẦN II: Trắc nghiệm Đúng/Sai
  for (let i = 1; i <= p2; i++) {
    const level = i === 1 ? 'nb' : i === 2 ? 'th' : i === 3 ? 'vd' : 'vdc';
    questions.push({
      id: `q_p2_${i}`,
      part: 2,
      type: 'true_false',
      number: globalIndex++,
      level,
      question: getPart2QuestionStem(subject, grade, i),
      statements: [
        { text: `Nhận định a: ${getStatementText(subject, grade, i, 'a')}`, answer: (i + 1) % 2 === 0 },
        { text: `Nhận định b: ${getStatementText(subject, grade, i, 'b')}`, answer: (i + 2) % 2 === 0 },
        { text: `Nhận định c: ${getStatementText(subject, grade, i, 'c')}`, answer: (i + 3) % 2 === 0 },
        { text: `Nhận định d: ${getStatementText(subject, grade, i, 'd')}`, answer: (i + 4) % 2 === 0 },
      ],
      explanation: `Thẩm định Phần II Câu ${i}: Đánh giá 4 mệnh đề nhận thức NB/TH/VD/VDC chuẩn thang điểm Bộ GD&ĐT 0.1 - 0.25 - 0.5 - 1.0 điểm.`,
    });
  }

  // PHẦN III: Trả lời ngắn
  for (let i = 1; i <= p3; i++) {
    const level = i <= 2 ? 'th' : i <= 5 ? 'vd' : 'vdc';
    const ansNum = String(Math.round((i * 1.5 + 2) * 10) / 10);
    questions.push({
      id: `q_p3_${i}`,
      part: 3,
      type: 'short_answer',
      number: globalIndex++,
      level,
      question: getPart3QuestionText(subject, grade, i, ansNum),
      answer: ansNum,
      explanation: `Phương pháp giải Phần III Câu ${i}: Biến đổi đại lượng, bảo toàn khối lượng/nguyên tố hoặc định lý giải tích để ra giá trị số duy nhất: ${ansNum}.`,
    });
  }

  return questions;
}

// Helpers tạo văn bản theo môn
function getPart1QuestionText(subject, grade, i, level) {
  if (subject === 'Toán học') {
    return `Cho hàm số y = f(x) liên tục và xác định trên tập số thực. Mệnh đề khảo sát số học ${i} nào sau đây đúng?`;
  }
  if (subject === 'Vật lí') {
    return `Trong một dao động điều hòa hoặc mạch điện xoay chiều, đại lượng vật lý thứ ${i} có đặc điểm nào dưới đây?`;
  }
  if (subject === 'Sinh học') {
    return `Trong cơ chế di truyền phân tử và biến dị ở sinh vật nhân thực, phát biểu thứ ${i} nào sau đây chính xác?`;
  }
  // Mặc định Hóa học
  if (i === 1) return 'Chất nào sau đây thuộc loại este no, đơn chức, mạch hở có công thức phân tử C4H8O2?';
  if (i === 2) return 'Thủy phân hoàn toàn chất béo triolein trong dung dịch NaOH đun nóng thu được glixerol và muối nào sau đây?';
  if (i === 3) return 'Chất nào sau đây ở điều kiện thường tồn tại ở trạng thái lỏng và nhẹ hơn nước?';
  return `Hợp chất hữu cơ hoặc phản ứng hóa học thứ ${i} có tính chất đặc trưng nào sau đây?`;
}

function getOptionText(subject, grade, qIdx, oIdx) {
  if (subject === 'Toán học') {
    const vals = ['y = 2x + 1', 'f\'(x) > 0 với mọi x', 'Đồ thị có 2 điểm cực trị', 'Hàm số đồng biến trên R'];
    return vals[oIdx % vals.length];
  }
  if (subject === 'Sinh học') {
    const vals = ['Quá trình phiên mã diễn ra trong nhân', 'mARN mang bộ ba đối mã anticodon', 'A liên kết với T bằng 2 liên kết hidro', 'Riboxom dịch mã theo chiều 5\' -> 3\''];
    return vals[oIdx % vals.length];
  }
  // Mặc định Hóa học
  const vals = ['methyl acetate', 'ethyl formate', 'triolein', 'sodium stearate'];
  return vals[oIdx % vals.length];
}

function getPart2QuestionStem(subject, grade, i) {
  if (subject === 'Toán học') {
    return `Cho hàm số bậc ba y = ax³ + bx² + cx + d có đồ thị như hình vẽ. Xét tính Đúng / Sai của các khẳng định sau:`;
  }
  if (subject === 'Vật lí') {
    return `Tiến hành thí nghiệm khảo sát hiện tượng sóng dừng trên một sợi dây đàn hồi có hai đầu cố định. Mỗi khẳng định sau đây là Đúng hay Sai:`;
  }
  if (subject === 'Sinh học') {
    return `Một loài thực vật giao phấn ngẫu nhiên, xét một gen có 2 alen A và a quy định chiều cao cây. Mỗi nhận định sau đây là Đúng hay Sai:`;
  }
  return `Tiến hành thí nghiệm xà phòng hóa chất béo hoặc điều chế este trong phòng thí nghiệm. Xét tính Đúng / Sai của các phát biểu sau:`;
}

function getStatementText(subject, grade, qIdx, sLetter) {
  return `Nội dung mệnh đề khảo sát mức độ nhận thức ý (${sLetter}) liên quan đến tính chất thực nghiệm và cơ chế suy luận.`;
}

function getPart3QuestionText(subject, grade, i, ansNum) {
  if (subject === 'Toán học') {
    return `Tìm giá trị lớn nhất hoặc số nghiệm thực phân biệt của phương trình f(x) = ${ansNum} trên đoạn [0; 5]:`;
  }
  if (subject === 'Vật lí') {
    return `Tính biên độ dao động tổng hợp hoặc điện áp hiệu dụng hai đầu mạch theo đơn vị chuẩn (Làm tròn đến 1 chữ số thập phân):`;
  }
  if (subject === 'Sinh học') {
    return `Theo lý thuyết, tỉ lệ phần trăm số cá thể mang kiểu gen đồng hợp lặn trong quần thể cân bằng di truyền là bao nhiêu phần trăm?`;
  }
  return `Thủy phân hoàn toàn m gam hỗn hợp este cần vừa đủ V ml dung dịch NaOH 1M. Sau phản ứng cô cạn dung dịch thu được bao nhiêu gam muối khan? (Đáp số: ${ansNum})`;
}

/**
 * Chuyển đổi 4 phiên bản đề đảo thành bộ đáp án khóa OMR (Paper Store Keys)
 */
export function buildPaperKeysFromVersions(versions = []) {
  const keys = {};

  versions.forEach((ver) => {
    const code = String(ver.code || '101');
    const p1 = [];
    const p2 = [];
    const p3 = [];

    (ver.questions || []).forEach((q) => {
      const part = q.part || (q.type === 'true_false' ? 2 : q.type === 'short_answer' ? 3 : 1);
      if (part === 1) {
        const letters = ['A', 'B', 'C', 'D'];
        const ans = q.correct !== undefined && q.correct >= 0 && q.correct <= 3 ? letters[q.correct] : (String(q.answer || 'A').toUpperCase().charAt(0));
        p1.push(ans);
      } else if (part === 2) {
        // Đúng/Sai 4 ý: chuỗi T/F
        const stmts = Array.isArray(q.statements) ? q.statements : [];
        const tf = stmts.map((s) => (s.answer ? 'T' : 'F')).join('');
        p2.push(tf || 'TFTF');
      } else if (part === 3) {
        p3.push(String(q.answer || '0'));
      }
    });

    keys[code] = {
      p1,
      p2,
      p3,
    };
  });

  return keys;
}
