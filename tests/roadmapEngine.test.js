import { describe, it, expect } from 'vitest';
import {
  DAY, BANDS, MIN_ANSWERS, SOLID_ANSWERS,
  summarizeEvents, masteryOf, stateOf, reviewOf, reviewIntervalDays,
  buildChapterViews, buildSuggestions, buildAiContext, weekProgress, studyMinutes,
  questionStats, reviewQueue, dueQuestionCount,
} from '../src/lib/roadmapEngine.js';
import { ROADMAP_LEVELS, getLevel, findChapter } from '../src/data/roadmap.js';
import { CHEM_TOPICS } from '../src/data/chemTopics.js';

/* ============================================================
   Lõi lộ trình: chỉ kiểm tra LOGIC, không gọi mạng.
   Nguyên tắc cần bảo vệ:
     • không có dữ liệu → null, KHÔNG phải 0%
     • ít dữ liệu → không kết luận yếu/thành thạo
     • thành thạo ≠ tỷ lệ hoàn thành bài
   ============================================================ */

const NOW = Date.UTC(2026, 9, 27, 3, 0, 0); // 27/10/2026
const ev = (topicId, correct, daysAgo = 0, extra = {}) => ({
  topicId, correct, at: NOW - daysAgo * DAY, source: 'practice', sessionId: `${topicId}-${daysAgo}`, ...extra,
});
const many = (topicId, correctCount, wrongCount, extra = {}) => [
  ...Array.from({ length: correctCount }, () => ev(topicId, true, 0, extra)),
  ...Array.from({ length: wrongCount }, () => ev(topicId, false, 0, extra)),
];

describe('data/roadmap', () => {
  it('giữ nguyên id chương để không lệch thống kê cũ', () => {
    const ids = ROADMAP_LEVELS.flatMap((l) => l.chapters.map((c) => c.id)).filter(Boolean);
    expect(ids).toContain('c11-equilibrium');
    expect(ids).toContain('c12-transition');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mỗi chương có id tồn tại trong đúng một khối', () => {
    const hit = findChapter('c11-alcohol');
    expect(hit.level.key).toBe('Lớp 11');
  });

  it('phủ ĐỦ mọi chuyên đề trong ngân hàng (không bỏ sót chương)', () => {
    /* Chống hồi quy: chương mới thêm vào chemTopics.js mà quên Lộ trình
       sẽ khiến câu hỏi của chương đó bị bỏ qua âm thầm. */
    const roadIds = new Set(ROADMAP_LEVELS.flatMap((l) => l.chapters.map((c) => c.id)).filter(Boolean));
    const missing = CHEM_TOPICS.filter((t) => !roadIds.has(t.id)).map((t) => t.id);
    expect(missing).toEqual([]);
  });

  it('mọi id trong Lộ trình đều có thật trong ngân hàng', () => {
    const bankIds = new Set(CHEM_TOPICS.map((t) => t.id));
    const extra = ROADMAP_LEVELS.flatMap((l) => l.chapters.map((c) => c.id))
      .filter(Boolean).filter((id) => !bankIds.has(id));
    expect(extra).toEqual([]);
  });

  it('prereq chỉ trỏ tới chương có thật', () => {
    const ids = new Set(ROADMAP_LEVELS.flatMap((l) => l.chapters.map((c) => c.id)).filter(Boolean));
    ROADMAP_LEVELS.forEach((l) => l.chapters.forEach((c) => {
      (c.prereq || []).forEach((p) => expect(ids.has(p)).toBe(true));
    }));
  });
});

