import { describe, it, expect } from 'vitest';
import {
  generateShuffledVersions, answerKeyOf, findCollisions, answerKeyRows, seedForCode, analyzePositionalOptions,
} from '../src/lib/examShuffle.js';

const questions = [
  { type: 'single_choice', level: 'nb', options: ['A1', 'B1', 'C1', 'D1'], correct: 0 },
  { type: 'single_choice', level: 'th', options: ['A2', 'B2', 'C2', 'D2'], correct: 2 },
  { type: 'true_false', level: 'vd', statements: [{ text: 'x', answer: true }, { text: 'y', answer: false }] },
  { type: 'single_choice', level: 'vdc', options: ['A4', 'B4', 'C4', 'D4'], correct: 3 },
];

describe('sinh mã đề', () => {
  it('mã 101 giữ nguyên thứ tự gốc', () => {
    const [v101] = generateShuffledVersions(questions, 1);
    expect(v101.code).toBe('101');
    expect(v101.questions.map((q) => q.originalIndex)).toEqual([1, 2, 3, 4]);
  });

  it('các mã khác đảo thứ tự nhưng vẫn đủ câu', () => {
    const vs = generateShuffledVersions(questions, 4);
    expect(vs).toHaveLength(4);
    vs.forEach((v) => {
      expect(v.questions).toHaveLength(questions.length);
      expect(new Set(v.questions.map((q) => q.originalIndex)).size).toBe(questions.length);
    });
  });

  it('cùng seed → cùng kết quả (tái lập được)', () => {
    const a = generateShuffledVersions(questions, 4, { salt: 7 });
    const b = generateShuffledVersions(questions, 4, { salt: 7 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = generateShuffledVersions(questions, 4, { salt: 8 });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('seedForCode tăng theo salt', () => {
    expect(seedForCode('101', 1) - seedForCode('101', 0)).toBe(1);
  });

  it('giữ đúng đáp án đúng sau khi đảo lựa chọn', () => {
    const vs = generateShuffledVersions(questions, 4);
    vs.forEach((v) => {
      v.questions.forEach((q) => {
        if ((q.type || 'single_choice') !== 'single_choice') return;
        const text = q.options[q.correct];
        const orig = questions.find((x, i) => i + 1 === q.originalIndex);
        expect(text).toBe(orig.options[orig.correct]);
      });
    });
  });

  it('tắt đảo lựa chọn thì giữ nguyên đáp án chữ', () => {
    const vs = generateShuffledVersions(questions, 2, { shuffleOptions: false });
    vs.forEach((v) => {
      v.questions.forEach((q) => {
        if ((q.type || 'single_choice') !== 'single_choice') return;
        expect(q.correct).toBe(q.origCorrect);
      });
    });
  });

  it('hỗ trợ tới 8 mã đề', () => {
    expect(generateShuffledVersions(questions, 8)).toHaveLength(8);
  });
});

describe('bảng đáp án', () => {
  it('trả đúng số câu và chữ cái đáp án', () => {
    const [v101] = generateShuffledVersions(questions, 1);
    const key = answerKeyOf(v101);
    expect(key).toHaveLength(4);
    expect(key[0]).toMatchObject({ newNum: 1, originalNum: 1, letter: 'A' });
    expect(key[1].letter).toBe('C');
    /* câu đúng/sai trả chuỗi Đ/S theo từng ý */
    expect(key[2].statements).toEqual(['Đ', 'S']);
  });

  it('xuất CSV nhiều mã: mỗi câu một dòng', () => {
    const vs = generateShuffledVersions(questions, 2);
    const rows = answerKeyRows(vs);
    expect(rows).toHaveLength(8);
    expect(new Set(rows.map((r) => r[0]))).toEqual(new Set(['101', '102']));
  });
});

describe('chống trùng đề', () => {
  it('một câu hỏi thì các mã trùng nhau hoàn toàn', () => {
    const one = [{ type: 'single_choice', level: 'nb', options: ['A', 'B'], correct: 0 }];
    const vs = generateShuffledVersions(one, 3);
    expect(findCollisions(vs)).toHaveLength(2);
  });

  it('nhiều câu + đảo lựa chọn thì không trùng', () => {
    const vs = generateShuffledVersions(questions, 4);
    expect(findCollisions(vs)).toHaveLength(0);
  });
});

describe('đề Tiếng Anh (phương án tiếng Anh & khóa nhóm đọc hiểu)', () => {
  it('nhận diện Both A and C / All of the above / None of the above để khóa đảo đáp án', () => {
    expect(analyzePositionalOptions(['go', 'goes', 'Both A and B', 'Neither'])).toMatchObject({ hasSpecial: true });
    expect(analyzePositionalOptions(['Choice 1', 'Choice 2', 'Choice 3', 'All of the above'])).toMatchObject({ hasSpecial: true });
    expect(analyzePositionalOptions(['Option 1', 'Option 2', 'Option 3', 'None of the above'])).toMatchObject({ hasSpecial: true });
    expect(analyzePositionalOptions(['planting trees', 'saving water', 'recycling paper', 'reducing waste'])).toMatchObject({ hasSpecial: false });
  });

  it('giữ nguyên thứ tự các câu đọc hiểu/cloze có lockGroupQuestionOrder across mọi mã đề', () => {
    const englishQuestions = [
      { type: 'single_choice', level: 'nb', q: 'Grammar 1 ______', options: ['a', 'b', 'c', 'd'], correct: 0 },
      { type: 'single_choice', level: 'nb', q: 'Grammar 2 ______', options: ['e', 'f', 'g', 'h'], correct: 1 },
      {
        type: 'single_choice', level: 'th', q: '', passage: 'Passage text...',
        groupId: 'pg_en_1', lockGroupQuestionOrder: true,
        options: ['o1', 'o2', 'o3', 'o4'], correct: 2,
      },
      {
        type: 'single_choice', level: 'vd', q: '', passage: 'Passage text...',
        groupId: 'pg_en_1', lockGroupQuestionOrder: true,
        options: ['p1', 'p2', 'p3', 'p4'], correct: 0,
      },
    ];
    const versions = generateShuffledVersions(englishQuestions, 4, { salt: 42 });
    versions.forEach((v) => {
      // Câu 3 & 4 (originalIndex 3 và 4) luôn giữ nguyên vị trí [2] và [3] do đọc hiểu điền khuyết
      expect(v.questions[2].originalIndex).toBe(3);
      expect(v.questions[3].originalIndex).toBe(4);
    });
  });

  it('bảo toàn đầy đủ câu Tự luận (essay) ở cuối đề với options=[] và correct=-1 khi trộn đề hỗn hợp nhiều phần', () => {
    const mixedWithEssay = [
      { type: 'single_choice', level: 'nb', q: 'TN 1', options: ['a', 'b', 'c', 'd'], correct: 0 },
      { type: 'single_choice', level: 'th', q: 'TN 2', options: ['e', 'f', 'g', 'h'], correct: 1 },
      { type: 'true_false', level: 'vd', q: 'DS 1', statements: [{ text: '1', answer: true }, { text: '2', answer: false }] },
      { type: 'essay', level: 'vd', q: 'Phân tích đoạn trích văn bản trên', answer: 'Gợi ý chấm', points: 4 },
    ];
    const versions = generateShuffledVersions(mixedWithEssay, 3, { salt: 9 });
    versions.forEach((v) => {
      expect(v.questions).toHaveLength(4);
      expect(v.questions[3].type).toBe('essay');
      expect(v.questions[3].originalIndex).toBe(4);
      expect(v.questions[3].options).toEqual([]);
      expect(v.questions[3].correct).toBe(-1);
    });
    expect(Array.isArray(findCollisions(versions))).toBe(true);
  });
});
