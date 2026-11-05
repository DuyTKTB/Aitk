/* ============================================================
   discountService.js — Hệ thống Mã Giảm Giá & Voucher Bảo Mật
   ============================================================ */
import { supabase } from './supabase.js';

/**
 * Cấu trúc mã giảm giá trong bảng pro_keys:
 * - code: Chuỗi mã viết hoa (VD: 'ELEC2027', 'GIAM50', 'DISC-A1B2-C3D4')
 * - duration_days: Số ngày hiệu lực
 * - note: Chứa metadata: [DISCOUNT:type:val:max:N:used:M] <Ghi chú>
 *   + type: 'percent' | 'amount' | 'free_vip' | 'free_pro'
 *   + val: giá trị (VD: 30, 50, 100000)
 *   + max: số lượt dùng tối đa (VD: 1, 10, 100, 99999)
 *   + used: số lượt đã dùng thực tế
 */

export const DISCOUNT_TYPES = {
  percent: { id: 'percent', label: 'Giảm theo phần trăm (%)', unit: '%' },
  amount: { id: 'amount', label: 'Giảm số tiền cố định (VNĐ)', unit: 'đ' },
  free_vip: { id: 'free_vip', label: 'Tặng miễn phí 100% gói VIP Học sinh', unit: 'VIP' },
  free_pro: { id: 'free_pro', label: 'Tặng miễn phí 100% gói Giáo viên PRO', unit: 'PRO' },
};

export const DISCOUNT_PERCENT_PRESETS = [10, 20, 30, 50, 70, 100];
export const DISCOUNT_AMOUNT_PRESETS = [30000, 50000, 100000, 200000, 300000];

/**
 * Sinh mã ngẫu nhiên dạng DISC-XXXX-XXXX
 */
export function generateDiscountCode(prefix = 'DISC') {
  const p1 = Math.random().toString(36).slice(2, 6).toUpperCase();
  const p2 = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${p1}-${p2}`;
}

/**
 * Parse metadata từ field `note`
 */
export function parseDiscountMeta(noteStr = '', codeStr = '') {
  const note = String(noteStr || '');
  const code = String(codeStr || '').toUpperCase();

  const match = note.match(/\[DISCOUNT:([a-z_]+):([^:\]]+)(?::max:(\d+))?(?::used:(\d+))?\]/i);
  if (match) {
    const type = match[1].toLowerCase();
    const val = match[2];
    const maxUses = match[3] ? Number(match[3]) : 1;
    const usedCount = match[4] ? Number(match[4]) : 0;
    return {
      isDiscount: true,
      type,
      value: type === 'percent' || type === 'amount' ? Number(val) : val,
      maxUses,
      usedCount,
      cleanNote: note.replace(/\[DISCOUNT:[^\]]+\]\s*/i, '').trim(),
    };
  }

  if (code.startsWith('DISC-') || code.startsWith('KM-')) {
    return {
      isDiscount: true,
      type: 'percent',
      value: 20,
      maxUses: 1,
      usedCount: 0,
      cleanNote: note.trim(),
    };
  }

  return { isDiscount: false };
}

/**
 * Encode metadata vào chuỗi note
 */
export function formatDiscountNote({ type = 'percent', value = 20, maxUses = 1, usedCount = 0, note = '' }) {
  const clean = String(note || '').replace(/\[DISCOUNT:[^\]]+\]\s*/i, '').trim();
  const tag = `[DISCOUNT:${type}:${value}:max:${maxUses}:used:${usedCount}]`;
  return clean ? `${tag} ${clean}` : tag;
}

/**
 * ADMIN: Tạo mã giảm giá mới
 */
export async function adminCreateDiscountKey({
  code: customCode = '',
  discountType = 'percent',
  discountValue = 20,
  durationDays = 30,
  maxUses = 1,
  note = '',
  createdBy = null,
} = {}) {
  const days = Math.max(1, Math.min(3650, Number(durationDays) || 30));
  const max = Math.max(1, Math.min(999999, Number(maxUses) || 1));
  const finalCode = customCode?.trim()
    ? String(customCode).trim().toUpperCase().replace(/\s+/g, '-')
    : generateDiscountCode('DISC');

  const metaNote = formatDiscountNote({
    type: discountType,
    value: discountValue,
    maxUses: max,
    usedCount: 0,
    note,
  });

  const { data, error } = await supabase
    .from('pro_keys')
    .insert({
      code: finalCode,
      duration_days: days,
      note: metaNote,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Mã giảm giá "${finalCode}" đã tồn tại. Vui lòng chọn mã khác.`);
    }
    throw error;
  }

  return data;
}

/**
 * CLIENT: Kiểm tra và tính giá sau giảm
 */
