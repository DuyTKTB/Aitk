import { isAdmin as checkIsAdmin } from './isAdmin.js';
import { getUserRole } from './userRole.js';

export const TEACHER_VIP_MONTHLY_PRICE = 399000;
export const TEACHER_VIP_PRICE_TEXT = '399.000đ';
export const STUDENT_VIP_MONTHLY_PRICE = 199000;
export const STUDENT_VIP_PRICE_TEXT = '199.000đ';

export const FREE_TEACHER_LIMITS = Object.freeze({
  maxClasses: 1,
  maxStudentsPerClass: 40,
  maxExams: 30,
  maxOmrTrialSheets: 5,
  maxBankQuestions: 50,
  maxWordImports: 10,
  maxManualEntries: 30,
});

export const FREE_STUDENT_LIMITS = Object.freeze({
  maxHearts: 5,
});

export const VIP_STUDENT_LIMITS = Object.freeze({
  maxHearts: 99,
});

// Explicitly kept free per user directive
export const STUDENT_FREE_EXCLUDED_MODULES = Object.freeze([
  'roadmap',
  'aspiration',
  'wrong-notebook',
]);

export const SUBSCRIPTION_CATALOG = Object.freeze({
  // ======================== HỌC SINH (chuẩn 199k/tháng) ========================
  'hs-1m': {
    id: 'hs-1m',
    role: 'student',
    planCode: 'VIP',
    label: 'ELEC AI Học Sinh VIP — 1 tháng',
    shortLabel: 'Học Sinh VIP 1 tháng',
    sublabel: 'Mở khóa toàn bộ bộ đề PRO/VIP & Gia sư AI',
    months: 1,
    days: 30,
    amount: STUDENT_VIP_MONTHLY_PRICE,
    price: STUDENT_VIP_MONTHLY_PRICE,
    originalPrice: 249000,
    period: '/ 1 tháng',
    badge: 'Chuẩn 199k/tháng',
    featured: true,
    bonusCredits: 60,
  },
  'hs-3m': {
    id: 'hs-3m',
    role: 'student',
    planCode: 'VIP',
    label: 'ELEC AI Học Sinh VIP — 3 tháng',
    shortLabel: 'Học Sinh VIP 3 tháng',
    sublabel: 'Ôn thi tăng tốc theo quý (~133k/tháng), tiết kiệm 33%',
    months: 3,
    days: 90,
    amount: 399000,
    price: 399000,
    originalPrice: STUDENT_VIP_MONTHLY_PRICE * 3,
    period: '/ 3 tháng',
    badge: 'Tiết kiệm 33%',
    bonusCredits: 150,
  },
  'hs-6m': {
    id: 'hs-6m',
    role: 'student',
    planCode: 'VIP',
    label: 'ELEC AI Học Sinh VIP — 6 tháng',
    shortLabel: 'Học Sinh VIP 6 tháng',
    sublabel: 'Đồng hành trọn 1 học kỳ (~116k/tháng), tiết kiệm 41%',
    months: 6,
    days: 180,
    amount: 699000,
    price: 699000,
    originalPrice: STUDENT_VIP_MONTHLY_PRICE * 6,
    period: '/ 6 tháng',
    badge: 'Tiết kiệm 41%',
    bonusCredits: 320,
  },
  'hs-12m': {
    id: 'hs-12m',
    role: 'student',
    planCode: 'VIP',
    label: 'ELEC AI Học Sinh VIP — 12 tháng',
    shortLabel: 'Học Sinh VIP 12 tháng',
    sublabel: 'Trọn năm học 2026–2027 (~83k/tháng) & tặng 700 Credit AI',
    months: 12,
    days: 365,
    amount: 999000,
    price: 999000,
    originalPrice: STUDENT_VIP_MONTHLY_PRICE * 12,
    period: '/ 12 tháng',
    badge: 'Tiết kiệm 58%',
    bonusCredits: 700,
  },

  // ======================== GIÁO VIÊN VIP (399k/tháng) ========================
  'gv-1m': {
    id: 'gv-1m',
    role: 'teacher',
    planCode: 'PRO',
    label: 'ELEC AI Giáo Viên VIP — 1 tháng',
    shortLabel: 'Giáo Viên VIP 1 tháng',
    sublabel: 'Mở khóa toàn bộ hệ sinh thái giảng dạy, AI soạn đề, OMR & Giám sát thi',
    months: 1,
    days: 30,
    amount: TEACHER_VIP_MONTHLY_PRICE,
    price: TEACHER_VIP_MONTHLY_PRICE,
    originalPrice: 499000,
    period: '/ 1 tháng',
    badge: 'Gói chuẩn 399k/tháng',
    featured: true,
    bonusCredits: 100,
  },
  'gv-6m': {
    id: 'gv-6m',
    role: 'teacher',
    planCode: 'PRO',
    label: 'ELEC AI Giáo Viên VIP — 6 tháng',
    shortLabel: 'Giáo Viên VIP 6 tháng',
    sublabel: 'Ổn định trọn 1 học kỳ, tiết kiệm 17% so với gia hạn từng tháng',
    months: 6,
    days: 180,
    amount: 1990000,
    price: 1990000,
    originalPrice: TEACHER_VIP_MONTHLY_PRICE * 6,
    period: '/ 6 tháng',
    badge: 'Tiết kiệm 17%',
    bonusCredits: 350,
  },
  'gv-12m': {
    id: 'gv-12m',
    role: 'teacher',
    planCode: 'PRO',
    label: 'ELEC AI Giáo Viên VIP — 12 tháng',
    shortLabel: 'Giáo Viên VIP 12 tháng',
    sublabel: 'Đồng hành cả năm học cho giáo viên & tổ bộ môn, tiết kiệm 25%',
    months: 12,
    days: 365,
    amount: 3590000,
    price: 3590000,
    originalPrice: TEACHER_VIP_MONTHLY_PRICE * 12,
    period: '/ 12 tháng',
    badge: 'Tiết kiệm 25%',
    bonusCredits: 800,
  },
});

