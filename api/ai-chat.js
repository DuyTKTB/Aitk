/**
 * api/ai-chat.js — Vercel Serverless Proxy bảo mật khóa API AI cho ELEC Science AI
 * --------------------------------------------------------------------------------
 * Hỗ trợ ẩn hoàn toàn các khóa GEMINI_API_KEY / GROQ_API_KEY / AGNES_API_KEY ở phía Server,
 * tự động xoay vòng key (Key Rotation) khi gặp giới hạn 429 Too Many Requests.
 */

const PROVIDER_CONFIG = {
  gemini: { envRe: /^(?:VITE_)?GEMINI(?:_API)?_KEY/i },
  groq: { envRe: /^(?:VITE_)?GROQ(?:_API)?_KEY/i },
  agnes: { envRe: /^(?:VITE_)?AGNES(?:_API)?_KEY/i },
};

function collectServerKeys(provider) {
  const cfg = PROVIDER_CONFIG[provider];
  if (!cfg) return [];
  const keys = [];
  for (const [envName, rawVal] of Object.entries(process.env || {})) {
    if (!rawVal || !cfg.envRe.test(envName)) continue;
    String(rawVal)
      .split(/[\s,;|]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((k) => {
        if (!keys.includes(k)) keys.push(k);
      });
  }
  return keys;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ ok: false, error: 'Invalid JSON body' });
      return;
    }
  }

  const provider = String(body?.provider || 'gemini').toLowerCase().trim();
  if (!Object.prototype.hasOwnProperty.call(PROVIDER_CONFIG, provider)) {
    res.status(400).json({ ok: false, error: 'Provider không được hỗ trợ' });
    return;
  }

  const model = String(body?.model || 'gemini-2.5-flash').trim();
  if (!/^[a-zA-Z0-9._:/-]+$/.test(model)) {
    res.status(400).json({ ok: false, error: 'Tên model không hợp lệ' });
    return;
  }

  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  const keys = collectServerKeys(provider);
  if (keys.length === 0) {
    res.status(503).json({
      ok: false,
      error: `Chưa cấu hình khóa API phía máy chủ cho provider: ${provider}`,
    });
    return;
  }

  let lastStatus = 500;
  let lastErrorText = '';

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      let targetUrl = '';
      const headers = { 'Content-Type': 'application/json' };

      if (provider === 'gemini') {
        targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      } else if (provider === 'groq') {
        targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
        headers.Authorization = `Bearer ${apiKey}`;
      } else {
        targetUrl = 'https://apihub.agnes-ai.com/v1/chat/completions';
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const upstream = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
      });

      lastStatus = upstream.status;
      const text = await upstream.text();

      if (upstream.ok) {
        try {
          res.status(200).json(JSON.parse(text));
        } catch {
          res.status(200).json({ ok: true, raw: text });
        }
        return;
      }

      lastErrorText = text;
      // Nếu gặp 429 hoặc 401/403 thì xoay sang key tiếp theo
      if (upstream.status === 429 || upstream.status === 401 || upstream.status === 403) {
        continue;
      }
      break;
    } catch (err) {
      lastErrorText = err?.message || 'Upstream request failed';
    }
  }

  res.status(lastStatus || 502).json({
    ok: false,
    error: lastErrorText || 'Không thể kết nối tới máy chủ AI',
  });
}
