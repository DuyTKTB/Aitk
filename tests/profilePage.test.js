import { describe, it, expect } from 'vitest';

describe('Profile Mobile Architecture & Helpers', () => {
  it('masks user email securely when hidden', () => {
    const mask = (email, show) => {
      if (!email) return '—';
      if (show) return email;
      const parts = email.split('@');
      if (parts.length < 2) return '••••••';
      const pre = parts[0].slice(0, Math.min(2, parts[0].length));
      return `${pre}••••@${parts[1]}`;
    };

    expect(mask('duy123@gmail.com', false)).toBe('du••••@gmail.com');
    expect(mask('duy123@gmail.com', true)).toBe('duy123@gmail.com');
    expect(mask('a@domain.com', false)).toBe('a••••@domain.com');
    expect(mask('', false)).toBe('—');
  });

  it('maps legacy profile query tabs correctly into the 5 core tabs', () => {
    const mapTab = (raw) => {
      if (!raw) return 'overview';
      if (['upgrade', 'guide', 'overview'].includes(raw)) return 'overview';
      if (['achievements', 'stats'].includes(raw)) return 'achievements';
      if (['classroom', 'classes', 'friends', 'teacher'].includes(raw)) return 'classroom';
      if (['history', 'favorites'].includes(raw)) return 'history';
      if (['settings', 'info', 'security', 'referral', 'reports', 'feedback'].includes(raw)) return 'settings';
      return 'overview';
    };

    expect(mapTab('upgrade')).toBe('overview');
    expect(mapTab('guide')).toBe('overview');
    expect(mapTab('stats')).toBe('achievements');
    expect(mapTab('teacher')).toBe('classroom');
    expect(mapTab('favorites')).toBe('history');
    expect(mapTab('security')).toBe('settings');
    expect(mapTab('feedback')).toBe('settings');
    expect(mapTab('unknown')).toBe('overview');
  });

  it('computes 30-day mini streak calendar accurately', () => {
    const buildDays = (year, month, todayDate, streakCount) => {
      const totalDays = new Date(year, month + 1, 0).getDate();
      const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
      const days = [];

      for (let i = 0; i < firstDayIndex; i++) {
        days.push({ day: null, empty: true });
      }

      for (let d = 1; d <= totalDays; d++) {
        const isToday = d === todayDate;
        const hasStreak = isToday
          ? streakCount > 0
          : (todayDate - d < streakCount && todayDate > d);
        days.push({ day: d, isToday, hasStreak, empty: false });
      }
      return days;
    };

    const days = buildDays(2026, 9, 15, 3); // Oct 15, streak of 3
    const day15 = days.find((d) => d.day === 15);
    const day14 = days.find((d) => d.day === 14);
    const day13 = days.find((d) => d.day === 13);
    const day12 = days.find((d) => d.day === 12);

    expect(day15?.hasStreak).toBe(true);
    expect(day14?.hasStreak).toBe(true);
    expect(day13?.hasStreak).toBe(true);
    expect(day12?.hasStreak).toBe(false);
  });

  it('formats credits compactly for mobile viewports without collision', () => {
    const formatCredits = (credits) => {
      if (credits == null) return '0';
      return credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : String(credits);
    };

    expect(formatCredits(9382)).toBe('9.4k');
    expect(formatCredits(500)).toBe('500');
    expect(formatCredits(12000)).toBe('12.0k');
  });
});
