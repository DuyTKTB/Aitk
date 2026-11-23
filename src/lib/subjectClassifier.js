/* ============================================================
   subjectClassifier.js — Tự động nhận diện môn học và khối lớp
   ============================================================ */

export const SUPPORTED_SUBJECTS = [
  'Toán',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Tiếng Anh',
  'Ngữ văn',
  'Lịch sử',
  'Địa lí',
  'Tin học',
  'Công nghệ',
  'GDKT&PL',
  'Khoa học tự nhiên',
];

export function detectExamSubjectAndGrade({ fileName = '', text = '', questions = [] }) {
  // Gom các nguồn text để phân tích
  const qSample = (questions || []).slice(0, 30).map((q) => {
    const qStem = q.q || '';
    const qPassage = q.passage || '';
    const qOpts = Array.isArray(q.options) ? q.options.join(' ') : '';
    const qStmts = Array.isArray(q.statements) ? q.statements.map((s) => s.text).join(' ') : '';
    return `${qPassage} ${qStem} ${qOpts} ${qStmts}`;
  }).join(' ');

  const corpus = `${fileName}\n${(text || '').slice(0, 6000)}\n${qSample}`.toLowerCase();

  // 1. Dò tiêu đề môn thi rõ ràng ở phần đầu văn bản hoặc tên file
  const headerMatch = corpus.match(/(?:môn|bộ môn|môn thi|đề thi môn|kiểm tra môn|subject)[\s:.\-–]+([a-zà-ỹ0-9&\s]+)/i);
  const headerSubj = headerMatch ? headerMatch[1].trim() : '';

  if (/(?:khoa học tự nhiên|khtn)/i.test(headerSubj)) return resolveResult('Khoa học tự nhiên', corpus);
  if (/(?:gdkt&pl|kinh tế và pháp luật|kinh tế pháp luật|giáo dục công dân|gdcd)/i.test(headerSubj)) return resolveResult('GDKT&PL', corpus);
  if (/(?:toán|toan|math|toán học)/i.test(headerSubj)) return resolveResult('Toán', corpus);
  if (/(?:vật lí|vật lý|vat ly|vat li|physics)/i.test(headerSubj)) return resolveResult('Vật lý', corpus);
  if (/(?:hóa học|hóa|hoa hoc|chemistry)/i.test(headerSubj)) return resolveResult('Hóa học', corpus);
  if (/(?:sinh học|sinh|sinh hoc|biology)/i.test(headerSubj)) return resolveResult('Sinh học', corpus);
  if (/(?:tiếng anh|anh văn|english|tieng anh)/i.test(headerSubj)) return resolveResult('Tiếng Anh', corpus);
  if (/(?:ngữ văn|văn học|ngu van|literature)/i.test(headerSubj)) return resolveResult('Ngữ văn', corpus);
  if (/(?:lịch sử|sử|history)/i.test(headerSubj)) return resolveResult('Lịch sử', corpus);
  if (/(?:địa lí|địa lý|địa|geography)/i.test(headerSubj)) return resolveResult('Địa lí', corpus);
  if (/(?:tin học|tin|informatics|tin hoc)/i.test(headerSubj)) return resolveResult('Tin học', corpus);
  if (/(?:công nghệ|cong nghe|technology)/i.test(headerSubj)) return resolveResult('Công nghệ', corpus);

  // 2. Tên file chứa từ khóa môn học rõ ràng (hỗ trợ dấu gạch ngang, gạch dưới, khoảng trắng)
  const fLow = fileName.toLowerCase();
  if (/(?:khtn|khoa[-_\s]?hoc[-_\s]?tu[-_\s]?nhien)/i.test(fLow)) return resolveResult('Khoa học tự nhiên', corpus);
  if (/(?:gdkt|gdcd|kinh[-_\s]?te[-_\s]?(?:va[-_\s]?)?phap[-_\s]?luat)/i.test(fLow)) return resolveResult('GDKT&PL', corpus);
  if (/(?:toan|toán|math)/i.test(fLow) && !/(?:hoatoan)/i.test(fLow)) return resolveResult('Toán', corpus);
  if (/(?:vat[-_\s]?l[yi]|vật[-_\s]?l[yí]|physics)/i.test(fLow)) return resolveResult('Vật lý', corpus);
  if (/(?:sinh[-_\s]?hoc|biology|sinh)/i.test(fLow) && !/(?:hoc[-_\s]?sinh)/i.test(fLow)) return resolveResult('Sinh học', corpus);
  if (/(?:tieng[-_\s]?anh|tiếng[-_\s]?anh|english)/i.test(fLow)) return resolveResult('Tiếng Anh', corpus);
  if (/(?:hoa[-_\s]?hoc|hóa[-_\s]?học|chemistry|hoa)/i.test(fLow) && !/(?:hoan[-_\s]?vi)/i.test(fLow)) return resolveResult('Hóa học', corpus);
  if (/(?:ngu[-_\s]?van|ngữ[-_\s]?văn|van[-_\s]?hoc)/i.test(fLow)) return resolveResult('Ngữ văn', corpus);
  if (/(?:lich[-_\s]?su|lịch[-_\s]?sử|history)/i.test(fLow)) return resolveResult('Lịch sử', corpus);
  if (/(?:dia[-_\s]?l[yi]|địa[-_\s]?l[yí]|geography)/i.test(fLow)) return resolveResult('Địa lí', corpus);
  if (/(?:tin[-_\s]?hoc|tin[-_\s]?học|informatics)/i.test(fLow)) return resolveResult('Tin học', corpus);
  if (/(?:cong[-_\s]?nghe|công[-_\s]?nghệ|technology)/i.test(fLow)) return resolveResult('Công nghệ', corpus);

  // 3. Chấm điểm tần số xuất hiện của các từ khóa đặc trưng chuyên sâu
  const scores = {
    'Toán': 0,
    'Vật lý': 0,
    'Hóa học': 0,
    'Sinh học': 0,
    'Tiếng Anh': 0,
    'Ngữ văn': 0,
    'Lịch sử': 0,
    'Địa lí': 0,
    'Tin học': 0,
    'Công nghệ': 0,
    'GDKT&PL': 0,
  };

  const mathKeywords = [
    'hàm số', 'đạo hàm', 'tích phân', 'nguyên hàm', 'bất phương trình', 'phương trình', 'tập nghiệm',
    'nghiệm', 'hình chóp', 'mặt phẳng', 'tọa độ', 'vectơ', 'vector', 'cực trị', 'tiệm cận', 'đồng biến',
    'nghịch biến', 'mặt cầu', 'khối lăng trụ', 'lăng trụ', 'logarit', 'không gian oxyz', 'oxyz', 'tam giác',
    'parabol', 'elip', 'đồ thị', 'khoảng biến thiên', 'xác suất', 'nhị thức newton', 'lim', 'f(x)', 'g(x)',
    'y =', 'cấp số cộng', 'cấp số nhân', 'khoảng cách từ', 'góc giữa'
  ];
  mathKeywords.forEach((kw) => {
    if (corpus.includes(kw)) scores['Toán'] += 2.0;
  });

  const physKeywords = [
    'dao động', 'con lắc', 'lò xo', 'bước sóng', 'tần số', 'vận tốc', 'gia tốc',
    'điện áp', 'dòng điện', 'xoay chiều', 'từ trường', 'suất điện động', 'quang điện', 'hạt nhân',
    'động năng', 'thế năng', 'cơ năng', 'chu kì', 'chu kỳ', 'biên độ', 'rad/s', 'khí lí tưởng', 'áp suất', 'nhiệt dung',
    'ampe', 'vôn', 'ôm', 'cảm ứng từ', 'quang phổ', 'phóng xạ', 'năng lượng liên kết', 'lực đẩy',
    'điện trở', 'tụ điện', 'cuộn cảm', 'thấu kính', 'khúc xạ', 'giao thoa ánh sáng', 'hệ số công suất', 'mạch rlc'
  ];
  physKeywords.forEach((kw) => {
    if (corpus.includes(kw)) scores['Vật lý'] += 2.2;
  });

  const chemKeywords = [
    'este', 'axit', 'acid', 'dung dịch', 'phản ứng', 'kết tủa', 'ancol', 'alcohol', 'kim loại', 'chất béo',
    'hiđrocacbon', 'đồng đẳng', 'bảo toàn electron', 'bảo toàn khối lượng', 'muối', 'oxit',
    'iupac', 'amin', 'amino axit', 'polime', 'pin điện', 'điện phân', 'chất oxi hóa', 'chất khử',
    'đktc', 'đkc', 'glucozơ', 'fructozơ', 'saccarozơ', 'tinh bột', 'xenlulozơ', 'peptit', 'protein', 'mol'
  ];
  chemKeywords.forEach((kw) => {
    if (corpus.includes(kw)) scores['Hóa học'] += 2.2;
  });

  const bioKeywords = [
    'adn', 'arn', 'dna', 'rna', 'đột biến', 'nhiễm sắc thể', 'nst', 'alen', 'gen', 'marn', 'tarn', 'ribôxôm',
    'quần thể', 'giao phối', 'di truyền', 'hệ sinh thái', 'quang hợp', 'tế bào', 'nguyên phân',
    'giảm phân', 'kiểu gen', 'kiểu hình', 'lai phân tích', 'hoán vị gen', 'chọn lọc tự nhiên',
    'mã di truyền', 'chuỗi thức ăn', 'nuclêôtit', 'thể ba', 'thể một', 'carbohydrate', 'lipid',
    'amino acid', 'axit amin', 'đa phân', 'đơn phân', 'dầu thực vật', 'bào quan', 'ti thể', 'lục lạp',
    'sinh học', 'trao đổi chất', 'hô hấp tế bào'
  ];
  bioKeywords.forEach((kw) => {
    if (corpus.includes(kw)) scores['Sinh học'] += 2.5;
  });

  const engKeywords = [
    'choose the', 'pronunciation', 'stress', 'opposite in meaning', 'closest in meaning',
    'read the following', 'mark the letter', 'correct answer', 'passage', 'sentence',
    'grammar', 'vocabulary', 'which of the following', 'best title', 'indicates the word'
  ];
  engKeywords.forEach((kw) => {
    if (corpus.includes(kw)) scores['Tiếng Anh'] += 3.0;
  });

  const histKeywords = [
    'cách mạng', 'chiến dịch', 'hiệp định', 'thực dân', 'kháng chiến', 'thế chiến', 'đảng cộng sản',
    'điện biên phủ', 'chiến tranh lạnh', 'đoạn tư liệu', 'công cuộc đổi mới', 'liên hợp quốc', 'khởi nghĩa', 'phong trào'
  ];
  histKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['Lịch sử'] += 2.5; });

  const geoKeywords = [
    'khí hậu', 'địa hình', 'sông ngòi', 'dân số', 'vùng kinh tế', 'biển đông', 'đô thị hóa',
    'mật độ dân số', 'cán cân xuất nhập khẩu', 'biên độ nhiệt', 'lượng mưa', 'đồng bằng', 'tỉ trọng', 'tốc độ tăng trưởng'
  ];
  geoKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['Địa lí'] += 2.5; });

  const itKeywords = [
    'thuật toán', 'lập trình', 'python', 'c++', 'cơ sở dữ liệu', 'mảng', 'sql', 'vòng lặp',
    'html', 'css', 'trí tuệ nhân tạo', 'mạng máy tính', 'bộ định tuyến', 'giao thức', 'khóa chính', 'def ', 'select '
  ];
  itKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['Tin học'] += 2.5; });

  const techKeywords = [
    'bản vẽ kỹ thuật', 'động cơ', 'mạch điện ba pha', 'trồng trọt', 'chăn nuôi', 'lâm nghiệp',
    'thủy sản', 'vi điều khiển', 'linh kiện điện tử', 'vật liệu cơ khí', 'gia công cắt gọt', 'công nghệ'
  ];
  techKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['Công nghệ'] += 2.5; });

  const civicsKeywords = [
    'lạm phát', 'thất nghiệp', 'ngân sách nhà nước', 'thuế', 'cung cầu', 'cạnh tranh', 'hiến pháp',
    'quyền bình đẳng', 'quyền công dân', 'pháp luật', 'hợp đồng lao động', 'chủ thể kinh tế', 'mô hình sản xuất'
  ];
  civicsKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['GDKT&PL'] += 2.5; });

  const litKeywords = [
    'thể thơ', 'biện pháp tu từ', 'phương thức biểu đạt', 'nhân vật trữ tình', 'nghị luận xã hội',
    'nghị luận văn học', 'đoạn trích', 'bút pháp', 'phong cách nghệ thuật', 'đọc hiểu văn bản', 'làm văn'
  ];
  litKeywords.forEach((kw) => { if (corpus.includes(kw)) scores['Ngữ văn'] += 2.8; });

  let bestSubject = 'Toán';
  let maxScore = 0;
  for (const [subj, sc] of Object.entries(scores)) {
    if (sc > maxScore) {
      maxScore = sc;
      bestSubject = subj;
    }
  }

  if (maxScore >= 2.0) {
    return resolveResult(bestSubject, corpus);
  }

  // Fallback: nếu không có từ khóa rõ rệt, kiểm tra biểu thức toán học hoặc ngôn ngữ
  if (/[+\-*/=<>√πΔ∫]/i.test(corpus) || /\b(?:x|y|z)\s*=\s*/i.test(corpus)) {
    return resolveResult('Toán', corpus);
  }

  return resolveResult('Toán', corpus);
}

function resolveResult(subject, corpus) {
  let grade = '12';
  const gradeMatch = corpus.match(/(?:lớp|khối|grade)\s*[:.\-–]?\s*(10|11|12)\b/i);
  if (gradeMatch) {
    grade = gradeMatch[1];
  } else if (/\b11\b/.test(corpus)) {
    grade = '11';
  } else if (/\b10\b/.test(corpus)) {
    grade = '10';
  }
  return { subject, grade };
}