export async function verifyDiscountCode({ code, originalPrice = 0, userId = null } = {}) {
  const cleanCode = String(code || '').trim().toUpperCase();
  if (!cleanCode || cleanCode.length < 3) {
    return { ok: false, error: 'Vui lòng nhập mã giảm giá hợp lệ (tối thiểu 3 ký tự).' };
  }

  try {
    const { data: key, error } = await supabase
      .from('pro_keys')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) throw error;
    if (!key) {
      return { ok: false, error: 'Mã giảm giá không tồn tại hoặc không chính xác.' };
    }

    if (key.revoked) {
      return { ok: false, error: 'Mã giảm giá này đã bị thu hồi hoặc đã bị khóa.' };
    }

    // Kiểm tra thời hạn
    const createdMs = new Date(key.created_at).getTime();
    if (!Number.isNaN(createdMs)) {
      const expiryMs = createdMs + (Number(key.duration_days) || 30) * 86400000;
      if (Date.now() > expiryMs) {
        return { ok: false, error: 'Mã giảm giá đã hết hạn sử dụng.' };
      }
    }

    const meta = parseDiscountMeta(key.note, key.code);
    if (!meta.isDiscount) {
      // Nếu là key PRO hoặc VIP thường, kiểm tra xem có dùng làm voucher nạp được không
      if (key.used_by && key.used_by !== userId) {
        return { ok: false, error: 'Mã này đã được tài khoản khác kích hoạt.' };
      }
      return {
        ok: true,
        keyId: key.id,
        code: key.code,
        isDirectKey: true,
        type: key.code.startsWith('VIP-') || (key.note || '').includes('[STUDENT_VIP') ? 'free_vip' : 'free_pro',
        discountAmount: originalPrice,
        finalPrice: 0,
        isFree: true,
        durationDays: key.duration_days,
        message: 'Mã đặc quyền kích hoạt miễn phí 100%!',
      };
    }

    // Kiểm tra số lần sử dụng
    if (meta.maxUses > 0 && meta.usedCount >= meta.maxUses) {
      return { ok: false, error: `Mã giảm giá đã đạt giới hạn sử dụng (${meta.maxUses}/${meta.maxUses} lượt).` };
    }

    // Nếu mã chỉ dùng 1 lần và đã có người dùng
    if (meta.maxUses === 1 && key.used_by && key.used_by !== userId) {
      return { ok: false, error: 'Mã giảm giá này đã được sử dụng.' };
    }

    // Tính tiền sau giảm
    const price = Math.max(0, Number(originalPrice) || 0);
    let discountAmount = 0;
    let message = '';

    if (meta.type === 'percent') {
      const pct = Math.max(1, Math.min(100, Number(meta.value) || 0));
      discountAmount = Math.round((price * pct) / 100);
      message = `Giảm ${pct}% (-${discountAmount.toLocaleString('vi-VN')}đ)`;
    } else if (meta.type === 'amount') {
      const amt = Math.max(0, Number(meta.value) || 0);
      discountAmount = Math.min(price, amt);
      message = `Giảm -${discountAmount.toLocaleString('vi-VN')}đ`;
    } else if (meta.type === 'free_vip') {
      discountAmount = price;
      message = `Đặc quyền tặng 100% Gói VIP Học sinh (${key.duration_days} ngày)!`;
    } else if (meta.type === 'free_pro') {
      discountAmount = price;
      message = `Đặc quyền tặng 100% Gói Giáo viên PRO (${key.duration_days} ngày)!`;
    }

    const finalPrice = Math.max(0, price - discountAmount);

    return {
      ok: true,
      keyId: key.id,
      code: key.code,
      type: meta.type,
      value: meta.value,
      discountAmount,
      finalPrice,
      isFree: finalPrice <= 0,
      durationDays: key.duration_days,
      maxUses: meta.maxUses,
      usedCount: meta.usedCount,
      message: `Áp dụng thành công mã "${key.code}": ${message}`,
    };
  } catch (err) {
    console.warn('[discountService] verifyDiscountCode error:', err);
    return { ok: false, error: 'Không thể xác thực mã giảm giá. Vui lòng thử lại sau.' };
  }
}

/**
 * Ghi nhận việc sử dụng mã giảm giá
 */
export async function recordDiscountUsage({ keyId, userId = null } = {}) {
  if (!keyId) return { ok: false };
  try {
    const { data: key, error: e0 } = await supabase
      .from('pro_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (e0 || !key) return { ok: false };

    const meta = parseDiscountMeta(key.note, key.code);
    const nextUsed = (meta.usedCount || 0) + 1;
    const updatedNote = formatDiscountNote({
      type: meta.type || 'percent',
      value: meta.value || 20,
      maxUses: meta.maxUses || 1,
      usedCount: nextUsed,
      note: meta.cleanNote || '',
    });

    const updatePayload = {
      note: updatedNote,
    };

    // Nếu đạt max uses hoặc max = 1, đánh dấu used_by
    if (nextUsed >= meta.maxUses || meta.maxUses === 1) {
      updatePayload.used_by = userId || 'anonymous';
      updatePayload.used_at = new Date().toISOString();
    }

    await supabase.from('pro_keys').update(updatePayload).eq('id', keyId);
    return { ok: true, usedCount: nextUsed };
  } catch (e) {
    console.warn('[discountService] recordDiscountUsage error:', e);
    return { ok: false };
  }
}
