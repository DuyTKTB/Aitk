import { describe, it, expect } from 'vitest';
import {
  diagnoseQuestionError,
  analyzeExamTraps,
} from '../src/lib/examTrapAnalyzer.js';

describe('examTrapAnalyzer — Động cơ chẩn đoán bẫy đề thi & nguyên nhân sai lầm', () => {
  it('diagnoseQuestionError nhận diện đúng bẫy từ phủ định', () => {
    const q = {
      question: 'Phát biểu nào sau đây KHÔNG đúng về tính chất của kim loại kiềm?',
      options: ['Có nhiệt độ nóng chảy thấp', 'Độ cứng cao', 'Khối lượng riêng nhỏ', 'Có màu trắng bạc'],
    };
    const diag = diagnoseQuestionError(q, 0, 1);
    expect(diag).toBeDefined();
    expect(diag.type).toBe('trap');
    expect(diag.typeLabel).toContain('Bẫy từ phủ định');
  });

  it('diagnoseQuestionError nhận diện đúng lỗi tính toán/đơn vị', () => {
    const q = {
      question: 'Cho 5.4 gam Al tác dụng hết với khí Clo dư thu được bao nhiêu gam muối?',
      options: ['13.35g', '26.7g', '40.05g', '18.5g'],
    };
    const diag = diagnoseQuestionError(q, 0, 1);
    expect(diag).toBeDefined();
    expect(diag.type).toBe('calc');
    expect(diag.typeLabel).toContain('Lỗi đổi đơn vị');
  });

  it('analyzeExamTraps tổng hợp chuẩn xác các nhóm lỗi trong toàn bộ bài thi', () => {
    const questions = [
      { id: 'q1', question: 'Kim loại nào sau đây KHÔNG phản ứng với axit HCl?', options: ['Cu', 'Fe', 'Zn', 'Al'], correct: 0 },
      { id: 'q2', question: 'Tính thể tích khí CO2 (đktc) thu được...', options: ['2.24l', '4.48l'], correct: 1 },
      { id: 'q3', question: 'Chất nào là chất béo không no?', options: ['Triolein', 'Tristearin'], correct: 0 },
    ];
    const answers = {
      0: 1, // Sai câu 1 (dính bẫy không)
      1: 0, // Sai câu 2 (dính tính toán đktc)
      2: 0, // Đúng câu 3
    };

    const report = analyzeExamTraps({ questions, answers });
    expect(report.totalErrors).toBe(2);
    expect(report.trapCount).toBe(1);
    expect(report.calcCount).toBe(1);
    expect(report.knowledgeCount).toBe(0);
    expect(report.trapItems).toHaveLength(2);
  });
});
