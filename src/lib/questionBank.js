/* ============================================================
   questionBank.js — Ngân hàng câu hỏi giáo viên (Firestore) — v2
   ------------------------------------------------------------
   v2 (sửa lỗi + nâng cấp):
     • bumpUsage: dùng increment() thay vì đọc rồi ghi → không mất lượt
       đếm khi 2 đề lưu cùng lúc, và không còn N lượt đọc Firestore.
     • Mọi thao tác batch tự chia nhóm ≤ 450 (Firestore giới hạn 500).
     • addQuestionsBatch: bỏ qua câu trùng (cùng nội dung + đáp án) và
       trả về { count, skipped }.
     • getQuestions: thêm sortBy ('recent' mặc định | 'usage'); sắp xếp
       theo ngày tạo mới nhất — trước đây luôn xếp theo số lần dùng nên
       câu vừa thêm bị đẩy xuống cuối.
     • updateQuestion: kiểm tra lại đáp án đúng khi sửa đáp án; điểm
       không hợp lệ về 1 thay vì 0.
     • Xuất thêm: norm, questionKey, findDuplicate (dùng ở giao diện).
   ============================================================ */
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, limit, writeBatch, increment,
} from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'questionBank';
const CHUNK = 450; // < 500 (giới hạn của writeBatch)

/* ============ HELPERS ============ */
export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();

/** Khóa nhận diện câu trùng: nội dung câu + các đáp án (không phân biệt dấu/hoa thường). */
export const questionKey = (item) =>
  norm(item?.q) + '|' + (item?.options || []).map(norm).join('|');

/** Tìm câu đã có trong `list` giống hệt `item`. */
export const findDuplicate = (list, item) => {
  const key = questionKey(item);
  return (list || []).find((x) => questionKey(x) === key) || null;
};

const tsMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  return 0;
};

const cleanTags = (tags) =>
  (tags || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 10);

const cleanPoints = (p) => (Number(p) > 0 ? Number(p) : 1);

/** Chuẩn hóa + kiểm tra 1 câu. Trả về object sạch, hoặc ném lỗi có thông điệp tiếng Việt. */
function buildQuestion(raw, teacherId) {
  if (!raw?.q?.trim()) throw new Error('Câu hỏi rỗng');
  if (!Array.isArray(raw.options) || raw.options.length < 2) throw new Error('Cần ít nhất 2 đáp án');
  const options = raw.options.map((o) => String(o || '').trim());
  const correct = Number(raw.correct);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length || !options[correct]) {
    throw new Error('Đáp án đúng không hợp lệ');
  }
  return {
    teacherId,
    subject: String(raw.subject || '').trim(),
    grade: Number(raw.grade) || 0,
    topicId: String(raw.topicId || '').trim(),
    level: String(raw.level || '').trim(),
    tags: cleanTags(raw.tags),
    q: String(raw.q).trim(),
    options,
    correct,
    explain: String(raw.explain || '').trim(),
    points: cleanPoints(raw.points),
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/* ============================================================
   Thêm 1 câu
   ============================================================ */
export async function addQuestion({ teacherId, ...raw }) {
  if (!teacherId) throw new Error('Thiếu teacherId');
  const data = buildQuestion(raw, teacherId);
  const ref = await addDoc(collection(db, COL), data);
  return { id: ref.id, ...data };
}

/* ============================================================
   Thêm nhiều câu (batch) — tự chia nhóm, tự bỏ câu trùng
   ------------------------------------------------------------
   @returns {{ok:boolean, count:number, skipped:number, invalid:number}}
   ============================================================ */
export async function addQuestionsBatch({ teacherId, questions, skipDuplicates = true }) {
  if (!teacherId) throw new Error('Thiếu teacherId');
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: true, count: 0, skipped: 0, invalid: 0 };
  }

  const seen = new Set();
  if (skipDuplicates) {
    const existing = await getQuestions({ teacherId, max: 2000 });
    existing.forEach((x) => seen.add(questionKey(x)));
  }

  const docs = [];
  let skipped = 0;
  let invalid = 0;
  for (const raw of questions) {
    let data;
    try {
      data = buildQuestion(raw, teacherId);
    } catch {
      invalid++;
      continue;
    }
    const key = questionKey(data);
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key); // chống trùng ngay trong lô đang thêm
    docs.push(data);
  }

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach((d) => batch.set(doc(collection(db, COL)), d));
    await batch.commit();
  }
  return { ok: true, count: docs.length, skipped, invalid };
}

/* ============================================================
   Cập nhật 1 câu
   ============================================================ */
