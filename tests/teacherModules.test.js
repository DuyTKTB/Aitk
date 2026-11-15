import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import JSZip from 'jszip';

const {
  batchSetCalls,
  batchCommitCalls,
  updateDocCalls,
  setDocCalls,
  savedDownloads,
  mockCallModel,
} = vi.hoisted(() => ({
  batchSetCalls: [],
  batchCommitCalls: [],
  updateDocCalls: [],
  setDocCalls: [],
  savedDownloads: [],
  mockCallModel: vi.fn(),
}));

vi.mock('../src/lib/firebase.js', () => ({
  db: {},
}));

vi.mock('file-saver', () => ({
  default: { saveAs: vi.fn((blob, name) => { savedDownloads.push({ blob, name }); }) },
  saveAs: vi.fn((blob, name) => { savedDownloads.push({ blob, name }); }),
}));

vi.mock('../src/lib/examAiUtils.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    callModel: mockCallModel,
  };
});

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
  Timestamp: { fromMillis: vi.fn((ms) => ({ __ts: ms, toMillis: () => ms })) },
  runTransaction: vi.fn(async (_db, fn) => fn({ get: vi.fn(), set: vi.fn(), update: vi.fn() })),
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

import { syncPaperResultsToSubmissions } from '../src/lib/paperStore.js';
import { buildExamDocBlob, exportBundleZip } from '../src/lib/examExport.js';
import { generatePedagogicalInsights } from '../src/lib/insightAi.js';
import {
  endExamSession,
  extendExamSession,
  kickStudent,
  warnStudent,
  setStudentPaused,
  setStudentForceSubmit,
} from '../src/lib/examSession.js';
import ExamPickerFromBank, { BankQuestionChoices } from '../src/components/teacher/ExamPickerFromBank.jsx';
import { Donut } from '../src/components/DashShell.jsx';
import ClassDetailModal, { formatClassBadge, buildTrendPoints } from '../src/components/ClassDetailModal.jsx';
import StudentModal from '../src/components/StudentModal.jsx';
import {
  DEFAULT_COUNTS,
  DEFAULT_SCORING,
  parseKeyP1,
  parseKeyP2,
  parseKeyP3,
  keyP1FromExam,
  keyP2FromExam,
  keyP3FromExam,
  classifyExamQuestionPart,
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
  duplicateExam,
} from '../src/lib/classroom.js';
import { getDoc, updateDoc } from 'firebase/firestore';

