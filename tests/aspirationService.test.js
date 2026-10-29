import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getReferenceMetadata,
  getExams,
  getSchools,
  searchSchools,
  getMajorsBySchool,
  suggestTargetScore,
  getUserAspirationsState,
  upsertAspiration,
  deleteAspiration,
  reorderAspirations,
  setActiveAspiration,
  setSelectedExam,
  computeStudentProgress,
} from '../src/lib/aspirationService.js';

describe('Giai đoạn 1 — Mô hình dữ liệu & aspirationService', () => {
  let memoryStore = {};

  beforeEach(() => {
    memoryStore = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
      setItem: (k, v) => { memoryStore[k] = String(v); },
      removeItem: (k) => { delete memoryStore[k]; },
    });
    vi.stubGlobal('window', {
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    });
  });

  it('Dữ liệu JSON có đầy đủ trường nam, nguon, 6 kỳ thi và ít nhất 8 trường đại học', () => {
    const meta = getReferenceMetadata();
    expect(meta.nam).toBe(2024);
    expect(meta.nguon).toBeTruthy();
    expect(meta.nhanHienThi).toContain('Dữ liệu tham khảo năm 2024');

    const exams = getExams();
    const examIds = exams.map((e) => e.id);
    expect(examIds).toEqual(['THPTQG', 'HSA', 'TSA', 'V-ACT', 'SPT', 'H-SCA']);

    const schools = getSchools();
    expect(schools.length).toBeGreaterThanOrEqual(8);
    expect(schools.some((s) => s.code === 'ANND')).toBe(true);
    expect(schools.some((s) => s.code === 'NEU')).toBe(true);
    expect(schools.some((s) => s.code === 'TNU')).toBe(true);
  });

  it('Tìm kiếm trường theo tên/mã viết tắt và lọc ngành theo trường (kèm ghi chú nam/nữ, miền)', () => {
    const hits = searchSchools('annd');
    expect(hits).toHaveLength(1);
    expect(hits[0].name).toContain('An Ninh Nhân Dân');

    const anndMajors = getMajorsBySchool('ANND');
    expect(anndMajors.length).toBeGreaterThanOrEqual(4);
    expect(anndMajors[0].note).toContain('miền Bắc');

    const suggestion = suggestTargetScore(anndMajors[0], 'THPTQG');
    expect(suggestion.cutoffScore).toBe(24.94);
    expect(suggestion.suggestedTarget).toBeGreaterThan(24.94);
    expect(suggestion.referenceLabel).toContain('Dữ liệu tham khảo năm 2024');
  });

  it('CRUD Nguyện vọng: thêm tối đa 3 nguyện vọng, xóa, đổi thứ tự ưu tiên 1-2-3 và đổi kỳ thi', () => {
    const uid = 'student-01';
    upsertAspiration(uid, { schoolId: 'NEU', majorId: 'neu-cntt', examId: 'THPTQG' });
    upsertAspiration(uid, { schoolId: 'TNU', majorId: 'tnu-spta', examId: 'THPTQG' });
    upsertAspiration(uid, { schoolId: 'ANND', majorId: 'annd-anm-nam-bac', examId: 'THPTQG' });

    // Thử thêm nguyện vọng thứ 4 -> bị chặn ở mức tối đa 3/3
    upsertAspiration(uid, { schoolId: 'BKA', majorId: 'bka-kthoa', examId: 'THPTQG' });

    let state = getUserAspirationsState(uid);
    expect(state.aspirations).toHaveLength(3);
    expect(state.aspirations.map((a) => a.priority)).toEqual([1, 2, 3]);
    expect(state.aspirations.map((a) => a.schoolId)).toEqual(['NEU', 'TNU', 'ANND']);

    // Đổi thứ tự ưu tiên: đưa ANND lên số 1
    const [a1, a2, a3] = state.aspirations;
    state = reorderAspirations(uid, [a3.id, a1.id, a2.id]);
    expect(state.aspirations.map((a) => a.schoolId)).toEqual(['ANND', 'NEU', 'TNU']);
    expect(state.aspirations[0].priority).toBe(1);

    // Đổi kỳ thi sang HSA -> thang điểm 150
    state = setSelectedExam(uid, 'HSA');
    expect(state.selectedExamId).toBe('HSA');

    // Xóa nguyện vọng 2 (NEU) -> còn 2 nguyện vọng đánh số 1, 2
    state = deleteAspiration(uid, a1.id);
    expect(state.aspirations).toHaveLength(2);
    expect(state.aspirations.map((a) => a.priority)).toEqual([1, 2]);
  });

  it('computeStudentProgress tính đúng điểm dự đoán, khoảng cách điểm, trạng thái và lịch sử Elo theo ngày', () => {
    const uid = 'student-02';
    upsertAspiration(uid, {
      schoolId: 'BKA',
      majorId: 'bka-kthoa',
      examId: 'THPTQG',
      targetScore: 25.0,
    });

    const now = Date.now();
    // Trường hợp 1: Điểm dự đoán thấp hơn mục tiêu >= 1 điểm -> Cần tăng tốc
    const pSlow = computeStudentProgress(uid, {
      overview: { hasEvidence: true, avgMastery: 72, totalAnswers: 20 },
      events: [{ at: now - 86400000, ok: true }, { at: now, ok: true }],
      now,
    });
    expect(pSlow.predictedScore).toBe(21.5); // 72% của 30 làm tròn bước 0.25 -> 21.5
    expect(pSlow.targetScore).toBe(25.0);
    expect(pSlow.scoreGap).toBe(3.5);
    expect(pSlow.status).toBe('Cần tăng tốc');
    expect(pSlow.elo).toBeGreaterThan(1500);
    expect(pSlow.eloHistory).toHaveLength(14);

    // Trường hợp 2: Điểm dự đoán sát mục tiêu (< 1 điểm) -> Đúng tiến độ
    const pOnTrack = computeStudentProgress(uid, {
      overview: { hasEvidence: true, avgMastery: 82, totalAnswers: 40 },
      events: [{ at: now, ok: true }],
      now,
    });
    expect(pOnTrack.predictedScore).toBe(24.5);
    expect(pOnTrack.status).toBe('Đúng tiến độ');

    // Trường hợp 3: Đổi nguyện vọng đang chọn -> mục tiêu cập nhật theo
    const s2 = upsertAspiration(uid, {
      schoolId: 'YHA',
      majorId: 'yha-ykhoa',
      examId: 'THPTQG',
      targetScore: 28.5,
      setActive: true,
    });
    setActiveAspiration(uid, s2.aspirations[1].id);
    const pChanged = computeStudentProgress(uid, {
      overview: { hasEvidence: true, avgMastery: 82, totalAnswers: 40 },
      events: [{ at: now, ok: true }],
      now,
    });
    expect(pChanged.targetScore).toBe(28.5);
    expect(pChanged.status).toBe('Cần tăng tốc');
  });
});