describe('summarizeEvents + masteryOf', () => {
  it('không có bằng chứng → score null (không phải 0)', () => {
    expect(masteryOf(null, NOW).score).toBeNull();
    expect(masteryOf({ answers: 0 }, NOW).score).toBeNull();
    expect(stateOf(null, {}, NOW)).toBe('none');
  });

  it('accuracy tính đúng và điểm thành thạo tăng theo lượng bằng chứng', () => {
    const few = summarizeEvents(many('c11-equilibrium', 4, 0));
    const solid = summarizeEvents(many('c11-equilibrium', SOLID_ANSWERS, 0));
    expect(few['c11-equilibrium'].accuracy).toBe(1);
    expect(masteryOf(few['c11-equilibrium'], NOW).score)
      .toBeLessThan(masteryOf(solid['c11-equilibrium'], NOW).score);
  });

  it('không kết luận khi dưới ngưỡng dữ liệu tối thiểu', () => {
    const s = summarizeEvents(many('c11-nitrogen', MIN_ANSWERS - 1, 0));
    expect(stateOf(s['c11-nitrogen'], {}, NOW)).toBe('insufficient');
    expect(masteryOf(s['c11-nitrogen'], NOW).confidence).toBe('low');
  });

  it('điểm thấp khi sai nhiều và đủ dữ liệu', () => {
    const s = summarizeEvents(many('c11-hydrocarbon', 2, 10));
    const m = masteryOf(s['c11-hydrocarbon'], NOW);
    expect(m.accuracy).toBe(17);
    expect(m.score).toBeLessThan(BANDS.weak);
    expect(stateOf(s['c11-hydrocarbon'], {}, NOW)).toBe('weak');
  });

  it('kiến thức cũ bị giảm điểm theo thời gian', () => {
    const fresh = summarizeEvents(many('c11-alcohol', 10, 0));
    const old = summarizeEvents(many('c11-alcohol', 10, 0, { at: NOW - 90 * DAY }));
    expect(masteryOf(old['c11-alcohol'], NOW).score)
      .toBeLessThan(masteryOf(fresh['c11-alcohol'], NOW).score);
  });
});

describe('reviewOf', () => {
  it('đến hạn khi quá chu kỳ ôn', () => {
    const s = summarizeEvents([ev('c11-equilibrium', true, 0)]);
    const r = reviewOf({ ...s['c11-equilibrium'], lastAt: NOW - 2 * DAY }, NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.isDue).toBe(true);
    expect(r.overdueDays).toBeGreaterThanOrEqual(1);
  });

  it('chưa đến hạn với chương vừa ôn', () => {
    const s = summarizeEvents(many('c12-ester', 12, 0));
    expect(reviewOf(s['c12-ester'], NOW).isDue).toBe(false);
  });

  it('chu kỳ dài hơn khi điểm cao hơn', () => {
    expect(reviewIntervalDays(96, 20)).toBeGreaterThan(reviewIntervalDays(65, 20));
    expect(reviewIntervalDays(20, 20)).toBe(1);
    expect(reviewIntervalDays(null, 0)).toBe(1);
  });
});

describe('buildChapterViews + suggestions', () => {
  const level = getLevel('Lớp 11');
  const summaries = summarizeEvents([
    ...many('c11-equilibrium', 12, 0, { at: NOW - DAY }),
    ...many('c11-hydrocarbon', 3, 9, { at: NOW - 30 * DAY }),
  ]);
  const view = buildChapterViews(level, summaries, NOW);

  it('tổng quan đếm đúng chương đã luyện / đã đạt', () => {
    expect(view.overview.chaptersTotal).toBe(6);
    expect(view.overview.chaptersStarted).toBe(2);
    expect(view.overview.chaptersMastered).toBe(1);
    expect(view.overview.answered).toBe(24);
    expect(view.overview.accuracy).toBe(Math.round((15 / 24) * 100));
  });

  it('gợi ý có lý do dùng số liệu thật, không rỗng', () => {
    const sug = buildSuggestions(view.chapters, NOW, 5);
    expect(sug.length).toBeGreaterThan(0);
    sug.forEach((s) => {
      expect(s.reason).toBeTruthy();
      expect(s.actionLabel).toBeTruthy();
      expect(s.chapterId).toBeTruthy();
    });
    const weak = sug.find((s) => s.kind === 'weak');
    expect(weak.reason).toMatch(/\d+\/\d+/);
  });

  it('chương chưa có dữ liệu không bị coi là yếu', () => {
    const chapter = view.chapters.find((c) => c.chapter.id === 'c11-organic-gen');
    expect(chapter.state).toBe('none');
    expect(chapter.mastery.score).toBeNull();
  });

  it('thiếu điều kiện tiên quyết chỉ là gợi ý, không chặn', () => {
    const organic = view.chapters.find((c) => c.chapter.id === 'c11-organic-gen');
    expect(organic.missingPrereq.length).toBeGreaterThan(0);
    expect(organic.state).toBe('none'); // vẫn mở được
  });

  it('khối Đại học không bị tính vào tiến độ', () => {
    const uni = buildChapterViews(getLevel('Đại học'), {}, NOW);
    expect(uni.overview.chaptersTotal).toBe(0);
    expect(uni.chapters.every((c) => c.state === 'ai')).toBe(true);
  });
});

