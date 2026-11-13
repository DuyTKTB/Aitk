/* ============================================================
   creditService.js — Quản lý credits (điểm) cho AI
   - spendCredit: trừ điểm (text=1, ảnh=1/ảnh)
   - refundCredit: hoàn điểm khi AI lỗi
   - claimWelcomeBonus: nhận 5 điểm 1 LẦN DUY NHẤT
   ============================================================ */
import { supabase } from './supabase.js';
import { auth } from './firebase.js';

const CACHE_KEY = 'elec_user_credits_cache';

function getCachedCredits(userId) {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedCredits(userId, data) {
  if (!userId || !data || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(data));
  } catch { /* ignore quota */ }
}

/* ============================================================
   BẢNG QUY ĐỔI ELEC AI CREDIT (CHUẨN 1 VNĐ ≈ 1 CREDIT)
   ============================================================ */
export const CREDIT_PACKAGES = [
  { amount: 10000,  credits: 10000,  bonus: 0,     total: 10000,  name: 'PRO 1',   label: '10.000 đ',  coins: 1 },
  { amount: 30000,  credits: 30000,  bonus: 0,     total: 30000,  name: 'PRO 2',   label: '30.000 đ',  coins: 1, rate: '~1đ / credit' },
  { amount: 60000,  credits: 60000,  bonus: 0,     total: 60000,  name: 'PRO 3',   label: '60.000 đ',  coins: 2, rate: '~1đ / credit' },
  { amount: 100000, credits: 100000, bonus: 0,     total: 100000, name: 'PREMIUM', label: '100.000 đ', coins: 3, rate: '~1đ / credit', badge: 'ĐƯỢC CHỌN NHIỀU NHẤT', popular: true },
  { amount: 200000, credits: 200000, bonus: 20000, total: 220000, name: 'PRO MAX', label: '200.000 đ', coins: 3, badge: '+10% Thưởng' },
  { amount: 500000, credits: 500000, bonus: 100000,total: 600000, name: 'VIP MAX', label: '500.000 đ', coins: 3, badge: '+20% Thưởng' },
  // Giữ lại các gói phụ để tương thích ngược
  { amount: 25000,  credits: 25000,  bonus: 0,     total: 25000,  name: 'TIẾP SỨC', label: '25.000 đ', coins: 1 },
  { amount: 50000,  credits: 50000,  bonus: 0,     total: 50000,  name: 'ÔN LUYỆN', label: '50.000 đ', coins: 2 },
];

export const BANK_INFO = {
  bankId: '970422',
  bankName: 'MB BANK',
  accountNo: '999988882010',
  accountName: 'NGUYEN THE DUY',
  template: 'compact2',
};

/* ============================================================
   HELPERS
   ============================================================ */
function generateOrderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ============================================================
   Lấy số dư credits hiện tại
   ============================================================ */
export async function getCredits(userId) {
  if (!userId) return { balance: 0, total_earned: 0, total_spent: 0 };

  const cached = getCachedCredits(userId);

  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[credits] getCredits error:', error.message);
    // Nếu có cache, fallback dùng cache để tránh màn hình giật về 0
    if (cached) return cached;
    return { balance: 0, total_earned: 0, total_spent: 0 };
  }

  if (!data) {
    // Chống tạo nick Gmail giả farm 50 Credit miễn phí: chỉ cấp khi email đã xác thực (Google luôn verified)
    const currentUser = auth?.currentUser;
    if (currentUser && currentUser.uid === userId && !currentUser.emailVerified) {
      return { balance: 0, total_earned: 0, total_spent: 0, unverifiedBlocked: true };
    }
    try {
      const { data: newBal, error: rpcErr } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: 50,
        p_type: 'signup_bonus',
        p_description: 'Quà đăng ký lần đầu 🎁',
      });
      if (rpcErr) throw rpcErr;
      const res = { balance: newBal ?? 50, total_earned: 50, total_spent: 0 };
      setCachedCredits(userId, res);
      return res;
    } catch (e) {
      console.warn('[credits] signup bonus fail:', e?.message || e);
      if (cached) return cached;
      return { balance: 0, total_earned: 0, total_spent: 0 };
    }
  }

  setCachedCredits(userId, data);
  return data;
}

/* ============================================================
   TRỪ credits khi dùng AI
   ------------------------------------------------------------
   imageCount: số ảnh gửi kèm (0 = chỉ text)
   Giá: 1 điểm text + 1 điểm mỗi ảnh (hoặc creditCost cụ thể)
   ============================================================ */
