/* ============================================================
   chemTopics.js — Danh mục chuyên đề Hóa học THPT (CT 2018)
   Lưu vào cột questions.topic_id (kiểu text) trong Supabase.
   Được dùng ở: ExamEditor, QuestionManager, WrongNotebook.
   QUY ƯỚC: có thể đổi tên hiển thị, nhưng KHÔNG đổi id đã gắn
   cho câu hỏi (sẽ làm lệch thống kê).
   ============================================================ */

export const UNCLASSIFIED = '__none';

export const CHEM_TOPICS = [
  /* ---------- Lớp 10 ---------- */
  { id: 'c10-atom',         grade: 10, name: 'Cấu tạo nguyên tử' },
  { id: 'c10-periodic',     grade: 10, name: 'Bảng tuần hoàn & định luật tuần hoàn' },
  { id: 'c10-bonding',      grade: 10, name: 'Liên kết hóa học' },
  { id: 'c10-redox',        grade: 10, name: 'Phản ứng oxi hóa – khử' },
  { id: 'c10-energy',       grade: 10, name: 'Năng lượng hóa học' },
  { id: 'c10-rate',         grade: 10, name: 'Tốc độ phản ứng' },
  { id: 'c10-halogen',      grade: 10, name: 'Nhóm halogen' },

  /* ---------- Lớp 11 ---------- */
  { id: 'c11-equilibrium',  grade: 11, name: 'Cân bằng hóa học' },
  { id: 'c11-nitrogen',     grade: 11, name: 'Nitrogen & sulfur' },
  { id: 'c11-organic-gen',  grade: 11, name: 'Đại cương hóa học hữu cơ' },
  { id: 'c11-hydrocarbon',  grade: 11, name: 'Hydrocarbon' },
  { id: 'c11-alcohol',      grade: 11, name: 'Dẫn xuất halogen – alcohol – phenol' },
  { id: 'c11-carbonyl',     grade: 11, name: 'Hợp chất carbonyl – carboxylic acid' },

  /* ---------- Lớp 12 ---------- */
  { id: 'c12-ester',        grade: 12, name: 'Ester – lipid' },
  { id: 'c12-carbohydrate', grade: 12, name: 'Carbohydrate' },
  { id: 'c12-amine',        grade: 12, name: 'Amine, amino acid, protein' },
  { id: 'c12-polymer',      grade: 12, name: 'Polymer' },
  { id: 'c12-electro',      grade: 12, name: 'Pin điện & điện phân' },
  { id: 'c12-metal',        grade: 12, name: 'Đại cương về kim loại' },
  { id: 'c12-metal-main',   grade: 12, name: 'Kim loại nhóm IA, IIA & aluminium' },
  { id: 'c12-transition',   grade: 12, name: 'Kim loại chuyển tiếp & phức chất' },
  { id: 'c12-sustain',      grade: 12, name: 'Hóa học & phát triển bền vững' },
];

const BY_ID = Object.fromEntries(CHEM_TOPICS.map((t) => [t.id, t]));

export const getTopic = (id) => BY_ID[id] || null;
export const topicName = (id) => BY_ID[id]?.name || 'Chưa phân loại';

/* Nhóm theo lớp để render <optgroup>. preferGrade (số 10/11/12) đưa lớp đó lên đầu. */
export function topicGroups(preferGrade) {
  const groups = [10, 11, 12].map((g) => ({
    grade: g,
    label: `Lớp ${g}`,
    topics: CHEM_TOPICS.filter((t) => t.grade === g),
  }));
  if (preferGrade) groups.sort((a, b) => (a.grade === preferGrade ? -1 : b.grade === preferGrade ? 1 : 0));
  return groups;
}

/* Lấy số lớp từ tên lớp như "Lớp 12" / "12" → 12 (không có → null) */
export function gradeNumber(name) {
  const m = String(name || '').match(/\d+/);
  const n = m ? Number(m[0]) : null;
  return n >= 10 && n <= 12 ? n : null;
}

/* Trả về id hợp lệ, không thì null (dùng để làm sạch topic_id do AI trả về) */
export function sanitizeTopicId(id) {
  return typeof id === 'string' && BY_ID[id.trim()] ? id.trim() : null;
}

/* Danh sách chuyên đề dạng văn bản để nhét vào prompt AI:
   "- c10-atom: Cấu tạo nguyên tử (Lớp 10)" */
export function topicPromptList() {
  return CHEM_TOPICS.map((t) => `- ${t.id}: ${t.name} (Lớp ${t.grade})`).join('\n');
}