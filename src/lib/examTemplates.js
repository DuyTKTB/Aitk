/* ============================================================
   examTemplates.js — BỘ KHUNG ĐỀ THI & HỒ SƠ KHẢO THÍ CHUẨN GDPT 2025
   Phục vụ liên kết thực tế: Trường học, Tổ chuyên môn, Thi giấy & Chấm OMR
   ============================================================ */

export const STANDARD_TEMPLATES = {
  natural_28: {
    id: 'natural_28',
    name: 'Khung KHTN & Địa lí (Lý / Hóa / Sinh / Địa) — 28 câu chuẩn GDPT 2025',
    tag: 'Chuẩn Bộ 10.0đ',
    desc: 'Phần I (18 câu trắc nghiệm 4 lựa chọn: 4.5đ) + Phần II (4 câu Đúng/Sai: 4.0đ) + Phần III (6 câu Trả lời ngắn: 1.5đ)',
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
  social_28: {
    id: 'social_28',
    name: 'Khung KHXH & Tin / Công nghệ (Sử / GDKT&PL / Tin / CN) — 28 câu GDPT 2025',
    tag: 'Chuẩn Bộ 10.0đ',
    desc: 'Phần I (24 câu trắc nghiệm 4 lựa chọn: 6.0đ) + Phần II (4 câu Đúng/Sai: 4.0đ)',
    counts: { p1: 24, p2: 4, p3: 0 },
    duration: 50,
  },
  english_40: {
    id: 'english_40',
    name: 'Khung Môn Tiếng Anh — 40 câu Trắc nghiệm chuẩn GDPT 2025',
    tag: 'Chuẩn Bộ 10.0đ',
    desc: '40 câu trắc nghiệm 4 lựa chọn (Đọc điền, sắp xếp hội thoại/đoạn văn, đọc hiểu — 0.25đ/câu)',
    counts: { p1: 40, p2: 0, p3: 0 },
    duration: 50,
  },
  literature_essay: {
    id: 'literature_essay',
    name: 'Khung Môn Ngữ Văn — Đọc hiểu & Làm văn Tự luận GDPT 2025',
    tag: 'Tự luận 10.0đ',
    desc: 'Phần I Đọc hiểu văn bản (5 câu: 4.0đ) + Phần II Làm văn (2 câu nghị luận: 6.0đ)',
    counts: { p1: 0, p2: 0, p3: 0, essay: 7 },
    duration: 120,
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
  const { p1 = 0, p2 = 0, p3 = 0, essay = 0 } = tpl.counts;

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
      explanation: `Phương pháp giải Phần III Câu ${i}: Xác định đúng công thức và kết quả số: ${ansNum}.`,
    });
  }

  // PHẦN IV: Tự luận (Ngữ văn / Tự luận môn học)
  const isLitSubject = /ngữ\s*văn|ngu\s*van|^văn$/i.test(String(subject || '').trim());
  const essayReadingCount = Math.max(0, essay - 2);
  for (let i = 1; i <= essay; i++) {
    const isLongWriting = i === essay;
    const isShortWriting = essay >= 2 && i === essay - 1;
    const pts = isLongWriting
      ? 4
      : isShortWriting
        ? 2
        : essayReadingCount === 5
          ? (i <= 2 ? 0.5 : 1)
          : essayReadingCount > 0
            ? Math.round((4 / essayReadingCount) * 100) / 100
            : 2;
    const qStem = isLitSubject
      ? isLongWriting
        ? `Phần II - Câu 2 (Viết bài văn, ${pts} điểm): Viết bài văn nghị luận (~600 chữ) phân tích, đánh giá giá trị nội dung và nghệ thuật hoặc vấn đề xã hội (Ngữ văn lớp ${grade}).`
        : isShortWriting
          ? `Phần II - Câu 1 (Viết đoạn văn, ${pts} điểm): Viết đoạn văn (~200 chữ) nghị luận về một vấn đề xã hội hoặc chi tiết nghệ thuật tiêu biểu (Ngữ văn lớp ${grade}).`
          : `Phần I - Đọc hiểu - Câu ${i} (${pts} điểm): Đọc ngữ liệu văn bản và trả lời câu hỏi về thể loại, biện pháp tu từ hoặc thông điệp.`
      : `Câu hỏi tự luận ${i} môn ${subject} lớp ${grade}: Trình bày phân tích hoặc giải thích theo yêu cầu bài học.`;
    questions.push({
      id: `q_p4_${i}`,
      part: 4,
      type: 'essay',
      number: globalIndex++,
      level: isLongWriting || isShortWriting ? 'vd' : (i <= 2 ? 'nb' : 'th'),
      points: pts,
      question: qStem,
      answer: `Gợi ý chấm: Đảm bảo đủ ý trọng tâm theo chuẩn kiến thức ${subject} lớp ${grade}.`,
      explanation: `Hướng dẫn chấm điểm câu ${i} (${pts} điểm): Đánh giá theo mức độ đáp ứng yêu cầu đề bài.`,
    });
  }

  return questions;
}

