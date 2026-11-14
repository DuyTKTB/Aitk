import { describe, it, expect, vi, beforeEach } from 'vitest';

const batchSetCalls = [];
const batchCommitCalls = [];
const updateDocCalls = [];
const setDocCalls = [];

vi.mock('../src/lib/firebase.js', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __col: name })),
  doc: vi.fn((colOrDb, nameOrId, maybeId) => {
    if (colOrDb?.__col) return { __col: colOrDb.__col, id: nameOrId || `auto_${Math.random().toString(36).slice(2, 8)}` };
    return { __col: nameOrId, id: maybeId || `auto_${Math.random().toString(36).slice(2, 8)}` };
  }),
  getDocs: vi.fn(async () => ({ docs: [] })),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  addDoc: vi.fn(async () => ({ id: 'doc_1' })),
  updateDoc: vi.fn(async (ref, data) => { updateDocCalls.push({ ref, data }); }),
  deleteDoc: vi.fn(async () => {}),
  setDoc: vi.fn(async (ref, data) => { setDocCalls.push({ ref, data }); }),
  query: vi.fn((...args) => args),
  where: vi.fn((...args) => args),
  orderBy: vi.fn((...args) => args),
  limit: vi.fn((n) => n),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
  increment: vi.fn((n) => ({ __inc: n })),
  arrayUnion: vi.fn((...args) => args),
  arrayRemove: vi.fn((...args) => args),
  onSnapshot: vi.fn(() => () => {}),
  writeBatch: vi.fn(() => {
    const ops = [];
    return {
      set: (ref, data) => { ops.push({ op: 'set', ref, data }); batchSetCalls.push({ ref, data }); },
      update: (ref, data) => { ops.push({ op: 'update', ref, data }); },
      delete: (ref) => { ops.push({ op: 'delete', ref }); },
      commit: async () => { batchCommitCalls.push(ops); },
    };
  }),
}));

import {
  DEFAULT_COUNTS,
  DEFAULT_SCORING,
  parseKeyP1,
  parseKeyP2,
  parseKeyP3,
  keyP1FromExam,
  keyP2FromExam,
  keyP3FromExam,
  gradeSheet,
  computePaperAnalytics,
} from '../src/lib/paperGrade.js';
import {
  questionKey,
  findDuplicate,
  addQuestionsBatch,
  updateQuestion,
} from '../src/lib/questionBank.js';
import {
  updateClass,
  createExam,
} from '../src/lib/classroom.js';

beforeEach(() => {
  batchSetCalls.length = 0;
  batchCommitCalls.length = 0;
  updateDocCalls.length = 0;
  setDocCalls.length = 0;
});

describe('paperGrade — GDPT 2025 OMR keys & grading', () => {
  it('trích xuất đáp án Phần I, II, III chính xác từ đề online 3 phần', () => {
    const exam = {
      questions: [
        { type: 'single_choice', q: 'C1', options: ['A', 'B', 'C', 'D'], correct: 2 },
        { type: 'single_choice', q: 'C2', options: ['A', 'B', 'C', 'D'], correct: 0 },
        {
          type: 'true_false',
          q: 'C3',
          statements: [
            { text: 'ý a', answer: true },
            { text: 'ý b', answer: false },
            { text: 'ý c', answer: true },
            { text: 'ý d', answer: false },
          ],
        },
        { type: 'short_answer', q: 'C4', answer: '12,5', accepted: ['12.5'] },
        { type: 'short_answer', q: 'C5', answer: '-4' },
      ],
    };

    const p1 = keyP1FromExam(exam, 4);
    expect(p1).toEqual(['C', 'A', '', '']);

    const p2 = keyP2FromExam(exam, 2);
    expect(p2[0]).toEqual(['D', 'S', 'D', 'S']);
    expect(p2[1]).toEqual(['', '', '', '']);

    const p3 = keyP3FromExam(exam, 3);
    expect(p3).toEqual([['12,5', '12.5'], ['-4'], []]);
  });

  it('chấm phiếu 3 phần đúng thang điểm GDPT 2025 và hỗ trợ đáp án thay thế / dấu phẩy-chấm', () => {
    const counts = { p1: 2, p2: 1, p3: 2 };
    const key = {
      p1: parseKeyP1('1A 2*', 2),
      p2: parseKeyP2('ĐSĐS', 1),
      p3: parseKeyP3('0,5|1/2\n-12', 2),
    };
    const read = {
      p1: ['A', 'D'],
      p2: [['D', 'S', 'D', 'D']], // đúng 3/4 ý -> 0.5 điểm
      p3: ['0.50', '-12'],
    };

    const g = gradeSheet(read, key, counts, DEFAULT_SCORING);
    expect(g.parts.p1).toBe(0.5);
    expect(g.parts.p2).toBe(0.5);
    expect(g.parts.p3).toBe(0.5);
    expect(g.total).toBe(1.5);
    expect(g.max).toBe(2);
    expect(g.score10).toBe(7.5);
  });

  it('computePaperAnalytics thống kê đúng phổ điểm, trung vị và câu sai nhiều', () => {
    const counts = { ...DEFAULT_COUNTS, p1: 2, p2: 0, p3: 0 };
    const results = [
      { grade: { score10: 5, detail: { p1: [{ q: 1, ok: true }, { q: 2, ok: false }] } } },
      { grade: { score10: 10, detail: { p1: [{ q: 1, ok: true }, { q: 2, ok: true }] } } },
    ];
    const stats = computePaperAnalytics(results, counts);
    expect(stats.count).toBe(2);
    expect(stats.avg).toBe(7.5);
    expect(stats.median).toBe(7.5);
    expect(stats.passRate).toBe(100);
    expect(stats.goodRate).toBe(50);
    expect(stats.hardestP1[0]).toMatchObject({ q: 2, correctRate: 50 });
  });
});

