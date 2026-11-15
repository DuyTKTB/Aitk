import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

function clearClientAiKeys() {
  const sources = [import.meta.env || {}, typeof process !== 'undefined' ? (process.env || {}) : {}];
  for (const src of sources) {
    for (const key of Object.keys(src)) {
      if (/(gemini|groq|agnes)/i.test(key) && /(key|token|api)/i.test(key)) {
        vi.stubEnv(key, '');
      }
    }
  }
}

describe('Server Proxy /api/ai-chat fallback (khi client không có VITE_* key)', () => {
  beforeEach(() => {
    vi.resetModules();
    clearClientAiKeys();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('askAI tự động gọi /api/ai-chat khi không cấu hình VITE_* key trên client', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      const body = init?.body ? JSON.parse(init.body) : null;
      calls.push({ url: String(url), body });
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Phản ứng tạo kết tủa trắng BaSO4.' }] } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    const { askAI } = await import('../src/lib/ai.js');
    const chunks = [];
    const res = await askAI(
      [{ role: 'user', parts: [{ text: 'Cho BaCl2 tác dụng với H2SO4 thu được gì?' }] }],
      (c) => chunks.push(c),
      null,
      { noCache: true, uid: '' },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/ai-chat');
    expect(calls[0].body.provider).toBe('gemini');
    expect(res.text).toContain('BaSO4');
    expect(res.model).toMatch(/^server\/gemini\//);
    expect(chunks.join('')).toContain('BaSO4');
  });

  it('askAI tự động xoay sang groq qua /api/ai-chat nếu gemini proxy trả 429', async () => {
    const providersTried = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      providersTried.push(body.provider);
      if (body.provider === 'gemini') {
        return new Response(JSON.stringify({ error: 'Quota' }), { status: 429 });
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'Sắt hóa trị II và III đều phản ứng tốt với HNO3.' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    const { askAI } = await import('../src/lib/ai.js');
    const res = await askAI(
      [{ role: 'user', parts: [{ text: 'Giải thích nhanh phản ứng Fe với HNO3' }] }],
      null,
      null,
      { noCache: true, uid: '' },
    );

    expect(providersTried).toEqual(['gemini', 'groq']);
    expect(res.model).toMatch(/^server\/groq\//);
    expect(res.text).toContain('HNO3');
  });

  it('examAiUtils.callModel gọi /api/ai-chat và xoay sang groq khi gemini bận', async () => {
    const providersTried = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      expect(String(url)).toBe('/api/ai-chat');
      const body = JSON.parse(init.body);
      providersTried.push(body.provider);
      if (body.provider === 'gemini') {
        return new Response(JSON.stringify({ error: '503' }), { status: 503 });
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: '{"title":"Đề kiểm tra","questions":[]}' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    const { callModel } = await import('../src/lib/examAiUtils.js');
    const out = await callModel({
      system: 'Tạo đề Hóa 12',
      parts: [{ text: 'Hãy tạo 5 câu hỏi trắc nghiệm chuyên đề Este - Lipit theo chương trình GDPT 2025.' }],
    });

    expect(providersTried).toEqual(['gemini', 'groq']);
    expect(JSON.parse(out)).toMatchObject({ title: 'Đề kiểm tra' });
  });

  it('examAiUtils.callModel không gửi đề chỉ có ảnh sang model text-only khi Gemini proxy lỗi', async () => {
    const providersTried = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      providersTried.push(body.provider);
      return new Response(JSON.stringify({ error: 'No Gemini key' }), { status: 503 });
    }));

    const { callModel } = await import('../src/lib/examAiUtils.js');
    await expect(callModel({
      system: 'Số hóa ảnh đề thi',
      parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }, { text: 'Đọc ảnh' }],
    })).rejects.toThrow(/Proxy gemini/);

    expect(providersTried).toEqual(['gemini']);
  });
});
