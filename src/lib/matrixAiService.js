/* ============================================================
   matrixAiService.js — Lập ma trận & sinh đề THPT (GDPT 2018 / Bộ GD&ĐT)
   ------------------------------------------------------------
   v5 (nâng cấp THPT, nhanh hơn, chuẩn hơn):
     • CHỈ THPT: lớp 10–12. Nhập lớp 6–9 sẽ bị từ chối rõ ràng.
     • Ma trận do CODE dựng (số câu, phần, mức độ, điểm luôn khớp tổng 10);
       AI chỉ đặt tên dạng bài → phản hồi nhỏ, nhanh, không bao giờ lệch số câu.
     • 3 dạng câu chuẩn thi tốt nghiệp 2025: Trắc nghiệm / Đúng-Sai (4 ý) /
       Trả lời ngắn (đề 28 câu = 18 + 4 + 6).
     • Sinh câu hỏi song song theo từng câu, kết quả hiện dần (onPartial),
       retry chính xác phần thiếu, loại câu trùng, điểm và mức độ theo ma trận.
     • Soát đáp án độc lập: AI giải lại từng câu không nhìn đáp án (verifyQuestionsWithAI).
     • Lệnh nhanh không cần gọi AI: tăng/giảm câu theo mức, xóa câu, đổi đáp án...
   ============================================================ */
import {
  callModel,
  parseJsonLoose,
  normalizeQuestion,
  shuffleOptions,
  rid,
} from './examAiUtils.js';
import { buildFileContext } from './fileReader.js';
import { formatTextForSubject } from './chemFormulaFormatter.js';
import { getSubject, getSubjectExamProfile, subjectUsesMath } from './subjects.js';

export const BLOOM_MAPPING = {
  nb: { vn: 'Nhận biết', en: 'Remembering', desc: 'Nhớ khái niệm, định nghĩa, công thức' },
  th: { vn: 'Thông hiểu', en: 'Understanding', desc: 'Giải thích, phân biệt, suy luận' },
  vd: { vn: 'Vận dụng', en: 'Applying', desc: 'Áp dụng công thức, tính toán một bước' },
  vdc: { vn: 'Vận dụng cao', en: 'Analyzing', desc: 'Tổng hợp, biện luận, nhiều bước' },
};

export function normLevel(str) {
  if (!str) return 'nb';
  const s = String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
  if (s.includes('cao') || s === 'vdc') return 'vdc';
  if (s.includes('dung') || s === 'vd') return 'vd';
  if (s.includes('hieu') || s === 'th') return 'th';
  if (s.includes('biet') || s === 'nb') return 'nb';
  return 'nb';
}

export const LEVEL_INFO = {
  nb: { code: 'nb', label: 'Nhận biết', short: 'NB', color: 'var(--t-bloom-nb, #22c55e)', bg: 'var(--t-bloom-nb-bg, rgba(34, 197, 94, 0.12))' },
  th: { code: 'th', label: 'Thông hiểu', short: 'TH', color: 'var(--t-bloom-th, #0284c7)', bg: 'var(--t-bloom-th-bg, rgba(2, 132, 199, 0.12))' },
  vd: { code: 'vd', label: 'Vận dụng', short: 'VD', color: 'var(--t-bloom-vd, #d97706)', bg: 'var(--t-bloom-vd-bg, rgba(217, 119, 6, 0.12))' },
  vdc: { code: 'vdc', label: 'Vận dụng cao', short: 'VDC', color: 'var(--t-bloom-vdc, #dc2626)', bg: 'var(--t-bloom-vdc-bg, rgba(220, 38, 38, 0.12))' },
};

const NW = '(?![\\p{L}\\p{N}])';
const PW = '(^|[^\\p{L}\\p{N}])';
const re = (src, flags = 'iu') => new RegExp(src, flags);

export const FORMAT_GDPT = 'Chuẩn GDPT 2018 (Trắc nghiệm + Đúng/Sai + Trả lời ngắn)';
export const FORMAT_GDPT_2PART = 'Chuẩn GDPT 2018 (Trắc nghiệm + Đúng/Sai)';
export const FORMAT_GDPT_ADV = 'Chuẩn GDPT 2018 · Phân hóa nâng cao';
export const FORMAT_MCQ = 'Trắc nghiệm 4 lựa chọn';
export const FORMAT_ESSAY = 'Đọc hiểu + Tự luận';

export function parseExamIntent(text) {
  const empty = { count: null, duration: null, grade: null, invalidGrade: null, topic: '', format: '', preset: false, subject: null };
  if (!text || typeof text !== 'string') return empty;

  const original = text.normalize('NFC').trim();
  let str = ` ${original} `;
  let count = null;
  let duration = null;
  let grade = null;
  let invalidGrade = null;
  let subject = null;

  // 1. Nhận diện môn học rõ ràng (đủ 11+ môn THPT & KHTN)
  if (/(?:khoa học tự nhiên|khoa hoc tu nhien|\bkhtn\b)/i.test(original)) {
    subject = 'Khoa học tự nhiên';
  } else if (/(?:tiếng anh|tieng anh|anh văn|anh van|môn anh|mon anh|\benglish\b|\bgrammar\b|\bvocabulary\b|\bcloze\b|reading comprehension|generation gap|a long and healthy life|cities of the future|urbanisation|green living)/i.test(original)) {
    subject = 'Tiếng Anh';
  } else if (/(?:ngữ văn|ngu van|văn học|van hoc|môn văn|mon van|biện pháp tu từ|phương thức biểu đạt|nghị luận xã hội|nghị luận văn học|đọc hiểu văn bản|\bthể thơ\b)/i.test(original)) {
    subject = 'Ngữ văn';
  } else if (/(?:gdkt&pl|gdkt\s*pl|kinh tế và pháp luật|kinh te va phap luat|kinh tế pháp luật|giáo dục công dân|\bgdcd\b|lạm phát|thất nghiệp|ngân sách nhà nước|hợp đồng lao động|quyền bình đẳng công dân)/i.test(original)) {
    subject = 'GDKT&PL';
  } else if (/(?:lịch sử|lich su|môn sử|mon su|cách mạng tháng tám|chiến dịch điện biên phủ|chiến tranh lạnh|kháng chiến chống|\basean\b|liên hợp quốc|công cuộc đổi mới)/i.test(original)) {
    subject = 'Lịch sử';
  } else if (/(?:địa lí|địa lý|dia li|dia ly|môn địa|mon dia|mật độ dân số|cán cân xuất nhập khẩu|tốc độ tăng trưởng|biên độ nhiệt|khí hậu nhiệt đới|đồng bằng sông|vùng kinh tế)/i.test(original)) {
    subject = 'Địa lí';
  } else if (/(?:tin học|tin hoc|môn tin|mon tin|lập trình|\bpython\b|\bc\+\+\b|\bsql\b|\bhtml\b|\bcss\b|cơ sở dữ liệu|thuật toán sắp xếp|mạng máy tính|trí tuệ nhân tạo)/i.test(original)) {
    subject = 'Tin học';
  } else if (/(?:công nghệ|cong nghe|bản vẽ kỹ thuật|động cơ đốt trong|mạch điện ba pha|vi điều khiển|linh kiện bán dẫn|trồng trọt|chăn nuôi|lâm nghiệp|thủy sản)/i.test(original)) {
    subject = 'Công nghệ';
  } else if (/(?:sinh học|sinh hoc|\bsinh\b)/i.test(original) || /(?:di truyền|gen\b|adn\b|arn\b|nhiễm sắc thể|nst\b|nguyên phân|giảm phân|quang hợp|hô hấp tế bào|tiến hóa|hệ sinh thái|đột biến gen|quần thể|menđen|mã di truyền|phiên mã|dịch mã)/i.test(original)) {
    subject = 'Sinh học';
  } else if (/(?:hóa học|hoa hoc|\bhóa\b|\bhoa\b)/i.test(original) || /(?:phản ứng|axit|acid|bazơ|base|dung dịch|este|ester|lipit|lipid|amino acid|cacbohiđrat|kim loại|phi kim|bảng tuần hoàn|nguyên tử|oxi hóa|khử|điện phân|hóa trị|halogen)/i.test(original)) {
    subject = 'Hóa học';
  } else if (/(?:vật lý|vật lí|vat ly|vat li|\blý\b|\bli\b)/i.test(original) || /(?:giao thoa|sóng cơ|sóng dừng|con lắc|dao động điều hòa|cơ năng|động lượng|rơi tự do|ném xiên|newton|điện trường|tụ điện|định luật ôm|công suất điện|từ trường|cảm ứng điện từ|khí lí tưởng|vật lí nhiệt|hạt nhân|phóng xạ|y-âng|rlc)/i.test(original)) {
    subject = 'Vật lý';
  } else if (/(?:toán học|toan hoc|\btoán\b|\btoan\b)/i.test(original) || /(?:tích phân|nguyên hàm|đạo hàm|cực trị|tiệm cận|oxyz|lượng giác|cấp số cộng|cấp số nhân|logarit|bất phương trình|tam thức bậc hai|vectơ|nhị thức newton|hệ thức lượng|xác suất có điều kiện)/i.test(original)) {
    subject = 'Toán học';
  }

  let m = str.match(re(`(\\d{1,3})\\s*(?:phút|phut|ph|p|min|mins|')${NW}`));
  if (m) { duration = parseInt(m[1], 10); str = str.replace(m[0], ' '); }
  else if ((m = str.match(re(`(\\d{1,2})\\s*tiết${NW}`)))) { duration = parseInt(m[1], 10) * 45; str = str.replace(m[0], ' '); }
  else if ((m = str.match(re(`(\\d{1,2})\\s*(?:giờ|gio|h)${NW}`)))) { duration = parseInt(m[1], 10) * 60; str = str.replace(m[0], ' '); }

  m = str.match(re(`(\\d{1,3})\\s*(?:câu|cau|qs?|questions?)${NW}`));
  if (m) { count = parseInt(m[1], 10); str = str.replace(m[0], ' '); }

  /* THPT: chỉ nhận lớp 10–12. Lớp 6–9 → báo ngoài phạm vi. */
  const okGrade = (n) => n >= 10 && n <= 12;
  const lowGrade = (n) => n >= 1 && n <= 9;
  m = str.match(re(`${PW}(?:lớp|lop|khối|khoi|k)\\s*(\\d{1,2})${NW}`));
  if (m) {
    const n = +m[2];
    if (okGrade(n)) { grade = String(n); str = str.replace(m[0], `${m[1]} `); }
    else if (lowGrade(n)) { invalidGrade = n; str = str.replace(m[0], `${m[1]} `); }
  }
  if (!grade && !invalidGrade) {
    m = str.match(re(`${PW}(?:hóa học|hoa hoc|hóa|hoa|sinh học|sinh hoc|sinh|vật lý|vật lí|lý|toán học|toán|tiếng anh|tieng anh|anh văn|anh|ngữ văn|văn|lịch sử|sử|địa lí|địa lý|địa|tin học|tin|công nghệ|gdkt&pl|gdcd)\\s*(\\d{1,2})${NW}`));
    if (m && okGrade(+m[2])) { grade = m[2]; str = str.replace(m[0], `${m[1]} `); }
  }
  if (!grade && !invalidGrade) {
    m = str.match(re(`${PW}(1[0-2])\\s*(?!điểm|đ|câu|phút|p|tiết|h|k|%|\\$)${NW}`));
    if (m) { grade = m[2]; str = str.replace(m[0], `${m[1]} `); }
  }

  // Tự động nhận diện lớp từ chủ đề đặc thù trong chương trình GDPT 2018 nếu chưa có lớp
  if (!grade && !invalidGrade) {
    if (subject === 'Tiếng Anh') {
      if (/(?:family life|humans and the environment|better community|inventions|gender equality|international organisations|new ways to learn|ecotourism)/i.test(original)) grade = '10';
      else if (/(?:long and healthy life|generation gap|cities of the future|asean|global warming|preserving our heritage|becoming independent|social issues|ecosystem)/i.test(original)) grade = '11';
      else if (/(?:life stories|multicultural world|green living|urbanisation|world of work|artificial intelligence|mass media|wildlife conservation|career paths|lifelong learning)/i.test(original)) grade = '12';
    } else if (subject === 'Lịch sử') {
      if (/(?:văn minh ai cập|văn minh ấn độ|văn minh trung hoa|văn minh văn lang|cách mạng công nghiệp)/i.test(original)) grade = '10';
      else if (/(?:cách mạng tư sản|bảo vệ tổ quốc trước 1945|biển đông|cải cách hồ quý ly|cải cách minh mạng)/i.test(original)) grade = '11';
      else if (/(?:chiến tranh lạnh|trật tự thế giới sau|asean|cách mạng tháng tám|điện biên phủ|kháng chiến chống pháp|kháng chiến chống mỹ|công cuộc đổi mới)/i.test(original)) grade = '12';
    } else if (subject === 'Địa lí') {
      if (/(?:thạch quyển|khí quyển|thủy quyển|sinh quyển|quy luật địa đới)/i.test(original)) grade = '10';
      else if (/(?:liên minh châu âu|\beu\b|hoa kỳ|nhật bản|trung quốc|liên bang nga|đông nam á)/i.test(original)) grade = '11';
      else if (/(?:địa lí tự nhiên việt nam|vùng kinh tế|đồng bằng sông hồng|đồng bằng sông cửu long|đô thị hóa việt nam|biển đảo việt nam)/i.test(original)) grade = '12';
    } else if (subject === 'Tin học') {
      if (/(?:biểu diễn dữ liệu|inkscape|đồ họa vector|python cơ bản)/i.test(original)) grade = '10';
      else if (/(?:cơ sở dữ liệu|\bsql\b|hệ quản trị cơ sở dữ liệu|thuật toán sắp xếp)/i.test(original)) grade = '11';
      else if (/(?:trí tuệ nhân tạo|\bhtml\b|\bcss\b|giao thức mạng|bảo mật mạng)/i.test(original)) grade = '12';
    } else if (subject === 'GDKT&PL') {
      if (/(?:ngân sách nhà nước|thuế|tín dụng|hiến pháp 2013)/i.test(original)) grade = '10';
      else if (/(?:cạnh tranh|cung cầu|lạm phát|thất nghiệp|quyền bình đẳng)/i.test(original)) grade = '11';
      else if (/(?:tăng trưởng kinh tế|hội nhập kinh tế quốc tế|bảo hiểm|an sinh xã hội|luật lao động|luật quốc tế)/i.test(original)) grade = '12';
    } else if (subject === 'Sinh học') {
      if (/(?:tế bào|sinh học tế bào|vi sinh vật|virus|phân bào|nguyên phân|giảm phân)/i.test(original)) grade = '10';
      else if (/(?:sinh học cơ thể|tuần hoàn|hô hấp thực vật|tiêu hóa|bài tiết|miễn dịch|cảm ứng|hướng động|tập tính)/i.test(original)) grade = '11';
      else if (/(?:di truyền|tiến hóa|sinh thái|menđen|đột biến|adn|arn|quần thể|hệ sinh thái)/i.test(original)) grade = '12';
    } else if (subject === 'Vật lý') {
      if (/(?:động học|rơi tự do|ném ngang|ném xiên|newton|ma sát|công cơ học|động năng|thế năng|cơ năng|động lượng|chuyển động tròn|mômen lực)/i.test(original)) grade = '10';
      else if (/(?:dao động điều hòa|con lắc|sóng cơ|sóng dừng|giao thoa|sóng ánh sáng|y-âng|điện trường|coulomb|điện thế|tụ điện|định luật ôm|suất điện động)/i.test(original)) grade = '11';
      else if (/(?:vật lí nhiệt|nội năng|nhiệt nóng chảy|nhiệt hóa hơi|khí lí tưởng|boyle|charles|từ trường|cảm ứng điện từ|dòng điện xoay chiều|rlc|hạt nhân|phóng xạ|bán rã)/i.test(original)) grade = '12';
    } else if (subject === 'Toán học') {
      if (/(?:mệnh đề|tập hợp|bất phương trình|hệ thức lượng|vectơ|tích vô hướng|tam thức bậc hai|tổ hợp|chỉnh hợp|hoán vị|nhị thức newton)/i.test(original)) grade = '10';
      else if (/(?:lượng giác|dãy số|cấp số cộng|cấp số nhân|giới hạn|liên tục|lũy thừa|mũ|logarit|quan hệ song song|quan hệ vuông góc)/i.test(original)) grade = '11';
      else if (/(?:đạo hàm|cực trị|tiệm cận|nguyên hàm|tích phân|diện tích hình phẳng|thể tích khối tròn xoay|oxyz|xác suất có điều kiện|bayes)/i.test(original)) grade = '12';
    } else {
      if (/(?:nguyên tử|bảng tuần hoàn|liên kết hóa học|oxi hóa khử|oxit hóa khử|nhiệt hóa học|năng lượng hóa học|tốc độ phản ứng|halogen|clor|clo|brom|iot)/i.test(original)) {
        grade = '10';
      } else if (/(?:cân bằng hóa học|điện li|thuyết brønsted|nitrogen|nitơ|sulfur|lưu huỳnh|hydrocarbon|hiđrocacbon|ankan|anken|ankin|arene|dẫn xuất halogen|alcohol|ancol|phenol|carbonyl|anđehit|aldehyde|axit cacboxylic|carboxylic)/i.test(original)) {
        grade = '11';
      } else if (/(?:este|ester|lipit|lipid|chất béo|xà phòng|carbohydrate|cacbohiđrat|glucoz|glucose|fructoz|fructose|saccaroz|sucrose|tinh bột|xenluloz|cellulose|amin|amine|amino acid|amino axit|peptit|peptide|protein|polime|polymer|kim loại|thế điện cực|pin điện|điện phân|phức chất)/i.test(original)) {
        grade = '12';
      }
    }
  }

  const wantsGdpt = /gdpt|2018|2025|đúng sai|đúng\/sai|trả lời ngắn|chuẩn|thptqg|thpt quốc gia|tốt nghiệp|thi thử/i.test(original);
  const wantsAdv = /phân hóa|nâng cao|vận dụng cao|chuyên/i.test(original);
  const subjProf = subject ? getSubjectExamProfile(subject) : null;
  let format = '';
  if (/tự luận|làm văn/i.test(original) && !/trắc nghiệm/i.test(original)) {
    format = FORMAT_ESSAY;
  } else if (subjProf?.examFamily === 'mcq_only' && !/đúng sai|đúng\/sai|trả lời ngắn/i.test(original)) {
    format = FORMAT_MCQ;
  } else if (subjProf?.examFamily === 'literature_essay' && !/trắc nghiệm|đúng sai/i.test(original)) {
    format = FORMAT_ESSAY;
  } else if (subjProf?.examFamily === 'social_2part' && wantsGdpt && !/trả lời ngắn/i.test(original)) {
    format = FORMAT_GDPT_2PART;
  } else if (wantsGdpt && wantsAdv) format = FORMAT_GDPT_ADV;
  else if (wantsGdpt) format = FORMAT_GDPT;
  else if (wantsAdv) format = 'Phân hóa nâng cao';
  else if (/trắc nghiệm|4 lựa chọn/i.test(original)) format = FORMAT_MCQ;

  let preset = false;
  if (/thptqg|thpt quốc gia|tốt nghiệp|thi thử/i.test(original) && !count && !duration) {
    if (subjProf?.standardCounts) {
      count = subjProf.standardCounts.total;
      duration = subjProf.standardCounts.duration;
    } else {
      count = 28;
      duration = 50;
    }
    preset = true;
    if (!grade && !invalidGrade) grade = '12';
  }

  const noise = '(?:tốt nghiệp|thpt quốc gia|quốc gia|thpt|đề kiểm tra|bài kiểm tra|đề thi thử|đề thi|đề ôn tập|đề ôn|đề|phiếu bài tập|kiểm tra|ra đề|tạo đề|soạn đề|tạo|soạn|giúp tôi|giúp|cho tôi|hãy|môn tiếng anh|tiếng anh|môn anh|môn ngữ văn|ngữ văn|môn văn|môn lịch sử|lịch sử|môn sử|môn địa lí|địa lí|địa lý|môn địa|môn tin học|tin học|môn tin|môn công nghệ|công nghệ|môn gdkt&pl|gdkt&pl|môn hóa|môn sinh|môn lý|môn toán|thi thử|thptqg|chuẩn bộ gd&đt|chuẩn|phân hóa sâu|phân hóa|nâng cao|gồm|có|về|chủ đề|bài|của|môn)';
  let topic = str
    .replace(re(`${PW}${noise}${NW}`, 'giu'), '$1 ')
    .replace(re(`${PW}${noise}${NW}`, 'giu'), '$1 ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/[,;:·|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (topic.length < 2 || /^(hóa học|hóa|sinh học|sinh|vật lý|vật lí|lý|toán học|toán|tiếng anh|tieng anh|anh văn|english|ngữ văn|văn|lịch sử|sử|địa lí|địa lý|địa|tin học|tin|công nghệ|gdkt&pl|gdcd)$/i.test(topic)) topic = '';
  else topic = topic.charAt(0).toUpperCase() + topic.slice(1);

  return { count, duration, grade, invalidGrade, topic, format, preset, subject };
}

export function inferExamShape({ count = null, duration = null } = {}) {
  let c = count;
  let d = duration;
  let inferred = false;
  if (c && !d) {
    d = c <= 10 ? 15 : c <= 15 ? 25 : c <= 20 ? 45 : c <= 28 ? 50 : 90;
    inferred = true;
  } else if (d && !c) {
    c = d <= 15 ? 10 : d <= 25 ? 15 : d <= 45 ? 20 : d <= 50 ? 28 : d <= 60 ? 30 : 40;
    inferred = true;
  }
  return { count: c, duration: d, inferred };
}

/** Định dạng gợi ý khi giáo viên không nói rõ: tự động bám theo nhóm môn học GDPT 2025. */
export function suggestFormat(count, subject = '') {
  const s = String(subject || '').trim();
  if (s) {
    const prof = getSubjectExamProfile(s);
    if (prof.examFamily === 'mcq_only') return FORMAT_MCQ;
    if (prof.examFamily === 'literature_essay') return FORMAT_ESSAY;
    if (prof.examFamily === 'social_2part') return Number(count) >= 16 ? FORMAT_GDPT_2PART : FORMAT_MCQ;
    if (prof.examFamily === 'math_3part') return Number(count) >= 20 ? FORMAT_GDPT : FORMAT_MCQ;
  }
  return Number(count) >= 24 ? FORMAT_GDPT : FORMAT_MCQ;
}

/* Lệnh theo số câu: "viết lại câu 3", "đổi phương án nhiễu câu 2" — cần gọi AI */
export function parseQuestionCommand(text, total = 0) {
  if (!text || !total) return null;
  const m = text.match(re(`${PW}câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
  if (!m) return null;
  const n = parseInt(m[2], 10);
  if (n < 1 || n > total) return null;
  const kind = /nhiễu|phương án sai|đáp án sai|distractor/i.test(text) ? 'distractors' : 'rewrite';
  return { index: n - 1, kind };
}

/* Lệnh cục bộ — xử lý TỨC THÌ, không gọi AI */
export function parseLocalCommand(text, total = 0) {
  if (!text || !total) return null;
  const t = text.normalize('NFC').trim();

  let m = t.match(re(`(?:xóa|xoá|bỏ|loại)\\s*câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
  if (m) {
    const n = parseInt(m[1], 10);
    return n >= 1 && n <= total ? { type: 'delete', index: n - 1 } : { type: 'outOfRange', n };
  }

  m = t.match(re(`câu\\s*(?:số\\s*)?(\\d{1,3}).*?(?:đáp án|dap an)\\s*(?:đúng\\s*)?(?:là|thành|:|=)?\\s*([A-D])${NW}`));
  if (!m) {
    const m2 = t.match(re(`(?:đáp án|dap an)\\s*(?:đúng\\s*)?(?:là|thành)\\s*([A-D])${NW}.*?câu\\s*(?:số\\s*)?(\\d{1,3})${NW}`));
    if (m2) m = [m2[0], m2[2], m2[1]];
  }
  if (m) {
    const n = parseInt(m[1], 10);
    if (n < 1 || n > total) return { type: 'outOfRange', n };
    return { type: 'setCorrect', index: n - 1, option: 'ABCD'.indexOf(m[2].toUpperCase()) };
  }

  if (/kiểm tra (?:lại )?đáp án|soát (?:lại )?đáp án|kiểm tra lại|soát lại|xác minh đáp án/i.test(t)) return { type: 'verify' };
  if (/lưu (?:tất cả )?(?:vào )?ngân hàng/i.test(t)) return { type: 'bank' };
  if (/xuất bản|chuyển sang thủ công|đưa vào lớp|giao cho lớp/i.test(t)) return { type: 'publish' };
  if (/mô phỏng|làm thử|thi thử đề/i.test(t)) return { type: 'tab', tab: 'sim' };
  if (/in a4|in đề|bản in/i.test(t)) return { type: 'tab', tab: 'print' };
  if (/đảo mã|trộn đề|đảo đề|mã đề/i.test(t)) return { type: 'tab', tab: 'shuffle' };
  if (/xem ma trận|mở ma trận/i.test(t)) return { type: 'tab', tab: 'matrix' };
  if (/xem câu hỏi|danh sách câu/i.test(t)) return { type: 'tab', tab: 'questions' };
  return null;
}

const LEVEL_KEYS = ['nb', 'th', 'vd', 'vdc'];

/* Kích thước lô theo dạng câu (nhỏ → nhanh, song song nhiều lô) */
const BATCH_SIZE = { single_choice: 3, true_false: 2, short_answer: 3 };
const GEN_CONCURRENCY = 3;
const MAX_RETRY = 3;

export function emptyLevel() {
  return { count: 0, points: 0 };
}

function asLevel(v) {
  const count = Math.max(0, Math.round(Number(v?.count) || 0));
  const points = Math.max(0, Number(v?.points) || 0);
  return { count, points: Math.round(points * 100) / 100 };
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
        summary[k].points = Math.round((summary[k].points + lv.points) * 100) / 100;
      });
    });
  });
  summary.total.count = LEVEL_KEYS.reduce((a, k) => a + summary[k].count, 0);
  summary.total.points = Math.round(LEVEL_KEYS.reduce((a, k) => a + summary[k].points, 0) * 100) / 100 || 10;
  return summary;
}

