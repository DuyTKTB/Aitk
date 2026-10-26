import { describe, it, expect } from 'vitest';
import {
  buildLearningAnalytics, resolveRange, buildDistribution, mean, median, stdev,
  pctOf, chooseGranularity, anonymizeForAi, THRESHOLDS,
  BANDS, classifyPct, bandLabel, bandCounts, buildSubjectStudents,
  resolveBands, DEFAULT_BANDS,
} from '../src/lib/learningAnalytics.js';

/* ------------------------------------------------------------
   Bộ dữ liệu mẫu: 3 học sinh, 3 đề trong 30 ngày, 1 đề ngoài
   khoảng, 3 bài nộp. Số liệu kỳ vọng được tính tay trong test.
   ------------------------------------------------------------ */
const NOW = new Date('2026-10-20T10:00:00Z').getTime();
const DAY = 86400000;

const classInfo = {
  id: 'c1',
  name: '12A1',
  subject: 'Hóa học',
  teacherId: 't0',
  teacherName: 'Cô chủ nhiệm',
  members: [
    { id: 's1', name: 'An', email: 'an@x.vn' },
    { id: 's2', name: 'Bình', email: 'binh@x.vn' },
    { id: 's3', name: 'Chi', email: 'chi@x.vn' },
  ],
};

const exams = [
  {
    id: 'e1', classId: 'c1', teacherId: 't1', teacherName: 'Thầy B', title: 'KT Toán 1',
    subject: 'Toán', createdAt: NOW - 2 * DAY, opensAt: NOW - 2 * DAY,
    questions: [
      { q: 'Câu 1', topic: 'Hàm số', correct: 1, points: 1 },
      { q: 'Câu 2', topic: 'Hàm số', correct: 2, points: 1 },
    ],
    totalPoints: 2, active: true,
  },
  {
    id: 'e2', classId: 'c1', teacherId: 't2', teacherName: 'Cô C', title: 'KT Toán 2',
    subject: 'Toán', createdAt: NOW - DAY, opensAt: NOW - DAY,
    questions: [{ q: 'Câu 1', topic: 'Mũ', correct: 0, points: 1 }],
    totalPoints: 1, active: true,
  },
  {
    id: 'e3', classId: 'c1', teacherId: 't0', teacherName: 'Cô chủ nhiệm', title: 'Đề chủ nhiệm',
    subject: '', createdAt: NOW - DAY, opensAt: NOW - DAY,
    questions: [{ q: 'Câu 1', topic: '', correct: 0, points: 1 }],
    totalPoints: 1, active: true,
  },
  {
    id: 'e4', classId: 'c1', teacherId: 't1', teacherName: 'Thầy B', title: 'Đề cũ',
    subject: 'Toán', createdAt: NOW - 100 * DAY, opensAt: NOW - 100 * DAY,
    questions: [{ q: 'Câu cũ', topic: 'Hàm số', correct: 0, points: 1 }],
    totalPoints: 1, active: true,
  },
  {
    id: 'e9', classId: 'khac', teacherId: 't1', teacherName: 'Thầy B', title: 'Đề lớp khác',
    subject: 'Toán', createdAt: NOW - DAY,
    questions: [{ q: 'x', topic: 'Hàm số', correct: 0, points: 1 }],
    totalPoints: 1, active: true,
  },
];

const submissionsMap = {
  e1: [
    { id: 'sub1', examId: 'e1', studentId: 's1', studentName: 'An', score: 2, totalPoints: 2, submittedAt: NOW - 2 * DAY, detail: [{ picked: 1, isCorrect: true }, { picked: 2, isCorrect: true }] },
    { id: 'sub2', examId: 'e1', studentId: 's2', studentName: 'Bình', score: 1, totalPoints: 2, submittedAt: NOW - 2 * DAY, detail: [{ picked: 0, isCorrect: false }, { picked: 2, isCorrect: true }] },
  ],
  e2: [
    { id: 'sub3', examId: 'e2', studentId: 's1', studentName: 'An', score: 0, totalPoints: 1, submittedAt: NOW - DAY, detail: [{ picked: 1, isCorrect: false }] },
  ],
  e3: [],
  e4: [
    { id: 'sub4', examId: 'e4', studentId: 's2', studentName: 'Bình', score: 1, totalPoints: 1, submittedAt: NOW - 100 * DAY, detail: [{ picked: 0, isCorrect: true }] },
  ],
};

