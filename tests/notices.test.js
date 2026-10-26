import { describe, it, expect } from 'vitest';
import {
  buildNotice, sortNotices, unreadCount, groupNotices, noticeSummary, NOTICE_TYPES,
} from '../src/lib/noticesCore.js';

const NOW = new Date('2026-10-20T10:00:00Z').getTime();

const base = {
  type: 'teacher_link',
  toUid: 'owner',
  actorId: 'gv1',
  actorName: 'Cô Toán',
  classId: 'c1',
  className: '12A1',
  subject: 'Toán',
  title: 'Liên kết mới',
  body: 'Cô Toán vừa liên kết môn Toán.',
  tab: 'teachers',
  now: NOW,
};

describe('buildNotice', () => {
  it('tạo payload đúng và mặc định chưa đọc', () => {
    const n = buildNotice(base);
    expect(n).toMatchObject({
      type: 'teacher_link',
      toUid: 'owner',
      actorId: 'gv1',
      classId: 'c1',
      className: '12A1',
      subject: 'Toán',
      tab: 'teachers',
      createdAtMs: NOW,
      read: false,
    });
  });

  it('không gửi thông báo cho chính mình', () => {
    expect(buildNotice({ ...base, toUid: 'gv1' })).toBeNull();
  });

  it('thiếu người nhận/lớp hoặc sai loại thì ném lỗi', () => {
    expect(() => buildNotice({ ...base, toUid: '' })).toThrow();
    expect(() => buildNotice({ ...base, classId: '' })).toThrow();
    expect(() => buildNotice({ ...base, type: 'spam' })).toThrow();
  });

  it('cắt chuỗi quá dài và tab lạ rơi về teachers', () => {
    const n = buildNotice({
      ...base,
      title: 'x'.repeat(300),
      body: 'y'.repeat(600),
      actorName: 'z'.repeat(200),
      tab: 'hack',
    });
    expect(n.title.length).toBe(140);
    expect(n.body.length).toBe(300);
    expect(n.actorName.length).toBe(80);
    expect(n.tab).toBe('teachers');
  });
});

describe('sắp xếp & đếm', () => {
  const list = [
    { id: 'a', read: false, createdAtMs: NOW - 1000 },
    { id: 'b', read: true, createdAtMs: NOW },
    { id: 'c', read: false, createdAtMs: NOW - 500 },
  ];

  it('mới nhất lên đầu', () => {
    expect(sortNotices(list).map((n) => n.id)).toEqual(['b', 'c', 'a']);
  });

  it('đếm chưa đọc', () => {
    expect(unreadCount(list)).toBe(2);
    expect(unreadCount([])).toBe(0);
  });

  it('nhóm chưa đọc / đã đọc', () => {
    const g = groupNotices(list);
    expect(g.total).toBe(3);
    expect(g.unread.map((n) => n.id)).toEqual(['c', 'a']);
    expect(g.read.map((n) => n.id)).toEqual(['b']);
  });
});

describe('noticeSummary', () => {
  it('có câu mô tả riêng cho từng loại', () => {
    expect(noticeSummary({ ...base })).toContain('đã liên kết vào lớp 12A1');
    expect(noticeSummary({ ...base, type: 'teacher_unlink' })).toContain('đã gỡ liên kết');
    expect(noticeSummary({
      ...base, type: 'exam_assigned', title: 'Kiểm tra 15p',
    })).toContain('Kiểm tra 15p');
  });

  it('không có dữ liệu thì trả chuỗi rỗng, không vỡ UI', () => {
    expect(noticeSummary(null)).toBe('');
    expect(noticeSummary({ type: 'unknown' })).toBe('');
  });

  it('danh sách loại thông báo khớp với rules', () => {
    expect(Object.keys(NOTICE_TYPES).sort()).toEqual(['exam_assigned', 'teacher_link', 'teacher_unlink']);
  });
});