describe('questionStats + reviewQueue (ôn theo từng câu)', () => {
  const evQ = (qid, topicId, correct, daysAgo = 0) => ({
    qid, topicId, correct, at: NOW - daysAgo * DAY, source: 'practice', sessionId: 's-' + qid,
  });

  it('gộp đúng số lần đúng/sai theo từng câu', () => {
    const stats = questionStats([
      evQ('q1', 'c11-alcohol', false, 3),
      evQ('q1', 'c11-alcohol', false, 2),
      evQ('q1', 'c11-alcohol', true, 1),
      evQ('q2', 'c11-alcohol', true, 1),
    ]);
    expect(stats.q1.wrong).toBe(2);
    expect(stats.q1.right).toBe(1);
    expect(stats.q1.topicId).toBe('c11-alcohol');
    expect(stats.q1.lastOk).toBe(true);
  });

  it('chỉ đưa vào lịch ôn những câu còn sai nhiều hơn đúng', () => {
    const stats = questionStats([
      evQ('q1', 'c11-alcohol', false, 5),
      evQ('q2', 'c11-alcohol', false, 5),
      evQ('q2', 'c11-alcohol', true, 1),
      evQ('q2', 'c11-alcohol', true, 1),
    ]);
    const queue = reviewQueue(stats, { now: NOW });
    expect(queue.map((q) => q.qid)).toEqual(['q1']);
  });

  it('ưu tiên câu sai nhiều hơn', () => {
    const stats = questionStats([
      evQ('a', 'c11-alcohol', false, 2),
      evQ('b', 'c11-alcohol', false, 2),
      evQ('b', 'c11-alcohol', false, 2),
      evQ('b', 'c11-alcohol', false, 2),
    ]);
    expect(reviewQueue(stats, { now: NOW })[0].qid).toBe('b');
    expect(dueQuestionCount(stats)).toBe(2);
  });

  it('lọc theo chương và tính tuổi câu', () => {
    const stats = questionStats([
      evQ('a', 'c11-alcohol', false, 9),
      evQ('b', 'c12-ester', false, 1),
    ]);
    const q = reviewQueue(stats, { now: NOW, topicId: 'c11-alcohol' });
    expect(q).toHaveLength(1);
    expect(q[0].ageDays).toBe(9);
  });

  it('câu không có qid bị bỏ qua, không làm hỏng lịch ôn', () => {
    const stats = questionStats([{ topicId: 'c11-alcohol', correct: false, at: NOW }]);
    expect(Object.keys(stats)).toHaveLength(0);
    expect(reviewQueue(stats, { now: NOW })).toEqual([]);
  });
});

describe('phụ trợ', () => {
  it('đếm câu trả lời trong 7 ngày', () => {
    const events = [ev('c11-alcohol', true, 1), ev('c11-alcohol', true, 10)];
    expect(weekProgress(events, NOW)).toBe(1);
  });

  it('tổng thời gian học gộp attempts + phiên luyện', () => {
    expect(studyMinutes([{ timeSpent: 600 }], [{ durationMs: 120000 }])).toBe(12);
  });

  it('ngữ cảnh AI bị giới hạn độ dài và chỉ chứa số liệu thật', () => {
    const level = getLevel('Lớp 11');
    const view = buildChapterViews(level, summarizeEvents(many('c11-equilibrium', 10, 2)), NOW);
    const ctx = buildAiContext({ levelKey: 'Lớp 11', level, chapterViews: view.chapters, overview: view.overview });
    expect(ctx.length).toBeLessThanOrEqual(1801);
    expect(ctx).toContain('chưa có dữ liệu');
    expect(ctx).toMatch(/\d+\/\d+/);
  });
});
