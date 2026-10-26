/* leaderboard.js — bảng xếp hạng theo lớp (thuần JS, test được)
   Nguyên tắc: chỉ xếp hạng trên bài ĐÃ LÀM; học sinh chưa làm bài nào
   bị loại khỏi bảng (không bị xếp bét). Điểm dùng % từng bài vì các đề
   có thang điểm khác nhau. */

export const RANK_MEDALS = { 1: 'Nhất', 2: 'Nhì', 3: 'Ba' };

function pctOfSubmission(sub, exam) {
  const total = Number(sub?.totalPoints) || Number(exam?.totalPoints) || 0;
  const score = Number(sub?.score);
  if (!(total > 0) || !Number.isFinite(score)) return null;
  return (score / total) * 100;
}

/**
 * @param {object} p
 * @param {Array} p.members           [{id,name,email}]
 * @param {Array} p.exams             đề của lớp (đã lọc theo môn nếu cần)
 * @param {object} p.submissionsByExam {examId: [submission]}
 * @param {string} p.uid              người đang xem (để đánh dấu "bạn")
 * @param {number} p.minAttempts      số bài tối thiểu để được xếp hạng
 */
export function buildLeaderboard({
  members = [], exams = [], submissionsByExam = {}, uid = '', minAttempts = 1,
} = {}) {
  const rows = members.map((m) => {
    const pcts = [];
    let lastAt = 0;
    exams.forEach((ex) => {
      (submissionsByExam[ex.id] || []).forEach((s) => {
        if (s.studentId !== m.id) return;
        const p = pctOfSubmission(s, ex);
        if (p === null) return;
        pcts.push(p);
        const t = Number(s.submittedAt) || 0;
        if (t > lastAt) lastAt = t;
      });
    });
    const avgPct = pcts.length
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
      : null;
    return {
      id: m.id,
      name: m.name || m.email || 'Học sinh',
      email: m.email || '',
      attempts: pcts.length,
      avgPct,
      bestPct: pcts.length ? Math.round(Math.max(...pcts)) : null,
      lastAt,
      isMe: !!uid && m.id === uid,
    };
  });

  const ranked = rows
    .filter((r) => r.avgPct !== null && r.attempts >= Math.max(1, minAttempts))
    .sort((a, b) => (b.avgPct - a.avgPct)
      || (b.attempts - a.attempts)
      || a.name.localeCompare(b.name, 'vi'))
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const unranked = rows
    .filter((r) => r.avgPct === null || r.attempts < Math.max(1, minAttempts))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  const me = ranked.find((r) => r.isMe) || null;

  return {
    rows: ranked,
    unranked,
    me,
    totalRanked: ranked.length,
    totalStudents: rows.length,
    classAvgPct: ranked.length
      ? Math.round(ranked.reduce((a, r) => a + r.avgPct, 0) / ranked.length)
      : null,
  };
}

/** Gộp nhiều mảng submission (mỗi đề một mảng) thành map theo examId. */
export function groupSubmissions(list = []) {
  const map = {};
  list.forEach((s) => {
    const id = s?.examId;
    if (!id) return;
    (map[id] = map[id] || []).push(s);
  });
  return map;
}

/** Nhãn hạng: 1 → "Nhất", 2 → "Nhì", 3 → "Ba", còn lại → "#n". */
export function rankLabel(rank) {
  return RANK_MEDALS[rank] || `#${rank}`;
}
