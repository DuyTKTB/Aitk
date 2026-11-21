import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { scoreExam } from '../src/lib/examScoring.js';
import {
  stripAnswerKeys,
  extractAnswerKey,
  mergeAnswerKeyIntoQuestions,
  hasEmbeddedAnswers,
  sanitizeDetailForStudent,
} from '../src/lib/examSecurity.js';
import {
  validateExamWindow,
  computeAuthoritativeViolations,
  computeAuthoritativeTimeSpent,
} from '../api/submit-exam.js';
import { VIOLATION_META } from '../src/lib/sessionIcons.jsx';

const SAMPLE_QUESTIONS = [
  {
    type: 'single_choice',
    q: 'Số hiệu nguyên tử của Carbon là?',
    options: ['4', '6', '8', '12'],
    correct: 1,
    points: 0.25,
    explanation: 'Carbon ở ô số 6 trong bảng tuần hoàn.',
  },
  {
    type: 'true_false',
    q: 'Xét các phát biểu về Ester:',
    points: 1,
    statements: [
      { text: 'Ester có mùi thơm đặc trưng.', answer: true },
      { text: 'Ester tan tốt trong nước.', answer: false },
      { text: 'Thủy phân ester trong kiềm là phản ứng một chiều.', answer: true },
      { text: 'Nhiệt độ sôi ester cao hơn carboxylic acid cùng M.', answer: false },
    ],
    explanation: 'Ester không có liên kết hydrogen liên phân tử.',
  },
  {
    type: 'short_answer',
    q: 'Tính khối lượng mol của H2SO4 (g/mol):',
    answer: '98',
    accepted: ['98', '98.0', '98,0'],
    points: 0.5,
    solution: '2 + 32 + 64 = 98.',
  },
];

describe('Exam Anti-Cheat Level 2 — Answer Key Isolation', () => {
  it('stripAnswerKeys removes all answers and explanations across 3 THPT question types', () => {
    const stripped = stripAnswerKeys(SAMPLE_QUESTIONS);
    expect(stripped).toHaveLength(3);
    expect(hasEmbeddedAnswers(stripped)).toBe(false);

    // Single choice
    expect(stripped[0].q).toBe(SAMPLE_QUESTIONS[0].q);
    expect(stripped[0].options).toEqual(SAMPLE_QUESTIONS[0].options);
    expect(stripped[0].correct).toBeUndefined();
    expect(stripped[0].explanation).toBeUndefined();

    // True/False
    expect(stripped[1].statements).toHaveLength(4);
    expect(stripped[1].statements[0].text).toBe('Ester có mùi thơm đặc trưng.');
    expect(stripped[1].statements.every((s) => s.answer === undefined && s.correct === undefined)).toBe(true);
    expect(stripped[1].explanation).toBeUndefined();

    // Short answer
    expect(stripped[2].answer).toBeUndefined();
    expect(stripped[2].accepted).toBeUndefined();
    expect(stripped[2].solution).toBeUndefined();
  });

  it('extractAnswerKey + mergeAnswerKeyIntoQuestions round-trips cleanly and scores identically', () => {
    const stripped = stripAnswerKeys(SAMPLE_QUESTIONS);
    const key = extractAnswerKey(SAMPLE_QUESTIONS);
    const merged = mergeAnswerKeyIntoQuestions(stripped, key);

    expect(hasEmbeddedAnswers(merged)).toBe(true);

    const studentAnswers = [
      1,
      { 0: true, 1: false, 2: true, 3: false },
      '98,0',
    ];
    const originalScore = scoreExam(SAMPLE_QUESTIONS, studentAnswers);
    const mergedScore = scoreExam(merged, studentAnswers);

    expect(mergedScore.score).toBe(originalScore.score);
    expect(mergedScore.correctCount).toBe(originalScore.correctCount);
    expect(mergedScore.detail).toEqual(originalScore.detail);
  });

  it('sanitizeDetailForStudent strips correct answers when showAnswerAfter is false', () => {
    const graded = scoreExam(SAMPLE_QUESTIONS, [0, { 0: true, 1: true, 2: false, 3: false }, '100']);
    const hidden = sanitizeDetailForStudent(graded.detail, false);
    expect(hidden.every((d) => d.correct === undefined)).toBe(true);

    const shown = sanitizeDetailForStudent(graded.detail, true);
    expect(shown[0].correct).toBe(1);
    expect(shown[2].correct).toBe('98');
  });
});

