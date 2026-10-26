/* ============================================================
   topicProgress.js — TIẾN ĐỘ THEO CHUYÊN ĐỀ (số liệu THẬT)
   ------------------------------------------------------------
   Nguồn dữ liệu: exam_attempts → user_answers → questions.topic_id
   (user_answers không có user_id nên phải đi qua attempt của mình)

   Nguyên tắc:
   - Chưa có câu nào → KHÔNG trả 0%, trả null để UI hiện "chưa luyện".
   - Lỗi mạng / RLS → trả map rỗng, không làm sập trang chủ.
   - Cache 30 phút trong sessionStorage để không query lại mỗi lần
     vào Home (quan trọng với máy yếu).
   ============================================================ */

import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const CACHE_PREFIX = 'cs-topic-progress:';
const TTL = 30 * 60 * 1000;
const MAX_ATTEMPTS = 60;

function readCache(uid) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + uid);
    if (!raw) return null;
    const box = JSON.parse(raw);
    if (!box || Date.now() - box.t > TTL) return null;
    return box.map || null;
  } catch {
    return null;
  }
}

function writeCache(uid, map) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + uid, JSON.stringify({ t: Date.now(), map }));
  } catch {
    /* private mode */
  }
}

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function loadFromDb(uid) {
  if (!supabase) return {};

  /* 1) Các lượt thi gần đây của chính mình */
  const { data: attempts, error: e1 } = await supabase
    .from('exam_attempts')
    .select('id')
    .eq('user_id', uid)
    .order('started_at', { ascending: false })
    .limit(MAX_ATTEMPTS);

  if (e1) throw e1;
  if (!attempts || attempts.length === 0) return {};

  /* 2) Câu trả lời trong các lượt đó */
  let answers = [];
  const attemptChunks = chunk(attempts.map((a) => a.id), 15);
  for (let i = 0; i < attemptChunks.length; i++) {
    const { data, error } = await supabase
      .from('user_answers')
      .select('question_id,is_correct')
      .in('attempt_id', attemptChunks[i]);
    if (error) throw error;
    if (data) answers = answers.concat(data);
  }
  if (answers.length === 0) return {};

  /* 3) Câu hỏi thuộc chuyên đề nào */
  const qids = Array.from(new Set(answers.map((a) => a.question_id).filter(Boolean)));
  const topicOf = {};
  const qChunks = chunk(qids, 150);
  for (let i = 0; i < qChunks.length; i++) {
    const { data, error } = await supabase
      .from('questions')
      .select('id,topic_id')
      .in('id', qChunks[i]);
    if (error) throw error;
    (data || []).forEach((q) => {
      if (q.topic_id) topicOf[q.id] = q.topic_id;
    });
  }

  /* 4) Gộp theo chuyên đề */
  const map = {};
  answers.forEach((a) => {
    const topic = topicOf[a.question_id];
    if (!topic) return;
    if (!map[topic]) map[topic] = { correct: 0, total: 0 };
    map[topic].total += 1;
    if (a.is_correct === true) map[topic].correct += 1;
  });
  return map;
}

/* Xoá cache sau khi làm bài xong (gọi ở nơi nộp bài nếu cần) */
export function invalidateTopicProgress(uid) {
  try {
    if (uid) sessionStorage.removeItem(CACHE_PREFIX + uid);
  } catch {
    /* */
  }
}

export function useTopicProgress(uid) {
  const [map, setMap] = useState(() => (uid && readCache(uid)) || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setMap({});
      return undefined;
    }

    const cached = readCache(uid);
    if (cached) {
      setMap(cached);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    loadFromDb(uid)
      .then((m) => {
        if (!alive) return;
        writeCache(uid, m);
        setMap(m);
      })
      .catch((e) => {
        /* Không có dữ liệu / RLS chặn: giữ trạng thái "chưa luyện" */
        console.warn('[topicProgress] bỏ qua:', e && (e.message || e));
      })
      .then(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [uid]);

  return { map, loading };
}
