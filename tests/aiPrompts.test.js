import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, STUDY_MODES, MODE_LIST, VERIFY_SYSTEM_PROMPT } from '../src/lib/aiPrompts.js';
import { buildRequestPlan } from '../src/lib/ai.js';

describe('STUDY_MODES', () => {
  it('có đủ 6 chế độ học', () => {
    expect(MODE_LIST).toHaveLength(6);
    expect(Object.keys(STUDY_MODES)).toEqual(
      expect.arrayContaining(['auto', 'detail', 'steps', 'check', 'theory', 'similar'])
    );
    for (const m of MODE_LIST) {
      expect(m.label).toBeTruthy();
      expect(m.instruction.length).toBeGreaterThan(30);
    }
  });
});

describe('buildSystemPrompt', () => {
  it('luôn có danh tính + quy tắc định dạng', () => {
    const p = buildSystemPrompt({});
    expect(p).toContain('ELEC AI Assistant');
    expect(p).toContain('KHÔNG dùng LaTeX');
  });

  it('ghép khối lớp', () => {
    expect(buildSystemPrompt({ grade: 'Lớp 10' })).toContain('lớp 10');
    expect(buildSystemPrompt({ grade: 'Đại học' })).toContain('đại học');
  });

  it('chế độ gợi ý từng bước không cho đáp án', () => {
    const p = buildSystemPrompt({ mode: 'steps' });
    expect(p).toContain('KHÔNG viết ra kết quả cuối cùng');
  });

  it('nhét ngữ cảnh nội bộ + kết quả công cụ', () => {
    const p = buildSystemPrompt({
      knowledge: '[1] (Công thức · Số mol) n = m/M',
      toolResults: '(1) Khối lượng mol H₂SO₄\n  • M = 98,072 g/mol',
    });
    expect(p).toContain('NGỮ CẢNH NỘI BỘ ELEC AI');
    expect(p).toContain('n = m/M');
    expect(p).toContain('KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ NỘI BỘ');
    expect(p).toContain('98,072');
  });

  it('bài toán khó có cấu trúc bắt buộc', () => {
    const p = buildSystemPrompt({ hard: true });
    expect(p).toContain('CẤU TRÚC BẮT BUỘC');
    expect(p).toContain('Tự kiểm tra');
  });

  it('có ảnh thì nhắc quy tắc đọc ảnh', () => {
    expect(buildSystemPrompt({ hasImage: true })).toContain('KHI CÓ ẢNH');
  });

  it('luôn có quy tắc chống prompt injection', () => {
    expect(buildSystemPrompt({ hasImage: true })).toContain('CHỐNG CHỈ DẪN NHÚNG');
  });
});

describe('VERIFY_SYSTEM_PROMPT', () => {
  it('yêu cầu kết luận ĐÚNG/SAI', () => {
    expect(VERIFY_SYSTEM_PROMPT).toContain('KẾT LUẬN');
  });
});

describe('buildRequestPlan', () => {
  const history = (text) => [{ role: 'user', parts: [{ text }] }];

  it('bài toán Hóa → có công cụ + ngữ cảnh + prompt có kết quả tính', () => {
    const plan = buildRequestPlan(history('Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích H2 ở đktc'));
    expect(plan.task.kind).toBe('problem');
    expect(plan.toolHits.length).toBeGreaterThan(0);
    expect(plan.toolBlock).toContain('mol');
    expect(plan.systemPrompt).toContain('KẾT QUẢ ĐÃ TÍNH');
    expect(plan.systemPrompt).toContain('n(Fe)');
  });

  it('chat thường → không nhét công cụ/ngữ cảnh', () => {
    const plan = buildRequestPlan(history('chào bạn, hôm nay thế nào'));
    expect(plan.toolHits).toEqual([]);
    expect(plan.knowledge).toBe('');
  });

  it('tôn trọng system prompt tùy biến (không chèn ngữ cảnh nội bộ)', () => {
    const plan = buildRequestPlan(history('so sánh ChatGPT và Gemini'), { systemPrompt: 'PROMPT RIÊNG' });
    expect(plan.systemPrompt).toContain('PROMPT RIÊNG');
    expect(plan.systemPrompt).not.toContain('NGỮ CẢNH NỘI BỘ ELEC AI');
  });

  it('chèn chế độ học đã chọn', () => {
    const plan = buildRequestPlan(history('Tính số mol của 5,6 gam Fe'), { mode: 'steps', grade: 'Lớp 10' });
    expect(plan.systemPrompt).toContain('GỢI Ý TỪNG BƯỚC');
    expect(plan.systemPrompt).toContain('lớp 10');
  });

  it('giữ ngữ cảnh dài bằng tóm tắt khi hội thoại nhiều lượt', () => {
    const long = [];
    for (let i = 0; i < 14; i++) {
      long.push({ role: 'user', parts: [{ text: `câu hỏi số ${i} về este và axit` }] });
      long.push({ role: 'model', parts: [{ text: `trả lời ${i}` }] });
    }
    long.push({ role: 'user', parts: [{ text: 'tính số mol của 5,6 gam Fe' }] });
    const plan = buildRequestPlan(long);
    expect(plan.recentHistory.length).toBeLessThanOrEqual(9);
    expect(plan.olderSummary.length).toBeGreaterThan(10);
    expect(plan.systemPrompt).toContain('Ngữ cảnh cuộc trò chuyện trước đó');
  });
});