describe('Exam Anti-Cheat Level 2 — Server-Side Validation & Authority', () => {
  const now = 1760000000000;

  it('validateExamWindow blocks inactive, not-yet-open, and closed exams', () => {
    expect(validateExamWindow({ exam: { active: false }, nowMs: now }).ok).toBe(false);
    expect(
      validateExamWindow({ exam: { active: true, opensAt: now + 120000 }, nowMs: now }).ok,
    ).toBe(false);
    expect(
      validateExamWindow({
        exam: { active: true, duration: 15, closesAt: now - 30 * 60000 },
        nowMs: now,
      }).ok,
    ).toBe(false);
  });

  it('validateExamWindow flags overdue attempts based on server startedAt', () => {
    const res = validateExamWindow({
      exam: { active: true, duration: 15 },
      attempt: { startedAt: now - 25 * 60000 },
      nowMs: now,
    });
    expect(res.ok).toBe(true);
    expect(res.overdue).toBe(true);
    expect(res.overdueSeconds).toBeGreaterThan(500);
  });

  it('computeAuthoritativeViolations prevents client spoofing violationCount down to 0', () => {
    const v = computeAuthoritativeViolations({
      clientViolationCount: 0,
      attemptViolationCount: 2,
      attemptEvents: [
        { type: 'tab_hidden', severity: 'hard' },
        { type: 'devtools_open', severity: 'hard' },
        { type: 'multi_face', severity: 'hard' },
      ],
      sessionViolations: [{ type: 'tab_hidden', severity: 'hard' }],
    });
    expect(v).toBe(3);
  });

  it('computeAuthoritativeTimeSpent derives elapsed time from server startedAt', () => {
    const elapsed = computeAuthoritativeTimeSpent({
      clientTimeSpent: 1, // spoofed 1s
      attemptStartedAt: now - 420000, // started 7 minutes ago
      durationMinutes: 45,
      nowMs: now,
    });
    expect(elapsed).toBe(420);
  });

  it('VIOLATION_META includes rapid_answer_bot as hard violation', () => {
    expect(VIOLATION_META.rapid_answer_bot).toBeDefined();
    expect(VIOLATION_META.rapid_answer_bot.severity).toBe('hard');
  });
});

describe('Exam Anti-Cheat Level 2 — Firestore Rules Security Invariants', () => {
  const rulesText = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

  it('blocks students from reading other students submissions', () => {
    const subBlock = rulesText.slice(
      rulesText.indexOf('match /submissions/{subId}'),
      rulesText.indexOf('match /examSessions/{sessionId}'),
    );
    expect(subBlock).not.toMatch(/allow read:\s*if signedIn\(\);/);
    expect(subBlock).toMatch(/resource\.data\.studentId == request\.auth\.uid/);
  });

  it('blocks student self-update on submissions and enforces secureAnswerKey server creation', () => {
    const subBlock = rulesText.slice(
      rulesText.indexOf('match /submissions/{subId}'),
      rulesText.indexOf('match /examSessions/{sessionId}'),
    );
    expect(subBlock).toMatch(/secureAnswerKey/);
    const updatePart = subBlock.slice(subBlock.indexOf('allow update:'), subBlock.indexOf('allow delete:'));
    expect(updatePart).not.toMatch(/resource\.data\.studentId == request\.auth\.uid/);
  });

  it('locks examRetryPermits, studentRetryAllowance, and siteConfig against student tampering', () => {
    const permitBlock = rulesText.slice(
      rulesText.indexOf('match /examRetryPermits/{permitId}'),
      rulesText.indexOf('match /studentRetryAllowance/{allowanceId}'),
    );
    expect(permitBlock).toMatch(/request\.resource\.data\.status == 'pending'/);
    expect(permitBlock).not.toMatch(/allow read, create, update, delete:\s*if signedIn\(\);/);

    const allowanceBlock = rulesText.slice(
      rulesText.indexOf('match /studentRetryAllowance/{allowanceId}'),
      rulesText.indexOf('match /proKeys/{keyId}'),
    );
    expect(allowanceBlock).not.toMatch(/allow read, create, update, delete:\s*if signedIn\(\);/);

    const siteBlock = rulesText.slice(rulesText.indexOf('match /siteConfig/{docId}'));
    expect(siteBlock).toMatch(/allow write:\s*if isAdmin\(\);/);
  });
});
