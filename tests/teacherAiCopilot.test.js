import { describe, it, expect } from 'vitest';
import {
  getGradeCurriculumGuideline,
  parseExamIntent,
  detectTeacherCopilotRoute,
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
});