export async function spendCredit(userId, imageCount = 0, creditCost = null) {
  if (!userId) {
    try {
      window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
        detail: { needed: 1, balance: 0, needLogin: true },
      }));
    } catch { /* */ }
    return { ok: false, balance: 0, needed: 1, needLogin: true };
  }

  const imgCount = Math.max(0, Number(imageCount) || 0);
  // Nếu creditCost được chỉ định rõ (vd: tạo đề, ma trận) → dùng luôn
  // Nếu không → tính theo công thức: 1 + số ảnh
  const cost = creditCost !== null ? Math.max(1, Number(creditCost)) : 1 + imgCount;

  const credits = await getCredits(userId);

  if (credits.balance < cost) {
    try {
      window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
        detail: { needed: cost, balance: credits.balance, needLogin: false },
      }));
    } catch { /* */ }
    return { ok: false, balance: credits.balance, needed: cost };
  }

  const typeLabel = creditCost !== null
    ? (imgCount > 0 ? 'ai_image' : 'ai_text')
    : (imgCount > 0 ? 'ai_image' : 'ai_text');

  try {
    const { data: newBalance, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: -cost,
      p_type: typeLabel,
      p_description: imgCount > 0
        ? `Hỏi AI kèm ${imgCount} ảnh (-${cost})`
        : `Hỏi AI (-${cost})`,
    });

    if (error) throw error;

    // Cập nhật cache
    const updated = { ...credits, balance: newBalance, total_spent: (credits.total_spent || 0) + cost };
    setCachedCredits(userId, updated);

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBalance, cost },
      }));
    } catch { /* */ }

    return { ok: true, balance: newBalance, cost };
  } catch (e) {
    console.warn('[credits] spendCredit error:', e?.message || e);
    try {
      window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
        detail: { needed: cost, balance: credits.balance },
      }));
    } catch { /* */ }
    return { ok: false, balance: credits.balance, needed: cost };
  }
}

/* ============================================================
   HOÀN credits khi AI lỗi
   ============================================================ */
export async function refundCredit(userId, amount, reason = 'Hoàn điểm do AI lỗi') {
  if (!userId || !amount || amount <= 0) return { ok: false };

  try {
    const { data: newBalance, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: Math.abs(amount),
      p_type: 'refund',
      p_description: reason,
    });

    if (error) throw error;

    const cached = getCachedCredits(userId);
    if (cached) {
      setCachedCredits(userId, { ...cached, balance: newBalance });
    }

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBalance, refund: amount },
      }));
    } catch { /* */ }

    return { ok: true, balance: newBalance };
  } catch (e) {
    console.warn('[credits] refundCredit error:', e?.message || e);
    return { ok: false };
  }
}

/* ============================================================
   HELPER: Chạy tác vụ AI có trừ Credit & tự động hoàn điểm khi lỗi
   ============================================================ */
export async function runWithCredit(
  { userId = null, imageCount = 0, cost = null, reason = 'Dùng AI' } = {},
  taskFn
) {
  let charged = 0;
  if (userId) {
    const cr = await spendCredit(userId, imageCount, cost);
    if (!cr.ok) {
      const err = new Error(
        `Hết điểm Credit! Còn ${cr.balance} điểm, cần ${cr.needed} điểm. Vui lòng nạp thêm Credit để tiếp tục sử dụng AI.`
      );
      err.code = 'OUT_OF_CREDITS';
      err.balance = cr.balance;
      err.needed = cr.needed;
      throw err;
    }
    charged = cr.cost || 0;
  }

  try {
    return await taskFn();
  } catch (err) {
    if (charged > 0 && userId) {
      await refundCredit(userId, charged, `Hoàn điểm (${reason}): ${err?.message || 'AI lỗi'}`).catch(() => {});
    }
    throw err;
  }
}

/* ============================================================
   Tạo đơn nạp tiền → trả về QR code URL
   ============================================================ */
export async function createPaymentOrder(userId, packageAmount) {
  const pkg = CREDIT_PACKAGES.find((p) => p.amount === packageAmount);
  if (!pkg) throw new Error('Gói không hợp lệ');

  const orderCode = generateOrderCode();
  const transferContent = `ELEC ${orderCode}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const { data: order, error } = await supabase
    .from('payment_orders')
    .insert({
      user_id: userId,
      order_code: orderCode,
      amount_vnd: pkg.amount,
      credits: pkg.total,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  const params = new URLSearchParams({
    amount: String(pkg.amount),
    addInfo: transferContent,
    accountName: BANK_INFO.accountName,
  });

  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-${BANK_INFO.template}.png?${params}`;

  return {
    order,
    orderCode,
    transferContent,
    qrUrl,
    credits: pkg.total,
    amount: pkg.amount,
    expiresAt,
  };
}

/* ============================================================
   Realtime listeners
   ============================================================ */
