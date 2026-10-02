// src/hooks/useGamification.js
// Quản lý XP, Level, Streak
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

const KEY = 'gamification-v1';

const LEVEL_XP = [0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7200];

export function useGamification() {
  const { user } = useAuth();
  const uid = user?.uid || user?.id;

  const [data, setData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  });

  // Load per user
  useEffect(() => {
    if (!uid) return;
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || '{}');
      setData(
        all[uid] || {
          xp: 0,
          level: 1,
          streak: 0,
          lastStudyDate: null,
          totalCorrect: 0,
          totalWrong: 0,
        }
      );
    } catch {
      /* noop */
    }
  }, [uid]);

  const save = useCallback(
    (next) => {
      if (!uid) return;
      try {
        const all = JSON.parse(localStorage.getItem(KEY) || '{}');
        all[uid] = next;
        localStorage.setItem(KEY, JSON.stringify(all));
        setData(next);
      } catch {
        /* noop */
      }
    },
    [uid]
  );

  // Cập nhật khi làm 1 câu
  const recordAnswer = useCallback(
    (isCorrect) => {
      const today = new Date().toISOString().slice(0, 10);
      let { xp, totalCorrect, totalWrong, streak, lastStudyDate } = data;

      if (isCorrect) {
        xp += 10;
        totalCorrect += 1;
      } else {
        xp += 2;
        totalWrong += 1;
      }

      // Streak
      if (lastStudyDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (lastStudyDate === yesterday) streak += 1;
        else streak = 1;
      }

      // Level
      let level = 1;
      for (let i = 0; i < LEVEL_XP.length; i++) {
        if (xp >= LEVEL_XP[i]) level = i + 1;
      }

      save({ xp, level, streak, lastStudyDate: today, totalCorrect, totalWrong });
    },
    [data, save]
  );

  const getLevelProgress = () => {
    const { xp, level } = data;
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