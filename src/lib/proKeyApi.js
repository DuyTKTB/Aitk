/* ============================================================
   proKeyApi.js — CRUD Key PRO + User PRO (Supabase)
   ------------------------------------------------------------
   Bảng:
     pro_keys   (id, code, duration_days, note, created_at,
                 created_by, used_by, used_at, revoked, revoked_at, revoked_reason)
     pro_users  (user_id, key_code, expiry, duration_days, activated_at, note)
   ============================================================ */
import { supabase } from './supabase.js';

/* ============ HELPERS ============ */
export function generateProKey(prefix = 'PRO') {
  const p1 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${p1}-${p2}`;
}

const toMs = (v) => {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const isProActive = (expiry) => toMs(expiry) > Date.now();

export const daysLeft = (expiry) => {
  const ms = toMs(expiry) - Date.now();
  return ms <= 0 ? 0 : Math.ceil(ms / 86400000);
};

/* ============================================================
   ADMIN: TẠO KEY (Hỗ trợ Teacher PRO, Student VIP, Credit AI)
   ============================================================ */
export async function adminCreateProKey({ durationDays = 30, note = '', createdBy = null, prefix = 'PRO', code: customCode = null } = {}) {
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = customCode ? String(customCode).trim().toUpperCase() : generateProKey(prefix);
    const { data, error } = await supabase
      .from('pro_keys')
      .insert({
        code,
        duration_days: days,
        note: note?.trim() || null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (!error) return data;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Không sinh được key duy nhất sau 5 lần thử.');
}

export async function adminCreateProKeyBatch({ count = 5, durationDays = 30, note = '', createdBy = null, prefix = 'PRO' } = {}) {
  const n = Math.max(1, Math.min(100, Number(count) || 5));
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));
  const rows = [];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    let code;
    let guard = 0;
    do {
      code = generateProKey(prefix);
      guard++;
    } while (seen.has(code) && guard < 20);
    seen.add(code);
    rows.push({
      code,
      duration_days: days,
      note: note?.trim() || null,
      created_by: createdBy,
    });
  }
  const { data, error } = await supabase.from('pro_keys').insert(rows).select();
  if (error) throw error;
  return data || [];
}

/* ============================================================
   ADMIN: ĐỌC KEY
   ============================================================ */
export async function adminGetKeys({ status = 'all', search = '', limit = 500 } = {}) {
  let q = supabase
    .from('pro_keys')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (search?.trim()) {
    q = q.ilike('code', `%${search.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;

  const now = Date.now();
  let list = data || [];

  // lọc theo trạng thái (client-side để đơn giản)
  if (status === 'unused') {
    list = list.filter((k) => !k.used_by && !k.revoked);
  } else if (status === 'active') {
    list = list.filter((k) => k.used_by && !k.revoked);
  } else if (status === 'revoked') {
    list = list.filter((k) => k.revoked);
  }

  return list;
}

export async function adminDeleteKey(keyId) {
  const { error } = await supabase.from('pro_keys').delete().eq('id', keyId);
  if (error) throw error;
}

export async function adminDeleteKeysBatch(keyIds = []) {
  if (!keyIds.length) return;
  const { error } = await supabase.from('pro_keys').delete().in('id', keyIds);
  if (error) throw error;
}

export async function adminRevokeKey(keyId, reason = '') {
  const { data, error } = await supabase
    .from('pro_keys')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason?.trim() || null,
    })
    .eq('id', keyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminRevokeKeysBatch(keyIds = [], reason = 'Thu hồi hàng loạt bởi admin') {
  if (!keyIds.length) return;
  const { error } = await supabase
    .from('pro_keys')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason?.trim() || null,
    })
    .in('id', keyIds);
  if (error) throw error;
}