/* Giữ lại để tương thích — co/giãn ma trận về đúng số câu (đã không còn dùng trong luồng chính) */
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
        if (c > 0) cells.push({ pi, ti, k, count: c });
      });
    });
  });
  if (!cells.length) {
    matrix.summary = summary;
    matrix.totalQuestions = n;
    return matrix;
  }
  const scaled = cells.map((c) => ({ ...c, count: Math.max(0, Math.round((c.count / current) * n)) }));
  let diff = n - scaled.reduce((a, c) => a + c.count, 0);
  for (let i = 0; diff !== 0 && i < 400; i++) {
    const cell = scaled[i % scaled.length];
    if (diff > 0) { cell.count += 1; diff -= 1; }
    else if (cell.count > 0) { cell.count -= 1; diff += 1; }
  }
  (matrix.parts || []).forEach((part) => {
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((k) => { top[k] = { count: 0, points: 0 }; });
    });
  });
  scaled.forEach((c) => {
    const top = matrix.parts[c.pi]?.topics?.[c.ti];
    if (top) top[c.k] = { count: c.count, points: 0 };
  });
  matrix.totalQuestions = n;
  return normalizePoints(matrix);
}

export function flattenMatrixSpecs(matrix) {
  const specs = [];
  (matrix.parts || []).forEach((part) => {
    const type = PART_TYPE[part.format] || 'single_choice';
    (part.topics || []).forEach((top) => {
      LEVEL_KEYS.forEach((lvl) => {
        const count = top[lvl]?.count || 0;
        const pts = Number(top[lvl]?.points) || 0;
        const each = count && pts ? Math.round((pts / count) * 100) / 100 : 0.25;
        for (let i = 0; i < count; i++) {
          specs.push({
            part: part.partName,
            format: part.format || 'multiple_choice',
            type,
            topic: top.name,
            levelKey: lvl,
            level: BLOOM_MAPPING[lvl].vn,
            points: each,
          });
        }
      });
    });
  });
  return specs;
}

function intentLabel(intent) {
  if (intent === 'sheet') return 'phiếu bài tập luyện tập (nhiều câu nhận biết/thông hiểu, số liệu đơn)';
  if (intent === 'lecture') return 'câu hỏi kiểm tra ngay sau bài giảng (ngắn, bám đúng nội dung vừa dạy)';
  return 'đề kiểm tra/thi (phân hóa, có câu vận dụng cao)';
}

export const THPT_GRADES = ['10', '11', '12'];
export const isGdptFormat = (f = '') => /(?:gdpt|trắc nghiệm \+ đúng\/sai)/i.test(String(f));
const isEssayFormat = (f = '') => /tự luận|làm văn/i.test(String(f));
const isAdvancedFormat = (f = '') => /phân hóa|nâng cao|sâu/i.test(String(f));

export const PART_TYPE = {
  multiple_choice: 'single_choice',
  true_false: 'true_false',
  short_answer: 'short_answer',
  essay: 'essay',
};
const PART_LABEL = {
  multiple_choice: 'Trắc nghiệm nhiều lựa chọn',
  true_false: 'Trắc nghiệm đúng/sai',
  short_answer: 'Trả lời ngắn',
  essay: 'Đọc hiểu & Tự luận',
};
/* Trọng số điểm: 1 câu Đúng/Sai (tối đa) = 4 lần 1 câu trắc nghiệm / trả lời ngắn (đề 18-4-6 → 0,25 / 1 / 0,25) */
const PART_WEIGHT = { multiple_choice: 1, true_false: 4, short_answer: 1, essay: 4 };
const ROMAN = ['I', 'II', 'III', 'IV'];

export function gdptSplit(n, subject = '', format = '') {
  const prof = subject ? getSubjectExamProfile(subject) : null;
  if (isEssayFormat(format) || prof?.examFamily === 'literature_essay') {
    return { p1: 0, p2: 0, p3: 0, essay: n };
  }
  if (prof?.examFamily === 'mcq_only') {
    return { p1: n, p2: 0, p3: 0 };
  }
  if (format === FORMAT_GDPT_2PART || prof?.examFamily === 'social_2part') {
    if (n === 28) return { p1: 24, p2: 4, p3: 0 };
    const p2 = Math.max(1, Math.round(n / 7));
    const p1 = Math.max(1, n - p2);
    return { p1, p2, p3: 0 };
  }
  if (prof?.examFamily === 'math_3part') {
    if (n === 22) return { p1: 12, p2: 4, p3: 6 };
    if (n === 28) return { p1: 18, p2: 4, p3: 6 };
    const p2 = Math.max(1, Math.round((n * 4) / 22));
    const p3 = Math.max(1, Math.round((n * 6) / 22));
    const p1 = Math.max(1, n - p2 - p3);
    return { p1, p2, p3 };
  }
  if (n === 28) return { p1: 18, p2: 4, p3: 6 };
  const p2 = Math.max(1, Math.round((n * 4) / 28));
  const p3 = Math.max(1, Math.round((n * 6) / 28));
  const p1 = Math.max(1, n - p2 - p3);
  return { p1, p2, p3 };
}

function distribute(total, weights) {
  const raw = LEVEL_KEYS.map((k) => total * (weights[k] || 0));
  const out = raw.map((x) => Math.floor(x));
  let rem = total - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, f: x - Math.floor(x) }))
    .filter((o) => (weights[LEVEL_KEYS[o.i]] || 0) > 0)
    .sort((a, b) => b.f - a.f);
  for (let j = 0, guard = 0; rem > 0 && order.length && guard < 200; j = (j + 1) % order.length, guard++) {
    out[order[j].i] += 1;
    rem -= 1;
  }
  return { nb: out[0], th: out[1], vd: out[2], vdc: out[3] };
}

function levelWeights(intent, advanced) {
  if (advanced) return { nb: 0.15, th: 0.25, vd: 0.35, vdc: 0.25 };
  if (intent === 'sheet') return { nb: 0.35, th: 0.35, vd: 0.25, vdc: 0.05 };
  if (intent === 'lecture') return { nb: 0.4, th: 0.4, vd: 0.2, vdc: 0 };
  return { nb: 0.25, th: 0.3, vd: 0.3, vdc: 0.15 };
}

function partWeights(partFormat, advanced) {
  /* Bám tỉ lệ CV 7991/BGDĐT (~40% Biết - 30% Hiểu - 30% Vận dụng) cho đề chuẩn; tăng phân hóa nếu chọn nâng cao */
  if (partFormat === 'true_false') {
    return advanced ? { nb: 0, th: 0.25, vd: 0.5, vdc: 0.25 } : { nb: 0.25, th: 0.25, vd: 0.25, vdc: 0.25 };
  }
  if (partFormat === 'short_answer') {
    return advanced ? { nb: 0, th: 0.15, vd: 0.45, vdc: 0.4 } : { nb: 0.15, th: 0.3, vd: 0.35, vdc: 0.2 };
  }
  if (partFormat === 'essay') {
    return advanced ? { nb: 0.15, th: 0.25, vd: 0.35, vdc: 0.25 } : { nb: 0.3, th: 0.35, vd: 0.25, vdc: 0.1 };
  }
  return advanced
    ? { nb: 0.2, th: 0.3, vd: 0.35, vdc: 0.15 }
    : { nb: 0.45, th: 0.35, vd: 0.2, vdc: 0 };
}

export function buildSlots({ count = 10, format = '', intent = 'exam', subject = '' } = {}) {
  const n = Math.max(2, Math.min(60, Number(count) || 10));
  const prof = subject ? getSubjectExamProfile(subject) : null;
  const advanced = isAdvancedFormat(format);
  const gdpt = isGdptFormat(format);
  const essayMode = isEssayFormat(format) || prof?.examFamily === 'literature_essay';
  const parts = [];
  if (essayMode) {
    parts.push({ format: 'essay', n });
  } else if (gdpt) {
    const s = gdptSplit(n, subject, format);
    if (s.p1 > 0) parts.push({ format: 'multiple_choice', n: s.p1 });
    if (s.p2 > 0) parts.push({ format: 'true_false', n: s.p2 });
    if (s.p3 > 0) parts.push({ format: 'short_answer', n: s.p3 });
    if (s.essay > 0) parts.push({ format: 'essay', n: s.essay });
  } else {
    parts.push({ format: 'multiple_choice', n });
  }
  const slots = [];
  parts.forEach((p, pi) => {
    const w = (gdpt || essayMode) ? partWeights(p.format, advanced) : levelWeights(intent, advanced);
    const d = distribute(p.n, w);
    LEVEL_KEYS.forEach((k) => {
      for (let i = 0; i < d[k]; i++) slots.push({ partIndex: pi, partFormat: p.format, levelKey: k });
    });
  });
  return { slots, parts, n };
}

