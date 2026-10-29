import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DAY, LEVELS, nextInterval, rateCard, rateMany, readCards, dueCards, cardStats,
} from '../src/lib/flashcardStore.js';

/* localStorage giả để test thuần, không cần jsdom */
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

const NOW = Date.UTC(2026, 9, 27);

describe('nextInterval', () => {
  it('chưa nhớ → 1 ngày, nhớ một phần → 3 ngày', () => {
    expect(nextInterval(30, 1)).toBe(1);
    expect(nextInterval(30, 2)).toBe(3);
  });

  it('nhớ tốt giãn dần nhưng không vượt 60 ngày', () => {
    expect(nextInterval(0, 3)).toBe(7);
    expect(nextInterval(7, 3)).toBe(15);
    expect(nextInterval(55, 3)).toBe(60);
    expect(nextInterval(60, 3)).toBe(60);
  });
});

describe('rateCard / readCards', () => {
  it('lưu mức, số lần học và hạn ôn kế tiếp', () => {
    const rec = rateCard('u1', 'q1', 1, NOW);
    expect(rec.level).toBe(1);
    expect(rec.interval).toBe(1);
    expect(rec.dueAt).toBe(NOW + DAY);
    expect(rec.seen).toBe(1);
    const again = rateCard('u1', 'q1', 3, NOW);
    expect(again.seen).toBe(2);
    expect(again.interval).toBe(7);
    expect(readCards('u1').cards.q1.level).toBe(3);
  });

  it('tách dữ liệu theo tài khoản', () => {
    rateCard('u1', 'q1', 3, NOW);
    expect(readCards('u2').cards.q1).toBeUndefined();
  });

  it('bỏ qua dữ liệu sai, không ghi rác', () => {
    expect(rateCard('u1', '', 3, NOW)).toBeNull();
    expect(rateCard('u1', 'q9', 5, NOW)).toBeNull();
    expect(Object.keys(readCards('u1').cards)).toHaveLength(0);
  });

  it('dữ liệu hỏng trong localStorage không làm sập', () => {
    mem.set('cs-flashcards-v1:u3', '{oops');
    expect(readCards('u3').cards).toEqual({});
  });
});

describe('rateMany / dueCards / cardStats', () => {
  it('ghi cả phiên một lần', () => {
    const saved = rateMany('u1', [
      { qid: 'a', level: 1 },
      { qid: 'b', level: 2 },
      { qid: 'c', level: 3 },
    ], NOW);
    expect(saved).toHaveLength(3);
    expect(Object.keys(readCards('u1').cards)).toHaveLength(3);
  });

  it('chỉ trả thẻ đã đến hạn, sắp theo hạn gần nhất', () => {
    rateMany('u1', [{ qid: 'a', level: 1 }, { qid: 'b', level: 3 }], NOW);
    expect(dueCards('u1', { now: NOW })).toHaveLength(0);          // vừa học xong, chưa đến hạn
    expect(dueCards('u1', { now: NOW + 2 * DAY }).map((c) => c.qid)).toEqual(['a']);
    expect(dueCards('u1', { now: NOW + 8 * DAY }).map((c) => c.qid).sort()).toEqual(['a', 'b']);
  });

  it('thống kê đếm đúng theo mức', () => {
    rateMany('u1', [{ qid: 'a', level: 1 }, { qid: 'b', level: 2 }, { qid: 'c', level: 3 }], NOW);
    const s = cardStats('u1');
    expect(s.total).toBe(3);
    expect(s.byLevel).toEqual({ 1: 1, 2: 1, 3: 1 });
    expect(s.due).toBeGreaterThanOrEqual(0);   // phụ thuộc Date.now() thật
  });

  it('nhãn 3 mức khớp với UI', () => {
    expect(LEVELS[1].label).toBe('Chưa nhớ');
    expect(LEVELS[2].label).toBe('Nhớ một phần');
    expect(LEVELS[3].label).toBe('Nhớ tốt');
  });
});