beforeEach(() => {
  batchSetCalls.length = 0;
  batchCommitCalls.length = 0;
  updateDocCalls.length = 0;
  setDocCalls.length = 0;
  savedDownloads.length = 0;
  mockCallModel.mockReset();
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

describe('OMR sync, empty Word template & Firestore rules regression checks', () => {
  it('syncPaperResultsToSubmissions ghi đầy đủ isPaperOmr, paperId, classId để giáo viên cập nhật lại được', async () => {
    const bad = await syncPaperResultsToSubmissions({ id: 'p1', classId: '' }, []);
    expect(bad.ok).toBe(false);

    const res = await syncPaperResultsToSubmissions(
      { id: 'paper_1', classId: 'cls_12a1', title: 'Kiểm tra Hóa phiếu A4' },
      [{ id: 'r1', sbd: '012', studentId: 'hs_12', studentName: 'Nguyễn Văn A', grade: { total: 8, max: 10, score10: 8 } }],
    );

    expect(res).toEqual({ ok: true, synced: 1 });
    expect(batchCommitCalls).toHaveLength(1);
    expect(batchSetCalls).toHaveLength(1);
    expect(batchSetCalls[0].ref.id).toBe('omr_paper_1_hs_12');
    expect(batchSetCalls[0].data).toMatchObject({
      examId: 'paper_1',
      paperId: 'paper_1',
      classId: 'cls_12a1',
      studentId: 'hs_12',
      isPaperOmr: true,
      graded: true,
      score: 8,
    });
  });

  it('buildExamDocBlob dựng được file Word mẫu hợp lệ kể cả khi chưa có câu hỏi (initialExam trống)', async () => {
    const blob = await buildExamDocBlob({
      examTitle: 'ĐỀ KIỂM TRA ĐỊNH KÌ',
      subject: 'Hóa học',
      questions: [],
    });
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(500);
  });

  it('firestore.rules cho phép GVCN & GVBM liên kết cập nhật/xóa bài OMR kể cả khi không có doc /exams tương ứng', () => {
    const rules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
    expect(rules).toContain('function subOmrManager()');
    expect(rules).toContain('exists(/databases/$(database)/documents/exams/$(resource.data.examId))');
    expect(rules).toContain('exists(/databases/$(database)/documents/paperExams/$(resource.data.paperId))');
    expect(rules).toContain('(classOwner(request.resource.data.classId) || linkedToClass(request.resource.data.classId, request.auth.uid))');
    expect(rules).toMatch(/allow update:[\s\S]*subOmrManager\(\)/);
    expect(rules).toMatch(/allow delete:[\s\S]*subOmrManager\(\)/);
  });

  it('firestore.rules cho phép get doc class_analytics_reports khi chưa tồn tại (resource == null)', () => {
    const rules = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
    expect(rules).toMatch(/match \/class_analytics_reports\/\{reportId\}[\s\S]*allow get:\s*if signedIn\(\) && \(resource == null \|\| classOwner\(resource\.data\.classId\)\)/);
    expect(rules).toMatch(/match \/class_analytics_reports\/\{reportId\}[\s\S]*allow list:\s*if signedIn\(\) && classOwner\(resource\.data\.classId\)/);
  });

  it('classifyExamQuestionPart và keyP1FromExam không đếm trùng hay rò đáp án Phần II/III sang Phần I', () => {
    const mixedExam = {
      questions: [
        { type: 'true_false', statements: [{ text: 'a', answer: true }], correct: 2 },
        { type: 'short_answer', answer: '7,5', correct: 1 },
        { q: 'Legacy câu trả lời ngắn không type', answer: '42', correct: 3 },
        { type: 'single_choice', q: 'MCQ đầu tiên', options: ['A', 'B', 'C', 'D'], correct: 1 },
        { q: 'MCQ legacy không type', options: ['A', 'B', 'C', 'D'], correct: 3 },
      ],
    };
    const parts = mixedExam.questions.map(classifyExamQuestionPart);
    expect(parts).toEqual([2, 3, 3, 1, 1]);
    expect(keyP1FromExam(mixedExam, 4)).toEqual(['B', 'D', '', '']);
    expect(keyP2FromExam(mixedExam, 1)).toEqual([['D', '', '', '']]);
    expect(keyP3FromExam(mixedExam, 2)).toEqual([['7,5'], ['42']]);
  });

  it('duplicateExam giữ nguyên subject, grade, gradeType, allowRetry, shuffle và proctor', async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'exam_src',
      data: () => ({
        teacherId: 'gv_1',
        teacherName: 'Thầy Nam',
        classId: 'cls_12a',
        title: 'Kiểm tra Giữa kỳ I',
        description: 'Đề chuẩn 3 phần',
        duration: 45,
        questions: [{ type: 'single_choice', q: 'C1', options: ['A', 'B', 'C', 'D'], correct: 0 }],
        showAnswerAfter: false,
        allowRetry: true,
        shuffle: false,
        proctor: { camera: 'required', strictMode: true },
        subject: 'Vật lí',
        grade: 12,
        gradeType: 'dgk',
      }),
    });

    const dup = await duplicateExam('exam_src', { classId: 'cls_12b' });
    expect(dup).toMatchObject({
      classId: 'cls_12b',
      title: 'Kiểm tra Giữa kỳ I (bản sao)',
      subject: 'Vật lí',
      grade: 12,
      gradeType: 'dgk',
      showAnswerAfter: false,
      allowRetry: true,
      shuffle: false,
      proctor: { camera: 'required', strictMode: true },
    });
    expect(setDocCalls).toHaveLength(1);
    expect(setDocCalls[0].data).toMatchObject({
      subject: 'Vật lí',
      grade: 12,
      gradeType: 'dgk',
    });
  });
});

