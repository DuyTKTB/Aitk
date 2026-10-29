/* ============================================================
   roadmap.js — LỘ TRÌNH KIẾN THỨC (nguồn duy nhất)
   ------------------------------------------------------------
   v3: danh sách chương được SINH TỪ CHEM_TOPICS (data/chemTopics.js)
   thay vì chép tay. Lý do: chemTopics.js là nơi quy định id dùng cho
   cột questions.topic_id. Nếu chép tay, một chương mới thêm vào ngân
   hàng sẽ KHÔNG xuất hiện trong Lộ trình, và câu hỏi của chương đó bị
   bỏ qua âm thầm (đã xảy ra với c12-sustain).

   Ở đây chỉ giữ:
     • DESC  — mô tả ngắn 1 câu (hiển thị ở trang chi tiết)
     • NAME  — tên hiển thị tiếng Việt (nếu muốn khác tên trong ngân hàng)
     • CROSS — điều kiện tiên quyết giữa hai khối (chương đầu khối sau)
   Điều kiện tiên quyết chỉ để GỢI Ý, không khoá quyền học.
   ============================================================ */

import { CHEM_TOPICS } from './chemTopics.js';

const DESC = {
  'c10-atom': 'Thành phần nguyên tử, đồng vị, orbital và cấu hình electron.',
  'c10-periodic': 'Cấu trúc bảng tuần hoàn, quy luật biến đổi tính chất và ý nghĩa vị trí.',
  'c10-bonding': 'Liên kết ion, cộng hoá trị, liên kết hydrogen và tương tác van der Waals.',
  'c10-redox': 'Số oxi hoá, chất khử – chất oxi hoá, cân bằng theo phương pháp electron.',
  'c10-energy': 'Biến thiên enthalpy, phản ứng toả nhiệt – thu nhiệt và ứng dụng.',
  'c10-rate': 'Tốc độ phản ứng, các yếu tố ảnh hưởng và vai trò của xúc tác.',
  'c10-halogen': 'Tính chất vật lí – hoá học, điều chế và ứng dụng của nhóm halogen.',
  'c11-equilibrium': 'Phản ứng thuận nghịch, hằng số cân bằng và nguyên lí chuyển dịch Le Chatelier.',
  'c11-nitrogen': 'Nitrogen, sulfur và hợp chất: tính chất, điều chế, ứng dụng, tác động môi trường.',
  'c11-organic-gen': 'Công thức phân tử, đồng phân, danh pháp và liên kết trong hợp chất hữu cơ.',
  'c11-hydrocarbon': 'Alkane, alkene, alkyne, arene: cấu tạo, tính chất và phản ứng đặc trưng.',
  'c11-alcohol': 'Dẫn xuất halogen, alcohol, phenol: tính chất hoá học và ứng dụng.',
  'c11-carbonyl': 'Aldehyde, ketone, carboxylic acid: tính chất, phản ứng và điều chế.',
  'c12-ester': 'Ester, lipid, phản ứng xà phòng hoá và ứng dụng trong đời sống.',
  'c12-carbohydrate': 'Glucose, fructose, saccharose, tinh bột và cellulose.',
  'c12-amine': 'Amine, amino acid, peptide và protein: tính chất, vai trò.',
  'c12-polymer': 'Khái niệm, phân loại, phản ứng trùng hợp – trùng ngưng, vật liệu polymer.',
  'c12-electro': 'Pin điện hoá, thế điện cực chuẩn, điện phân và ứng dụng công nghiệp.',
  'c12-metal': 'Tính chất chung của kim loại, dãy điện hoá và ăn mòn kim loại.',
  'c12-metal-main': 'Kim loại nhóm IA, IIA, aluminium và hợp chất quan trọng.',
  'c12-transition': 'Kim loại chuyển tiếp, phức chất, sắt và hợp chất của sắt.',
  'c12-sustain': 'Hoá học xanh, năng lượng tái tạo, tái chế và phát triển bền vững.',
};

/* Tên hiển thị gọn cho học sinh; không có trong bảng thì dùng tên ngân hàng */
const NAME = {
  'c10-periodic': 'Bảng tuần hoàn',
  'c11-nitrogen': 'Nitơ và lưu huỳnh',
  'c11-hydrocarbon': 'Hiđrocacbon',
  'c11-alcohol': 'Ancol và phenol',
  'c11-carbonyl': 'Anđehit – axit cacboxylic',
  'c12-ester': 'Este – lipit',
  'c12-carbohydrate': 'Cacbohiđrat',
  'c12-amine': 'Amin, protein',
  'c12-polymer': 'Polime',
  'c12-electro': 'Pin điện & điện phân',
  'c12-metal': 'Đại cương kim loại',
  'c12-metal-main': 'Nhôm & kiềm thổ',
  'c12-transition': 'Sắt & hợp chất',
};