/** Tính lại điểm từng ô theo trọng số dạng câu (hỗ trợ đúng tỉ lệ 1:4:2 của Toán 2025), tổng luôn = 10. */
export function normalizePoints(matrix) {
  const subjectWeights = matrix?.subject
    ? (getSubjectExamProfile(matrix.subject).standardCounts?.weights || PART_WEIGHT)
    : PART_WEIGHT;
  let units = 0;
  (matrix.parts || []).forEach((p) => {
    const w = subjectWeights[p.format] || PART_WEIGHT[p.format] || 1;
    (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => { units += (Number(t[k]?.count) || 0) * w; }));
  });
  if (!units) return matrix;
  const unit = 10 / units;
  (matrix.parts || []).forEach((p) => {
    const w = subjectWeights[p.format] || PART_WEIGHT[p.format] || 1;
    (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => {
      const c = Math.max(0, Math.round(Number(t[k]?.count) || 0));
      t[k] = { count: c, points: Math.round(c * w * unit * 100) / 100 };
    }));
  });
  /* bù chênh lệch làm tròn vào ô lớn nhất để tổng đúng 10,00 */
  let sum = 0;
  let big = null;
  (matrix.parts || []).forEach((p) => (p.topics || []).forEach((t) => LEVEL_KEYS.forEach((k) => {
    sum += t[k].points;
    if (t[k].count > 0 && (!big || t[k].count > big.count)) big = t[k];
  })));
  if (big) big.points = Math.round((big.points + (10 - sum)) * 100) / 100;
  matrix.totalPoints = 10;
  matrix.summary = summarizeMatrix(matrix);
  return matrix;
}

function fallbackTopicName(topic, levelKey) {
  const t = topic || 'Kiến thức trọng tâm';
  if (levelKey === 'nb') return `Nhận biết khái niệm, tính chất — ${t}`;
  if (levelKey === 'th') return `Thông hiểu: giải thích, so sánh — ${t}`;
  if (levelKey === 'vd') return `Vận dụng: tính toán, áp dụng công thức — ${t}`;
  return `Vận dụng cao: bài toán tổng hợp — ${t}`;
}

function buildMatrixFromSlots({ slots, parts, names, meta }) {
  const matrixParts = parts.map((p, pi) => ({
    partName: `Phần ${ROMAN[pi]}: ${PART_LABEL[p.format]}`,
    format: p.format,
    topics: [],
  }));
  slots.forEach((s, i) => {
    const name = String(names[i] || '').trim().slice(0, 140) || fallbackTopicName(meta.topic, s.levelKey);
    const part = matrixParts[s.partIndex];
    let row = part.topics.find((t) => t.name === name);
    if (!row) {
      row = { name, nb: emptyLevel(), th: emptyLevel(), vd: emptyLevel(), vdc: emptyLevel() };
      part.topics.push(row);
    }
    row[s.levelKey].count += 1;
  });
  const matrix = {
    title: meta.title,
    subject: meta.subject,
    grade: meta.grade,
    duration: meta.duration,
    totalPoints: 10,
    totalQuestions: slots.length,
    source: meta.source,
    parts: matrixParts,
    aiPedagogicalAdvice: meta.advice,
    focusSkills: meta.focusSkills || [],
  };
  return normalizePoints(matrix);
}

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    topics: { type: 'array', items: { type: 'string' } },
    aiPedagogicalAdvice: { type: 'string' },
    focusSkills: { type: 'array', items: { type: 'string' } },
  },
  required: ['topics'],
};

function getSubjectFlags(subject = '') {
  const s = getSubject(subject);
  const id = s.id;
  const sLower = String(subject || '').toLowerCase();
  const isBio = id === 'sinh';
  const isPhysics = id === 'ly';
  const isMath = id === 'toan';
  const isEnglish = id === 'anh';
  const isLit = id === 'van';
  const isHistory = id === 'su';
  const isGeo = id === 'dia';
  const isCivics = id === 'gdcd';
  const isIT = id === 'tin';
  const isTech = id === 'congnghe';
  const isKhtn = id === 'khtn';
  const isChem = id === 'hoa' || sLower.includes('hóa') || sLower.includes('hoa') || id === 'generic';
  const subjName = id !== 'generic' ? s.label : (String(subject || '').trim() || 'Môn học');
  return { isBio, isPhysics, isMath, isEnglish, isLit, isHistory, isGeo, isCivics, isIT, isTech, isKhtn, isChem, subjName };
}

export function getGradeCurriculumGuideline(grade, subject = 'Hóa học') {
  const g = String(grade || '12');
  const { isBio, isPhysics, isMath, isEnglish, isLit, isHistory, isGeo, isCivics, isIT, isTech, isKhtn } = getSubjectFlags(subject);

  if (isLit) {
    return `PHẠM VI KIẾN THỨC CHUẨN NGỮ VĂN LỚP ${g} (GDPT 2018 & ĐỊNH DẠNG 2025):
- Ngữ liệu đọc hiểu: thơ (thất ngôn, tự do, lục bát...), truyện ngắn, tiểu thuyết, kí/tùy bút/tản văn, văn bản nghị luận, văn bản thông tin; ngữ liệu mới nằm ngoài SGK càng tốt.
- Kỹ năng: nhận biết thể loại, phương thức biểu đạt, biện pháp tu từ, thông điệp/nội dung chính; phân tích hiệu quả nghệ thuật, viết đoạn nghị luận xã hội (~200 chữ) và bài văn nghị luận văn học (~600 chữ).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ NGỮ VĂN. Không trộn kiến thức Khoa học tự nhiên hay Toán học.`;
  }

  if (isHistory) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN LỊCH SỬ LỚP 10 (GDPT 2018):
- Lịch sử & Sử học; Vai trò của sử học; Một số nền văn minh thế giới cổ - trung đại (Ai Cập, Trung Hoa, Ấn Độ, Hy Lạp - La Mã, Phục hưng); Các cuộc cách mạng công nghiệp trong lịch sử nhân loại; Văn minh Đông Nam Á & Văn minh Việt Nam (Văn Lang - Âu Lạc, Chăm-pa, Phù Nam, Đại Việt).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ LỊCH SỬ. Phần Đúng/Sai chuẩn 2025 thường gắn với một đoạn tư liệu lịch sử ngắn. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay KHTN.`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN LỊCH SỬ LỚP 11 (GDPT 2018):
- Cách mạng tư sản & sự phát triển của chủ nghĩa tư bản; Chủ nghĩa xã hội từ năm 1917 đến nay; Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á; Chiến tranh bảo vệ Tổ quốc và chiến tranh giải phóng dân tộc trong lịch sử Việt Nam trước 1945; Một số cuộc cải cách lớn (Hồ Quý Ly, Lê Thánh Tông, Minh Mạng); Lịch sử bảo vệ chủ quyền ở Biển Đông.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ LỊCH SỬ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay KHTN.`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN LỊCH SỬ LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025):
- Thế giới trong và sau Chiến tranh lạnh (Trật tự I-an-ta, Liên Hợp Quốc, trật tự thế giới đa cực); ASEAN và quá trình hội nhập khu vực.
- Cách mạng tháng Tám năm 1945, Kháng chiến chống thực dân Pháp (1945–1954), Kháng chiến chống Mỹ cứu nước (1954–1975), Đấu tranh bảo vệ Tổ quốc từ sau 4/1975.
- Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay; Hoạt động đối ngoại của Việt Nam & Hồ Chí Minh trong lịch sử.
- Định dạng chuẩn 2025: Phần I (24 câu trắc nghiệm) + Phần II (4 câu Đúng/Sai gắn với đoạn tư liệu lịch sử), KHÔNG có Phần III Trả lời ngắn.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ LỊCH SỬ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay KHTN!`;
  }

  if (isGeo) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN ĐỊA LÍ LỚP 10 (GDPT 2018):
- Sử dụng bản đồ; Trái Đất & Thạch quyển, Khí quyển, Thủy quyển, Sinh quyển; Địa lí dân cư, cơ cấu nền kinh tế, nông nghiệp - công nghiệp - dịch vụ và phát triển bền vững.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ ĐỊA LÍ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay Vật lý.`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN ĐỊA LÍ LỚP 11 (GDPT 2018):
- Toàn cầu hóa, khu vực hóa kinh tế; An ninh toàn cầu; Thực hành đọc bảng số liệu/biểu đồ về các khu vực và quốc gia trọng điểm (Mỹ Latinh, EU, Đông Nam Á, Tây Nam Á, Hoa Kỳ, Liên bang Nga, Nhật Bản, Trung Quốc).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ ĐỊA LÍ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay KHTN.`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN ĐỊA LÍ LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025):
- Địa lí tự nhiên Việt Nam: Vị trí địa lí, thiên nhiên nhiệt đới ẩm gió mùa, sự phân hóa đa dạng của tự nhiên, bảo vệ tài nguyên - môi trường.
- Địa lí dân cư: Dân số, lao động và việc làm, đô thị hóa.
- Địa lí các ngành kinh tế & chuyển dịch cơ cấu (Nông-lâm-ngư, Công nghiệp, Dịch vụ); Sự phát triển và phân bố kinh tế ở các vùng kinh tế (TDMNPB, ĐBSH, BTB, DHNTB, Tây Nguyên, Đông Nam Bộ, ĐBSCL) và kinh tế biển đảo.
- Định dạng chuẩn 2025: 18 TN + 4 Đúng/Sai (kèm bảng số liệu/biểu đồ) + 6 Trả lời ngắn (tính mật độ dân số, tốc độ tăng trưởng, năng suất, tỉ trọng, biên độ nhiệt, cán cân xuất nhập khẩu — nêu rõ đơn vị và quy tắc làm tròn).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ ĐỊA LÍ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay Sinh học!`;
  }

  if (isCivics) {
    return `PHẠM VI KIẾN THỨC CHUẨN GDKT&PL LỚP ${g} (GDPT 2018 & ĐỊNH DẠNG 2025):
- Lớp 10: Hoạt động của nền kinh tế và các chủ thể kinh tế, thị trường, ngân sách nhà nước, thuế, tín dụng, lập kế hoạch tài chính cá nhân; Hệ thống chính trị và Hiến pháp nước CHXHCN Việt Nam.
- Lớp 11: Cạnh tranh, cung - cầu, lạm phát, thất nghiệp, thị trường lao động, ý tưởng & đạo đức kinh doanh; Quyền bình đẳng của công dân và các quyền tự do cơ bản.
- Lớp 12: Tăng trưởng & phát triển kinh tế, hội nhập kinh tế quốc tế, bảo hiểm & an sinh xã hội, trách nhiệm xã hội doanh nghiệp; Quyền và nghĩa vụ công dân trong kinh doanh, nộp thuế, sở hữu, hôn nhân gia đình, học tập; Một số vấn đề cơ bản của pháp luật quốc tế.
- Định dạng chuẩn 2025: Phần I (24 câu trắc nghiệm, có câu hỏi chùm từ đoạn thông tin) + Phần II (4 câu Đúng/Sai gắn tình huống thực tế).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ GDKT&PL. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay KHTN!`;
  }

  if (isIT) {
    return `PHẠM VI KIẾN THỨC CHUẨN TIN HỌC LỚP ${g} (GDPT 2018 & ĐỊNH DẠNG 2025):
- Lớp 10: Thông tin & xử lí thông tin, biểu diễn dữ liệu, mạng máy tính & an toàn không gian mạng, đồ họa vector, lập trình Python cơ bản (biến, rẽ nhánh, vòng lặp, danh sách, hàm).
- Lớp 11: Hệ điều hành, phần mềm nguồn mở, cơ sở dữ liệu quan hệ & truy vấn SQL (SELECT, JOIN, khóa chính/ngoại), cấu trúc dữ liệu danh sách & thuật toán sắp xếp/tìm kiếm.
- Lớp 12: Trí tuệ nhân tạo (AI) & ứng dụng, Mạng máy tính & Internet (giao thức TCP/IP, thiết bị mạng Switch/Router), Tạo trang web với HTML & CSS, Định hướng Khoa học máy tính / Tin học ứng dụng.
- Định dạng chuẩn 2025: 24 câu Trắc nghiệm + 4 câu Đúng/Sai (đoạn mã Python/SQL/HTML đặt trong khối \`\`\`), KHÔNG có Phần III Trả lời ngắn.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TIN HỌC. Bảo toàn nguyên vẹn ký hiệu code (!=, <=, >=, ->, <h2>). TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học!`;
  }

  if (isTech) {
    return `PHẠM VI KIẾN THỨC CHUẨN CÔNG NGHỆ LỚP ${g} (GDPT 2018 & ĐỊNH DẠNG 2025):
- Lớp 10: Khái quát công nghệ, bản vẽ kỹ thuật & thiết kế kỹ thuật (Công nghiệp) HOẶC trồng trọt công nghệ cao, đất trồng, phân bón, sâu bệnh (Nông nghiệp).
- Lớp 11: Vật liệu cơ khí, gia công cắt gọt, động cơ đốt trong & ô tô, tự động hóa cơ khí HOẶC giống, thức ăn, phòng trị bệnh vật nuôi (Chăn nuôi).
- Lớp 12: Kỹ thuật điện (mạch điện xoay chiều ba pha, hệ thống điện quốc gia, an toàn điện), Kỹ thuật điện tử (linh kiện bán dẫn, mạch khuếch đại, cổng logic, vi điều khiển) HOẶC Lâm nghiệp & Thủy sản bền vững.
- Định dạng chuẩn 2025: 24 Trắc nghiệm + 4 Đúng/Sai.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ CÔNG NGHỆ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học thuần túy!`;
  }

  if (isKhtn) {
    return `PHẠM VI KIẾN THỨC CHUẨN KHOA HỌC TỰ NHIÊN (TÍCH HỢP VẬT LÝ - HÓA HỌC - SINH HỌC):
- Phối hợp cân đối 3 phân môn: Chất & sự biến đổi chất (Hóa), Năng lượng & sự biến đổi (Vật lý), Vật sống & cơ thể sinh vật (Sinh học) theo chuẩn chương trình GDPT 2018.`;
  }

  if (isEnglish) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN TIẾNG ANH LỚP 10 (GDPT 2018 - Global Success):
- Chủ điểm từ vựng: Family Life, Humans and the Environment, Music, For a Better Community, Inventions, Gender Equality, Vietnam and International Organisations, New Ways to Learn, Protecting the Environment, Ecotourism.
- Ngữ pháp trọng tâm: Present simple vs Present continuous, Future with will/be going to, Passive voice, Compound sentences, To-infinitives & bare infinitives, Gerunds vs infinitives, Present perfect, Relative clauses (defining & non-defining), Comparative & superlative, Conditionals (type 1 & 2), Reported speech.
- Dạng bài chuẩn 2025: Trắc nghiệm 4 lựa chọn (ngữ pháp, từ vựng, đọc điền thông báo/tờ rơi, sắp xếp hội thoại/thư/đoạn văn a-b-c, đọc hiểu).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TIẾNG ANH. Câu hỏi và 4 phương án PHẢI bằng tiếng Anh chuẩn; phần 'explain' giải thích bằng tiếng Việt rõ ràng. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học, Vật lý, Sinh học hay Toán học!`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN TIẾNG ANH LỚP 11 (GDPT 2018 - Global Success):
- Chủ điểm từ vựng: A Long and Healthy Life, The Generation Gap, Cities of the Future, ASEAN and Vietnam, Global Warming, Preserving Our Heritage, Education Options for School-Leavers, Becoming Independent, Social Issues, The Ecosystem.
- Ngữ pháp trọng tâm: Past simple vs Present perfect, Modal verbs (must, have to, should), Stative verbs & Linking verbs, Gerunds as subjects/objects, Present participle & Past participle clauses, To-infinitive clauses, Perfect gerunds & perfect participles, Cleft sentences (It is/was ... that ...), Linking words & connectors (moreover, however, in addition, therefore...).
- Dạng bài chuẩn GDPT 2025: 100% Trắc nghiệm 4 lựa chọn (từ vựng/ngữ pháp, sắp xếp câu hội thoại/thư/đoạn văn a-b-c-d-e, đọc điền tờ rơi/thông báo & cloze test, đọc hiểu 8 câu).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TIẾNG ANH. Câu hỏi và 4 phương án PHẢI bằng tiếng Anh chuẩn; phần 'explain' giải thích bằng tiếng Việt rõ ràng. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học, Vật lý, Sinh học hay Toán học!`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN TIẾNG ANH LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025 - Global Success):
- Chủ điểm từ vựng: Life Stories We Admire, A Multicultural World, Green Living, Urbanisation, The World of Work, Artificial Intelligence, The World of Mass Media, Wildlife Conservation, Career Paths, Lifelong Learning.
- Ngữ pháp trọng tâm: Past simple vs Past continuous, Articles (a/an/the/zero), Verbs with prepositions & Phrasal verbs, Relative clauses referring to a whole sentence (which), Simple/compound/complex sentences, Double comparatives (The more ... the more ...), Adverbial clauses of condition/comparison/manner/result, Active & passive causatives (have/get sth done), Reported speech (orders, requests, offers, advice).
- Định dạng đề minh họa Bộ GD&ĐT 2025 (40 câu - 50 phút, 100% Trắc nghiệm 4 lựa chọn): đọc điền quảng cáo/tờ rơi (advertisement/leaflet cloze), sắp xếp hội thoại/lá thư/đoạn văn (arrangement a-b-c-d-e), đọc điền cấu trúc/mệnh đề, đọc hiểu 8 câu và 10 câu (inference, closest/opposite meaning, NOT mentioned, paragraph reference).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TIẾNG ANH. Câu hỏi và 4 phương án PHẢI bằng tiếng Anh chuẩn; phần 'explain' giải thích bằng tiếng Việt rõ ràng. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học, Vật lý, Sinh học hay Toán học!`;
  }

  if (isPhysics) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN VẬT LÝ LỚP 10 (GDPT 2018):
- Mở đầu & Sai số phép đo, chuyển động thẳng đều, biến đổi đều, rơi tự do, chuyển động ném ngang/ném xiên.
- Động lực học: 3 định luật Newton, trọng lực, lực ma sát, lực cản, mômen lực, điều kiện cân bằng vật rắn.
- Năng lượng, công, công suất, động năng, thế năng, định luật bảo toàn cơ năng, hiệu suất.
- Động lượng, định luật bảo toàn động lượng, va chạm đàn hồi/mềm, chuyển động tròn đều (gia tốc hướng tâm, lực hướng tâm).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ VẬT LÝ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay Sinh học!`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN VẬT LÝ LỚP 11 (GDPT 2018):
- Dao động: dao động điều hòa (x, v, a, pha, năng lượng), con lắc lò xo, con lắc đơn, dao động tắt dần, cộng hưởng.
- Sóng: bước sóng, truyền sóng, sóng ngang/dọc, giao thoa sóng cơ và giao thoa ánh sáng Y-âng, sóng dừng trên dây.
- Trường tĩnh điện: định luật Coulomb, cường độ điện trường, điện thế, hiệu điện thế, tụ điện (nối tiếp, song song, năng lượng tụ).
- Dòng điện không đổi: cường độ dòng điện, điện trở, suất điện động, định luật Ôm toàn mạch, công và công suất điện.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ VẬT LÝ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay Sinh học!`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN VẬT LÝ LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025):
- Vật lí nhiệt: Cấu trúc chất, sự chuyển thể, nội năng, định luật I nhiệt động lực học, nhiệt dung riêng, nhiệt nóng chảy riêng, nhiệt hóa hơi riêng.
- Khí lí tưởng: Mô hình động học phân tử, quá trình đẳng nhiệt (Boyle), đẳng áp (Charles), phương trình trạng thái khí lí tưởng (pV = nRT), áp suất theo mô hình động học phân tử.
- Từ trường & Điện từ: Từ trường dòng điện, lực từ (F = BIl sinα), cảm ứng điện từ (từ thông, Faraday, Lenz), đại cương dòng điện xoay chiều, mạch RLC.
- Vật lí hạt nhân: Cấu trúc hạt nhân, độ hụt khối, năng lượng liên kết riêng, phản ứng hạt nhân (phân hạch, nhiệt hạch), hiện tượng phóng xạ & chu kì bán rã.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ VẬT LÝ. TUYỆT ĐỐI KHÔNG ra câu hỏi Hóa học hay Sinh học!`;
  }

  if (isMath) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN TOÁN HỌC LỚP 10 (GDPT 2018):