export const TEACHER_VIP_HIGHLIGHTS = Object.freeze([
  'Không giới hạn số lớp học & sĩ số học sinh (Free: 1 lớp / 40 HS)',
  'Không giới hạn nhập file Word (.docx) & tạo đề/câu hỏi thủ công (Free: dùng thử 10 lần Word · 30 lần thủ công)',
  'Mở khóa AI Tạo Đề theo ma trận, tách đề PDF / Ảnh OCR & Nhập nhanh Excel',
  'Ngân hàng câu hỏi không giới hạn kèm 4 công cụ AI (Giải, Gắn tag, Kiểm định, Sinh đề)',
  'Chấm phiếu OMR A4 không giới hạn số tờ (Free: 5 lượt thử) & xuất bảng điểm Excel',
  'Giám sát phòng thi trực tiếp (LIVE Proctor), Camera/Audio AI & Chế độ Siêu chặt',
  'Phân tích học lực AI, kết nối GVBM nhiều lớp & Trợ lý AI Copilot',
]);

export const STUDENT_VIP_HIGHLIGHTS = Object.freeze([
  'Mở khóa 100% đề thi thử PRO & VIP các kỳ THPT QG, ĐGNL, TSA',
  'Mở rộng lên 99 tim luyện tập/ngày & thống kê chi tiết phòng thi',
  'AI Chẩn đoán lỗ hổng kiến thức & Đơn thuốc luyện lại chuyên sâu',
  'Studio Soạn Đề & Tài liệu thông minh từ PDF/Word/Ảnh',
  'Gia sư giọng nói AI trong Bài giảng 3D & Phân tích Hướng nghiệp AI',
  'Không giới hạn bảng so sánh & Trợ lý AI phân tích nguyên tố',
]);

export function formatVnd(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
}

export function hashEmailStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function buildIdentCode(email = '') {
  return 'ELECAI-' + hashEmailStr(email || 'guest').toString(16).slice(0, 6).toUpperCase();
}

export function getPackagesForRole(role) {
  const targetRole = role === 'teacher' ? 'teacher' : 'student';
  return Object.values(SUBSCRIPTION_CATALOG).filter((p) => p.role === targetRole);
}

