/* ============================================================
   USER ROLE — Lưu và đọc vai trò người dùng
   role: 'student' | 'teacher'
   ============================================================ */

const LS_KEY = 'cs-user-meta';
const POST_AUTH_REDIRECT_KEY = 'elec-post-auth-redirect';
const POST_AUTH_REDIRECT_TTL_MS = 30 * 60 * 1000;
let memoryPostAuthRedirect = null;

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeAll = (obj) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
};

export function getUserRole(user) {
  if (!user?.uid) return 'student';
  const all = readAll();
  return all[user.uid]?.role || 'student';
}

export function setUserRole(userId, role) {
  if (!userId) return;
  const all = readAll();
  all[userId] = { ...(all[userId] || {}), role };
  writeAll(all);
}

export function getUserMeta(userId) {
  if (!userId) return null;
  const all = readAll();
  return all[userId] || null;
}

export function setPostAuthRedirect(target) {
  const clean = String(target || '').replace(/^#\/?/, '').trim();
  if (!clean) {
    clearPostAuthRedirect();
    return;
  }
  const payload = { target: clean, at: Date.now() };
  memoryPostAuthRedirect = payload;
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, serialized);
  } catch { /* ignore */ }
  try {
    localStorage.setItem(POST_AUTH_REDIRECT_KEY, serialized);
  } catch { /* ignore */ }
}

export function peekPostAuthRedirect(now = Date.now()) {
  let payload = memoryPostAuthRedirect;
  try {
    const raw = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY) || localStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (raw) payload = JSON.parse(raw);
  } catch { /* ignore */ }

  if (!payload || typeof payload !== 'object' || !payload.target) return '';
  if (Number(payload.at) && now - Number(payload.at) > POST_AUTH_REDIRECT_TTL_MS) {
    clearPostAuthRedirect();
    return '';
  }
  return String(payload.target);
}

export function consumePostAuthRedirect(now = Date.now()) {
  const target = peekPostAuthRedirect(now);
  clearPostAuthRedirect();
  return target;
}

export function clearPostAuthRedirect() {
  memoryPostAuthRedirect = null;
  try {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch { /* ignore */ }
  try {
    localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch { /* ignore */ }
}