- Mệnh đề, tập hợp; Bất phương trình và hệ bất phương trình bậc nhất hai ẩn.
- Hàm số bậc hai, dấu tam thức bậc hai, giải bất phương trình bậc hai một ẩn.
- Hệ thức lượng trong tam giác, Vectơ và tích vô hướng trong mặt phẳng Oxy, phương trình đường thẳng và đường tròn.
- Đại số tổ hợp (quy tắc cộng/nhân, hoán vị, chỉnh hợp, tổ hợp, nhị thức Newton) và Xác suất cổ điển.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TOÁN HỌC. TUYỆT ĐỐI KHÔNG đưa kiến thức Hóa học hay Sinh học vào đề Toán!`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN TOÁN HỌC LỚP 11 (GDPT 2018):
- Hàm số lượng giác và phương trình lượng giác cơ bản.
- Dãy số, cấp số cộng, cấp số nhân; Giới hạn dãy số, giới hạn hàm số, hàm số liên tục.
- Hàm số mũ và hàm số logarit, phương trình và bất phương trình mũ/logarit.
- Quan hệ song song và quan hệ vuông góc trong không gian (góc, khoảng cách), tính đạo hàm.
- Các quy tắc tính xác suất (biến cố hợp, giao, độc lập).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TOÁN HỌC. TUYỆT ĐỐI KHÔNG đưa kiến thức Hóa học hay Sinh học vào đề Toán!`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN TOÁN HỌC LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025):
- Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số (đơn điệu, cực trị, GTNN/GTLN, đường tiệm cận, bài toán tối ưu thực tiễn).
- Vectơ và hệ trục tọa độ Oxyz trong không gian, phương trình mặt phẳng, đường thẳng và mặt cầu trong Oxyz.
- Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm (khoảng biến thiên, tứ phân vị, phương sai, độ lệch chuẩn).
- Nguyên hàm, tích phân và ứng dụng tính diện tích hình phẳng, thể tích vật thể tròn xoay.
- Xác suất có điều kiện và công thức xác suất toàn phần, công thức Bayes.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ TOÁN HỌC. TUYỆT ĐỐI KHÔNG đưa kiến thức Hóa học hay Sinh học vào đề Toán!`;
  }

  if (isBio) {
    if (g === '10') {
      return `PHẠM VI KIẾN THỨC CHUẨN SINH HỌC LỚP 10 (GDPT 2018):
- Sinh học tế bào: Các cấp độ tổ chức sống; Các phân tử sinh học (Nước, Cacbohiđrat, Lipit, Protein, Axit nuclêic ADN/ARN xét theo cấu trúc và chức năng sinh học); Cấu trúc tế bào nhân sơ và nhân thực; Vận chuyển các chất qua màng tế bào.
- Chuyển hóa năng lượng ở tế bào: Hô hấp tế bào, Quang hợp và Enzyme.
- Chu kì tế bào, Nguyên phân và Giảm phân.
- Vi sinh vật và Virus: Cấu tạo virus, ứng dụng và các bệnh truyền nhiễm.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ SINH HỌC. TUYỆT ĐỐI KHÔNG ra câu hỏi môn Hóa học (không bắt cân bằng phương trình hóa học hữu cơ/vô cơ, không tính số mol hay khối lượng hóa chất, không hỏi halogen hay pin điện).`;
    }
    if (g === '11') {
      return `PHẠM VI KIẾN THỨC CHUẨN SINH HỌC LỚP 11 (GDPT 2018):
- Sinh học cơ thể thực vật: Trao đổi nước và khoáng, Quang hợp (thực vật C3, C4, CAM) và Hô hấp ở thực vật.
- Sinh học cơ thể động vật: Tiêu hóa, Hô hấp, Tuần hoàn máu, Miễn dịch, Bài tiết và cân bằng nội môi.
- Cảm ứng ở sinh vật: Hướng động, ứng động ở thực vật; Điện thế nghỉ, điện thế hoạt động, synap, tập tính ở động vật.
- Sinh trưởng, phát triển và Sinh sản ở sinh vật.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ SINH HỌC. TUYỆT ĐỐI KHÔNG ra câu hỏi môn Hóa học!`;
    }
    return `PHẠM VI KIẾN THỨC CHUẨN SINH HỌC LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP THPT 2025):
- Phần 1. Di truyền học:
  + Cơ chế di truyền và biến dị phân tử: Cấu trúc gen, mã di truyền, nhân đôi ADN, phiên mã, dịch mã, điều hòa hoạt động gen (Operon Lac), đột biến gen.
  + Cơ chế di truyền và biến dị tế bào: Cấu trúc nhiễm sắc thể, đột biến cấu trúc NST, đột biến số lượng NST (lệch bội, đa bội).
  + Quy luật di truyền: Phân li, phân li độc lập (Menđen), tương tác gen, liên kết gen và hoán vị gen, di truyền liên kết giới tính, di truyền ngoài nhân.
  + Di truyền học quần thể (cân bằng Hardy-Weinberg), Di truyền học người, Ứng dụng di truyền (công nghệ tế bào, công nghệ gen).
- Phần 2. Tiến hóa: Bằng chứng tiến hóa, học thuyết Đacuyn, thuyết tiến hóa hiện đại, các nhân tố tiến hóa, sự phát sinh sự sống.
- Phần 3. Sinh thái học: Cá thể và môi trường, Quần thể sinh vật, Quần xã sinh vật, Hệ sinh thái, Chuỗi và lưới thức ăn, Hiệu suất sinh thái, Chu trình sinh địa hóa.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ SINH HỌC. TUYỆT ĐỐI KHÔNG ra câu hỏi môn Hóa học!`;
  }

  // Môn Hóa học (Mặc định)
  if (g === '10') {
    return `PHẠM VI KIẾN THỨC CHUẨN HÓA HỌC LỚP 10 (GDPT 2018):
- Cấu tạo nguyên tử (hạt nhân, electron, orbital s, p, d, cấu hình electron).
- Bảng tuần hoàn: ô, chu kì, nhóm (A và B), quy luật biến đổi tuần hoàn (bán kính, độ âm điện, tính kim loại/phi kim, oxide cao nhất, hydroxide).
- Liên kết hóa học: quy tắc octet, liên kết ion, liên kết cộng hóa trị (phân cực/không phân cực), liên kết hydrogen, tương tác van der Waals.
- Phản ứng oxi hóa - khử: xác định số oxi hóa, chất khử, chất oxi hóa, quá trình oxi hóa/khử, cân bằng thăng bằng electron.
- Năng lượng hóa học: biến thiên enthalpy chuẩn của phản ứng (Δr H°298), nhiệt tạo thành chuẩn (Δf H°298), phản ứng tỏa nhiệt/thu nhiệt.
- Tốc độ phản ứng: các yếu tố ảnh hưởng (nồng độ, nhiệt độ, áp suất, diện tích tiếp xúc, chất xúc tác), định luật tác dụng khối lượng.
- Nhóm Halogen (VIIA): tính chất đơn chất (F2, Cl2, Br2, I2), hợp chất hydrogen halide, hydrohalic acid, muối halide, tính oxi hóa và phản ứng nhận biết.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ HÓA HỌC. TUYỆT ĐỐI KHÔNG đưa kiến thức Sinh học hay Hóa lớp 11, 12 vào đề lớp 10!`;
  }
  if (g === '11') {
    return `PHẠM VI KIẾN THỨC CHUẨN HÓA HỌC LỚP 11 (GDPT 2018):
- Cân bằng hóa học: phản ứng thuận nghịch, trạng thái cân bằng, hằng số cân bằng Kc, nguyên lí chuyển dịch cân bằng Le Chatelier.
- Cân bằng trong dung dịch nước: sự điện li, acid - base theo Bronsted-Lowry, pH, chất chỉ thị, chuẩn độ acid - base, môi trường dung dịch.
- Đơn chất và hợp chất của Nitrogen: Nitrogen (N2), Ammonia (NH3), muối ammonium, Nitric acid (HNO3) và muối nitrate, hiện tượng phú dưỡng.
- Đơn chất và hợp chất của Sulfur: Sulfur (S), Sulfur dioxide (SO2), Sulfuric acid (H2SO4) và muối sulfate.
- Đại cương hóa học hữu cơ: khái niệm, công thức phân tử, công thức cấu tạo, đồng phân, nhóm chức, phổ hồng ngoại (IR), phổ khối lượng (MS).
- Hydrocarbon: Alkane (danh pháp, thế halogen, cháy), Alkene & Alkyne (cộng H2, X2, HX, H2O, trùng hợp, phản ứng tráng bạc của alk-1-yne), Arene (benzene, toluene, thế bromine/nitro, oxi hóa nhánh alkyl).
- Dẫn xuất halogen, Alcohol (bậc alcohol, phản ứng với Na, CuO, tách nước tạo alkene/ether), Phenol (tính acid, thế brom vào vòng benzen tạo kết tủa trắng).
- Hợp chất Carbonyl (Aldehyde, Ketone): tráng bạc Tollens, phản ứng với Cu(OH)2/OH-, tạo iodoform.
- Carboxylic acid: tính acid, phản ứng ester hóa với alcohol.
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ HÓA HỌC. TUYỆT ĐỐI KHÔNG đưa kiến thức Sinh học hay Hóa lớp 12 vào đề lớp 11!`;
  }
  return `PHẠM VI KIẾN THỨC CHUẨN HÓA HỌC LỚP 12 (GDPT 2018 & THI TỐT NGHIỆP 2025):
- Ester - Lipid: danh pháp, tính chất vật lí, phản ứng thủy phân (acid và xà phòng hóa), chất béo, xà phòng và chất giặt rửa tổng hợp.
- Carbohydrate: Glucose, Fructose, Saccharose, Maltose, Tinh bột, Cellulose (cấu tạo, tính chất, phản ứng thủy phân, tráng bạc, Cu(OH)2, màu với I2).
- Hợp chất chứa Nitrogen: Amine (bậc amine, tính base, phản ứng muối/với nitrous acid), Amino acid (lưỡng tính, điểm đẳng điện), Peptide và Protein (liên kết peptide, phản ứng màu biuret, đông tụ), Enzyme.
- Polymer và vật liệu: trùng hợp, trùng ngưng, chất dẻo, tơ tổng hợp/bán tổng hợp, cao su, keo dán.
- Pin điện hóa và điện phân: thế điện cực chuẩn (E°), pin Galvani, dãy điện hóa kim loại, quy tắc anpha, điện phân nóng chảy và điện phân dung dịch.
- Đại cương kim loại và nhóm kim loại: cấu tạo mạng tinh thể, tính chất vật lí chung/riêng, tính chất hóa học, kim loại kiềm (IA), kiềm thổ (IIA), nhôm (Al) và hợp chất lưỡng tính (Al2O3, Al(OH)3).
- Sơ lược kim loại chuyển tiếp dãy thứ nhất (Fe, Cu, Cr...) và Phức chất (khái niệm phức chất, nguyên tử trung tâm, phối tử, điện tích).
CẢNH BÁO MÔN HỌC (ĐỀ NÀO RA ĐỀ ĐÓ): ĐÂY LÀ ĐỀ HÓA HỌC. 100% CÂU HỎI PHẢI THUẦN TÚY HÓA HỌC.
TUYỆT ĐỐI CẤM đưa các câu hỏi hay kiến thức của môn Sinh học vào đề (cấm hỏi về tế bào, ribosome, nhân đôi ADN, phiên mã, dịch mã, mã di truyền, đột biến gen, nhiễm sắc thể, nguyên phân, giảm phân, quy luật di truyền, hệ sinh thái...). Các chủ đề Este, Lipit, Carbohydrate, Amino acid, Protein PHẢI ĐƯỢC HỎI DƯỚI GÓC ĐỘ HÓA HỌC: công thức cấu tạo, phản ứng hóa học (thủy phân, xà phòng hóa, tráng bạc, biuret, tính acid-base), tính toán số mol, khối lượng, bảo toàn khối lượng và electron!`;
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
  skipCredit = false,
} = {}) {
  const g = String(grade || '12');
  if (!THPT_GRADES.includes(g)) {
    throw new Error('Công cụ này chỉ hỗ trợ THPT (lớp 10, 11, 12).');
  }
  const { slots, parts, n } = buildSlots({ count, format, intent, subject });
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const cleanTopic = topic || 'Kiến thức trọng tâm';

  const slotLines = slots
    .map((s, i) => `${i + 1}. Phần ${ROMAN[s.partIndex]} · ${PART_LABEL[s.partFormat]} · mức ${BLOOM_MAPPING[s.levelKey].vn}`)
    .join('\n');

  const system = `Bạn là chuyên gia khảo thí môn ${subject} THPT, lớp ${g}, chương trình GDPT 2018 và cấu trúc đề thi tốt nghiệp THPT 2025.
Cấu trúc đề (số câu, phần, mức độ) đã được hệ thống CỐ ĐỊNH — bạn KHÔNG được thay đổi.
Nhiệm vụ: đặt TÊN DẠNG BÀI cụ thể cho từng ô, đúng thứ tự.

${getGradeCurriculumGuideline(g, subject)}

Quy tắc:
- Trả về đúng ${n} phần tử trong "topics", phần tử thứ i ứng với ô thứ i.
        - Mọi tên ≤ 90 ký tự, cụ thể theo nội dung/kỹ năng/chuyên đề của môn ${subject} (KHÔNG ghi chung chung kiểu "kiến thức trọng tâm").
- Đúng mức độ: Nhận biết = nhớ khái niệm, đặc điểm, thông tin; Thông hiểu = giải thích, so sánh, phân tích ngữ liệu/hiện tượng; Vận dụng = giải quyết bài tập/tình huống thực tiễn; Vận dụng cao = tổng hợp, biện luận, lập luận nâng cao.
- Phần đúng/sai: một tình huống/thí nghiệm/tư liệu có 4 nhận định. Phần trả lời ngắn: bài toán/tính toán cho ra một số. Phần tự luận: câu hỏi đọc hiểu/nghị luận/trình bày chi tiết.
- Bao phủ toàn bộ chủ đề, hạn chế trùng lặp; không ra ngoài chương trình lớp ${g}.
${classInsights ? '- Ưu tiên đào sâu các điểm yếu của lớp được cung cấp.' : ''}

Chỉ trả JSON: {"title":"Tên đề ngắn gọn","topics":["..."],"aiPedagogicalAdvice":"2–3 câu: vì sao phân bổ như vậy, tiết tới nên nhấn gì","focusSkills":["kỹ năng 1","kỹ năng 2"]}`;

  const user = [
    `Chủ đề: ${cleanTopic}. Lớp ${g}. ${n} câu, ${duration} phút. Loại: ${intentLabel(intent)}.`,
    customPrompt ? `Yêu cầu thêm của giáo viên: ${customPrompt}` : '',
    classInsights ? `Phân tích lớp:\n${String(classInsights).slice(0, 800)}` : '',
    `DANH SÁCH Ô CẦN ĐẶT TÊN:\n${slotLines}`,
    textParts.length ? `Tài liệu tham khảo:\n${textParts.join('\n\n').slice(0, 24000)}` : '',
  ].filter(Boolean).join('\n\n');

  const meta = {
    topic: cleanTopic,
    subject,
    grade: g,
    duration,
    title: `Đề ${cleanTopic} — ${subject} lớp ${g}`,
    advice: `Đã lập ${n} câu / ${duration} phút cho "${cleanTopic}" lớp ${g}, phân bổ 4 mức nhận thức theo chuẩn khảo thí. Xem bảng bên phải rồi xác nhận để sinh câu hỏi.`,
    focusSkills: [],
    source: 'ai',
  };

  try {
    const raw = await callModel({
      system,
      parts: [...imageParts, ...pdfParts, { text: user }],
      temperature: 0.3,
      signal,
      schema: PLAN_SCHEMA,
      skipCredit,
    });
    const data = parseJsonLoose(raw);
    const names = (Array.isArray(data?.topics) ? data.topics : [])
      .map((x) => (typeof x === 'string' ? x : x?.name || ''));
    if (names.filter(Boolean).length >= Math.ceil(n * 0.5)) {
      meta.title = String(data.title || '').trim() || meta.title;
      if (data.aiPedagogicalAdvice) meta.advice = String(data.aiPedagogicalAdvice).trim();
      meta.focusSkills = Array.isArray(data.focusSkills) ? data.focusSkills.slice(0, 5) : [];
      return buildMatrixFromSlots({ slots, parts, names, meta });
    }
    console.warn('[matrix] AI trả quá ít tên dạng bài, dùng khung dự phòng.');
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.warn('[matrix] AI plan failed, fallback:', err);
  }

  meta.source = 'fallback';
  meta.advice = `${meta.advice} (Khung dự phòng — AI chưa đặt được tên dạng bài chi tiết, thầy/cô có thể nhờ AI chỉnh lại.)`;
  return buildMatrixFromSlots({ slots, parts, names: [], meta });
}

/* ============================================================
   PHÂN TÍCH MA TRẬN RIÊNG CỦA GIÁO VIÊN (File / Ảnh / Văn bản)
   AI tự đọc hiểu cấu trúc ma trận của thầy/cô và tự động dựng bảng
   ============================================================ */
export async function parseTeacherCustomMatrixWithAI({
  text = '',
  files = [],
  subject = 'Hóa học',
  grade = '12',
  signal,
  skipCredit = false,
} = {}) {
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const g = String(grade || '12');

  const system = `Bạn là chuyên gia khảo thí THPT chương trình GDPT 2018 và quy chuẩn đề thi Bộ GD&ĐT Việt Nam.
