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
   - Chống infinite loop: cờ isRemoteUpdate
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
  const isRemoteUpdate = useRef(false);
  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
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
        if (s !== null) {
          const parsed = JSON.parse(s);
          if (JSON.stringify(parsed) !== JSON.stringify(cur.current)) {
            isRemoteUpdate.current = true;
            setValue(parsed);
          }
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

export const STREAK_KEY = 'cs-streak-v2';
export const LEGACY_STREAK_KEY = 'cs-streak';
export const STREAK_CHANGE_EVENT = 'cs-streak-change';

export function getStreakData() {
  try {
    let cur = { last: '', n: 0, total: 0 };
    const v2 = localStorage.getItem(STREAK_KEY);
    if (v2) {
      try {
        const parsed = JSON.parse(v2);
        if (parsed && typeof parsed === 'object') {
          cur = {
            last: parsed.last || '',
            n: Number(parsed.n) || 0,
            total: Number(parsed.total) || Number(parsed.n) || 0,
          };
        }
      } catch { /* ignore */ }
    }
    const v1 = localStorage.getItem(LEGACY_STREAK_KEY);
    if (v1) {
      try {
        const p1 = JSON.parse(v1);
        if (p1 && typeof p1 === 'object') {
          const n1 = Number(p1.n) || 0;
          const total1 = Number(p1.total) || n1;
          const last1 = p1.last || '';
          if (n1 > cur.n || total1 > cur.total || (!cur.last && last1)) {
            cur = {
              last: cur.last || last1,
              n: Math.max(cur.n, n1),
              total: Math.max(cur.total, total1),
            };
            localStorage.setItem(STREAK_KEY, JSON.stringify(cur));
          }
        }
      } catch { /* ignore */ }
    }
    return cur;
  } catch {
    return { last: '', n: 0, total: 0 };
  }
}

export function recordDailyStreak() {
  try {
    const cur = getStreakData();
    const next = studyToday(cur);
    const raw = JSON.stringify(next);
    localStorage.setItem(STREAK_KEY, raw);
    localStorage.setItem(LEGACY_STREAK_KEY, raw);
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent(STREAK_CHANGE_EVENT, { detail: next }));
        window.dispatchEvent(new CustomEvent('cs-ls', { detail: STREAK_KEY }));
        window.dispatchEvent(new CustomEvent('cs-ls', { detail: LEGACY_STREAK_KEY }));
      }
    } catch { /* ignore in non-browser env */ }
    return next;
  } catch {
    return { last: '', n: 0, total: 0 };
  }
}

export function useLiveStreak() {
  const [streakObj, setStreakObj] = useState(getStreakData);

  useEffect(() => {
    const sync = () => setStreakObj(getStreakData());
    window.addEventListener(STREAK_CHANGE_EVENT, sync);
    const onCsLs = (e) => {
      if (e.detail === STREAK_KEY || e.detail === LEGACY_STREAK_KEY) sync();
    };
    window.addEventListener('cs-ls', onCsLs);
    const onStorage = (e) => {
      if (e.key === STREAK_KEY || e.key === LEGACY_STREAK_KEY) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STREAK_CHANGE_EVENT, sync);
      window.removeEventListener('cs-ls', onCsLs);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const count = liveStreak(streakObj);
  const isToday = streakObj?.last === dayKey();
  return { count, streakObj, isToday, setStreakObj, recordDailyStreak };
}

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