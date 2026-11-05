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

  it('maps legacy and modern profile query tabs correctly into the core tabs', () => {
    const mapTab = (raw) => {
      if (!raw) return 'overview';
      if (['vip', 'upgrade', 'tiers'].includes(raw)) return 'vip';
      if (['guide', 'overview'].includes(raw)) return 'overview';
      if (['achievements', 'stats'].includes(raw)) return 'achievements';
      if (['classroom', 'classes', 'friends', 'teacher'].includes(raw)) return 'classroom';
      if (['history', 'favorites'].includes(raw)) return 'history';
      if (['settings', 'info', 'security', 'invoice', 'notifications', 'referral', 'reports', 'feedback', 'billing'].includes(raw)) return 'settings';
      return 'overview';
    };

    expect(mapTab('vip')).toBe('vip');
    expect(mapTab('upgrade')).toBe('vip');
    expect(mapTab('billing')).toBe('settings');
    expect(mapTab('reports')).toBe('settings');
    expect(mapTab('referral')).toBe('settings');
    expect(mapTab('guide')).toBe('overview');
    expect(mapTab('stats')).toBe('achievements');
    expect(mapTab('teacher')).toBe('classroom');
    expect(mapTab('favorites')).toBe('history');
    expect(mapTab('security')).toBe('settings');
    expect(mapTab('feedback')).toBe('settings');
    expect(mapTab('unknown')).toBe('overview');
  });

  it('validates and protects activation code redemption against spam and invalid codes', async () => {
    const { redeemActivationCode, getSubscriptionAndQuota } = await import('../src/data/virtualExamsBank.js');
    const testUid = 'test-spam-user-' + Date.now();

    // 1. Mã không hợp lệ bị từ chối
    const rInvalid = await redeemActivationCode(testUid, 'XYZ999');
    expect(rInvalid.ok).toBe(false);
    expect(rInvalid.message).toContain('không hợp lệ');

    // 2. Mã quà tặng hợp lệ ELEC15 thành công
    const r1 = await redeemActivationCode(testUid, 'ELEC15');
    expect(r1.ok).toBe(true);
    expect(r1.addedPoints).toBe(15);

    // 3. Nhập lại cùng 1 mã bị chặn, không cho cộng điểm lần 2
    const rDuplicate = await redeemActivationCode(testUid, 'ELEC15');
    expect(rDuplicate.ok).toBe(false);
    expect(rDuplicate.message).toContain('đã được kích hoạt');

    // 4. Mã ELECVIP nâng cấp gói thành VIP
    const rVip = await redeemActivationCode(testUid, 'ELECVIP');
    expect(rVip.ok).toBe(true);
    expect(rVip.data.planName).toBe('VIP');
    expect(rVip.data.hearts).toBe(99);
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
