import { supabase } from '../../lib/supabase.js';
import { chunk } from './adminUtils.js';

/* Xóa dọn khi một thao tác nhiều bước bị lỗi giữa chừng (không ném lỗi) */
async function rollbackExam(examId) {
  try {
    await supabase.from('questions').delete().eq('exam_id', examId);
    await supabase.from('exams').delete().eq('id', examId);
  } catch (e) {
    console.error('Rollback thất bại:', e);
  }
}

async function insertQuestionsWithAnswers(examId, questions) {
  const qRows = questions.map((q, i) => ({
    exam_id: examId,
    question_number: q.question_number ?? i + 1,
    content: q.content,
    question_type: q.question_type || q.type || 'single_choice',
    image_url: q.image_url ?? null,
    explanation: q.explanation || null,
    difficulty: q.difficulty || 'medium',
  }));

  const idByNumber = new Map();
  for (const part of chunk(qRows, 200)) {
    const { data, error } = await supabase.from('questions').insert(part).select('id, question_number');
    if (error) throw error;
    (data || []).forEach((r) => idByNumber.set(r.question_number, r.id));
  }

  const aRows = [];
  questions.forEach((q, i) => {
    const qid = idByNumber.get(q.question_number ?? i + 1);
    if (!qid) throw new Error(`Không tạo được câu ${i + 1}.`);
    const qType = q.question_type || q.type || 'single_choice';
    let opts = q.options || q.answers || [];
    if (qType === 'short_answer' && opts.length === 0) {
      const val = String(q.shortAnswer ?? q.correctAnswer ?? '').trim();
      opts = [{ label: 'ĐS', content: val, is_correct: true, sort_order: 0 }];
    }
    opts.forEach((o, idx) => {
      let isRight = !!o.is_correct;
      if (qType === 'single_choice' && q.correctAnswer != null && q.correctAnswer !== '') {
        isRight = q.correctAnswer === o.label;
      } else if (qType === 'short_answer') {
        isRight = true;
      }
      aRows.push({
        question_id: qid,
        label: o.label || (qType === 'short_answer' ? 'ĐS' : String.fromCharCode(65 + idx)),
        content: o.content ?? '',
        is_correct: isRight,
        sort_order: o.sort_order ?? idx,
      });
    });
  });

  for (const part of chunk(aRows, 500)) {
    const { error } = await supabase.from('answers').insert(part);
    if (error) throw error;
  }
}

/* Tạo đề + toàn bộ câu hỏi/đáp án. Lỗi giữa chừng → tự dọn rác. */
export async function createExamWithQuestions(meta, questions) {
  const { data: exam, error } = await supabase
    .from('exams')
    .insert({
      title: meta.title.trim(),
      description: meta.description?.trim() || null,
      grade_id: Number(meta.grade_id),
      subject_id: Number(meta.subject_id),
      exam_type: meta.exam_type || 'giua_ky',
      duration: Number(meta.duration) || 45,
      difficulty: meta.difficulty || 'medium',
      source: meta.source || 'AI Generated',
      is_published: meta.is_published ?? false,
    })
    .select('id, title')
    .single();
  if (error) throw error;

  try {
    await insertQuestionsWithAnswers(exam.id, questions);
  } catch (e) {
    await rollbackExam(exam.id);
    throw e;
  }
  return exam;
}

/* Nhân bản đề (luôn ở trạng thái ẩn) */
export async function duplicateExam(examId) {
  const { data: src, error: e0 } = await supabase.from('exams').select('*').eq('id', examId).single();
  if (e0) throw e0;

  const { data: qs, error: e1 } = await supabase
    .from('questions')
    .select('*, answers:answers(id, label, content, is_correct, sort_order)')
    .eq('exam_id', examId)
    .order('question_number');
  if (e1) throw e1;

  const { data: copy, error: e2 } = await supabase
    .from('exams')
    .insert({
      title: `${src.title} (bản sao)`,
      description: src.description,
      grade_id: src.grade_id,
      subject_id: src.subject_id,
      exam_type: src.exam_type,
      duration: src.duration,
      difficulty: src.difficulty,
      source: src.source,
      is_published: false,
    })
    .select('id')
    .single();
  if (e2) throw e2;

  try {
    await insertQuestionsWithAnswers(
      copy.id,
      (qs || []).map((q) => ({
        question_number: q.question_number,
        content: q.content,
        question_type: q.question_type,
        image_url: q.image_url,
        explanation: q.explanation,
        difficulty: q.difficulty,
        // giữ nguyên cờ is_correct của đáp án gốc (không truyền correctAnswer)
        options: [...(q.answers || [])].sort((a, b) => a.sort_order - b.sort_order),
      }))
    );
  } catch (e) {
    await rollbackExam(copy.id);
    throw e;
  }
  return copy;
}

/* Xuất đề thi ra đối tượng JSON chuẩn để tải về hoặc chia sẻ */
export async function exportExamData(examId) {
  const { data: src, error: e0 } = await supabase
    .from('exams')
    .select('*, grade:grades(name), subject:subjects(name)')
    .eq('id', examId)
    .single();
  if (e0) throw e0;

  const { data: qs, error: e1 } = await supabase
    .from('questions')
    .select('*, answers:answers(id, label, content, is_correct, sort_order)')
    .eq('exam_id', examId)
    .order('question_number');
  if (e1) throw e1;

  return {
    title: src.title,
    description: src.description || '',
    grade: src.grade?.name || '',
    subject: src.subject?.name || '',
    grade_id: src.grade_id,
    subject_id: src.subject_id,
    exam_type: src.exam_type,
    duration: src.duration,
    difficulty: src.difficulty,
    source: src.source || '',
    questions: (qs || []).map((q) => {
      const sorted = [...(q.answers || [])].sort((a, b) => a.sort_order - b.sort_order);
      const qType = q.question_type || 'single_choice';
      const right = sorted.find((a) => a.is_correct);
      return {
        content: q.content,
        type: qType,
        options: sorted.map((a) => ({
          label: a.label,
          content: a.content,
          isCorrect: !!a.is_correct,
        })),
        correctAnswer:
          qType === 'short_answer'
            ? sorted[0]?.content || ''
            : qType === 'true_false'
              ? sorted.map((a) => (a.is_correct ? 'Đ' : 'S')).join('-')
              : right?.label || '',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        topic: q.topic_id || '',
      };
    }),
  };
}
