import { describe, it, expect } from 'vitest';
import {
  VIRTUAL_EXAMS,
  getAllVirtualExams,
  buildExamQuestionsForPaper,
  canAccessVirtualExam,
} from '../src/data/virtualExamsBank.js';
import {
  PHYSICS_EXAM_QUESTIONS_1,
  BIOLOGY_EXAM_QUESTIONS_1,
  KHTN_INTEGRATED_QUESTIONS_1,
} from '../src/data/scienceExamQuestions.js';

describe('KHTN Virtual Exams & Multi-Subject Papers', () => {
  it('cung cấp đủ 28 câu hỏi chuẩn cấu trúc cho đề Vật lí 1', () => {
    expect(PHYSICS_EXAM_QUESTIONS_1).toHaveLength(28);
    PHYSICS_EXAM_QUESTIONS_1.forEach((q, idx) => {
      expect(q.id).toBeDefined();
      expect(q.question).toBeTruthy();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(q.explanation).toBeTruthy();
    });
  });

  it('cung cấp đủ 28 câu hỏi chuẩn cấu trúc cho đề Sinh học 1', () => {
    expect(BIOLOGY_EXAM_QUESTIONS_1).toHaveLength(28);
    BIOLOGY_EXAM_QUESTIONS_1.forEach((q, idx) => {
      expect(q.id).toBeDefined();
      expect(q.question).toBeTruthy();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(q.explanation).toBeTruthy();
    });
  });

  it('cung cấp đủ 28 câu hỏi chuẩn cấu trúc cho đề Tích hợp KHTN (Lý - Hóa - Sinh)', () => {
    expect(KHTN_INTEGRATED_QUESTIONS_1).toHaveLength(28);
    KHTN_INTEGRATED_QUESTIONS_1.forEach((q, idx) => {
      expect(q.id).toBeDefined();
      expect(q.question).toBeTruthy();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(q.options.length);
      expect(q.explanation).toBeTruthy();
    });
  });

  it('ngân hàng đề thi getAllVirtualExams chứa các phân môn Vật lí, Hóa học, Sinh học và KHTN tích hợp', () => {
    const all = getAllVirtualExams();
    expect(all.length).toBeGreaterThan(15);

    const physicsExams = all.filter((e) => e.subject === 'ly');
    const biologyExams = all.filter((e) => e.subject === 'sinh');
    const integratedExams = all.filter((e) => e.subject === 'all');
    const chemistryExams = all.filter((e) => e.subject === 'hoa');

    expect(physicsExams.length).toBeGreaterThanOrEqual(4);
    expect(biologyExams.length).toBeGreaterThanOrEqual(4);
    expect(integratedExams.length).toBeGreaterThanOrEqual(1);
    expect(chemistryExams.length).toBeGreaterThanOrEqual(10);
  });

  it('buildExamQuestionsForPaper trả về danh sách 28 câu hỏi hoàn chỉnh cho đề Vật lí', () => {
    const exam = VIRTUAL_EXAMS.find((e) => e.id === 'vip-ly-2027-01');
    expect(exam).toBeDefined();
    const questions = buildExamQuestionsForPaper(exam);
    expect(questions.length).toBe(28);
    expect(questions[0].prompt || questions[0].question).toContain('con lắc lò xo');
    expect(questions[0].options).toHaveLength(4);
  });

  it('buildExamQuestionsForPaper trả về danh sách 28 câu hỏi hoàn chỉnh cho đề Sinh học', () => {
    const exam = VIRTUAL_EXAMS.find((e) => e.id === 'vip-sinh-2027-01');
    expect(exam).toBeDefined();
    const questions = buildExamQuestionsForPaper(exam);
    expect(questions.length).toBe(28);
    expect(questions[0].prompt || questions[0].question).toContain('ADN');
    expect(questions[0].options).toHaveLength(4);
  });

  it('xác thực quyền truy cập canAccessVirtualExam cho VIP, PRO, FREE trên các đề KHTN', () => {
    expect(canAccessVirtualExam('FREE', 'FREE')).toBe(true);
    expect(canAccessVirtualExam('FREE', 'VIP')).toBe(false);
    expect(canAccessVirtualExam('PRO', 'PRO')).toBe(true);
    expect(canAccessVirtualExam('PRO', 'VIP')).toBe(false);
    expect(canAccessVirtualExam('VIP', 'VIP')).toBe(true);
    expect(canAccessVirtualExam('ADMIN', 'VIP')).toBe(true);
  });
});
