// Gọi 1 lần ở main.jsx (sau khi import examAiUtils) để bỏ VITE_GEMINI_API_KEY khỏi bundle:
//   import './lib/useGeminiProxy.js';
import { setModelCaller } from './examAiUtils.js';
import { auth } from './firebase.js'; // đổi theo export auth thực tế của app

setModelCaller(async ({ system, parts, temperature, signal }) => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Bạn cần đăng nhập để dùng AI.');
  const res = await fetch('/api/gemini', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system, parts, temperature }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi AI (${res.status})`);
  return data.text; // chuỗi JSON
});
