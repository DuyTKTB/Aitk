/* ============================================================
   roadmapEvidence.js — GOM BẰNG CHỨNG HỌC TẬP TỪ CÁC NGUỒN CÓ THẬT
   ------------------------------------------------------------
   Ba nguồn, không tạo nguồn thứ tư:
   1) Firestore  submissions  — bài thi/luyện do giáo viên giao.
      Chỉ đọc bài của CHÍNH MÌNH (rules: studentId == auth.uid).
      Mỗi submission có detail[] theo index câu → ghép exam.questions[i].topicId.
   2) Supabase  exam_attempts + user_answers + questions.topic_id
      — bài làm độc lập qua link #exam/<token> (cùng nguồn topicProgress dùng).
   3) localStorage  cs-roadmap-v1:<uid>  — phiên luyện ngay trong Lộ trình.

   Nguyên tắc:
   • Không ném lỗi ra UI: trả { events, attempts, issues[] } để trang vẫn dùng
     được nguồn còn lại.
   • Cache sessionStorage 10 phút (máy yếu, tránh đọc lại mỗi lần vào trang).
   • Giới hạn số bản ghi để không kéo cả lịch sử về máy.
   ============================================================ */

import { supabase } from './supabase.js';
import { getSubmissionsByStudent, getExamById } from './classroom.js';
import { readStore, sessionsToEvents } from './roadmapStore.js';
import { builtinQuestions, builtinByIds, isBuiltinId } from '../data/roadmapExercises.js';

const CACHE_PREFIX = 'cs-roadmap-ev:';
const TTL = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 20;
const MAX_ATTEMPTS = 40;
const MAX_EVENTS = 3000;
const NET_TIMEOUT = 15000;

/* Mạng chậm: không để người học chờ vô hạn — quá hạn thì báo lỗi, dùng nguồn còn lại */
const withTimeout = (promise, ms = NET_TIMEOUT) => {
  let timer;
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Hết thời gian chờ máy chủ')), ms); }),
  ]);
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
};

/* ============================================================
   Cache
   ============================================================ */
function readCache(uid) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + uid);
    if (!raw) return null;
    const box = JSON.parse(raw);
    if (!box || Date.now() - box.t > TTL) return null;
    return box.data || null;
  } catch {
    return null;
  }
}

function writeCache(uid, data) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + uid, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* hết dung lượng: bỏ qua, lần sau đọc lại */
  }
}

export function invalidateEvidence(uid) {
  try {
    if (uid) sessionStorage.removeItem(CACHE_PREFIX + uid);
  } catch { /* */ }
}

/* ============================================================
   1. Firestore submissions → events
   ============================================================ */
async function loadFromSubmissions(uid, issues) {
  const events = [];
  const attempts = [];

  let subs = [];
  try {
    subs = await withTimeout(getSubmissionsByStudent(uid));
  } catch (e) {
    issues.push('Không đọc được bài nộp của lớp: ' + (e?.message || e));
    return { events, attempts };
  }
  if (!Array.isArray(subs) || subs.length === 0) return { events, attempts };

  const recent = [...subs]
    .sort((a, b) => toMs(b.submittedAt) - toMs(a.submittedAt))
    .slice(0, MAX_SUBMISSIONS);

  /* Tải đề SONG SONG, mỗi đề một lần (trước đây await tuần tự từng bài nộp → N+1) */
  const examCache = new Map();
  const examIds = Array.from(new Set(recent.map((s) => s.examId).filter(Boolean)));
  const exams = await Promise.all(
    examIds.map((id) => withTimeout(getExamById(id)).catch(() => null)),
  );
  examIds.forEach((id, i) => examCache.set(id, exams[i]));

  for (let i = 0; i < recent.length; i += 1) {
    const sub = recent[i];
    const at = toMs(sub.submittedAt);
    const exam = examCache.get(sub.examId) || null;

    attempts.push({
      id: sub.id || `${sub.examId}_${at}`,
      at,
      source: 'exam',
      title: exam?.title || 'Đề của lớp',
      correct: Number(sub.correctCount) || 0,
      total: Number(sub.totalQuestions) || (exam?.questions?.length || 0),
      timeSpent: Number(sub.timeSpent) || 0,
      chapterIds: [],
    });

    const detail = Array.isArray(sub.detail) ? sub.detail : [];
    const questions = Array.isArray(exam?.questions) ? exam.questions : [];
    detail.forEach((d, idx) => {
      const topicId = questions[idx]?.topicId || null;
      if (!topicId || typeof d?.isCorrect !== 'boolean') return;
      events.push({
        topicId,
        correct: d.isCorrect,
        at,
        source: 'exam',
        sessionId: sub.id || `${sub.examId}_${at}`,
      });
    });
  }

  return { events, attempts };
}

