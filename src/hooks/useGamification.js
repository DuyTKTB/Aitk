import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

export const GAMIFICATION_KEY = 'gamification-v1';
export const GAMIFICATION_UPDATE_EVENT = 'cs-gamification-update';

export const LEVEL_XP = [0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7200];

export function getGamificationData(uid) {
  if (!uid) return { xp: 0, level: 1, streak: 0, lastStudyDate: null, totalCorrect: 0, totalWrong: 0 };
  try {
    const all = JSON.parse(localStorage.getItem(GAMIFICATION_KEY) || '{}');
    return all[uid] || { xp: 0, level: 1, streak: 0, lastStudyDate: null, totalCorrect: 0, totalWrong: 0 };
  } catch {
    return { xp: 0, level: 1, streak: 0, lastStudyDate: null, totalCorrect: 0, totalWrong: 0 };
  }
}

export function recordGamificationResult(uid, { correctCount = 0, wrongCount = 0 } = {}) {
  if (!uid) return;
  try {
    const all = JSON.parse(localStorage.getItem(GAMIFICATION_KEY) || '{}');
    const prev = all[uid] || {
      xp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: null,
      totalCorrect: 0,
      totalWrong: 0,
    };
    const today = new Date().toISOString().slice(0, 10);
    let { xp, totalCorrect, totalWrong, streak, lastStudyDate } = prev;

    xp += (correctCount || 0) * 10 + (wrongCount || 0) * 2;
    totalCorrect += (correctCount || 0);
    totalWrong += (wrongCount || 0);

    if (lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastStudyDate === yesterday) streak += 1;
      else streak = 1;
    }
    let level = 1;
    for (let i = 0; i < LEVEL_XP.length; i++) {
      if (xp >= LEVEL_XP[i]) level = i + 1;
    }
    const next = { xp, level, streak, lastStudyDate: today, totalCorrect, totalWrong };
    all[uid] = next;
    try {
      localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('[gamification] localStorage.setItem failed', e);
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATE_EVENT, { detail: { uid, ...next } }));
      } catch { /* ignore */ }
    }
    return next;
  } catch (e) {
    console.warn('[gamification] recordGamificationResult error', e);
  }
}

export function useGamification() {
  const { user } = useAuth();
  const uid = user?.uid || user?.id;

  const [data, setData] = useState(() => getGamificationData(uid));

  useEffect(() => {
    if (!uid) return;
    setData(getGamificationData(uid));

    const handleUpdate = (e) => {
      if (!e?.detail?.uid || e.detail.uid === uid) {
        setData(getGamificationData(uid));
      }
    };
    const handleStorage = (e) => {
      if (e.key === GAMIFICATION_KEY) {
        setData(getGamificationData(uid));
      }
    };

    window.addEventListener(GAMIFICATION_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(GAMIFICATION_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [uid]);

  const save = useCallback(
    (next) => {
      if (!uid) return;
      try {
        const all = JSON.parse(localStorage.getItem(GAMIFICATION_KEY) || '{}');
        all[uid] = next;
        localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(all));
        setData(next);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(GAMIFICATION_UPDATE_EVENT, { detail: { uid, ...next } }));
        }
      } catch {
        /* noop */
      }
    },
    [uid]
  );

  const recordAnswer = useCallback(
    (isCorrect) => {
      if (!uid) return;
      if (isCorrect) {
        recordGamificationResult(uid, { correctCount: 1, wrongCount: 0 });
      } else {
        recordGamificationResult(uid, { correctCount: 0, wrongCount: 1 });
      }
    },
    [uid]
  );

  const getLevelProgress = () => {
    const { xp = 0, level = 1 } = data || {};
    const currentMin = LEVEL_XP[level - 1] || 0;
    const nextMin = LEVEL_XP[level] || currentMin + 1000;
    const pct = ((xp - currentMin) / (nextMin - currentMin)) * 100;
    return {
      pct: Math.min(100, Math.max(0, pct)),
      current: xp - currentMin,
      needed: nextMin - currentMin,
      nextXp: nextMin,
    };
  };

  return { ...data, recordAnswer, getLevelProgress };
}
