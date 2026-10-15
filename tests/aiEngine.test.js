import { describe, it, expect, vi, afterEach } from 'vitest';
import { askAI, buildRequestPlan, MSG_RATE_LIMIT } from '../src/lib/ai.js';

/* ============================================================
   Test tích hợp động cơ AI — giả lập SSE thật của cả 2 họ API
   (Gemini và OpenAI-compatible) để kiểm tra luồng đầy đủ:
   ngữ cảnh nội bộ → công cụ tính → stream suy luận → tự kiểm tra.
   Không gọi mạng thật.
   ============================================================ */

const sse = (chunks) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('');

const G = (parts) => ({ candidates: [{ content: { parts } }] });
const OAI = (delta) => ({ choices: [{ delta }] });

function geminiBody(reasoning, text) {
  const chunks = [];
  if (reasoning) chunks.push(G([{ text: reasoning, thought: true }]));
  if (text) chunks.push(G([{ text }]));
  return sse(chunks);
}

function openaiBody(reasoning, text) {
  const chunks = [];
  if (reasoning) chunks.push(OAI({ reasoning }));
  if (text) chunks.push(OAI({ content: text }));
  return sse(chunks) + 'data: [DONE]\n\n';
}

/** Giả lập cả 2 họ API theo URL; ghi lại request để assert. */
function stubProviders({ gemini, openai, status = 200 } = {}) {
  const calls = [];
  const fetchMock = vi.fn(async (url, init) => {
    const u = String(url);
    const kind = u.includes('generativelanguage') ? 'gemini' : 'openai';
    calls.push({ url: u, init, kind, body: init?.body ? JSON.parse(init.body) : null });
    if (status !== 200) return new Response('{"error":{"message":"Quota exceeded"}}', { status });
    if (kind === 'gemini') {
      return new Response(gemini ?? geminiBody('Cần tính n(Fe)', 'Kết quả: V(H₂) = 2,246 lít.'), { status: 200 });
    }
    return new Response(openai ?? openaiBody('Cần tính n(Fe)', 'Kết quả: V(H₂) = 2,246 lít.'), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.calls = calls;
  return fetchMock;
}

/** Lấy system prompt ra khỏi body của cả 2 họ API. */
const systemPromptOf = (call) => (call.kind === 'gemini'
  ? call.body?.systemInstruction?.parts?.[0]?.text
  : call.body?.messages?.[0]?.content) || '';

const IMAGE_MSG = [{
  role: 'user',
  parts: [
    { text: 'Phân tích ảnh này.\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.' },
    { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } },
  ],
}];

const FE_HCL = 'Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 ở đktc';
const HARD = 'Cho hỗn hợp gồm 5,6 gam Fe và 3,2 gam Cu tác dụng với 200 ml dung dịch HNO3 2M, '
  + 'tính khối lượng muối thu được và hiệu suất phản ứng, biết rằng khí NO là sản phẩm khử duy nhất';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('askAI — ảnh đề bài (Gemini vision)', () => {
  it('gửi ảnh đúng định dạng, bật suy luận sâu, tách suy luận khỏi câu trả lời', async () => {
    const fetchMock = stubProviders();

    const chunks = [];
    const thoughts = [];
    const res = await askAI(IMAGE_MSG, (t) => chunks.push(t), (r) => thoughts.push(r), { uid: '' });

    const call = fetchMock.calls[0];
    expect(call.kind).toBe('gemini');
    expect(call.url).toContain(':streamGenerateContent');
    expect(JSON.stringify(call.body.contents)).toContain('inline_data');
    expect(call.body.generationConfig.thinkingConfig?.thinkingBudget).toBeGreaterThan(0);

    expect(thoughts.join('')).toContain('Cần tính n(Fe)');
    expect(res.reasoning).toContain('Cần tính n(Fe)');
    expect(res.text).toContain('2,246');
    expect(res.text).not.toContain('Cần tính n(Fe)');
    expect(chunks.length).toBeGreaterThan(0);

    // Ảnh nhưng chưa có nội dung chữ → không chạy công cụ, không nhét tri thức rác
    expect(res.toolHits).toEqual([]);
    const sys = systemPromptOf(call);
    expect(sys).not.toContain('KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ');
    expect(sys).not.toContain('Độ rượu');
    expect(sys).toContain('KHI CÓ ẢNH');
  });
});

describe('askAI — bài toán có công cụ (văn bản)', () => {
  it('nhét kết quả công cụ + tri thức vào prompt và xác nhận đáp án khớp', async () => {
    const fetchMock = stubProviders();
    const res = await askAI(
      [{ role: 'user', parts: [{ text: `${FE_HCL}\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.` }] }],
      null,
      null,
      { uid: '', noCache: true, grade: 'Lớp 11' }
    );

    const sys = systemPromptOf(fetchMock.calls[0]);
    expect(sys).toContain('KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ NỘI BỘ');
    expect(sys).toContain('n(Fe) = m/M = 5,6/55,845');
    expect(sys).toContain('KHỐI LỚP NGƯỜI HỌC: lớp 11');

    expect(res.toolHits.some((h) => h.tool === 'stoich')).toBe(true);
    expect(res.citations.length).toBeGreaterThan(0);
    expect(res.verification.ok).toBe(true);
    expect(res.text).toContain('2,246');
    expect(res.text).not.toContain('Tự kiểm tra:');
  });

  it('gắn cảnh báo khi AI bỏ qua kết quả công cụ', async () => {
    stubProviders({ openai: openaiBody('', 'n(Fe) = 0,5 mol, V(H₂) = 99 lít.') });
    const res = await askAI([{ role: 'user', parts: [{ text: FE_HCL }] }], null, null, { uid: '', noCache: true });
    expect(res.verification.ok).toBe(false);
    expect(res.text).toContain('Tự kiểm tra: đáp án chưa khớp các giá trị đã tính bằng công cụ');
  });

  it('bài toán khó → giảm sáng tạo, tăng token, ép cấu trúc trình bày', async () => {
    const fetchMock = stubProviders();
    await askAI([{ role: 'user', parts: [{ text: HARD }] }], null, null, { uid: '', noCache: true });

    const call = fetchMock.calls[0];
    expect(call.body.temperature).toBeLessThanOrEqual(0.1);
    expect(call.body.max_tokens).toBeGreaterThanOrEqual(8192);
    expect(systemPromptOf(call)).toContain('CẤU TRÚC BẮT BUỘC');
  });
});

describe('askAI — chat thường', () => {
  it('không nhét công cụ/tri thức và không bật suy luận', async () => {
    const fetchMock = stubProviders({ openai: openaiBody('', 'Chào bạn! Mình giúp gì được?') });
    const res = await askAI([{ role: 'user', parts: [{ text: 'chào bạn' }] }], null, null, { uid: '' });

    const call = fetchMock.calls[0];
    expect(call.url).toContain('/chat/completions');
    const sys = systemPromptOf(call);
    expect(sys).not.toContain('KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ');
    expect(sys).not.toContain('NGỮ CẢNH NỘI BỘ ELEC AI');
    expect(res.text).toContain('Chào bạn');
  });
});

describe('askAI — tương thích & phục hồi', () => {
  it('giữ chữ ký cũ: systemPrompt tùy biến vẫn được ưu tiên', async () => {
    const fetchMock = stubProviders({ openai: openaiBody('', 'ok') });
    await askAI(
      [{ role: 'user', parts: [{ text: 'so sánh hai công cụ AI' }] }],
      null,
      null,
      'PROMPT RIÊNG CỦA TÔI'
    );
    expect(systemPromptOf(fetchMock.calls[0])).toContain('PROMPT RIÊNG CỦA TÔI');
  });

  it('cache: lần gọi lặp lại không tốn thêm request', async () => {
    const fetchMock = stubProviders({ openai: openaiBody('', 'kết quả ổn định') });
    const history = [{ role: 'user', parts: [{ text: 'giải thích định luật bảo toàn khối lượng giúp mình' }] }];
    const first = await askAI(history, null, null, { uid: '' });
    const callsAfterFirst = fetchMock.calls.length;
    const second = await askAI(history, null, null, { uid: '' });

    expect(second.fromCache).toBe(true);
    expect(second.text).toBe(first.text);
    expect(fetchMock.calls.length).toBe(callsAfterFirst);
  });

  it('429 với mọi provider → báo lỗi quota rõ ràng thay vì treo', async () => {
    stubProviders({ status: 429 });
    await expect(askAI([{ role: 'user', parts: [{ text: FE_HCL }] }], null, null, { noCache: true, uid: '' }))
      .rejects.toMatchObject({ isQuota: true, message: MSG_RATE_LIMIT });
  }, 20000);
});

describe('buildRequestPlan', () => {
  it('không gọi mạng, trả đủ dữ liệu cho UI và prompt', () => {
    const plan = buildRequestPlan(
      [{ role: 'user', parts: [{ text: 'Tính khối lượng mol của H2SO4' }] }],
      { grade: 'Lớp 10', mode: 'detail' }
    );
    expect(plan.toolHits.some((h) => h.tool === 'molar')).toBe(true);
    expect(plan.systemPrompt).toContain('GIẢI CHI TIẾT');
    expect(plan.systemPrompt).toContain('lớp 10');
  });
});
