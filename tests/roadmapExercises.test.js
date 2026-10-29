import { describe, it, expect } from 'vitest';
import { CHEM_TOPICS } from '../src/data/chemTopics.js';
import {
  BUILTIN_TOPICS,
  builtinRaw,
  builtinQuestions,
  builtinByIds,
  builtinCount,
  builtinLevelCounts,
  chapterGuide,
  shuffleOptions,
  isBuiltinId,
} from '../src/data/roadmapExercises.js';
import { loadPracticeQuestions, loadQuestionsByIds, loadReviewQuestions } from '../src/lib/roadmapEvidence.js';

describe('roadmapExercises — ngân hàng câu hỏi biên soạn sẵn', () => {
  it('bao phủ đủ 100% chuyên đề trong CHEM_TOPICS (22 chuyên đề)', () => {
    const topicIds = CHEM_TOPICS.map((t) => t.id);
    expect(BUILTIN_TOPICS.sort()).toEqual(topicIds.sort());
    expect(builtinCount()).toBeGreaterThanOrEqual(22 * 8);
  });

  it('mỗi chuyên đề có trọng tâm, lỗi hay gặp và đủ 3 mức độ NB/TH/VD', () => {
    CHEM_TOPICS.forEach((t) => {
      const guide = chapterGuide(t.id);
      expect(guide, `thiếu guide cho ${t.id}`).not.toBeNull();
      expect(guide.points.length).toBeGreaterThanOrEqual(3);
      expect(guide.mistakes.length).toBeGreaterThanOrEqual(1);

      const counts = builtinLevelCounts(t.id);
      expect(counts.nb).toBeGreaterThanOrEqual(2);
      expect(counts.th).toBeGreaterThanOrEqual(2);
      expect(counts.vd).toBeGreaterThanOrEqual(2);
    });
  });

  it('mọi câu hỏi có 4 lựa chọn không rỗng, không trùng nhau, và có giải thích', () => {
    CHEM_TOPICS.forEach((t) => {
      const raw = builtinRaw(t.id);
      expect(raw.length).toBeGreaterThanOrEqual(8);
      raw.forEach((q) => {
        expect(isBuiltinId(q.id)).toBe(true);
        expect(q.q.length).toBeGreaterThanOrEqual(10);
        expect(q.options).toHaveLength(4);
        q.options.forEach((opt) => expect(opt.trim().length).toBeGreaterThan(0));
        expect(new Set(q.options).size).toBe(4);
        expect(q.explain.trim().length).toBeGreaterThan(10);
      });
    });
  });

  it('shuffleOptions giữ nguyên văn bản của đáp án đúng', () => {
    const sample = builtinRaw('c10-atom')[0];
    const rightText = sample.options[sample.correct];
    for (let i = 0; i < 12; i += 1) {
      const mixed = shuffleOptions(sample);
      expect(mixed.options[mixed.correct]).toBe(rightText);
      expect(mixed.options.slice().sort()).toEqual(sample.options.slice().sort());
    }
  });

  it('builtinQuestions lọc đúng theo mức độ nb / th / vd', () => {
    const nb = builtinQuestions('c11-equilibrium', { level: 'nb' });
    const vd = builtinQuestions('c11-equilibrium', { level: 'vd' });
    expect(nb.length).toBeGreaterThan(0);
    expect(nb.every((q) => q.level === 'nb')).toBe(true);
    expect(vd.every((q) => q.level === 'vd')).toBe(true);
  });

  it('builtinByIds lấy đúng câu theo danh sách id', () => {
    const ids = ['bi-c10-atom-01', 'bi-c12-ester-02'];
    const got = builtinByIds(ids);
    expect(got.map((q) => q.id)).toEqual(ids);
  });

  it('loadPracticeQuestions & loadReviewQuestions hoạt động ngay từ bộ câu hỏi tích hợp', async () => {
    const res = await loadPracticeQuestions('c10-redox', { limit: 6, level: 'th' });
    expect(res.error).toBeNull();
    expect(res.questions.length).toBeGreaterThan(0);
    expect(res.questions.every((q) => q.level === 'th')).toBe(true);

    const byIds = await loadQuestionsByIds(['bi-c10-redox-01', 'bi-c10-redox-02']);
    expect(byIds.questions).toHaveLength(2);

    const rev = await loadReviewQuestions('c10-redox', { wrongIds: ['bi-c10-redox-01'], limit: 5 });
    expect(rev.questions).toHaveLength(5);
    expect(rev.questions[0].id).toBe('bi-c10-redox-01');
  });
});
