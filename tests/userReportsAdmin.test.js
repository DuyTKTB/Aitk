import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  REPORT_STATUSES,
  normalizeReportRecord,
  mergeReportsList,
  countOpenReports,
} from '../src/lib/userReportsService.js';

describe('User Reports → Admin Realtime Pipeline', () => {
  it('1. normalizeReportRecord chuẩn hóa dữ liệu gửi lên Firestore an toàn', () => {
    const rec = normalizeReportRecord(
      {
        kind: 'report',
        category: 'Báo lỗi đề thi',
        rating: 99,
        content: '  Câu 12 bị sai đáp án B  ',
        status: 'invalid-status',
        userEmail: 'hs@example.com',
        page: '#virtual-exams',
      },
      'uid-student-1'
    );

    expect(rec.uid).toBe('uid-student-1');
    expect(rec.kind).toBe('report');
    expect(rec.rating).toBe(5);
    expect(rec.content).toBe('Câu 12 bị sai đáp án B');
    expect(rec.status).toBe('Đã tiếp nhận');
    expect(rec.page).toBe('#virtual-exams');
    expect(REPORT_STATUSES).toContain(rec.status);
  });

  it('2. mergeReportsList ưu tiên trạng thái & phản hồi mới nhất từ Admin trên Cloud', () => {
    const local = [
      { id: 'RP-1', uid: 'u1', content: 'Lỗi camera', status: 'Đã tiếp nhận', createdAtMs: 1000 },
      { id: 'RP-2', uid: 'u1', content: 'Góp ý mới chưa đồng bộ', status: 'Đã tiếp nhận', createdAtMs: 3000 },
    ];
    const cloud = [
      {
        id: 'RP-1',
        uid: 'u1',
        content: 'Lỗi camera',
        status: 'Đã giải quyết',
        adminReply: 'Admin đã sửa xong lỗi camera rồi nhé!',
        adminReplyAt: 2000,
        createdAtMs: 1000,
      },
    ];

    const merged = mergeReportsList(cloud, local);
    expect(merged.map((x) => x.id)).toEqual(['RP-2', 'RP-1']);
    const rp1 = merged.find((x) => x.id === 'RP-1');
    expect(rp1.status).toBe('Đã giải quyết');
    expect(rp1.adminReply).toBe('Admin đã sửa xong lỗi camera rồi nhé!');
    expect(rp1.synced).toBe(true);
  });

  it('3. countOpenReports đếm đúng số báo lỗi cần Admin xử lý', () => {
    const list = [
      { status: 'Đã tiếp nhận' },
      { status: 'Đang xử lý' },
      { status: 'Đã giải quyết' },
      { status: 'Từ chối' },
    ];
    expect(countOpenReports(list)).toBe(2);
  });

  it('4. firestore.rules bảo vệ collection user_reports bằng validator cho cả create & update', () => {
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toContain('match /user_reports/{reportId}');
    expect(rules).toContain('isValidUserReportCreate()');
    expect(rules).toContain('isValidUserReportUpdate()');
    expect(rules).toContain('allow update: if isAdmin() && isValidUserReportUpdate();');
  });
});