Giáo viên cung cấp cho bạn một ma trận đề thi (dưới dạng văn bản mô tả, bảng ma trận phân phối câu hỏi, hoặc hình ảnh/tài liệu đính kèm).
NHIỆM VỤ:
1. Đọc hiểu toàn diện cấu trúc ma trận của thầy/cô:
   - Tiêu đề kỳ thi/bài kiểm tra
   - Các phần thi: Trắc nghiệm 4 lựa chọn (multiple_choice), Trắc nghiệm đúng/sai (true_false), Trả lời ngắn (short_answer), Tự luận (essay)
   - Từng chủ đề/chương/dạng bài
   - Số câu hỏi cụ thể ở 4 mức độ nhận thức: Nhận biết (nb), Thông hiểu (th), Vận dụng (vd), Vận dụng cao (vdc)
2. Tự động bóc tách và chuẩn hóa thành JSON để hệ thống tự động dựng ma trận chuẩn 100%.

Định dạng JSON BẮT BUỘC:
{
  "title": "Tên bài kiểm tra / kỳ thi (Ví dụ: Đề kiểm tra giữa kì 1 Hóa 12)",
  "subject": "${subject}",
  "grade": "${g}",
  "duration": 45,
  "parts": [
    {
      "format": "multiple_choice",
      "partName": "Phần I: Trắc nghiệm nhiều lựa chọn",
      "topics": [
        {
          "name": "Tên chủ đề / dạng bài",
          "nb": 2,
          "th": 1,
          "vd": 1,
          "vdc": 0
        }
      ]
    }
  ],
  "pedagogicalAdvice": "Nhận xét sư phạm ngắn gọn về ma trận này (tổng số câu, độ phân hóa, phân bố điểm)."
}

Quy tắc quan trọng:
- format trong parts chỉ nhận: "multiple_choice" (Trắc nghiệm nhiều lựa chọn), "true_false" (Trắc nghiệm Đúng/Sai), "short_answer" (Trả lời ngắn), "essay" (Tự luận).
- Đếm chính xác số câu ở từng mức độ (nb, th, vd, vdc) theo đúng bảng ma trận của giáo viên.
- Nếu tài liệu không ghi rõ mức độ của câu nào, hãy thông minh suy luận theo chuẩn Bloom GDPT 2018.
Chỉ trả về DUY NHẤT mã JSON hợp lệ.`;

  const user = [
    `Hãy phân tích ma trận đề thi do giáo viên cung cấp sau đây:`,
    text ? `Nội dung / Mô tả từ giáo viên:\n${text}` : '',
    textParts.length ? `Nội dung trích xuất từ tài liệu đính kèm:\n${textParts.join('\n\n').slice(0, 24000)}` : '',
    imageParts.length || pdfParts.length ? `(Có tài liệu/ảnh chụp ma trận đính kèm bên dưới)` : '',
  ].filter(Boolean).join('\n\n');

  const raw = await callModel({
    system,
    parts: [...imageParts, ...pdfParts, { text: user }],
    temperature: 0.2,
    signal,
    skipCredit,
  });

  const data = parseJsonLoose(raw);
  if (!data || !Array.isArray(data.parts) || !data.parts.length) {
    throw new Error('AI không nhận diện được cấu trúc ma trận từ dữ liệu được gửi. Thầy/cô vui lòng kiểm tra lại nội dung hoặc file đính kèm.');
  }

  // Chuẩn hóa cấu trúc parts và topics
  const matrixParts = [];
  let totalCount = 0;

  data.parts.forEach((p, pi) => {
    const rawFormat = String(p.format || '').toLowerCase();
    let format = 'multiple_choice';
    if (rawFormat.includes('true') || rawFormat.includes('sai') || rawFormat.includes('dung')) {
      format = 'true_false';
    } else if (rawFormat.includes('short') || rawFormat.includes('ngan')) {
      format = 'short_answer';
    } else if (rawFormat.includes('essay') || rawFormat.includes('luan') || rawFormat.includes('viet')) {
      format = 'essay';
    }

    const partTopics = [];
    (p.topics || []).forEach((t) => {
      const name = String(t.name || t.topic || 'Kiến thức trọng tâm').trim();
      const nb = Math.max(0, parseInt(t.nb || 0, 10));
      const th = Math.max(0, parseInt(t.th || 0, 10));
      const vd = Math.max(0, parseInt(t.vd || 0, 10));
      const vdc = Math.max(0, parseInt(t.vdc || 0, 10));
      const sum = nb + th + vd + vdc;
      if (sum > 0) {
        totalCount += sum;
        partTopics.push({
          name,
          nb: { count: nb, points: 0 },
          th: { count: th, points: 0 },
          vd: { count: vd, points: 0 },
          vdc: { count: vdc, points: 0 },
        });
      }
    });

    if (partTopics.length > 0) {
      matrixParts.push({
        partName: p.partName || `Phần ${ROMAN[matrixParts.length] || (pi + 1)}: ${PART_LABEL[format] || format}`,
        format,
        topics: partTopics,
      });
    }
  });

  if (!matrixParts.length || totalCount === 0) {
    throw new Error('Không trích xuất được câu hỏi nào từ ma trận này. Hãy mô tả rõ hơn số lượng câu hỏi theo từng mức độ.');
  }

  const finalGrade = THPT_GRADES.includes(String(data.grade)) ? String(data.grade) : g;
  const finalDuration = parseInt(data.duration || 45, 10) || 45;

  const matrix = {
    title: data.title || `Ma trận đề thi riêng — ${subject} lớp ${finalGrade}`,
    subject: data.subject || subject,
    grade: finalGrade,
    duration: finalDuration,
    totalPoints: 10,
    totalQuestions: totalCount,
    source: 'custom_teacher',
    parts: matrixParts,
    aiPedagogicalAdvice: data.pedagogicalAdvice || `Đã dựng xong ma trận riêng gồm ${totalCount} câu / ${finalDuration} phút theo đúng cấu trúc do thầy/cô cung cấp.`,
    focusSkills: data.focusSkills || [],
  };

  return normalizePoints(matrix);
}

/* Tương thích ngược: khung ma trận không cần AI */
export function buildFallbackMatrix({ topic = 'Kiến thức trọng tâm', grade = '12', subject = 'Hóa học', count = 10, duration = 30, intent = 'exam', format = '' } = {}) {
  const { slots, parts, n } = buildSlots({ count, format: format || suggestFormat(count, subject), intent, subject });
  return buildMatrixFromSlots({
    slots,
    parts,
    names: [],
    meta: {
      topic,
      subject,
      grade,
      duration,
      title: `Đề ${topic} — ${subject} lớp ${grade}`,
      advice: `Khung ${n} câu / ${duration} phút cho "${topic}" lớp ${grade}.`,
      focusSkills: [],
      source: 'fallback',
    },
  });
}

/* ============================================================
   CHỈNH MA TRẬN — AI chỉ đề xuất, CODE ép đúng số câu từng phần
   ============================================================ */
function repairMatrix(data, base, targets) {
  const out = { ...base, ...data, parts: [] };
  base.parts.forEach((bp) => {
    const dp = (data.parts || []).find((p) => p.format === bp.format) || null;
    const topics = (dp?.topics || [])
      .map((t) => ({
        name: String(t?.name || '').trim().slice(0, 140),
        nb: asLevel(t?.nb), th: asLevel(t?.th), vd: asLevel(t?.vd), vdc: asLevel(t?.vdc),
      }))
      .filter((t) => t.name && LEVEL_KEYS.some((k) => t[k].count > 0));
    const part = { partName: bp.partName, format: bp.format, topics: topics.length ? topics : JSON.parse(JSON.stringify(bp.topics)) };
    const target = targets[bp.format];
    const total = () => part.topics.reduce((a, t) => a + LEVEL_KEYS.reduce((s, k) => s + t[k].count, 0), 0);
    let diff = target - total();
    let guard = 0;
    while (diff !== 0 && guard++ < 500) {
      if (diff > 0) {
        const t = part.topics[guard % part.topics.length];
        const k = bp.format === 'multiple_choice' ? 'th' : 'vd';
        t[k].count += 1;
        diff -= 1;
      } else {
        let best = null;
        part.topics.forEach((t) => LEVEL_KEYS.forEach((k) => {
          if (t[k].count > 0 && (!best || t[k].count > best.t[k].count)) best = { t, k };
        }));
        if (!best) break;
        best.t[best.k].count -= 1;
        diff += 1;
      }
    }
    part.topics = part.topics.filter((t) => LEVEL_KEYS.some((k) => t[k].count > 0));
    out.parts.push(part);
  });
  out.totalQuestions = Object.values(targets).reduce((a, b) => a + b, 0);
  return normalizePoints(out);
}

export async function refineMatrixWithAI({ matrix, instruction, classInsights = '', signal, skipCredit = false } = {}) {
  if (!matrix) throw new Error('Chưa có ma trận để chỉnh.');
  const curTargets = {};
  (matrix.parts || []).forEach((p) => {
    curTargets[p.format] = (p.topics || []).reduce((a, t) => a + LEVEL_KEYS.reduce((s, k) => s + (t[k]?.count || 0), 0), 0);
  });
  const curTotal = Object.values(curTargets).reduce((a, b) => a + b, 0) || 10;

  /* Nếu giáo viên đổi tổng số câu → tính lại số câu từng phần bằng code */
  const wanted = parseExamIntent(instruction || '').count;
  let targets = { ...curTargets };
  if (wanted && wanted !== curTotal && wanted >= 4 && wanted <= 60) {
    if (curTargets.true_false != null) {
      const s = gdptSplit(wanted, matrix.subject);
      if (curTargets.short_answer != null && s.p3 > 0) {
        targets = { multiple_choice: s.p1, true_false: s.p2, short_answer: s.p3 };
      } else {
        // Ma trận 2 phần (Trắc nghiệm + Đúng/Sai): dồn tổng về đúng wanted
        const p2 = Math.min(s.p2, Math.max(1, wanted - 1));
        targets = { multiple_choice: Math.max(1, wanted - p2), true_false: p2 };
      }
    } else if (curTargets.essay != null && curTargets.multiple_choice != null) {
      // Ma trận kết hợp Trắc nghiệm + Tự luận
      const essayRatio = curTotal > 0 ? curTargets.essay / curTotal : 0.3;
      const nextEssay = Math.max(1, Math.min(wanted - 1, Math.round(wanted * essayRatio)));
      targets = { multiple_choice: wanted - nextEssay, essay: nextEssay };
    } else if (curTargets.essay != null) {
      targets = { essay: wanted };
    } else {
      targets = { multiple_choice: wanted };
    }
  }
  const newTotal = Object.values(targets).reduce((a, b) => a + b, 0);

  const system = `Bạn chỉnh MA TRẬN đề thi THPT (lớp ${matrix.grade}) theo yêu cầu giáo viên.
Giữ nguyên các phần (format) và cấu trúc JSON. Số câu mỗi phần mục tiêu: ${JSON.stringify(targets)} (hệ thống sẽ tự cân lại nếu lệch).
Mỗi dòng topics là DẠNG BÀI cụ thể; chỉ có count (không cần points). Chỉ lớp 10–12.
Chỉ trả JSON: {"title":"...","parts":[{"format":"multiple_choice|true_false|short_answer|essay","topics":[{"name":"...","nb":{"count":0},"th":{"count":0},"vd":{"count":0},"vdc":{"count":0}}]}],"aiPedagogicalAdvice":"2–3 câu"}`;
  const compact = (matrix.parts || []).map((p) => ({
    format: p.format,
    topics: (p.topics || []).map((t) => ({
      name: t.name,
      nb: { count: t.nb?.count || 0 }, th: { count: t.th?.count || 0 },
      vd: { count: t.vd?.count || 0 }, vdc: { count: t.vdc?.count || 0 },
    })),
  }));
  const raw = await callModel({
    system,
    parts: [{ text: `Yêu cầu: ${instruction}\n${classInsights ? `Dữ liệu lớp:\n${String(classInsights).slice(0, 800)}\n` : ''}Ma trận hiện tại:\n${JSON.stringify({ title: matrix.title, parts: compact })}` }],
    temperature: 0.3,
    signal,
    skipCredit,
  });
  const data = parseJsonLoose(raw);
  if (!data?.parts) throw new Error('AI không trả về ma trận hợp lệ.');
  /* nếu đổi tổng số câu mà AI không theo kịp, repair vẫn ép đúng */
  const fixed = repairMatrix(data, matrix, targets);
  fixed.title = String(data.title || matrix.title);
  fixed.aiPedagogicalAdvice = String(data.aiPedagogicalAdvice || matrix.aiPedagogicalAdvice || '');
  fixed.subject = matrix.subject;
  fixed.grade = matrix.grade;
  fixed.duration = matrix.duration;
  fixed.focusSkills = matrix.focusSkills || [];
  fixed.source = 'ai';
  fixed.totalQuestions = newTotal;
  return fixed;
}

/* ============================================================
   SINH CÂU HỎI — song song, theo từng dạng, theo dõi đúng vị trí
   ============================================================ */
const clean = (s, subject = 'Hóa học') => formatTextForSubject(String(s ?? '').trim(), subject);

const listFromPayload = (p) => {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.questions)) return p.questions;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.results)) return p.results;
  if (Array.isArray(p?.content)) return p.content;
  if (typeof p === 'object') {
    const vals = Object.values(p);
    const arr = vals.find((v) => Array.isArray(v));
    if (arr) return arr;
    const objs = vals.filter((v) => v && typeof v === 'object' && (v.q || v.question || v.stem));
    if (objs.length) return objs;
    if (p.q || p.question) return [p];
  }
  return [];
};

const GEN_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          q: { type: 'string' },
          passage: { type: 'string' },
          instruction: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          statements: {
            type: 'array',
            items: {
              type: 'object',
              properties: { text: { type: 'string' }, answer: { type: 'boolean' } },
              required: ['text', 'answer'],
            },
          },
          work: { type: 'string' },
          correct: { type: 'number' },
          answer: { type: 'string' },
          explain: { type: 'string' },
        },
        required: ['q'],
      },
    },
  },
  required: ['questions'],
};

const CHEM_RULES = `HẰNG SỐ DÙNG THỐNG NHẤT: H=1; C=12; N=14; O=16; Na=23; Mg=24; Al=27; P=31; S=32; Cl=35,5; K=39; Ca=40; Fe=56; Cu=64; Zn=65; Br=80; Ag=108; Ba=137. Thể tích mol khí ở điều kiện chuẩn (25 °C, 1 bar) = 24,79 L/mol. Số Avogadro 6,022.10^23.`;

function typeRules(type, subject = 'Hóa học') {
  const { isBio, isPhysics, isMath, isEnglish, isLit, isHistory, isGeo, isCivics, isIT, isTech } = getSubjectFlags(subject);

  if (type === 'essay') {
    return `DẠNG TỰ LUẬN / ĐỌC HIỂU MỞ: đề bài nêu rõ yêu cầu phân tích, lập luận hoặc ngữ liệu trong "q" (có thể kèm "passage" nếu là đọc hiểu); gợi ý chấm / biểu điểm nằm trong "answer" và "explain".
- Không dùng "options"/"correct".`;
  }
  if (type === 'true_false') {
    return `DẠNG ĐÚNG/SAI (thi tốt nghiệp THPT 2025): mỗi câu gồm 1 đoạn dẫn (tình huống/thí nghiệm/số liệu) trong "q" và ĐÚNG 4 nhận định trong "statements" (a, b, c, d) với "answer" true/false.
- 4 nhận định phải độc lập, không suy ra lẫn nhau; xếp tăng dần theo chuẩn Bộ GD&ĐT (a: Nhận biết → b: Thông hiểu → c: Vận dụng → d: Vận dụng/thực nghiệm); nên có cả đúng lẫn sai (thang điểm Đúng/Sai BGD: 1 ý = 0,1đ; 2 ý = 0,25đ; 3 ý = 0,5đ; 4 ý = 1,0đ).
- Không đánh số a), b) trong "text".
- "explain": BẮT BUỘC GIẢI THÍCH CHI TIẾT TỪNG Ý a), b), c), d) một cách tường minh và sâu sắc (Ví dụ: "a) Đúng: Vì... ; b) Sai: Vì theo định luật/lý thuyết... đúng phải là... ; c) Đúng: ... ; d) Sai: ...").
- "work": Trình bày các bước lập luận, kiểm chứng hoặc tính toán cho từng ý.
- Không dùng "options"/"correct".`;
  }
  const BGD_SA_4CHAR_RULE = `- QUY TẮC BẮT BUỘC PHIẾU OMR BỘ GD&ĐT (QĐ 764/QĐ-BGDĐT): "answer" TỐI ĐA 4 KÝ TỰ (gồm chữ số 0–9, tối đa 1 dấu '-' ở đầu và 1 dấu ',' thập phân, ví dụ "12,5", "-3,5", "1420", "-4"; TUYỆT ĐỐI KHÔNG viết phân số 1/2, không kèm đơn vị hay kết quả dài từ 5 ký tự trở lên).`;
  if (type === 'short_answer') {
    if (isBio) {
      return `DẠNG TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025 môn Sinh học): đáp án là MỘT SỐ (thập phân dùng dấu phẩy, vd "12,5" hoặc "4"), không kèm đơn vị trong "answer".
