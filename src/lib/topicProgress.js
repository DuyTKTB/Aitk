import { loadEvidence, summarizeByTopic } from './roadmapEvidence.js';
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
  /* MOT nguon duy nhat: roadmapEvidence da gop Firestore + Supabase + phien luyen
     va co cache rieng, nen khong query lai exam_attempts/user_answers o day. */
  const res = await loadEvidence(uid);
  return summarizeByTopic(res.events);
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
