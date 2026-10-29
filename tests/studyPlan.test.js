import { describe, it, expect } from 'vitest';
import { buildStudyPlan, needMinutes, weightOf, DEFAULT_PLAN, DAY } from '../src/lib/studyPlan.js';
import { buildChapterViews, summarizeEvents } from '../src/lib/roadmapEngine.js';
import { getLevel } from '../src/data/roadmap.js';

/* ============================================================
   Kế hoạch tới ngày thi: kiểm tra các quy tắc BẮT BUỘC
     • không có ngày thi → không sinh lịch
     • ngày nghỉ bị loại khỏi lịch
     • ngày cuối chỉ ôn, không nhồi kiến thức mới
     • thiếu thời gian → feasible=false + gợi ý số phút/ngày
     • chương đã tốt không bị xếp việc
   ============================================================ */

const NOW = Date.UTC(2026, 9, 27);           // 27/10/2026 (T3)
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const level = getLevel('Lớp 11');

/* Dữ liệu mẫu: 1 chương khá, 1 chương yếu, 4 chương chưa học */
const summaries = summarizeEvents([
  ...Array.from({ length: 12 }, () => ({ topicId: 'c11-equilibrium', correct: true, at: NOW, source: 'practice', sessionId: 'a' })),
  ...Array.from({ length: 4 }, () => ({ topicId: 'c11-nitrogen', correct: true, at: NOW, source: 'practice', sessionId: 'b' })),
  ...Array.from({ length: 8 }, () => ({ topicId: 'c11-nitrogen', correct: false, at: NOW, source: 'practice', sessionId: 'b' })),
]);
const views = buildChapterViews(level, summaries, NOW).chapters;

const base = {
  chapters: views,
  dueByTopic: { 'c11-nitrogen': 6 },
  settings: { ...DEFAULT_PLAN, examDate: iso(NOW + 20 * DAY), minutesPerDay: 60, restDays: [0] },
  now: NOW,
};

describe('buildStudyPlan', () => {
  it('không có ngày thi → trả về lỗi có lý do, không sinh lịch', () => {
    const p = buildStudyPlan({ ...base, settings: { ...DEFAULT_PLAN, examDate: '' } });
    expect(p.ok).toBe(false);
    expect(p.reason).toBe('missing-date');
    expect(p.days).toHaveLength(0);
  });

  it('ngày thi trong quá khứ bị từ chối', () => {
    const p = buildStudyPlan({ ...base, settings: { ...base.settings, examDate: iso(NOW - DAY) } });
    expect(p.ok).toBe(false);
    expect(p.reason).toBe('past-date');
  });

  it('loại ngày nghỉ khỏi lịch và không xếp việc vào Chủ nhật', () => {
    const p = buildStudyPlan(base);
    expect(p.ok).toBe(true);
    p.days.forEach((d) => {
      expect(new Date(`${d.date}T00:00:00`).getDay()).not.toBe(0);
    });
    expect(p.days.length).toBeGreaterThan(0);
  });

  it('mỗi ngày không vượt số phút và số việc cho phép', () => {
    const p = buildStudyPlan(base);
    p.days.forEach((d) => {
      expect(d.minutes).toBeLessThanOrEqual(base.settings.minutesPerDay + 10);
      expect(d.tasks.length).toBeLessThanOrEqual(base.settings.maxTasksPerDay);
    });
  });

  it('ngày cuối chỉ có việc ôn tập', () => {
    const p = buildStudyPlan(base);
    const lastDay = p.days[p.days.length - 1];
    lastDay.tasks.forEach((t) => expect(t.action.key).toBe('review'));
  });

  it('không xếp việc cho chương đã đạt mức tốt', () => {
    const strong = summarizeEvents(
      Array.from({ length: 15 }, () => ({ topicId: 'c11-equilibrium', correct: true, at: NOW, source: 'practice', sessionId: 'z' })),
    );
    const p = buildStudyPlan({
      ...base,
      chapters: buildChapterViews(level, strong, NOW).chapters,
      dueByTopic: {},
    });
    const ids = p.days.flatMap((d) => d.tasks.map((t) => t.chapterId));
    expect(ids).not.toContain('c11-equilibrium');
  });

  it('thiếu thời gian → feasible=false kèm gợi ý phút/ngày cao hơn', () => {
    const p = buildStudyPlan({
      ...base,
      settings: { ...base.settings, examDate: iso(NOW + 4 * DAY), minutesPerDay: 30 },
    });
    expect(p.ok).toBe(true);
    expect(p.stats.feasible).toBe(false);
    expect(p.stats.suggestedMinutes).toBeGreaterThan(30);
    expect(p.warnings.join(' ')).toMatch(/Không đủ thời gian/);
  });

  it('đủ thời gian → feasible=true, độ phủ 100%', () => {
    const p = buildStudyPlan({
      ...base,
      settings: { ...base.settings, examDate: iso(NOW + 60 * DAY), minutesPerDay: 90 },
    });
    expect(p.stats.feasible).toBe(true);
    expect(p.stats.coverage).toBe(1);
  });

  it('mọi chương đã tốt → không cần lịch mới nhưng vẫn trả về ok', () => {
    const p = buildStudyPlan({ ...base, chapters: [], dueByTopic: {} });
    expect(p.ok).toBe(true);
    expect(p.reason).toBe('nothing-to-do');
    expect(p.warnings[0]).toMatch(/không cần lịch/i);
  });
});