/* Cấp quyền PRO trực tiếp cho 1 user_id (không cần qua bước nhập key) */
export async function adminGrantProDirect({ userId, durationDays = 30, note = 'Cấp trực tiếp bởi Admin' } = {}) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));

  const { data: existing } = await supabase
    .from('pro_users')
    .select('expiry, duration_days, key_code')
    .eq('user_id', uid)
    .maybeSingle();

  const base = existing ? Math.max(Date.now(), toMs(existing.expiry)) : Date.now();
  const newExpiry = new Date(base + days * 86400000).toISOString();
  const newDuration = (Number(existing?.duration_days) || 0) + days;
  const code = existing?.key_code || `DIRECT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from('pro_users')
    .upsert({
      user_id: uid,
      key_code: code,
      expiry: newExpiry,
      duration_days: newDuration,
      activated_at: existing ? undefined : new Date().toISOString(),
      note: note?.trim() || null,
    }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ============================================================
   ADMIN: ĐỌC USER PRO (danh sách giáo viên PRO)
   ============================================================ */
export async function adminGetProUsers({ search = '', limit = 500 } = {}) {
  const { data, error } = await supabase
    .from('pro_users')
    .select('*')
    .order('expiry', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function adminExtendProUser(userId, extraDays = 30) {
  const days = Math.max(1, Math.min(3650, Number(extraDays) || 30));
  const { data: cur, error: e0 } = await supabase
    .from('pro_users')
    .select('expiry, duration_days')
    .eq('user_id', userId)
    .single();
  if (e0) throw e0;

  const base = Math.max(Date.now(), toMs(cur.expiry));
  const newExpiry = new Date(base + days * 86400000).toISOString();

  const { data, error } = await supabase
    .from('pro_users')
    .update({
      expiry: newExpiry,
      duration_days: (Number(cur.duration_days) || 0) + days,
    })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminRevokeProUser(userId) {
  const { error } = await supabase.from('pro_users').delete().eq('user_id', userId);
  if (error) throw error;
}

/* ============================================================
   USER: KÍCH HOẠT KEY
   ============================================================ */
export async function activateProKey(userId, keyCode) {
  if (!userId) return { ok: false, error: 'Chưa đăng nhập.' };
  const code = String(keyCode || '').trim().toUpperCase();
  if (!code) return { ok: false, error: 'Vui lòng nhập key.' };

  const { data: key, error: e1 } = await supabase
    .from('pro_keys')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (e1) return { ok: false, error: e1.message };
  if (!key) return { ok: false, error: 'Key không tồn tại.' };
  if (key.revoked) return { ok: false, error: 'Key đã bị thu hồi.' };
  if (key.used_by && key.used_by !== userId) {
    return { ok: false, error: 'Key đã được sử dụng bởi tài khoản khác.' };
  }

  // 1. Nếu là Thẻ nạp điểm Credit AI
  const creditMatch = (key.note || '').match(/\[CREDIT:(\d+)\]/i);
  if (creditMatch) {
    const amount = Number(creditMatch[1]) || 500;
    try {
      const { grantActivationCredits } = await import('./creditService.js');
      await grantActivationCredits(userId, amount, key.code);
    } catch (crErr) {
      console.warn('[proKeyApi] grantActivationCredits err:', crErr);
    }
    await supabase.from('pro_keys').update({ used_by: userId, used_at: new Date().toISOString() }).eq('id', key.id);
    return {
      ok: true,
      type: 'credit',
      amount,
      message: `Kích hoạt thành công thẻ nạp! Bạn được cộng +${amount} điểm AI.`,
    };
  }

  // 2. Nếu là Key VIP Học sinh
  const isVip = (key.note || '').includes('[STUDENT_VIP') || key.code.startsWith('VIP-');
  if (isVip) {
    try {
      localStorage.setItem('cs-vip-status', JSON.stringify({
        isPro: true,
        plan: 'VIP',
        expiry: new Date(Date.now() + key.duration_days * 864e5).toISOString(),
        daysLeft: key.duration_days,
      }));
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
    } catch { /* ignore */ }
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + key.duration_days * 86400000);

  // upsert pro_users (cộng dồn nếu đã có)
  const { data: existing } = await supabase
    .from('pro_users')
    .select('expiry, duration_days')
    .eq('user_id', userId)
    .maybeSingle();

  let newExpiry = expiry;
  let newDuration = key.duration_days;
  if (existing) {
    const cur = Math.max(Date.now(), toMs(existing.expiry));
    newExpiry = new Date(cur + key.duration_days * 86400000);
    newDuration = (Number(existing.duration_days) || 0) + key.duration_days;
  }

  const { error: e2 } = await supabase
    .from('pro_users')
    .upsert({
      user_id: userId,
      key_code: key.code,
      expiry: newExpiry.toISOString(),
      duration_days: newDuration,
      note: key.note || null,
    }, { onConflict: 'user_id' });
  if (e2) return { ok: false, error: e2.message };

  // đánh dấu key đã dùng
  await supabase
    .from('pro_keys')
    .update({
      used_by: userId,
      used_at: new Date().toISOString(),
    })
    .eq('id', key.id);

  return {
    ok: true,
    pro: { key: key.code, expiry: newExpiry.toISOString() },
    expiry: newExpiry.toISOString(),
  };
}

/* ============================================================
   USER: LẤY TRẠNG THÁI PRO
   ============================================================ */
export async function getProStatus(userId) {
  if (!userId) return { isPro: false };
  try {
    const { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const expiryMs = toMs(data.expiry);
      const isPro = expiryMs > Date.now();
      const left = isPro ? Math.ceil((expiryMs - Date.now()) / 86400000) : 0;

      if (isPro) {
        return {
          isPro: true,
          pro: { key: data.key_code, expiry: data.expiry },
          expiry: data.expiry,
          daysLeft: left,
          expired: false,
          durationDays: data.duration_days,
          activatedAt: data.activated_at,
          source: 'supabase',
        };
      }
    }
  } catch (e) {
    console.warn('[proKeyApi] Supabase getProStatus error, kiểm tra nguồn dự phòng:', e.message);
  }

  // 2. Nguồn dự phòng: Gói kích hoạt mã phòng thi ảo (cs-user-subscription)
  try {
    const rawSub = JSON.parse(localStorage.getItem(`cs-user-subscription:${userId}`) || 'null');
    if (rawSub && (rawSub.planName === 'PRO' || rawSub.planName === 'VIP')) {
      return {
        isPro: true,
        pro: { key: 'ELEC-PRO', expiry: new Date(Date.now() + 365 * 864e5).toISOString() },
        expiry: new Date(Date.now() + 365 * 864e5).toISOString(),
        daysLeft: 365,
        expired: false,
        durationDays: 365,
        activatedAt: new Date().toISOString(),
        source: 'subscription',
      };
    }
  } catch { /* ignore */ }

  // 3. Nguồn dự phòng: cs-vip-status
  try {
    const rawVip = JSON.parse(localStorage.getItem('cs-vip-status') || 'null');
    if (rawVip && (rawVip.isPro || rawVip.vip)) {
      return {
        isPro: true,
        pro: { key: rawVip.key || 'VIP-LOCAL', expiry: rawVip.expiry || new Date(Date.now() + 365 * 864e5).toISOString() },
        expiry: rawVip.expiry || new Date(Date.now() + 365 * 864e5).toISOString(),
        daysLeft: rawVip.daysLeft || 365,
        expired: false,
        durationDays: 365,
        activatedAt: new Date().toISOString(),
        source: 'vip_status',
      };
    }
  } catch { /* ignore */ }

  return { isPro: false };
}