import { describe, it, expect } from 'vitest';
import { resolveRange, buildLearningAnalytics } from '../src/lib/learningAnalytics.js';
import {
  buildAiContext, validateReport, auditNumbers, numericCorpus,
  buildRuleBasedReport, applyNumberAudit, AiReportError, reportStaleness,
  buildPrompt,
} from '../src/lib/learningAnalyticsReport.js';

const NOW = new Date('2026-10-20T10:00:00Z').getTime();
const DAY = 86400000;

const classInfo = {
  id: 'c1',
  name: '12A1',
  subject: 'Hóa học',
  teacherId: 't0',
  teacherName: 'Cô chủ nhiệm',
  members: [
    { id: 's1', name: 'Nguyễn Văn An', email: 'an@truong.edu.vn' },
    { id: 's2', name: 'Trần Thị Bình', email: 'binh@truong.edu.vn' },
    { id: 's3', name: 'Lê Chi', email: 'chi@truong.edu.vn' },
  ],
};

const exams = [
  {
    id: 'e1', classId: 'c1', teacherId: 't1', teacherName: 'Thầy B', title: 'KT Hóa 1',
    subject: 'Hóa học', createdAt: NOW - 3 * DAY, opensAt: NOW - 3 * DAY,
    questions: [{ q: 'C1', topic: 'Oxi hóa khử', correct: 1 }, { q: 'C2', topic: 'Oxi hóa khử', correct: 0 }],
    totalPoints: 2,
  },
  {
    id: 'e2', classId: 'c1', teacherId: 't1', teacherName: 'Thầy B', title: 'KT Hóa 2',
    subject: 'Hóa học', createdAt: NOW - DAY, opensAt: NOW - DAY,
    questions: [{ q: 'C1', topic: 'Cân bằng', correct: 2 }],
    totalPoints: 1,
  },
];

const subsFor = (list) => ({
  e1: list.map((x, i) => ({
    studentId: `s${(i % 3) + 1}`,
    studentName: classInfo.members[i % 3].name,
    score: x, totalPoints: 2, submittedAt: NOW - 3 * DAY,
    detail: [{ picked: 1, isCorrect: x >= 1 }, { picked: 0, isCorrect: false }],
  })),
  e2: [{ studentId: 's1', studentName: 'Nguyễn Văn An', score: 0, totalPoints: 1, submittedAt: NOW - DAY, detail: [{ picked: 0, isCorrect: false }] }],
});

const analytics = buildLearningAnalytics({
  classInfo,
  exams,
  submissionsMap: subsFor([2, 1, 0, 2, 1, 0]),
  teachers: [{ teacherId: 't1', teacherName: 'Thầy B', subject: 'Hóa học' }],
  range: resolveRange('30', { now: NOW }),
  now: NOW,
});

describe('buildAiContext', () => {
  const ctx = buildAiContext(analytics);

  it('không chứa tên hay email học sinh', () => {
    const text = JSON.stringify(ctx);
    expect(text).not.toContain('Nguyễn Văn An');
    expect(text).not.toContain('Trần Thị Bình');
    expect(text).not.toContain('truong.edu.vn');
  });

  it('giữ số liệu tổng hợp cần cho phân tích', () => {
    expect(ctx.quyMo.soHocSinh).toBe(3);
    expect(ctx.quyMo.soDe).toBe(2);
    expect(ctx.quyMo.soLuotNop).toBe(7);
    expect(ctx.chiSo.diemTrungBinh).toBe(analytics.overview.avgPct);
    expect(Array.isArray(ctx.theoMon)).toBe(true);
    expect(ctx.theoMon[0].mon).toBe('Hóa học');
  });

  it('học sinh được thay bằng mã HSxx', () => {
    expect(ctx.hocSinh.every((s) => /^HS\d{2}$/.test(s.ma))).toBe(true);
  });

  it('giới hạn số phần tử gửi đi (tránh prompt quá dài)', () => {
    expect(ctx.hocSinh.length).toBeLessThanOrEqual(25);
    expect(ctx.chuDe.length).toBeLessThanOrEqual(20);
  });
});

describe('buildPrompt', () => {
  it('nêu phạm vi môn và yêu cầu JSON', () => {
    const p = buildPrompt({ ctx: buildAiContext(analytics), focusSubject: 'Hóa học' });
    expect(p).toContain('Hóa học');
    expect(p).toContain('summary');
    expect(p).toContain('basedOn');
  });
});

