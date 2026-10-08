/* ============================================================
   gameQuestionBank.js — Lấy câu hỏi từ ngân hàng (Supabase) cho các game
   ------------------------------------------------------------
   • fetchBankQuestions()      → danh sách câu hợp lệ cho game (đã đổi sang
                                 định dạng { question, correct, wrong[] })
   • pickRandom()              → bốc ngẫu nhiên N câu
   • buildJeopardyCategories() → mỗi chuyên đề = 1 cột, 5 ô 100–500 (dễ → khó)
   Chỉ lấy câu của đề ĐÃ XUẤT BẢN, dạng 1 đáp án đúng (single_choice).
   ============================================================ */
import { supabase } from './supabase.js';
import { topicName } from '../data/chemTopics.js';

export const GAME_DIFFICULTIES = [
  { id: 'easy', name: 'Nhận biết' },
  { id: 'medium', name: 'Thông hiểu' },
  { id: 'hard', name: 'Vận dụng' },
  { id: 'extreme', name: 'Vận dụng cao' },
];

const DIFF_RANK = { easy: 0, medium: 1, hard: 2, extreme: 3 };

/* Bỏ nhãn "A. " / "B) " nếu đáp án trong DB có sẵn */
const stripLabel = (s) => String(s ?? '').replace(/^\s*[A-Da-d][.)]\s+/, '').trim();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pickRandom = (list, count) => shuffle(list).slice(0, count);

/**
 * @param topicIds       mảng topic_id; rỗng = lấy từ mọi chuyên đề
 * @param difficulties   mảng 'easy'|'medium'|'hard'|'extreme'; rỗng = mọi độ khó
 * @param maxAnswerLen   >0: loại câu có đáp án dài hơn (biển gà / bia bắn chỉ chứa được chữ ngắn)
 * @param minWrong       số đáp án sai tối thiểu
 * @returns { eligible, skipped, fetched }
 */
export async function fetchBankQuestions({
  topicIds = [],
  difficulties = [],
  maxAnswerLen = 0,
  minWrong = 2,
  pool = 500,
} = {}) {
  let q = supabase
    .from('questions')
    .select(`
      id, content, explanation, difficulty, topic_id, question_type,
      exams!inner(is_published),
      answers(content, is_correct, sort_order)
    `)
    .eq('exams.is_published', true)
    .eq('question_type', 'single_choice')
    .limit(pool);

  if (topicIds.length) q = q.in('topic_id', topicIds);
  if (difficulties.length) q = q.in('difficulty', difficulties);

  const { data, error } = await q;
  if (error) throw error;

  const eligible = [];
  let skipped = 0;

  for (const row of data || []) {
    const answers = [...(row.answers || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const right = answers.filter((a) => a.is_correct);
    const wrong = answers.filter((a) => !a.is_correct).map((a) => stripLabel(a.content)).filter(Boolean);
    const question = String(row.content || '').trim();
    const correct = right.length === 1 ? stripLabel(right[0].content) : '';

    if (!question || !correct || wrong.length < minWrong) { skipped++; continue; }
    if (maxAnswerLen && [correct, ...wrong].some((t) => t.length > maxAnswerLen)) { skipped++; continue; }

    eligible.push({
      question,
      correct,
      wrong,
      question_id: row.id,
      topic_id: row.topic_id || null,
      difficulty: row.difficulty,
      explanation: row.explanation || '',
    });
  }

  return { eligible, skipped, fetched: (data || []).length };
}

/**
 * Mỗi chuyên đề thành 1 cột Jeopardy: chọn perCategory câu rải đều từ dễ → khó, điểm 100, 200, ...
 * Chuyên đề không đủ câu bị loại và được báo trong `dropped`.
 */
export function buildJeopardyCategories(eligible, topicIds, { perCategory = 5 } = {}) {
  const categories = [];
  const dropped = [];

  for (const id of topicIds) {
    const list = eligible.filter((x) => x.topic_id === id);
    if (list.length < perCategory) { dropped.push({ id, name: topicName(id), have: list.length }); continue; }

    const sorted = shuffle(list).sort((a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1));
    const picks = Array.from({ length: perCategory }, (_, i) =>
      sorted[Math.round((i * (sorted.length - 1)) / (perCategory - 1))]
    );

    categories.push({
      name: topicName(id),
      questions: picks.map((x, i) => ({
        q: x.question,
        a: x.correct,
        v: (i + 1) * 100,
        question_id: x.question_id,
        topic_id: id,
      })),
    });
  }

  return { categories, dropped };
}
