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

export function isStudentVipRecord(row) {
  if (!row) return false;
  const note = String(row.note || '');
  const code = String(row.key_code || row.code || '');
  return (
    (note.includes('[STUDENT_VIP') && !note.includes('Giáo viên'))
    || code.startsWith('VIP-')
  );
}

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
  let uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));

  // Nếu Admin nhập email thay vì UID -> tự động tra cứu UID thật trong bảng profiles
  if (uid.includes('@')) {
    const { data: profByEmail, error: emailErr } = await supabase
      .from('profiles')
      .select('id, email, display_name, role')
      .ilike('email', uid)
      .limit(1)
      .maybeSingle();
    if (emailErr) throw emailErr;
    if (!profByEmail?.id) {
      throw new Error(`Không tìm thấy tài khoản nào với email "${uid}". Hãy đảm bảo giáo viên đã đăng nhập ít nhất 1 lần hoặc chọn đúng từ danh sách gợi ý.`);
    }
    uid = profByEmail.id;
  }

  const { data: existing } = await supabase
    .from('pro_users')
    .select('expiry, duration_days, key_code, activated_at')
    .eq('user_id', uid)
    .maybeSingle();

  const base = existing ? Math.max(Date.now(), toMs(existing.expiry)) : Date.now();
  const newExpiry = new Date(base + days * 86400000).toISOString();
  const newDuration = (Number(existing?.duration_days) || 0) + days;
  const existingCode = String(existing?.key_code || '');
  const code = existingCode && !existingCode.startsWith('VIP-')
    ? existingCode
    : `DIRECT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const cleanNote = (note?.trim() || 'Cấp trực tiếp bởi Admin').replace(/\[STUDENT_VIP[^\]]*\]\s*/gi, '').trim();

  const { data, error } = await supabase
    .from('pro_users')
    .upsert({
      user_id: uid,
      key_code: code,
      expiry: newExpiry,
      duration_days: newDuration,
      activated_at: existing?.activated_at || new Date().toISOString(),
      note: cleanNote || 'Cấp trực tiếp bởi Admin',
    }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;

  // Đồng bộ vai trò giáo viên trên bảng profiles (Supabase) — giữ nguyên nếu là admin
  try {
    await supabase
      .from('profiles')
      .update({ role: 'teacher' })
      .eq('id', uid)
      .neq('role', 'admin');
  } catch (profErr) {
    console.warn('[proKeyApi] Update profiles role to teacher err:', profErr);
  }

  // Đồng bộ sang Firestore: role = 'teacher', tier = 'pro'
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', uid), {
      role: 'teacher',
      tier: 'pro',
      plan: 'PRO',
      pro: true,
      proUntil: newExpiry,
      vipUntil: newExpiry,
      upgradedAt: new Date().toISOString(),
      source: 'admin_direct_pro',
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore PRO direct sync err:', fsErr);
  }

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
    .select('expiry, duration_days, key_code, note')
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

  // Đồng bộ gia hạn sang Firestore để web chính & thiết bị khác cập nhật ngay
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    const isStudentVip = isStudentVipRecord(data || cur);
    await setDoc(doc(db, 'users', userId), {
      tier: isStudentVip ? 'vip' : 'pro',
      plan: isStudentVip ? 'VIP' : 'PRO',
      ...(isStudentVip
        ? { vip: true, vipUntil: newExpiry }
        : { pro: true, proUntil: newExpiry, vipUntil: newExpiry }),
      updatedAt: new Date().toISOString(),
      source: 'admin_extend',
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore extend PRO sync err:', fsErr);
  }

  return data;
}

export async function adminRevokeProUser(userId) {
  const { error } = await supabase.from('pro_users').delete().eq('user_id', userId);
  if (error) throw error;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', userId), {
      pro: false,
      proUntil: null,
      tier: 'free',
      plan: 'free',
      vip: false,
      vipUntil: null,
      source: 'admin_revoked',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore revoke PRO sync err:', fsErr);
  }
  try {
    const subKey = `cs-user-subscription:${userId}`;
    const cur = JSON.parse(localStorage.getItem(subKey) || '{}');
    const next = {
      ...cur,
      planName: 'FREE',
      planDesc: 'Tài khoản Miễn phí',
      hearts: 5,
      maxHearts: 5,
      expiry: null,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(subKey, JSON.stringify(next));
    const { auth } = await import('./firebase.js');
    if (auth?.currentUser?.uid === userId) {
      localStorage.removeItem('cs-vip-status');
      localStorage.removeItem('cs-vip');
      localStorage.removeItem('cs-user-tier');
      window.dispatchEvent(new CustomEvent('elec-quota-changed', { detail: next }));
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
    }
  } catch {}
}

export const adminRevokeProDirect = adminRevokeProUser;

/* ============================================================
   ADMIN: CẤP & HỦY QUYỀN VIP TRỰC TIẾP (HỌC SINH VIP 199K)
   ============================================================ */
export async function adminGrantVipDirect({ userId, durationDays = 30, note = 'Cấp VIP trực tiếp bởi Admin' } = {}) {
  let uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));

  if (uid.includes('@')) {
    const { data: profByEmail, error: emailErr } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', uid)
      .limit(1)
      .maybeSingle();
    if (emailErr) throw emailErr;
    if (!profByEmail?.id) {
      throw new Error(`Không tìm thấy tài khoản với email "${uid}".`);
    }
    uid = profByEmail.id;
  }

  const { data: existing } = await supabase
    .from('pro_users')
    .select('expiry, duration_days, key_code, note')
    .eq('user_id', uid)
    .maybeSingle();

  const base = existing ? Math.max(Date.now(), toMs(existing.expiry)) : Date.now();
  const newExpiry = new Date(base + days * 86400000).toISOString();
  const newDuration = (Number(existing?.duration_days) || 0) + days;
  const code = existing?.key_code?.startsWith('VIP-')
    ? existing.key_code
    : `VIP-DIRECT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data, error } = await supabase
    .from('pro_users')
    .upsert({
      user_id: uid,
      key_code: code,
      expiry: newExpiry,
      duration_days: newDuration,
      activated_at: existing?.activated_at || new Date().toISOString(),
      note: `[STUDENT_VIP:${days}] ${note?.trim() || 'Cấp VIP Học sinh bởi Admin'}`.trim(),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;

  // Đồng bộ Firestore: tier = 'vip'
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', uid), {
      tier: 'vip',
      plan: 'VIP',
      vip: true,
      pro: false,
      proUntil: null,
      vipUntil: newExpiry,
      upgradedAt: new Date().toISOString(),
      source: 'admin_direct_vip',
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore VIP direct err:', fsErr);
  }

  // Đồng bộ local subscription nếu có
  try {
    const subKey = `cs-user-subscription:${uid}`;
    const cur = JSON.parse(localStorage.getItem(subKey) || '{}');
    const next = {
      ...cur,
      planName: 'VIP',
      planDesc: 'Gói VIP Học sinh đặc quyền',
      durationLabel: `${days} ngày`,
      hearts: 99,
      maxHearts: 99,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(subKey, JSON.stringify(next));
    const { auth } = await import('./firebase.js');
    if (auth?.currentUser?.uid === uid) {
      localStorage.setItem('cs-vip-status', JSON.stringify({ uid, isPro: true, tier: 'vip', plan: 'VIP', expiry: newExpiry, daysLeft: days, source: 'supabase' }));
      window.dispatchEvent(new CustomEvent('elec-quota-changed', { detail: next }));
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
    }
  } catch {}

  return data;
}

export async function adminRevokeVipDirect(userId) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');

  const { error } = await supabase.from('pro_users').delete().eq('user_id', uid);
  if (error) throw error;

  // Đồng bộ Firestore: tier = 'free'
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', uid), {
      tier: 'free',
      plan: 'free',
      vip: false,
      vipUntil: null,
      source: 'admin_revoked_vip',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore VIP revoke err:', fsErr);
  }

  // Reset local subscription
  try {
    const subKey = `cs-user-subscription:${uid}`;
    const cur = JSON.parse(localStorage.getItem(subKey) || '{}');
    const next = {
      ...cur,
      planName: 'FREE',
      planDesc: 'Tài khoản Luyện tập Miễn phí',
      hearts: 5,
      maxHearts: 5,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(subKey, JSON.stringify(next));
    const { auth } = await import('./firebase.js');
    if (auth?.currentUser?.uid === uid) {
      localStorage.removeItem('cs-vip-status');
      localStorage.removeItem('cs-vip');
      localStorage.removeItem('cs-user-tier');
      window.dispatchEvent(new CustomEvent('elec-quota-changed', { detail: next }));
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
    }
  } catch {}
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

  // Nếu không có trong pro_keys, kiểm tra xem có phải mã DIRECT-XXXX đã cấp trực tiếp trong pro_users không
  if (!key) {
    const { data: directRow } = await supabase
      .from('pro_users')
      .select('*')
      .eq('key_code', code)
      .maybeSingle();

    if (directRow) {
      if (directRow.user_id !== userId && !String(directRow.user_id || '').includes('@')) {
        return { ok: false, error: 'Key này đã được cấp cho tài khoản khác.' };
      }
      if (directRow.user_id !== userId) {
        await supabase
          .from('pro_users')
          .upsert({ ...directRow, user_id: userId }, { onConflict: 'user_id' });
        await supabase.from('pro_users').delete().eq('user_id', directRow.user_id);
      }
      await getProStatus(userId);
      window.dispatchEvent(new CustomEvent('cs-vip-update'));
      window.dispatchEvent(new CustomEvent('cs-tier-update'));
      window.dispatchEvent(new CustomEvent('user-profile-change'));
      return {
        ok: true,
        pro: { key: directRow.key_code, expiry: directRow.expiry, plan: 'PRO' },
        expiry: directRow.expiry,
      };
    }

    return { ok: false, error: 'Key không tồn tại.' };
  }
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

  // 1.5. Nếu là Mã giảm giá / Voucher
  const { parseDiscountMeta, recordDiscountUsage } = await import('./discountService.js');
  const discMeta = parseDiscountMeta(key.note, key.code);
  if (discMeta.isDiscount) {
    if (discMeta.maxUses > 0 && discMeta.usedCount >= discMeta.maxUses) {
      return { ok: false, error: 'Mã giảm giá/voucher này đã hết lượt sử dụng.' };
    }
    if (discMeta.type === 'percent' || discMeta.type === 'amount') {
      return {
        ok: true,
        isDiscount: true,
        type: discMeta.type,
        value: discMeta.value,
        message: `Mã ưu đãi "${key.code}" hợp lệ (${discMeta.type === 'percent' ? `Giảm ${discMeta.value}%` : `Giảm ${discMeta.value.toLocaleString('vi-VN')}đ`})! Hãy dùng tại màn hình Thanh toán.`,
      };
    }
    // free_vip hoặc free_pro: tiếp tục kích hoạt bên dưới và tăng lượt dùng
    await recordDiscountUsage({ keyId: key.id, userId });
  }

  // 2. Nếu là Key VIP Học sinh
  const isVip = (key.note || '').includes('[STUDENT_VIP') || key.code.startsWith('VIP-') || discMeta.type === 'free_vip';

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

  // Đánh dấu key đã dùng (nếu là voucher dùng nhiều lần và còn lượt thì không khóa used_by)
  const shouldLockKey = !discMeta.isDiscount
    || discMeta.maxUses <= 1
    || (discMeta.usedCount + 1) >= discMeta.maxUses;
  if (shouldLockKey) {
    await supabase
      .from('pro_keys')
      .update({
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('id', key.id);
  }

  // Quyền lợi VIP / PRO: Tặng kèm Credit AI tương ứng thời hạn gói
  const creditMetaMatch = (key.note || '').match(/\[CREDIT:(\d+)\]/i);
  let bonusCredits = creditMetaMatch ? Number(creditMetaMatch[1]) : 0;
  if (!bonusCredits) {
    if (key.duration_days >= 300) bonusCredits = 3000;
    else if (key.duration_days >= 80) bonusCredits = 1000;
    else if (key.duration_days >= 25) bonusCredits = 300;
    else bonusCredits = Math.max(100, (key.duration_days || 1) * 10);
  }

  // Tự động tặng kèm Credit AI vào ví khi kích hoạt gói VIP / PRO
  try {
    const { grantActivationCredits } = await import('./creditService.js');
    await grantActivationCredits(userId, bonusCredits, key.code);
  } catch (crErr) {
    console.warn('[proKeyApi] grantActivationCredits for VIP err:', crErr);
  }

  // Nếu là Key Giáo viên PRO (!isVip) -> cập nhật role = 'teacher' trên Supabase profiles
  if (!isVip) {
    try {
      await supabase
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', userId)
        .neq('role', 'admin');
    } catch (profErr) {
      console.warn('[proKeyApi] Update profiles role err:', profErr);
    }
  }

  // Đồng bộ local state ngay lập tức
  try {
    const leftDays = Math.max(1, Math.ceil((newExpiry.getTime() - Date.now()) / 86400000));
    if (!isVip) {
      const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
      meta[userId] = { ...(meta[userId] || {}), role: 'teacher' };
      localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    }
    localStorage.setItem('cs-vip-status', JSON.stringify({
      uid: userId,
      isPro: true,
      isVip: true,
      tier: isVip ? 'vip' : 'pro',
      plan: isVip ? 'VIP' : 'PRO',
      planName: isVip ? 'Gói VIP Học Sinh' : 'Gói PRO Giáo Viên',
      key: key.code,
      expiry: newExpiry.toISOString(),
      expiresAt: newExpiry.toISOString(),
      daysLeft: leftDays,
      active: true,
      source: 'supabase',
    }));
    const subKey = `cs-user-subscription:${userId}`;
    const curSub = JSON.parse(localStorage.getItem(subKey) || '{}');
    localStorage.setItem(subKey, JSON.stringify({
      ...curSub,
      planName: isVip ? 'VIP' : 'PRO',
      planDesc: isVip
        ? 'Đặc quyền Bộ đề VIP + Tặng kèm Credit AI & Ưu đãi'
        : 'Quản lý không giới hạn lớp học & Đề thi AI',
      durationLabel: `${leftDays} ngày`,
      examAccessLabel: 'Toàn bộ đề FREE, PRO, VIP',
      hearts: 99,
      maxHearts: 99,
      expiry: newExpiry.toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    window.dispatchEvent(new CustomEvent('cs-vip-update'));
    window.dispatchEvent(new CustomEvent('cs-tier-update'));
    window.dispatchEvent(new CustomEvent('user-profile-change'));
  } catch { /* ignore */ }

  // Đồng bộ sang Firestore
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', userId), {
      ...(isVip ? {} : { role: 'teacher', pro: true, proUntil: newExpiry.toISOString() }),
      tier: isVip ? 'vip' : 'pro',
      plan: isVip ? 'VIP' : 'PRO',
      vip: isVip,
      vipUntil: newExpiry.toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore activate sync err:', fsErr);
  }

  return {
    ok: true,
    pro: { key: key.code, expiry: newExpiry.toISOString(), plan: isVip ? 'VIP' : 'PRO' },
    expiry: newExpiry.toISOString(),
    bonusCredits,
    message: `Kích hoạt thành công ${isVip ? 'Gói VIP Học Sinh' : 'Gói PRO Giáo Viên'}! Đã tặng kèm +${bonusCredits.toLocaleString('vi-VN')} Credit AI vào ví của bạn.`,
  };
}

/* ============================================================
   USER: LẤY TRẠNG THÁI PRO
   ============================================================ */
export async function getProStatus(userId, userEmail = null) {
  if (!userId) return { isPro: false };
  let serverChecked = false;
  try {
    let { data, error } = await supabase
      .from('pro_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    serverChecked = true;

    // Tự động sửa dữ liệu nếu trước đó Admin lỡ nhập email vào cột user_id
    if (!data && userEmail) {
      const cleanEmail = String(userEmail).trim();
      if (cleanEmail) {
        const { data: byEmail } = await supabase
          .from('pro_users')
          .select('*')
          .ilike('user_id', cleanEmail)
          .maybeSingle();
        if (byEmail) {
          const { data: migrated } = await supabase
            .from('pro_users')
            .upsert({
              ...byEmail,
              user_id: userId,
            }, { onConflict: 'user_id' })
            .select()
            .single();
          await supabase.from('pro_users').delete().ilike('user_id', cleanEmail);
          data = migrated || { ...byEmail, user_id: userId };
        }
      }
    }

    if (data && toMs(data.expiry) > Date.now()) {
      const expiryMs = toMs(data.expiry);
      const isPro = expiryMs > Date.now();
      const left = Math.ceil((expiryMs - Date.now()) / 86400000);
      const isStudentVip =
        ((data.note || '').includes('[STUDENT_VIP') && !String(data.note || '').includes('Giáo viên')) ||
        (String(data.key_code || '').startsWith('VIP-') && (data.note || '').includes('[STUDENT_VIP'));
      const isTeacherPro = !isStudentVip;

      // Đồng bộ ngay xuống localStorage theo đúng UID
      try {
        let roleChanged = false;
        if (isTeacherPro) {
          const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
          if (meta[userId]?.role !== 'teacher') {
            meta[userId] = { ...(meta[userId] || {}), role: 'teacher' };
            localStorage.setItem('cs-user-meta', JSON.stringify(meta));
            roleChanged = true;
          }
        }
        localStorage.setItem('cs-vip-status', JSON.stringify({
          uid: userId,
          isPro: true,
          isVip: true,
          tier: isStudentVip ? 'vip' : 'pro',
          plan: isStudentVip ? 'VIP' : 'PRO',
          planName: isStudentVip ? 'Gói VIP Học Sinh' : 'Gói PRO Giáo Viên',
          key: data.key_code,
          expiry: data.expiry,
          expiresAt: data.expiry,
          daysLeft: left,
          active: true,
          source: 'supabase',
        }));
        const subKey = `cs-user-subscription:${userId}`;
        const curSub = JSON.parse(localStorage.getItem(subKey) || '{}');
        const targetPlan = isStudentVip ? 'VIP' : 'PRO';
        if (curSub.planName !== targetPlan || curSub.expiry !== data.expiry) {
          localStorage.setItem(subKey, JSON.stringify({
            ...curSub,
            uid: userId,
            planName: targetPlan,
            planDesc: isStudentVip
              ? 'Đặc quyền Bộ đề VIP + Tặng kèm Credit AI & Ưu đãi'
              : 'Quản lý không giới hạn lớp học & Đề thi AI',
            durationLabel: `${left} ngày`,
            examAccessLabel: 'Toàn bộ đề FREE, PRO, VIP',
            hearts: 99,
            maxHearts: 99,
            expiry: data.expiry,
            updatedAt: new Date().toISOString(),
          }));
        }
        if (roleChanged) {
          window.dispatchEvent(new CustomEvent('user-profile-change'));
        }
      } catch { /* ignore */ }

      return {
        isPro: true,
        isTeacherPro,
        isStudentVip,
        plan: isStudentVip ? 'VIP' : 'PRO',
        pro: { key: data.key_code, expiry: data.expiry, note: data.note },
        expiry: data.expiry,
        daysLeft: left,
        expired: false,
        durationDays: data.duration_days,
        activatedAt: data.activated_at,
        source: 'supabase',
        serverChecked: true,
      };
    }

    // Supabase không có bản ghi hợp lệ (hoặc đã hết hạn/bị thu hồi):
    // Xóa triệt để cache sai UID / hết hạn / thuộc Supabase để acc Free không bao giờ kế thừa VIP
    try {
      const rawVip = JSON.parse(localStorage.getItem('cs-vip-status') || 'null');
      if (rawVip) {
        const expMs = rawVip.expiry ? toMs(rawVip.expiry) : 0;
        if (!rawVip.uid || rawVip.uid !== userId || rawVip.source === 'supabase' || !expMs || expMs <= Date.now()) {
          localStorage.removeItem('cs-vip-status');
        }
      }
      const subKey = `cs-user-subscription:${userId}`;
      const rawSub = JSON.parse(localStorage.getItem(subKey) || 'null');
      if (rawSub && (rawSub.planName === 'PRO' || rawSub.planName === 'VIP')) {
        const expMs = rawSub.expiry ? toMs(rawSub.expiry) : 0;
        if (!expMs || expMs <= Date.now()) {
          localStorage.removeItem(subKey);
          localStorage.removeItem(`elec_sub_quota_v1_${userId}`);
        }
      }
    } catch { /* ignore */ }
  } catch (e) {
    console.warn('[proKeyApi] Supabase getProStatus error, kiểm tra nguồn dự phòng khớp UID:', e.message);
  }

  // 2. Nguồn dự phòng: Gói kích hoạt mã phòng thi ảo (phải có expiry hợp lệ > Date.now())
  try {
    const subKey = `cs-user-subscription:${userId}`;
    const rawSub = JSON.parse(localStorage.getItem(subKey) || 'null');
    if (rawSub && (rawSub.planName === 'PRO' || rawSub.planName === 'VIP')) {
      const expMs = rawSub.expiry ? toMs(rawSub.expiry) : 0;
      if (expMs > Date.now()) {
        const left = Math.ceil((expMs - Date.now()) / 864e5);
        return {
          isPro: true,
          isTeacherPro: rawSub.planName === 'PRO',
          isStudentVip: rawSub.planName === 'VIP',
          plan: rawSub.planName,
          pro: { key: 'ELEC-PRO', expiry: rawSub.expiry },
          expiry: rawSub.expiry,
          daysLeft: left,
          expired: false,
          durationDays: 365,
          activatedAt: rawSub.updatedAt || new Date().toISOString(),
          source: 'subscription',
          serverChecked,
        };
      }
      localStorage.removeItem(subKey);
      localStorage.removeItem(`elec_sub_quota_v1_${userId}`);
    }
  } catch { /* ignore */ }

  // 3. Nguồn dự phòng: cs-vip-status — CHỈ chấp nhận nếu đúng UID & còn hạn thực sự
  try {
    const rawVip = JSON.parse(localStorage.getItem('cs-vip-status') || 'null');
    if (rawVip && (rawVip.isPro || rawVip.vip)) {
      const expMs = rawVip.expiry ? toMs(rawVip.expiry) : 0;
      if (!rawVip.uid || rawVip.uid !== userId || !expMs || expMs <= Date.now()) {
        if (!rawVip.uid || rawVip.uid === userId || !expMs || expMs <= Date.now()) {
          localStorage.removeItem('cs-vip-status');
        }
      } else {
        const left = Math.ceil((expMs - Date.now()) / 864e5);
        return {
          isPro: true,
          isTeacherPro: rawVip.plan === 'PRO' || rawVip.tier === 'pro',
          isStudentVip: rawVip.plan === 'VIP' || rawVip.tier === 'vip',
          plan: rawVip.plan || 'VIP',
          pro: { key: rawVip.key || 'VIP-LOCAL', expiry: rawVip.expiry },
          expiry: rawVip.expiry,
          daysLeft: left,
          expired: false,
          durationDays: 365,
          activatedAt: new Date().toISOString(),
          source: 'vip_status',
          serverChecked,
        };
      }
    }
  } catch { /* ignore */ }

  return { isPro: false, serverChecked };
}

/* ============================================================
   ADMIN: ĐỒNG BỘ 2 CHIỀU SUPABASE <-> FIRESTORE & RESET DÙNG THỬ
   ============================================================ */
export async function adminSyncUserRole(userId, role, userInfo = {}) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');
  const cleanRole = String(role || 'user').trim();

  // 1. Cập nhật / Upsert trên Supabase profiles
  const payload = { id: uid, role: cleanRole };
  if (userInfo.display_name) payload.display_name = userInfo.display_name;
  if (userInfo.email) payload.email = userInfo.email;
  const { error: sbErr } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });
  if (sbErr) throw sbErr;

  // 2. Đồng bộ vai trò sang Firestore /users/{uid} (web chính đọc trực tiếp tại đây)
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    const fsRole = cleanRole === 'user' ? 'student' : cleanRole;
    await setDoc(doc(db, 'users', uid), {
      role: fsRole,
      ...(userInfo.display_name ? { displayName: userInfo.display_name } : {}),
      ...(userInfo.email ? { email: userInfo.email } : {}),
      updatedAt: new Date().toISOString(),
      source: 'admin_role_sync',
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore role sync err:', fsErr);
  }

  // 3. Đồng bộ local meta
  try {
    const meta = JSON.parse(localStorage.getItem('cs-user-meta') || '{}');
    meta[uid] = { ...(meta[uid] || {}), role: cleanRole === 'user' ? 'student' : cleanRole };
    localStorage.setItem('cs-user-meta', JSON.stringify(meta));
    window.dispatchEvent(new CustomEvent('user-profile-change'));
  } catch { /* ignore */ }

  return { ok: true, id: uid, role: cleanRole };
}

export async function adminFetchMergedUsers({ limit = 500 } = {}) {
  const byId = new Map();

  // 1. Tải danh sách từ Supabase profiles
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && Array.isArray(data)) {
      data.forEach((p) => {
        if (p?.id) byId.set(p.id, { ...p, _source: 'supabase' });
      });
    }
  } catch (sbErr) {
    console.warn('[proKeyApi] Supabase profiles fetch err:', sbErr);
  }

  // 2. Hợp nhất thêm từ Firestore /users (nhiều user Google/Firebase chưa từng đồng bộ sang Supabase profiles)
  try {
    const { collection, getDocs, limit: fsLimit, query } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    const snap = await getDocs(query(collection(db, 'users'), fsLimit(limit)));
    snap.forEach((docSnap) => {
      const uid = docSnap.id;
      const d = docSnap.data() || {};
      const existing = byId.get(uid) || { id: uid };
      const fsRole = d.role === 'student' ? 'user' : (d.role || existing.role || 'user');
      const createdVal = existing.created_at
        || (typeof d.createdAt?.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt)
        || d.updatedAt
        || null;

      byId.set(uid, {
        ...existing,
        id: uid,
        display_name: existing.display_name || d.displayName || d.name || (d.email ? d.email.split('@')[0] : null),
        email: existing.email || d.email || null,
        avatar_url: existing.avatar_url || d.photoURL || d.avatarUrl || null,
        role: existing.role || fsRole,
        created_at: createdVal,
        _fromFirestore: true,
        _fsPlan: d.plan || d.tier || null,
        _trialResetAt: d.trialQuotaResetAt || null,
      });
    });
  } catch (fsErr) {
    // Firestore Security Rules có thể chặn liệt kê collection users nếu phiên chưa quyền
    console.warn('[proKeyApi] Firestore users merge skipped:', fsErr?.message || fsErr);
  }

  return [...byId.values()].sort((a, b) => toMs(b.created_at) - toMs(a.created_at));
}

export async function adminResetTeacherTrialQuota(userId) {
  const uid = String(userId || '').trim();
  if (!uid) throw new Error('Thiếu ID người dùng.');

  // 1. Xóa sạch bộ đếm dùng thử (Word 10, Thủ công 30, OMR 5) trong RAM & localStorage
  try {
    const {
      resetOmrTrialCounterForTest,
      resetWordImportTrialCounterForTest,
      resetManualEntryTrialCounterForTest,
    } = await import('./entitlements.js');
    resetOmrTrialCounterForTest(uid);
    resetWordImportTrialCounterForTest(uid);
    resetManualEntryTrialCounterForTest(uid);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`cs_teacher_trial_quota_v1:${uid}`);
      localStorage.removeItem('cs_teacher_trial_quota_v1');
    }
  } catch (localErr) {
    console.warn('[proKeyApi] Reset local trial counters err:', localErr);
  }

  // 2. Lưu dấu reset vào Firestore /users/{uid} để đồng bộ đa thiết bị
  const resetAt = new Date().toISOString();
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase.js');
    await setDoc(doc(db, 'users', uid), {
      wordImportsUsed: 0,
      manualExamsUsed: 0,
      omrSheetsUsed: 0,
      trialQuotaResetAt: resetAt,
      updatedAt: resetAt,
    }, { merge: true });
  } catch (fsErr) {
    console.warn('[proKeyApi] Firestore reset trial quota err:', fsErr);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cs-teacher-trial-quota-change', { detail: { uid, resetAt } }));
    window.dispatchEvent(new CustomEvent('elec-quota-changed', { detail: { uid, resetAt } }));
  }

  return { ok: true, uid, resetAt };
}