/* ============================================================
   2. Supabase attempts → events
   ============================================================ */
async function loadFromSupabase(uid, issues) {
  const events = [];
  const attempts = [];
  if (!supabase) return { events, attempts };

  let rows = [];
  try {
    const { data, error } = await withTimeout(supabase
      .from('exam_attempts')
      .select('id, score, correct_count, total_questions, time_spent, started_at, submitted_at, exam:exams(id, title)')
      .eq('user_id', uid)
      .order('started_at', { ascending: false })
      .limit(MAX_ATTEMPTS));
    if (error) throw error;
    rows = data || [];
  } catch (e) {
    issues.push('Không đọc được lượt làm bài trên máy chủ: ' + (e?.message || e));
    return { events, attempts };
  }
  if (rows.length === 0) return { events, attempts };

  /* Câu trả lời của chính mình */
  let answers = [];
  try {
    const groups = chunk(rows.map((r) => r.id), 15);
    for (let i = 0; i < groups.length; i += 1) {
      const { data, error } = await withTimeout(supabase
        .from('user_answers')
        .select('attempt_id, question_id, is_correct')
        .in('attempt_id', groups[i]));
      if (error) throw error;
      answers = answers.concat(data || []);
    }
  } catch (e) {
    issues.push('Không đọc được câu trả lời chi tiết: ' + (e?.message || e));
  }

  /* question → topic */
  const topicOf = {};
  if (answers.length) {
    try {
      const qids = Array.from(new Set(answers.map((a) => a.question_id).filter(Boolean)));
      const groups = chunk(qids, 150);
      for (let i = 0; i < groups.length; i += 1) {
        const { data, error } = await withTimeout(supabase
          .from('questions')
          .select('id, topic_id')
          .in('id', groups[i]));
        if (error) throw error;
        (data || []).forEach((q) => { if (q.topic_id) topicOf[q.id] = q.topic_id; });
      }
    } catch (e) {
      issues.push('Không đọc được chuyên đề của câu hỏi: ' + (e?.message || e));
    }
  }

  const atOf = {};
  rows.forEach((r) => {
    atOf[r.id] = toMs(r.submitted_at) || toMs(r.started_at);
    attempts.push({
      id: r.id,
      at: atOf[r.id],
      source: 'attempt',
      title: r.exam?.title || 'Bài luyện độc lập',
      correct: Number(r.correct_count) || 0,
      total: Number(r.total_questions) || 0,
      score: r.score,
      timeSpent: Number(r.time_spent) || 0,
    });
  });

  answers.forEach((a) => {
    const topicId = topicOf[a.question_id];
    if (!topicId) return;
    events.push({
      topicId,
      correct: a.is_correct === true,
      at: atOf[a.attempt_id] || 0,
      source: 'attempt',
      sessionId: a.attempt_id,
    });
  });

  return { events, attempts };
}

/* Phiên luyện trên thiết bị → dòng "hoạt động gần đây" (dùng chung cho trang & loadEvidence) */
export function localAttemptsOf(sessions = []) {
  return (sessions || []).map((s) => ({
    id: s.id,
    at: s.at,
    source: 'practice',
    title: 'Luyện trong Lộ trình',
    correct: s.correct,
    total: s.total,
    timeSpent: Math.round((s.durationMs || 0) / 1000),
    topicId: s.topicId,
  }));
}

/* ============================================================
   3. Gộp tất cả
   ============================================================ */
