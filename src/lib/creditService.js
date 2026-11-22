/* ============================================================
   creditService.js — HỆ THỐNG KINH TẾ CREDIT CHUẨN 1 VNĐ = 1 CREDIT
   ------------------------------------------------------------
   • Đồng bộ tuyệt đối 1 VNĐ = 1 ELEC Credit giữa đầu vào (nạp gói)
     và đầu ra (bảng giá trừ theo độ nặng từng tác vụ AI).
   • Minh bạch giá trước khi bấm, tự động hoàn 100% khi AI lỗi.
   • Quà đăng ký mới (email đã xác thực): 1.000 Credit miễn phí.
   ============================================================ */
import { supabase } from './supabase.js';
import * as firebaseMod from './firebase.js';

const getFirebaseAuth = () => firebaseMod?.auth || null;

const CACHE_KEY = 'elec_user_credits_cache';

/* Bảng định mức chuẩn hóa 1 VNĐ = 1 Credit */
export const CREDIT_TARIFF = {
  SIGNUP_BONUS: 1000,      // Quà đăng ký mới (email verified) — đủ ~10 lượt chat nhanh
  WELCOME_BONUS: 500,      // Quà chào mừng nhận 1 lần duy nhất
  REFERRAL_BONUS: 500,     // Quà nhập mã giới thiệu / kích hoạt
  STREAK_FREEZE: 500,      // Mua khiên đóng băng chuỗi ngày học

  CHAT_FAST: 100,          // Chat nhanh với ELEC AI (~100đ)
  CHAT_IMAGE_ADDON: 200,   // Phụ phí Vision OCR mỗi ảnh đính kèm (+200đ/ảnh)
  CHAT_DOC_ADDON: 100,     // Phụ phí đọc tài liệu đính kèm (+100đ/tài liệu)
  CHAT_DEEP: 500,          // Chế độ Suy luận sâu (DeepThink / Gia sư chuyên sâu)

  TUTOR_CONTEXT: 300,      // Gia sư ngữ cảnh / Hỏi nhanh nguyên tố / Word Copilot
  ERROR_ANALYSIS: 1000,    // Phân tích lỗi sai / Lộ trình AI / Quét chuẩn PDF-Word
  CAREER_REPORT: 2000,     // Báo cáo định hướng ngành nghề & tuyển sinh AI

  EXAM_GEN_SMALL: 1000,    // Tạo đề AI ≤ 10 câu
  EXAM_GEN_MEDIUM: 1500,   // Tạo đề AI 11–20 câu
  EXAM_GEN_LARGE: 2500,    // Tạo đề AI 21–40 câu
  EXAM_GEN_XLARGE: 3000,   // Tạo đề AI > 40 câu / Đề tổng hợp 45–90 phút
};

export const CREDIT_TARIFF_LIST = [
  { id: 'chat_fast',      label: 'Chat nhanh với ELEC AI',       cost: CREDIT_TARIFF.CHAT_FAST,       unit: 'lượt',       tag: 'Nhanh' },
  { id: 'chat_img',       label: 'Đính kèm ảnh / OCR bài tập',   cost: CREDIT_TARIFF.CHAT_IMAGE_ADDON, unit: '+ảnh',      tag: 'Vision', prefix: '+' },
  { id: 'tutor',          label: 'Gia sư ngữ cảnh & Word Copilot', cost: CREDIT_TARIFF.TUTOR_CONTEXT, unit: 'lượt',       tag: 'Học tập' },
  { id: 'chat_deep',      label: 'Suy luận sâu (DeepThink)',     cost: CREDIT_TARIFF.CHAT_DEEP,       unit: 'lượt',       tag: 'Chuyên sâu' },
  { id: 'error_analysis', label: 'Phân tích lỗi sai / Quét PDF', cost: CREDIT_TARIFF.ERROR_ANALYSIS,  unit: 'lượt',       tag: 'Phân tích' },
  { id: 'exam_gen',       label: 'Tạo đề thi chuẩn GDPT 2018',   cost: CREDIT_TARIFF.EXAM_GEN_SMALL,  unit: '1.000–3.000', tag: 'Giáo viên' },
  { id: 'career_report',  label: 'Báo cáo định hướng ngành nghề', cost: CREDIT_TARIFF.CAREER_REPORT,  unit: 'báo cáo',    tag: 'Chuyên sâu' },
];

export function formatCredits(n) {
  const num = Math.max(0, Math.round(Number(n) || 0));
  return num.toLocaleString('vi-VN');
}

