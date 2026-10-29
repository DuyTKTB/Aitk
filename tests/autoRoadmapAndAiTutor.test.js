import { describe, it, expect, beforeEach } from 'vitest';
import { buildAutoRoadmapData, saveScheduleConfig } from '../src/lib/autoRoadmapEngine.js';
import {
  Schemas,
  executeWithSchemaRetry,
  localTargetSuggestion,
  localProgressCommentary,
} from '../src/lib/aiTutorService.js';
import { buildDiagnosticQuestions, builtinRawById } from '../src/data/roadmapExercises.js';

const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

describe('autoRoadmapEngine & aiTutorService & Diagnostic Test', () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  it('buildDiagnosticQuestions returns 12 balanced questions and builtinRawById resolves raw question', () => {
    const qs = buildDiagnosticQuestions(['c12-ester', 'c12-carb', 'c12-amine', 'c12-electro'], 12);
    expect(qs.length).toBe(12);
    const raw = builtinRawById(qs[0].id);
    expect(raw).not.toBeNull();
    expect(raw.options.length).toBe(4);
  });

  it('buildAutoRoadmapData computes paceStatus, milestones, and wrongQuestionsList accurately', () => {
    saveScheduleConfig('u-test', { weeklyFreeHours: 6, examDate: '2027-06-26' });
    const mockChapters = [
      {
        chapter: { id: 'c12-ester', name: 'Ester – Lipid', desc: 'Este', bank: true },
        summary: { answers: 10, correct: 4 },
        mastery: { score: 42 },
      },
      {
        chapter: { id: 'c12-carb', name: 'Carbohydrate', desc: 'Carb', bank: true },
        summary: { answers: 12, correct: 11 },
        mastery: { score: 88 },
      },
    ];
    const mockEvents = [
      { qid: 'bi-c12-ester-01', topicId: 'c12-ester', ok: false, at: Date.now() - 1000 },
      { qid: 'bi-c12-ester-02', topicId: 'c12-ester', ok: true, at: Date.now() },
    ];
    const res = buildAutoRoadmapData({
      uid: 'u-test',
      overview: { hasEvidence: true, avgMastery: 55, totalAnswers: 22 },
      chapters: mockChapters,
      events: mockEvents,
      dueByTopic: { 'c12-ester': 3 },
      dueTotal: 3,
      cardsDue: 2,
    });

    expect(res.paceStatus).toBe('Cần tăng tốc');
    expect(res.isAccelerating).toBe(true);
    expect(res.recommendedQuestionsPerSession).toBe(15);
    expect(res.milestones.length).toBe(4);
    expect(res.wrongQuestionsList.length).toBe(1);
    expect(res.wrongQuestionsList[0].qid).toBe('bi-c12-ester-01');
    expect(res.wrongQuestionsList[0].correctAnswer).toBeTruthy();
  });

  it('executeWithSchemaRetry retries once on malformed JSON and falls back cleanly', async () => {
    let calls = 0;
    const badCaller = async () => {
      calls += 1;
      return 'not valid json';
    };

    const result = await executeWithSchemaRetry({
      prompt: 'test',
      validator: Schemas.targetSuggestion,
      fallbackFn: () => localTargetSuggestion({ cutoffScore: 26, scale: 30, schoolCode: 'ANND' }),
      customCaller: badCaller,
    });

    expect(calls).toBe(2); // 1 lần gọi chính + 1 lần retry
    expect(result.source).toBe('local-fallback');
    expect(result.recommendedScore).toBeGreaterThan(26);
  });

  it('localProgressCommentary returns valid schema-compliant commentary', () => {
    const comm = localProgressCommentary({
      hasEvidence: true,
      predictedChem10: 7.0,
      targetChem10: 8.75,
      chemGap10: 1.75,
      paceStatus: 'Cần tăng tốc',
      priorityChapters: [{ chapter: { name: 'Ester – Lipid' } }],
      masteredChapters: [{ chapter: { name: 'Carbohydrate' } }],
      dueTotal: 4,
    });
    const validated = Schemas.progressComment(comm);
    expect(validated.ok).toBe(true);
  });
});
