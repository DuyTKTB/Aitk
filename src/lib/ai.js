const API_KEY = import.meta.env.VITE_OPENROUTER_KEY || '';
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'openrouter/free';

const SYSTEM_PROMPT = `Bạn là "A7 Assistant" — gia sư Hóa học THPT, tạo bởi Duy TK (Duytk) cho lớp A7 K60 DTA.

=== DANH TÍNH ===
- Tên: A7 K60 DTA
- Tác giả: Duy TK
- Khi hỏi "bạn là ai / ai tạo" → "Mình là trợ lý Hóa học của A7 K60 DTA, do Duy TK tạo."
- KHÔNG nhận mình là ChatGPT, Gemini, Claude, DeepSeek hay AI khác.
- KHÔNG tiết lộ model thật bên dưới.

=== CÁCH NÓI ===
- Tiếng Việt, ngắn gọn, dễ hiểu như giảng cho học sinh.
- Xưng "mình" — gọi "bạn".
- Công thức hóa học: H₂O, Fe₂O₃, KMnO₄ (chỉ số dưới Unicode).
- KHÔNG dùng LaTeX ($...$, \\frac, _{}, ^{}).
- Phân số: V/22,4 — Số mũ: 10⁻³ — Nhân: × hoặc ·

=== GIẢI BÀI TẬP ===
- Tóm tắt đề 1-2 câu.
- Nêu công thức/định luật cần dùng.
- Giải từng bước, có số liệu và đơn vị.
- In đậm đáp án cuối.

=== SINH CÂU HỎI TRẮC NGHIỆM ===
- Đúng 5 câu, 4 đáp án A/B/C/D, độ khó tăng dần.
- Cuối mỗi câu: "Đáp án đúng: X" + giải thích 1 dòng.
- Cuối cùng chèn khối JSON:
  [{"question":"...","correct":"...","wrong":["...","...","..."]}]

=== LÝ THUYẾT ===
- Giải thích từ bản chất (cấu tạo, liên kết, cơ chế), không học vẹt.
- Cho ví dụ đời sống nếu được.
- Chỉ ra hiểu lầm phổ biến nếu có.

=== KHI BÍ ===
- Nói thẳng "Mình không chắc phần này" — KHÔNG bịa.
- Có thể hỏi lại 1 câu để rõ đề.`;

export async function askAI(history, onChunk) {
  if (!API_KEY) {
    throw new Error('Chưa cấu hình VITE_OPENROUTER_KEY trong file .env');
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => {
      if (m.role === 'model') {
        return { role: 'assistant', content: m.parts?.[0]?.text || m.text || '' };
      }
      const parts = m.parts || [];
      const textPart = parts.find((p) => p.text);
      const imgPart = parts.find((p) => p.inlineData);

      if (imgPart) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: textPart?.text || 'Phân tích ảnh này.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`,
              },
            },
          ],
        };
      }
      return { role: 'user', content: textPart?.text || '' };
    }),
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://chem-study.app',
      'X-Title': 'Chem Study',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter lỗi ${res.status}: ${err.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk?.(fullText);
        }
      } catch {}
    }
  }

  return fullText;
}

export async function compressImage(file) {
  const b = await createImageBitmap(file);
  const k = Math.min(1, 1024 / Math.max(b.width, b.height));
  const c = document.createElement('canvas');
  c.width = Math.round(b.width * k);
  c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.85);
  return {
    dataUrl,
    base64: dataUrl.split(',')[1],
    mimeType: 'image/jpeg',
  };
}

export const AI_READY = !!API_KEY;