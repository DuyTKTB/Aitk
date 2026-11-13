/* ============================================================
   userProfileService.js — Dịch vụ quản lý hồ sơ người dùng chuẩn ELEC AI
   ------------------------------------------------------------
   Quản lý thông tin chi tiết:
     • Họ và tên, Email, Ngày sinh, Số điện thoại
     • Tỉnh / Thành phố (63 tỉnh thành Việt Nam)
     • Lớp (Lớp 10, Lớp 11, Lớp 12, Đã tốt nghiệp / Tự do...)
     • Trường THPT / Cơ sở công tác
     • Thông tin xuất hóa đơn GTGT điện tử
     • Cài đặt thông báo & Nhắc nhở học tập
     • Kết quả khảo sát cá nhân hóa AI (Onboarding Survey)
   Đồng bộ 2 chiều: LocalStorage + Firestore (users/{uid}) + Supabase + aiMemory
   ============================================================ */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { supabase } from './supabase.js';
import { saveProfile as saveAiMemoryProfile } from './aiMemory.js';
import { splitFullName, joinNameParts } from './authValidation.js';

export const USER_PROFILE_CHANGE_EVENT = 'elec-user-profile-change';

export const VIETNAM_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Hải Phòng',
  'Huế',
  'Đà Nẵng',
  'Cần Thơ',
  'An Giang',
  'Bắc Ninh',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Tĩnh',
  'Hưng Yên',
  'Khánh Hòa',
  'Lai Châu',
  'Lạng Sơn',
  'Lào Cai',
  'Lâm Đồng',
  'Nghệ An',
  'Ninh Bình',
  'Phú Thọ',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sơn La',
  'Tây Ninh',
  'Thái Nguyên',
  'Thanh Hóa',
  'Tuyên Quang',
  'Vĩnh Long',
];

const LEGACY_PROVINCE_MAP = {
  'Thành phố Hà Nội': 'Hà Nội',
  'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Thành phố Hải Phòng': 'Hải Phòng',
  'Thành phố Huế': 'Huế',
  'Thừa Thiên Huế': 'Huế',
  'Thành phố Đà Nẵng': 'Đà Nẵng',
  'Thành phố Cần Thơ': 'Cần Thơ',
  'Hải Dương': 'Hải Phòng',
  'Quảng Nam': 'Đà Nẵng',
  'Bình Dương': 'TP. Hồ Chí Minh',
  'Bà Rịa - Vũng Tàu': 'TP. Hồ Chí Minh',
  'Sóc Trăng': 'Cần Thơ',
  'Hậu Giang': 'Cần Thơ',
  'Hà Giang': 'Tuyên Quang',
  'Yên Bái': 'Lào Cai',
  'Bắc Kạn': 'Thái Nguyên',
  'Vĩnh Phúc': 'Phú Thọ',
  'Hòa Bình': 'Phú Thọ',
  'Bắc Giang': 'Bắc Ninh',
  'Thái Bình': 'Hưng Yên',
  'Hà Nam': 'Ninh Bình',
  'Nam Định': 'Ninh Bình',
  'Quảng Bình': 'Quảng Trị',
  'Kon Tum': 'Quảng Ngãi',
  'Bình Định': 'Gia Lai',
  'Ninh Thuận': 'Khánh Hòa',
  'Đắk Nông': 'Lâm Đồng',
  'Bình Thuận': 'Lâm Đồng',
  'Phú Yên': 'Đắk Lắk',
  'Bình Phước': 'Đồng Nai',
  'Long An': 'Tây Ninh',
  'Bến Tre': 'Vĩnh Long',
  'Trà Vinh': 'Vĩnh Long',
  'Tiền Giang': 'Đồng Tháp',
  'Kiên Giang': 'An Giang',
  'Bạc Liêu': 'Cà Mau',
};

export function normalizeProvinceName(raw = '') {
  const clean = String(raw ?? '').trim();
  if (!clean) return '';
  return LEGACY_PROVINCE_MAP[clean] || clean;
}

