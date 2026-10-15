import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

/* ============================================================
   Test nhánh OCR DỰ PHÒNG: khi KHÔNG có Gemini (provider vision duy nhất),
   ảnh đề bài phải được OCR ngay trên máy rồi chuyển thành văn bản để
   model text (Groq) giải — kèm cả công cụ tính chính xác.
   ============================================================ */

const OCR_TEXT = 'Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 thoát ra ở đktc';

vi.mock('../src/lib/aiOcr.js', () => ({
  ocrImages: vi.fn(async () => ({ text: 'Cho 5,6 gam Fe tác dụng với HCl dư, tính thể tích khí H2 thoát ra ở đktc', perImage: ['x'], ok: true })),
  releaseOcr: vi.fn(async () => {}),
}));

let askAI;

beforeAll(async () => {
  // Giả lập môi trường CHỈ có Groq (không có key Gemini/Agnes)
  vi.stubEnv('VITE_GEMINI_KEY', '');
  vi.stubEnv('VITE_AGNES_API_KEY', '');
  vi.stubEnv('VITE_GROQ_API_KEY', 'test_groq_key_1234567890');
  ({ askAI } = await import('../src/lib/ai.js'));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const sse = (chunks) => chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join('');

function stubGroq(text) {
  const calls = [];
  const fetchMock = vi.fn(async (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
    return new Response(sse([
      { choices: [{ delta: { content: text } }] },
    ]) + 'data: [DONE]\n\n', { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.calls = calls;
  return fetchMock;
}

const IMAGE_MSG = [{
  role: 'user',
  parts: [
    { text: 'Phân tích ảnh này.\n\nTrình độ: Lớp 11. KHÔNG dùng LaTeX.' },
    { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } },
  ],
}];

describe('askAI — OCR dự phòng khi không có Gemini vision', () => {
  it('đọc ảnh tại máy rồi gửi nội dung cho model text, kèm công cụ tính chính xác', async () => {
    const fetchMock = stubGroq('n(Fe) = 0,1 mol → V(H₂) = 2,246 lít.');
    const chunks = [];
    const thoughts = [];
    const res = await askAI(IMAGE_MSG, (t) => chunks.push(t), (r) => thoughts.push(r), { uid: '', noCache: true });

    // 1. Không gọi Gemini (không có key) — gọi Groq
    const call = fetchMock.calls[0];
    expect(call.url).toContain('api.groq.com');

    // 2. Nội dung OCR được chuyển thành đề bài văn bản
    const userMsg = call.body.messages[call.body.messages.length - 1].content;
    expect(userMsg).toContain('NỘI DUNG ĐỌC ĐƯỢC TỪ ẢNH (OCR)');
    expect(userMsg).toContain('5,6 gam Fe');

    // 3. Công cụ tính đã chạy trên nội dung OCR → đáp án số nằm sẵn trong prompt
    const sys = call.body.messages[0].content;
    expect(sys).toContain('KẾT QUẢ ĐÃ TÍNH BẰNG CÔNG CỤ NỘI BỘ');
    expect(sys).toContain('V(H2, đktc) = n × 22,4 = 0,1 × 22,4 = 2,246 lít');

    // 4. Người dùng thấy tiến trình OCR và nhận câu trả lời
    expect(thoughts.join(' ')).toContain('OCR');
    expect(res.text).toContain('2,246');
    expect(res.toolHits.some((h) => h.tool === 'stoich')).toBe(true);
    expect(res.verification.ok).toBe(true);
  });

  it('OCR thất bại và không có nội dung gõ kèm → báo lỗi rõ ràng, không gọi model', async () => {
    const ocr = await import('../src/lib/aiOcr.js');
    ocr.ocrImages.mockResolvedValueOnce({ text: '', perImage: [''], ok: false });
    const fetchMock = stubGroq('không dùng tới');

    await expect(askAI(IMAGE_MSG, null, null, { uid: '', noCache: true }))
      .rejects.toThrow(/Không đọc được chữ trong ảnh/);
    expect(fetchMock.calls.length).toBe(0);
  });
});

describe('OCR text chuẩn bị cho test', () => {
  it('khớp dữ liệu giả lập', () => {
    expect(OCR_TEXT).toContain('5,6 gam Fe');
  });
});
