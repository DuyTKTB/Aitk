import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ADMISSION_BLOCKS_INFO,
  calculateSubjectScoreBreakdown,
  evaluateAdmissionProbability,
  diagnoseKeyTopics,
  generateStrategicRoadmap,
  buildComprehensiveAiStrategy,
  applyAiStrategyToRoadmap,
  getSavedAiStrategy,
} from '../src/lib/aspirationAiEngine.js';

describe('aspirationAiEngine — Động cơ AI phân tích nguyện vọng & lộ trình chiến lược', () => {
  let memoryStore = {};

  beforeEach(() => {
    memoryStore = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
      setItem: (k, v) => { memoryStore[k] = String(v); },
      removeItem: (k) => { delete memoryStore[k]; },
      clear: () => { memoryStore = {}; },
    });
    vi.stubGlobal('window', {
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      CustomEvent: class CustomEvent {
        constructor(type, detail) {
          this.type = type;
          this.detail = detail?.detail;
        }
      },
      Event: class Event {
        constructor(type) {
          this.type = type;
        }
      },
    });
  });

  it('Có đầy đủ các tổ hợp xét tuyển KHTN chuẩn Bộ GD&ĐT (A00, B00, A01, D07, A02, B08)', () => {
    expect(ADMISSION_BLOCKS_INFO.A00).toBeDefined();
    expect(ADMISSION_BLOCKS_INFO.A00.subjects).toEqual(['Toán', 'Vật lí', 'Hóa học']);

    expect(ADMISSION_BLOCKS_INFO.B00).toBeDefined();
    expect(ADMISSION_BLOCKS_INFO.B00.subjects).toEqual(['Toán', 'Hóa học', 'Sinh học']);

    expect(ADMISSION_BLOCKS_INFO.A01).toBeDefined();
    expect(ADMISSION_BLOCKS_INFO.D07).toBeDefined();
  });

  it('calculateSubjectScoreBreakdown phân bổ điểm thành phần từng môn chính xác theo thang 30', () => {
    const breakdown = calculateSubjectScoreBreakdown('A00', 27.0, 30);
    expect(breakdown).toHaveLength(3);
    const sum = breakdown.reduce((acc, cur) => acc + cur.targetScore, 0);
    expect(Math.abs(sum - 27.0)).toBeLessThanOrEqual(0.5);
    expect(breakdown[0].subjectName).toBe('Toán');
    expect(breakdown[1].subjectName).toBe('Vật lí');
    expect(breakdown[2].subjectName).toBe('Hóa học');
  });

  it('evaluateAdmissionProbability đánh giá đúng các mức An toàn, Vừa sức và Thách thức', () => {
    // Cao hơn điểm chuẩn 1.5đ -> An toàn
    const safe = evaluateAdmissionProbability({ predictedScore: 26.5, cutoffScore: 25.0, examScale: 30 });
    expect(safe.levelKey).toBe('safe');
    expect(safe.probabilityPct).toBeGreaterThanOrEqual(80);

    // Bằng điểm chuẩn -> Vừa sức
    const target = evaluateAdmissionProbability({ predictedScore: 25.0, cutoffScore: 25.0, examScale: 30 });
    expect(target.levelKey).toBe('target');
    expect(target.probabilityPct).toBeGreaterThanOrEqual(50);

    // Thấp hơn điểm chuẩn 2.5đ -> Thách thức
    const reach = evaluateAdmissionProbability({ predictedScore: 22.0, cutoffScore: 25.0, examScale: 30 });
    expect(reach.levelKey).toBe('reach');
    expect(reach.probabilityPct).toBeLessThan(50);
  });

  it('diagnoseKeyTopics chẩn đoán đúng chuyên đề trọng tâm theo ban KHTN', () => {
    const diagnosedA00 = diagnoseKeyTopics({ blockCode: 'A00', chapters: [], dueByTopic: {} });
    expect(diagnosedA00.length).toBeGreaterThan(0);
    // Khối A00 gồm Lý và Hóa
    const hasPhysicsOrChem = diagnosedA00.some((t) => t.subject === 'hoa' || t.subject === 'ly');
    expect(hasPhysicsOrChem).toBe(true);

    const diagnosedB00 = diagnoseKeyTopics({ blockCode: 'B00', chapters: [], dueByTopic: {} });
    const hasBio = diagnosedB00.some((t) => t.subject === 'sinh');
    expect(hasBio).toBe(true);
  });

  it('generateStrategicRoadmap sinh đúng 3 giai đoạn lộ trình với mục tiêu tăng dần', () => {
    const roadmap = generateStrategicRoadmap({
      targetScore: 27.0,
      predictedScore: 21.0,
      weeksUntilExam: 20,
      weeklyFreeHours: 5,
      blockCode: 'A00',
      diagnosedTopics: [{ id: 'c12-ester', name: 'Este', phase: 1 }, { id: 'c12-electro', name: 'Điện hóa', phase: 2 }],
    });

    expect(roadmap).toHaveLength(3);
    expect(roadmap[0].phaseName).toContain('Giai đoạn 1');
    expect(roadmap[1].phaseName).toContain('Giai đoạn 2');
    expect(roadmap[2].phaseName).toContain('Giai đoạn 3');
  });

  it('buildComprehensiveAiStrategy và applyAiStrategyToRoadmap lưu và kích hoạt chiến lược thành công', () => {
    const strategy = buildComprehensiveAiStrategy({
      uid: 'test-user',
      activeAspiration: {
        school: { code: 'BKA', name: 'ĐH Bách Khoa Hà Nội' },
        major: { name: 'Kỹ thuật Hóa học', majorCode: 'CH1' },
        block: 'A00',
        targetScore: 26.0,
        cutoffScore: 24.5,
      },
      progress: { predictedScore: 23.5 },
      schedule: { weeksUntilExam: 16, weeklyFreeHours: 6 },
    });

    expect(strategy.school.code).toBe('BKA');
    expect(strategy.strategicRoadmap).toHaveLength(3);

    const applied = applyAiStrategyToRoadmap('test-user', strategy);
    expect(applied).toBe(true);

    const saved = getSavedAiStrategy('test-user');
    expect(saved).toBeTruthy();
    expect(saved.appliedAt).toBeTruthy();
    expect(saved.school.code).toBe('BKA');
  });
});
