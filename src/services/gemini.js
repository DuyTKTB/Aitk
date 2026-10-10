// api/gemini.js — proxy Gemini (Vercel/Netlify-style serverless). KEY chỉ nằm ở server.
// Env: GEMINI_API_KEY, GEMINI_MODEL (vd gemini-2.5-flash), FIREBASE_SERVICE_ACCOUNT (JSON string)
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
}

export const config = { api: { bodyParser: { sizeLimit: '25mb' } } }; // PDF/ảnh base64

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    // 1) Chỉ người đã đăng nhập mới gọi được
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const decoded = await admin.auth().verifyIdToken(token);

    // 2) (khuyên) chỉ giáo viên: kiểm tra role/PRO ở đây, ví dụ đọc users/{uid}
    // const snap = await admin.firestore().doc(`users/${decoded.uid}`).get();
    // if (!['teacher', 'admin'].includes(snap.data()?.role)) return res.status(403).end();

    const { system, parts, temperature = 0.7 } = req.body || {};
    if (!Array.isArray(parts) || !system) return res.status(400).json({ error: 'Thiếu dữ liệu' });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature, responseMimeType: 'application/json', maxOutputTokens: 16000 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Lỗi AI' });
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    return res.status(200).json({ text, uid: decoded.uid });
  } catch (e) {
    return res.status(401).json({ error: e.message });
  }
}
