/* ============================================================
   USER ROLE — Lưu và đọc vai trò người dùng
   role: 'student' | 'teacher'
   ============================================================ */

const LS_KEY = 'cs-user-meta';

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