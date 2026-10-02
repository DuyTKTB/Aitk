// src/lib/examApi.js
import { supabase } from './supabase.js';

// ============================================================
// ĐỀ THI
// ============================================================
export async function fetchExams(filters = {}) {
  const {
    gradeId, subjectId, examType, semester, schoolYear, program,
    difficulty, search, sort = 'newest',
    page = 1, pageSize = 12,
  } = filters;

  let q = supabase
    .from('exams')
    .select(`
      id, title, description, exam_type, semester, school_year,
      program, duration, difficulty, source, attempt_count, created_at,
      grade:grades(id, name),
      subject:subjects(id, code, name)
    `, { count: 'exact' })
    .eq('is_published', true);

  if (gradeId) q = q.eq('grade_id', gradeId);
  if (subjectId) q = q.eq('subject_id', subjectId);
  if (examType) q = q.eq('exam_type', examType);
  if (semester) q = q.eq('semester', semester);
  if (schoolYear) q = q.eq('school_year', schoolYear);
  if (program) q = q.eq('program', program);
  if (difficulty) q = q.eq('difficulty', difficulty);
  if (search) q = q.ilike('title', `%${search}%`);

  switch (sort) {
    case 'popular': q = q.order('attempt_count', { ascending: false }); break;
    case 'oldest': q = q.order('created_at', { ascending: true }); break;
    default: q = q.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0, page, pageSize };
}

export async function fetchExamById(examId) {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      grade:grades(id, name),
      subject:subjects(id, code, name)
    `)
    .eq('id', examId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchExamQuestions(examId) {
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      *,
      topic:topics(id, name),
      answers:answers(id, label, content, is_correct, sort_order)
    `)
    .eq('exam_id', examId)
    .order('question_number', { ascending: true });

  if (error) throw error;

  return (questions || []).map((q) => ({
    ...q,
    answers: (q.answers || []).sort((a, b) => a.sort_order - b.sort_order),
  }));
}

// ============================================================
// LƯỢT LÀM BÀI
// ============================================================
export async function createAttempt(examId, mode, userId) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .insert({ exam_id: examId, mode, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveUserAnswer(attemptId, questionId, answer) {
  const { data, error } = await supabase
    .from('user_answers')
    .upsert({
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer_id: answer.selectedAnswerId || null,
      answer_text: answer.answerText || null,
      is_correct: answer.isCorrect ?? null,
      flagged: answer.flagged || false,
    }, { onConflict: 'attempt_id,question_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitAttempt(attemptId, summary) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .update({
      score: summary.score,
      correct_count: summary.correct,
      wrong_count: summary.wrong,
      blank_count: summary.blank,
      total_questions: summary.total,
      time_spent: summary.timeSpent,
      submitted_at: new Date().toISOString(),
      is_completed: true,
    })
    .eq('id', attemptId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAttemptResult(attemptId) {
  const { data: attempt, error: e1 } = await supabase
    .from('exam_attempts')
    .select(`*, exam:exams(id, title, duration)`)
    .eq('id', attemptId)
    .single();

  if (e1) throw e1;

  const { data: answers, error: e2 } = await supabase
    .from('user_answers')
    .select(`
      *,
      question:questions(
        id, question_number, content, question_type, explanation, image_url, latex,
        topic:topics(id, name),
        answers:answers(id, label, content, is_correct, sort_order)
      ),
      selected_answer:answers(id, label, content, is_correct)
    `)
    .eq('attempt_id', attemptId)
    .order('question_id', { ascending: true });

  if (e2) throw e2;

  return { attempt, answers: answers || [] };
}

export async function fetchUserAttempts(userId, limit = 20) {
  const { data, error } = await supabase
    .from('exam_attempts')
    .select(`
      id, score, correct_count, wrong_count, total_questions,
      time_spent, started_at, submitted_at, mode,
      exam:exams(id, title, duration, subject:subjects(name))
    `)
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================
// DANH MỤC
// ============================================================
export async function fetchGrades() {
  const { data, error } = await supabase.from('grades').select('*').order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchTopics(subjectId) {
  let q = supabase.from('topics').select('*').order('sort_order');
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// ============================================================
// CÂU HỎI ĐÃ LƯU / CÂU SAI
// ============================================================
export async function saveQuestion(userId, questionId, note = null) {
  const { error } = await supabase
    .from('saved_questions')
    .upsert({ user_id: userId, question_id: questionId, note }, { onConflict: 'user_id,question_id' });
  if (error) throw error;
}

export async function unsaveQuestion(userId, questionId) {
  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);
  if (error) throw error;
}

export async function fetchSavedQuestions(userId) {
  const { data, error } = await supabase
    .from('saved_questions')
    .select(`
      id, note, saved_at,
      question:questions(
        id, content, question_type, explanation,
        topic:topics(name),
        answers:answers(id, label, content, is_correct)
      )
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markWrong(userId, questionId, attemptId) {
  const { data: existing } = await supabase
    .from('wrong_questions')
    .select('id, wrong_count')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('wrong_questions')
      .update({ wrong_count: existing.wrong_count + 1, last_wrong_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('wrong_questions')
      .insert({ user_id: userId, question_id: questionId, attempt_id: attemptId });
  }
}

export async function markMastered(userId, questionId) {
  const { error } = await supabase
    .from('wrong_questions')
    .update({ mastered: true })
    .eq('user_id', userId)
    .eq('question_id', questionId);
  if (error) throw error;
}

export async function fetchWrongQuestions(userId) {
  const { data, error } = await supabase
    .from('wrong_questions')
    .select(`
      id, wrong_count, mastered, last_wrong_at,
      question:questions(
        id, content, question_type, explanation,
        topic:topics(name),
        answers:answers(id, label, content, is_correct)
      )
    `)
    .eq('user_id', userId)
    .eq('mastered', false)
    .order('last_wrong_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================
// ADMIN — CRUD
// ============================================================
export async function createExam(exam) {
  const { data, error } = await supabase.from('exams').insert(exam).select().single();
  if (error) throw error;
  return data;
}

export async function updateExam(id, updates) {
  const { data, error } = await supabase
    .from('exams')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
}

export async function importExamFromJson(json) {
  const { data: exam, error: e1 } = await supabase
    .from('exams')
    .insert({
      title: json.title,
      description: json.description || null,
      grade_id: json.grade_id,
      subject_id: json.subject_id,
      exam_type: json.exam_type,
      semester: json.semester || null,
      school_year: json.school_year || null,
      duration: json.duration || 45,
      difficulty: json.difficulty || 'medium',
      source: json.source || null,
      is_published: true,
    })
    .select()
    .single();

  if (e1) throw e1;

  for (let i = 0; i < json.questions.length; i++) {
    const q = json.questions[i];
    const { data: question, error: e2 } = await supabase
      .from('questions')
      .insert({
        exam_id: exam.id,
        question_number: i + 1,
        content: q.content,
        question_type: q.type || 'single_choice',
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'medium',
      })
      .select()
      .single();

    if (e2) throw e2;

    if (q.options && q.options.length) {
      const answers = q.options.map((opt, idx) => ({
        question_id: question.id,
        label: opt.label,
        content: opt.content,
        is_correct: q.correctAnswer === opt.label,
        sort_order: idx,
      }));
      await supabase.from('answers').insert(answers);
    }
  }

  return exam;
}