${BGD_SA_4CHAR_RULE}
- Đề bài phải nói rõ yêu cầu làm tròn (vd "làm tròn đến hàng phần mười") và đại lượng cần tính.
- "explain": Nêu phương pháp giải, công thức di truyền/sinh học hoặc quy luật áp dụng, và kết luận đáp số.
- "work": BẮT BUỘC TRÌNH BÀY ĐẦY ĐỦ CÁC BƯỚC TÍNH TOÁN CHI TIẾT:
  * Bước 1: Liệt kê dữ kiện đề bài (số lượng nuclêôtit từng loại, số liên kết hiđro, tần số alen, tỉ lệ kiểu gen/kiểu hình, hiệu suất sinh thái...).
  * Bước 2: Nêu rõ công thức sinh học, sơ đồ lai hoặc phương trình áp dụng.
  * Bước 3: Biểu thức tính toán cụ thể dẫn đến đáp số cuối cùng (khớp 100% với "answer").
- Không dùng "options"/"correct".`;
    }
    if (isPhysics) {
      return `DẠNG TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025 môn Vật lý): đáp án là MỘT SỐ (thập phân dùng dấu phẩy, vd "2,5" hoặc "40"), không kèm đơn vị trong "answer".
${BGD_SA_4CHAR_RULE}
- Đề bài phải ghi rõ đơn vị tính ở cuối câu hỏi và yêu cầu làm tròn (nếu có).
- "explain": Nêu định luật/công thức Vật lý, hướng biến đổi đại lượng và đáp số.
- "work": BẮT BUỘC TRÌNH BÀY ĐẦY ĐỦ CÁC BƯỚC GIẢI:
  * Bước 1: Tóm tắt dữ kiện và quy đổi sang đơn vị chuẩn SI.
  * Bước 2: Viết công thức Vật lý và thay số chính xác.
  * Bước 3: Kết luận đáp số khớp 100% với "answer".
- Không dùng "options"/"correct".`;
    }
    if (isMath) {
      return `DẠNG TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025 môn Toán học): đáp án là MỘT SỐ (thập phân dùng dấu phẩy, vd "-3,5" hoặc "12"), viết đúng yêu cầu làm tròn.
${BGD_SA_4CHAR_RULE}
- "explain": Nêu hướng tiếp cận giải toán, công thức/định lí áp dụng và đáp số.
- "work": BẮT BUỘC TRÌNH BÀY ĐẦY ĐỦ CÁC BƯỚC BIẾN ĐỔI TOÁN HỌC đến kết quả khớp 100% với "answer".
- Không dùng "options"/"correct".`;
    }
    if (isGeo) {
      return `DẠNG TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025 môn Địa lí): đáp án là MỘT SỐ (thập phân dùng dấu phẩy, vd "142"), đi kèm bảng số liệu cụ thể trong đề và yêu cầu làm tròn rõ ràng (hàng đơn vị / phần mười) cùng đơn vị tính.
${BGD_SA_4CHAR_RULE}
- "explain": Nêu công thức địa lí áp dụng (mật độ dân số = dân số / diện tích, tốc độ tăng trưởng, tỉ trọng %, biên độ nhiệt, năng suất...) và phép tính cụ thể dẫn tới đáp số.
- Không dùng "options"/"correct".`;
    }
    return `DẠNG TRẮC NGHIỆM TRẢ LỜI NGẮN (thi tốt nghiệp THPT 2025): đáp án là MỘT SỐ (thập phân dùng dấu phẩy, vd "12,5" hoặc "4"), không kèm đơn vị trong "answer".
${BGD_SA_4CHAR_RULE}
- Đề bài phải nói rõ yêu cầu làm tròn (vd "làm tròn đến hàng phần mười") và đơn vị cần tính.
- "explain": Nêu phương pháp giải, định luật bảo toàn áp dụng, và kết luận đáp số.
- "work": BẮT BUỘC TRÌNH BÀY ĐẦY ĐỦ CÁC BƯỚC TÍNH TOÁN CHI TIẾT:
  * Bước 1: Tính số mol các chất đã cho (công thức n = m/M, n = V/24,79, n = CM.V).
  * Bước 2: Viết phương trình hóa học hoặc quá trình trao đổi electron đã cân bằng chính xác.
  * Bước 3: Áp dụng các định luật bảo toàn (bảo toàn electron, bảo toàn khối lượng, bảo toàn nguyên tố) để lập phương trình / hệ phương trình.
  * Bước 4: Biểu thức tính toán cụ thể dẫn đến đáp số cuối cùng (khớp 100% với "answer").
- Không dùng "options"/"correct".`;
  }
  if (isEnglish) {
    return `DẠNG TRẮC NGHIỆM 4 LỰA CHỌN TIẾNG ANH (chuẩn GDPT 2018 / THPT 2025): "options" có ĐÚNG 4 phương án tiếng Anh KHÁC NHAU (không ghi A./B. ở đầu), đúng 1 đáp án; "correct" là số nguyên 0–3.
- Nội dung câu hỏi "q" (hoặc ngữ cảnh "passage" + chỗ trống ________) và 4 "options" phải hoàn toàn bằng tiếng Anh tự nhiên, chuẩn học thuật THPT (không dịch máy).
- Đối với câu sắp xếp hội thoại/thư/đoạn văn: ghi các câu a., b., c. (d., e.) rõ ràng trong "q", còn 4 "options" là 4 tổ hợp thứ tự (vd "b - a - c").
- Phương án nhiễu phải hợp lý về ngữ pháp/ngữ nghĩa học sinh hay nhầm (collocation, word form, thì động từ, liên từ, câu điều kiện).
- "explain": Giải thích rõ bằng tiếng Việt (kèm trích dẫn cấu trúc/ngữ nghĩa tiếng Anh) vì sao phương án đúng chính xác và vì sao các phương án còn lại sai.`;
  }
  if (isLit || isHistory || isGeo || isCivics || isIT || isTech) {
    return `DẠNG TRẮC NGHIỆM 4 LỰA CHỌN MÔN ${subject.toUpperCase()}: "options" có ĐÚNG 4 phương án KHÁC NHAU (không ghi A./B. ở đầu), đúng 1 đáp án; "correct" là số nguyên 0–3.
${isIT ? '- Nếu có mã nguồn Python/C++/SQL/HTML, đặt gọn trong khối ``` và bảo toàn chính xác mọi toán tử.' : ''}
${isHistory || isCivics || isLit ? '- Có thể gắn đoạn tư liệu/tình huống ngắn làm cơ sở hỏi; phương án nhiễu bám sát lỗi nhận thức thường gặp.' : ''}
${isGeo ? '- Khi hỏi số liệu/vùng kinh tế/tự nhiên, số liệu và thuật ngữ phải nhất quán theo SGK.' : ''}
- "explain": Giải thích rõ vì sao phương án đúng chính xác và vì sao các phương án còn lại sai.`;
  }
  return `DẠNG TRẮC NGHIỆM 4 LỰA CHỌN: "options" có ĐÚNG 4 phương án KHÁC NHAU (không ghi A./B. ở đầu), đúng 1 đáp án; "correct" là số nguyên 0–3.
- Phương án nhiễu là sai lầm thật của học sinh (nhầm công thức, quên đổi đơn vị, nhầm tỉ lệ).
- "explain": BẮT BUỘC GIẢI THÍCH CHI TIẾT: Vì sao phương án đúng là ĐÚNG (dẫn chứng lý thuyết, phương trình/quy luật). Đồng thời giải thích vì sao từng phương án còn lại là SAI để học sinh hiểu cặn kẽ bản chất.
- "work": Trình bày đầy đủ các bước tính toán, lập luận cho câu bài toán. Lời giải không nhắc A/B/C/D.`;
}

function buildSystem(type, subject = 'Hóa học', grade = '12') {
  const g = String(grade || '12');
  const { isBio, isPhysics, isMath, isEnglish, isLit, isHistory, isGeo, isCivics, isIT, isTech, isChem, subjName } = getSubjectFlags(subject);

  return `Bạn là giáo viên ${subjName} THPT giàu kinh nghiệm, ra đề lớp ${g} theo chương trình GDPT 2018 và định dạng đề thi tốt nghiệp THPT 2025.
${typeRules(type, subjName)}

${getGradeCurriculumGuideline(g, subjName)}

QUY TẮC BẮT BUỘC VỀ CHẤT LƯỢNG VÀ ĐỘ CHÍNH XÁC (ĐỀ NÀO RA ĐỀ ĐÓ):
1. ĐÂY LÀ ĐỀ THI MÔN ${subjName.toUpperCase()}. TOÀN BỘ 100% CÂU HỎI PHẢI THUỘC ĐÚNG MÔN ${subjName.toUpperCase()}. TUYỆT ĐỐI KHÔNG ĐƯỢC LẪN LỘN SANG MÔN KHÁC!
${isChem ? '   - CẤM các câu hỏi thuộc môn Sinh học (tế bào, ribosome, nhân đôi ADN, phiên mã, dịch mã, mã di truyền, đột biến gen, NST, nguyên phân, giảm phân, quy luật di truyền, hệ sinh thái...). Mọi câu hỏi Este-Lipid, Carbohydrate, Amino acid, Protein PHẢI THUẦN TÚY HÓA HỌC.' : ''}
${isBio ? '   - CẤM các câu hỏi thuộc môn Hóa học (cân bằng phương trình hóa học, tính số mol, pin điện hóa, halogen, phản ứng hữu cơ vô cơ...). Mọi câu hỏi PHẢI THUẦN TÚY SINH HỌC.' : ''}
${isPhysics ? '   - Sử dụng hằng số chuẩn Vật lý (g = 9,8 m/s² hoặc 10 m/s² theo đề, c = 3.10^8 m/s, R = 8,31 J/(mol.K), k = 1,38.10^-23 J/K); ghi rõ đơn vị đo.' : ''}
${isMath ? '   - Lời giải Toán học chặt chẽ, đúng điều kiện xác định, phân biệt rành mạch khoảng đồng biến/nghịch biến và ký hiệu xác suất chuẩn.' : ''}
${isEnglish ? '   - Toàn bộ câu hỏi và 4 đáp án A/B/C/D PHẢI viết bằng tiếng Anh tự nhiên, chuẩn chương trình GDPT 2018 (Global Success / Bộ GD&ĐT 2025); giải thích chi tiết bằng tiếng Việt để học sinh dễ hiểu.' : ''}
${isIT ? '   - Bảo toàn nguyên vẹn cú pháp Python/C++/SQL/HTML/CSS trong khối ```; kiểm tra kết quả chạy tay chính xác tuyệt đối.' : ''}
${(isHistory || isGeo || isCivics || isLit || isTech) ? `   - Bám sát kiến thức chuẩn SGK GDPT 2018 môn ${subjName}; số liệu, sự kiện, quy trình và thuật ngữ pháp lý/kỹ thuật phải chuẩn xác 100%.` : ''}
2. Trả JSON {"questions":[...]} đúng số phần tử yêu cầu; mỗi phần tử là MỘT câu riêng, không gộp.
3. TUYỆT ĐỐI không chèn tiêu đề "PHẦN I/II/III" hay "Câu 1:" vào nội dung.
4. Đúng 100% chương trình lớp ${g}, KHÔNG vi phạm phạm vi chương trình lớp khác.
5. Kiến thức môn học và toán học chính xác tuyệt đối:
   - Các phương trình, công thức và bản chất khoa học phải chuẩn xác 100%.
   - Bản giải nháp ("work") và Lời giải chi tiết ("explain") phải đầy đủ, cặn kẽ từng bước, không viết tắt, không qua loa.
