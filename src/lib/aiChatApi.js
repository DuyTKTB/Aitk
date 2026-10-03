
import { supabase } from './supabase.js';

const TABLE = 'ai_chats';
const MAX_CHATS = 100;

/**
 * Lấy danh sách chat của user (mới nhất trước)
 */
export async function fetchChats(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, title, messages, pinned, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(MAX_CHATS);

  if (error) {
    console.warn('[aiChatApi] fetchChats error:', error.message);
    throw error;
  }
  return data || [];
}

/**
 * Tạo chat mới
 * @param {string} userId
 * @param {{ id, title, messages, pinned }} chat
 */
export async function createChat(userId, chat) {
  if (!userId || !chat?.id) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: chat.id,
      user_id: userId,
      title: chat.title || 'Trò chuyện mới',
      messages: chat.messages || [],
      pinned: Boolean(chat.pinned),
    })
    .select()
    .single();

  if (error) {
    console.warn('[aiChatApi] createChat error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Cập nhật chat (title, messages, pinned)
 */
export async function updateChat(chatId, updates) {
  if (!chatId) return null;

  const patch = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.messages !== undefined) patch.messages = updates.messages;
  if (updates.pinned !== undefined) patch.pinned = Boolean(updates.pinned);

  if (Object.keys(patch).length === 0) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', chatId)
    .select()
    .single();

  if (error) {
    console.warn('[aiChatApi] updateChat error:', error.message);
    throw error;
  }
  return data;
}

/**
 * Xóa 1 chat
 */
export async function deleteChat(chatId) {
  if (!chatId) return;
  const { error } = await supabase.from(TABLE).delete().eq('id', chatId);
  if (error) {
    console.warn('[aiChatApi] deleteChat error:', error.message);
    throw error;
  }
}

/**
 * Xóa tất cả chat của user
 */
export async function deleteAllChats(userId) {
  if (!userId) return;
  const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
  if (error) {
    console.warn('[aiChatApi] deleteAllChats error:', error.message);
    throw error;
  }
}

/**
 * Gộp chat cũ (local) lên server — dùng khi migrate lần đầu
 * @returns {Promise<{ migrated: number }>}
 */
export async function migrateLocalChats(userId, localChats) {
  if (!userId || !Array.isArray(localChats) || localChats.length === 0) {
    return { migrated: 0 };
  }
  const recent = [...localChats]
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
    .slice(0, 50);

  const rows = recent.map((c) => ({
    id: c.id,
    user_id: userId,
    title: c.title || 'Trò chuyện mới',
    messages: stripImagesForSync(c.messages || []),
    pinned: false,
  }));

  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.warn('[aiChatApi] migrateLocalChats error:', error.message);
    throw error;
  }
  return { migrated: rows.length };
}

/**
 * Strip ảnh inline khỏi messages trước khi sync lên server
 * (ảnh base64 rất nặng, không nên lưu cloud)
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
    } catch (e) {
      console.warn('[aiChatApi] debouncedSync fail:', e.message);
    }
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