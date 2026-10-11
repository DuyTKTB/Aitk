import { describe, it, expect } from 'vitest';
import {
  parseJsonLoose, normalizeQuestion, shuffleOptions, markDuplicates, countUnanswered,
} from '../src/lib/examAiUtils.js';
import { buildStudentView, hashSeed } from '../src/lib/seededShuffle.js';

describe('parseJsonLoose', () => {
  it('đọc JSON thường', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });
  it('bỏ rào ```json', () => {
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it('lấy JSON nằm giữa văn bản thừa', () => {
    expect(parseJsonLoose('Đây là đề: {"q":[1,2]} Hết.')).toEqual({ q: [1, 2] });
  });
  it('sửa dấu \\ của LaTeX không hợp lệ (\\sqrt, \\ce)', () => {
    const v = parseJsonLoose('{"q":"Tính $\\sqrt{4}$ và $\\ce{H2O}$"}');
    expect(v.q).toContain('sqrt{4}');
    expect(v.q).toContain('ce{H2O}');
  });
  it('ném lỗi tiếng Việt khi hỏng hẳn', () => {
    expect(() => parseJsonLoose('không phải json')).toThrow(/Không đọc được/);
  });
});

describe('normalizeQuestion', () => {
  const base = { q: '2+2=?', options: ['3', '4', '5', '6'], correct: 1, explain: 'Vì 2+2=4' };

  it('giữ đáp án đúng dạng số', () => {
    const n = normalizeQuestion(base);
    expect(n.correct).toBe(1);
    expect(n.warns).toEqual([]);
  });
  it('đổi chữ cái "B" thành chỉ số 1', () => {
    expect(normalizeQuestion({ ...base, correct: 'B' }).correct).toBe(1);
  });
  it('bỏ nhãn "A." ở đầu đáp án', () => {
    const n = normalizeQuestion({ ...base, options: ['A. 3', 'B. 4', 'C. 5', 'D. 6'] });
    expect(n.options).toEqual(['3', '4', '5', '6']);
  });
  it('đáp án đúng ngoài phạm vi → -1', () => {
    expect(normalizeQuestion({ ...base, correct: 9 }).correct).toBe(-1);
  });
  it('cảnh báo đáp án trùng, thiếu lời giải, dấu $ lẻ', () => {
    const n = normalizeQuestion({ q: 'x $y', options: ['a', 'a', 'b', 'c'], correct: 0 });
    expect(n.warns.join('|')).toMatch(/trùng/);
    expect(n.warns.join('|')).toMatch(/Chưa có lời giải/);
    expect(n.warns.join('|')).toMatch(/\$/);
  });
  it('chấp nhận options dạng object {A:..,B:..}', () => {
    const n = normalizeQuestion({ q: 'q', options: { A: 'x', B: 'y' }, correct: 'A' });
    expect(n.options).toEqual(['x', 'y']);
  });
});

describe('shuffleOptions', () => {
  const q = { q: 'Chọn', options: ['a', 'b', 'c', 'd'], correct: 2, explain: 'vì c đúng', warns: [] };
  const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

  it('đáp án đúng đi theo nội dung sau khi xáo', () => {
    const s = shuffleOptions(q, seq([0.1, 0.9, 0.5]));
    expect(s.options[s.correct]).toBe('c');
    expect([...s.options].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
  it('không xáo khi lời giải nhắc chữ cái', () => {
    const t = { ...q, explain: 'Chọn B vì…' };
    expect(shuffleOptions(t)).toBe(t);
  });
  it('không xáo khi đáp án có "cả A và B"', () => {
    const t = { ...q, options: ['a', 'b', 'cả A và B', 'd'] };
    expect(shuffleOptions(t)).toBe(t);
  });
  it('không xáo khi chưa có đáp án đúng', () => {
    const t = { ...q, correct: -1 };
    expect(shuffleOptions(t)).toBe(t);
  });
});

describe('markDuplicates / countUnanswered', () => {
  it('bắt hai câu gần giống nhau', () => {
    const mk = (q) => ({ q, options: ['a', 'b'], correct: 0, warns: [] });
    const out = markDuplicates([
      mk('Tính đạo hàm của hàm số y bằng x mũ ba cộng hai x'),
      mk('Tính đạo hàm của hàm số y bằng x mũ ba cộng hai x'),
    ]);
    expect(out[1].warns.join('')).toMatch(/Gần giống/);
    expect(out[0].warns).toEqual([]);
  });
  it('đếm câu chưa có đáp án', () => {
    expect(countUnanswered([{ correct: -1 }, { correct: 0 }, { correct: -1 }])).toBe(2);
  });
});

describe('buildStudentView (xáo riêng từng học sinh)', () => {
  const qs = Array.from({ length: 6 }, (_, i) => ({ q: `Câu ${i}`, options: ['w', 'x', 'y', 'z'], correct: i % 4 }));

  it('cùng seed → cùng thứ tự (tải lại trang không đổi)', () => {
    const a = buildStudentView(qs, 123).map((v) => v.orig);
    const b = buildStudentView(qs, 123).map((v) => v.orig);
    expect(a).toEqual(b);
  });
  it('khác seed → thường khác thứ tự', () => {
    const a = buildStudentView(qs, hashSeed('hs1')).map((v) => v.orig).join();
    const b = buildStudentView(qs, hashSeed('hs2')).map((v) => v.orig).join();
    expect(a).not.toBe(b);
  });
  it('vẫn đủ câu, đủ đáp án, và map ngược đúng đáp án gốc', () => {
    const view = buildStudentView(qs, 7);
    expect(view.map((v) => v.orig).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    view.forEach((v) => {
      const right = v.options.find((o) => o.orig === v.q.correct);
      expect(right.text).toBe(v.q.options[v.q.correct]);
    });
  });
});
