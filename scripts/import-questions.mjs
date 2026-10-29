#!/usr/bin/env node
/* ============================================================
   import-questions.mjs — Nhập câu hỏi ĐÃ GẮN CHUYÊN ĐỀ vào ngân hàng
   ------------------------------------------------------------
   Vì sao cần: Lộ trình kiến thức / thống kê theo chương chỉ hoạt động
   khi mỗi câu hỏi có `topic_id`. File này là đường nhập hàng loạt,
   có kiểm tra dữ liệu và chạy thử trước khi ghi.

   CÁCH DÙNG
     node scripts/import-questions.mjs --file data.json            # chạy thử (không ghi)
     node scripts/import-questions.mjs --file data.json --apply    # ghi thật
     node scripts/import-questions.mjs --rollback .import-log-xxx.json

   ĐỊNH DẠNG data.json
   {
     "examId": "uuid-cua-de-da-co",            // CÁCH 1: thêm vào đề có sẵn
     "exam": {                                  // CÁCH 2: tạo đề mới (bỏ examId)
       "title": "Đề giữa kì Hoá 11 - Cân bằng hoá học",
       "grade": "Lớp 11",
       "subject": "Hóa học",
       "duration": 45,
       "program": "2018",
       "description": "…",
       "publish": false
     },
     "questions": [
       {
         "content": "Nội dung câu hỏi…",
         "options": ["A", "B", "C", "D"],
         "correct": 1,
         "explanation": "Giải thích…",
         "topic_id": "c11-equilibrium",
         "difficulty": "medium",              // easy | medium | hard | extreme
         "question_type": "single_choice"     // single_choice | mcq
       }
     ]
   }

   BIẾN MÔI TRƯỜNG
     VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY  (đọc từ .env)
     hoặc SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (khuyến nghị cho ghi hàng loạt)
   ============================================================ */

import fs from 'fs';
import path from 'path';
import { CHEM_TOPICS } from '../src/data/chemTopics.js';

const args = process.argv.slice(2);
const getArg = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const next = args[i + 1];
  return next && !next.startsWith('--') ? next : true;
};
const has = (name) => args.includes(`--${name}`);

const FILE = getArg('file');
const APPLY = has('apply');
const ROLLBACK = getArg('rollback');
const DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

/* ---------- ENV ---------- */
function loadEnv() {
  const out = { ...process.env };
  const p = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(p)) {
    fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) return;
      const i = line.indexOf('=');
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!out[k]) out[k] = v;
    });
  }
  const url = out.SUPABASE_URL || out.VITE_SUPABASE_URL;
  const key = out.SUPABASE_SERVICE_ROLE_KEY || out.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('✗ Thiếu SUPABASE_URL / VITE_SUPABASE_URL hoặc khoá Supabase trong .env');
    process.exit(1);
  }
  if (!out.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠ Đang dùng anon key để GHI. Nếu bảng bật RLS, hãy dùng SUPABASE_SERVICE_ROLE_KEY.\n');
  }
  return { url, key };
}

const { url: SB_URL, key: SB_KEY } = loadEnv();
const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