// Helpers tạo văn bản theo môn
function getPart1QuestionText(subject, grade, i, level) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('toán')) {
    return `Cho hàm số y = f(x) liên tục và xác định trên tập số thực. Mệnh đề khảo sát số học ${i} nào sau đây đúng?`;
  }
  if (s.includes('vật l')) {
    return `Trong một dao động điều hòa hoặc mạch điện xoay chiều, đại lượng vật lý thứ ${i} có đặc điểm nào dưới đây?`;
  }
  if (s.includes('sinh')) {
    return `Trong cơ chế di truyền phân tử và biến dị ở sinh vật nhân thực, phát biểu thứ ${i} nào sau đây chính xác?`;
  }
  if (s.includes('tiếng anh') || s.includes('english')) {
    return `Choose the correct word or phrase to complete sentence ${i} in English (Grade ${grade}, level ${level.toUpperCase()}):`;
  }
  if (s.includes('lịch sử') || s.includes('sử')) {
    return `Sự kiện lịch sử tiêu biểu thứ ${i} trong chương trình Lịch sử lớp ${grade} có ý nghĩa nào sau đây?`;
  }
  if (s.includes('địa')) {
    return `Đặc điểm địa lí tự nhiên hoặc kinh tế - xã hội thứ ${i} của Việt Nam (Lớp ${grade}) thể hiện qua nhận định nào sau đây?`;
  }
  if (s.includes('tin')) {
    return `Khi thực thi đoạn chương trình hoặc thao tác cơ sở dữ liệu / mạng máy tính thứ ${i} (Tin học ${grade}), phát biểu nào đúng?`;
  }
  if (s.includes('công nghệ')) {
    return `Trong quy trình kỹ thuật và ứng dụng công nghệ thứ ${i} (Lớp ${grade}), nhận định nào sau đây chính xác?`;
  }
  if (s.includes('gdkt') || s.includes('kinh tế') || s.includes('gdcd')) {
    return `Từ tình huống kinh tế hoặc pháp luật thứ ${i} trong thực tiễn (Lớp ${grade}), chủ thể nào đã thực hiện đúng quy định?`;
  }
  // Mặc định Hóa học
  if (i === 1) return 'Chất nào sau đây thuộc loại este no, đơn chức, mạch hở có công thức phân tử C4H8O2?';
  if (i === 2) return 'Thủy phân hoàn toàn chất béo triolein trong dung dịch NaOH đun nóng thu được glixerol và muối nào sau đây?';
  if (i === 3) return 'Chất nào sau đây ở điều kiện thường tồn tại ở trạng thái lỏng và nhẹ hơn nước?';
  return `Hợp chất hữu cơ hoặc phản ứng hóa học thứ ${i} có tính chất đặc trưng nào sau đây?`;
}

function getOptionText(subject, grade, qIdx, oIdx) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('toán')) {
    const vals = ['y = 2x + 1', 'f\'(x) > 0 với mọi x', 'Đồ thị có 2 điểm cực trị', 'Hàm số đồng biến trên R'];
    return vals[oIdx % vals.length];
  }
  if (s.includes('sinh')) {
    const vals = ['Quá trình phiên mã diễn ra trong nhân', 'mARN mang bộ ba đối mã anticodon', 'A liên kết với T bằng 2 liên kết hidro', 'Riboxom dịch mã theo chiều 5\' -> 3\''];
    return vals[oIdx % vals.length];
  }
  if (s.includes('tiếng anh') || s.includes('english')) {
    const vals = ['sustainable', 'generation', 'effectively', 'infrastructure'];
    return vals[oIdx % vals.length];
  }
  if (s.includes('vật l') || s.includes('lịch sử') || s.includes('địa') || s.includes('tin') || s.includes('công nghệ') || s.includes('gdkt') || s.includes('khtn')) {
    const vals = [`Nhận định chuẩn SGK (${subject}) phương án 1`, `Phương án phân tích ${subject} số 2`, `Nội dung trọng tâm ${subject} lớp ${grade}`, `Kết luận phù hợp kiến thức ${subject}`];
    return vals[oIdx % vals.length];
  }
  // Mặc định Hóa học
  const vals = ['methyl acetate', 'ethyl formate', 'triolein', 'sodium stearate'];
  return vals[oIdx % vals.length];
}

