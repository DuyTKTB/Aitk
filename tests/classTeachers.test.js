import { describe, it, expect } from 'vitest';
import {
  evaluateKey, keyStatus, isKeyUsable, buildTeacherActivity, examStatus, linkDocId,
} from '../src/lib/classTeachersCore.js';

const NOW = new Date('2026-10-20T10:00:00Z').getTime();
const DAY = 86400000;

const keyDoc = (over = {}) => ({
  classId: 'c1',
  className: '12A1',
  createdBy: 'owner',
  expiresAt: new Date(NOW + 7 * DAY),
  revoked: false,
  subject: 'Toán',
  maxUses: 1,
  uses: 0,
  usedBy: {},
  ...over,
});

describe('evaluateKey', () => {
  it('hợp lệ với key mới, đúng lớp', () => {
    const v = evaluateKey(keyDoc(), { uid: 'gv1', classId: 'c1', now: NOW });
    expect(v.ok).toBe(true);
  });

  it('từ chối key không tồn tại', () => {
    const v = evaluateKey(null, { uid: 'gv1', now: NOW });
    expect(v.ok).toBe(false);
    expect(v.code).toBe('missing');
  });

  it('từ chối key đã bị thu hồi', () => {
    const v = evaluateKey(keyDoc({ revoked: true }), { uid: 'gv1', now: NOW });
    expect(v.code).toBe('revoked');
    expect(v.message).toContain('thu hồi');
  });

  it('từ chối key đã dùng hết lượt (tự vô hiệu)', () => {
    const v = evaluateKey(keyDoc({ revoked: true, revokeReason: 'used', uses: 1 }), { uid: 'gv1', now: NOW });
    expect(v.code).toBe('revoked');
    expect(v.message).toContain('hết lượt');
  });

  it('từ chối key hết hạn', () => {
    const v = evaluateKey(keyDoc({ expiresAt: new Date(NOW - DAY) }), { uid: 'gv1', now: NOW });
    expect(v.code).toBe('expired');
  });

  it('từ chối khi số lượt đã đạt maxUses', () => {
    const v = evaluateKey(keyDoc({ maxUses: 2, uses: 2 }), { uid: 'gv2', now: NOW });
    expect(v.code).toBe('exhausted');
  });

  it('cho phép key 2 lượt khi còn 1 lượt', () => {
    const v = evaluateKey(keyDoc({ maxUses: 2, uses: 1 }), { uid: 'gv2', now: NOW });
    expect(v.ok).toBe(true);
  });

  it('từ chối chủ lớp tự dùng key của mình', () => {
    const v = evaluateKey(keyDoc(), { uid: 'owner', now: NOW });
    expect(v.code).toBe('own-class');
  });

  it('từ chối giáo viên đã dùng chính key đó', () => {
    const v = evaluateKey(keyDoc({ maxUses: 3, usedBy: { gv1: NOW } }), { uid: 'gv1', now: NOW });
    expect(v.code).toBe('already-used-by-you');
  });

  it('từ chối key của lớp khác', () => {
    const v = evaluateKey(keyDoc(), { uid: 'gv1', classId: 'c2', now: NOW });
    expect(v.code).toBe('wrong-class');
  });

  it('key cũ không có maxUses vẫn được coi là 1 lượt', () => {
    const legacy = keyDoc();
    delete legacy.maxUses;
    delete legacy.uses;
    expect(evaluateKey(legacy, { uid: 'gv1', now: NOW }).ok).toBe(true);
    expect(evaluateKey({ ...legacy, uses: 1 }, { uid: 'gv2', now: NOW }).code).toBe('exhausted');
  });
});

describe('keyStatus', () => {
  it('key mới → đang hiệu lực', () => {
    expect(keyStatus(keyDoc(), NOW)).toMatchObject({ code: 'active', tone: 'ex' });
  });

  it('hết lượt → đã dùng', () => {
    expect(keyStatus(keyDoc({ uses: 1 }), NOW).code).toBe('used');
  });

  it('thu hồi thủ công → đã thu hồi', () => {
    expect(keyStatus(keyDoc({ revoked: true, revokeReason: 'manual' }), NOW).code).toBe('revoked');
  });

  it('hết hạn → hết hạn', () => {
    expect(keyStatus(keyDoc({ expiresAt: new Date(NOW - DAY) }), NOW).code).toBe('expired');
  });

  it('isKeyUsable chỉ đúng với key đang hiệu lực', () => {
    expect(isKeyUsable(keyDoc(), NOW)).toBe(true);
    expect(isKeyUsable(keyDoc({ uses: 1 }), NOW)).toBe(false);
  });
});

describe('examStatus', () => {
  it('nhận diện đang mở / chưa mở / đã đóng / đã tắt', () => {
    expect(examStatus({ active: true }, NOW).code).toBe('open');
    expect(examStatus({ active: true, opensAt: NOW + DAY }, NOW).code).toBe('soon');
    expect(examStatus({ active: true, closesAt: NOW - DAY }, NOW).code).toBe('closed');
    expect(examStatus({ active: false }, NOW).code).toBe('off');
  });
});