export function findPackageById(id) {
  if (!id) return null;
  if (SUBSCRIPTION_CATALOG[id]) return SUBSCRIPTION_CATALOG[id];
  const normalized = String(id).trim().toLowerCase();
  // Backward compatibility for legacy teacher IDs if any deep link/cache holds them
  if (normalized === 'gv-khoi-dau' || normalized === 'gv-1m') return SUBSCRIPTION_CATALOG['gv-1m'];
  if (normalized === 'gv-chuyen-nghiep' || normalized === 'gv-6m') return SUBSCRIPTION_CATALOG['gv-6m'];
  if (normalized === 'gv-toan-nang' || normalized === 'gv-12m') return SUBSCRIPTION_CATALOG['gv-12m'];
  if (normalized === 'hs-ve-dich' || normalized === 'hs-12m') return SUBSCRIPTION_CATALOG['hs-12m'];
  if (normalized === 'hs-tinh-anh' || normalized === 'hs-6m') return SUBSCRIPTION_CATALOG['hs-6m'];
  if (normalized === 'hs-hoc-ba-3m' || normalized === 'hs-3m') return SUBSCRIPTION_CATALOG['hs-3m'];
  if (normalized === 'hs-hoc-ba' || normalized === 'hs-1m') return SUBSCRIPTION_CATALOG['hs-1m'];
  return null;
}

export function isPackageAllowedForRole(accountRole, pkg) {
  if (!pkg) return false;
  const normalizedRole = accountRole === 'teacher' ? 'teacher' : 'student';
  const pkgRole = pkg.role === 'teacher' ? 'teacher' : 'student';
  return normalizedRole === pkgRole;
}

export function resolveAccountRole({ user = null, userRole = null, pro = null } = {}) {
  if (userRole === 'teacher' || userRole === 'student') return userRole;
  if (user?.role === 'teacher' || user?.role === 'student') return user.role;
  const metaRole = getUserRole(user);
  if (metaRole === 'teacher' || metaRole === 'student') return metaRole;
  if (pro?.isPro && pro?.isTeacherPro === true) return 'teacher';
  return 'student';
}

function parseExpiryMs(expiry) {
  if (!expiry) return null;
  if (typeof expiry?.toMillis === 'function') return expiry.toMillis();
  const ms = typeof expiry === 'number' ? expiry : Date.parse(expiry);
  return Number.isFinite(ms) ? ms : null;
}

function hasActiveSubQuota(subQuota, expectedPlanName) {
  if (!subQuota || subQuota.planName !== expectedPlanName) return false;
  if (!subQuota.expiry) return true;
  const expMs = parseExpiryMs(subQuota.expiry);
  return expMs !== null && expMs > Date.now();
}

/**
 * Resolve strict role-separated entitlements for Student vs Teacher.
 * - Student VIP unlocks student VIP modules only; NEVER unlocks Teacher VIP.
 * - Teacher FREE stays on FREE (1 class, 40 students, 3 exams, 5 OMR sheets, 20 bank items) and sees FREE VirtualExamRoom.
 * - Teacher VIP (399k/tháng) unlocks all Teacher VIP tools + VirtualExamRoom VIP + DocStudio.
 */
export function resolveEntitlements({
  user = null,
  pro = null,
  tier = null,
  userRole = null,
  subQuota = null,
} = {}) {
  const admin = Boolean(checkIsAdmin(user));
  const role = resolveAccountRole({ user, userRole, pro });
  const isTeacherAccount = role === 'teacher';
  const subIsPro = hasActiveSubQuota(subQuota, 'PRO') && (!pro?.serverChecked || Boolean(subQuota?.expiry));
  const subIsVip = hasActiveSubQuota(subQuota, 'VIP') && (!pro?.serverChecked || Boolean(subQuota?.expiry));

  const hasTeacherProSignal = Boolean(
    pro?.isPro && pro?.isTeacherPro !== false
  ) || Boolean(
    isTeacherAccount && !pro?.source && (tier?.key === 'pro' || subIsPro)
  );

  const hasStudentVipSignal = Boolean(
    pro?.isStudentVip ||
    (!isTeacherAccount && (tier?.key === 'vip' || subIsVip))
  );

  const isTeacherVip = admin || hasTeacherProSignal;
  const isStudentVip = admin || hasStudentVipSignal;
  // Teacher VIP also receives student-side AI/Exam access (so teachers can preview/demo VIP exams & DocStudio)
  const hasVipAccess = isTeacherVip || isStudentVip;

  let virtualExamPlan = 'FREE';
  if (admin) virtualExamPlan = 'ADMIN';
  else if (isTeacherVip || isStudentVip) virtualExamPlan = 'VIP';
  else if (!isTeacherAccount && subQuota?.planName === 'PRO') virtualExamPlan = 'PRO';

  return {
    role,
    isAdmin: admin,
    isTeacherAccount,
    isTeacherVip,
    isStudentVip,
    hasVipAccess,
    virtualExamPlan,
    maxHearts: hasVipAccess ? VIP_STUDENT_LIMITS.maxHearts : FREE_STUDENT_LIMITS.maxHearts,
    teacherLimits: isTeacherVip ? null : FREE_TEACHER_LIMITS,
    planLabel: admin
      ? 'ADMIN'
      : isTeacherVip
      ? 'GIÁO VIÊN VIP'
      : isStudentVip
      ? 'HỌC SINH VIP'
      : isTeacherAccount
      ? 'GIÁO VIÊN FREE'
      : 'HỌC SINH FREE',
  };
}