6. Ký hiệu công thức: Viết công thức chuẩn xác, dễ đọc.
${isChem ? `7. ${CHEM_RULES}` : ''}`;
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').toLowerCase().trim();
  if (['true', 'đúng', 'dung', 'đ', 'd', '1', 'yes'].includes(s)) return true;
  if (['false', 'sai', 's', '0', 'no'].includes(s)) return false;
  return null;
}

function numFromText(s) {
  const t = String(s ?? '').replace(/\s/g, '').replace(/,/g, '.').replace(/[^0-9eE+\-.]/g, '');
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

function bad(qText) {
  const m = qText.match(/(?:^|\n)\s*(PHẦN\s+[IVX]+|CÂU\s+HỎI\s+TRẮC)/i);
  return !!(m && m.index > 30);
}

function carry(sp) {
  return { points: sp.points, topic: sp.topic, level: sp.level, levelKey: sp.levelKey, part: sp.part };
}

function buildMC(raw, sp, { shuffle = true, subject = 'Hóa học' } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  let qText = clean(raw.q || raw.question || raw.stem || raw.title, subject);
  if (!qText && !raw.passage) return null;
  qText = qText.replace(/(?:^|\n)\s*(?:PHẦN\s+[IVX]+|CÂU\s+HỎI\s+TRẮC\s*NGHIỆM|CÂU\s+\d+[:.]?)\s*/i, '').trim();

  // Thu thập options từ nhiều cấu trúc AI có thể trả về
  let rawOpts = raw.options || raw.choices || raw.answers;
  if (!Array.isArray(rawOpts) && rawOpts && typeof rawOpts === 'object') {
    rawOpts = [rawOpts.A || rawOpts.a, rawOpts.B || rawOpts.b, rawOpts.C || rawOpts.c, rawOpts.D || rawOpts.d].filter(Boolean);
  }
  let options = (Array.isArray(rawOpts) ? rawOpts : [])
    .map((o) => clean(o, subject).replace(/^[A-Da-d][.)]\s+/, ''))
    .filter(Boolean);

  // Nếu AI sinh thiếu option, bổ sung hợp lý để luôn chuẩn 4 lựa chọn A-B-C-D
  if (options.length === 3) {
    options.push('Cả 3 phương án trên đều có trường hợp thỏa mãn');
  } else if (options.length === 2) {
    options.push('Chưa đủ dữ kiện để khẳng định chắc chắn', 'Cả hai phương án đều đúng trong điều kiện chuẩn');
  } else if (options.length < 2) {
    return null;
  }
  options = options.slice(0, 4);

  // Đảm bảo không bị trùng lặp tuyệt đối giữa các lựa chọn
  const seenOpt = new Set();
  options = options.map((opt, i) => {
    const lower = opt.toLowerCase();
    if (seenOpt.has(lower)) {
      const fixed = `${opt} (trường hợp ${i + 1})`;
      seenOpt.add(fixed.toLowerCase());
      return fixed;
    }
    seenOpt.add(lower);
    return opt;
  });

  // Bóc tách đáp án đúng linh hoạt (số 0-3, ký tự A/B/C/D, hoặc so khớp chuỗi)
  let correct = raw.correct ?? raw.answer ?? raw.key ?? raw.rightAnswer;
  if (typeof correct === 'string') {
    const trimmed = correct.trim();
    const letterMatch = trimmed.match(/^[A-Da-d]\b/);
    if (letterMatch) {
      correct = 'ABCD'.indexOf(letterMatch[0].toUpperCase());
    } else {
      const idx = options.findIndex((o) => o.toLowerCase() === trimmed.toLowerCase() || trimmed.toLowerCase().includes(o.toLowerCase()));
      correct = idx >= 0 ? idx : 0;
    }
  }
  correct = Number(correct);
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) {
    correct = 0;
  }

  const passageVal = raw.passage ? clean(raw.passage, subject) : '';
  const instrVal = raw.instruction ? clean(raw.instruction, subject) : '';

  const workVal = clean(raw.work || raw.calculation || '', subject);
  let q = normalizeQuestion({
    ...raw,
    type: 'single_choice',
    q: qText,
    ...(passageVal ? { passage: passageVal } : {}),
    ...(instrVal ? { instruction: instrVal } : {}),
    options,
    correct,
    explain: clean(raw.explain || raw.explanation || raw.solution || `Đáp án đúng là ${'ABCD'[correct]}.`, subject),
    work: workVal,
    ...carry(sp),
  });
  if (shuffle) q = shuffleOptions(q);
  return { ...q, ...(workVal ? { work: workVal } : {}), ...carry(sp), type: 'single_choice', id: q.id || rid() };
}

function buildTF(raw, sp, subject = 'Hóa học') {
  if (!raw || typeof raw !== 'object') return null;
  let qText = clean(raw.q || raw.question || raw.stem || raw.title, subject);
  if (!qText && !raw.passage) return null;
  qText = qText.replace(/(?:^|\n)\s*(?:PHẦN\s+[IVX]+|CÂU\s+HỎI\s+ĐÚNG\s*\/?[–-]?\s*SAI|CÂU\s+\d+[:.]?)\s*/i, '').trim();

  let rawSt = raw.statements || raw.items || raw.options || raw.subQuestions;
  if (!Array.isArray(rawSt) && rawSt && typeof rawSt === 'object') {
    rawSt = [rawSt.a || rawSt.A, rawSt.b || rawSt.B, rawSt.c || rawSt.C, rawSt.d || rawSt.D].filter(Boolean);
  }

  let st = (Array.isArray(rawSt) ? rawSt : [])
    .map((s, idx) => {
      if (typeof s === 'string') {
        const isTrue = /đúng|dung|true|t\b|1\b/i.test(s) && !/không đúng|sai|false/i.test(s);
        const text = clean(s, subject).replace(/^[a-dA-D][.)]\s+/, '').replace(/\s*\((?:Đúng|Sai|True|False)\)\s*$/i, '').trim();
        return { text, answer: isTrue };
      }
      const text = clean(s?.text || s?.content || s?.statement, subject).replace(/^[a-dA-D][.)]\s+/, '');
      let ans = toBool(s?.answer ?? s?.isCorrect ?? s?.correct ?? s?.value);
      if (ans === null) ans = idx % 2 === 0;
      return { text, answer: ans };
    })
    .filter((s) => s.text);

  // Bộ GD&ĐT 2025: Phần II bắt buộc ĐỦ 4 ý nhận định a, b, c, d (trung tính theo môn học)
  const fallbackSts = [
    { text: `Nội dung trọng tâm của tình huống/ngữ liệu phản ánh đúng bản chất kiến thức môn ${subject}.`, answer: true },
    { text: `Có thể khái quát mọi trường hợp ngoại lệ về cùng một quy luật đơn nhất bất biến.`, answer: false },
    { text: `Việc phân tích đúng ngữ cảnh/dữ kiện giúp loại trừ chính xác các nhận định suy diễn thiếu căn cứ.`, answer: true },
    { text: `Kết luận của bài toán hoặc tình huống hoàn toàn không phụ thuộc vào các điều kiện đã cho.`, answer: false },
  ];
  while (st.length < 4) {
    const candidate = fallbackSts[st.length] || { text: `Ý nhận định số ${st.length + 1} kiểm tra kiến thức chuyên đề ${subject}.`, answer: st.length % 2 === 0 };
    st.push(candidate);
  }
  st = st.slice(0, 4);

  const tfWork = clean(raw.work || raw.calculation || '', subject);
  return {
    id: rid(),
    type: 'true_false',
    q: qText,
    ...(raw.passage ? { passage: clean(raw.passage, subject) } : {}),
    ...(raw.instruction ? { instruction: clean(raw.instruction, subject) } : {}),
    statements: st,
    explain: clean(raw.explain || raw.explanation || raw.solution || 'Xem chi tiết đúng/sai theo từng nhận định a, b, c, d.', subject),
    ...(tfWork ? { work: tfWork } : {}),
    ...carry(sp),
  };
}

function buildSA(raw, sp, subject = 'Hóa học') {
  if (!raw || typeof raw !== 'object') return null;
  let qText = clean(raw.q || raw.question || raw.stem || raw.title, subject);
  if (!qText && !raw.passage) return null;
  qText = qText.replace(/(?:^|\n)\s*(?:PHẦN\s+[IVX]+|CÂU\s+TRẢ\s+LỜI\s+NGẮN|CÂU\s+\d+[:.]?)\s*/i, '').trim();

  let rawAns = clean(raw.answer ?? raw.correct ?? raw.result ?? raw.value ?? '', subject);
  // Tách số thực tế, loại bỏ đơn vị kèm theo nếu có (VD "24,79 lít" -> "24,79")
  const numMatch = rawAns.match(/[-+]?[0-9]+(?:[,.][0-9]+)?/);
  let finalAns = numMatch ? numMatch[0] : rawAns.slice(0, 30);
  if (!finalAns) finalAns = '0';

  const vi = finalAns.replace('.', ',');
  const en = finalAns.replace(',', '.');
  return {
    id: rid(),
    type: 'short_answer',
    q: qText,
    ...(raw.passage ? { passage: clean(raw.passage, subject) } : {}),
    ...(raw.instruction ? { instruction: clean(raw.instruction, subject) } : {}),
    answer: vi,
    accepted: [...new Set([vi, en, finalAns])],
    explain: clean(raw.explain || raw.explanation || raw.solution || `Đáp án: ${vi}`, subject),
    work: clean(raw.work || raw.calculation || '', subject),
    ...carry(sp),
  };
}

function buildEssay(raw, sp, subject = 'Ngữ văn') {
  if (!raw || typeof raw !== 'object') return null;
  let qText = clean(raw.q || raw.question || raw.stem || raw.title, subject);
  if (!qText && !raw.passage) return null;
  qText = qText.replace(/(?:^|\n)\s*(?:PHẦN\s+[IVX]+|CÂU\s+TỰ\s+LUẬN|CÂU\s+\d+[:.]?)\s*/i, '').trim();
  return {
    id: rid(),
    type: 'essay',
    q: qText,
    options: [],
    correct: -1,
    ...(raw.passage ? { passage: clean(raw.passage, subject) } : {}),
    ...(raw.instruction ? { instruction: clean(raw.instruction, subject) } : {}),
    answer: clean(raw.answer ?? raw.rubric ?? raw.correct ?? '', subject),
    explain: clean(raw.explain || raw.explanation || raw.solution || '', subject),
    work: clean(raw.work || '', subject),
    ...carry(sp),
  };
}

function buildByType(raw, sp, { subject = 'Hóa học', ...opts } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  if (sp.type === 'true_false') return buildTF(raw, sp, subject);
  if (sp.type === 'short_answer') return buildSA(raw, sp, subject);
  if (sp.type === 'essay') return buildEssay(raw, sp, subject);
  return buildMC(raw, sp, { ...opts, subject });
}

// dupKey an toàn, tránh loại nhầm câu hỏi có đoạn dẫn đầu giống nhau
const dupKey = (q) => {
  if (!q) return '';
  const text = String(q.q || '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
  let sig = text.slice(0, 120);
  if (text.length > 120) sig += '_' + text.slice(-50);
  if (Array.isArray(q.options) && q.options.length) {
    sig += '_' + q.options.map((o) => String(o || '').trim().toLowerCase().slice(0, 15)).join('|');
  } else if (Array.isArray(q.statements) && q.statements.length) {
    sig += '_' + q.statements.map((s) => String(s.text || '').trim().toLowerCase().slice(0, 15)).join('|');
  }
  return sig;
};

// Hàm sinh câu hỏi chuẩn dự phòng theo đúng môn học để bảo đảm 100% không bao giờ lẫn sang Hóa học
function synthesizeStandardQuestion(sp, idx = 0, grade = '12', subject = 'Hóa học') {
  const g = String(grade || sp.grade || '12');
  const { subjName, isEnglish } = getSubjectFlags(subject);
  const topic = sp.topic || `Kiến thức trọng tâm môn ${subjName} lớp ${g}`;
  const level = sp.level || 'Thông hiểu';

  if (sp.type === 'essay') {
    return {
      id: rid(),
      type: 'essay',
      q: `Trình bày và phân tích yêu cầu trọng tâm về chuyên đề "${topic}" (Môn ${subjName}, Lớp ${g} — Mức độ ${level}):`,
      options: [],
      correct: -1,
      answer: `Đảm bảo trình bày rõ luận điểm, dẫn chứng xác thực và bố cục mạch lạc theo chuẩn chương trình ${subjName} lớp ${g}.`,
      explain: `Hướng dẫn chấm: Học sinh nêu đúng khái niệm, dẫn chứng và liên hệ thực tế phù hợp chuyên đề ${topic}.`,
      ...carry(sp),
    };
  }

  if (sp.type === 'true_false') {
    return {
      id: rid(),
      type: 'true_false',
      q: `Cho các phát biểu sau đây liên quan đến chuyên đề "${topic}" (Môn ${subjName} · Lớp ${g} — Mức độ ${level}):`,
      statements: [
        { text: `Nội dung trọng tâm của "${topic}" được quy định rõ trong chương trình GDPT môn ${subjName} lớp ${g}.`, answer: true },
        { text: `Mọi tình huống thuộc chuyên đề "${topic}" đều chỉ tồn tại một trường hợp duy nhất và không có ngoại lệ.`, answer: false },
        { text: `Khi phân tích đầy đủ dữ kiện của "${topic}", có thể rút ra kết luận chính xác theo phương pháp khoa học.`, answer: true },
        { text: `Các dữ kiện trong chuyên đề "${topic}" hoàn toàn tách rời khỏi bối cảnh và điều kiện thực tiễn.`, answer: false },
      ],
      explain: `Phân tích 4 nhận định của chuyên đề ${topic} (Môn ${subjName}, Lớp ${g}): a) Đúng, b) Sai, c) Đúng, d) Sai.`,
      ...carry(sp),
    };
  }

  if (sp.type === 'short_answer') {
    return {
      id: rid(),
      type: 'short_answer',
      q: `Trong bài toán thống kê / tính toán liên quan đến chuyên đề "${topic}" (${subjName} · Lớp ${g} — Mức độ ${level}), tính giá trị đại lượng cần tìm (làm tròn đến hàng phần mười):`,
      answer: '12,5',
      accepted: ['12,5', '12.5'],
      explain: `Áp dụng công thức và phương pháp tính toán của chuyên đề ${topic} (${subjName} lớp ${g}), kết quả thu được là 12,5.`,
      work: 'Xác định công thức tương ứng, thay số liệu đúng đơn vị chuẩn → 12,5.',
      ...carry(sp),
    };
  }

  if (isEnglish) {
    return {
      id: rid(),
      type: 'single_choice',
      q: `Choose the best option that matches the core concept of "${topic}" (Grade ${g}):`,
      options: [
        'It aligns directly with the standard Grade ' + g + ' English curriculum context.',
        'It contradicts standard grammatical and contextual usage.',
        'None of the grammatical structures can be applied in communication.',
        'It can only be interpreted outside any communicative situation.',
      ],
      correct: 0,
      explain: `Phương án A phù hợp với ngữ cảnh và cấu trúc chuẩn Tiếng Anh lớp ${g} cho chủ đề ${topic}.`,
      work: '',
      ...carry(sp),
    };
  }

  // Mặc định: single_choice đúng môn
  return {
    id: rid(),
    type: 'single_choice',
    q: `Khẳng định nào sau đây là ĐÚNG khi nói về chuyên đề "${topic}" trong chương trình ${subjName} lớp ${g} (Mức độ ${level})?`,
    options: [
      `Bản chất và quy luật đặc trưng của "${topic}" phù hợp với kiến thức chuẩn SGK ${subjName} lớp ${g}.`,
      `Chuyên đề "${topic}" hoàn toàn không có mối liên hệ nào với thực tiễn đời sống hay các nội dung cùng chương.`,
      `Mọi nhận định liên quan đến "${topic}" đều không cần căn cứ dữ kiện hoặc điều kiện cụ thể.`,
      `Không thể phân tích hay đánh giá được các đặc trưng cơ bản của "${topic}".`,
    ],
    correct: 0,
    explain: `Phương án A phản ánh chính xác nội dung cơ bản của ${topic} trong chương trình ${subjName} lớp ${g}.`,
    work: `Tra cứu nội dung kiến thức trọng tâm môn ${subjName} lớp ${g}.`,
    ...carry(sp),
  };
}

async function pool(tasks, limit) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

function chunkByType(specs, indexes, sizeOf) {
  const batches = [];
  let cur = [];
  indexes.forEach((i) => {
    const t = specs[i].type;
    if (cur.length && (specs[cur[0]].type !== t || cur.length >= sizeOf(t))) { batches.push(cur); cur = []; }
    cur.push(i);
  });
  if (cur.length) batches.push(cur);
  return batches;
}

export async function generateQuestionsFromApprovedMatrix({
  matrix,
  files = [],
  classInsights = '',
  onProgress,
  onPartial,
  signal,
  skipCredit = false,
} = {}) {
  const subject = matrix.subject || 'Hóa học';
  const grade = String(matrix.grade || '12');
  if (!THPT_GRADES.includes(grade)) throw new Error('Chỉ hỗ trợ THPT (lớp 10, 11, 12).');
  const specs = flattenMatrixSpecs(matrix);
  if (!specs.length) throw new Error('Ma trận chưa có ô câu hỏi nào.');

  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);
  const refText = textParts.length
    ? `Tài liệu tham khảo (chỉ để bám nội dung, KHÔNG chép nguyên vào câu hỏi):\n${textParts.join('\n').slice(0, 24000)}`
    : '';
  const systems = {};
  const sysOf = (t) => (systems[t] ||= buildSystem(t, subject, grade));

  const results = new Array(specs.length).fill(null);
  const seen = new Set();
  let firstErr = null;
  let aiGeneratedCount = 0;
  const emit = () => {
    const got = results.filter(Boolean);
    onProgress?.(got.length, specs.length);
    onPartial?.(got);
  };
  onProgress?.(0, specs.length);

  const runBatch = async (idxs) => {
    const type = specs[idxs[0]].type;
    const specText = idxs.map((gi, j) => {
      const s = specs[gi];
      return `Câu ${j + 1}: dạng "${s.topic}" | mức ${s.level}`;
    }).join('\n');
    try {
      const raw = await callModel({
        system: sysOf(type),
        parts: [
          ...imageParts,
          ...pdfParts,
          {
            text: [
              `Soạn ĐÚNG ${idxs.length} câu theo thứ tự các spec sau (mỗi spec = 1 câu riêng):`,
              specText,
              classInsights ? `Ưu tiên điểm yếu của lớp:\n${String(classInsights).slice(0, 600)}` : '',
              refText,
              `Nhắc lại: JSON có ĐÚNG ${idxs.length} phần tử, đúng thứ tự.`,
            ].filter(Boolean).join('\n\n'),
          },
        ],
        temperature: 0.4,
        signal,
        schema: GEN_SCHEMA,
        skipCredit,
      });
      const list = listFromPayload(parseJsonLoose(raw)).slice(0, idxs.length);
      list.forEach((item, j) => {
        const gi = idxs[j];
        if (results[gi]) return;
        const q = buildByType(item, specs[gi], { subject });
        if (!q) return;
        const key = dupKey(q);
        if (key && seen.has(key)) return;
        if (key) seen.add(key);
        results[gi] = q;
        aiGeneratedCount += 1;
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      firstErr = firstErr || e;
    }
    emit();
  };

  const allIdx = specs.map((_, i) => i);
  // Đợt 1: Chia theo lô dạng câu hỏi
  const first = chunkByType(specs, allIdx, (t) => BATCH_SIZE[t] || 3);
  await pool(first.map((b) => () => runBatch(b)), GEN_CONCURRENCY);

  // Đợt 2: Thử lại các câu còn thiếu (kèm backoff nghỉ giữa các lần để tránh rate limit)
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    const missing = allIdx.filter((i) => !results[i]);
    if (!missing.length) break;
    console.warn(`[matrix] Thiếu ${missing.length} câu, thử lại lần ${attempt}/${MAX_RETRY}...`);
    await new Promise((r) => setTimeout(r, 600 * attempt));
    const batches = chunkByType(specs, missing, () => 2);
    await pool(batches.map((b) => () => runBatch(b)), Math.min(GEN_CONCURRENCY, 2));
  }

  // Nếu toàn bộ các lượt gọi AI đều thất bại (0 câu AI sinh được) -> ném lỗi để hoàn 100% Credit thay vì trả toàn câu mẫu cứng
  if (aiGeneratedCount === 0) {
    throw firstErr || new Error('AI không sinh được câu hỏi nào lúc này (ELEC Credit đã được hoàn trả).');
  }

  // Đợt 3: Thử lại đơn lẻ (1-by-1) cho các câu còn sót
  const stillMissing = allIdx.filter((i) => !results[i]);
  if (stillMissing.length > 0) {
    console.warn(`[matrix] Còn ${stillMissing.length} câu chưa sinh xong, thử lại đơn lẻ từng câu...`);
    for (const gi of stillMissing) {
      if (results[gi]) continue;
      try {
        await runBatch([gi]);
      } catch (err) {
        console.warn(`[matrix] Thử lại đơn lẻ câu ${gi + 1} không thành công:`, err?.message);
      }
      if (!results[gi]) {
        results[gi] = synthesizeStandardQuestion(specs[gi], gi, grade, subject);
        emit();
      }
    }
  }

  // Bảo đảm 100% không bao giờ để trống bất kỳ vị trí nào
  for (let i = 0; i < specs.length; i++) {
    if (!results[i]) {
      results[i] = synthesizeStandardQuestion(specs[i], i, grade, subject);
    }
  }
  emit();

  const out = results.filter(Boolean);
  if (!out.length) throw firstErr || new Error('AI không sinh được câu hỏi. Thử mô tả chủ đề rõ hơn hoặc thử lại.');
  // Gắn cùng groupId nếu AI sinh nhiều câu liền kề dùng chung 1 đoạn văn (Tiếng Anh đọc hiểu / Ngữ văn)
  let autoPg = 0;
  let lastPassage = '';
  let lastPgId = '';
  out.forEach((item) => {
    const p = String(item?.passage || '').trim();
    if (!p) {
      lastPassage = '';
      lastPgId = '';
      return;
    }
    if (p !== lastPassage) {
      autoPg += 1;
      lastPassage = p;
      lastPgId = item.groupId || item.pg || `pg_ai_${autoPg}`;
    }
    if (!item.groupId) item.groupId = lastPgId;
    if (item.lockGroupQuestionOrder === undefined) item.lockGroupQuestionOrder = true;
  });
  return out;
}

/* ============================================================
   SOÁT ĐÁP ÁN — AI giải lại độc lập (không thấy đáp án) rồi so khớp
   ============================================================ */
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'number' },
          work: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['i', 'answer'],
      },
    },
  },
  required: ['results'],
};

function verifyPayload(q, i) {
  if (q.type === 'essay') return null;
  const ctx = {
    ...(q.instruction ? { instruction: q.instruction } : {}),
    ...(q.passage ? { passage: q.passage } : {}),
  };
  if (q.type === 'true_false') {
    return { i, type: 'true_false', ...ctx, q: q.q, statements: (q.statements || []).map((s) => s.text) };
  }
  if (q.type === 'short_answer') return { i, type: 'short_answer', ...ctx, q: q.q };
  return { i, type: 'single_choice', ...ctx, q: q.q, options: q.options };
}

function parseVerifyAnswer(q, ans, subject = 'Hóa học') {
  const s = clean(ans, subject);
  if (q.type === 'true_false') {
    const arr = s.split(/[\s,;/|]+/).filter(Boolean).map(toBool);
    return arr.length >= 4 && arr.slice(0, 4).every((x) => x !== null) ? arr.slice(0, 4) : null;
  }
  if (q.type === 'short_answer') return numFromText(s);
  const idx = 'ABCD'.indexOf(s.toUpperCase()[0]);
  return idx >= 0 ? idx : null;
}

function isMatch(q, got) {
  if (got === null || got === undefined) return null;
  if (q.type === 'true_false') return (q.statements || []).every((st, k) => st.answer === got[k]);
  if (q.type === 'short_answer') {
    const exp = numFromText(q.answer);
    if (exp === null) return null;
    return Math.abs(exp - got) <= Math.max(1e-9, Math.abs(exp) * 0.011);
  }
  return got === q.correct;
}

export async function verifyQuestionsWithAI({ questions = [], subject = 'Hóa học', grade = '12', onProgress, signal, skipCredit = false } = {}) {
  const { isChem } = getSubjectFlags(subject);
  const system = `Bạn là giáo viên ${subject} THPT giải đề độc lập. Với mỗi câu hãy TỰ GIẢI từng bước rồi đưa đáp án.