export const GRADES_LIST = [
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
  'Đã tốt nghiệp / Tự do',
  'Sinh viên / Giáo viên',
];

export const DEFAULT_SURVEY = {
  completed: false,
  completedAt: 0,
  skippedAt: 0,
  role: '',
  goal: '',
  subjects: [],
  examBlock: '',
  currentLevel: '',
  aiStyle: '',
  weakAreas: [],
  dailyMinutes: 30,
};

export const DEFAULT_PROFILE = {
  lastName: '',
  firstName: '',
  fullName: '',
  birthDate: '',
  phone: '',
  province: '',
  ward: '',
  addressDetail: '',
  grade: '',
  highSchool: '',
  invoice: {
    buyerName: '',
    address: '',
    companyName: '',
    taxCode: '',
    invoiceEmail: '',
  },
  notifications: {
    dailyStreak: true,
    examRoomAlerts: true,
    newExamAlerts: true,
    weeklyReport: true,
  },
  survey: { ...DEFAULT_SURVEY },
  updatedAt: 0,
};

function getStorageKey(uid) {
  return `elec-user-profile-v2:${uid || 'guest'}`;
}

/**
 * Chuẩn hóa hồ sơ người dùng — KHÔNG bao giờ điền sẵn dữ liệu giả của người khác.
 * Chỉ lấy fallback hợp lệ từ chính tài khoản đang đăng nhập (displayName, email).
 */
export function normalizeUserProfile(parsed = null, userFallback = null) {
  const src = parsed && typeof parsed === 'object' ? parsed : {};
  const fallbackName = String(userFallback?.displayName || '').trim();
  const fallbackEmail = String(userFallback?.email || '').trim();
  const rawSurvey = src.survey && typeof src.survey === 'object' ? src.survey : {};

  const rawLast = String(src.lastName ?? '').trim();
  const rawFirst = String(src.firstName ?? '').trim();
  const combinedFromParts = joinNameParts(rawLast, rawFirst);
  const resolvedFullName = String(src.fullName || combinedFromParts || fallbackName || '').trim();
  const split = splitFullName(resolvedFullName);

  return {
    ...DEFAULT_PROFILE,
    ...src,
    lastName: rawLast || split.lastName,
    firstName: rawFirst || split.firstName,
    fullName: resolvedFullName,
    birthDate: String(src.birthDate || '').trim(),
    phone: String(src.phone || '').trim(),
    province: normalizeProvinceName(src.province),
    ward: String(src.ward || '').trim(),
    addressDetail: String(src.addressDetail || '').trim(),
    grade: String(src.grade || '').trim(),
    highSchool: String(src.highSchool || '').trim(),
    invoice: {
      ...DEFAULT_PROFILE.invoice,
      ...(src.invoice || {}),
      buyerName: String(src.invoice?.buyerName || resolvedFullName || fallbackName || '').trim(),
      invoiceEmail: String(src.invoice?.invoiceEmail || fallbackEmail || '').trim(),
    },
    notifications: {
      ...DEFAULT_PROFILE.notifications,
      ...(src.notifications || {}),
    },
    survey: {
      ...DEFAULT_SURVEY,
      ...rawSurvey,
      subjects: Array.isArray(rawSurvey.subjects) ? rawSurvey.subjects : [],
      weakAreas: Array.isArray(rawSurvey.weakAreas) ? rawSurvey.weakAreas : [],
      dailyMinutes: Number(rawSurvey.dailyMinutes) || 30,
    },
    updatedAt: Number(src.updatedAt) || 0,
  };
}

/**
 * Kiểm tra hợp lệ thông tin cá nhân trước khi lưu.
 */