async function api(pathname, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${pathname}`, { headers, ...init });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body && body.message ? body.message : text;
    throw new Error(`${res.status} ${msg || res.statusText} (${pathname})`);
  }
  return body;
}

/* ---------- TIỆN ÍCH ---------- */
const normText = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

const TOPIC_IDS = new Set(CHEM_TOPICS.map((t) => t.id));
const TOPIC_NAMES = new Map(CHEM_TOPICS.map((t) => [t.id, t.name]));

function validate(doc) {
  const errors = [];
  const warnings = [];
  const questions = Array.isArray(doc.questions) ? doc.questions : [];
  if (!questions.length) errors.push('Danh sách "questions" rỗng.');
  if (!doc.examId && !doc.exam) errors.push('Cần "examId" (đề có sẵn) hoặc "exam" (tạo đề mới).');

  const seen = new Map();
  const clean = [];

  questions.forEach((q, i) => {
    const at = `Câu #${i + 1}`;
    const content = String(q.content || '').trim();
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o ?? '').trim()) : [];
    const correct = Number(q.correct);

    if (!content) errors.push(`${at}: thiếu "content".`);
    if (options.length < 2) errors.push(`${at}: cần ít nhất 2 đáp án.`);
    if (options.some((o) => !o)) errors.push(`${at}: có đáp án rỗng.`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      errors.push(`${at}: "correct" phải là chỉ số 0..${Math.max(0, options.length - 1)}.`);
    }
    if (!q.topic_id || !TOPIC_IDS.has(q.topic_id)) {
      errors.push(`${at}: "topic_id" không hợp lệ (${q.topic_id || 'trống'}). Dùng id trong src/data/chemTopics.js.`);
    }
    if (q.difficulty && !DIFFICULTIES.includes(q.difficulty)) {
      warnings.push(`${at}: difficulty "${q.difficulty}" lạ, dùng "medium".`);
    }
    const dupKey = normText(content);
    if (seen.has(dupKey)) warnings.push(`${at}: trùng nội dung với câu #${seen.get(dupKey) + 1}.`);
    else seen.set(dupKey, i);

    if (!content || options.length < 2 || options.some((o) => !o) || !Number.isInteger(correct)) return;

    clean.push({
      content,
      options,
      correct,
      explanation: String(q.explanation || '').trim(),
      topic_id: q.topic_id,
      difficulty: DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'medium',
      question_type: q.question_type === 'mcq' ? 'mcq' : 'single_choice',
      score: q.score ?? null,
    });
  });

  return { errors, warnings, clean };
}