describe('validateReport', () => {
  const good = {
    summary: 'Lớp có 7 bài nộp, điểm trung bình 41%.',
    findings: [{ title: 'Chủ đề Oxi hóa khử yếu', detail: 'Chỉ 33% đúng', evidence: '4/12 lượt' }],
    evidence: ['7 bài nộp trên 2 đề'],
    risks: [{ title: 'Thiếu dữ liệu chủ đề', priority: 'high', detail: 'Nhiều câu chưa gắn chủ đề' }],
    recommendations: [{ action: 'Ôn lại số oxi hóa', target: 'Toàn lớp', timeframe: 'Tiết tới', basedOn: '33% đúng' }],
    perSubject: [{ subject: 'Hóa học', summary: 'TB 41%', weakTopics: ['Oxi hóa khử'] }],
    limitations: ['Chỉ 2 đề'],
  };

  it('chấp nhận báo cáo đúng cấu trúc', () => {
    const r = validateReport(good);
    expect(r.summary).toContain('7 bài');
    expect(r.findings).toHaveLength(1);
    expect(r.risks[0].priority).toBe('high');
    expect(r.recommendations[0].action).toContain('Ôn lại');
  });

  it('ném lỗi khi thiếu summary', () => {
    expect(() => validateReport({ findings: [] })).toThrow(AiReportError);
  });

  it('ném lỗi khi không phải object', () => {
    expect(() => validateReport('xin chào')).toThrow(/JSON/);
    expect(() => validateReport([1, 2])).toThrow(AiReportError);
  });

  it('ném lỗi khi nội dung rỗng', () => {
    expect(() => validateReport({ summary: 'Có', findings: [], evidence: [], recommendations: [] }))
      .toThrow(/rỗng/);
  });

  it('chuẩn hoá chuỗi thành object và cắt số lượng', () => {
    const many = Array.from({ length: 30 }, (_, i) => `Phát hiện ${i}`);
    const r = validateReport({ summary: 'Tóm tắt', findings: many, evidence: 'một dòng' });
    expect(r.findings).toHaveLength(10);
    expect(r.findings[0]).toHaveProperty('title');
    expect(r.evidence).toEqual(['một dòng']);
  });

  it('loại bỏ thẻ HTML và ưu tiên không hợp lệ → medium', () => {
    const r = validateReport({
      summary: '<b>Tóm tắt</b>',
      risks: [{ title: 'R', priority: 'urgent' }],
      findings: ['x'],
    });
    expect(r.summary).not.toContain('<b>');
    expect(r.risks[0].priority).toBe('medium');
  });

  it('đọc được khoá tiếng Việt (AI đôi khi trả sai ngôn ngữ khoá)', () => {
    const r = validateReport({
      tomTat: 'Tóm tắt tiếng Việt',
      findings: [{ phatHien: 'Phát hiện A', canCu: 'số liệu' }],
    });
    expect(r.summary).toBe('Tóm tắt tiếng Việt');
    expect(r.findings[0].title).toBe('Phát hiện A');
  });
});

describe('auditNumbers', () => {
  const corpus = numericCorpus(analytics);

  it('chấp nhận phần trăm lấy từ dữ liệu', () => {
    const report = validateReport({
      summary: `Điểm trung bình ${analytics.overview.avgPct}%.`,
      findings: ['ok'],
    });
    const audit = auditNumbers(report, corpus);
    expect(audit.unverified).toHaveLength(0);
    expect(audit.checked).toBeGreaterThan(0);
  });

  it('bắt phần trăm không có trong dữ liệu', () => {
    const report = validateReport({
      summary: 'Lớp đạt 97% và 88%.',
      findings: ['ok'],
    });
    const audit = auditNumbers(report, corpus);
    expect(audit.unverified.length).toBeGreaterThanOrEqual(2);
  });

  it('cho phép lệch 1 do làm tròn', () => {
    const base = analytics.overview.avgPct;
    const report = validateReport({ summary: `Khoảng ${base + 1}%.`, findings: ['ok'] });
    expect(auditNumbers(report, corpus).unverified).toHaveLength(0);
  });

  it('applyNumberAudit thêm ghi chú vào limitations', () => {
    const report = validateReport({ summary: 'Đạt 96%.', findings: ['ok'], limitations: ['cũ'] });
    const audit = auditNumbers(report, corpus);
    const withNote = applyNumberAudit(report, audit);
    expect(withNote.limitations.length).toBe(2);
    expect(withNote.limitations[1]).toContain('96%');
  });
});

describe('buildRuleBasedReport', () => {
  const r = buildRuleBasedReport(analytics);

  it('có tóm tắt dựa trên số liệu thật', () => {
    expect(r.summary).toContain('lượt làm bài');
    expect(r.summary).toContain(String(analytics.overview.submissions));
    expect(r.summary).toContain(String(analytics.overview.exams));
  });

  it('nêu rõ đây là báo cáo bằng luật, không phải AI', () => {
    expect(r.limitations[0]).toContain('luật');
  });

  it('đề xuất bám vào cảnh báo đã tính', () => {
    if (analytics.warnings.length) {
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations[0].basedOn.length).toBeGreaterThan(0);
    }
  });

  it('không sập khi dữ liệu rỗng', () => {
    const empty = buildLearningAnalytics({
      classInfo, exams: [], submissionsMap: {}, teachers: [],
      range: resolveRange('30', { now: NOW }), now: NOW,
    });
    const rr = buildRuleBasedReport(empty);
    expect(rr.summary).toContain('chưa có lượt làm bài');
    expect(rr.recommendations[0].action).toContain('đề');
  });
});

describe('reportStaleness', () => {
  it('phát hiện báo cáo cũ khi fingerprint khác', () => {
    const saved = { dataFingerprint: 'abc' };
    expect(reportStaleness(saved, analytics).stale).toBe(true);
  });

  it('không báo cũ khi fingerprint trùng', () => {
    const saved = { dataFingerprint: analytics.meta.fingerprint };
    expect(reportStaleness(saved, analytics).stale).toBe(false);
  });

  it('báo cáo thiếu fingerprint bị coi là cũ', () => {
    expect(reportStaleness({}, analytics).stale).toBe(true);
  });
});
