import { describe, it, expect } from 'vitest';
import {
  STANDARD_TEMPLATES,
  generateTemplateQuestions,
  buildPaperKeysFromVersions,
} from '../src/lib/examTemplates.js';

describe('examTemplates — Bộ khung đề thi chuẩn GDPT 2025', () => {
  it('định nghĩa đầy đủ 3 bộ khung chuẩn', () => {
    expect(STANDARD_TEMPLATES.natural_28).toBeDefined();
    expect(STANDARD_TEMPLATES.math_34).toBeDefined();
    expect(STANDARD_TEMPLATES.quick_15).toBeDefined();
    expect(STANDARD_TEMPLATES.natural_28.counts.p1).toBe(18);
    expect(STANDARD_TEMPLATES.natural_28.counts.p2).toBe(4);
    expect(STANDARD_TEMPLATES.natural_28.counts.p3).toBe(6);
  });

  it('sinh chính xác 28 câu cho môn Tự nhiên (Hóa/Lý/Sinh)', () => {
    const questions = generateTemplateQuestions('natural_28', 'Hóa học', '12');
    expect(questions.length).toBe(28);

    const p1 = questions.filter((q) => q.part === 1);
    const p2 = questions.filter((q) => q.part === 2);
    const p3 = questions.filter((q) => q.part === 3);

    expect(p1.length).toBe(18);
    expect(p2.length).toBe(4);
    expect(p3.length).toBe(6);

    // Tính tổng điểm chuẩn GDPT 2025: 18 * 0.25 + 4 * 1.0 + 6 * 0.25 = 4.5 + 4.0 + 1.5 = 10.0đ
    const totalScore = p1.length * 0.25 + p2.length * 1.0 + p3.length * 0.25;
    expect(totalScore).toBe(10.0);
  });

  it('sinh chính xác 22 câu (34 ý hỏi) cho môn Toán', () => {
    const questions = generateTemplateQuestions('math_34', 'Toán học', '12');
    expect(questions.length).toBe(22);

    const p1 = questions.filter((q) => q.part === 1);
    const p2 = questions.filter((q) => q.part === 2);
    const p3 = questions.filter((q) => q.part === 3);

    expect(p1.length).toBe(12);
    expect(p2.length).toBe(4);
    expect(p3.length).toBe(6);
  });

  it('chuyển đổi 4 mã đề đảo thành bộ khóa đáp án OMR chính xác', () => {
    const mockVersions = [
      {
        code: '101',
        questions: [
          { part: 1, correct: 0 },
          { part: 1, correct: 2 },
          { part: 2, statements: [{ answer: true }, { answer: false }, { answer: true }, { answer: false }] },
          { part: 3, answer: '12.5' },
        ],
      },
      {
        code: '102',
        questions: [
          { part: 1, correct: 1 },
          { part: 1, correct: 3 },
          { part: 2, statements: [{ answer: false }, { answer: true }, { answer: false }, { answer: true }] },
          { part: 3, answer: '8.4' },
        ],
      },
    ];

    const keys = buildPaperKeysFromVersions(mockVersions);
    expect(keys['101']).toBeDefined();
    expect(keys['102']).toBeDefined();
    expect(keys['101'].p1).toEqual(['A', 'C']);
    expect(keys['101'].p2).toEqual(['TFTF']);
    expect(keys['101'].p3).toEqual(['12.5']);
    expect(keys['102'].p1).toEqual(['B', 'D']);
    expect(keys['102'].p2).toEqual(['FTFT']);
    expect(keys['102'].p3).toEqual(['8.4']);
  });

  it('bộ khung Ngữ văn (literature_essay) đạt chuẩn 7 câu QĐ 764/QĐ-BGDĐT (4đ Đọc hiểu + 6đ Viết) và buildPaperKeysFromVersions bỏ qua essay', () => {
    expect(STANDARD_TEMPLATES.literature_essay.counts.essay).toBe(7);
    const litQuestions = generateTemplateQuestions('literature_essay', 'Ngữ văn', '12');
    expect(litQuestions).toHaveLength(7);
    expect(litQuestions.every((q) => q.type === 'essay' && q.part === 4)).toBe(true);
    expect(litQuestions.map((q) => q.points)).toEqual([0.5, 0.5, 1, 1, 1, 2, 4]);
    const totalPts = litQuestions.reduce((acc, q) => acc + q.points, 0);
    expect(totalPts).toBe(10);

    const keys = buildPaperKeysFromVersions([
      {
        code: '101',
        questions: [
          { part: 1, type: 'single_choice', correct: 1 },
          { part: 4, type: 'essay', answer: 'Bài viết' },
          { type: 'essay', answer: 'Không có part field' },
        ],
      },
    ]);
    expect(keys['101'].p1).toEqual(['B']);
    expect(keys['101'].p2).toEqual([]);
    expect(keys['101'].p3).toEqual([]);
  });

  it('sinh câu hỏi Địa lí & Vật lý Phần III đúng bộ môn (không rò rỉ ngữ liệu este Hóa học)', () => {
    const geoQs = generateTemplateQuestions('natural_28', 'Địa lí', '12');
    const geoP3 = geoQs.filter((q) => q.part === 3);
    expect(geoP3).toHaveLength(6);
    expect(geoP3.every((q) => !/este|NaOH|muối khan/i.test(q.question))).toBe(true);

    const phyQs = generateTemplateQuestions('natural_28', 'Vật lý', '12');
    const phyP3 = phyQs.filter((q) => q.part === 3);
    expect(phyP3).toHaveLength(6);
    expect(phyP3.every((q) => !/este|NaOH|muối khan/i.test(q.question))).toBe(true);
  });
});