export async function updateQuestion(questionId, patch) {
  if (!questionId) throw new Error('Thiếu questionId');

  const allowed = ['subject', 'grade', 'topicId', 'level', 'tags', 'q', 'options', 'correct', 'explain', 'points'];
  const data = { updatedAt: serverTimestamp() };

  for (const k of allowed) {
    if (patch[k] === undefined) continue;
    if (k === 'tags') data[k] = cleanTags(patch[k]);
    else if (k === 'options') data[k] = (patch[k] || []).map((o) => String(o || '').trim());
    else if (k === 'points') data[k] = cleanPoints(patch[k]);
    else if (k === 'correct' || k === 'grade') data[k] = Number(patch[k]) || 0;
    else data[k] = String(patch[k] || '').trim();
  }

  if (data.options && data.options.length < 2) throw new Error('Cần ít nhất 2 đáp án');
  if (data.options && patch.correct !== undefined) {
    const c = data.correct;
    if (c < 0 || c >= data.options.length || !data.options[c]) {
      throw new Error('Đáp án đúng không hợp lệ');
    }
  }

  await updateDoc(doc(db, COL, questionId), data);
  return { ok: true };
}

/* ============================================================
   Xóa 1 câu / nhiều câu
   ============================================================ */
export async function deleteQuestion(questionId) {
  if (!questionId) return;
  await deleteDoc(doc(db, COL, questionId));
}

export async function deleteQuestionsBatch(questionIds) {
  const ids = [...new Set((questionIds || []).filter(Boolean))];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    ids.slice(i, i + CHUNK).forEach((id) => batch.delete(doc(db, COL, id)));
    await batch.commit();
  }
  return { ok: true, count: ids.length };
}

/* ============================================================
   Tăng usageCount khi câu được dùng vào đề
   ------------------------------------------------------------
   Dùng increment() → nguyên tử, không cần đọc trước. Nếu có câu đã bị
   xóa khiến batch lỗi, rơi về cập nhật từng câu và bỏ qua câu thiếu.
   ============================================================ */
export async function bumpUsage(questionIds) {
  const ids = [...new Set((questionIds || []).filter(Boolean))];
  if (ids.length === 0) return;

  const patch = () => ({
    usageCount: increment(1),
    lastUsedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (let i = 0; i < ids.length; i += CHUNK) {
    const part = ids.slice(i, i + CHUNK);
    try {
      const batch = writeBatch(db);
      part.forEach((id) => batch.update(doc(db, COL, id), patch()));
      await batch.commit();
    } catch (e) {
      console.warn('[questionBank] bumpUsage batch lỗi, thử từng câu:', e?.code || e?.message);
      await Promise.allSettled(part.map((id) => updateDoc(doc(db, COL, id), patch())));
    }
  }
}

/* ============================================================
   Lấy danh sách câu hỏi của 1 GV
   ------------------------------------------------------------
   @param {string} opts.sortBy  'recent' (mặc định) | 'usage'
   ============================================================ */
export async function getQuestions({
  teacherId,
  subject = '',
  grade = 0,
  topicId = '',
  level = '',
  tag = '',
  search = '',
  sortBy = 'recent',
  max = 1000,
} = {}) {
  if (!teacherId) return [];

  const constraints = [where('teacherId', '==', teacherId)];
  if (subject) constraints.push(where('subject', '==', subject));
  if (grade) constraints.push(where('grade', '==', grade));
  if (topicId) constraints.push(where('topicId', '==', topicId));
  if (level) constraints.push(where('level', '==', level));
  if (tag) constraints.push(where('tags', 'array-contains', tag));

  const snap = await getDocs(query(collection(db, COL), ...constraints, limit(max)));
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (search.trim()) {
    const needle = norm(search);
    list = list.filter((item) => norm(item.q).includes(needle) || norm(item.explain).includes(needle));
  }

  if (sortBy === 'usage') {
    list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || tsMs(b.createdAt) - tsMs(a.createdAt));
  } else {
    // createdAt có thể là null ngay sau khi ghi (serverTimestamp chưa về) → coi là mới nhất
    list.sort((a, b) => (tsMs(b.createdAt) || Date.now()) - (tsMs(a.createdAt) || Date.now()));
  }
  return list;
}

/* ============================================================
   Lấy tất cả tag đã dùng
   ============================================================ */
export async function getAllTags(teacherId) {
  if (!teacherId) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COL), where('teacherId', '==', teacherId), limit(1000))
    );
    const set = new Set();
    snap.docs.forEach((d) => (d.data()?.tags || []).forEach((t) => set.add(t)));
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
  } catch (e) {
    console.warn('[questionBank] getAllTags lỗi:', e?.message);
    return [];
  }
}

/* ============================================================
   Thống kê ngân hàng
   ============================================================ */
export async function getBankStats(teacherId) {
  const empty = { total: 0, bySubject: {}, byGrade: {}, byLevel: {}, byTopic: {} };
  if (!teacherId) return empty;
  try {
    const snap = await getDocs(
      query(collection(db, COL), where('teacherId', '==', teacherId), limit(2000))
    );
    const out = { ...empty, bySubject: {}, byGrade: {}, byLevel: {}, byTopic: {} };
    const inc = (obj, k) => { obj[k] = (obj[k] || 0) + 1; };
    snap.docs.forEach((d) => {
      const x = d.data();
      inc(out.bySubject, x.subject || '—');
      inc(out.byGrade, x.grade || 0);
      inc(out.byLevel, x.level || '—');
      inc(out.byTopic, x.topicId || '—');
    });
    out.total = snap.size;
    return out;
  } catch (e) {
    console.warn('[questionBank] getBankStats lỗi:', e?.message);
    return empty;
  }
}
