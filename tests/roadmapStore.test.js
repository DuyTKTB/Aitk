import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readStore,
  saveSession,
  setWeeklyGoal,
  clearSessions,
  sessionsToEvents,
} from '../src/lib/roadmapStore.js';

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

describe('roadmapStore — lưu phiên luyện và mục tiêu tuần', () => {
  const uid = 'test-user-rm';

  it('trả trạng thái rỗng khi chưa có dữ liệu', () => {
    const st = readStore(uid);
    expect(st.sessions).toEqual([]);
    expect(st.goal).toBeNull();
  });

  it('saveSession ghi nhận phiên luyện và chặn correct > total', () => {
    const rec = saveSession(uid, {
      topicId: 'c10-atom',
      total: 8,
      correct: 15, // cố tình truyền vượt quá total
      durationMs: 42000,
      answers: [
        { qid: 'bi-c10-atom-01', ok: true },
        { qid: 'bi-c10-atom-02', ok: false },
      ],
    });
    expect(rec).not.toBeNull();
    expect(rec.total).toBe(8);
    expect(rec.correct).toBe(8);
    expect(readStore(uid).sessions).toHaveLength(1);
  });

  it('sessionsToEvents chuyển danh sách phiên thành chuỗi sự kiện chuẩn', () => {
    saveSession(uid, {
      topicId: 'c11-alcohol',
      total: 2,
      correct: 1,
      durationMs: 10000,
      answers: [
        { qid: 'bi-c11-alcohol-01', ok: true },
        { qid: 'bi-c11-alcohol-02', ok: false },
      ],
    });
    const ev = sessionsToEvents(readStore(uid).sessions);
    expect(ev).toHaveLength(2);
    expect(ev[0].topicId).toBe('c11-alcohol');
    expect(ev[0].correct).toBe(true);
    expect(ev[1].correct).toBe(false);
  });

  it('setWeeklyGoal và clearSessions hoạt động đúng', () => {
    setWeeklyGoal(uid, 60);
    expect(readStore(uid).goal).toBe(60);
    saveSession(uid, { topicId: 'c12-ester', total: 5, correct: 4, answers: [] });
    expect(readStore(uid).sessions).toHaveLength(1);
    clearSessions(uid);
    expect(readStore(uid).sessions).toEqual([]);
    expect(readStore(uid).goal).toBe(60);
  });
});