function getPart2QuestionStem(subject, grade, i) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('toán')) {
    return `Cho hàm số bậc ba y = ax³ + bx² + cx + d có đồ thị như hình vẽ. Xét tính Đúng / Sai của các khẳng định sau:`;
  }
  if (s.includes('vật l')) {
    return `Tiến hành thí nghiệm khảo sát hiện tượng sóng dừng trên một sợi dây đàn hồi có hai đầu cố định. Mỗi khẳng định sau đây là Đúng hay Sai:`;
  }
  if (s.includes('sinh')) {
    return `Một loài thực vật giao phấn ngẫu nhiên, xét một gen có 2 alen A và a quy định chiều cao cây. Mỗi nhận định sau đây là Đúng hay Sai:`;
  }
  if (s.includes('lịch sử') || s.includes('sử')) {
    return `Đọc đoạn tư liệu lịch sử ${i} (Lớp ${grade}). Trong mỗi ý a), b), c), d) dưới đây, nhận định nào Đúng hay Sai:`;
  }
  if (s.includes('địa')) {
    return `Cho bảng số liệu thống kê về kinh tế - xã hội vùng kinh tế (Lớp ${grade}). Xét tính Đúng / Sai của các nhận xét sau:`;
  }
  if (s.includes('tin')) {
    return `Cho đoạn chương trình / mô tả hệ thống cơ sở dữ liệu (Tin học ${grade}). Xét tính Đúng / Sai của các phát biểu sau:`;
  }
  if (s.includes('gdkt') || s.includes('công nghệ')) {
    return `Xét tình huống thực tiễn môn ${subject} (Lớp ${grade}). Mỗi nhận định a), b), c), d) sau đây là Đúng hay Sai:`;
  }
  if (s.includes('khtn') || s.includes('khoa học tự nhiên')) {
    return `Trong bài thực hành môn Khoa học tự nhiên (Lớp ${grade}), khảo sát các hiện tượng Lý – Hóa – Sinh sau. Xét tính Đúng / Sai của từng phát biểu:`;
  }
  return `Tiến hành thí nghiệm xà phòng hóa chất béo hoặc điều chế este trong phòng thí nghiệm. Xét tính Đúng / Sai của các phát biểu sau:`;
}

function getStatementText(subject, grade, qIdx, sLetter) {
  return `Nội dung mệnh đề khảo sát mức độ nhận thức ý (${sLetter}) liên quan đến tính chất thực nghiệm và cơ chế suy luận.`;
}

function getPart3QuestionText(subject, grade, i, ansNum) {
  const s = String(subject || '').toLowerCase();
  if (s.includes('toán') || s.includes('toan')) {
    return `Tìm giá trị lớn nhất hoặc số nghiệm thực phân biệt của phương trình f(x) = ${ansNum} trên đoạn [0; 5] (đáp án tối đa 4 ký tự):`;
  }
  if (s.includes('vật l') || s.includes('vat l')) {
    return `Tính biên độ dao động tổng hợp hoặc điện áp hiệu dụng hai đầu mạch theo đơn vị chuẩn (làm tròn đến 1 chữ số thập phân, tối đa 4 ký tự):`;
  }
  if (s.includes('sinh')) {
    return `Theo lý thuyết, tỉ lệ phần trăm số cá thể mang kiểu gen đồng hợp lặn trong quần thể cân bằng di truyền là bao nhiêu phần trăm? (Làm tròn tối đa 4 ký tự)`;
  }
  if (s.includes('địa') || s.includes('dia')) {
    return `Từ bảng số liệu kinh tế – xã hội địa phương (Lớp ${grade}), tính mật độ dân số hoặc tốc độ tăng trưởng năm 2024 (làm tròn đến 1 chữ số thập phân, tối đa 4 ký tự):`;
  }
  if (s.includes('khtn') || s.includes('khoa học tự nhiên')) {
    return `Từ dữ kiện thí nghiệm Khoa học tự nhiên (Lớp ${grade}), tính giá trị đại lượng đặc trưng ở trạng thái cân bằng (làm tròn tối đa 4 ký tự):`;
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
      if (q.type === 'essay' || q.part === 4) return;
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
