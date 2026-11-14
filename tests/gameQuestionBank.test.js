import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeChoiceQuestion,
  normalizeChoiceQuestionList,
  normalizeBankQuestion,
  normalizeBankQuestionList,
} from '../src/lib/gameQuestionBank.js';
import {
  publishExamToVirtual,
  buildExamQuestionsForPaper,
  CUSTOM_VIRTUAL_EXAMS_KEY,
} from '../src/data/virtualExamsBank.js';
import { findLessonByChapterId } from '../src/data/dedicatedLessonsData.js';

describe('gameQuestionBank normalizers', () => {
  it('normalizes bank format { question, correct: string, wrong: string[] } into choice format { q, options, correct: number }', () => {
    const raw = {
      question: 'Kim loại nào dẫn điện tốt nhất?',
      correct: 'Ag',
      wrong: ['Cu', 'Au', 'Al'],
      explain: 'Bạc (Ag) dẫn điện tốt nhất.',
    };
    const norm = normalizeChoiceQuestion(raw, 0);
    expect(norm).toBeTruthy();
    expect(norm.q).toBe('Kim loại nào dẫn điện tốt nhất?');
    expect(norm.options).toHaveLength(4);
    expect(typeof norm.correct).toBe('number');
    expect(norm.options[norm.correct]).toBe('Ag');
    expect(norm.explain).toBe('Bạc (Ag) dẫn điện tốt nhất.');
  });

  it('normalizes choice format { q, options, correct: number } into bank format { question, correct: string, wrong: string[] }', () => {
    const raw = {
      q: 'Chất nào sau đây là ester?',
      options: ['CH3COOH', 'CH3COOC2H5', 'C2H5OH', 'HCHO'],
      correct: 1,
      explain: 'Ethyl acetate là ester.',
    };
    const bank = normalizeBankQuestion(raw, 0);
    expect(bank).toBeTruthy();
    expect(bank.question).toBe('Chất nào sau đây là ester?');
    expect(bank.correct).toBe('CH3COOC2H5');
    expect(bank.wrong).toEqual(['CH3COOH', 'C2H5OH', 'HCHO']);
  });

  it('filters invalid items in normalizeChoiceQuestionList and normalizeBankQuestionList', () => {
    const choiceList = normalizeChoiceQuestionList([
      null,
      { question: 'H2O là gì?', correct: 'Nước', wrong: ['Axit', 'Bazơ', 'Muối'] },
    ]);
    expect(choiceList).toHaveLength(1);
    expect(choiceList[0].options[choiceList[0].correct]).toBe('Nước');

    const bankList = normalizeBankQuestionList(choiceList);
    expect(bankList).toHaveLength(1);
    expect(bankList[0].correct).toBe('Nước');
    expect(bankList[0].wrong).toHaveLength(3);
  });
});

describe('virtualExamsBank admin publish & normalization', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CUSTOM_VIRTUAL_EXAMS_KEY);
    }
  });

  it('ignores Supabase count-only [{ count: 40 }] relation objects when publishing to virtual room', () => {
    const entry = publishExamToVirtual({
      id: 'admin-exam-count-only',
      title: 'Đề thi thử THPTQG',
      questions: [{ count: 40 }],
    });
    expect(entry.questionCount).toBe(40);
    expect(entry.customQuestions).toEqual([]);
    const built = buildExamQuestionsForPaper(entry);
    expect(built.length).toBeGreaterThanOrEqual(28);
    expect(built[0].q).toBeTruthy();
  });

  it('normalizes exported admin questions (single_choice, true_false, short_answer) into virtual exam questions', () => {
    const entry = publishExamToVirtual({
      id: 'admin-exam-exported',
      title: 'Đề xuất từ Admin',
      customQuestions: [
        {
          content: 'Câu 1: Kim loại kiềm là?',
          type: 'single_choice',
          options: [
            { label: 'A', content: 'Fe', isCorrect: false },
            { label: 'B', content: 'Na', isCorrect: true },
            { label: 'C', content: 'Cu', isCorrect: false },
            { label: 'D', content: 'Ag', isCorrect: false },
          ],
          correctAnswer: 'B',
          explanation: 'Na thuộc nhóm IA.',
        },
        {
          content: 'Câu 2: Xét các phát biểu về ester:',
          type: 'true_false',
          options: [
            { label: 'a', content: 'Có mùi thơm', isCorrect: true },
            { label: 'b', content: 'Tan tốt trong nước', isCorrect: false },
          ],
        },
        {
          content: 'Câu 3: Phân tử khối của NaOH là bao nhiêu?',
          type: 'short_answer',
          correctAnswer: '40',
        },
      ],
    });

    expect(entry.questionCount).toBe(3);
    const built = buildExamQuestionsForPaper(entry);
    expect(built).toHaveLength(3);
    expect(built[0].type).toBe('choice');
    expect(built[0].options).toEqual(['Fe', 'Na', 'Cu', 'Ag']);
    expect(built[0].correct).toBe(1);
    expect(built[1].type).toBe('true_false');
    expect(built[1].statements).toEqual([
      { id: 'a', text: 'Có mùi thơm', answer: true },
      { id: 'b', text: 'Tan tốt trong nước', answer: false },
    ]);
    expect(built[2].type).toBe('short_answer');
    expect(built[2].answer).toBe('40');
  });
});

describe('dedicatedLessonsData exact chapter matching', () => {
  it('does not collide c12-metal-main with c12-metal', () => {
    const metal = findLessonByChapterId('c12-metal');
    const metalMain = findLessonByChapterId('c12-metal-main');
    expect(metal?.chapterId).toBe('c12-metal');
    expect(metalMain?.chapterId).not.toBe('c12-metal');
  });
});
