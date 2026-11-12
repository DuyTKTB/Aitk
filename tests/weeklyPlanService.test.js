import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WEEKDAYS,
  getCurrentDayIndex,
  getWeekDates,
  getWeeklyPlan,
  saveWeeklyPlan,
  addWeeklyTask,
  toggleWeeklyTask,
  deleteWeeklyTask,
  getTodayPendingTasks,
  generateAiWeeklyPlan,
} from '../src/lib/weeklyPlanService.js';

describe('weeklyPlanService — Quản lý kế hoạch tuần chuẩn 9Study', () => {
  let mem = {};

  beforeEach(() => {
    mem = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => mem[k] ?? null,
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
      clear: () => { mem = {}; },
    });
    vi.stubGlobal('window', {
      dispatchEvent: () => {},
    });
  });

  it('cung cấp đủ 7 ngày trong tuần từ T2 đến CN', () => {
    expect(WEEKDAYS.length).toBe(7);
    expect(WEEKDAYS[0].key).toBe('mon');
    expect(WEEKDAYS[6].key).toBe('sun');
  });

  it('getWeekDates trả về 7 ngày có định dạng ngày tháng hợp lệ', () => {
    const dates = getWeekDates();
    expect(dates.length).toBe(7);
    expect(dates[0].label).toBe('T2');
    const today = dates.find((d) => d.isToday);
    expect(today).toBeDefined();
  });

  it('thêm, hoàn thành và xoá công việc tuần thành công', () => {
    const task = addWeeklyTask('user_test', 0, 'Ôn tập Este');
    expect(task.text).toBe('Ôn tập Este');
    expect(task.completed).toBe(false);

    let plan = getWeeklyPlan('user_test');
    expect(plan.tasks.length).toBe(1);

    toggleWeeklyTask('user_test', task.id);
    plan = getWeeklyPlan('user_test');
    expect(plan.tasks[0].completed).toBe(true);

    deleteWeeklyTask('user_test', task.id);
    plan = getWeeklyPlan('user_test');
    expect(plan.tasks.length).toBe(0);
  });

  it('generateAiWeeklyPlan tự động tạo 7 nhiệm vụ cho 7 ngày', () => {
    const plan = generateAiWeeklyPlan('user_test', 'Đại học Bách Khoa');
    expect(plan.tasks.length).toBe(7);
    expect(plan.targetAspirationId).toBe('Đại học Bách Khoa');
  });
});