/* Chương đầu của mỗi khối cần kiến thức cuối khối trước (gợi ý) */
const CROSS = {
  'c11-equilibrium': ['c10-rate'],
  'c12-ester': ['c11-carbonyl'],
};

const LEVELS = [
  { key: 'Lớp 10', grade: 10, goal: 'Vững nền tảng: Cấu tạo nguyên tử, bảng tuần hoàn, liên kết và phản ứng.' },
  { key: 'Lớp 11', grade: 11, goal: 'Mở rộng sang cân bằng hóa học, nitơ – lưu huỳnh và hóa hữu cơ.' },
  { key: 'Lớp 12', grade: 12, goal: 'Về đích: Hệ thống kiến thức, luyện đề thi tốt nghiệp THPT Quốc gia.' },
];

const buildChapters = (grade) => {
  const list = CHEM_TOPICS.filter((t) => t.grade === grade);
  return list.map((t, i) => ({
    id: t.id,
    name: NAME[t.id] || t.name,
    desc: DESC[t.id] || '',
    prereq: i > 0 ? [list[i - 1].id] : (CROSS[t.id] || []),
    bank: true,
  }));
};

export const ROADMAP_LEVELS = LEVELS.map((l) => ({ ...l, chapters: buildChapters(l.grade) }))
  .concat([{
    key: 'Đại học',
    grade: 0,
    goal: 'Nâng lên tư duy định lượng: Nhiệt động, động hóa học và hóa phân tích.',
    chapters: [
      { id: null, name: 'Hóa đại cương', bank: false, desc: 'Cấu tạo chất, liên kết, dung dịch và các cân bằng cơ bản ở bậc đại học.', prereq: [] },
      { id: null, name: 'Nhiệt động hóa học', bank: false, desc: 'Nguyên lí nhiệt động, enthalpy, entropy và năng lượng Gibbs.', prereq: [] },
      { id: null, name: 'Động hóa học', bank: false, desc: 'Định luật tốc độ, bậc phản ứng, cơ chế phản ứng và xúc tác.', prereq: [] },
      { id: null, name: 'Cân bằng ion', bank: false, desc: 'Acid – base, pH, dung dịch đệm và cân bằng kết tủa.', prereq: [] },
      { id: null, name: 'Hóa phân tích', bank: false, desc: 'Phân tích định tính, định lượng, chuẩn độ và xử lý số liệu.', prereq: [] },
    ],
  }]);

export const LEVEL_KEYS = ROADMAP_LEVELS.map((l) => l.key);

export const DEFAULT_LEVEL = 'Lớp 11';

export function getLevel(key) {
  return ROADMAP_LEVELS.find((l) => l.key === key) || ROADMAP_LEVELS[1];
}

/* Tìm chương theo topic_id, trả kèm lớp + vị trí để deep link được */
export function findChapter(id) {
  if (!id) return null;
  for (let i = 0; i < ROADMAP_LEVELS.length; i++) {
    const level = ROADMAP_LEVELS[i];
    for (let j = 0; j < level.chapters.length; j++) {
      if (level.chapters[j].id === id) {
        return { level, chapter: level.chapters[j], index: j };
      }
    }
  }
  return null;
}

/* Tên chương theo id (dùng cho nhãn hoạt động gần đây) */
export function chapterName(id) {
  const hit = findChapter(id);
  return hit ? hit.chapter.name : null;
}

/* Ngưỡng coi như "đã nắm" một chương — đồng nhất 80% với MASTERED_SCORE của roadmapEngine */
export const MASTERED_PCT = 80;

export const pctOf = (p) => {
  if (!p || !p.total) return null;
  return Math.round((p.correct / p.total) * 100);
};

/* Chương nên học tiếp: chương đầu tiên (theo thứ tự) chưa đạt ngưỡng */
export function nextChapter(level, progress) {
  const list = level.chapters.filter((c) => c.bank !== false);
  for (let i = 0; i < list.length; i++) {
    const pct = pctOf(progress[list[i].id]);
    if (pct === null || pct < MASTERED_PCT) {
      return { chapter: list[i], index: i, pct };
    }
  }
  return null;
}

/* Số chương đã nắm / tổng số chương có ngân hàng câu hỏi */
export function levelStats(level, progress) {
  const list = level.chapters.filter((c) => c.bank !== false);
  let done = 0;
  let practiced = 0;
  for (let i = 0; i < list.length; i++) {
    const pct = pctOf(progress[list[i].id]);
    if (pct !== null) practiced += 1;
    if (pct !== null && pct >= MASTERED_PCT) done += 1;
  }
  return { done, practiced, total: list.length };
}
