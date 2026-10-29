import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readPlanState,
  savePlanSettings,
  togglePlanDone,
  clearPlanDone,
  doneKey,
} from '../src/lib/studyPlanStore.js';
import { buildStudyPlan, planToICal } from '../src/lib/studyPlan.js';

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

describe('studyPlanStore & iCal export', () => {
  const uid = 'test-user-plan';

  it('lưu cài đặt và đánh dấu hoàn thành theo ngày/chương', () => {
    savePlanSettings(uid, { examDate: '2026-12-01', minutesPerDay: 45 });
    expect(readPlanState(uid).settings.examDate).toBe('2026-12-01');
    expect(readPlanState(uid).settings.minutesPerDay).toBe(45);

    togglePlanDone(uid, '2026-11-10', 'c11-alcohol');
    expect(readPlanState(uid).done[doneKey('2026-11-10', 'c11-alcohol')]).toBe(true);

    togglePlanDone(uid, '2026-11-10', 'c11-alcohol');
    expect(readPlanState(uid).done[doneKey('2026-11-10', 'c11-alcohol')]).toBeUndefined();
  });

  it('đổi examDate tự động xoá dấu done của lịch cũ', () => {
    savePlanSettings(uid, { examDate: '2026-12-01' });
    togglePlanDone(uid, '2026-11-10', 'c11-alcohol');
    expect(Object.keys(readPlanState(uid).done)).toHaveLength(1);

    savePlanSettings(uid, { examDate: '2026-12-15' });
    expect(readPlanState(uid).done).toEqual({});
  });

  it('lọc bỏ các mục done đã quá hạn 30 ngày', () => {
    savePlanSettings(uid, { examDate: '2026-12-01' });
    togglePlanDone(uid, '2025-01-01', 'c10-atom');
    togglePlanDone(uid, '2026-11-10', 'c10-periodic');
    const st = readPlanState(uid, Date.parse('2026-11-12T00:00:00Z'));
    expect(st.done[doneKey('2025-01-01', 'c10-atom')]).toBeUndefined();
    expect(st.done[doneKey('2026-11-10', 'c10-periodic')]).toBe(true);

    clearPlanDone(uid);
    expect(readPlanState(uid).done).toEqual({});
  });

  it('planToICal xuất đúng định dạng VCALENDAR / VEVENT', () => {
    const chapters = [
      {
        index: 0,
        chapter: { id: 'c10-atom', name: 'Cấu tạo nguyên tử', bank: true },
        mastery: { score: null },
        state: 'none',
        review: { isDue: false },
      },
    ];
    const plan = buildStudyPlan({
      chapters,
      dueByTopic: {},
      settings: { examDate: '2026-11-05', minutesPerDay: 60, restDays: [], maxTasksPerDay: 3 },
      now: Date.parse('2026-10-28T08:00:00'),
    });
    const ics = planToICal(plan, { levelKey: 'Lớp 10' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('Cấu tạo nguyên tử');
    expect(ics).toContain('END:VCALENDAR');
  });
});