describe('Round 3 — Regression checks (insightAi, exportBundleZip, examSession, ExamPickerFromBank)', () => {
  it('insightAi dùng algorithmic fallback + báo aiError và không cache khi AI trả về JSON rỗng/thiếu field', async () => {
    const sampleInsights = {
      submissionCount: 18,
      avgPct: 58,
      passRate: 62,
      weakestTopics: [{ topic: 'Este - Lipit', rate: 38 }],
      hardest: [{ index: 0, rate: 25 }],
      atRisk: [{ name: 'HS A' }],
    };

    mockCallModel.mockResolvedValueOnce('{"foo": "bar"}');
    const partialRes = await generatePedagogicalInsights({
      insightsData: sampleInsights,
      className: '12A1',
      subject: 'Hóa học',
      forceRefresh: true,
      useAi: true,
    });

    expect(partialRes.isAiGenerated).toBe(false);
    expect(partialRes.aiError).toContain('chưa đầy đủ');
    expect(partialRes.headline).toBeTruthy();

    // Không bị cache shell lỗi: lần gọi tiếp với forceRefresh=false vẫn phải gọi lại AI
    mockCallModel.mockResolvedValueOnce(JSON.stringify({
      headline: 'Nhận xét chuẩn AI',
      summary: 'Lớp nắm vững cơ bản.',
      actions: [{ title: 'Ôn Este', steps: ['Chữa câu vận dụng'] }],
    }));
    const recoveredRes = await generatePedagogicalInsights({
      insightsData: sampleInsights,
      className: '12A1',
      subject: 'Hóa học',
      forceRefresh: false,
      useAi: true,
    });

    expect(mockCallModel).toHaveBeenCalledTimes(2);
    expect(recoveredRes.isAiGenerated).toBe(true);
    expect(recoveredRes.headline).toBe('Nhận xét chuẩn AI');
    expect(recoveredRes.aiError).toBeUndefined();
  });

  it('exportBundleZip báo lỗi khi versions rỗng và tính đúng ma trận & điểm Phần III theo môn học', async () => {
    await expect(exportBundleZip({ examTitle: 'Đề rỗng', versions: [] }))
      .rejects.toThrow('Chưa có mã đề để đóng gói ZIP.');

    const buildPartQuestions = (p1, p2, p3) => [
      ...Array.from({ length: p1 }, (_, i) => ({
        type: 'single_choice',
        level: i % 2 === 0 ? 'NB' : 'TH',
        q: `P1-${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
      })),
      ...Array.from({ length: p2 }, (_, i) => ({
        type: 'true_false',
        level: 'VD',
        q: `P2-${i + 1}`,
        statements: [
          { text: 'a', answer: true },
          { text: 'b', answer: false },
          { text: 'c', answer: true },
          { text: 'd', answer: false },
        ],
      })),
      ...Array.from({ length: p3 }, (_, i) => ({
        type: 'short_answer',
        level: 'VDC',
        q: `P3-${i + 1}`,
        answer: '5',
      })),
    ];

    const readMatrixText = async (zipBlob) => {
      const outer = await JSZip.loadAsync(await zipBlob.arrayBuffer());
      const entry = outer.file('Khung-Ma-Tran-Dac-Ta.docx');
      expect(entry).toBeTruthy();
      const raw = await entry.async('uint8array');
      if (raw[0] === 0x50 && raw[1] === 0x4b) {
        const inner = await JSZip.loadAsync(raw);
        const xml = await inner.file('word/document.xml').async('string');
        return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      }
      return new TextDecoder().decode(raw);
    };

    // Case 1: Toán học 12/4/6 -> Phần III = 0.50 đ/câu = 3.00 điểm, Tổng = 10.00
    const mathQs = buildPartQuestions(12, 4, 6);
    await exportBundleZip({
      examTitle: 'Đề Toán 12',
      subject: 'Toán học',
      versions: [{ code: '101', questions: mathQs }],
      originalQuestions: mathQs,
    });
    expect(savedDownloads).toHaveLength(1);
    const mathMatrixText = await readMatrixText(savedDownloads[0].blob);
    expect(mathMatrixText).toContain('12 câu (3.00 điểm)');
    expect(mathMatrixText).toContain('6 câu (3.00 điểm)');
    expect(mathMatrixText).toContain('Tổng điểm: 10.00 điểm');

    // Case 2: Hóa học 4/2/2 -> không còn hardcode 18/4/6, Phần III = 0.25 đ/câu = 0.50 điểm, Tổng = 3.50
    const chemQs = buildPartQuestions(4, 2, 2);
    await exportBundleZip({
      examTitle: 'Đề Hóa tùy chỉnh',
      subject: 'Hóa học',
      versions: [{ code: '201', questions: chemQs }],
      originalQuestions: chemQs,
    });
    expect(savedDownloads).toHaveLength(2);
    const chemMatrixText = await readMatrixText(savedDownloads[1].blob);
    expect(chemMatrixText).toContain('4 câu (1.00 điểm)');
    expect(chemMatrixText).toContain('2 câu (2.00 điểm)');
    expect(chemMatrixText).toContain('2 câu (0.50 điểm)');
    expect(chemMatrixText).toContain('Tổng điểm: 3.50 điểm');
  });

  it('các hàm giám sát examSession ném lỗi khi Firestore updateDoc thất bại thay vì nuốt lỗi', async () => {
    const permErr = new Error('permission-denied');

    updateDoc.mockRejectedValueOnce(permErr);
    await expect(endExamSession('sess_1')).rejects.toThrow('permission-denied');

    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ duration: 45, closesAtMs: Date.now() + 60_000 }),
    });
    updateDoc.mockRejectedValueOnce(permErr);
    await expect(extendExamSession('sess_1', 5)).rejects.toThrow('permission-denied');

    updateDoc.mockRejectedValueOnce(permErr);
    await expect(kickStudent({ sessionId: 'sess_1', studentId: 'hs_1', reason: 'test' }))
      .rejects.toThrow('permission-denied');

    updateDoc.mockRejectedValueOnce(permErr);
    await expect(warnStudent({ sessionId: 'sess_1', studentId: 'hs_1', message: 'Chú ý' }))
      .rejects.toThrow('permission-denied');

    updateDoc.mockRejectedValueOnce(permErr);
    await expect(setStudentPaused({ sessionId: 'sess_1', studentId: 'hs_1', paused: true }))
      .rejects.toThrow('permission-denied');

    updateDoc.mockRejectedValueOnce(permErr);
    await expect(setStudentForceSubmit({ sessionId: 'sess_1', studentId: 'hs_1' }))
      .rejects.toThrow('permission-denied');
  });

  it('ExamPickerFromBank render đúng câu Đúng/Sai và Trả lời ngắn không có mảng options', () => {
    globalThis.React = React;
    const tfHtml = renderToStaticMarkup(
      React.createElement(BankQuestionChoices, {
        q: {
          type: 'true_false',
          q: 'Nhận định về este',
          statements: [
            { text: 'Phản ứng thủy phân thuận nghịch', answer: true },
            { text: 'Không tan trong nước', answer: false },
          ],
        },
      })
    );
    expect(tfHtml).toContain('(Đ)');
    expect(tfHtml).toContain('(S)');
    expect(tfHtml).toContain('Phản ứng thủy phân thuận nghịch');

    const saHtml = renderToStaticMarkup(
      React.createElement(BankQuestionChoices, {
        q: {
          type: 'short_answer',
          q: 'Tính khối lượng',
          accepted: ['12,5'],
        },
      })
    );
    expect(saHtml).toContain('Đáp án:');
    expect(saHtml).toContain('12,5');

    const mcqHtml = renderToStaticMarkup(
      React.createElement(BankQuestionChoices, {
        q: {
          type: 'single_choice',
          q: 'CH4 thuộc loại gì?',
          options: ['Ankan', 'Anken', 'Ankin', 'Aren'],
          correct: 0,
        },
      })
    );
    expect(mcqHtml).toContain('Ankan');
    expect(mcqHtml).toContain('qb-item-opt correct');

    const pickerHtml = renderToStaticMarkup(
      React.createElement(ExamPickerFromBank, {
        teacherId: 'gv_1',
        onPick: () => {},
        onClose: () => {},
      })
    );
    expect(pickerHtml).toContain('Chọn câu từ ngân hàng');
  });

  it('Donut không vẽ vòng tròn fg khi value = 0 (tránh chấm tròn ở đỉnh)', () => {
    globalThis.React = React;
    const zeroHtml = renderToStaticMarkup(
      React.createElement(Donut, { value: 0, max: 100 })
    );
    expect(zeroHtml).toContain('vt-donut-bg');
    expect(zeroHtml).not.toContain('vt-donut-fg');

    const activeHtml = renderToStaticMarkup(
      React.createElement(Donut, { value: 75, max: 100 })
    );
    expect(activeHtml).toContain('vt-donut-fg');
    expect(activeHtml).toContain('stroke-dasharray');
  });

  it('formatClassBadge rút gọn tên lớp chuẩn xác (11A9, Lớp 12A1, nhiều từ)', () => {
    expect(formatClassBadge('11A9')).toBe('11A9');
    expect(formatClassBadge('Lớp 12A1')).toBe('12A1');
    expect(formatClassBadge('Đội tuyển Hóa 11')).toBe('ĐT');
    expect(formatClassBadge('ToánNângCao')).toBe('TOÁ');
    expect(formatClassBadge('')).toBe('?');
  });

  it('ClassDetailModal hiển thị Launchpad khi chưa có bài nộp và Analytics Bento khi đã có điểm', () => {
    globalThis.React = React;
    const baseClass = {
      id: 'cls_11a9',
      name: '11A9',
      subject: 'Sinh học',
      key: '11A9-8C72AL6H',
      teacherName: 'Cô Lan',
      members: [],
    };

    const emptyHtml = renderToStaticMarkup(
      React.createElement(ClassDetailModal, {
        classInfo: baseClass,
        exams: [{ id: 'e1', title: 'Đề trống', questions: [] }],
        initialSubmissionsMap: { e1: [] },
        onClose: () => {},
        onShareKey: () => {},
      })
    );
    expect(emptyHtml).toContain('cd-head-avatar is-long');
    expect(emptyHtml).toContain('>11A9<');
    expect(emptyHtml).toContain('cd-launchpad');
    expect(emptyHtml).toContain('cd-checklist');
    expect(emptyHtml).toContain('Đang chờ bài nộp');
    expect(emptyHtml).toContain('Chưa ghi nhận');
    expect(emptyHtml).toContain('data-tone="ok"');
    expect(emptyHtml).toContain('Chưa có dữ liệu điểm');
    expect(emptyHtml).toContain('Chưa có câu hỏi');
    expect(emptyHtml).toContain('Sao chép mã');
    expect(emptyHtml).toContain('Mở mục Đề thi');
    expect(emptyHtml).not.toContain('vt-donut-fg');
    expect(emptyHtml).not.toContain('vt-chart');
    expect(emptyHtml).not.toContain('class="cd-btn ');

    const exams = [
      { id: 'e1', title: 'Đề 1', questions: [{ q: 'Q1' }] },
      { id: 'e2', title: 'Đề 2 chưa nộp', questions: [{ q: 'Q2' }] },
    ];
    const submissionsMap = {
      e1: [{ studentId: 's1', score: 8, totalPoints: 10, violationCount: 2 }],
      e2: [],
    };
    expect(buildTrendPoints(exams, submissionsMap)).toEqual([
      { label: 'Đề 1', value: 80 },
    ]);

    const populatedHtml = renderToStaticMarkup(
      React.createElement(ClassDetailModal, {
        classInfo: { ...baseClass, members: [{ id: 's1', name: 'Nguyễn An' }] },
        exams,
        initialSubmissionsMap: submissionsMap,
        onClose: () => {},
      })
    );
    expect(populatedHtml).not.toContain('cd-launchpad');
    expect(populatedHtml).toContain('vt-donut-fg');
    expect(populatedHtml).toContain('vt-chart');
    expect(populatedHtml).toContain('1 đề có bài');
    expect(populatedHtml).toContain('80%');
    expect(populatedHtml).toContain('Cần rà soát');
    expect(populatedHtml).toContain('data-tone="warn"');
    expect(populatedHtml).toContain('<small>Đề 1</small>');
    expect(populatedHtml).not.toContain('<small>Đề 2 chưa nộp</small>');
  });

  it('StudentModal hiển thị icon khiên xanh khi không có vi phạm và cảnh báo đỏ khi có vi phạm', () => {
    globalThis.React = React;
    const cleanHtml = renderToStaticMarkup(
      React.createElement(StudentModal, {
        student: {
          name: 'Nguyễn Văn An',
          email: 'an@example.com',
          avgScore: 90,
          totalExams: 1,
          submissions: [{ id: 'sub_1', score: 9, totalPoints: 10, violationCount: 0, timeSpent: 320 }],
        },
        onClose: () => {},
      })
    );
    expect(cleanHtml).toContain('cd-stat-card-ico green');
    expect(cleanHtml).not.toContain('cd-stat-card danger');
    expect(cleanHtml).toContain('M12 3l7 3v5c0 4.6-2.9 8.4-7 10-4.1-1.6-7-5.4-7-10V6z');

    const flaggedHtml = renderToStaticMarkup(
      React.createElement(StudentModal, {
        student: {
          name: 'Trần Bình',
          email: 'binh@example.com',
          avgScore: 70,
          totalExams: 1,
          submissions: [{ id: 'sub_2', score: 7, totalPoints: 10, violationCount: 3, timeSpent: 400 }],
        },
        onClose: () => {},
      })
    );
    expect(flaggedHtml).toContain('cd-stat-card danger');
    expect(flaggedHtml).toContain('cd-stat-card-ico red');
  });

  it('CSS responsive của ClassDetailModal chỉ bung full-screen từ 640px trở xuống và dash-vitality hỗ trợ t-shell light', () => {
    const cdCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/class-detail.css'), 'utf8');
    const max900Match = cdCss.match(/@media \(max-width: 900px\) \{([\s\S]*?)@media \(max-width: 760px\)/);
    expect(max900Match?.[1]).toBeTruthy();
    expect(max900Match[1]).not.toContain('100dvh');
    expect(max900Match[1]).not.toContain('border-radius: 0');
    expect(cdCss).toMatch(/@media \(max-width: 640px\) \{[\s\S]*100dvh[\s\S]*border-radius: 0/);

    const vtCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/dash-vitality.css'), 'utf8');
    expect(vtCss).toContain('.t-shell');
    expect(vtCss).toContain("--vt-tint");
  });
});
