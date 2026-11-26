import { describe, it, expect } from 'vitest';
import {
  normalizeUserForLeaderboard,
  rankClassesRealistic,
  rankStudentsRealistic,
  rankPersonalStreaksRealistic,
  rankSquadsRealistic,
  getClassMonogram,
} from '../src/lib/globalLeaderboardEngine.js';
import { getVietnamDateKey } from '../src/lib/chatStreak.js';

describe('globalLeaderboardEngine — Xếp hạng chuẩn thực tế', () => {
  it('chuẩn hóa đầy đủ streak dạng object, focusLive và đồng bộ streak trực tiếp của người xem', () => {
    const u1 = normalizeUserForLeaderboard(
      { uid: 'u1', displayName: 'Minh Anh', streak: { count: 6 }, xp: 420, focusLive: { totalMins: 40 } },
    );
    expect(u1.streak).toBe(6);
    expect(u1.xp).toBe(420);
    expect(u1.focusMins).toBe(40);
    expect(u1.meritScore).toBe(420 + 40 * 5 + 6 * 25);

    const me = normalizeUserForLeaderboard(
      { uid: 'me', displayName: 'Duy', public: { xp: 100, streak: 1 } },
      { currentUid: 'me', currentLiveStreak: 5 }
    );
    expect(me.streak).toBe(5);
  });

  it('xếp hạng lớp thực tế: lớp 40 thành viên & có thành viên học luôn xếp trên lớp 1 người 0 ngày', () => {
    const users = [
      normalizeUserForLeaderboard({ uid: 't1', displayName: 'Duyyy nè', role: 'teacher', public: { streak: 3, xp: 200 } }),
      normalizeUserForLeaderboard({ uid: 's1', displayName: 'An', public: { streak: 4, xp: 300 } }),
    ];
    const classes = [
      { id: 'c_empty1', name: 'Lớp Duy Tk', teacherId: 'x1', memberCount: 1, streak: { count: 0, record: 0 } },
      { id: 'c_real', name: 'Lớp 11A5', teacherId: 't1', memberIds: ['s1'], memberCount: 40, streak: { count: 0, record: 0 } },
      { id: 'c_empty2', name: 'Lớp Duy Tk', teacherId: 'x2', memberCount: 1, streak: { count: 0, record: 0 } },
    ];

    const ranked = rankClassesRealistic(classes, users);
    expect(ranked[0].name).toBe('Lớp 11A5');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].memberCount).toBe(40);
    expect(ranked[0].sumMemberStreaks).toBe(7); // t1(3) + s1(4)
    expect(ranked[1].rank).toBeNull(); // lớp 1 người 0 hoạt động -> chưa xếp hạng
  });

  it('reset chuỗi lớp đã quá hạn ngày Việt Nam (UTC+7) về 0', () => {
    const today = getVietnamDateKey();
    const classes = [
      { id: 'expired', name: 'Lớp Cũ', memberCount: 20, streak: { count: 10, record: 10, lastDate: '2020-01-01' } },
      { id: 'active', name: 'Lớp Active', memberCount: 15, streak: { count: 4, record: 4, lastDate: today, todayActive: ['u1', 'u2'] } },
    ];
    const ranked = rankClassesRealistic(classes, []);
    expect(ranked[0].id).toBe('active');
    expect(ranked[0].streak).toBe(4);
    expect(ranked[1].id).toBe('expired');
    expect(ranked[1].streak).toBe(0);
    expect(ranked[1].record).toBe(10);
  });

  it('xếp hạng học sinh chuẩn đồng hạng Olympic (1, 2, 2, 4) và tách riêng GV/Admin mặc định', () => {
    const users = [
      normalizeUserForLeaderboard({ uid: 'admin', displayName: 'Admin', role: 'admin', xp: 99999 }),
      normalizeUserForLeaderboard({ uid: 'a', displayName: 'An', xp: 500 }),
      normalizeUserForLeaderboard({ uid: 'b', displayName: 'Bình', xp: 300 }),
      normalizeUserForLeaderboard({ uid: 'c', displayName: 'Chi', xp: 300 }),
      normalizeUserForLeaderboard({ uid: 'd', displayName: 'Dũng', xp: 100 }),
      normalizeUserForLeaderboard({ uid: 'ghost', displayName: 'Chưa học', xp: 0 }),
    ];

    const ranked = rankStudentsRealistic(users, { includeStaff: false });
    expect(ranked.find((u) => u.uid === 'admin')).toBeUndefined();
    expect(ranked.map((u) => [u.uid, u.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
      ['d', 4],
      ['ghost', null],
    ]);
  });

  it('xếp hạng chuỗi cá nhân chỉ vinh danh người có chuỗi >= 1 ngày', () => {
    const users = [
      normalizeUserForLeaderboard({ uid: 'u1', displayName: 'A', public: { streak: 0, xp: 100 } }),
      normalizeUserForLeaderboard({ uid: 'u2', displayName: 'B', public: { streak: 5, xp: 20 } }),
    ];
    const ranked = rankPersonalStreaksRealistic(users);
    expect(ranked[0].uid).toBe('u2');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBeNull();
  });

  it('Quân đoàn NV1 KHÔNG hash ảo học sinh chưa chọn trường', () => {
    const users = [
      normalizeUserForLeaderboard({ uid: 'u1', displayName: 'Chưa chọn trường', xp: 500 }),
      normalizeUserForLeaderboard({ uid: 'u2', displayName: 'Chọn BKA', targetUniCode: 'BKA', xp: 300 }),
    ];
    const cutoffs = [
      { code: 'BKA', uni: 'ĐH Bách Khoa Hà Nội', group: 'Kỹ thuật', city: 'Hà Nội' },
      { code: 'NEU', uni: 'ĐH Kinh Tế Quốc Dân', group: 'Kinh tế', city: 'Hà Nội' },
      { code: 'FTU', uni: 'ĐH Ngoại Thương', group: 'Kinh tế', city: 'Hà Nội' },
    ];
    const squads = rankSquadsRealistic(users, cutoffs, {
      currentUid: 'me',
      mySquadMetrics: { code: 'NEU', uni: 'ĐH Kinh Tế Quốc Dân', power: 1200 },
      myStreak: 3,
    });
    // Chỉ có đúng 2 trường có người thật (BKA và NEU), FTU (0 người) không bị bịa số!
    expect(squads.map((s) => s.code).sort()).toEqual(['BKA', 'NEU']);
    expect(squads.find((s) => s.code === 'BKA').members).toBe(1);
    expect(squads.find((s) => s.code === 'NEU').members).toBe(1);
  });

  it('tạo chữ viết tắt biểu tượng lớp sạch đẹp', () => {
    expect(getClassMonogram('Lớp 11A5')).toBe('11A5');
    expect(getClassMonogram('Lớp Duy Tk')).toBe('DT');
    expect(getClassMonogram('12A1')).toBe('12A1');
  });
});
