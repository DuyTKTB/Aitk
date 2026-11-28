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
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc,
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

/** Khóa nhận diện câu trùng: hỗ trợ Trắc nghiệm, Đúng/Sai 4 ý, Trả lời ngắn và Tự luận. */
export const questionKey = (item) => {
  const type = item?.type || (Array.isArray(item?.statements) ? 'true_false' : item?.answer !== undefined && !(item?.options?.length) ? 'short_answer' : 'single_choice');
  if (type === 'true_false') {
    const sts = (item?.statements || []).map((s) => `${norm(s?.text)}:${s?.answer ? 1 : 0}`).join('|');
    return `tf|${norm(item?.q)}|${sts}`;
  }
  if (type === 'short_answer') {
    return `sa|${norm(item?.q)}|${norm(item?.answer)}`;
  }
  if (type === 'essay') {
    return `essay|${norm(item?.q)}|${norm(item?.passage)}|${norm(item?.answer)}`;
  }
  return norm(item?.q) + '|' + norm(item?.passage) + '|' + (item?.options || []).map(norm).join('|');
};

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

/** Chuẩn hóa + kiểm tra 1 câu (hỗ trợ Trắc nghiệm, Đúng/Sai, Trả lời ngắn & Tự luận). */
function buildQuestion(raw, teacherId) {
  const hasImg = Boolean(raw?.image || (Array.isArray(raw?.images) && raw.images.some(Boolean)));
  const hasStemOrPassage = Boolean(String(raw?.q || '').trim() || String(raw?.passage || '').trim() || hasImg);
  if (!hasStemOrPassage) throw new Error('Câu hỏi rỗng');
  const type = raw.type || (Array.isArray(raw.statements) ? 'true_false' : (raw.answer !== undefined && !(raw.options?.length)) ? 'short_answer' : 'single_choice');
  const cleanImages = Array.isArray(raw.images) ? raw.images.filter((u) => typeof u === 'string' && u.trim()) : [];
  const base = {
    teacherId,
    type,
    subject: String(raw.subject || '').trim(),
    grade: Number(raw.grade) || 0,
    topicId: String(raw.topicId || raw.topic || '').trim(),
    level: String(raw.level || '').trim(),
    tags: cleanTags(raw.tags),
    q: String(raw.q || '').trim(),
    ...(String(raw.passage || '').trim() ? { passage: String(raw.passage).trim() } : {}),
    ...(String(raw.instruction || '').trim() ? { instruction: String(raw.instruction).trim() } : {}),
    ...(raw.passageId != null ? { passageId: raw.passageId } : {}),
    ...((raw.groupId || raw.pg) ? { groupId: raw.groupId || raw.pg } : {}),
    ...(raw.lockGroupQuestionOrder ? { lockGroupQuestionOrder: true } : {}),
    ...(raw.image ? { image: String(raw.image).trim() } : {}),
    ...(cleanImages.length ? { images: cleanImages } : {}),
    ...(String(raw.imageCaption || '').trim() ? { imageCaption: String(raw.imageCaption).trim() } : {}),
    ...(String(raw.imageAlt || '').trim() ? { imageAlt: String(raw.imageAlt).trim() } : {}),
    ...(raw.optionImages && (Array.isArray(raw.optionImages) ? raw.optionImages.some(Boolean) : Object.keys(raw.optionImages).length > 0)
      ? { optionImages: raw.optionImages }
      : {}),
    explain: String(raw.explain || '').trim(),
    ...(String(raw.work || '').trim() ? { work: String(raw.work).trim() } : {}),
    points: cleanPoints(raw.points),
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (type === 'true_false') {
    const sts = Array.isArray(raw.statements) ? raw.statements : [];
    if (sts.length === 0) throw new Error('Câu Đúng/Sai cần ít nhất 1 mệnh đề');
    return {
      ...base,
      statements: sts.map((s, idx) => ({
        key: s?.key || String.fromCharCode(97 + idx),
        text: String(s?.text || '').trim(),
        answer: !!(s?.answer ?? s?.correct),
      })),
      options: [],
      correct: 0,
    };
  }

  if (type === 'short_answer') {
    const ans = String(raw.answer ?? '').trim();
    if (!ans) throw new Error('Câu trả lời ngắn thiếu đáp án chuẩn');
    const accepted = Array.isArray(raw.accepted)
      ? raw.accepted.map((a) => String(a || '').trim()).filter(Boolean)
      : [ans];
    return {
      ...base,
      answer: ans,
      accepted,
      options: [],
      correct: 0,
    };
  }

  if (type === 'essay') {
    return {
      ...base,
      answer: String(raw.answer ?? '').trim(),
      options: [],
      correct: -1,
    };
  }

  if (!Array.isArray(raw.options) || raw.options.length < 2) throw new Error('Cần ít nhất 2 đáp án');
  const options = raw.options.map((o) => String(o || '').trim());
  const correct = Number(raw.correct);
  const optImgAtCorrect = Array.isArray(raw.optionImages)
    ? raw.optionImages[correct]
    : (raw.optionImages && typeof raw.optionImages === 'object' ? (raw.optionImages[correct] ?? raw.optionImages[String(correct)]) : null);
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length || (!options[correct] && !optImgAtCorrect)) {
    throw new Error('Đáp án đúng không hợp lệ');
  }
  return { ...base, options, correct };
}

