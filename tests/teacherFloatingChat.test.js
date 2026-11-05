import { describe, it, expect } from 'vitest';
import {
  extractMentionedClassName,
  extractValidNewClassName,
  findTargetClassInQuery,
  getTopicsForSubjectAndGrade,
  SUBJECT_GRADE_TOPICS,
} from '../src/components/teacher/TeacherFloatingChat.jsx';

describe('TeacherFloatingChat Class & Semantic Resolution', () => {
  it('extracts class names accurately from user queries without pollution', () => {
    expect(extractMentionedClassName('bạn xem lớp 11a5 ai kém nhất')).toBe('11a5');
    expect(extractMentionedClassName('lớp 12A1 ai cao nhất')).toBe('12A1');
    expect(extractMentionedClassName('tình hình lớp 10A2 thế nào')).toBe('10A2');
    expect(extractMentionedClassName('xem điểm 11a5')).toBe('11A5');
    expect(extractMentionedClassName('cho xem lop 11A5')).toBe('11A5');

    // Questions without class mention must return null
    expect(extractMentionedClassName('học sinh làm bài kém môn Hóa thì nên ôn phần nào?')).toBeNull();
    expect(extractMentionedClassName('soạn 5 câu este cho học sinh yếu')).toBeNull();
    expect(extractMentionedClassName('tại sao câu này học sinh hay sai')).toBeNull();
    expect(extractMentionedClassName('')).toBeNull();
    expect(extractMentionedClassName(null)).toBeNull();
  });

  it('matches target classes across classes list, exams, and submissionsMap', () => {
    const classes = [
      { id: 'c1', name: '12A1', grade: '12', subject: 'Hóa học' },
      { id: 'c2', name: '10 Lý', grade: '10', subject: 'Vật lí' },
    ];
    const exams = [
      { id: 'ex1', title: 'Kiểm tra 15p 11A5', className: '11A5', grade: '11', subject: 'Hóa học' },
    ];
    const submissionsMap = {};

    // 1. Tìm thấy trong classes
    const match12A1 = findTargetClassInQuery('bạn xem lớp 12a1 ai cao nhất', classes, exams, submissionsMap);
    expect(match12A1).not.toBeNull();
    expect(match12A1.name).toBe('12A1');

    // 2. Tìm thấy trong exams (khi lớp chưa tạo trong tab lớp nhưng có đề mang tên lớp)
    const match11A5 = findTargetClassInQuery('bạn xem lớp 11a5 ai kém nhất', classes, exams, submissionsMap);
    expect(match11A5).not.toBeNull();
    expect(match11A5.name).toBe('11A5');

    // 3. Không tìm thấy lớp nào khi người dùng hỏi lớp không tồn tại (vd: lớp 11A99)
    const matchUnknown = findTargetClassInQuery('bạn xem lớp 11A99 ai kém nhất', classes, [], {});
    expect(matchUnknown).toBeNull();

    // 4. Câu hỏi chuyên môn sư phạm không bị nhận nhầm thành lớp học
    const matchPedagogy = findTargetClassInQuery('phương pháp dạy học sinh yếu este', classes, exams, submissionsMap);
    expect(matchPedagogy).toBeNull();

    // 5. Lời chào như "hi lô", "hello", "chào" không bị nhận nhầm thành lớp "h" hoặc lớp rác
    const classesWithGhost = [
      ...classes,
      { id: 'ghost_h', name: 'h', grade: '12', subject: 'Toán' },
      { id: 'ghost_moi', name: 'mới', grade: '12', subject: 'Toán' },
    ];
    expect(findTargetClassInQuery('hi lô', classesWithGhost, [], {})).toBeNull();
    expect(findTargetClassInQuery('hello bot', classesWithGhost, [], {})).toBeNull();
    expect(findTargetClassInQuery('chào em', classesWithGhost, [], {})).toBeNull();
  });

  it('safely extracts new class names while rejecting boilerplate words like "học", "mới", "h"', () => {
    // Boilerplate inquiries should return null
    expect(extractValidNewClassName('cách tạo lớp học và cho học sinh kiểm tra')).toBeNull();
    expect(extractValidNewClassName('tạo lớp mới')).toBeNull();
    expect(extractValidNewClassName('tạo lớp học')).toBeNull();
    expect(extractValidNewClassName('thêm lớp')).toBeNull();
    expect(extractValidNewClassName('hướng dẫn tạo lớp')).toBeNull();

    // Explicit valid classes should be extracted cleanly
    expect(extractValidNewClassName('tạo lớp 11A5')).toMatch(/11a5/i);
    expect(extractValidNewClassName('tạo lớp 12A1 môn Hóa')).toMatch(/12A1/i);
    expect(extractValidNewClassName('mở lớp 10 Chuyên Hóa')).toBe('10 Chuyên Hóa');
  });

  it('provides multi-subject GDPT 2025 topics accurately for Math, Physics, Chemistry, Biology, English', () => {
    const math12 = getTopicsForSubjectAndGrade('Toán học', '12');
    expect(math12).toBeDefined();
    expect(math12[0]).toContain('khảo sát hàm số');

    const phys12 = getTopicsForSubjectAndGrade('Vật lí', '12');
    expect(phys12).toBeDefined();
    expect(phys12[0]).toContain('Vật lý nhiệt');

    const chem12 = getTopicsForSubjectAndGrade('Hóa học', '12');
    expect(chem12).toBeDefined();
    expect(chem12[0]).toContain('Este');

    const bio12 = getTopicsForSubjectAndGrade('Sinh học', '12');
    expect(bio12).toBeDefined();
    expect(bio12[0]).toContain('Di truyền');

    const eng12 = getTopicsForSubjectAndGrade('Tiếng Anh', '12');
    expect(eng12).toBeDefined();
    expect(eng12[0]).toContain('Life Stories');
  });
});
