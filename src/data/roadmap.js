/* ============================================================
   roadmap.js — LỘ TRÌNH KIẾN THỨC (nguồn duy nhất)
   ------------------------------------------------------------
   Trước đây lộ trình bị hardcode 2 lần (components/Home.jsx và
   pages/Home.jsx) và chỉ là chuỗi tên → không nối được với ngân
   hàng câu hỏi, sổ lỗi sai hay thống kê.

   Ở đây mỗi chương có `id` LẤY ĐÚNG từ data/chemTopics.js
   (cột questions.topic_id). Nhờ vậy mọi thống kê theo chương
   đều ghép được mà không cần map tên → id ở chỗ khác.

   `bank: false` = chương chưa có ngân hàng câu hỏi (khối Đại học),
   chỉ dùng để xem tóm tắt bằng AI, không có tiến độ.
   ============================================================ */

export const ROADMAP_LEVELS = [
  {
    key: 'Lớp 10',
    goal: 'Vững nền tảng: Cấu tạo nguyên tử, bảng tuần hoàn, liên kết và phản ứng.',
    chapters: [
      { id: 'c10-atom', name: 'Cấu tạo nguyên tử' },
      { id: 'c10-periodic', name: 'Bảng tuần hoàn' },
      { id: 'c10-bonding', name: 'Liên kết hóa học' },
      { id: 'c10-redox', name: 'Phản ứng oxi hóa – khử' },
      { id: 'c10-energy', name: 'Năng lượng hóa học' },
      { id: 'c10-rate', name: 'Tốc độ phản ứng' },
      { id: 'c10-halogen', name: 'Nhóm halogen' },
    ],
  },
  {
    key: 'Lớp 11',
    goal: 'Mở rộng sang cân bằng hóa học, nitơ – lưu huỳnh và hóa hữu cơ.',
    chapters: [
      { id: 'c11-equilibrium', name: 'Cân bằng hóa học' },
      { id: 'c11-nitrogen', name: 'Nitơ và lưu huỳnh' },
      { id: 'c11-organic-gen', name: 'Đại cương hóa hữu cơ' },
      { id: 'c11-hydrocarbon', name: 'Hiđrocacbon' },
      { id: 'c11-alcohol', name: 'Ancol và phenol' },
      { id: 'c11-carbonyl', name: 'Anđehit – axit cacboxylic' },
    ],
  },
  {
    key: 'Lớp 12',
    goal: 'Về đích: Hệ thống kiến thức, luyện đề thi tốt nghiệp THPT Quốc gia.',
    chapters: [
      { id: 'c12-ester', name: 'Este – lipit' },
      { id: 'c12-carbohydrate', name: 'Cacbohiđrat' },
      { id: 'c12-amine', name: 'Amin, protein' },
      { id: 'c12-polymer', name: 'Polime' },
      { id: 'c12-electro', name: 'Pin điện & điện phân' },
      { id: 'c12-metal', name: 'Đại cương kim loại' },
      { id: 'c12-metal-main', name: 'Nhôm & kiềm thổ' },
      { id: 'c12-transition', name: 'Sắt & hợp chất' },
    ],
  },
  {
    key: 'Đại học',
    goal: 'Nâng lên tư duy định lượng: Nhiệt động, động hóa học và hóa phân tích.',
    chapters: [
      { id: null, name: 'Hóa đại cương', bank: false },
      { id: null, name: 'Nhiệt động hóa học', bank: false },
      { id: null, name: 'Động hóa học', bank: false },
      { id: null, name: 'Cân bằng ion', bank: false },
      { id: null, name: 'Hóa phân tích', bank: false },
    ],
  },
];

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

/* Ngưỡng coi như "đã nắm" một chương */
export const MASTERED_PCT = 70;

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
