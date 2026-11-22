import { describe, it, expect } from 'vitest';
import { detectAppGuideQuery, findAppGuideAnswer } from '../src/lib/appGuideKnowledge.js';
import { classifyTask, buildProviderChain } from '../src/lib/aiRouter.js';
import { formatDocsPromptBlock } from '../src/lib/docChatReader.js';

describe('ELEC AI Document Pipeline & App Guide Guard', () => {
  it('1. Không bao giờ cướp prompt phân tích tài liệu DOCX/PDF hay câu hỏi Sinh học chứa "chức năng", "tiêu hao"', () => {
    const bioPrompt = 'Phân tích tài liệu: 2-TRẮC-NGHIỆM-TIÊU-HÓA-Ở-ĐỘNG-VẬT-1-ĐÃ-HOÀN-THIỆN-CHUẨN-GDPT-2025-Ma101.docx';
    expect(detectAppGuideQuery(bioPrompt)).toBeNull();
    expect(findAppGuideAnswer(bioPrompt)).toBeNull();

    const examText = 'Câu 1: Chức năng chính của ruột non và dạ dày ở động vật là gì, quá trình tiêu hao năng lượng ATP diễn ra ra sao?';
    expect(detectAppGuideQuery(examText)).toBeNull();

    const longMixedText = `Đề ôn tập:\n${'Nội dung tiêu hóa và hô hấp ở động vật '.repeat(12)} phòng thí nghiệm 3d lab?`;
    expect(detectAppGuideQuery(longMixedText)).toBeNull();
  });

  it('2. Vẫn điều hướng chính xác khi người dùng thật sự hỏi vị trí tính năng trên web', () => {
    const q1 = detectAppGuideQuery('Phòng thí nghiệm 3D ở đâu trên web vậy?');
    expect(q1).toBeTruthy();
    expect(q1.type).toBe('specific');
    expect(q1.feature.id).toBe('lab3d');

    const q2 = detectAppGuideQuery('Cân bằng phương trình hóa học nằm ở chỗ nào?');
    expect(q2?.feature?.id).toBe('balance');
  });

  it('3. Định tuyến tài liệu đính kèm dài sang Gemini Smart/Flash (không rơi vào chat/Groq fast)', () => {
    const docHistory = [
      {
        role: 'user',
        parts: [
          {
            text:
              'Phân tích tài liệu: de-sinh.docx\n\nTÀI LIỆU ĐÍNH KÈM CỦA NGƯỜI HỌC (HÃY ĐỌC KỸ):\n--- TÀI LIỆU #1: "de-sinh.docx" (~4.078 từ) ---\nNội dung bài đọc mở rộng về sinh học tế bào.',
          },
        ],
      },
    ];
    const task = classifyTask(docHistory, { hasDoc: true });
    expect(task.kind).not.toBe('chat');
    expect(task.maxTokens).toBe(8192);
    expect(task.needTools).toBe(false);

    const mockRings = {
      gemini: { size: 1, hasUsable: () => true },
      groq: { size: 1, hasUsable: () => true },
      agnes: { size: 1, hasUsable: () => true },
    };
    const chain = buildProviderChain({
      task,
      rings: mockRings,
      keys: { gemini: ['g-test'], groq: ['q-test'], agnes: ['a-test'] },
    });
    expect(chain[0]?.id).toBe('gemini');
  });

  it('4. Giữ nguyên nội dung tài liệu >18.000 ký tự và gắn nhãn ghi chú khi cắt giới hạn 45.000 ký tự', () => {
    const body32k = 'A'.repeat(32000);
    const block = formatDocsPromptBlock([
      { name: 'tai-lieu-lon.docx', kind: 'docx', metaLabel: '~4.078 từ', text: body32k, truncated: false },
    ]);
    expect(block.length).toBeGreaterThan(32000);
    expect(block).toContain('TÀI LIỆU #1: "tai-lieu-lon.docx"');

    const truncatedBlock = formatDocsPromptBlock([
      { name: 'rat-lon.pdf', kind: 'pdf', metaLabel: '~9.000 từ', text: 'B'.repeat(45000), truncated: true, totalChars: 62000 },
    ]);
    expect(truncatedBlock).toContain('45.000/62.000');
  });
});