export function getTeacherQuotaStatus({
  classesCount = 0,
  examsCount = 0,
  bankCount = 0,
  omrUsed = 0,
  wordImportUsed = 0,
  manualEntryUsed = 0,
  isTeacherVip = false,
} = {}) {
  if (isTeacherVip) {
    return {
      isVip: true,
      canCreateClass: true,
      canCreateExam: true,
      canAddBankQuestion: true,
      canUseOmr: true,
      canImportWord: true,
      canUseManualEntry: true,
      remainingOmr: Infinity,
      remainingClasses: Infinity,
      remainingExams: Infinity,
      remainingBank: Infinity,
      remainingWordImports: Infinity,
      remainingManualEntries: Infinity,
    };
  }
  const remainingClasses = Math.max(0, FREE_TEACHER_LIMITS.maxClasses - Number(classesCount || 0));
  const remainingExams = Math.max(0, FREE_TEACHER_LIMITS.maxExams - Number(examsCount || 0));
  const remainingBank = Math.max(0, FREE_TEACHER_LIMITS.maxBankQuestions - Number(bankCount || 0));
  const remainingOmr = Math.max(0, FREE_TEACHER_LIMITS.maxOmrTrialSheets - Number(omrUsed || 0));
  const remainingWordImports = Math.max(0, FREE_TEACHER_LIMITS.maxWordImports - Number(wordImportUsed || 0));
  const remainingManualEntries = Math.max(0, FREE_TEACHER_LIMITS.maxManualEntries - Number(manualEntryUsed || 0));
  return {
    isVip: false,
    canCreateClass: remainingClasses > 0,
    canCreateExam: remainingExams > 0 && remainingManualEntries > 0,
    canAddBankQuestion: remainingBank > 0 && remainingManualEntries > 0,
    canUseOmr: remainingOmr > 0,
    canImportWord: remainingWordImports > 0,
    canUseManualEntry: remainingManualEntries > 0,
    remainingOmr,
    remainingClasses,
    remainingExams,
    remainingBank,
    remainingWordImports,
    remainingManualEntries,
  };
}

export function canUseStudentFeature(entitlements, featureKey) {
  if (STUDENT_FREE_EXCLUDED_MODULES.includes(featureKey)) return true;
  if (!entitlements) return false;
  return Boolean(entitlements.hasVipAccess);
}

/* ============================================================
   OMR Free Trial Counter (persisted per uid + floor from Firestore papers)
   ============================================================ */
const memoryOmrCounters = new Map();

function omrStorageKey(uid) {
  return `elec-omr-trial-count:${uid || 'guest'}`;
}

export function getOmrTrialUsed(uid, floorTotal = 0) {
  const safeFloor = Math.max(0, Number(floorTotal) || 0);
  const key = omrStorageKey(uid);
  const memVal = memoryOmrCounters.get(key) || 0;
  let stored = memVal;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = Number(localStorage.getItem(key) || '0');
      stored = Math.max(stored, Number.isFinite(raw) ? raw : 0);
    } catch { /* ignore */ }
  }
  const best = Math.max(stored, safeFloor);
  memoryOmrCounters.set(key, best);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && best > stored) {
    try {
      localStorage.setItem(key, String(best));
    } catch { /* ignore */ }
  }
  return best;
}

