import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readAspirations,
  saveAspirations,
  addWish,
  removeWish,
  promoteWish,
  classifyFeasibility,
  computeEloInfo,
  computeAspirationAnalytics,
} from '../src/lib/aspirationStore.js';

describe('aspirationStore (9Study Aspiration & 5-Step Roadmap)', () => {
  let store = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    });
    vi.stubGlobal('window', {
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });

  it('readAspirations trả về hồ sơ mặc định có 2 nguyện vọng và kỳ thi THPTQG', () => {
    const p = readAspirations('u1');
    expect(p.examType).toBe('THPTQG');
    expect(p.examBlock).toBe('A00');
    expect(p.wishes.length).toBeGreaterThanOrEqual(1);
  });

  it('addWish, promoteWish và removeWish quản lý tối đa 3 nguyện vọng đúng thứ tự ưu tiên', () => {
    saveAspirations('u1', { wishes: [] });
    addWish('u1', { id: 'w1', uni: 'ĐH Y Hà Nội', code: 'YHA', major: 'Y khoa', combo: 'B00', s2025: 26.85 });
    addWish('u1', { id: 'w2', uni: 'ĐH Bách Khoa Hà Nội', code: 'BKA', major: 'Kỹ thuật Hóa học', combo: 'A00', s2025: 24.4 });
    let cur = readAspirations('u1');
    expect(cur.wishes).toHaveLength(2);
    expect(cur.wishes[0].id).toBe('w1');

    // Đưa w2 lên làm NV1
    cur = promoteWish('u1', 'w2');
    expect(cur.wishes[0].id).toBe('w2');

    // Xoá w1
    cur = removeWish('u1', 'w1');
    expect(cur.wishes).toHaveLength(1);
    expect(cur.wishes[0].id).toBe('w2');
  });

  it('classifyFeasibility phân loại đúng mức độ khả thi so với điểm chuẩn', () => {
    expect(classifyFeasibility(null, 25.5).key).toBe('untested');
    expect(classifyFeasibility(26.5, 25.5).key).toBe('safe');
    expect(classifyFeasibility(25.2, 25.5).key).toBe('fit');
    expect(classifyFeasibility(23.8, 25.5).key).toBe('stretch');
    expect(classifyFeasibility(20.0, 25.5).key).toBe('challenge');
  });

  it('computeEloInfo trả về null khi chưa có dữ liệu và tính Elo chính xác khi có bằng chứng', () => {
    expect(computeEloInfo(null, 0).elo).toBeNull();
    const elo80 = computeEloInfo(80, 25);
    expect(elo80.elo).toBeGreaterThan(1600);
    expect(elo80.tier).toContain('8.0+');
  });

  it('computeAspirationAnalytics tổng hợp đầy đủ 5 bước, 3 nhiệm vụ hôm nay và lịch giữ nhịp tháng', () => {
    const profile = readAspirations('u1');
    const overview = {
      hasEvidence: true,
      avgMastery: 75,
      totalAnswers: 30,
      streak: 2,
    };
    const chapters = [
      { chapter: { id: 'c12-ester-lipid', name: 'Ester – Lipid', bank: true }, state: 'weak', mastery: { score: 45 }, summary: { answers: 10, correct: 4 } },
      { chapter: { id: 'c12-carbohydrate', name: 'Carbohydrate', bank: true }, state: 'mastered', mastery: { score: 90 }, summary: { answers: 20, correct: 18 } },
    ];
    const now = Date.now();
    const analytics = computeAspirationAnalytics({
      profile,
      overview,
      chapters,
      dueTotal: 4,
      cardsDue: 2,
      events: [{ at: now, ok: true }],
      now,
    });

    expect(analytics.estimatedChemScore).toBe(7.5);
    expect(analytics.stages).toHaveLength(5);
    expect(analytics.dailyMissions).toHaveLength(3);
    expect(analytics.dailyMissions[0].chapterId).toBe('c12-ester-lipid');
    expect(analytics.monthlyCalendar.activeDays).toBe(1);
  });
});