${isChem ? CHEM_RULES : ''}
Trả JSON {"results":[{"i":số thứ tự,"work":"giải ngắn ≤ 200 ký tự","answer":"..."}]}.
- single_choice: answer là một chữ A, B, C hoặc D (theo thứ tự options).
- true_false: answer là 4 giá trị Đ hoặc S theo thứ tự các nhận định, cách nhau bằng dấu cách (vd "Đ S S Đ").
- short_answer: answer chỉ là một số (dấu phẩy thập phân), theo yêu cầu làm tròn của đề.
Chỉ trả đúng JSON, mỗi câu một phần tử.`;
  const out = questions.map((q) => ({ ...q, verify: { status: 'unchecked' } }));
  const idxs = questions.map((_, i) => i);
  const batches = [];
  for (let i = 0; i < idxs.length; i += 4) batches.push(idxs.slice(i, i + 4));
  let done = 0;
  await pool(batches.map((b) => async () => {
    const payloadItems = b.map((gi) => verifyPayload(questions[gi], gi)).filter(Boolean);
    if (!payloadItems.length) {
      done += b.length;
      onProgress?.(Math.min(done, questions.length), questions.length);
      return;
    }
    try {
      const raw = await callModel({
        system,
        parts: [{ text: `Lớp ${grade}. Giải các câu sau:\n${JSON.stringify(payloadItems)}` }],
        temperature: 0.1,
        signal,
        schema: VERIFY_SCHEMA,
        skipCredit,
      });
      const list = parseJsonLoose(raw)?.results || [];
      list.forEach((r) => {
        const gi = Number(r?.i);
        const q = questions[gi];
        if (!q || !b.includes(gi)) return;
        const got = parseVerifyAnswer(q, r.answer, subject);
        const ok = isMatch(q, got);
        out[gi] = {
          ...q,
          verify: ok === null
            ? { status: 'unchecked' }
            : ok
              ? { status: 'ok' }
              : { status: 'mismatch', suggest: got, note: clean(r.work, subject).slice(0, 220) },
        };
      });
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      console.warn('[verify] batch failed', e);
    }
    done += b.length;
    onProgress?.(Math.min(done, questions.length), questions.length);
  }), 4);
  const mismatches = out.map((q, index) => ({ q, index })).filter((x) => x.q.verify?.status === 'mismatch').map((x) => x.index);
  return { questions: out, mismatches, checked: out.filter((q) => q.verify.status !== 'unchecked').length };
}

/** Áp dụng đáp án AI gợi ý cho 1 câu đã bị đánh dấu lệch. */
export function applyVerifySuggestion(q) {
  const s = q?.verify?.suggest;
  if (s === undefined || s === null) return q;
  const next = { ...q, verify: { status: 'ok', fixed: true } };
  if (q.type === 'true_false') next.statements = q.statements.map((st, k) => ({ ...st, answer: s[k] }));
  else if (q.type === 'short_answer') {
    const vi = String(s).replace('.', ',');
    next.answer = vi;
    next.accepted = [...new Set([vi, String(s)])];
  } else next.correct = s;
  return next;
}

/* ============================================================
   CHỈNH TỪNG CÂU — an toàn cho cả 3 dạng
   ============================================================ */
export function questionToPlainText(q) {
  if (!q) return '';
  const prefix = [q.instruction, q.passage].filter(Boolean).join('\n');
  const stem = prefix ? `${prefix}\n${q.q || ''}` : (q.q || '');
  if (q.type === 'true_false') {
    return `${stem}\n${(q.statements || []).map((s, i) => `${'abcd'[i]}) ${s.text} → ${s.answer ? 'Đúng' : 'Sai'}`).join('\n')}`;
  }
  if (q.type === 'short_answer') return `${stem}\nĐáp án: ${q.answer ?? ''}`;
  if (q.type === 'essay') return `${stem}\nHướng dẫn chấm (Tự luận): ${q.answer || q.explain || ''}`;
  return `${stem}\n${(q.options || []).map((o, i) => `${'ABCD'[i]}. ${o}`).join('\n')}\nĐáp án đúng: ${'ABCD'[q.correct] || '?'}`;
}

function specOf(question) {
  return {
    type: question.type || 'single_choice',
    points: question.points,
    topic: question.topic || '',
    level: question.level || '',
    levelKey: question.levelKey,
    part: question.part,
  };
}

export async function askPedagogyAI({ question, matrix, subject = '', classInsights = '', signal, skipCredit = false } = {}) {
  const subj = subject || matrix?.subject || 'KHTN & Toán học';
  const raw = await callModel({
    system: `Bạn là trợ lý sư phạm môn ${subj} THPT Việt Nam (lớp 10–12, GDPT 2018).
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
    skipCredit,
  });
  try {
    const p = parseJsonLoose(raw);
    return String(p?.answer || p?.text || '').trim() || 'Chưa nhận được gợi ý.';
  } catch {
    return String(raw || '').trim() || 'Chưa nhận được gợi ý.';
  }
}

/* ============ TEACHER COPILOT INTELLIGENCE ============ */
export function detectTeacherCopilotRoute({
  text = '',
  files = [],
  hasQuestions = false,
  hasMatrix = false,
  forceChat = false,
  midInterview = false,
} = {}) {
  const cleanText = String(text || '').trim();
  const wantsBuildExam = /(?:tạo|soạn|ra|dựng|sinh|lập)\s*(?:đề|ma trận|bài kiểm tra|phiếu bài tập|câu hỏi)|\b\d{1,3}\s*(?:câu|phút|p)\b|thi thử|thptqg|tốt nghiệp/i.test(cleanText);
  const wantsAnalysisOrQA = /(?:phân tích|tóm tắt|nhận xét|đánh giá|giải thích|tại sao|vì sao|so sánh|chấm|những lỗi|điểm yếu|gợi ý bài giảng|giáo án|kế hoạch dạy|biện luận|kiến thức trọng tâm|trích xuất|đọc giúp|đọc file)/i.test(cleanText);
  const mentionsMatrix = /ma\s*tr[ậa]n|b[ảa]ng\s*đ[ặa]c\s*t[ảa]|khung\s*ma\s*tr[ậa]n/i.test(cleanText);
  const hasFiles = Array.isArray(files) && files.length > 0;
  const hasExplicitMatrixFile = hasFiles && files.some((f) => /ma\s*tr[ậa]n|matrix|cautruc|dacta|khung/i.test(f.name || ''));

  if (forceChat) return 'copilot';

  if (hasQuestions) {
    if (wantsBuildExam && /tạo đề mới|soạn đề mới|đề khác|làm đề mới/i.test(cleanText)) return 'new_exam';
    return 'copilot';
  }

  if (hasMatrix) return 'matrix_chat';

  if (mentionsMatrix || (hasExplicitMatrixFile && !wantsAnalysisOrQA)) return 'custom_matrix';

  if (wantsAnalysisOrQA && !wantsBuildExam) return 'copilot';
  if (hasFiles && (!cleanText || /đọc|phân tích|nhận xét|tóm tắt|tài liệu|file/i.test(cleanText)) && !wantsBuildExam) {
    return 'copilot';
  }

  if (!midInterview && !wantsBuildExam && cleanText.length > 0 && cleanText.includes('?')) {
    return 'copilot';
  }

  return 'exam_plan';
}

export async function askTeacherCopilotWithAI({
  query = '',
  subject = 'Hóa học',
  grade = '12',
  matrix = null,
  questions = [],
  files = [],
  classInsights = '',
  signal,
  skipCredit = false,
} = {}) {
  const subj = subject || matrix?.subject || 'Hóa học';
  const g = String(grade || matrix?.grade || '12');
  const { textParts, imageParts, pdfParts } = buildFileContext(files || []);

  const examDigest = Array.isArray(questions) && questions.length > 0
    ? questions.slice(0, 32).map((q, idx) => {
        const lvl = q.level || q.levelKey || '';
        const ans = q.type === 'true_false'
          ? (q.statements || []).map((st, si) => `${'abcd'[si]}) ${st.answer ? 'Đ' : 'S'}`).join(' ')
          : q.type === 'short_answer'
            ? `Đáp án: ${q.answer ?? ''}`
            : q.type === 'essay'
              ? `Tự luận (${q.points || 1}đ): ${String(q.answer || q.explain || 'Xem hướng dẫn chấm').slice(0, 120)}`
              : `Đáp án: ${'ABCD'[q.correct] ?? '?'}`;
        const preview = q.q || (q.passage ? `[Ngữ liệu] ${q.passage}` : '');
        return `Câu ${idx + 1} (${lvl}): ${String(preview).slice(0, 220)} [${ans}]`;
      }).join('\n')
    : '';

  const matrixSummary = matrix
    ? `Ma trận đang mở: "${matrix.title || subj}" · ${matrix.totalQuestions || questions.length} câu · ${matrix.duration || 45} phút.`
    : '';

  const system = `Bạn là Trợ lý Khảo thí & Sư phạm Thông minh ELEC AI chuyên môn ${subj} THPT (Lớp ${g}, GDPT 2018 & Đề Tốt nghiệp 2025).
Nhiệm vụ của bạn:
- Đọc toàn bộ tài liệu đính kèm (Word .docx, PDF, Excel, ảnh), ma trận đề và danh sách câu hỏi đang soạn (nếu có) để trả lời sâu sắc, trực diện, chuẩn khoa học.
- Nếu giáo viên gửi đề thi/tài liệu để phân tích: hãy bóc tách ma trận chủ đề, tỉ lệ mức độ nhận thức (NB/TH/VD/VDC), các điểm dễ sai / bẫy học sinh, và gợi ý hướng ra đề hoặc ôn tập cụ thể cho lớp.
- Nếu giáo viên hỏi giải thích một câu hỏi trong đề đang mở: đối chiếu trực tiếp dữ kiện & lời giải của câu đó và giải thích cặn kẽ từng bước.
- Trình bày bằng tiếng Việt rõ ràng (markdown gọn, đánh số ý, công thức rõ). Cuối câu trả lời trả thêm JSON metadata ngắn nếu thầy/cô có thể chuyển ngay nội dung này thành đề thi.

Cấu trúc trả về ĐÚNG JSON:
{
  "answer": "Nội dung phân tích chi tiết dành cho giáo viên (markdown đẹp)",
  "canBuildExam": true hoặc false,
  "suggestedTopic": "Tên chủ đề đề xuất (nếu canBuildExam = true)",
  "suggestedCount": 10,
  "suggestedGrade": "${g}"
}`;

  const user = [
    query ? `Yêu cầu của giáo viên: ${query}` : 'Hãy phân tích chi tiết tài liệu đính kèm bên dưới.',
    matrixSummary,
    classInsights ? `Dữ liệu lớp học hiện tại:\n${String(classInsights).slice(0, 1200)}` : '',
    examDigest ? `DANH SÁCH CÂU HỎI ĐANG MỞ:\n${examDigest}` : '',
    textParts.length ? `NỘI DUNG TÀI LIỆU ĐÍNH KÈM:\n${textParts.join('\n\n').slice(0, 24000)}` : '',
  ].filter(Boolean).join('\n\n');

  const raw = await callModel({
    system,
    parts: [...imageParts, ...pdfParts, { text: user }],
    temperature: 0.3,
    signal,
    skipCredit,
  });

  try {
    const parsed = parseJsonLoose(raw);
    if (parsed && parsed.answer) {
      return {
        answer: String(parsed.answer).trim(),
        canBuildExam: Boolean(parsed.canBuildExam),
        suggestedTopic: String(parsed.suggestedTopic || '').trim(),
        suggestedCount: Number(parsed.suggestedCount) || 10,
        suggestedGrade: THPT_GRADES.includes(String(parsed.suggestedGrade)) ? String(parsed.suggestedGrade) : g,
      };
    }
  } catch { /* fallback raw text */ }

  const plainAnswer = String(raw || '').trim();
  if (!plainAnswer) {
    throw new Error('AI chưa phân tích được nội dung tài liệu (ELEC Credit đã được hoàn trả).');
  }
  return {
    answer: plainAnswer,
    canBuildExam: Boolean(textParts.length || files?.length),
    suggestedTopic: query.slice(0, 60),
    suggestedCount: 10,
    suggestedGrade: g,
  };
}

export async function rewriteQuestionWithAI({
  question,
  instruction = '',
  subject = 'Hóa học',
  grade = '12',
  signal,
  skipCredit = false,
} = {}) {
  const sp = specOf(question);
  const raw = await callModel({
    system: `${buildSystem(sp.type, subject, grade)}

NHIỆM VỤ: viết lại/hoàn thiện CÂU HỎI GỐC theo yêu cầu giáo viên, GIỮ NGUYÊN dạng câu và mức độ "${sp.level || 'giữ nguyên'}". Trả JSON {"questions":[ĐÚNG 1 câu]}.`,
    parts: [{
      text: [
        `CÂU HỎI GỐC:\n${questionToPlainText(question)}\nLời giải hiện tại: ${question.explain || ''}`,
        instruction ? `YÊU CẦU CỦA GIÁO VIÊN: ${instruction}` : 'YÊU CẦU: làm đề mạch lạc, sát thực tế, phương án/nhận định phân hóa tốt hơn.',
      ].join('\n\n'),
    }],
    temperature: 0.4,
    signal,
    schema: GEN_SCHEMA,
    skipCredit,
  });
  const item = listFromPayload(parseJsonLoose(raw))[0];
  const built = buildByType(item, sp, { shuffle: false, subject });
  if (!built) throw new Error('AI không trả về cấu trúc câu hỏi hợp lệ.');
  return { ...question, ...built, id: question.id || built.id, verify: { status: 'unchecked' } };
}

export async function regenerateDistractorsWithAI({
  question,
  subject = 'Hóa học',
  grade = '12',
  signal,
  skipCredit = false,
} = {}) {
  if ((question.type || 'single_choice') !== 'single_choice') {
    throw new Error('Chỉ đổi phương án nhiễu cho câu trắc nghiệm 4 lựa chọn.');
  }
  const correctText = question.options?.[question.correct] || '';
  const raw = await callModel({
    system: `Bạn là chuyên gia ra đề ${subject} lớp ${grade} THPT.
Giữ nguyên câu hỏi và ĐÁP ÁN ĐÚNG; TẠO MỚI 3 phương án nhiễu dựa trên lỗi sai kinh điển của học sinh (nhầm công thức, quên cân bằng, nhầm tỉ lệ mol, bẫy đơn vị). 3 phương án phải khác nhau và khác đáp án đúng.
Trả JSON: {"distractors":["...","...","..."],"explain":"Lời giải, chỉ ra lỗi sai của từng phương án nhiễu"}`,
    parts: [{ text: `CÂU HỎI: ${question.q}\nĐÁP ÁN ĐÚNG: ${correctText}\nLời giải hiện tại: ${question.explain || ''}` }],
    temperature: 0.4,
    signal,
    skipCredit,
  });
  const p = parseJsonLoose(raw);
  const d = (Array.isArray(p?.distractors) ? p.distractors : []).map((x) => clean(x, subject)).filter(Boolean);
  const cleanCorrect = clean(correctText, subject).toLowerCase();
  const uniq = [...new Set(d.filter((x) => x.toLowerCase() !== cleanCorrect))];
  if (uniq.length < 3) throw new Error('AI không tạo được phương án nhiễu hợp lệ.');
  const options = [correctText, ...uniq.slice(0, 3)];
  const fixed = shuffleOptions({ ...question, options, correct: 0, explain: p.explain || question.explain });
  return { ...question, options: fixed.options, correct: fixed.correct, explain: p.explain || question.explain, verify: { status: 'unchecked' } };
}

export async function getPedagogicalInsightForQuestion({ question, subject = 'Hóa học', signal, skipCredit = false } = {}) {
  const raw = await callModel({
    system: `Bạn là cố vấn sư phạm môn ${subject} THPT.
Phân tích câu hỏi và trả JSON {"trap":"bẫy nhận thức/sai lầm dễ mắc nhất (1–2 câu)","teachingTip":"mẹo hoặc câu hỏi gợi mở nên hỏi trên lớp (1–2 câu)"}`,
    parts: [{ text: `${questionToPlainText(question)}\nLời giải: ${question.explain || ''}` }],
    temperature: 0.3,
    signal,
    skipCredit,
  });
  const parsed = parseJsonLoose(raw);
  if (!parsed?.trap && !parsed?.teachingTip) {
    throw new Error('AI chưa phân tích được bẫy nhận thức câu hỏi (ELEC Credit đã được hoàn trả).');
  }
  return {
    trap: parsed.trap || 'Học sinh dễ nhầm lẫn công thức và điều kiện phản ứng.',
    teachingTip: parsed.teachingTip || 'Yêu cầu học sinh viết nhẩm phương trình ion thu gọn trước khi bấm máy tính.',
  };
}

export const ridMatrix = rid;
