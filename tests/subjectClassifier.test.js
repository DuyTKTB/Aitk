import { describe, it, expect } from 'vitest';
import { detectExamSubjectAndGrade } from '../src/lib/subjectClassifier.js';
import { getSubjectExamProfile } from '../src/lib/subjects.js';
import { exportLessonPlanDocx, exportMatrixDocx } from '../src/lib/examExport.js';
import { gdptSplit } from '../src/lib/matrixAiService.js';

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

  it('nhận diện đủ các môn KHXH, Ngữ văn, Tin học, Công nghệ & lấy hồ sơ cấu trúc đề chuẩn GDPT 2025', () => {
    expect(detectExamSubjectAndGrade({ fileName: 'De_Lich_Su_12.docx', text: 'Chiến dịch Điện Biên Phủ 1954 và công cuộc Đổi mới 1986' }).subject).toBe('Lịch sử');
    expect(detectExamSubjectAndGrade({ fileName: 'De_Dia_Li_12.docx', text: 'Bảng số liệu mật độ dân số các vùng kinh tế và cán cân xuất nhập khẩu' }).subject).toBe('Địa lí');
    expect(detectExamSubjectAndGrade({ fileName: 'De_Tin_Hoc_12.docx', text: 'Câu 1. Câu lệnh SQL SELECT và vòng lặp Python, giao thức TCP/IP' }).subject).toBe('Tin học');
    expect(detectExamSubjectAndGrade({ fileName: 'De_Cong_Nghe_12.docx', text: 'Mạch điện xoay chiều ba pha và linh kiện bán dẫn' }).subject).toBe('Công nghệ');
    expect(detectExamSubjectAndGrade({ fileName: 'De_GDKTPL_12.docx', text: 'Lạm phát, thất nghiệp, ngân sách nhà nước và quyền bình đẳng công dân' }).subject).toBe('GDKT&PL');
    expect(detectExamSubjectAndGrade({ fileName: 'De_Ngu_Van_12.docx', text: 'Phần I. Đọc hiểu văn bản: Xác định thể thơ và biện pháp tu từ. Phần II. Làm văn nghị luận xã hội' }).subject).toBe('Ngữ văn');

    expect(getSubjectExamProfile('Toán học').standardCounts).toMatchObject({ p1: 12, p2: 4, p3: 6, duration: 90 });
    expect(getSubjectExamProfile('Lịch sử').standardCounts).toMatchObject({ p1: 24, p2: 4, p3: 0, duration: 50 });
    expect(getSubjectExamProfile('Tin học').hasCodeBlocks).toBe(true);
    expect(getSubjectExamProfile('Địa lí').hasShortAnswer).toBe(true);
    expect(getSubjectExamProfile('Tiếng Anh').standardCounts).toMatchObject({ p1: 40, p2: 0, p3: 0 });
    expect(getSubjectExamProfile('Ngữ văn').hasEssay).toBe(true);

    expect(getSubjectExamProfile('Toán học').pointPerQuestion).toEqual({
      single_choice: 0.25,
      true_false: 1.0,
      short_answer: 0.5,
      essay: 0,
    });
    expect(getSubjectExamProfile('Hóa học').pointPerQuestion.short_answer).toBe(0.25);
    expect(getSubjectExamProfile('Địa lí').pointPerQuestion.short_answer).toBe(0.25);
    expect(getSubjectExamProfile('Lịch sử').pointPerQuestion.short_answer).toBe(0);
    expect(getSubjectExamProfile('Tiếng Anh').pointPerQuestion).toEqual({
      single_choice: 0.25,
      true_false: 0,
      short_answer: 0,
      essay: 0,
    });

    expect(gdptSplit(40, 'Tiếng Anh')).toEqual({ p1: 40, p2: 0, p3: 0 });
    expect(gdptSplit(6, 'Ngữ văn')).toEqual({ p1: 0, p2: 0, p3: 0, essay: 6 });
    expect(gdptSplit(22, 'Toán học')).toEqual({ p1: 12, p2: 4, p3: 6 });
    expect(gdptSplit(28, 'Lịch sử')).toEqual({ p1: 24, p2: 4, p3: 0 });
    expect(gdptSplit(28, 'Địa lí')).toEqual({ p1: 18, p2: 4, p3: 6 });
  });
});

describe('Lesson Plan & Matrix Word Export Helpers', () => {
  it('hàm exportLessonPlanDocx và exportMatrixDocx tồn tại và là hàm async', () => {
    expect(typeof exportLessonPlanDocx).toBe('function');
    expect(typeof exportMatrixDocx).toBe('function');
  });
});