export function incrementOmrTrialUsed(uid, delta = 1, floorTotal = 0) {
  const key = omrStorageKey(uid);
  const cur = getOmrTrialUsed(uid, floorTotal);
  const next = cur + Math.max(0, Number(delta) || 0);
  memoryOmrCounters.set(key, next);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, String(next));
    } catch { /* ignore */ }
  }
  emitTeacherTrialQuotaChange();
  return next;
}

export function resetOmrTrialCounterForTest(uid) {
  const key = omrStorageKey(uid);
  memoryOmrCounters.delete(key);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
}

export function getOmrTrialRemaining(uid, isTeacherVip, floorTotal = 0) {
  if (isTeacherVip) return Infinity;
  const used = getOmrTrialUsed(uid, floorTotal);
  return Math.max(0, FREE_TEACHER_LIMITS.maxOmrTrialSheets - used);
}

/* ============================================================
   Word Import (10) & Manual Entry (30) Free Trial Counters
   ============================================================ */
export const TEACHER_TRIAL_QUOTA_EVENT = 'cs-teacher-trial-quota-change';
const memoryWordImportCounters = new Map();
const memoryManualEntryCounters = new Map();

function wordImportStorageKey(uid) {
  return `elec-word-import-trial-count:${uid || 'guest'}`;
}

function manualEntryStorageKey(uid) {
  return `elec-manual-entry-trial-count:${uid || 'guest'}`;
}

function emitTeacherTrialQuotaChange() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(TEACHER_TRIAL_QUOTA_EVENT));
  } catch { /* ignore */ }
}

function readPersistentCounter(memMap, key, floorTotal = 0) {
  const safeFloor = Math.max(0, Number(floorTotal) || 0);
  const memVal = memMap.get(key) || 0;
  let stored = memVal;
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = Number(localStorage.getItem(key) || '0');
      stored = Math.max(stored, Number.isFinite(raw) ? raw : 0);
    } catch { /* ignore */ }
  }
  const best = Math.max(stored, safeFloor);
  memMap.set(key, best);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && best > stored) {
    try {
      localStorage.setItem(key, String(best));
    } catch { /* ignore */ }
  }
  return best;
}

function incrementPersistentCounter(memMap, key, delta = 1, floorTotal = 0) {
  const cur = readPersistentCounter(memMap, key, floorTotal);
  const next = cur + Math.max(0, Number(delta) || 0);
  memMap.set(key, next);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, String(next));
    } catch { /* ignore */ }
  }
  emitTeacherTrialQuotaChange();
  return next;
}

function resetPersistentCounter(memMap, key) {
  memMap.delete(key);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
  emitTeacherTrialQuotaChange();
}

export function getWordImportTrialUsed(uid, floorTotal = 0) {
  return readPersistentCounter(memoryWordImportCounters, wordImportStorageKey(uid), floorTotal);
}

export function incrementWordImportTrialUsed(uid, delta = 1, floorTotal = 0) {
  return incrementPersistentCounter(memoryWordImportCounters, wordImportStorageKey(uid), delta, floorTotal);
}

export function resetWordImportTrialCounterForTest(uid) {
  resetPersistentCounter(memoryWordImportCounters, wordImportStorageKey(uid));
}

export function getWordImportTrialRemaining(uid, isTeacherVip, floorTotal = 0) {
  if (isTeacherVip) return Infinity;
  const used = getWordImportTrialUsed(uid, floorTotal);
  return Math.max(0, FREE_TEACHER_LIMITS.maxWordImports - used);
}

export function getManualEntryTrialUsed(uid, floorTotal = 0) {
  return readPersistentCounter(memoryManualEntryCounters, manualEntryStorageKey(uid), floorTotal);
}

export function incrementManualEntryTrialUsed(uid, delta = 1, floorTotal = 0) {
  return incrementPersistentCounter(memoryManualEntryCounters, manualEntryStorageKey(uid), delta, floorTotal);
}

export function resetManualEntryTrialCounterForTest(uid) {
  resetPersistentCounter(memoryManualEntryCounters, manualEntryStorageKey(uid));
}

export function getManualEntryTrialRemaining(uid, isTeacherVip, floorTotal = 0) {
  if (isTeacherVip) return Infinity;
  const used = getManualEntryTrialUsed(uid, floorTotal);
  return Math.max(0, FREE_TEACHER_LIMITS.maxManualEntries - used);
}