describe('questionBank — GDPT 2025 3-part serialization & validation', () => {
  it('phân biệt questionKey cho single_choice, true_false và short_answer', () => {
    const q1 = { type: 'single_choice', q: 'Câu hỏi', options: ['A', 'B'] };
    const q2 = { type: 'true_false', q: 'Câu hỏi', statements: [{ text: 'ý 1', answer: true }] };
    const q3 = { type: 'true_false', q: 'Câu hỏi', statements: [{ text: 'ý 1', answer: false }] };
    const q4 = { type: 'short_answer', q: 'Câu hỏi', answer: '42' };

    expect(questionKey(q1)).not.toBe(questionKey(q2));
    expect(questionKey(q2)).not.toBe(questionKey(q3));
    expect(questionKey(q3)).not.toBe(questionKey(q4));
    expect(findDuplicate([q1, q2, q4], { ...q2 })).toBe(q2);
  });

  it('addQuestionsBatch nhận cả câu Đúng/Sai, Trả lời ngắn và lọc câu trùng / lỗi', async () => {
    const res = await addQuestionsBatch({
      teacherId: 'gv_1',
      questions: [
        { type: 'single_choice', q: 'Este X là?', options: ['A', 'B', 'C', 'D'], correct: 1, subject: 'Hóa học', grade: 12 },
        { type: 'single_choice', q: 'Este X là?', options: ['A', 'B', 'C', 'D'], correct: 1 }, // trùng trong cùng lô
        { type: 'true_false', q: 'Nhận định về hàm số', statements: [{ text: 'Đơn điệu', answer: true }, { text: 'Cực trị', answer: false }], subject: 'Toán học', grade: 12 },
        { type: 'short_answer', q: 'Tính pH', answer: '3,5', accepted: ['3.5'], subject: 'Hóa học', grade: 12 },
        { type: 'short_answer', q: 'Thiếu đáp án', answer: '' }, // invalid
      ],
    });

    expect(res).toEqual({ ok: true, count: 3, skipped: 1, invalid: 1 });
    expect(batchCommitCalls).toHaveLength(1);
    expect(batchSetCalls).toHaveLength(3);
    expect(batchSetCalls[1].data.statements).toHaveLength(2);
    expect(batchSetCalls[2].data).toMatchObject({ type: 'short_answer', answer: '3,5', accepted: ['3.5'] });
  });

  it('updateQuestion cho phép cập nhật câu Đúng/Sai & Trả lời ngắn nhưng vẫn chặn Trắc nghiệm sai chỉ số', async () => {
    await updateQuestion('q_tf', {
      type: 'true_false',
      statements: [{ text: 'Mệnh đề mới', answer: false }],
    });
    expect(updateDocCalls).toHaveLength(1);
    expect(updateDocCalls[0].data.statements[0]).toEqual({ key: 'a', text: 'Mệnh đề mới', answer: false });

    await expect(
      updateQuestion('q_mc', { type: 'single_choice', options: ['A', 'B'], correct: 5 }),
    ).rejects.toThrow('Đáp án đúng không hợp lệ');
  });
});

describe('classroom — updateClass & createExam metadata/draft', () => {
  it('updateClass chuẩn hóa metadata lớp và từ chối patch rỗng', async () => {
    const empty = await updateClass('c1', {});
    expect(empty.ok).toBe(false);

    const res = await updateClass('c1', {
      name: '  12A2  ',
      subject: 'Vật lí',
      grade: '12',
      announcement: { text: 'Kiểm tra 15p thứ Sáu' },
      bandThresholds: { good: 8.5, fair: 7, pass: 5 },
    });
    expect(res).toEqual({ ok: true });
    expect(updateDocCalls).toHaveLength(1);
    expect(updateDocCalls[0].data).toMatchObject({
      name: '12A2',
      subject: 'Vật lí',
      grade: 12,
      bandThresholds: { good: 8.5, fair: 7, pass: 5 },
    });
    expect(updateDocCalls[0].data.announcement.text).toBe('Kiểm tra 15p thứ Sáu');
  });

  it('createExam hỗ trợ lưu nháp isDraft và lọc gradeType hợp lệ', async () => {
    const draft = await createExam({
      teacherId: 'gv_1',
      teacherName: 'Cô Lan',
      classId: '',
      isDraft: true,
      title: 'Đề nháp Toán 12',
      subject: 'Toán học',
      grade: 12,
      gradeType: 'dgk',
      duration: 50,
      questions: [{ type: 'short_answer', q: '2+2=?', answer: '4', points: 0.5 }],
    });

    expect(draft.isDraft).toBe(true);
    expect(draft.classId).toBe('');
    expect(draft.gradeType).toBe('dgk');
    expect(draft.subject).toBe('Toán học');
    expect(draft.totalPoints).toBe(0.5);
    expect(setDocCalls).toHaveLength(1);
  });
});