const teachers = [
  { teacherId: 't1', teacherName: 'Thầy B', subject: 'Toán' },
  { teacherId: 't2', teacherName: 'Cô C', subject: 'Toán' },
];

const build = (over = {}) => buildLearningAnalytics({
  classInfo, exams, submissionsMap, teachers,
  range: resolveRange('30', { now: NOW }),
  now: NOW,
  ...over,
});

describe('tiện ích số học', () => {
  it('mean/median/stdev bỏ qua giá trị không hợp lệ', () => {
    expect(mean([10, 20, null, undefined, 30])).toBe(20);
    expect(median([10, 20, 30])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
    expect(mean([])).toBeNull();
    expect(stdev([5, 5, 5])).toBe(0);
  });

  it('pctOf trả null khi đề không có điểm', () => {
    expect(pctOf({ score: 4, totalPoints: 8 })).toBe(50);
    expect(pctOf({ score: 4, totalPoints: 0 })).toBeNull();
    expect(pctOf(null)).toBeNull();
  });
});

describe('resolveRange', () => {
  it('30 ngày tính từ mốc kết thúc', () => {
    const r = resolveRange('30', { now: NOW });
    expect(r.from).toBe(NOW - 30 * DAY);
    expect(r.to).toBe(NOW);
    expect(r.label).toContain('30');
  });

  it('toàn bộ dữ liệu không giới hạn dưới', () => {
    expect(resolveRange('all', { now: NOW }).from).toBe(0);
  });

  it('khoảng tuỳ chọn đánh dấu invalid khi thiếu/ngược', () => {
    expect(resolveRange('custom', { from: NOW, to: NOW, now: NOW }).invalid).toBe(true);
    const ok = resolveRange('custom', { from: NOW - 10 * DAY, to: NOW, now: NOW });
    expect(ok.invalid).toBeUndefined();
    expect(ok.days).toBe(10);
  });
});

describe('chọn độ chia biểu đồ', () => {
  it('≤14 ngày theo ngày, ≤90 theo tuần, còn lại theo tháng', () => {
    expect(chooseGranularity(7)).toBe('day');
    expect(chooseGranularity(30)).toBe('week');
    expect(chooseGranularity(120)).toBe('month');
  });
});

describe('buildLearningAnalytics — phạm vi & tổng quan', () => {
  const a = build();

  it('chỉ tính đề của lớp và trong khoảng thời gian', () => {
    expect(a.overview.exams).toBe(3); // e1, e2, e3 (e4 quá cũ, e9 lớp khác)
  });

  it('tính tỷ lệ hoàn thành = lượt nộp / (số đề × số học sinh)', () => {
    expect(a.overview.expectedAttempts).toBe(9);
    expect(a.overview.submissions).toBe(3);
    expect(a.overview.completionRate).toBe(33);
  });

  it('tính điểm trung bình, trung vị, tỷ lệ đạt', () => {
    expect(a.overview.avgPct).toBe(50);   // (100 + 50 + 0) / 3
    expect(a.overview.medianPct).toBe(50);
    expect(a.overview.passRate).toBe(67); // 2/3 bài ≥50%
    expect(a.overview.scoredExams).toBe(2);
  });

  it('tỷ lệ tham gia theo học sinh có bài', () => {
    expect(a.overview.activeStudents).toBe(2);
    expect(a.overview.participationRate).toBe(67);
  });

  it('timeline giữ đủ số đề và số bài nộp', () => {
    expect(a.timeline.reduce((s, b) => s + b.exams, 0)).toBe(3);
    expect(a.timeline.reduce((s, b) => s + b.submissions, 0)).toBe(3);
  });

  it('phân bố điểm cộng lại bằng số bài nộp', () => {
    expect(a.distribution.reduce((s, d) => s + d.count, 0)).toBe(3);
    const band = a.distribution.find((d) => d.key === '80-100');
    expect(band.count).toBe(1);
  });
});

describe('buildLearningAnalytics — theo môn', () => {
  const a = build();

  it('gộp theo môn, giữ môn đã phân công nhưng chưa có đề', () => {
    const toan = a.subjects.find((s) => s.subject === 'Toán');
    expect(toan.exams).toBe(2);
    expect(toan.submissions).toBe(3);
    expect(toan.expected).toBe(6);
    expect(toan.participation).toBe(50);
    expect(toan.avgPct).toBe(50);
    expect(toan.dataLevel).toBe('low'); // 3 bài < 5
  });

  it('đề không gắn môn → nhãn "Chưa xác định"', () => {
    const unknown = a.subjects.find((s) => s.subject === 'Chưa xác định');
    expect(unknown).toBeTruthy();
    expect(unknown.exams).toBe(1);
    expect(unknown.submissions).toBe(0);
    expect(unknown.hasData).toBe(false);
  });

  it('điểm TB môn = null khi môn chưa có bài nộp', () => {
    expect(a.subjects.find((s) => s.subject === 'Chưa xác định').avgPct).toBeNull();
  });
});

describe('buildLearningAnalytics — chủ đề', () => {
  const a = build();

  it('tính tỷ lệ đúng theo chủ đề từ detail của bài nộp', () => {
    /* e1 có 2 câu "Hàm số" × 2 bài nộp = 4 lượt; đúng 3 (s1 đúng cả 2, s2 đúng câu 2) */
    const hamSo = a.topics.rows.find((t) => t.topic === 'Hàm số');
    expect(hamSo.attempts).toBe(4);
    expect(hamSo.correct).toBe(3);
    expect(hamSo.rate).toBe(75);
    const mu = a.topics.rows.find((t) => t.topic === 'Mũ');
    expect(mu.rate).toBe(0);
  });

  it('báo độ phủ metadata chủ đề', () => {
    expect(a.topics.totalQuestions).toBe(4);
    expect(a.topics.taggedQuestions).toBe(3);
    expect(a.topics.coverage).toBe(75);
  });

  it('chủ đề yếu xếp trước', () => {
    expect(a.topics.rows[0].rate).toBeLessThanOrEqual(a.topics.rows[a.topics.rows.length - 1].rate);
  });
});

describe('buildLearningAnalytics — cảnh báo sớm', () => {
  const a = build();
  const kinds = a.warnings.map((w) => w.kind);

  it('phát hiện học sinh bỏ nhiều bài', () => {
    const missing = a.warnings.find((w) => w.kind === 'student_missing' && w.refs.studentId === 's3');
    expect(missing).toBeTruthy();
    expect(missing.priority).toBe('high');
    expect(missing.evidence).toContain('3/3');
  });

  it('học sinh bỏ ≥50% (dưới ngưỡng tuyệt đối) → mức trung bình', () => {
    const w = a.warnings.find((x) => x.kind === 'student_missing' && x.refs.studentId === 's2');
    expect(w).toBeTruthy();
    expect(w.priority).toBe('medium');
  });

  it('phát hiện môn có đề nhưng chưa có bài nộp', () => {
    expect(kinds).toContain('subject_no_data');
  });

  it('mọi cảnh báo đều có căn cứ, lý do, hành động và thời điểm', () => {
    a.warnings.forEach((w) => {
      expect(typeof w.evidence).toBe('string');
      expect(w.evidence.length).toBeGreaterThan(0);
      expect(typeof w.why).toBe('string');
      expect(typeof w.action).toBe('string');
      expect(w.detectedAt).toBe(NOW);
      expect(['high', 'medium', 'low']).toContain(w.priority);
    });
  });

  it('không cảnh báo chủ đề khi số lượt trả lời dưới ngưỡng', () => {
    expect(kinds).not.toContain('topic_weak'); // Hàm số chỉ 4 lượt < 8
  });
});

describe('buildLearningAnalytics — chất lượng dữ liệu', () => {
  const a = build();

  it('báo chưa đủ dữ liệu khi số bài nộp < ngưỡng AI', () => {
    expect(a.dataQuality.sufficient.ok).toBe(false);
    expect(a.dataQuality.sufficient.missing.join(' ')).toContain('bài nộp');
  });

  it('ghi chú đề thiếu môn / thiếu bài nộp / thiếu metadata', () => {
    const text = a.dataQuality.notes.join(' | ');
    expect(text).toContain('chưa gắn môn');
    expect(text).toContain('chưa có bài nộp');
    expect(text).toContain('metadata chủ đề');
  });

  it('dữ liệu đủ khi vượt ngưỡng', () => {
    const many = [];
    for (let i = 0; i < 6; i += 1) {
      many.push({ id: `s${i}`, examId: 'e1', studentId: `x${i}`, score: 1, totalPoints: 2, submittedAt: NOW - DAY, detail: [{ picked: 1, isCorrect: true }, { picked: 2, isCorrect: false }] });
    }
    const b = buildLearningAnalytics({
      classInfo: { ...classInfo, members: [...classInfo.members, { id: 'x1', name: 'X1' }] },
      exams,
      submissionsMap: { ...submissionsMap, e1: many },
      teachers,
      range: resolveRange('30', { now: NOW }),
      now: NOW,
    });
    expect(b.dataQuality.sufficient.ok).toBe(true);
  });
});

describe('buildLearningAnalytics — từng học sinh', () => {
  const a = build();

  it('đếm đã nộp / còn thiếu theo số đề trong khoảng', () => {
    const s3 = a.students.find((s) => s.id === 's3');
    expect(s3.submissions).toBe(0);
    expect(s3.expected).toBe(3);
    expect(s3.missing).toBe(3);
    expect(s3.avgPct).toBeNull();
  });

  it('không kết luận xu hướng khi <3 bài', () => {
    const s1 = a.students.find((s) => s.id === 's1');
    expect(s1.submissions).toBe(2);
    expect(s1.trend).toBe('unknown');
    expect(s1.delta).toBeNull();
  });

  it('nhận diện xu hướng giảm khi ≥3 bài', () => {
    const subs = {
      e1: [{ studentId: 's1', score: 2, totalPoints: 2, submittedAt: NOW - 3 * DAY, detail: [{}, {}] }],
      e2: [{ studentId: 's1', score: 0, totalPoints: 2, submittedAt: NOW - 2 * DAY, detail: [{}] }],
      e3: [{ studentId: 's1', score: 0, totalPoints: 2, submittedAt: NOW - DAY, detail: [{}] }],
    };
    const b = buildLearningAnalytics({
      classInfo, exams, submissionsMap: subs, teachers,
      range: resolveRange('30', { now: NOW }), now: NOW,
    });
    const s1 = b.students.find((s) => s.id === 's1');
    expect(s1.submissions).toBe(3);
    expect(s1.trend).toBe('down');
    expect(s1.delta).toBeLessThan(0);
    expect(b.warnings.some((w) => w.kind === 'student_decline')).toBe(true);
  });
});

describe('buildLearningAnalytics — trường hợp không có dữ liệu', () => {
  const a = buildLearningAnalytics({
    classInfo, exams: [], submissionsMap: {}, teachers: [],
    range: resolveRange('30', { now: NOW }), now: NOW,
  });

  it('trả null chứ không trả 0 giả cho các tỷ lệ', () => {
    expect(a.overview.avgPct).toBeNull();
    expect(a.overview.passRate).toBeNull();
    expect(a.overview.completionRate).toBeNull();
    expect(a.overview.participationRate).toBe(0); // 0/3 học sinh có bài — mẫu số vẫn hợp lệ
  });

  it('không có cảnh báo bịa và dữ liệu được đánh dấu thiếu', () => {
    expect(a.warnings).toEqual([]);
    expect(a.dataQuality.sufficient.ok).toBe(false);
    expect(a.subjects).toEqual([]);
    expect(a.topics.rows).toEqual([]);
  });
});

describe('anonymizeForAi', () => {
  it('bỏ tên/email học sinh, thay bằng mã', () => {
    const raw = JSON.stringify(build());
    expect(raw).toContain('Bình');
    const anon = anonymizeForAi(build());
    const text = JSON.stringify(anon);
    expect(text).not.toContain('Bình');
    expect(text).not.toContain('@x.vn');
    expect(anon.students[0].code).toMatch(/^HS\d{2}$/);
  });
});

describe('buildDistribution', () => {
  it('chia 5 mức và tính tỷ lệ', () => {
    const d = buildDistribution([0, 10, 45, 70, 100]);
    expect(d.map((x) => x.count)).toEqual([2, 0, 1, 1, 1]);
    expect(d[0].share).toBe(40);
  });

  it('không có dữ liệu → share null', () => {
    expect(buildDistribution([]).every((d) => d.share === null)).toBe(true);
  });
});

describe('fingerprint dữ liệu', () => {
  it('ổn định theo thời gian với cùng một tập dữ liệu', () => {
    const a = build();
    const b = buildLearningAnalytics({
      classInfo, exams, submissionsMap, teachers,
      range: resolveRange('30', { now: NOW + 3600 * 1000 }),
      now: NOW + 3600 * 1000,
    });
    expect(a.meta.fingerprint).toBe(b.meta.fingerprint);
  });

  it('đổi khi có thêm bài nộp', () => {
    const a = build();
    const b = buildLearningAnalytics({
      classInfo,
      exams,
      submissionsMap: {
        ...submissionsMap,
        e1: [
          ...submissionsMap.e1,
          { id: 'sub9', examId: 'e1', studentId: 's3', score: 1, totalPoints: 2, submittedAt: NOW - DAY, detail: [{}, {}] },
        ],
      },
      teachers,
      range: resolveRange('30', { now: NOW }),
      now: NOW,
    });
    expect(b.meta.fingerprint).not.toBe(a.meta.fingerprint);
  });

  it('đổi khi đổi khoảng thời gian', () => {
    const a = build();
    const b = buildLearningAnalytics({
      classInfo, exams, submissionsMap, teachers,
      range: resolveRange('7', { now: NOW }),
      now: NOW,
    });
    expect(a.meta.fingerprint).not.toBe(b.meta.fingerprint);
  });
});

describe('ngưỡng cảnh báo', () => {
  it('ngưỡng hiện hành khớp tài liệu', () => {
    expect(THRESHOLDS.weakTopicAttempts).toBe(8);
    expect(THRESHOLDS.minSubsForAi).toBe(5);
  });
});

describe('xếp loại học sinh theo môn', () => {
  it('classifyPct đúng ở các mốc biên (thang 10 quy về %)', () => {
    expect(classifyPct(100)).toBe('gioi');
    expect(classifyPct(80)).toBe('gioi');
    expect(classifyPct(79)).toBe('kha');
    expect(classifyPct(65)).toBe('kha');
    expect(classifyPct(64)).toBe('tb');
    expect(classifyPct(50)).toBe('tb');
    expect(classifyPct(49)).toBe('yeu');
    expect(classifyPct(0)).toBe('yeu');
    expect(classifyPct(null)).toBeNull();
    expect(classifyPct('')).toBeNull();
    expect(classifyPct('abc')).toBeNull();
  });

  it('bandLabel trả nhãn tiếng Việt và nhãn dự phòng', () => {
    expect(bandLabel('gioi')).toBe('Giỏi');
    expect(bandLabel('tb')).toBe('Trung bình');
    expect(bandLabel(null)).toBe('Chưa đủ dữ liệu');
    expect(BANDS.map((b) => b.key)).toEqual(['gioi', 'kha', 'tb', 'yeu']);
  });

  it('buildSubjectStudents tính TB/cao nhất/thấp nhất và cờ ít dữ liệu', () => {
    const rows = buildSubjectStudents({
      members: [
        { id: 's1', name: 'An' },
        { id: 's2', name: 'Bình' },
        { id: 's3', name: 'Chi' },
      ],
      examList: [
        { id: 'e1', title: 'Đề 1' },
        { id: 'e2', title: 'Đề 2' },
      ],
      submissionsByExam: {
        /* An: 100% và 0% → TB 50 (TB), đủ 2 bài */
        e1: [
          { studentId: 's1', score: 10, totalPoints: 10, submittedAt: NOW - DAY },
          { studentId: 's2', score: 9, totalPoints: 10, submittedAt: NOW - DAY },
        ],
        /* Bình: chỉ 1 bài 90% → Giỏi nhưng ít dữ liệu */
        e2: [
          { studentId: 's1', score: 0, totalPoints: 10, submittedAt: NOW },
          { studentId: 's2', score: 9, totalPoints: 10, submittedAt: NOW },
        ],
      },
    });

    const [an, binh, chi] = rows;
    expect(an.attempts).toBe(2);
    expect(an.avgPct).toBe(50);
    expect(an.bestPct).toBe(100);
    expect(an.worstPct).toBe(0);
    expect(an.band).toBe('tb');
    expect(an.lowConfidence).toBe(false);

    expect(binh.attempts).toBe(2);
    expect(binh.avgPct).toBe(90);
    expect(binh.band).toBe('gioi');

    /* Chi không làm bài nào → không xếp loại, không bị coi là "Yếu" */
    expect(chi.attempts).toBe(0);
    expect(chi.avgPct).toBeNull();
    expect(chi.band).toBeNull();
    expect(chi.lowConfidence).toBe(false);
  });

  it('học sinh mới có 1 bài bị gắn cờ ít dữ liệu', () => {
    const rows = buildSubjectStudents({
      members: [{ id: 's2', name: 'Bình' }],
      examList: [{ id: 'e1', title: 'Đề 1' }, { id: 'e2', title: 'Đề 2' }],
      submissionsByExam: {
        e1: [{ studentId: 's2', score: 9, totalPoints: 10, submittedAt: NOW }],
        e2: [],
      },
    });
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].lowConfidence).toBe(true);
    expect(rows[0].band).toBe('gioi');
  });

  it('bandCounts đếm riêng nhóm chưa có dữ liệu', () => {
    const counts = bandCounts([
      { band: 'gioi' }, { band: 'gioi' }, { band: 'tb' }, { band: null },
    ]);
    expect(counts).toMatchObject({ gioi: 2, kha: 0, tb: 1, yeu: 0, nodata: 1, total: 4 });
  });

  it('resolveBands chuẩn hoá dữ liệu hỏng và luôn giảm dần', () => {
    expect(resolveBands(null)).toEqual(DEFAULT_BANDS);
    expect(resolveBands({ gioi: 85, kha: 70, tb: 55 })).toEqual({ gioi: 85, kha: 70, tb: 55 });
    /* khai ngược thứ tự → kẹp lại để không có mức âm */
    expect(resolveBands({ gioi: 90, kha: 95, tb: 40 })).toEqual({ gioi: 90, kha: 89, tb: 40 });
    expect(resolveBands({ gioi: 'abc', kha: null })).toEqual(DEFAULT_BANDS);
  });

  it('classifyPct theo ngưỡng riêng của lớp', () => {
    const t = { gioi: 90, kha: 70, tb: 55 };
    expect(classifyPct(95, t)).toBe('gioi');
    expect(classifyPct(85, t)).toBe('kha');
    expect(classifyPct(85)).toBe('gioi');
    expect(classifyPct(60, t)).toBe('tb');
    expect(classifyPct(54, t)).toBe('yeu');
  });

  it('đổi ngưỡng lớp thì xếp loại trong subjectDetails đổi theo', () => {
    /* s1 môn Toán: 100% và 0% → TB 50 */
    const strict = build({ bandThresholds: { gioi: 95, kha: 90, tb: 60 } });
    expect(strict.subjectDetails.Toán.students.find((s) => s.id === 's1').band).toBe('yeu');
    const loose = build({ bandThresholds: { gioi: 95, kha: 90, tb: 40 } });
    expect(loose.subjectDetails.Toán.students.find((s) => s.id === 's1').band).toBe('tb');
  });

  it('cảnh báo GVBM đã liên kết lâu mà chưa giao đề', () => {
    const a = build({
      teachers: [
        { teacherId: 't9', teacherName: 'Cô Lý', subject: 'Vật lí', linkedAt: NOW - 30 * DAY },
      ],
    });
    const idle = a.warnings.filter((w) => w.kind === 'teacher_idle');
    expect(idle).toHaveLength(1);
    expect(idle[0].refs.teacherId).toBe('t9');
    expect(idle[0].priority).toBe('low');
    /* không kết luận gì về năng lực giảng dạy */
    expect(idle[0].action.toLowerCase()).toContain('không phản ánh năng lực');
  });

  it('vừa liên kết < 7 ngày thì chưa nhắc', () => {
    const a = build({
      teachers: [
        { teacherId: 't9', teacherName: 'Cô Lý', subject: 'Vật lí', linkedAt: NOW - 2 * DAY },
      ],
    });
    expect(a.warnings.filter((w) => w.kind === 'teacher_idle')).toHaveLength(0);
  });

  it('subjectDetails gắn danh sách học sinh + đếm mức cho từng môn', () => {
    const a = build();
    const toan = a.subjectDetails.Toán;
    expect(Array.isArray(toan.students)).toBe(true);
    expect(toan.students).toHaveLength(3);

    /* An: 100% (e1) + 0% (e2) → TB 50; Bình: 50% (e1) → TB, 1 bài;
       Chi: không có bài → chưa xếp loại */
    expect(toan.bands).toMatchObject({ gioi: 0, kha: 0, tb: 2, yeu: 0, nodata: 1, total: 3 });

    const an = toan.students.find((s) => s.id === 's1');
    expect(an.avgPct).toBe(50);
    expect(an.band).toBe('tb');

    const chi = toan.students.find((s) => s.id === 's3');
    expect(chi.attempts).toBe(0);
    expect(chi.band).toBeNull();
  });
});