describe('needMinutes / weightOf', () => {
  it('chương chưa có dữ liệu cần nhiều phút hơn chương đã khá', () => {
    const fresh = views.find((v) => v.chapter.id === 'c11-hydrocarbon');
    const good = views.find((v) => v.chapter.id === 'c11-equilibrium');
    expect(needMinutes(fresh, 0)).toBeGreaterThan(needMinutes(good, 0));
  });

  it('câu đang chờ ôn làm tăng cả thời lượng lẫn trọng số', () => {
    const v = views.find((x) => x.chapter.id === 'c11-nitrogen');
    expect(needMinutes(v, 10)).toBeGreaterThan(needMinutes(v, 0));
    expect(weightOf(v, 10)).toBeGreaterThan(weightOf(v, 0));
  });

  it('chương đã thành thạo có trọng số thấp hơn chương chưa học', () => {
    const good = views.find((v) => v.chapter.id === 'c11-equilibrium');
    const fresh = views.find((v) => v.chapter.id === 'c11-organic-gen');
    expect(weightOf(fresh, 0)).toBeGreaterThan(weightOf(good, 0));
  });
});

describe('phân bổ lịch (sửa sau kiểm thử trình duyệt)', () => {
  it('việc được TRẢI trên nhiều ngày chứ không dồn 2-4 ngày đầu', () => {
    const p = buildStudyPlan({
      ...base,
      settings: { ...base.settings, examDate: iso(NOW + 18 * DAY), minutesPerDay: 60 },
    });
    expect(p.ok).toBe(true);
    expect(p.days.length).toBeGreaterThanOrEqual(6);
    const perDay = p.days.map((d) => d.minutes);
    const maxDay = Math.max(...perDay);
    expect(maxDay).toBeLessThanOrEqual(70);
  });

  it('ngày cuối luôn có ít nhất một việc (không bỏ trống)', () => {
    const noData = buildStudyPlan({ ...base, chapters: buildChapterViews(level, {}, NOW).chapters, dueByTopic: {} });
    const last = noData.days[noData.days.length - 1];
    expect(last.tasks.length).toBeGreaterThan(0);
  });

  it('chưa có dữ liệu → cảnh báo thứ tự ưu tiên chỉ theo chương trình', () => {
    const p = buildStudyPlan({ ...base, chapters: buildChapterViews(level, {}, NOW).chapters, dueByTopic: {} });
    expect(p.warnings.join(' ')).toMatch(/Chưa có dữ liệu làm bài/);
  });
});
