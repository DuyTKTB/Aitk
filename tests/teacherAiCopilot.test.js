import { describe, it, expect } from 'vitest';
import {
  getGradeCurriculumGuideline,
  parseExamIntent,
  detectTeacherCopilotRoute,
  suggestFormat,
  buildFallbackMatrix,
  FORMAT_MCQ,
  FORMAT_GDPT,
  FORMAT_GDPT_2PART,
  FORMAT_ESSAY,
} from '../src/lib/matrixAiService.js';

describe('ELEC Teacher AI Copilot & Multi-Subject Intelligence', () => {
  it('1. Phân tách chuẩn chương trình GDPT 2018 cho cả 4 môn (Vật lý, Toán học, Hóa học, Sinh học)', () => {
    const phy12 = getGradeCurriculumGuideline('12', 'Vật lý');
    expect(phy12).toContain('VẬT LÝ LỚP 12');
    expect(phy12).toContain('Khí lí tưởng');
    expect(phy12).not.toContain('ĐÂY LÀ ĐỀ HÓA HỌC');

    const math12 = getGradeCurriculumGuideline('12', 'Toán học');
    expect(math12).toContain('TOÁN HỌC LỚP 12');
    expect(math12).toContain('Oxyz');
    expect(math12).not.toContain('ĐÂY LÀ ĐỀ HÓA HỌC');

    const bio11 = getGradeCurriculumGuideline('11', 'Sinh học');
    expect(bio11).toContain('SINH HỌC LỚP 11');
  });

  it('2. Tự động suy luận đúng khối lớp cho Vật lý và Toán học từ tên chuyên đề', () => {
    const phyIntent = parseExamIntent('Tạo đề 20 câu giao thoa sóng ánh sáng Y-âng và con lắc lò xo');
    expect(phyIntent.subject).toBe('Vật lý');
    expect(phyIntent.grade).toBe('11');

    const mathIntent = parseExamIntent('Tạo đề 15 câu tích phân và phương trình mặt phẳng Oxyz');
    expect(mathIntent.subject).toBe('Toán học');
    expect(mathIntent.grade).toBe('12');
  });

  it('3. Định tuyến thông minh: phân tích tài liệu / hỏi sư phạm dùng Copilot thay vì từ chối hay ép interview', () => {
    expect(detectTeacherCopilotRoute({
      text: 'Phân tích tài liệu đề thi tiêu hóa này giúp tôi',
      files: [{ name: 'de-tieu-hoa.docx', kind: 'docx' }],
      hasQuestions: false,
    })).toBe('copilot');

    expect(detectTeacherCopilotRoute({
      text: 'Giải thích vì sao câu 3 lại có bẫy như vậy và đánh giá độ phân hóa?',
      hasQuestions: true,
    })).toBe('copilot');

    expect(detectTeacherCopilotRoute({
      text: 'Tạo đề mới 20 câu 45 phút chương Este lớp 12',
      hasQuestions: true,
    })).toBe('new_exam');

    expect(detectTeacherCopilotRoute({
      text: 'Dựng ma trận theo file này',
      files: [{ name: 'ma-tran-hoa-12.xlsx', kind: 'xlsx' }],
    })).toBe('custom_matrix');

    expect(detectTeacherCopilotRoute({
      text: 'Tạo đề kiểm tra 15 phút Este lớp 12, 10 câu',
      hasQuestions: false,
    })).toBe('exam_plan');
  });

  it('4. Nhận diện môn Tiếng Anh, khung Global Success lớp 11 và định dạng 100% trắc nghiệm', () => {
    const enIntent = parseExamIntent('Tạo đề thi thử THPTQG Tiếng Anh lớp 11 chủ đề The Generation Gap');
    expect(enIntent.subject).toBe('Tiếng Anh');
    expect(enIntent.grade).toBe('11');
    expect(enIntent.count).toBe(40);
    expect(enIntent.duration).toBe(50);
    expect(enIntent.format).toBe(FORMAT_MCQ);

    const en11 = getGradeCurriculumGuideline('11', 'Tiếng Anh');
    expect(en11).toContain('TIẾNG ANH LỚP 11');
    expect(en11).toContain('The Generation Gap');
    expect(en11).not.toContain('ĐÂY LÀ ĐỀ HÓA HỌC');

    expect(suggestFormat(40, 'Tiếng Anh')).toBe(FORMAT_MCQ);
  });

  it('5. Hỗ trợ chuẩn Bộ GD&ĐT 2025 cho Toán (12+4+6 trọng số 1:4:2), Lịch sử/GDKT&PL/Tin/Công nghệ (24+4), Địa lí (18+4+6) và Ngữ văn', () => {
    const mathIntent = parseExamIntent('Tạo đề thi thử THPTQG môn Toán lớp 12');
    expect(mathIntent).toMatchObject({ subject: 'Toán học', grade: '12', count: 22, duration: 90, format: FORMAT_GDPT });
    const mathMatrix = buildFallbackMatrix({ subject: 'Toán học', grade: '12', count: 22, duration: 90, format: FORMAT_GDPT });
    expect(mathMatrix.parts.map((p) => p.topics.reduce((a, t) => a + t.nb.count + t.th.count + t.vd.count + t.vdc.count, 0))).toEqual([12, 4, 6]);
    expect(mathMatrix.totalPoints).toBe(10);
    // Phần III của Toán 2025 (6 câu) có tổng điểm 3.0đ (0.5đ/câu)
    const p3Pts = mathMatrix.parts[2].topics.reduce((a, t) => a + t.nb.points + t.th.points + t.vd.points + t.vdc.points, 0);
    expect(Math.round(p3Pts * 100) / 100).toBe(3);

    const histIntent = parseExamIntent('Đề thi thử THPTQG môn Lịch sử lớp 12');
    expect(histIntent).toMatchObject({ subject: 'Lịch sử', grade: '12', count: 28, duration: 50, format: FORMAT_GDPT_2PART });
    const histMatrix = buildFallbackMatrix({ subject: 'Lịch sử', grade: '12', count: 28, duration: 50 });
    expect(histMatrix.parts.map((p) => p.format)).toEqual(['multiple_choice', 'true_false']);
    expect(histMatrix.parts.map((p) => p.topics.reduce((a, t) => a + t.nb.count + t.th.count + t.vd.count + t.vdc.count, 0))).toEqual([24, 4]);

    const itMatrix = buildFallbackMatrix({ subject: 'Tin học', grade: '12', count: 28, duration: 50 });
    expect(itMatrix.parts.map((p) => p.format)).toEqual(['multiple_choice', 'true_false']);
    expect(getGradeCurriculumGuideline('12', 'Tin học')).toContain('TIN HỌC LỚP 12');
    expect(getGradeCurriculumGuideline('12', 'Tin học')).not.toContain('ĐÂY LÀ ĐỀ HÓA HỌC');

    const geoMatrix = buildFallbackMatrix({ subject: 'Địa lí', grade: '12', count: 28, duration: 50 });
    expect(geoMatrix.parts.map((p) => p.format)).toEqual(['multiple_choice', 'true_false', 'short_answer']);

    const litIntent = parseExamIntent('Đề thi thử THPTQG Ngữ văn lớp 12');
    expect(litIntent).toMatchObject({ subject: 'Ngữ văn', grade: '12', count: 6, duration: 120, format: FORMAT_ESSAY });
    const litMatrix = buildFallbackMatrix({ subject: 'Ngữ văn', grade: '12', count: 6, duration: 120 });
    expect(litMatrix.parts.map((p) => p.format)).toEqual(['essay']);
  });
});
