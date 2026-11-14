import { describe, it, expect } from 'vitest';
import {
  normalizeSubjectName,
  subjectsMatch,
  countUniqueStudentsInClasses,
} from '../src/components/teacher/ElecBrandMark.jsx';

describe('ElecBrandMark helpers — Chuẩn hóa môn học & đếm học sinh không trùng', () => {
  it('chuẩn hóa viết tắt môn học phổ thông về tên thống nhất', () => {
    expect(normalizeSubjectName('Hóa')).toBe('Hóa học');
    expect(normalizeSubjectName('Môn Hóa học')).toBe('Hóa học');
    expect(normalizeSubjectName('Vật lí')).toBe('Vật lý');
    expect(normalizeSubjectName('lý')).toBe('Vật lý');
    expect(normalizeSubjectName('KHTN')).toBe('Khoa học tự nhiên');
    expect(normalizeSubjectName('Tiếng Anh')).toBe('Tiếng Anh');
  });

  it('khớp môn học chính xác giữa viết tắt và tên đầy đủ', () => {
    expect(subjectsMatch('Hóa', 'Hóa học')).toBe(true);
    expect(subjectsMatch('Vật lí', 'Vật lý')).toBe(true);
    expect(subjectsMatch('khtn', 'Khoa học Tự nhiên')).toBe(true);
    expect(subjectsMatch('Hóa học', 'Vật lý')).toBe(false);
  });

  it('đếm đúng học sinh duy nhất giữa lớp Chủ nhiệm và lớp Bộ môn', () => {
    const classes = [
      { id: 'c1', members: [{ uid: 'u1', name: 'An' }, { uid: 'u2', name: 'Bình' }] },
      { id: 'c2', members: [{ uid: 'u2', name: 'Bình' }, { uid: 'u3', name: 'Chi' }] },
    ];
    expect(countUniqueStudentsInClasses(classes)).toBe(3);
  });
});