export async function loadEvidence(uid, { force = false } = {}) {
  const issues = [];
  if (!uid) return { events: [], attempts: [], issues: ['Chưa đăng nhập'] };

  /* Phiên luyện trên thiết bị luôn đọc tươi (ghi rất nhẹ) */
  const store = readStore(uid);
  const localSessions = store.sessions || [];
  const localEvents = sessionsToEvents(localSessions);
  const localAttempts = localAttemptsOf(localSessions);

  let remote = force ? null : readCache(uid);
  if (!remote) {
    const [subs, supa] = await Promise.all([
      loadFromSubmissions(uid, issues),
      loadFromSupabase(uid, issues),
    ]);
    remote = {
      events: subs.events.concat(supa.events).slice(-MAX_EVENTS),
      attempts: subs.attempts.concat(supa.attempts),
    };
    /* Chỉ cache khi đọc được ít nhất một nguồn VÀ không có nguồn nào lỗi
       (cache dữ liệu thiếu một nguồn sẽ che lỗi suốt 10 phút) */
    const hasData = subs.events.length || supa.events.length || subs.attempts.length || supa.attempts.length;
    if (hasData && issues.length === 0) {
      writeCache(uid, remote);
    }
  }

  const events = remote.events.concat(localEvents).slice(-MAX_EVENTS);
  const attempts = remote.attempts
    .concat(localAttempts)
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, 30);

  return {
    events,
    attempts,
    sessions: localSessions,
    goal: store.goal,
    issues,
    /* Phần lấy từ mạng, tách riêng để trang tự ghép phiên luyện mới mà không cần tải lại */
    remoteEvents: remote.events,
    remoteAttempts: remote.attempts,
  };
}

/* ============================================================
   3.1. Độ phủ ngân hàng câu hỏi (chỉ đếm, không kéo dữ liệu về)
   Đây là lý do phổ biến nhất khiến Lộ trình trống: câu hỏi chưa
   được gắn chuyên đề nên không quy được về chương nào.
   ============================================================ */
export async function loadBankCoverage() {
  if (!supabase) return { total: 0, tagged: 0, error: 'Chưa cấu hình Supabase' };
  try {
    const [all, tagged] = await Promise.all([
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }).not('topic_id', 'is', null),
    ]);
    if (all.error) throw all.error;
    const total = all.count || 0;
    const taggedCount = tagged.count || 0;
    return {
      total,
      tagged: taggedCount,
      untagged: Math.max(0, total - taggedCount),
      error: tagged.error ? tagged.error.message : null,
    };
  } catch (e) {
    return { total: 0, tagged: 0, error: e?.message || 'Không đếm được ngân hàng câu hỏi' };
  }
}

/* ============================================================
   4. Câu hỏi thật cho phiên luyện của một chương
   ------------------------------------------------------------
   Chỉ lấy câu thuộc đề ĐÃ XUẤT BẢN, dạng một đáp án đúng.
   Hỗ trợ cả question_type 'single_choice' và 'mcq' (dữ liệu hiện có
   trong Supabase dùng 'mcq' — nếu chỉ lọc single_choice sẽ ra rỗng).
   ============================================================ */
/* Chuẩn hoá 1 dòng questions + answers → câu hỏi dùng được.
   Bỏ câu không có đúng 1 đáp án đúng, thiếu đáp án, hoặc nội dung rỗng.
   Tách riêng để test được mà không cần mạng. */