export function onCreditsChange(userId, callback) {
  const id = Math.random().toString(36).slice(2, 8);
  const channel = supabase
    .channel(`credits-${userId}-${id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_credits',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function onOrderPaid(orderId, callback) {
  const id = Math.random().toString(36).slice(2, 8);
  const channel = supabase
    .channel(`order-${orderId}-${id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'payment_orders',
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        if (payload.new.status === 'paid') callback(payload.new);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export async function checkOrderStatus(orderId) {
  if (!orderId) return null;
  try {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}


/* ============================================================
   Lịch sử giao dịch
   ============================================================ */
export async function getTransactionHistory(userId, limit = 50) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[credits] getHistory error:', error.message);
    return [];
  }
  return data || [];
}

/* ============================================================
   Kiểm tra user đã nhận 5 điểm chào mừng chưa
   (chỉ 1 lần duy nhất — không reset)
   ============================================================ */
export async function checkWelcomeClaimed(userId) {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('first_free_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return false;
    return Boolean(data?.first_free_at);
  } catch {
    return false;
  }
}

/* ============================================================
   Nhận 5 điểm chào mừng — CHỈ 1 LẦN DUY NHẤT
   ------------------------------------------------------------
   - Đọc first_free_at từ server
   - Nếu đã có giá trị → từ chối
   - Cộng điểm + ghi first_free_at ngay
   - Không bao giờ reset (không theo ngày)
   ============================================================ */
export async function claimWelcomeBonus(userId) {
  if (!userId) return { ok: false, reason: 'not_logged_in' };

  const { data: user, error: readErr } = await supabase
    .from('user_credits')
    .select('first_free_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (readErr) {
    console.warn('[credits] claimWelcomeBonus read error:', readErr.message);
    return { ok: false, reason: 'read_error' };
  }

  if (user?.first_free_at) {
    return { ok: false, reason: 'already_claimed' };
  }

  try {
    const { data: newBal, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: 15,
      p_type: 'daily_free',
      p_description: 'Điểm quà tặng (+15 điểm)',
    });
    if (error) throw error;

    const { error: updErr } = await supabase
      .from('user_credits')
      .update({ first_free_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updErr) console.warn('[credits] update first_free_at error:', updErr.message);

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBal },
      }));
    } catch { /* */ }

    return { ok: true, balance: newBal };
  } catch (e) {
    console.warn('[credits] claimWelcomeBonus error:', e?.message || e);
    return { ok: false, reason: e?.message || 'rpc_fail' };
  }
}

/* ============================================================
   Cộng 15 điểm cho mỗi lượt nhập Mã kích hoạt / Mã giới thiệu
   ============================================================ */
export async function grantActivationCredits(userId, amount = 15, code = '') {
  const pts = Number(amount) || 15;
  if (!userId) {
    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { delta: pts, added: pts },
      }));
    } catch { /* */ }
    return { ok: true, added: pts, balance: null };
  }

  try {
    const { data: newBal, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: pts,
      p_type: 'referral',
      p_description: `Nhập mã kích hoạt ${code} (+${pts} điểm)`,
    });
    if (error) throw error;

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBal, added: pts },
      }));
    } catch { /* */ }

    return { ok: true, added: pts, balance: newBal };
  } catch (e) {
    console.warn('[credits] grantActivationCredits fallback:', e?.message || e);
    let fallbackBal = null;
    try {
      const cur = await getCredits(userId);
      fallbackBal = (Number(cur?.balance) || 0) + pts;
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: fallbackBal, added: pts },
      }));
    } catch {
      try {
        window.dispatchEvent(new CustomEvent('cs-credit-update', {
          detail: { delta: pts, added: pts },
        }));
      } catch { /* */ }
    }
    return { ok: true, added: pts, balance: fallbackBal };
  }
}

/* ============================================================
   ADMIN: Điều chỉnh credits thủ công (Cộng hoặc Trừ điểm)
   ============================================================ */
export async function adminAdjustCredits(userId, delta = 0, reason = 'Admin điều chỉnh') {
  const pts = Number(delta) || 0;
  if (!userId || pts === 0) return { ok: false, reason: 'invalid_args' };

  try {
    const { data: newBal, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: pts,
      p_type: pts > 0 ? 'admin_grant' : 'admin_deduct',
      p_description: reason,
    });
    if (error) throw error;

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBal, delta: pts, reason },
      }));
    } catch { /* */ }

    return { ok: true, balance: newBal, delta: pts };
  } catch (e) {
    console.warn('[credits] adminAdjustCredits RPC fail, fallback to direct update:', e?.message || e);
    try {
      const cur = await getCredits(userId);
      const nextBal = Math.max(0, (Number(cur?.balance) || 0) + pts);
      const nextEarned = pts > 0 ? (Number(cur?.total_earned) || 0) + pts : (cur?.total_earned || 0);
      const nextSpent = pts < 0 ? (Number(cur?.total_spent) || 0) + Math.abs(pts) : (cur?.total_spent || 0);

      await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          balance: nextBal,
          total_earned: nextEarned,
          total_spent: nextSpent,
          updated_at: new Date().toISOString(),
        });

      try {
        await supabase.from('credit_transactions').insert({
          user_id: userId,
          amount: pts,
          type: pts > 0 ? 'admin_grant' : 'admin_deduct',
          description: reason,
          created_at: new Date().toISOString(),
        });
      } catch { /* ignore transaction insert error */ }

      try {
        window.dispatchEvent(new CustomEvent('cs-credit-update', {
          detail: { balance: nextBal, delta: pts, reason },
        }));
      } catch { /* */ }

      return { ok: true, balance: nextBal, delta: pts };
    } catch (fallbackErr) {
      console.error('[credits] adminAdjustCredits fallback failed:', fallbackErr);
      return { ok: false, reason: fallbackErr.message || 'update_failed' };
    }
  }
}

/* Alias tương thích code cũ */
export const useCredit = spendCredit;