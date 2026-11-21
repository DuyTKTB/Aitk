import { describe, it, expect } from 'vitest';
import {
  CURRICULUM_NODES,
  SUBJECT_ORDER,
  getChapterMeta,
  getCurriculumChapters,
  getCurriculumStages,
  getUpstreamIds,
  getDownstreamIds,
  getSubjectsForBlock,
  detectAdaptiveDetour,
  computeWeightedExamScore,
  validateDagAcyclic,
} from '../src/data/curriculumDag.js';
import { DEDICATED_LESSONS, findLessonByChapterId } from '../src/data/dedicatedLessonsData.js';
import { buildAutoRoadmapData } from '../src/lib/autoRoadmapEngine.js';

describe('GDPT 2018 Knowledge DAG Curriculum (49 chuyên đề KHTN)', () => {
  it('đủ 49 chuyên đề không trùng ID và 100% DAG không chu trình cho cả 3 môn', () => {
    expect(CURRICULUM_NODES.length).toBe(49);
    const ids = CURRICULUM_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(49);

    expect(getCurriculumChapters('hoa').length).toBe(22);
    expect(getCurriculumChapters('ly').length).toBe(14);
    expect(getCurriculumChapters('sinh').length).toBe(13);

    SUBJECT_ORDER.forEach((sub) => {
      const check = validateDagAcyclic(sub);
      expect(check.valid).toBe(true);
      expect(check.hasCycle).toBe(false);
      expect(check.missingRefs).toEqual([]);
      expect(getCurriculumStages(sub).length).toBe(5);
    });
  });

  it('sửa chuẩn 100% logic khối lớp và quan hệ tiên quyết GDPT 2018', () => {
    // Vật lí: Từ trường phải ở Lớp 12; tách Vật lí nhiệt & Khí lí tưởng
    const tutruong = getChapterMeta('ly-c4-tutruong');
    expect(tutruong.grade).toBe(12);
    expect(getChapterMeta('ly-c1-nhiet').grade).toBe(12);
    expect(getChapterMeta('ly-c2-khi').grade).toBe(12);
    expect(getUpstreamIds('ly-c2-khi')).toContain('ly-c1-nhiet');
    expect(getUpstreamIds('ly-c4-tutruong')).toContain('ly-c4-dongdien');

    // Hóa học: Pin điện nối từ Oxi hóa-Khử & Cân bằng (không nối từ Polymer)
    const electroUp = getUpstreamIds('c12-electro');
    expect(electroUp).toContain('c10-redox');
    expect(electroUp).toContain('c11-equilibrium');
    expect(electroUp).not.toContain('c12-polymer');

    // Hóa học: Đại cương kim loại đi TRƯỚC Kim loại IA/IIA; Polymer đi SAU Amine & Carbohydrate
    expect(getUpstreamIds('c12-metal-main')).toContain('c12-metal');
    expect(getUpstreamIds('c12-polymer')).toContain('c12-amine');
    expect(getUpstreamIds('c12-polymer')).toContain('c12-carbohydrate');

    // Sinh học: Di truyền Quần thể đi TRƯỚC cả Tiến hóa và Phả hệ; Sinh thái học là chuyên đề 12 riêng
    expect(getUpstreamIds('sinh-c5-tienhoa')).toContain('sinh-c4-quanthe');
    expect(getUpstreamIds('sinh-c6-ditruyen-nguoi')).toContain('sinh-c4-quanthe');
    expect(getChapterMeta('sinh-c9-sinhthai').grade).toBe(12);
    expect(getDownstreamIds('sinh-c4-quanthe')).toContain('sinh-c5-tienhoa');
  });

  it('mọi chuyên đề trong cả 49 node đều ánh xạ 1-1 tới bài học riêng cùng phân môn trong DEDICATED_LESSONS', () => {
    // Kiểm tra Từ trường trong DEDICATED_LESSONS đã được sửa đúng về Lớp 12
    const tutruongDed = DEDICATED_LESSONS.ly.find((c) => c.chapterId === 'ly-c4-tutruong');
    expect(tutruongDed?.grade).toBe(12);

    CURRICULUM_NODES.forEach((node) => {
      expect(node.dedicatedChapterId).toBe(node.id);
      const hit = findLessonByChapterId(node.dedicatedChapterId);
      expect(hit, `Thiếu bài học cho ${node.id} (${node.dedicatedChapterId})`).not.toBeNull();
      expect(hit.chapterId).toBe(node.id);
      expect(hit.subjectKey).toBe(node.subject);
    });

    // Kiểm tra các chương trọng tâm mới mở rộng có đủ câu hỏi 3 định dạng 2025-2026
    const khi = findLessonByChapterId('ly-c2-khi');
    const khiTypes = new Set((khi?.sampleQuestions || []).map((q) => q.type));
    expect(khiTypes.has('mcq')).toBe(true);
    expect(khiTypes.has('true_false')).toBe(true);
    expect(khiTypes.has('short_answer')).toBe(true);

    const sinhthai = findLessonByChapterId('sinh-c9-sinhthai');
    const stTypes = new Set((sinhthai?.sampleQuestions || []).map((q) => q.type));
    expect(stTypes.has('mcq')).toBe(true);
    expect(stTypes.has('true_false')).toBe(true);
    expect(stTypes.has('short_answer')).toBe(true);
  });

  it('tính điểm dự đoán THPT 2025–2026 chuẩn 3 phần (4.5 + 4.0 + 1.5 = 10)', () => {
    const emptyRes = computeWeightedExamScore([], 'ly');
    expect(emptyRes.hasEvidence).toBe(false);
    expect(emptyRes.part1).toBeLessThanOrEqual(4.5);
    expect(emptyRes.part2).toBeLessThanOrEqual(4.0);
    expect(emptyRes.part3).toBeLessThanOrEqual(1.5);

    const perfectViews = getCurriculumChapters('hoa').map((n) => ({
      chapter: n,
      summary: { answers: 15, correct: 15 },
      mastery: { score: 100 },
    }));
    const perfect = computeWeightedExamScore(perfectViews, 'hoa');
    expect(perfect.hasEvidence).toBe(true);
    expect(perfect.part1).toBe(4.5);
    expect(perfect.part2).toBe(4.0);
    expect(perfect.part3).toBe(1.5);
    expect(perfect.total10).toBe(10);

    const midViews = getCurriculumChapters('sinh').map((n) => ({
      chapter: n,
      summary: { answers: 10, correct: 7 },
      mastery: { score: 70 },
    }));
    const mid = computeWeightedExamScore(midViews, 'sinh');
    expect(mid.hasEvidence).toBe(true);
    expect(mid.total10).toBeGreaterThan(5.5);
    expect(mid.total10).toBeLessThan(8.5);
  });

  it('phát hiện đúng Adaptive Detour khi kiến thức gốc yếu & ánh xạ đúng Tổ hợp xét tuyển', () => {
    expect(getSubjectsForBlock('A00')).toEqual(['ly', 'hoa']);
    expect(getSubjectsForBlock('B00')).toEqual(['hoa', 'sinh']);
    expect(getSubjectsForBlock('A01')).toEqual(['ly']);

    const viewsMap = {
      'c10-redox': { summary: { answers: 8, correct: 3 }, mastery: { score: 35 } },
      'c11-equilibrium': { summary: { answers: 10, correct: 9 }, mastery: { score: 88 } },
    };
    const detour = detectAdaptiveDetour('c12-electro', viewsMap);
    expect(detour).not.toBeNull();
    expect(detour.rootId).toBe('c10-redox');
    expect(detour.tested).toBe(true);
  });

  it('buildAutoRoadmapData hoạt động động theo đúng môn Vật lí / Sinh học không dính nhãn Hóa', () => {
    const lyChapters = getCurriculumChapters('ly').map((n) => ({
      chapter: n,
      summary: n.id === 'ly-c1-nhiet' ? { answers: 10, correct: 6 } : null,
      mastery: n.id === 'ly-c1-nhiet' ? { score: 58, accuracy: 60 } : { score: null, accuracy: null },
      review: { isDue: false, overdueDays: 0 },
    }));
    const rm = buildAutoRoadmapData({
      uid: null,
      subjectKey: 'ly',
      overview: { hasEvidence: true, avgMastery: 58, accuracy: 60 },
      chapters: lyChapters,
      events: [],
    });
    expect(rm.subjectKey).toBe('ly');
    expect(rm.subjectLabel).toBe('Vật lí');
    expect(rm.paceAdvice).toContain('Vật lí');
    expect(rm.paceAdvice).not.toContain('điểm Hóa');
    expect(rm.weightedExam.hasEvidence).toBe(true);
  });
});
