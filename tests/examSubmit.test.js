import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tsMs } from '../src/lib/classroom.js';
import { submitExamSafe } from '../src/lib/submitQueue.js';
import * as classroom from '../src/lib/classroom.js';

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.window = {
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.restoreAllMocks();
});

describe('tsMs (Timestamp conversion)', () => {
  it('handles null, undefined, empty', () => {
    expect(tsMs(null)).toBe(0);
    expect(tsMs(undefined)).toBe(0);
    expect(tsMs('')).toBe(0);
  });

  it('handles numeric milliseconds', () => {
    const now = 1714500000000;
    expect(tsMs(now)).toBe(now);
  });

  it('handles ISO string dates', () => {
    const iso = '2026-10-30T20:00:00.000Z';
    expect(tsMs(iso)).toBe(new Date(iso).getTime());
  });

  it('handles Firestore Timestamp object with seconds & nanoseconds', () => {
    const ts = { seconds: 1714500000, nanoseconds: 0 };
    expect(tsMs(ts)).toBe(1714500000 * 1000);
  });

  it('handles Firestore Timestamp object with toMillis()', () => {
    const ts = { toMillis: () => 1714500000123 };
    expect(tsMs(ts)).toBe(1714500000123);
  });
});

describe('submitExamSafe (Offline Queue & Error Handling)', () => {
  it('returns directly when submitExam succeeds', async () => {
    vi.spyOn(classroom, 'submitExam').mockResolvedValue({
      ok: true,
      id: 'sub_123',
      score: 10,
    });

    const res = await submitExamSafe({ examId: 'e1', student: { id: 's1' } });
    expect(res.ok).toBe(true);
    expect(res.id).toBe('sub_123');
  });

  it('queues offline submission and preserves score when network is down', async () => {
    vi.spyOn(classroom, 'submitExam').mockResolvedValue({
      ok: false,
      error: 'Failed to fetch (offline / network error)',
      saveError: 'Mạng không ổn định',
      score: 9.5,
      correct: 19,
      total: 20,
      totalPoints: 10,
    });

    const res = await submitExamSafe({ examId: 'e1', student: { id: 's1' } });
    expect(res.ok).toBe(false);
    expect(res.queued).toBe(true);
    expect(res.score).toBe(9.5);
    expect(res.correct).toBe(19);

    const q = JSON.parse(localStorage.getItem('cs-submit-queue-v1') || '[]');
    expect(q.length).toBe(1);
    expect(q[0].examId).toBe('e1');
  });

  it('returns non-network error without crashing', async () => {
    vi.spyOn(classroom, 'submitExam').mockResolvedValue({
      ok: false,
      error: 'Đề đã đóng.',
      score: 8,
    });

    const res = await submitExamSafe({ examId: 'e1', student: { id: 's1' } });
    expect(res.ok).toBe(false);
    expect(res.queued).toBeUndefined();
    expect(res.error).toBe('Đề đã đóng.');
  });
});

describe('getSubmissionForStudent signature flexibility', () => {
  it('handles both positional (examId, studentId) and object ({ examId, studentId }) arguments', async () => {
    // If examId or studentId is missing, returns null
    expect(await classroom.getSubmissionForStudent(null)).toBe(null);
    expect(await classroom.getSubmissionForStudent(undefined, 's1')).toBe(null);
    expect(await classroom.getSubmissionForStudent({ examId: 'e1' })).toBe(null);
    expect(await classroom.getSubmissionForStudent({ studentId: 's1' })).toBe(null);
  });
});
