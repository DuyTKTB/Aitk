import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVietnamDateKey,
  getVietnamHoursRemaining,
  isUrgentCountdown,
  formatHoursRemaining,
  isValidStreakMessage,
  processFriendStreakUpdate,
  getFriendStreakStatus,
  canNudgeFriend,
  recordFriendNudge,
  calculateClassTarget,
  isStreakMilestone,
  getClassStreakStatus,
  canNudgeClassMember,
  recordClassMemberNudge,
  clearNudgeStorageForTesting,
} from '../src/lib/chatStreak.js';

describe('chatStreak - Vietnam UTC+7 date handling', () => {
  it('correctly calculates YYYY-MM-DD in Vietnam time zone (UTC+7)', () => {
    // 2026-10-29 17:00 UTC is 2026-10-30 00:00 UTC+7
    const utcMidnightMinus7 = Date.UTC(2026, 9, 29, 17, 0, 0);
    expect(getVietnamDateKey(utcMidnightMinus7)).toBe('2026-10-30');

    // 2026-10-29 16:59:59 UTC is 2026-10-29 23:59:59 UTC+7
    const utcBeforeMidnight = Date.UTC(2026, 9, 29, 16, 59, 59);
    expect(getVietnamDateKey(utcBeforeMidnight)).toBe('2026-10-29');
  });

  it('determines remaining hours and urgency threshold (< 3h)', () => {
    // 21:30 VN time (14:30 UTC) -> 2.5 hours remaining -> isUrgentCountdown = true
    const urgentTime = Date.UTC(2026, 9, 29, 14, 30, 0);
    expect(getVietnamHoursRemaining(urgentTime)).toBeCloseTo(2.5, 1);
    expect(isUrgentCountdown(urgentTime)).toBe(true);
    expect(formatHoursRemaining(urgentTime)).toBe('2h 30m');

    // 10:00 VN time (03:00 UTC) -> 14 hours remaining -> isUrgentCountdown = false
    const safeTime = Date.UTC(2026, 9, 29, 3, 0, 0);
    expect(isUrgentCountdown(safeTime)).toBe(false);
  });
});

describe('chatStreak - valid message qualification', () => {
  it('rejects empty, short, or whitespace-only messages', () => {
    expect(isValidStreakMessage('')).toBe(false);
    expect(isValidStreakMessage('  ')).toBe(false);
    expect(isValidStreakMessage('hi')).toBe(false); // < 3 chars
    expect(isValidStreakMessage('  ok ')).toBe(false); // trimmed length is 2
  });

  it('rejects duplicate of immediate preceding message', () => {
    expect(isValidStreakMessage('Chào bạn học nhé', 'Chào bạn học nhé')).toBe(false);
    expect(isValidStreakMessage('CHÀO BẠN HỌC NHÉ', 'chào bạn học nhé')).toBe(false);
  });

  it('rejects sticker-only messages', () => {
    expect(isValidStreakMessage(':smile:')).toBe(false);
    expect(isValidStreakMessage(':laugh: :heart:')).toBe(false);
  });

  it('accepts valid messages with text >= 3 characters', () => {
    expect(isValidStreakMessage('Chào bạn!', 'Một câu khác')).toBe(true);
    expect(isValidStreakMessage('Hôm nay học bài este nhé')).toBe(true);
  });
});

describe('chatStreak - Friend Streak Calculations', () => {
  it('increments streak only when both participants send valid messages today', () => {
    const tToday = Date.UTC(2026, 9, 29, 8, 0, 0);
    const prev = { count: 4, record: 5, lastDate: '2026-10-28', todayParticipants: {} };

    // User A sends message
    const resA = processFriendStreakUpdate(prev, 'uidA', 'uidB', tToday);
    expect(resA.bothActive).toBe(false);
    expect(resA.count).toBe(4); // count remains 4 until User B also chats

    // User B sends message
    const resB = processFriendStreakUpdate(resA, 'uidB', 'uidA', tToday);
    expect(resB.bothActive).toBe(true);
    expect(resB.count).toBe(5); // Now incremented to 5!
    expect(resB.record).toBe(5);
  });

  it('resets streak to 0 if a full day was skipped', () => {
    const tToday = Date.UTC(2026, 9, 29, 8, 0, 0);
    const expiredPrev = { count: 10, record: 10, lastDate: '2026-10-25', todayParticipants: {} };

    const resA = processFriendStreakUpdate(expiredPrev, 'uidA', 'uidB', tToday);
    expect(resA.count).toBe(0);
  });

  it('returns clean status text for UI display', () => {
    const today = getVietnamDateKey();
    const dataHalf = {
      count: 3,
      record: 5,
      lastDate: today,
      todayParticipants: { uidA: true },
    };

    const statusA = getFriendStreakStatus(dataHalf, 'uidA', 'uidB', 'Nam');
    expect(statusA.myDone).toBe(true);
    expect(statusA.peerDone).toBe(false);
    expect(statusA.statusText).toContain('Chờ Nam nhắn');

    const statusB = getFriendStreakStatus(dataHalf, 'uidB', 'uidA', 'Hoa');
    expect(statusB.myDone).toBe(false);
    expect(statusB.peerDone).toBe(true);
    expect(statusB.statusText).toContain('Chờ bạn nhắn');
  });
});

describe('chatStreak - Nudge limits', () => {
  beforeEach(() => {
    clearNudgeStorageForTesting();
  });

  it('allows nudge once per day per friend', () => {
    expect(canNudgeFriend('friend_123')).toBe(true);
    recordFriendNudge('friend_123');
    expect(canNudgeFriend('friend_123')).toBe(false);

    // Another friend should still be nudgeable
    expect(canNudgeFriend('friend_456')).toBe(true);
  });

  it('allows class member nudge once per day per member', () => {
    expect(canNudgeClassMember('mem_1', 'class_9A')).toBe(true);
    recordClassMemberNudge('mem_1', 'class_9A');
    expect(canNudgeClassMember('mem_1', 'class_9A')).toBe(false);
  });
});

describe('chatStreak - Class Streak Calculations', () => {
  it('calculates dynamic class target based on member count', () => {
    expect(calculateClassTarget(1)).toBe(1);
    expect(calculateClassTarget(2)).toBe(2);
    expect(calculateClassTarget(5)).toBe(2);
    expect(calculateClassTarget(10)).toBe(4);
    expect(calculateClassTarget(30)).toBe(11);
    expect(calculateClassTarget(40)).toBe(14);
  });

  it('identifies milestone days for confetti and achievements', () => {
    expect(isStreakMilestone(3)).toBe(true);
    expect(isStreakMilestone(7)).toBe(true);
    expect(isStreakMilestone(30)).toBe(true);
    expect(isStreakMilestone(100)).toBe(true);
    expect(isStreakMilestone(4)).toBe(false);
    expect(isStreakMilestone(12)).toBe(false);
  });

  it('calculates class streak completion and missing members', () => {
    const today = getVietnamDateKey();
    const classObj = {
      id: 'c1',
      name: 'Lớp 11A7',
      memberCount: 30, // target is 11
      streak: {
        count: 12,
        record: 15,
        lastDate: today,
        todayActive: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9'], // 9 active
      },
    };

    const status = getClassStreakStatus(classObj, 'u1');
    expect(status.target).toBe(11);
    expect(status.activeCount).toBe(9);
    expect(status.remainingNeeded).toBe(2);
    expect(status.completedToday).toBe(false);
    expect(status.iAmActive).toBe(true);
  });
});
