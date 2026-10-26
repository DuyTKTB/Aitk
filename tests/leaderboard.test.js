import { describe, it, expect } from 'vitest';
import { buildLeaderboard, groupSubmissions, rankLabel } from '../src/lib/leaderboard.js';

const members = [
  { id: 's1', name: 'An' },
  { id: 's2', name: 'Bình' },
  { id: 's3', name: 'Cường' },
  { id: 's4', name: 'Dung' },
];

const exams = [
  { id: 'e1', totalPoints: 10 },
  { id: 'e2', totalPoints: 40 },
];

const subs = {
  e1: [
    { examId: 'e1', studentId: 's1', score: 9, totalPoints: 10 },   // 90%
    { examId: 'e1', studentId: 's2', score: 5, totalPoints: 10 },   // 50%
    { examId: 'e1', studentId: 's3', score: 10, totalPoints: 10 },  // 100%
  ],
  e2: [
    { examId: 'e2', studentId: 's1', score: 20, totalPoints: 40 },  // 50%
    { examId: 'e2', studentId: 's3', score: 20, totalPoints: 40 },  // 50%
  ],
};

describe('buildLeaderboard', () => {
  const lb = buildLeaderboard({ members, exams, submissionsByExam: subs, uid: 's2' });

  it('xếp theo điểm TB giảm dần', () => {
    expect(lb.rows.map((r) => r.id)).toEqual(['s3', 's1', 's2']);
    expect(lb.rows[0].avgPct).toBe(75);   // (100 + 50) / 2
    expect(lb.rows[1].avgPct).toBe(70);   // (90 + 50) / 2
  });

  it('gắn hạng và đánh dấu "bạn"', () => {
    expect(lb.rows[2].rank).toBe(3);
    expect(lb.me?.id).toBe('s2');
    expect(lb.me.rank).toBe(3);
  });

  it('học sinh chưa làm bài không bị xếp bét mà bị loại khỏi bảng', () => {
    expect(lb.rows.find((r) => r.id === 's4')).toBeUndefined();
    expect(lb.unranked.map((r) => r.id)).toEqual(['s4']);
    expect(lb.totalRanked).toBe(3);
    expect(lb.totalStudents).toBe(4);
  });

  it('điểm TB toàn lớp chỉ tính người đã có bài', () => {
    expect(lb.classAvgPct).toBe(65); // (75 + 70 + 50) / 3
  });

  it('bài không có totalPoints bị bỏ qua, không tính là 0 điểm', () => {
    const out = buildLeaderboard({
      members: [{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }],
      exams: [{ id: 'e9', totalPoints: 0 }],
      submissionsByExam: { e9: [{ examId: 'e9', studentId: 'x', score: 5, totalPoints: 0 }] },
    });
    expect(out.rows).toHaveLength(0);
    expect(out.unranked.map((r) => r.id)).toEqual(['x', 'y']);
  });

  it('minAttempts lọc người làm quá ít bài', () => {
    const out = buildLeaderboard({ members, exams, submissionsByExam: subs, minAttempts: 2 });
    expect(out.rows.map((r) => r.id)).toEqual(['s3', 's1']);
  });
});

describe('tiện ích', () => {
  it('groupSubmissions gộp theo examId', () => {
    const m = groupSubmissions([{ examId: 'a' }, { examId: 'b' }, { examId: 'a' }]);
    expect(m.a).toHaveLength(2);
    expect(m.b).toHaveLength(1);
  });

  it('rankLabel', () => {
    expect(rankLabel(1)).toBe('Nhất');
    expect(rankLabel(4)).toBe('#4');
  });
});
