/* ============================================================
   wrongQuestionService.js — Đồng bộ câu hỏi sai từ MỌI nguồn
   ------------------------------------------------------------
   Nguồn ghi:
     1. ExamJoin.jsx (bài thi lớp học)
     2. VirtualExamRoom.jsx (phòng thi ảo THPT)
     3. PracticeRunner.jsx (luyện tập chuyên đề Lộ trình)
     4. Quiz.jsx (ôn tập nguyên tố)
   Nguồn đọc:
     1. WrongNotebook.jsx (Sổ tay lỗi sai)
     2. RoadmapPage.jsx Tab 3
   ============================================================ */
import { supabase } from './supabase.js';

export const WRONG_STORAGE_PREFIX = 'cs-wrong-notebook:';
export const WRONG_UPDATE_EVENT = 'cs-wrong-questions-update';

const keyOf = (uid) => `${WRONG_STORAGE_PREFIX}${uid || 'guest'}`;

export function getWrongQuestions(uid) {
  try {
    const raw = localStorage.getItem(keyOf(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWrongQuestions(uid, list) {
  try {
    localStorage.setItem(keyOf(uid), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(WRONG_UPDATE_EVENT, { detail: { uid, count: list.length } }));
  } catch (e) {
    console.warn('[wrongQuestionService] save error:', e);
  }
}

/**
 * Ghi nhận danh sách câu trả lời sai từ bất kỳ bài thi nào
 * @param {string} uid - User ID
 * @param {Array} items - Mảng { question, userPicked, isCorrect, examTitle, source, topicId }
 */
export function recordWrongAnswers(uid, items = []) {
  if (!uid || !Array.isArray(items) || items.length === 0) return [];
  const wrongOnly = items.filter((it) => it && it.isCorrect === false && it.question);
  if (wrongOnly.length === 0) return [];

  const existing = getWrongQuestions(uid);
  const map = new Map(existing.map((item) => [String(item.questionId || item.id), item]));

  const now = new Date().toISOString();

  wrongOnly.forEach((it) => {
    const q = it.question;
    const qid = String(q.id || q.questionId || `${it.examTitle || 'exam'}_${(q.content || q.q || '').slice(0, 30)}`);
    const prev = map.get(qid);

    const updatedItem = {
      id: prev?.id || `local_wrong_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      questionId: qid,
      wrong_count: (prev?.wrong_count || 0) + 1,
      mastered: false,
      last_wrong_at: now,
      source: it.source || prev?.source || 'exam',
      examTitle: it.examTitle || prev?.examTitle || 'Bài kiểm tra',
      question: {
        id: qid,
        content: q.content || q.q || '',
        explanation: q.explanation || q.explain || '',
        difficulty: q.difficulty || q.level || 'medium',
        topic_id: q.topic_id || q.topicId || it.topicId || 'c12-ester',
        exam: {
          id: it.examId || 'local',
          title: it.examTitle || 'Bài thi',
          subject: { name: 'Hóa học' },
        },
        answers: Array.isArray(q.options)
          ? q.options.map((opt, idx) => ({
              id: `${qid}_opt_${idx}`,
              label: String.fromCharCode(65 + idx),
              content: typeof opt === 'string' ? opt : (opt.text || opt.content || ''),
              is_correct: idx === (q.correct ?? q.correctIndex),
            }))
          : (q.answers || []),
      },
      userPicked: it.userPicked,
      correctAnswer: q.correct ?? q.correctIndex,
    };

    map.set(qid, updatedItem);
  });

  const nextList = [...map.values()].sort((a, b) => new Date(b.last_wrong_at).getTime() - new Date(a.last_wrong_at).getTime());
  saveWrongQuestions(uid, nextList);

  // Thử đồng bộ ngầm với Supabase nếu có mạng
  if (supabase) {
    try {
      wrongOnly.forEach((it) => {
        if (it.question?.id && typeof it.question.id === 'number') {
          supabase.from('wrong_questions').upsert({
            user_id: uid,
            question_id: it.question.id,
            mastered: false,
            last_wrong_at: now,
          }, { onConflict: 'user_id,question_id' }).then(() => {}).catch(() => {});
        }
      });
    } catch { /* ignore offline */ }
  }

  return nextList;
}

export function markQuestionMastered(uid, idOrQid) {
  if (!uid) return;
  const list = getWrongQuestions(uid);
  const next = list.map((item) => {
    if (item.id === idOrQid || item.questionId === idOrQid || item.question?.id === idOrQid) {
      return { ...item, mastered: true, masteredAt: new Date().toISOString() };
    }
    return item;
  });
  saveWrongQuestions(uid, next);
}

export function removeWrongQuestion(uid, idOrQid) {
  if (!uid) return;
  const list = getWrongQuestions(uid);
  const next = list.filter((item) => item.id !== idOrQid && item.questionId !== idOrQid && item.question?.id !== idOrQid);
  saveWrongQuestions(uid, next);
}