export function validateProfileFields({ fullName = '', birthDate = '', phone = '' } = {}) {
  const errors = {};
  const cleanName = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (cleanName.length < 2) {
    errors.fullName = 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).';
  } else if (cleanName.length > 60) {
    errors.fullName = 'Họ và tên tối đa 60 ký tự.';
  }

  const cleanPhone = String(phone || '').replace(/[\s.-]/g, '').trim();
  if (cleanPhone && !/^(0|\+?84)[0-9]{8,10}$/.test(cleanPhone)) {
    errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
  }

  const cleanDob = String(birthDate || '').trim();
  if (cleanDob) {
    const year = Number(cleanDob.slice(0, 4));
    const currentYear = new Date().getFullYear();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDob) || year < 1945 || year > currentYear - 5) {
      errors.birthDate = 'Ngày sinh không hợp lệ.';
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    cleaned: {
      fullName: cleanName,
      phone: cleanPhone,
      birthDate: cleanDob,
    },
  };
}

/**
 * Đồng bộ dữ liệu profile & khảo sát sang bộ nhớ AI (aiMemory.js)
 */
function syncProfileToAiMemory(uid, profile) {
  if (!uid || uid === 'guest' || !profile) return;
  try {
    const s = profile.survey || {};
    const patch = {};
    if (profile.grade) patch.grade = profile.grade;
    if (s.role) patch.role = s.role;
    if (s.goal) patch.goal = s.goal;
    if (Array.isArray(s.subjects) && s.subjects.length) patch.subjects = s.subjects;
    if (s.examBlock) patch.examBlock = s.examBlock;
    if (s.currentLevel) patch.currentLevel = s.currentLevel;
    if (s.aiStyle) patch.aiStyle = s.aiStyle;
    if (s.dailyMinutes) patch.dailyMinutes = s.dailyMinutes;
    if (Object.keys(patch).length > 0) {
      saveAiMemoryProfile(uid, patch);
    }
  } catch { /* ignore */ }
}

/**
 * Lấy hồ sơ người dùng từ LocalStorage (nhanh, đồng bộ)
 */
export function getUserProfile(uid, userFallback = null) {
  if (typeof window === 'undefined') return normalizeUserProfile(null, userFallback);

  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    const parsed = raw ? JSON.parse(raw) : null;
    return normalizeUserProfile(parsed, userFallback);
  } catch (err) {
    console.warn('[userProfile] getUserProfile parse error:', err);
    return normalizeUserProfile(null, userFallback);
  }
}

/**
 * Kéo hồ sơ mới nhất từ Firestore (users/{uid}) về LocalStorage khi đăng nhập / đổi thiết bị.
 */