/* ============================================================
   Thêm 1 câu
   ============================================================ */
export async function addQuestion({ teacherId, ...raw }) {
  if (!teacherId) throw new Error('Thiếu teacherId');
  const data = buildQuestion(raw, teacherId);
  const newDocRef = doc(collection(db, COL));
  const qData = { id: newDocRef.id, ...data };
  await setDoc(newDocRef, data);
  return qData;
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

  const allowed = [
    'type', 'subject', 'grade', 'topicId', 'level', 'tags', 'q', 'passage', 'instruction',
    'passageId', 'groupId', 'lockGroupQuestionOrder', 'image', 'images', 'imageCaption', 'imageAlt',
    'optionImages', 'options', 'correct', 'statements', 'answer', 'accepted', 'explain', 'work', 'points',
  ];
  const data = { updatedAt: serverTimestamp() };

  for (const k of allowed) {
    if (patch[k] === undefined) continue;
    if (k === 'tags') data[k] = cleanTags(patch[k]);
    else if (k === 'options') data[k] = (patch[k] || []).map((o) => String(o || '').trim());
    else if (k === 'images') data[k] = Array.isArray(patch[k]) ? patch[k].filter((u) => typeof u === 'string' && u.trim()) : [];
    else if (k === 'optionImages') data[k] = patch[k];
    else if (k === 'statements') {
      data[k] = (patch[k] || []).map((s, idx) => ({
        key: s?.key || String.fromCharCode(97 + idx),
        text: String(s?.text || '').trim(),
        answer: !!(s?.answer ?? s?.correct),
      }));
    } else if (k === 'accepted') {
      data[k] = Array.isArray(patch[k]) ? patch[k].map((a) => String(a || '').trim()).filter(Boolean) : [];
    } else if (k === 'points') data[k] = cleanPoints(patch[k]);
    else if (k === 'lockGroupQuestionOrder') data[k] = Boolean(patch[k]);
    else if (k === 'correct' || k === 'grade') data[k] = Number(patch[k]) || 0;
    else if (k === 'passageId') data[k] = patch[k];
    else data[k] = String(patch[k] || '').trim();
  }

  const effectiveType = data.type || patch.type;
  if (effectiveType !== 'true_false' && effectiveType !== 'short_answer' && effectiveType !== 'essay') {
    if (data.options && data.options.length < 2) throw new Error('Cần ít nhất 2 đáp án');
    if (data.options && patch.correct !== undefined) {
      const c = data.correct;
      if (c < 0 || c >= data.options.length || !data.options[c]) {
        throw new Error('Đáp án đúng không hợp lệ');
      }
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
