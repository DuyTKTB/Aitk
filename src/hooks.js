import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  freshRecord,
  srsReview,
  mastery,
  isDue,
  dueCount,
  pickNext,
  stats,
} from './lib/srs.js';

/* ============================================================
   useState + LocalStorage, tự đồng bộ giữa các component
   ============================================================ */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const cur = useRef(value);
  cur.current = value;

  useEffect(() => {
    try {
      const raw = JSON.stringify(value);
      if (localStorage.getItem(key) !== raw) {
        localStorage.setItem(key, raw);
        dispatchEvent(new CustomEvent('cs-ls', { detail: key }));
      }
    } catch {
      /* bỏ qua khi bị chặn */
    }
  }, [key, value]);

  useEffect(() => {
    const on = (e) => {
      if (e.detail !== key) return;
      try {
        const s = localStorage.getItem(key);
        if (s !== null && s !== JSON.stringify(cur.current)) {
          setValue(JSON.parse(s));
        }
      } catch {
        /* bỏ qua */
      }
    };
    addEventListener('cs-ls', on);
    return () => removeEventListener('cs-ls', on);
  }, [key]);

  return [value, setValue];
}

/* ============================================================
   Ngày theo GIỜ ĐỊA PHƯƠNG
   ============================================================ */
const p2 = (n) => String(n).padStart(2, '0');
export const dayKey = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

export function studyToday(s) {
  if (s.last === dayKey()) return s;
  return {
    last: dayKey(),
    n: s.last === dayKey(Date.now() - 864e5) ? s.n + 1 : 1,
    total: (s.total || 0) + 1,
  };
}

export const liveStreak = (s) =>
  s.last === dayKey() || s.last === dayKey(Date.now() - 864e5) ? s.n : 0;

/* ============================================================
   useSRS — Spaced Repetition
   ============================================================ */
export function useSRS() {
  const [records, setRecords] = useLocalStorage('cs-srs', {});

  const get = useCallback(
    (z) => records[z] || freshRecord(),
    [records]
  );

  const record = useCallback(
    (z, quality) => {
      let next;
      setRecords((prev) => {
        const cur = prev[z] || freshRecord();
        next = srsReview(cur, quality);
        return { ...prev, [z]: next };
      });
      return next;
    },
    [setRecords]
  );

  const due = useMemo(() => dueCount(records), [records]);

  const getStats = useCallback(
    (elements) => stats(records, elements),
    [records]
  );

  const next = useCallback(
    (elements, lastZ) => pickNext(elements, records, lastZ),
    [records]
  );

  return {
    records,
    get,
    record,
    due,
    stats: getStats,
    pickNext: next,
    freshRecord,
    isDue,
    mastery,
  };
}