export async function syncUserProfileFromCloud(uid, userFallback = null) {
  if (typeof window === 'undefined' || !uid || uid === 'guest') {
    return getUserProfile(uid, userFallback);
  }

  const localProf = getUserProfile(uid, userFallback);
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      return localProf;
    }

    const cloudDoc = snap.data() || {};
    const cloudProfile = cloudDoc.profile && typeof cloudDoc.profile === 'object' ? cloudDoc.profile : {};
    const cloudUpdatedAt = Number(cloudProfile.updatedAt || cloudDoc.profileUpdatedAt || 0);

    // Gộp dữ liệu: ưu tiên bản mới hơn, nhưng luôn giữ lại giá trị có thật nếu 1 bên còn trống
    const preferCloud = cloudUpdatedAt >= (Number(localProf.updatedAt) || 0);
    const mergedSurvey = {
      ...DEFAULT_SURVEY,
      ...(preferCloud ? localProf.survey : cloudProfile.survey),
      ...(preferCloud ? cloudProfile.survey : localProf.survey),
    };
    if (localProf.survey?.completed || cloudProfile.survey?.completed) {
      mergedSurvey.completed = true;
      mergedSurvey.completedAt = Math.max(
        Number(localProf.survey?.completedAt) || 0,
        Number(cloudProfile.survey?.completedAt) || 0
      );
    }
    if (localProf.survey?.skippedAt || cloudProfile.survey?.skippedAt) {
      mergedSurvey.skippedAt = Math.max(
        Number(localProf.survey?.skippedAt) || 0,
        Number(cloudProfile.survey?.skippedAt) || 0
      );
    }

    const pick = (a, b) => (preferCloud ? (a || b || '') : (b || a || ''));
    const merged = normalizeUserProfile(
      {
        ...localProf,
        ...cloudProfile,
        lastName: pick(cloudProfile.lastName, localProf.lastName),
        firstName: pick(cloudProfile.firstName, localProf.firstName),
        fullName: pick(cloudProfile.fullName || cloudDoc.displayName, localProf.fullName),
        birthDate: pick(cloudProfile.birthDate, localProf.birthDate),
        phone: pick(cloudProfile.phone, localProf.phone),
        province: pick(cloudProfile.province, localProf.province),
        ward: pick(cloudProfile.ward, localProf.ward),
        addressDetail: pick(cloudProfile.addressDetail, localProf.addressDetail),
        grade: pick(cloudProfile.grade, localProf.grade),
        highSchool: pick(cloudProfile.highSchool || cloudDoc.school, localProf.highSchool),
        invoice: {
          ...localProf.invoice,
          ...(cloudProfile.invoice || {}),
        },
        notifications: {
          ...localProf.notifications,
          ...(cloudProfile.notifications || {}),
        },
        survey: mergedSurvey,
        updatedAt: Math.max(cloudUpdatedAt, Number(localProf.updatedAt) || 0),
      },
      userFallback
    );

    localStorage.setItem(getStorageKey(uid), JSON.stringify(merged));
    syncProfileToAiMemory(uid, merged);
    window.dispatchEvent(
      new CustomEvent(USER_PROFILE_CHANGE_EVENT, { detail: { uid, profile: merged } })
    );
    return merged;
  } catch (err) {
    console.warn('[userProfile] syncUserProfileFromCloud error:', err?.message || err);
    return localProf;
  }
}

/**
 * Lưu hồ sơ người dùng và đồng bộ lên Firestore + Supabase + aiMemory + CustomEvent
 */
export function saveUserProfile(uid, data, opts = {}) {
  if (typeof window === 'undefined') return normalizeUserProfile(data);

  const current = getUserProfile(uid);
  const now = Date.now();
  const nextData = { ...data };
  if (('lastName' in nextData || 'firstName' in nextData) && !('fullName' in nextData)) {
    nextData.fullName = joinNameParts(
      nextData.lastName ?? current.lastName,
      nextData.firstName ?? current.firstName
    );
  }
  const updated = normalizeUserProfile({
    ...current,
    ...nextData,
    invoice: {
      ...current.invoice,
      ...(data.invoice || {}),
    },
    notifications: {
      ...current.notifications,
      ...(data.notifications || {}),
    },
    survey: {
      ...current.survey,
      ...(data.survey || {}),
    },
    updatedAt: now,
  });

  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));
    syncProfileToAiMemory(uid, updated);
    window.dispatchEvent(
      new CustomEvent(USER_PROFILE_CHANGE_EVENT, { detail: { uid, profile: updated } })
    );
  } catch (err) {
    console.warn('[userProfile] save to localStorage failed:', err);
  }

  // Đồng bộ lên Firestore users/{uid} (không đụng trường `role` để luôn hợp lệ firestore.rules)
  if (!opts.skipCloud && uid && uid !== 'guest') {
    setDoc(
      doc(db, 'users', uid),
      {
        ...(updated.fullName ? { displayName: updated.fullName } : {}),
        ...(updated.highSchool ? { school: updated.highSchool } : {}),
        profile: updated,
        profileUpdatedAt: now,
      },
      { merge: true }
    ).catch((err) => {
      console.warn('[userProfile] sync to Firestore error:', err?.message || err);
    });

    // Đồng bộ best-effort sang Supabase profiles (các cột cơ bản nếu tồn tại)
    supabase
      .from('profiles')
      .upsert(
        {
          id: uid,
          display_name: updated.fullName || undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (error) {
          console.warn('[userProfile] sync to supabase error:', error.message);
        }
      })
      .catch(() => {});
  }

  return updated;
}
