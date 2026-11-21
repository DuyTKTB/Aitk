import { describe, it, expect } from 'vitest';
import {
  parseQuizFromText,
  gradeShortAnswer,
  gradeTfQuestion,
  parseNumericValue,
} from '../src/lib/aiQuizParser.js';
import { calcMolarMass, KHTN_CONSTANTS } from '../src/components/ChatScienceQuickRef.jsx';

describe('ELEC AI Quiz Parser & Grading (Chuẩn 3 phần THPT 2025–2026)', () => {
  it('bóc tách chuẩn đủ 3 phần: Trắc nghiệm A–D (mcq), Đúng/Sai 4 ý (tf), Trả lời ngắn (short)', () => {
    const sample = `
Đây là bộ câu hỏi luyện tập chuẩn THPT 2025:
\`\`\`quiz
{
  "title": "Đề tổng hợp Hóa 12 - THPT 2025",
  "subject": "Hóa học",
  "grade": "Lớp 12",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Kim loại bị thụ động hóa trong HNO3 đặc nguội là:",
      "options": ["Cu", "Fe", "Ag", "Zn"],
      "correct": "B",
      "hint": "Bộ ba Fe, Al, Cr",
      "explanation": "Fe, Al, Cr bị thụ động hóa trong HNO3 và H2SO4 đặc nguội."
    },
    {
      "id": 2,
      "type": "tf",
      "question": "Xét các phát biểu về este etyl axetat:",
      "statements": [
        { "text": "Công thức phân tử là C4H8O2", "correct": true },
        { "text": "Tan vô hạn trong nước", "correct": false },
        { "text": "Thủy phân trong NaOH thu được CH3COONa", "correct": true },
        { "text": "Có nhiệt độ sôi cao hơn axit axetic", "correct": false }
      ],
      "explanation": "a, c đúng; b, d sai."
    },
    {
      "id": 3,
      "type": "short",
      "question": "Tính thể tích khí H2 (đkc) khi cho 0,1 mol Mg tác dụng với HCl dư.",
      "answer": "2,479",
      "unit": "lít",
      "tolerance": 0.02
    }
  ]
}
\`\`\`
> **BÉ ELEC MẸO NHỚ:** Nhớ điều kiện chuẩn đkc 24,79 L/mol!
`;

    const res = parseQuizFromText(sample);
    expect(res).not.toBeNull();
    expect(res.quiz.questions).toHaveLength(3);

    expect(res.quiz.questions[0].type).toBe('mcq');
    expect(res.quiz.questions[0].correct).toBe(1);

    expect(res.quiz.questions[1].type).toBe('tf');
    expect(res.quiz.questions[1].statements).toHaveLength(4);
    expect(res.quiz.questions[1].statements[0].correct).toBe(true);
    expect(res.quiz.questions[1].statements[1].correct).toBe(false);

    expect(res.quiz.questions[2].type).toBe('short');
    expect(res.quiz.questions[2].answer).toBe('2,479');
    expect(res.quiz.questions[2].unit).toBe('lít');
  });

  it('chấm điểm Phần II (Đúng/Sai 4 ý) đúng thang điểm Bộ GD&ĐT 2025 (0.1 / 0.25 / 0.5 / 1.0)', () => {
    const stmts = [
      { text: 'a', correct: true },
      { text: 'b', correct: false },
      { text: 'c', correct: true },
      { text: 'd', correct: false },
    ];
    expect(gradeTfQuestion({ 0: false, 1: true, 2: false, 3: true }, stmts).score).toBe(0);
    expect(gradeTfQuestion({ 0: true, 1: true, 2: false, 3: true }, stmts).score).toBe(0.1);
    expect(gradeTfQuestion({ 0: true, 1: false, 2: false, 3: true }, stmts).score).toBe(0.25);
    expect(gradeTfQuestion({ 0: true, 1: false, 2: true, 3: true }, stmts).score).toBe(0.5);
    const full = gradeTfQuestion({ 0: true, 1: false, 2: true, 3: false }, stmts);
    expect(full.score).toBe(1);
    expect(full.isAllCorrect).toBe(true);
  });

  it('chấm điểm Phần III (Trả lời ngắn) linh hoạt dấu phẩy/chấm và sai số làm tròn', () => {
    expect(parseNumericValue('4,48 lít')).toBeCloseTo(4.48, 3);
    expect(gradeShortAnswer('4,48', '4.48')).toBe(true);
    expect(gradeShortAnswer('2.48', '2,479', 0.02)).toBe(true);
    expect(gradeShortAnswer('2,48', '2,479', 0.02)).toBe(true);
    expect(gradeShortAnswer('5,00', '2,479', 0.02)).toBe(false);
    expect(gradeShortAnswer('', '2,479')).toBe(false);
  });

  it('tính chính xác khối lượng mol M (g/mol) theo SGK cho hợp chất, ngoặc và tinh thể ngậm nước', () => {
    expect(calcMolarMass('H2SO4')?.molarMass).toBe(98);
    expect(calcMolarMass('Fe2O3')?.molarMass).toBe(160);
    expect(calcMolarMass('Ca(OH)2')?.molarMass).toBe(74);
    expect(calcMolarMass('Al2(SO4)3')?.molarMass).toBe(342);
    expect(calcMolarMass('CuSO4.5H2O')?.molarMass).toBe(250);
    expect(calcMolarMass('C6H12O6')?.molarMass).toBe(180);
    expect(calcMolarMass('invalid-text')).toBeNull();
    expect(KHTN_CONSTANTS.length).toBeGreaterThanOrEqual(12);
  });
});
