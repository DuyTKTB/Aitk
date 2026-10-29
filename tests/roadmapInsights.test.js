import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dailyActivity, streakOf, dayKey, MASTERED_SCORE, DAY } from '../src/lib/roadmapEngine.js';
import { rateMany, dueCards, readCards } from '../src/lib/flashcardStore.js';
import { buildStudyPlan, parseISODate, tomorrowISO, DEFAULT_PLAN } from '../src/lib/studyPlan.js';

const at = (y, m, d, h = 10) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 10, 27, 9);
const ev = (t, ok = true) => ({ topicId: 'x', correct: ok, at: t });

describe('dailyActivity', () => {
  it('trả đủ số ngày, ngày cuối là hôm nay, đếm đúng/sai theo ngày', () => {
    const rows = dailyActivity([ev(at(2026, 10, 27, 8)), ev(at(2026, 10, 27, 9), false), ev(at(2026, 10, 25))], 7, NOW);
    expect(rows).toHaveLength(7);
    expect(rows[6].isToday).toBe(true);
    expect(rows[6].count).toBe(2);
    expect(rows[6].correct).toBe(1);
    expect(rows[4].count).toBe(1);
    expect(rows[0].count).toBe(0);
  });
  it('câu lúc 00:30 giờ địa phương thuộc ngày mới', () => {
    const rows = dailyActivity([ev(at(2026, 10, 27, 0) + 30 * 60000)], 3, NOW);
    expect(rows[2].count).toBe(1);
    expect(rows[1].count).toBe(0);
  });
  it('bỏ qua sự kiện ngoài khoảng và không lỗi với dữ liệu rỗng', () => {
    expect(dailyActivity([ev(at(2026, 1, 1))], 7, NOW).every((r) => r.count === 0)).toBe(true);
    expect(dailyActivity(undefined, 5, NOW)).toHaveLength(5);
  });
});

describe('streakOf', () => {
  it('đếm chuỗi liên tiếp tới hôm nay', () => {
    const s = streakOf([ev(at(2026, 10, 27)), ev(at(2026, 10, 26)), ev(at(2026, 10, 25))], NOW);
    expect(s.current).toBe(3);
    expect(s.activeToday).toBe(true);
  });
  it('chưa làm hôm nay nhưng hôm qua có → chuỗi chưa đứt', () => {
    const s = streakOf([ev(at(2026, 10, 26)), ev(at(2026, 10, 25))], NOW);
    expect(s.current).toBe(2);
    expect(s.activeToday).toBe(false);
  });
  it('bỏ lỡ cả hôm qua → chuỗi về 0 nhưng vẫn nhớ chuỗi dài nhất', () => {
    const s = streakOf([ev(at(2026, 10, 20)), ev(at(2026, 10, 21)), ev(at(2026, 10, 22)), ev(at(2026, 10, 24))], NOW);
    expect(s.current).toBe(0);
    expect(s.best).toBe(3);
  });
  it('nhiều câu trong một ngày chỉ tính một ngày; rỗng → 0', () => {
    expect(streakOf([ev(at(2026, 10, 27, 8)), ev(at(2026, 10, 27, 20))], NOW).current).toBe(1);
    expect(streakOf([], NOW)).toMatchObject({ current: 0, best: 0, totalDays: 0 });
  });
});

describe('ngưỡng chung', () => {
  it('MASTERED_SCORE = 80', () => expect(MASTERED_SCORE).toBe(80));
});

describe('flashcardStore: theo chương', () => {
  const mem = new Map();
  beforeEach(() => {
    mem.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => { mem.set(k, String(v)); },
      removeItem: (k) => { mem.delete(k); },
    });
    vi.stubGlobal('window', { dispatchEvent: () => true });
  });
  it('nhớ chương của thẻ và lọc thẻ đến hạn theo chương', () => {
    rateMany('u', [{ qid: 'a', level: 1, topicId: 'c11-alcohol' }, { qid: 'b', level: 1, topicId: 'c12-ester' }], NOW);
    const later = NOW + 2 * DAY;
    expect(dueCards('u', { now: later })).toHaveLength(2);
    expect(dueCards('u', { now: later, topicId: 'c11-alcohol' }).map((c) => c.qid)).toEqual(['a']);
  });
  it('đánh giá lại không làm mất chương đã lưu', () => {
    rateMany('u', [{ qid: 'a', level: 1, topicId: 'c11-alcohol' }], NOW);
    rateMany('u', [{ qid: 'a', level: 3 }], NOW + DAY);
    expect(readCards('u').cards.a.topicId).toBe('c11-alcohol');
  });
});

/* View giả đủ trường mà studyPlan dùng — không cần data/roadmap.js */
const fakeView = (id, score, answers = 0) => ({
  chapter: { id, name: id, bank: true },
  index: 0,
  summary: answers ? { answers, correct: Math.round(answers * 0.5), lastAt: NOW } : null,
  mastery: { score },
  state: answers ? 'weak' : 'none',
  review: {}, missingPrereq: [],
});

describe('studyPlan: ngày & trùng việc', () => {
  it('parseISODate hiểu theo giờ địa phương; sai định dạng → NaN', () => {
    const d = parseISODate('2026-11-05');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 5]);
    expect(Number.isNaN(parseISODate('05/11/2026').getTime())).toBe(true);
  });
  it('tomorrowISO luôn là ngày sau hôm nay theo giờ địa phương', () => {
    expect(tomorrowISO(at(2026, 10, 27, 0) + 5 * 60000)).toBe('2026-10-28');
    expect(tomorrowISO(at(2026, 12, 31, 23))).toBe('2027-01-01');
  });
  it('một chương không xuất hiện hai lần trong cùng một ngày', () => {
    const plan = buildStudyPlan({
      chapters: [fakeView('only', 20, 10)],
      dueByTopic: { only: 8 },
      settings: { ...DEFAULT_PLAN, examDate: '2026-11-20', minutesPerDay: 120, maxTasksPerDay: 5, restDays: [] },
      now: NOW,
    });
    expect(plan.ok).toBe(true);
    plan.days.forEach((d) => {
      const ids = d.tasks.map((t) => t.chapterId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
  it('ngày thi đặt theo giờ địa phương được chấp nhận là ngày tương lai', () => {
    const p = buildStudyPlan({
      chapters: [fakeView('a', null)],
      settings: { ...DEFAULT_PLAN, examDate: tomorrowISO(NOW) },
      now: NOW,
    });
    expect(p.reason).not.toBe('past-date');
  });
});