describe('buildTeacherActivity', () => {
  const exams = [
    { id: 'e1', classId: 'c1', teacherId: 't1', teacherName: 'Thầy B', topic: '', subject: 'Toán', createdAt: NOW - DAY, questions: [{}, {}], totalPoints: 2 },
    { id: 'e2', classId: 'c1', teacherId: 't2', teacherName: 'Cô C', subject: 'Toán', createdAt: NOW - DAY, questions: [{}], totalPoints: 1 },
    { id: 'e3', classId: 'c1', teacherId: 't0', teacherName: 'Chủ nhiệm', subject: '', createdAt: NOW - DAY, questions: [{}], totalPoints: 1 },
    { id: 'x1', classId: 'lop-khac', teacherId: 't1', teacherName: 'Thầy B', createdAt: NOW - DAY, questions: [{}] },
  ];

  const submissionsMap = {
    e1: [
      { studentId: 's1', score: 2, totalPoints: 2 },
      { studentId: 's2', score: 1, totalPoints: 2 },
    ],
    e2: [{ studentId: 's1', score: 0, totalPoints: 1 }],
  };

  const linkedTeachers = [
    { teacherId: 't1', teacherName: 'Thầy B', subject: 'Toán', linkedAtMs: NOW - 5 * DAY },
    { teacherId: 't2', teacherName: 'Cô C', subject: 'Toán', linkedAtMs: NOW - 4 * DAY },
  ];

  const activity = buildTeacherActivity({
    classId: 'c1',
    exams,
    submissionsMap,
    linkedTeachers,
    students: 3,
    accountStatus: { t1: { exists: true }, t2: { exists: false } },
    ownerId: 't0',
    ownerName: 'Chủ nhiệm',
    now: NOW,
  });

  it('chỉ tính đề của lớp hiện tại', () => {
    const total = activity.rows.reduce((a, r) => a + r.examCount, 0);
    expect(total).toBe(3);
  });

  it('tổng hợp đúng số liệu', () => {
    expect(activity.total.teachers).toBe(2);
    expect(activity.total.examsLinked).toBe(2);
    expect(activity.total.submissions).toBe(3);
    expect(activity.total.emptyExams).toBe(1);
  });

  it('tính tỷ lệ tham gia và điểm TB theo giáo viên', () => {
    const t1 = activity.rows.find((r) => r.teacherId === 't1');
    expect(t1.examCount).toBe(1);
    expect(t1.participation).toBe(67); // 2/3
    expect(t1.avgPct).toBe(75);        // (100 + 50)/2
    const t2 = activity.rows.find((r) => r.teacherId === 't2');
    expect(t2.participation).toBe(33);
    expect(t2.avgPct).toBe(0);
  });

  it('đánh dấu chủ nhiệm và xếp lên đầu', () => {
    expect(activity.rows[0].isOwner).toBe(true);
    expect(activity.rows[0].status.code).toBe('owner');
  });

  it('trạng thái tài khoản giáo viên', () => {
    expect(activity.rows.find((r) => r.teacherId === 't1').status.code).toBe('active');
    expect(activity.rows.find((r) => r.teacherId === 't2').status.code).toBe('no-profile');
  });

  it('phát hiện 2 giáo viên cùng môn', () => {
    expect(activity.duplicateSubjects).toEqual([{ subject: 'Toán', count: 2 }]);
  });

  it('lọc theo khoảng thời gian', () => {
    const recent = buildTeacherActivity({
      classId: 'c1',
      exams: [{ ...exams[0], createdAt: NOW - 100 * DAY }],
      submissionsMap: {},
      linkedTeachers,
      rangeDays: '30',
      students: 3,
      now: NOW,
    });
    expect(recent.rows.filter((r) => !r.isOwner).every((r) => r.examCount === 0)).toBe(true);
  });

  it('tác giả đề không mặc nhiên là chủ nhiệm', () => {
    const withStranger = buildTeacherActivity({
      classId: 'c1',
      exams: [
        ...exams,
        { id: 'e9', classId: 'c1', teacherId: 't9', teacherName: 'GV cũ', subject: 'Lý', createdAt: NOW - DAY, questions: [{}], totalPoints: 1 },
      ],
      submissionsMap,
      linkedTeachers,
      students: 3,
      ownerId: 't0',
      ownerName: 'Chủ nhiệm',
      now: NOW,
    });
    const t9 = withStranger.rows.find((r) => r.teacherId === 't9');
    expect(t9.isOwner).toBe(false);
    expect(t9.linked).toBe(false);
    expect(t9.status.code).toBe('unlinked');
    /* GV chưa/không còn liên kết không nằm trong nhóm "giáo viên bộ môn" */
    expect(withStranger.linked.map((r) => r.teacherId).sort()).toEqual(['t1', 't2']);
    expect(withStranger.total.teachers).toBe(2);
  });

  it('không có học sinh → tỷ lệ tham gia là null (không chia cho 0)', () => {
    const noStudents = buildTeacherActivity({
      classId: 'c1', exams, submissionsMap, linkedTeachers, students: 0, now: NOW,
    });
    expect(noStudents.rows.find((r) => r.teacherId === 't1').participation).toBeNull();
  });
});

describe('linkDocId', () => {
  it('ghép classId và teacherId', () => {
    expect(linkDocId('c1', 'u9')).toBe('c1_u9');
  });
});
