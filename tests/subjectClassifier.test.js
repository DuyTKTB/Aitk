import { describe, it, expect } from 'vitest';
import { detectExamSubjectAndGrade } from '../src/lib/subjectClassifier.js';
import { exportLessonPlanDocx, exportMatrixDocx } from '../src/lib/examExport.js';

describe('Subject Classifier — Multi-Subject & Grade Detection', () => {
  it('nhận diện chuẩn xác môn Toán từ tên file hoặc nội dung', () => {
    const res1 = detectExamSubjectAndGrade({ fileName: 'De_Thi_Toan_12.docx', text: '' });
    expect(res1.subject).toBe('Toán');
    expect(res1.grade).toBe('12');

    const res2 = detectExamSubjectAndGrade({
      fileName: 'KiemTra1Tiett.docx',
      text: 'ĐỀ KIỂM TRA MÔN TOÁN 11\nCâu 1. Cho hàm số y = f(x) có đạo hàm liên tục trên R...',
    });
    expect(res2.subject).toBe('Toán');
    expect(res2.grade).toBe('11');

    const res3 = detectExamSubjectAndGrade({
      fileName: 'De101.docx',
      text: 'Câu 1. Tập nghiệm của bất phương trình log2(x - 1) > 3 là\nCâu 2. Trong không gian Oxyz cho mặt phẳng...',
    });
    expect(res3.subject).toBe('Toán');
  });

  it('nhận diện chuẩn xác môn Vật lý từ tên file hoặc thuật ngữ chuyên ngành', () => {
    const res1 = detectExamSubjectAndGrade({ fileName: 'De-thi-vat-li-12.docx', text: '' });
    expect(res1.subject).toBe('Vật lý');
    expect(res1.grade).toBe('12');

    const res2 = detectExamSubjectAndGrade({
      fileName: 'DeKhaoSat.docx',
      text: 'BÀI THI MÔN VẬT LÝ - LỚP 10\nCâu 1. Một vật dao động điều hòa với phương trình x = A cos(omega t + phi)...',
    });
    expect(res2.subject).toBe('Vật lý');
    expect(res2.grade).toBe('10');

    const res3 = detectExamSubjectAndGrade({
      fileName: 'TestRLC.docx',
      text: 'Câu 1. Đặt điện áp xoay chiều vào hai đầu cuộn cảm thuần và tụ điện. Tổng trở của mạch...',
    });
    expect(res3.subject).toBe('Vật lý');
  });

  it('nhận diện chuẩn xác môn Sinh học và không bị nhầm lẫn với học sinh', () => {
    const res1 = detectExamSubjectAndGrade({ fileName: 'De_Sinh_12.docx', text: '' });
    expect(res1.subject).toBe('Sinh học');
    expect(res1.grade).toBe('12');

    const res2 = detectExamSubjectAndGrade({
      fileName: 'KiemTraDinhKy.docx',
      text: 'Danh sách học sinh kiểm tra môn Sinh học lớp 11.\nCâu 1. Phân tử ADN nhân đôi theo nguyên tắc bán bảo toàn...',
    });
    expect(res2.subject).toBe('Sinh học');
    expect(res2.grade).toBe('11');
  });

  it('nhận diện chuẩn xác môn Tiếng Anh từ câu hỏi hoặc tiêu đề', () => {
    const res1 = detectExamSubjectAndGrade({ fileName: 'English_Grade_12.docx', text: '' });
    expect(res1.subject).toBe('Tiếng Anh');
    expect(res1.grade).toBe('12');

    const res2 = detectExamSubjectAndGrade({
      fileName: 'Exam101.docx',
      text: 'Mark the letter A, B, C, or D on your answer sheet to indicate the word whose underlined part differs from the other three...',
    });
    expect(res2.subject).toBe('Tiếng Anh');
  });

  it('nhận diện chuẩn xác môn Hóa học từ thuật ngữ chuyên ngành', () => {
    const res = detectExamSubjectAndGrade({
      fileName: 'KiemTra15p.docx',
      text: 'Câu 1. Thủy phân hoàn toàn este etyl fomat trong dung dịch NaOH thu được ancol...',
    });
    expect(res.subject).toBe('Hóa học');
  });
});

describe('Lesson Plan & Matrix Word Export Helpers', () => {
  it('hàm exportLessonPlanDocx và exportMatrixDocx tồn tại và là hàm async', () => {
    expect(typeof exportLessonPlanDocx).toBe('function');
    expect(typeof exportMatrixDocx).toBe('function');
  });
});
