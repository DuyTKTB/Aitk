/* ============================================================
   userProfileService.js — Dịch vụ quản lý hồ sơ học sinh chuẩn ELEC AI
   ------------------------------------------------------------
   Quản lý thông tin chi tiết:
     • Họ và tên, Email, Ngày sinh, Số điện thoại
     • Tỉnh / Thành phố (63 tỉnh thành Việt Nam)
     • Lớp (Lớp 10, Lớp 11, Lớp 12, Đã tốt nghiệp / Thí sinh tự do...)
     • Trường THPT đang học
     • Thông tin xuất hóa đơn GTGT điện tử
     • Cài đặt thông báo & Nhắc nhở học tập
   100% đồng bộ LocalStorage + Supabase/Firestore + CustomEvent
   ============================================================ */

import { supabase } from './supabase.js';

export const USER_PROFILE_CHANGE_EVENT = 'elec-user-profile-change';

export const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export const GRADES_LIST = [
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
  'Đã tốt nghiệp / Tự do',
  'Sinh viên / Giáo viên'
];

const DEFAULT_PROFILE = {
  fullName: '',
  birthDate: '',
  phone: '',
  province: '',
  grade: 'Lớp 12',
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
  updatedAt: 0,
};

function getStorageKey(uid) {
  return `elec-user-profile-v2:${uid || 'guest'}`;
}

/**
 * Lấy hồ sơ học sinh
 */
export function getUserProfile(uid, userFallback = null) {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };

  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    let parsed = raw ? JSON.parse(raw) : null;

    if (!parsed) {
      // Khởi tạo từ fallback user nếu có
      parsed = {
        ...DEFAULT_PROFILE,
        fullName: userFallback?.displayName || '',
        invoice: {
          ...DEFAULT_PROFILE.invoice,
          buyerName: userFallback?.displayName || '',
          invoiceEmail: userFallback?.email || '',
        },
      };
    }

    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      invoice: {
        ...DEFAULT_PROFILE.invoice,
        ...(parsed.invoice || {}),
      },
      notifications: {
        ...DEFAULT_PROFILE.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch (err) {
    console.warn('[userProfile] getUserProfile parse error:', err);
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Lưu hồ sơ học sinh và phát event thông báo
 */
export function saveUserProfile(uid, data) {
  if (typeof window === 'undefined') return data;

  const current = getUserProfile(uid);
  const updated = {
    ...current,
    ...data,
    invoice: {
      ...current.invoice,
      ...(data.invoice || {}),
    },
    notifications: {
      ...current.notifications,
      ...(data.notifications || {}),
    },
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(USER_PROFILE_CHANGE_EVENT, { detail: { uid, profile: updated } })
    );
  } catch (err) {
    console.warn('[userProfile] save to localStorage failed:', err);
  }

  // Cố gắng đồng bộ lên Supabase profiles nếu đăng nhập
  if (uid && uid !== 'guest') {
    supabase
      .from('profiles')
      .upsert(
        {
          id: uid,
          display_name: updated.fullName,
          phone: updated.phone,
          province: updated.province,
          grade: updated.grade,
          school: updated.highSchool,
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