async function resolveExam(doc, { apply }) {
  if (doc.examId) {
    const rows = await api(`exams?select=id,title,grade_id,subject_id&id=eq.${encodeURIComponent(doc.examId)}&limit=1`);
    if (!rows || !rows.length) throw new Error(`Không tìm thấy đề có id ${doc.examId}`);
    return { exam: rows[0], created: false };
  }

  const e = doc.exam || {};
  const [grades, subjects] = await Promise.all([
    api(`grades?select=id,name&name=eq.${encodeURIComponent(e.grade || 'Lớp 11')}&limit=1`),
    api(`subjects?select=id,name&name=eq.${encodeURIComponent(e.subject || 'Hóa học')}&limit=1`),
  ]);
  if (!grades || !grades.length) throw new Error(`Không tìm thấy khối "${e.grade}" trong bảng grades`);
  if (!subjects || !subjects.length) throw new Error(`Không tìm thấy môn "${e.subject}" trong bảng subjects`);

  const payload = {
    title: e.title || 'Đề nhập từ script',
    description: e.description || '',
    grade_id: grades[0].id,
    subject_id: subjects[0].id,
    exam_type: e.exam_type || 'practice',
    semester: e.semester || null,
    school_year: e.school_year || null,
    program: e.program || '2018',
    duration: Number(e.duration) || 45,
    difficulty: e.difficulty || 'medium',
    source: e.source || 'import-script',
    attempt_count: 0,
    is_published: !!e.publish,
  };
  if (!apply) return { exam: { id: '(sẽ tạo)', ...payload }, created: true };
  const inserted = await api('exams?select=id,title', {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  return { exam: inserted[0], created: true };
}

async function insertAll(examId, questions, { startNumber }) {
  const created = [];
  const CHUNK = 40;
  for (let i = 0; i < questions.length; i += CHUNK) {
    const slice = questions.slice(i, i + CHUNK).map((q, k) => ({
      exam_id: examId,
      question_number: startNumber + i + k,
      content: q.content,
      question_type: q.question_type,
      explanation: q.explanation || null,
      topic_id: q.topic_id,
      difficulty: q.difficulty,
      ...(q.score === null ? {} : { score: q.score }),
    }));
    const rows = await api('questions?select=id,question_number', {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(slice),
    });
    rows.forEach((r) => created.push(r));
  }

  const answerRows = [];
  questions.forEach((q, i) => {
    const qid = created[i] && created[i].id;
    if (!qid) return;
    q.options.forEach((opt, oi) => {
      answerRows.push({
        question_id: qid,
        label: String.fromCharCode(65 + oi),
        content: opt,
        is_correct: oi === q.correct,
        sort_order: oi + 1,
      });
    });
  });

  for (let i = 0; i < answerRows.length; i += 200) {
    await api('answers', {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(answerRows.slice(i, i + 200)),
    });
  }

  return { questions: created, answers: answerRows.length };
}

async function rollback(logFile) {
  const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  const ids = (log.questions || []).map((q) => q.id).filter(Boolean);
  if (!ids.length) { console.log('Log không có câu nào để xoá.'); return; }
  const list = ids.map((id) => `"${id}"`).join(',');
  await api(`answers?question_id=in.(${list})`, { method: 'DELETE' });
  await api(`questions?id=in.(${list})`, { method: 'DELETE' });
  console.log(`✓ Đã xoá ${ids.length} câu và đáp án tương ứng.`);
}

/* ---------- MAIN ---------- */
(async () => {
  try {
    if (ROLLBACK) { await rollback(ROLLBACK); return; }
    if (!FILE) {
      console.error('Thiếu --file data.json. Xem hướng dẫn ở đầu scripts/import-questions.mjs');
      process.exit(1);
    }
    const doc = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), FILE), 'utf8'));
    const { errors, warnings, clean } = validate(doc);

    const byTopic = {};
    clean.forEach((q) => { byTopic[q.topic_id] = (byTopic[q.topic_id] || 0) + 1; });

    console.log(`\n${APPLY ? 'GHI THẬT' : 'CHẠY THỬ (không ghi)'} · ${clean.length}/${(doc.questions || []).length} câu hợp lệ`);
    console.log('Theo chuyên đề:');
    Object.keys(byTopic).sort().forEach((id) => {
      console.log(`  ${(TOPIC_NAMES.get(id) || id).padEnd(32)} ${byTopic[id]} câu  [${id}]`);
    });
    if (warnings.length) {
      console.log(`\nCảnh báo (${warnings.length}):`);
      warnings.slice(0, 20).forEach((w) => console.log('  • ' + w));
    }
    if (errors.length) {
      console.error(`\nLỖI (${errors.length}) — dừng, không ghi gì:`);
      errors.slice(0, 30).forEach((e) => console.error('  ✗ ' + e));
      process.exit(2);
    }

    const { exam, created } = await resolveExam(doc, { apply: APPLY });
    console.log(`\nĐề: ${exam.title || exam.id}${created ? ' (tạo mới)' : ''}`);

    if (!APPLY) {
      console.log('\nChạy lại với --apply để ghi vào Supabase.\n');
      return;
    }

    const existing = await api(`questions?select=question_number&exam_id=eq.${encodeURIComponent(exam.id)}&order=question_number.desc&limit=1`);
    const startNumber = existing && existing.length ? (existing[0].question_number || 0) + 1 : 1;

    const out = await insertAll(exam.id, clean, { startNumber });
    const logName = `.import-log-${Date.now()}.json`;
    fs.writeFileSync(path.resolve(process.cwd(), logName), JSON.stringify({
      at: new Date().toISOString(),
      examId: exam.id,
      questions: out.questions,
    }, null, 2));

    console.log(`\n✓ Đã nhập ${out.questions.length} câu + ${out.answers} đáp án.`);
    console.log(`  Log để hoàn tác: ${logName}`);
    console.log(`  Hoàn tác: node scripts/import-questions.mjs --rollback ${logName}\n`);
  } catch (e) {
    console.error('\n✗ Lỗi:', e.message);
    process.exit(1);
  }
})();
