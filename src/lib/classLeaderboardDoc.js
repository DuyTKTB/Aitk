/* classLeaderboardDoc.js — bản tổng hợp bảng xếp hạng do giáo viên công bố
   Vì sao cần: học sinh KHÔNG đọc được bài nộp của bạn cùng lớp (rules chặn để
   không lộ điểm/dữ liệu). Giáo viên tính bảng xếp hạng từ dữ liệu mình đọc được
   rồi ghi 1 document tổng hợp `class_leaderboard/{classId}`; học sinh trong lớp
   đọc document đó. Không chứa bài làm gốc, chỉ hạng + điểm trung bình. */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'class_leaderboard';

/** Chuyển kết quả buildLeaderboard thành payload công bố. */
export function toPublicRows(rows = [], limit = 30) {
  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    name: r.name,
    avgPct: r.avgPct,
    attempts: r.attempts,
    /* điểm hiển thị kiểu "điểm": % × 10 (thang 1000) để giống các bảng xếp hạng quen thuộc */
    points: Math.round((r.avgPct || 0) * 10),
    rank: r.rank,
  }));
}

export async function publishClassLeaderboard({ classId, className = '', board, publishedBy = '' }) {
  if (!classId) throw new Error('Thiếu lớp.');
  const rows = toPublicRows(board?.rows || []);
  if (!rows.length) throw new Error('Chưa có học sinh nào có bài để xếp hạng.');
  const payload = {
    classId,
    className,
    rows,
    totalRanked: board.totalRanked || rows.length,
    totalStudents: board.totalStudents || rows.length,
    classAvgPct: board.classAvgPct ?? null,
    publishedBy,
    publishedAt: Date.now(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, COL, classId), payload, { merge: true });
  return payload;
}

export async function getClassLeaderboard(classId) {
  if (!classId) return null;
  const snap = await getDoc(doc(db, COL, classId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
