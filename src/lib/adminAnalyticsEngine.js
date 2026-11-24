/* ============================================================
   adminAnalyticsEngine.js — Động cơ Phân tích SaaS, Credit & Múi giờ VN
   ------------------------------------------------------------
   Thuần hàm, 0 phụ thuộc ngoài, kiểm thử 100%:
     • bucketAttemptsByVietnamDay: Gom lượt làm bài chuẩn múi giờ UTC+7
     • computeSaasRevenueMetrics: Tính MRR / ARR / tỷ lệ hoạt động / rủi ro hết hạn
     • summarizeCreditLedger: Tổng hợp sổ cái Credit AI theo loại tác vụ & top chi tiêu
     • preserveRemainingDaysForSwitch: Bảo toàn ngày còn lại khi đổi gói PRO ↔ VIP
   ============================================================ */

import { isProActive, daysLeft, isStudentVipRecord } from './proKeyApi.js';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Chuyển timestamp sang khóa ngày YYYY-MM-DD theo múi giờ Việt Nam (UTC+7).
 */
export function toVietnamDateKey(input) {
  const ms = typeof input === 'number' ? input : new Date(input).getTime();
  if (!Number.isFinite(ms)) return null;
  const shifted = new Date(ms + VN_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toVietnamShortLabel(dateKey) {
  const parts = String(dateKey || '').split('-');
  if (parts.length !== 3) return dateKey || '';
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Gom danh sách lượt làm bài (hoặc giao dịch) theo `days` ngày gần nhất chuẩn UTC+7.
 */
export function bucketAttemptsByVietnamDay(items = [], days = 7, nowMs = Date.now(), dateField = 'started_at') {
  const countDays = Math.max(1, Math.min(90, Number(days) || 7));
  const buckets = [];
  for (let i = countDays - 1; i >= 0; i--) {
    const key = toVietnamDateKey(nowMs - i * DAY_MS);
    buckets.push({ key, label: toVietnamShortLabel(key), count: 0, sum: 0 });
  }
  const map = Object.fromEntries(buckets.map((b) => [b.key, b]));

  (Array.isArray(items) ? items : []).forEach((item) => {
    const rawDate = item?.[dateField] ?? item?.created_at ?? item?.createdAtMs;
    if (!rawDate) return;
    const key = toVietnamDateKey(rawDate);
    if (key && map[key]) {
      map[key].count += 1;
      const amt = Math.abs(Number(item?.amount) || 0);
      map[key].sum += amt;
    }
  });

  return buckets;
}

/**
 * Tính các chỉ số doanh thu SaaS ước tính từ danh sách `pro_users`.
 */
export function computeSaasRevenueMetrics(
  proUsers = [],
  { teacherPrice = 999000, studentPrice = 299000, nowMs = Date.now() } = {}
) {
  const rows = Array.isArray(proUsers) ? proUsers : [];
  let teacherActive = 0;
  let studentActive = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;
  let renewalAtRiskVnd = 0;

  rows.forEach((u) => {
    const expMs = u?.expiry ? new Date(u.expiry).getTime() : 0;
    const active = Number.isFinite(expMs) && expMs > nowMs && isProActive(u.expiry);
    const isStudent = isStudentVipRecord(u);
    const unitPrice = isStudent ? studentPrice : teacherPrice;

    if (active) {
      if (isStudent) studentActive += 1;
      else teacherActive += 1;
      const left = Math.ceil((expMs - nowMs) / DAY_MS);
      if (left <= 7) {
        expiringSoonCount += 1;
        renewalAtRiskVnd += unitPrice;
      }
    } else {
      expiredCount += 1;
    }
  });

  const activeTotal = teacherActive + studentActive;
  const arrVnd = teacherActive * teacherPrice + studentActive * studentPrice;
  const mrrVnd = Math.round(arrVnd / 12);
  const retentionRate = rows.length ? Math.round((activeTotal / rows.length) * 100) : 0;

  return {
    totalSubscribers: rows.length,
    activeTotal,
    teacherActive,
    studentActive,
    expiredCount,
    expiringSoonCount,
    arrVnd,
    mrrVnd,
    renewalAtRiskVnd,
    retentionRate,
  };
}

export const CREDIT_TX_LABELS = {
  purchase:      'Nạp tiền / Mua gói',
  admin_grant:   'Admin cấp Credit',
  admin_deduct:  'Admin trừ Credit',
  signup_bonus:  'Quà đăng ký mới',
  daily_free:    'Điểm danh hàng ngày',
  referral:      'Giới thiệu bạn bè',
  ai_text:       'Dùng AI Văn bản / Đề',
  ai_image:      'Dùng AI Vision / OCR',
  refund:        'Hoàn tiền AI lỗi',
};

/**
 * Tổng hợp sổ cái Credit (`credit_transactions`) thành dòng tiền, tốc độ đốt AI và top người dùng.
 */
export function summarizeCreditLedger(transactions = [], nowMs = Date.now()) {
  const rows = Array.isArray(transactions) ? transactions : [];
  let totalInflow = 0;
  let totalPurchaseVnd = 0;
  let totalAiBurn = 0;
  let totalRefund = 0;
  const byTypeMap = {};
  const spenderMap = {};

  rows.forEach((tx) => {
    const amt = Number(tx?.amount) || 0;
    const type = String(tx?.type || 'other');
    if (!byTypeMap[type]) {
      byTypeMap[type] = {
        type,
        label: CREDIT_TX_LABELS[type] || type,
        count: 0,
        volume: 0,
      };
    }
    byTypeMap[type].count += 1;
    byTypeMap[type].volume += Math.abs(amt);

    if (amt > 0) {
      totalInflow += amt;
      if (type === 'purchase') totalPurchaseVnd += amt;
      if (type === 'refund') totalRefund += amt;
    } else if (amt < 0) {
      if (type === 'ai_text' || type === 'ai_image') {
        totalAiBurn += Math.abs(amt);
        const uid = tx?.user_id || 'unknown';
        spenderMap[uid] = (spenderMap[uid] || 0) + Math.abs(amt);
      }
    }
  });

  const byType = Object.values(byTypeMap).sort((a, b) => b.volume - a.volume);
  const topSpenders = Object.entries(spenderMap)
    .map(([userId, spent]) => ({ userId, spent }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 8);

  const burnTx = rows.filter((tx) => Number(tx?.amount) < 0 && (tx?.type === 'ai_text' || tx?.type === 'ai_image'));
  const dailyBurn = bucketAttemptsByVietnamDay(burnTx, 7, nowMs, 'created_at');

  return {
    txCount: rows.length,
    totalInflow,
    totalPurchaseVnd,
    totalAiBurn,
    totalRefund,
    netFlow: totalInflow - totalAiBurn,
    byType,
    topSpenders,
    dailyBurn,
  };
}

/**
 * Bảo toàn số ngày còn lại khi Admin chuyển đổi gói giữa GV PRO ↔ HS VIP
 * (thay vì ghi đè cứng 30 ngày gây mất hạn của thuê bao gói năm).
 */
export function preserveRemainingDaysForSwitch(expiryOrDaysLeft, fallbackDays = 30) {
  if (typeof expiryOrDaysLeft === 'number' && Number.isFinite(expiryOrDaysLeft)) {
    return expiryOrDaysLeft > 0 ? Math.max(1, Math.round(expiryOrDaysLeft)) : fallbackDays;
  }
  const left = daysLeft(expiryOrDaysLeft);
  return left > 0 ? Math.max(1, left) : fallbackDays;
}
