import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dueSummary, dueItems } from '../src/lib/reviewQueue.js';
import { DAY } from '../src/lib/roadmapEngine.js';

const mem = new Map();
beforeEach(() => {
  mem.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
  });
});

const NOW = Date.UTC(2026, 9, 27);
const ev = (qid, topicId, correct, daysAgo = 0) => ({
  qid, topicId, correct, at: NOW - daysAgo * DAY, source: 'practice', sessionId: 's-' + qid,
});

describe('reviewQueue — một hàng đợi ôn duy nhất', () => {
  it('gộp câu trả lời sai và thẻ đến hạn, không trùng câu', () => {
    const events = [ev('q1', 'c11-alcohol', false, 2), ev('q2', 'c11-alcohol', false, 1)];
    /* thẻ q2 (đã có trong hàng đợi sai) + q9 (chỉ có thẻ) */
    localStorage.setItem('cs-flashcards-v1:u1', JSON.stringify({
      version: 1,
      cards: {
        q2: { qid: 'q2', topicId: 'c11-alcohol', level: 1, dueAt: NOW - DAY, seen: 1, lastAt: NOW - DAY },
        q9: { qid: 'q9', topicId: 'c12-ester', level: 1, dueAt: NOW - DAY, seen: 1, lastAt: NOW - DAY },
      },
    }));
    const s = dueSummary('u1', events, NOW);
    expect(s.total).toBe(3);
    const ids = s.items.map((i) => i.qid).sort();
    expect(ids).toEqual(['q1', 'q2', 'q9']);
    expect(s.byReason.wrong).toBe(2);
    expect(s.byReason.card).toBe(1);
    expect(s.byTopic['c11-alcohol']).toBe(2);
    expect(s.byTopic['c12-ester']).toBe(1);
  });

  it('thẻ chưa đến hạn thì không tính', () => {
    localStorage.setItem('cs-flashcards-v1:u1', JSON.stringify({
      version: 1,
      cards: { q9: { qid: 'q9', topicId: 'c12-ester', level: 3, dueAt: NOW + 5 * DAY, seen: 3, lastAt: NOW } },
    }));
    expect(dueItems('u1', [], NOW)).toEqual([]);
  });

  it('không có dữ liệu thì rỗng, không lỗi', () => {
    const s = dueSummary('u2', [], NOW);
    expect(s.total).toBe(0);
    expect(s.items).toEqual([]);
  });
});
