/* ============================================================
   paperStore.js — Lưu bài chấm phiếu giấy lên Firestore
   ------------------------------------------------------------
   Collections:
     paperExams/{id}              : cấu hình + đáp án + danh sách SBD
     paperExams/{id}/results/{rid}: kết quả từng phiếu (KHÔNG lưu ảnh)
   ============================================================ */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

const col = () => collection(db, 'paperExams');

function friendly(e, ctx) {
  if (e?.code === 'permission-denied') {
    return `Không có quyền ${ctx}. Cần thêm rule Firestore cho "paperExams" (xem hướng dẫn kèm theo).`;
  }
  return e?.message || `Lỗi ${ctx}`;
}

/* ---------- Bài chấm ---------- */
export async function listPaperExams(teacherId) {
  try {
    const snap = await getDocs(query(col(), where('teacherId', '==', teacherId)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  } catch (e) {
    throw new Error(friendly(e, 'tải danh sách bài chấm'));
  }
}

export async function createPaperExam(data) {
  try {
    const payload = {
      teacherId: data.teacherId,
      classId: data.classId || null,
      title: data.title || 'Bài chấm phiếu',
      counts: data.counts,
      scoring: data.scoring,
      keys: data.keys || {},
      sbdMap: data.sbdMap || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(col(), payload);
    return { id: ref.id, ...payload };
  } catch (e) {
    throw new Error(friendly(e, 'tạo bài chấm'));
  }
}

export async function updatePaperExam(id, patch) {
  try {
    await updateDoc(doc(db, 'paperExams', id), { ...patch, updatedAt: serverTimestamp() });
  } catch (e) {
    throw new Error(friendly(e, 'lưu bài chấm'));
  }
}

export async function deletePaperExam(id) {
  try {
    // xóa kết quả con trước (Firestore không tự xóa subcollection)
    const rs = await getDocs(collection(db, 'paperExams', id, 'results'));
    for (let i = 0; i < rs.docs.length; i += 400) {
      const b = writeBatch(db);
      rs.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
      // eslint-disable-next-line no-await-in-loop
      await b.commit();
    }
    await deleteDoc(doc(db, 'paperExams', id));
  } catch (e) {
    throw new Error(friendly(e, 'xóa bài chấm'));
  }
}

export async function getPaperExam(id) {
  const s = await getDoc(doc(db, 'paperExams', id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

/* ---------- Kết quả ---------- */
export async function listPaperResults(examId) {
  try {
    const snap = await getDocs(collection(db, 'paperExams', examId, 'results'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    throw new Error(friendly(e, 'tải kết quả'));
  }
}

/* Lưu nhiều phiếu. Có SBD hợp lệ → id = SBD (quét lại cùng SBD sẽ ghi đè, không trùng).
   Chưa có SBD → id tự sinh. */
export async function savePaperResults(examId, items) {
  try {
    for (let i = 0; i < items.length; i += 400) {
      const b = writeBatch(db);
      items.slice(i, i + 400).forEach((r) => {
        const rid = /^\d{3,8}$/.test(r.sbd || '') ? `sbd_${r.sbd}` : doc(collection(db, 'paperExams', examId, 'results')).id;
        b.set(doc(db, 'paperExams', examId, 'results', rid), {
          sbd: r.sbd || '',
          code: r.code || '',
          studentId: r.studentId || null,
          studentName: r.studentName || '',
          answers: { p1: r.p1, p2: r.p2.map((q) => q.map((c) => c || '-').join('')), p3: r.p3 },
          grade: {
            total: r.grade.total, max: r.grade.max, score10: r.grade.score10, parts: r.grade.parts,
          },
          needsReview: !!r.needsReview,
          fileName: r.fileName || '',
          gradedAt: serverTimestamp(),
        });
      });
      // eslint-disable-next-line no-await-in-loop
      await b.commit();
    }
    return { ok: true, saved: items.length };
  } catch (e) {
    return { ok: false, error: friendly(e, 'lưu kết quả') };
  }
}

export async function deletePaperResult(examId, rid) {
  await deleteDoc(doc(db, 'paperExams', examId, 'results', rid));
}

/* Đồng bộ điểm bài chấm A4 vào danh sách bài nộp (submissions) của lớp học */
export async function syncPaperResultsToSubmissions(paper, items) {
  if (!paper || !paper.classId || !Array.isArray(items) || !items.length) {
    return { ok: false, error: 'Bài chấm chưa gắn với lớp học cụ thể.' };
  }
  try {
    for (let i = 0; i < items.length; i += 400) {
      const b = writeBatch(db);
      items.slice(i, i + 400).forEach((r) => {
        const studentId = r.studentId || r.sbd || `omr_${r.code}_${Math.random().toString(36).slice(2, 6)}`;
        const subId = `omr_${paper.id}_${studentId}`;
        const score10 = Number(r.grade?.score10 ?? (r.grade?.total ? ((r.grade.total / (r.grade.max || 10)) * 10).toFixed(1) : 0));
        b.set(doc(db, 'submissions', subId), {
          examId: paper.id,
          examTitle: paper.title || 'Bài thi phiếu A4',
          classId: paper.classId,
          studentId: String(studentId),
          studentName: r.studentName || (r.sbd ? `Học sinh SBD ${r.sbd}` : 'Học sinh phiếu A4'),
          score: score10,
          totalPoints: 10,
          correctCount: Math.round((score10 / 10) * (paper.counts ? (paper.counts.p1 + paper.counts.p2 + paper.counts.p3) : 28)),
          totalQuestions: paper.counts ? (paper.counts.p1 + paper.counts.p2 + paper.counts.p3) : 28,
          submittedAt: serverTimestamp(),
          graded: true,
          isPaperOmr: true,
          sbd: r.sbd || '',
          paperCode: r.code || '',
        }, { merge: true });
      });
      // eslint-disable-next-line no-await-in-loop
      await b.commit();
    }
    return { ok: true, synced: items.length };
  } catch (e) {
    console.error('[paperStore] syncPaperResultsToSubmissions error:', e);
    return { ok: false, error: friendly(e, 'đồng bộ điểm vào lớp học') };
  }
}


