import { describe, it, expect } from 'vitest';
import { mapQuestionRows } from '../src/lib/roadmapEvidence.js';

/* ============================================================
   Kiểm tra bước chuẩn hoá câu hỏi của phiên luyện.
   Không gọi mạng: chỉ kiểm tra dữ liệu Supabase thô → câu hỏi dùng được.
   ============================================================ */

const row = (over = {}) => ({
  id: 'q1',
  content: 'Cân bằng: Fe + O₂ → Fe₂O₃. Hệ số Fe là?',
  explanation: 'Bảo toàn nguyên tố Fe.',
  difficulty: 'medium',
  answers: [
    { content: '2', is_correct: false, sort_order: 1 },
    { content: '4', is_correct: true, sort_order: 0 },
    { content: '3', is_correct: false, sort_order: 2 },
  ],
  ...over,
});

describe('mapQuestionRows', () => {
  it('sắp xếp đáp án theo sort_order và trả đúng chỉ số đáp án đúng', () => {
    const out = mapQuestionRows([row()]);
    expect(out).toHaveLength(1);
    expect(out[0].options).toEqual(['4', '2', '3']);
    expect(out[0].correct).toBe(0);
    expect(out[0].explain).toContain('Bảo toàn');
  });

  it('bỏ câu có hơn một đáp án đúng (không tự sửa đáp án)', () => {
    const bad = row({
      answers: [
        { content: 'A', is_correct: true, sort_order: 0 },
        { content: 'B', is_correct: true, sort_order: 1 },
      ],
    });
    expect(mapQuestionRows([bad])).toHaveLength(0);
  });

  it('bỏ câu thiếu đáp án, đáp án rỗng hoặc nội dung rỗng', () => {
    expect(mapQuestionRows([row({ answers: [{ content: 'A', is_correct: true }] })])).toHaveLength(0);
    expect(mapQuestionRows([row({
      answers: [
        { content: 'A', is_correct: true, sort_order: 0 },
        { content: '   ', is_correct: false, sort_order: 1 },
      ],
    })])).toHaveLength(0);
    expect(mapQuestionRows([row({ content: '  ' })])).toHaveLength(0);
  });

  it('chấp nhận mảng rỗng / null mà không lỗi', () => {
    expect(mapQuestionRows()).toEqual([]);
    expect(mapQuestionRows(null)).toEqual([]);
    expect(mapQuestionRows([])).toEqual([]);
  });
});
