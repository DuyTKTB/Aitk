import { describe, it, expect } from 'vitest';
import {
  classifyTask, tierFor, modelsFor, parseKeys, createKeyRing, buildProviderChain,
  lastUserText, hasImage, coreText, isSubstantive, reasoningParamFor,
} from '../src/lib/aiRouter.js';

const msg = (text) => [{ role: 'user', parts: [{ text }] }];

describe('lastUserText / hasImage', () => {
  it('lấy nội dung tin nhắn cuối', () => {
    expect(lastUserText([{ role: 'user', parts: [{ text: 'a' }] }, { role: 'model', parts: [{ text: 'b' }] }, { role: 'user', parts: [{ text: 'c' }] }])).toBe('c');
  });

  it('phát hiện ảnh', () => {
    expect(hasImage([{ role: 'user', parts: [{ inlineData: { data: 'x' } }] }])).toBe(true);
    expect(hasImage(msg('chữ'))).toBe(false);
  });
});

describe('coreText / isSubstantive', () => {
  it('bỏ đuôi boilerplate mà app tự nối vào câu hỏi', () => {
    expect(coreText('Tính số mol của 5,6 gam Fe\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.'))
      .toBe('Tính số mol của 5,6 gam Fe');
  });

  it('coi "Phân tích ảnh này" là không có nội dung', () => {
    expect(coreText('Phân tích ảnh này.\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.')).toBe('');
    expect(isSubstantive('Phân tích ảnh này.')).toBe(false);
    expect(isSubstantive('Tính khối lượng mol của H2SO4')).toBe(true);
  });
});

describe('reasoningParamFor', () => {
  it('gpt-oss/qwen nhận reasoning_effort', () => {
    expect(reasoningParamFor('openai/gpt-oss-120b', 'high')).toEqual({ reasoning_effort: 'high' });
    expect(reasoningParamFor('qwen-3-32b', 'medium')).toEqual({ reasoning_effort: 'medium' });
  });

  it('provider không hỗ trợ → null', () => {
    expect(reasoningParamFor('agnes-3.0-flash', 'high')).toBeNull();
    expect(reasoningParamFor('openai/gpt-oss-120b', null)).toBeNull();
  });
});

describe('classifyTask', () => {
  it('không bị nhiễu bởi đuôi "Trình độ: ..." của app', () => {
    const t = classifyTask(msg('Tính số mol của 5,6 gam Fe\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.'));
    expect(t.kind).toBe('problem');
  });

  it('chat thường', () => {
    const t = classifyTask(msg('xin chào bạn'));
    expect(t.kind).toBe('chat');
    expect(t.needTools).toBe(false);
    expect(tierFor(t)).toBe('fast');
  });

  it('bài toán Hóa đơn giản', () => {
    const t = classifyTask(msg('Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 ở đktc'));
    expect(t.kind).toBe('problem');
    expect(t.needTools).toBe(true);
    expect(t.temperature).toBeLessThan(0.2);
  });

  it('bài toán khó → suy luận sâu', () => {
    const t = classifyTask(msg(
      'Cho hỗn hợp gồm 5,6 gam Fe và 3,2 gam Cu tác dụng với 200 ml dung dịch HNO3 2M, ' +
      'tính khối lượng muối thu được và hiệu suất phản ứng, biết rằng khí NO là sản phẩm khử duy nhất'
    ));
    expect(t.kind).toBe('problem');
    expect(t.hard).toBe(true);
    expect(t.reasoningEffort).toBe('high');
    expect(t.thinkingBudget).toBeGreaterThan(0);
  });

  it('câu hỏi "giải thích" là lý thuyết, không phải bài toán', () => {
    expect(classifyTask(msg('Giải thích tại sao nước có liên kết hydro')).kind).toBe('theory');
  });

  it('yêu cầu tạo đề', () => {
    expect(classifyTask(msg('Tạo đề kiểm tra 15 phút chương este lớp 12')).kind).toBe('generate');
  });

  it('so sánh công cụ AI', () => {
    expect(classifyTask(msg('So sánh ChatGPT và Gemini, nên dùng cái nào?')).kind).toBe('compare');
  });

  it('có ảnh → tác vụ vision', () => {
    const t = classifyTask([{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'x' } }] }]);
    expect(t.kind).toBe('vision');
    expect(tierFor(t)).toBe('vision');
  });
});

describe('modelsFor', () => {
  it('có model cho từng provider', () => {
    expect(modelsFor('gemini', 'smart').length).toBeGreaterThan(0);
    expect(modelsFor('groq', 'fast').length).toBeGreaterThan(0);
    expect(modelsFor('agnes', 'smart').length).toBeGreaterThan(0);
    expect(modelsFor('gemini', 'vision').length).toBeGreaterThan(0);
  });
});

describe('parseKeys / createKeyRing', () => {
  it('tách nhiều key', () => {
    expect(parseKeys('key_aaaaaaaaaaa,key_bbbbbbbbbbb;key_ccccccccccc')).toHaveLength(3);
    expect(parseKeys('')).toEqual([]);
  });

  it('xoay vòng key', () => {
    const ring = createKeyRing('key_111111111,key_222222222');
    const a = ring.get();
    const b = ring.get();
    expect(a).not.toBe(b);
    expect(ring.size).toBe(2);
  });

  it('bỏ qua key đang cooldown', () => {
    const ring = createKeyRing('key_111111111,key_222222222');
    const k1 = ring.get();
    ring.reportBad(k1, 60000);
    const next = ring.get();
    expect(next).not.toBe(k1);
    ring.reportBad(next, 60000);
    expect(ring.get()).toBeNull();
    expect(ring.hasUsable()).toBe(false);
  });
});

describe('buildProviderChain', () => {
  const rings = (gem, groq, agnes) => ({
    gemini: createKeyRing(gem),
    groq: createKeyRing(groq),
    agnes: createKeyRing(agnes),
  });

  it('chỉ gồm provider có key', () => {
    const chain = buildProviderChain({ task: { kind: 'problem' }, rings: rings('key_gemini123456', '', '') });
    expect(chain.map((c) => c.id)).toEqual(['gemini']);
  });

  it('chat thường ưu tiên model nhanh (groq trước)', () => {
    const chain = buildProviderChain({
      task: { kind: 'chat' },
      rings: rings('key_gemini123456', 'key_groq12345678', ''),
    });
    expect(chain[0].id).toBe('groq');
  });

  it('bài toán ưu tiên model mạnh', () => {
    const chain = buildProviderChain({
      task: { kind: 'problem', hard: true },
      rings: rings('key_gemini123456', 'key_groq12345678', 'key_agnes12345678'),
    });
    expect(chain[0].id).toBe('agnes');
    expect(chain.map((c) => c.id)).toContain('gemini');
  });

  it('ảnh chỉ dùng provider vision', () => {
    const chain = buildProviderChain({
      task: { kind: 'vision' },
      rings: rings('key_gemini123456', 'key_groq12345678', ''),
    });
    expect(chain.map((c) => c.id)).toEqual(['gemini']);
    expect(chain[0].type).toBe('vision');
  });
});