export function mapQuestionRows(rows = []) {
  const clean = [];
  (rows || []).forEach((row) => {
    const opts = [...(row.answers || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const right = opts.filter((a) => a.is_correct);
    const texts = opts.map((a) => String(a.content || '').trim());
    if (right.length !== 1 || texts.length < 2 || texts.some((t) => !t)) return;
    const q = String(row.content || '').trim();
    if (!q) return;
    clean.push({
      id: String(row.id),
      q,
      options: texts,
      correct: opts.findIndex((a) => a.is_correct),
      explain: row.explanation || '',
      difficulty: row.difficulty || '',
    });
  });
  return clean;
}

/* Lấy đúng danh sách câu theo id (dùng cho phiên ôn "câu từng sai" và thẻ ghi nhớ đến hạn).
   Hỗ trợ cả id từ ngân hàng Supabase lẫn id tích hợp "bi-<topicId>-<số>". */
export async function loadQuestionsByIds(ids = []) {
  if (!ids.length) return { questions: [], error: null };
  const strIds = ids.map((id) => String(id));
  const builtinIds = strIds.filter((id) => isBuiltinId(id));
  const remoteIds = strIds.filter((id) => !isBuiltinId(id));

  const byId = new Map();
  builtinByIds(builtinIds).forEach((q) => byId.set(q.id, q));

  let error = null;
  if (remoteIds.length && supabase) {
    try {
      const { data, error: qErr } = await withTimeout(supabase
        .from('questions')
        .select(`
          id, content, explanation, difficulty, topic_id, question_type,
          exams!inner(is_published),
          answers(content, is_correct, label, sort_order)
        `)
        .eq('exams.is_published', true)
        .in('question_type', ['single_choice', 'mcq'])
        .in('id', remoteIds.slice(0, 100)));
      if (qErr) throw qErr;
      mapQuestionRows(data).forEach((q) => byId.set(q.id, q));
    } catch (e) {
      error = e?.message || 'Không tải được câu hỏi cũ';
    }
  }

  /* Giữ đúng thứ tự ưu tiên đã tính từ lịch ôn */
  const ordered = strIds.map((id) => byId.get(id)).filter(Boolean);
  return { questions: ordered, error: ordered.length ? null : error };
}

/* Phiên ôn: câu từng sai trước, sau đó bù bằng câu khác cùng chương */
export async function loadReviewQuestions(topicId, { wrongIds = [], limit = 10, level = 'all' } = {}) {
  const want = (wrongIds || []).slice(0, limit);
  let picked = [];
  let error = null;
  if (want.length) {
    const r = await loadQuestionsByIds(want);
    picked = level === 'all' || !level
      ? r.questions
      : r.questions.filter((q) => (q.level || q.difficulty) === level);
    error = r.error;
  }
  if (picked.length < limit) {
    const pool = await loadPracticeQuestions(topicId, { limit: Math.max(limit * 2, 16), level });
    const seen = new Set(picked.map((q) => q.id));
    const fill = pool.questions.filter((q) => !seen.has(q.id));
    picked = picked.concat(fill.slice(0, limit - picked.length));
    if (!error) error = pool.error;
  }
  return { questions: picked.slice(0, limit), error, fromReview: Math.min(want.length, picked.length) };
}

export async function loadPracticeQuestions(topicId, { limit = 10, seenIds = null, level = 'all' } = {}) {
  if (!topicId) return { questions: [], error: null, total: 0 };

  let remoteClean = [];
  let remoteError = null;
  if (supabase) {
    try {
      const { data, error } = await withTimeout(supabase
        .from('questions')
        .select(`
          id, content, explanation, difficulty, topic_id, question_type,
          exams!inner(is_published),
          answers(content, is_correct, label, sort_order)
        `)
        .eq('exams.is_published', true)
        .in('question_type', ['single_choice', 'mcq'])
        .eq('topic_id', topicId)
        .limit(60));
      if (error) throw error;
      remoteClean = mapQuestionRows(data).filter((q) => {
        if (!level || level === 'all') return true;
        return (q.level || q.difficulty) === level;
      });
    } catch (e) {
      remoteError = e?.message || 'Không tải được câu hỏi từ máy chủ';
    }
  }

  /* Bổ sung bằng bộ câu hỏi biên soạn sẵn (luôn khả dụng kể cả offline / chưa gắn topic_id) */
  const builtin = builtinQuestions(topicId, { level });
  const clean = remoteClean.concat(builtin);

  /* Trộn nhẹ để mỗi lần luyện không ra đúng thứ tự cũ */
  for (let i = clean.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clean[i], clean[j]] = [clean[j], clean[i]];
  }

  /* Ưu tiên câu CHƯA làm: giữ nguyên thứ tự ngẫu nhiên trong từng nhóm (sort ổn định) */
  if (seenIds && seenIds.size) {
    clean.sort((a, b) => Number(seenIds.has(a.id)) - Number(seenIds.has(b.id)));
  }

  return {
    questions: clean.slice(0, limit),
    error: clean.length ? null : remoteError,
    total: clean.length,
    remoteCount: remoteClean.length,
    builtinCount: builtin.length,
    unseen: seenIds ? clean.filter((q) => !seenIds.has(q.id)).length : clean.length,
  };
}

/* Gop evidence thanh { topicId: { correct, total } } — dung chung cho
   RoadmapCard (hook topicProgress) va bat ky noi nao khac. */
export function summarizeByTopic(events = []) {
  const out = {};
  (events || []).forEach((e) => {
    if (!e || !e.topicId) return;
    if (!out[e.topicId]) out[e.topicId] = { correct: 0, total: 0 };
    out[e.topicId].total += 1;
    if (e.correct === true) out[e.topicId].correct += 1;
  });
  return out;
}