export function calcChatCreditCost({ imageCount = 0, deepThink = false, docCount = 0 } = {}) {
  const imgs = Math.max(0, Math.round(Number(imageCount) || 0));
  const docs = Math.max(0, Math.round(Number(docCount) || 0));
  const base = deepThink ? CREDIT_TARIFF.CHAT_DEEP : CREDIT_TARIFF.CHAT_FAST;
  return base + imgs * CREDIT_TARIFF.CHAT_IMAGE_ADDON + docs * CREDIT_TARIFF.CHAT_DOC_ADDON;
}

export function calcExamGenCreditCost(questionCount = 10) {
  const n = Math.max(1, Number(questionCount) || 10);
  if (n <= 10) return CREDIT_TARIFF.EXAM_GEN_SMALL;
  if (n <= 20) return CREDIT_TARIFF.EXAM_GEN_MEDIUM;
  if (n <= 40) return CREDIT_TARIFF.EXAM_GEN_LARGE;
  return CREDIT_TARIFF.EXAM_GEN_XLARGE;
}

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
    // Chống tạo nick Gmail giả farm Credit miễn phí: chỉ cấp khi email đã xác thực (Google luôn verified)
    const currentUser = getFirebaseAuth()?.currentUser;
    if (currentUser && currentUser.uid === userId && !currentUser.emailVerified) {
      return { balance: 0, total_earned: 0, total_spent: 0, unverifiedBlocked: true };
    }
    try {
      const bonus = CREDIT_TARIFF.SIGNUP_BONUS;
      const { data: newBal, error: rpcErr } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_amount: bonus,
        p_type: 'signup_bonus',
        p_description: `Quà đăng ký tài khoản mới (+${formatCredits(bonus)} Credit)`,
      });
      if (rpcErr) throw rpcErr;
      const res = { balance: newBal ?? bonus, total_earned: bonus, total_spent: 0 };
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
   CHUẨN HÓA p_type THEO CHECK CONSTRAINT TRONG POSTGRES
   ------------------------------------------------------------
   Bảng credit_transactions chỉ chấp nhận:
   'signup_bonus', 'daily_free', 'purchase', 'referral',
   'ai_text', 'ai_image', 'refund', 'admin_grant', 'admin_deduct'.
   Mọi lượt trừ AI phải map chặt về 'ai_image' hoặc 'ai_text',
   còn tên tác vụ chi tiết (DeepThink, Tạo đề, OCR, ...) ghi ở p_description.
   ============================================================ */
export const DB_ALLOWED_SPEND_TYPES = Object.freeze(['ai_text', 'ai_image']);

export function resolveDbCreditType({ imageCount = 0, actionType = null } = {}) {
  const imgCount = Math.max(0, Number(imageCount) || 0);
  if (imgCount > 0 || actionType === 'ai_image') return 'ai_image';
  return 'ai_text';
}

/* ============================================================
   TRỪ credits khi dùng AI (chuẩn 1 VNĐ = 1 Credit)
   ------------------------------------------------------------
   • Nếu creditCost = null → tự tính bằng calcChatCreditCost
     (Chat nhanh: 100 · Suy luận sâu: 500 · +200/ảnh · +100/tài liệu)
   • Nếu creditCost truyền cụ thể → trừ đúng giá công khai theo tác vụ
   ============================================================ */
