/**
 * api/ai-chat.js — Vercel Serverless Proxy bảo mật khóa API AI cho ELEC Science AI
 * --------------------------------------------------------------------------------
 * Hỗ trợ ẩn hoàn toàn các khóa GEMINI_API_KEY / GROQ_API_KEY / AGNES_API_KEY ở phía Server,
 * tự động xoay vòng key (Key Rotation) khi gặp giới hạn 429 Too Many Requests.
 */

function collectServerKeys(provider) {
  const keys = [];
  const p = String(provider || '').toLowerCase();
  for (const [envName, rawVal] of Object.entries(process.env || {})) {
    if (!rawVal || !envName.toLowerCase().includes(p)) continue;
    if (!/key|token/i.test(envName)) continue;
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

  const provider = String(body?.provider || 'gemini').toLowerCase();
  const model = String(body?.model || 'gemini-2.5-flash');
  const payload = body?.payload || {};

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
