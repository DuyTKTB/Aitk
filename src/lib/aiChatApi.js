import { supabase } from './supabase.js';

const TABLE = 'ai_chats';
const MAX_CHATS = 100;

/**
 * Kiểm tra xem client có session Supabase hợp lệ hay không trước khi gọi API
 * để tránh các lỗi mạng HTTP 401 Unauthorized khi người dùng đăng nhập bằng Firebase Auth.
 */
let hasCheckedAuth = false;
let isSupabaseAuthed = false;

async function canSyncToSupabase() {
  if (hasCheckedAuth) return isSupabaseAuthed;
  try {
    const { data } = await supabase.auth.getSession();
    isSupabaseAuthed = Boolean(data?.session);
  } catch {
    isSupabaseAuthed = false;
  }
  hasCheckedAuth = true;
  return isSupabaseAuthed;
}

/**
 * Chuyển chuỗi UID bất kỳ (ví dụ Firebase UID "X6EIQPJ...") thành UUID hợp lệ theo chuẩn RFC 4122
 * để PostgreSQL không bị lỗi "invalid input syntax for type uuid".
 */
export function toValidUUID(str) {
  if (!str) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x265e5a1b);
    h2 = Math.imul(h2 ^ ch, 0x9e3779b9);
    h3 = Math.imul(h3 ^ ch, 0x85ebca6b);
    h4 = Math.imul(h4 ^ ch, 0xc2b2ae35);
  }
  const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const hex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Lấy danh sách chat của user (mới nhất trước)
 */
export async function fetchChats(userId) {
  if (!userId) return [];
  if (!(await canSyncToSupabase())) return [];

  const validUid = toValidUUID(userId);
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, title, messages, pinned, created_at, updated_at')
      .eq('user_id', validUid)
      .order('updated_at', { ascending: false })
      .limit(MAX_CHATS);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Tạo chat mới
 */
export async function createChat(userId, chat) {
  if (!userId || !chat?.id) return null;
  if (!(await canSyncToSupabase())) return null;

  const validUid = toValidUUID(userId);
  const validChatId = toValidUUID(chat.id) || chat.id;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id: validChatId,
        user_id: validUid,
        title: chat.title || 'Trò chuyện mới',
        messages: chat.messages || [],
        pinned: Boolean(chat.pinned),
      })
      .select()
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Cập nhật chat (title, messages, pinned)
 */
export async function updateChat(chatId, updates) {
  if (!chatId) return null;
  if (!(await canSyncToSupabase())) return null;

  const validChatId = toValidUUID(chatId) || chatId;
  const patch = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.messages !== undefined) patch.messages = updates.messages;
  if (updates.pinned !== undefined) patch.pinned = Boolean(updates.pinned);

  if (Object.keys(patch).length === 0) return null;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq('id', validChatId)
      .select()
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Xóa 1 chat
 */
export async function deleteChat(chatId) {
  if (!chatId) return;
  if (!(await canSyncToSupabase())) return;

  const validChatId = toValidUUID(chatId) || chatId;
  try {
    await supabase.from(TABLE).delete().eq('id', validChatId);
  } catch { /* ignore */ }
}

/**
 * Xóa tất cả chat của user
 */
export async function deleteAllChats(userId) {
  if (!userId) return;
  if (!(await canSyncToSupabase())) return;

  const validUid = toValidUUID(userId);
  try {
    await supabase.from(TABLE).delete().eq('user_id', validUid);
  } catch { /* ignore */ }
}

/**
 * Gộp chat cũ (local) lên server — dùng khi migrate lần đầu
 */
export async function migrateLocalChats(userId, localChats) {
  if (!userId || !Array.isArray(localChats) || localChats.length === 0) {
    return { migrated: 0 };
  }
  if (!(await canSyncToSupabase())) return { migrated: 0 };

  const validUid = toValidUUID(userId);
  const recent = [...localChats]
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 50);

  const rows = recent.map((c) => ({
    id: toValidUUID(c.id) || c.id,
    user_id: validUid,
    title: c.title || 'Trò chuyện mới',
    messages: stripImagesForSync(c.messages || []),
    pinned: false,
  }));

  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

    if (error) return { migrated: 0 };
    return { migrated: rows.length };
  } catch {
    return { migrated: 0 };
  }
}

/**
 * Strip ảnh inline khỏi messages trước khi sync lên server
 */
function stripImagesForSync(messages) {
  return messages.map((m) => {
    if (!m.parts) return m;
    const strippedParts = m.parts.map((p) => {
      if (p.inlineData) {
        return { text: '[ảnh đã gửi]' };
      }
      return p;
    });
    return { ...m, parts: strippedParts };
  });
}

/**
 * Sync debounced — gọi khi có thay đổi
 */
let syncTimers = new Map();

export function debouncedSync(chatId, updates, delay = 1500) {
  const existing = syncTimers.get(chatId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    syncTimers.delete(chatId);
    try {
      await updateChat(chatId, updates);
    } catch { /* ignore */ }
  }, delay);

  syncTimers.set(chatId, timer);
}

/**
 * Cancel tất cả debounced timers (dùng khi unmount)
 */
export function cancelAllSyncs() {
  for (const timer of syncTimers.values()) clearTimeout(timer);
  syncTimers.clear();
}