export async function spendCredit(userId, imageCount = 0, creditCost = null, opts = {}) {
  const imgCount = Math.max(0, Number(imageCount) || 0);
  const deepThink = Boolean(opts?.deepThink);
  const docCount = Math.max(0, Number(opts?.docCount) || 0);
  const reason = opts?.reason || '';
  const cost = creditCost !== null
    ? Math.max(1, Math.round(Number(creditCost)))
    : calcChatCreditCost({ imageCount: imgCount, deepThink, docCount });

  if (!userId) {
    try {
      window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
        detail: { needed: cost, balance: 0, needLogin: true },
      }));
    } catch { /* */ }
    return { ok: false, balance: 0, needed: cost, needLogin: true };
  }

  const credits = await getCredits(userId);
  const currentBalance = Math.max(0, Number(credits?.balance) || 0);

  if (currentBalance < cost) {
    try {
      window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
        detail: { needed: cost, balance: currentBalance, needLogin: false, reason },
      }));
    } catch { /* */ }
    return { ok: false, balance: currentBalance, needed: cost };
  }

  const typeLabel = resolveDbCreditType({ imageCount: imgCount, actionType: opts?.actionType });

  const desc = reason
    ? `${reason} (-${formatCredits(cost)})`
    : imgCount > 0
      ? `${deepThink ? 'ELEC AI DeepThink' : 'Chat ELEC AI'} kèm ${imgCount} ảnh (-${formatCredits(cost)})`
      : deepThink
        ? `ELEC AI Suy luận sâu (-${formatCredits(cost)})`
        : `Chat ELEC AI (-${formatCredits(cost)})`;

  try {
    const { data: newBalance, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: -cost,
      p_type: typeLabel,
      p_description: desc,
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
    const errMsg = e?.message || String(e || 'Lỗi kết nối hệ thống Credit');
    console.warn('[credits] spendCredit error:', errMsg);
    // Tuyệt đối KHÔNG mở popup "Bạn đã hết credit" nếu số dư thực tế vẫn đủ!
    const isInsufficientErr = /insufficient|không đủ|negative|balance/i.test(errMsg) && currentBalance < cost;
    if (isInsufficientErr) {
      try {
        window.dispatchEvent(new CustomEvent('elec-out-of-credits', {
          detail: { needed: cost, balance: currentBalance, reason },
        }));
      } catch { /* */ }
      return { ok: false, balance: currentBalance, needed: cost };
    }
    return {
      ok: false,
      balance: currentBalance,
      needed: cost,
      isSystemError: true,
      error: errMsg,
    };
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
export function resolveCreditUserId(explicitUserId = null) {
  return explicitUserId || getFirebaseAuth()?.currentUser?.uid || null;
}

export async function runWithCredit(
  {
    userId = null,
    imageCount = 0,
    cost = null,
    deepThink = false,
    docCount = 0,
    actionType = null,
    reason = 'Dùng AI',
    allowGuest = false,
  } = {},
  taskFn
) {
  const effectiveUserId = resolveCreditUserId(userId);
  let charged = 0;
  if (effectiveUserId || !allowGuest) {
    const cr = await spendCredit(effectiveUserId, imageCount, cost, { deepThink, docCount, actionType, reason });
    if (!cr.ok) {
      if (cr.needLogin) {
        const loginErr = new Error(
          'Vui lòng đăng nhập tài khoản để dùng tính năng ELEC AI (nhận ngay 1.000 Credit miễn phí khi đăng ký).'
        );
        loginErr.code = 'LOGIN_REQUIRED';
        loginErr.needLogin = true;
        loginErr.balance = 0;
        loginErr.needed = cr.needed;
        throw loginErr;
      }
      if (cr.isSystemError) {
        const sysErr = new Error(
          `Lỗi kết nối hệ thống Credit tạm thời (${cr.error || 'vui lòng thử lại'}). Số dư của bạn không bị trừ.`
        );
        sysErr.code = 'CREDIT_SYSTEM_ERROR';
        sysErr.balance = cr.balance;
        sysErr.needed = cr.needed;
        throw sysErr;
      }
      const err = new Error(
        `Không đủ ELEC Credit! Số dư hiện tại ${formatCredits(cr.balance)}, cần ${formatCredits(cr.needed)} Credit. Vui lòng nạp thêm để tiếp tục.`
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
    if (charged > 0 && effectiveUserId) {
      await refundCredit(effectiveUserId, charged, `Hoàn Credit (${reason}): ${err?.message || 'AI lỗi'}`).catch(() => {});
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
    const bonus = CREDIT_TARIFF.WELCOME_BONUS;
    const { data: newBal, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: bonus,
      p_type: 'daily_free',
      p_description: `Quà chào mừng ELEC AI (+${formatCredits(bonus)} Credit)`,
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
export async function grantActivationCredits(userId, amount = CREDIT_TARIFF.REFERRAL_BONUS, code = '') {
  const pts = Number(amount) || CREDIT_TARIFF.REFERRAL_BONUS;
  if (!userId || pts <= 0) {
    return { ok: false, reason: 'missing_user', added: 0, balance: null };
  }

  try {
    const { data: newBal, error } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: pts,
      p_type: 'referral',
      p_description: `Nhập mã kích hoạt ${code} (+${formatCredits(pts)} Credit)`,
    });
    if (error) throw error;

    const cached = getCachedCredits(userId);
    if (cached) setCachedCredits(userId, { ...cached, balance: newBal });

    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: newBal, added: pts },
      }));
    } catch { /* */ }

    return { ok: true, added: pts, balance: newBal };
  } catch (e) {
    console.warn('[credits] grantActivationCredits error:', e?.message || e);
    return { ok: false, added: 0, balance: null, error: e?.message || 'rpc_fail' };
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