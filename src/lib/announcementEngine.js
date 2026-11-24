/* ============================================================
   announcementEngine.js — Động cơ Phát sóng Thông báo Toàn hệ thống
   ------------------------------------------------------------
   • 6 giao diện màu sắc (Cobalt, Emerald, Amber, Crimson, Obsidian, Aurora)
   • Phân nhóm đối tượng (Tất cả / Học sinh / Giáo viên / Free / VIP-PRO)
   • Lịch phát sóng tự động (startAt / endAt) + đồng hồ đếm ngược live
   • Hỗ trợ chế độ Dải băng đầu trang (banner) & Popup nổi bật (modal)
   • Phiên bản thông báo (`version`) cho phép phát lại cả với người đã đóng
   ============================================================ */

export const ANNOUNCEMENT_THEMES = {
  cobalt: {
    id: 'cobalt',
    name: 'Xanh ELEC Pro',
    bg: 'linear-gradient(90deg, #1d4ed8 0%, #4338ca 52%, #6d28d9 100%)',
    accent: '#93c5fd',
  },
  emerald: {
    id: 'emerald',
    name: 'Xanh Ngọc Ra mắt',
    bg: 'linear-gradient(90deg, #047857 0%, #0d9488 52%, #0284c7 100%)',
    accent: '#6ee7b7',
  },
  amber: {
    id: 'amber',
    name: 'Cam Vàng Ưu đãi',
    bg: 'linear-gradient(90deg, #b45309 0%, #ea580c 52%, #e11d48 100%)',
    accent: '#fde68a',
  },
  crimson: {
    id: 'crimson',
    name: 'Đỏ Cảnh báo Khẩn',
    bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 55%, #be123c 100%)',
    accent: '#fecaca',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Đen Sang trọng VIP',
    bg: 'linear-gradient(90deg, #0f172a 0%, #1e293b 52%, #312e81 100%)',
    accent: '#c7d2fe',
  },
  aurora: {
    id: 'aurora',
    name: 'Cực quang Sự kiện',
    bg: 'linear-gradient(90deg, #7c3aed 0%, #db2777 52%, #f59e0b 100%)',
    accent: '#fbcfe8',
  },
};

export const ANNOUNCEMENT_AUDIENCES = [
  { id: 'all',      label: 'Toàn bộ người dùng' },
  { id: 'students', label: 'Chỉ Học sinh' },
  { id: 'teachers', label: 'Chỉ Giáo viên' },
  { id: 'free',     label: 'Chỉ tài khoản Miễn phí' },
  { id: 'vip',      label: 'Chỉ thành viên VIP / PRO' },
];

export const ANNOUNCEMENT_QUICK_LINKS = [
  { label: 'Phòng thi ảo',  href: '#virtual-exams' },
  { label: 'Doc Studio',    href: '#doc-studio' },
  { label: 'Lộ trình học',  href: '#roadmap' },
  { label: 'Nâng cấp VIP',  href: '#profile' },
  { label: 'Quản lý lớp',   href: '#classroom' },
  { label: 'Lab Vật lí 3D', href: '#physics-lab' },
];

export const ANNOUNCEMENT_MASCOT_IMAGES = [
  { id: 'celebrate', label: 'Ăn mừng',     src: '/img/elec/elec-celebrate.png' },
  { id: 'saiyan',    label: 'Bứt phá',     src: '/img/elec/elec-super-saiyan.png' },
  { id: 'cool',      label: 'Ngầu PRO',    src: '/img/elec/elec-cool.png' },
  { id: 'wink',      label: 'Nháy mắt',    src: '/img/elec/elec-wink.png' },
  { id: 'hello',     label: 'Xin chào',    src: '/img/elec/elec-hello.png' },
  { id: 'happy',     label: 'Vui vẻ',      src: '/img/elec/elec-happy.png' },
];

/**
 * Kiểm tra & làm sạch nguồn ảnh thông báo (chặn URL độc hại & giới hạn kích thước lưu Firestore).
 */
export function sanitizeAnnouncementImage(src, maxDataUrlChars = 450000) {
  const s = String(src || '').trim();
  if (!s) return '';
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(s)) {
    return s.length <= maxDataUrlChars ? s : '';
  }
  if (/^(https?:\/\/|\/img\/)/i.test(s) && s.length <= 2048) {
    return s;
  }
  return '';
}

export const ANNOUNCEMENT_PRESETS = [
  {
    id: 'exam-launch',
    label: 'Kỳ thi thử mới',
    badge: '⭐ Kỳ thi mới',
    theme: 'cobalt',
    display: 'banner',
    audience: 'students',
    text: 'Phòng thi ảo vừa mở bộ đề thi thử THPTQG & ĐGNL 2026 bám sát cấu trúc GDPT mới!',
    ctaText: 'Vào thi ngay',
    link: '#virtual-exams',
    showCountdown: false,
    dismissible: true,
  },
  {
    id: 'vip-promo',
    label: 'Ưu đãi VIP / PRO',
    badge: '🔥 Ưu đãi giới hạn',
    theme: 'amber',
    display: 'modal',
    audience: 'free',
    text: 'Ưu đãi đặc biệt: Nâng cấp ELEC VIP / GV PRO hôm nay để mở khóa toàn bộ Doc Studio Pro & Phòng thi không giới hạn!',
    ctaText: 'Nhận ưu đãi ngay',
    link: '#profile',
    showCountdown: true,
    dismissible: true,
  },
  {
    id: 'feature-update',
    label: 'Tính năng mới',
    badge: '⚡ Bản cập nhật mới',
    theme: 'emerald',
    display: 'banner',
    audience: 'all',
    text: 'Doc Studio Pro vừa ra mắt: Tải Word/PowerPoint/PDF → AI tạo Sơ đồ tư duy, Podcast 2 giọng & Flashcard FSRS!',
    ctaText: 'Trải nghiệm ngay',
    link: '#doc-studio',
    showCountdown: false,
    dismissible: true,
  },
  {
    id: 'maintenance-notice',
    label: 'Báo lịch bảo trì',
    badge: '⚠️ Thông báo bảo trì',
    theme: 'crimson',
    display: 'banner',
    audience: 'all',
    text: 'Hệ thống sẽ bảo trì nâng cấp máy chủ trong 15 phút vào 23:00 tối nay. Vui lòng lưu bài trước giờ bảo trì!',
    ctaText: '',
    link: '',
    showCountdown: true,
    dismissible: false,
  },
  {
    id: 'teacher-pro',
    label: 'Riêng Giáo viên',
    badge: '🎓 Dành cho Giáo viên',
    theme: 'obsidian',
    display: 'banner',
    audience: 'teachers',
    text: 'Khu vực Giáo viên đã có thêm Bộ công cụ Lớp học (Vòng quay, Sơ đồ chỗ ngồi, Đo tiếng ồn) & Phân tích đề thi chuẩn Moodle!',
    ctaText: 'Mở Quản lý lớp',
    link: '#classroom',
    showCountdown: false,
    dismissible: true,
  },
];

export function resolveAnnouncementTheme(themeId) {
  return ANNOUNCEMENT_THEMES[themeId] || ANNOUNCEMENT_THEMES.cobalt;
}

/**
 * Kiểm tra người dùng hiện tại có nằm trong đối tượng nhận thông báo hay không.
 */
export function matchesAnnouncementAudience(audience = 'all', { role = 'student', isVip = false, isAdmin = false } = {}) {
  if (isAdmin) return true; // Admin luôn thấy để kiểm tra hiển thị
  const aud = String(audience || 'all');
  if (aud === 'all') return true;
  if (aud === 'teachers') return role === 'teacher';
  if (aud === 'students') return role !== 'teacher';
  if (aud === 'vip') return Boolean(isVip);
  if (aud === 'free') return !isVip;
  return true;
}

/**
 * Kiểm tra thông báo có đang nằm trong khung giờ phát sóng hay không.
 */
export function isWithinAnnouncementSchedule({ startAt = '', endAt = '' } = {}, nowMs = Date.now()) {
  if (startAt) {
    const startMs = new Date(startAt).getTime();
    if (Number.isFinite(startMs) && nowMs < startMs) {
      return { active: false, reason: 'scheduled', remainingMs: startMs - nowMs };
    }
  }
  if (endAt) {
    const endMs = new Date(endAt).getTime();
    if (Number.isFinite(endMs) && nowMs >= endMs) {
      return { active: false, reason: 'expired', remainingMs: 0 };
    }
    if (Number.isFinite(endMs)) {
      return { active: true, reason: 'live', remainingMs: Math.max(0, endMs - nowMs) };
    }
  }
  return { active: true, reason: 'live', remainingMs: 0 };
}

/**
 * Định dạng đồng hồ đếm ngược gọn gàng (vd: "2 ngày 04:15:09" hoặc "04:15:09").
 */
export function formatCountdownLabel(remainingMs) {
  const sec = Math.max(0, Math.floor((Number(remainingMs) || 0) / 1000));
  if (sec <= 0) return '';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  const hms = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return d > 0 ? `${d} ngày ${hms}` : hms;
}

/**
 * Quyết định tổng hợp có hiển thị thông báo cho user hiện tại không.
 */
export function evaluateAnnouncementVisibility(settings = {}, viewer = {}, nowMs = Date.now()) {
  if (!settings?.announcementEnabled) return { visible: false, reason: 'disabled', remainingMs: 0 };
  const hasText = Boolean(String(settings?.announcementText || '').trim());
  const hasImg = Boolean(sanitizeAnnouncementImage(settings?.announcementImage));
  if (!hasText && !hasImg) return { visible: false, reason: 'empty', remainingMs: 0 };

  const sched = isWithinAnnouncementSchedule(
    { startAt: settings.announcementStartAt, endAt: settings.announcementEndAt },
    nowMs
  );
  if (!sched.active) return { visible: false, reason: sched.reason, remainingMs: sched.remainingMs };

  const audOk = matchesAnnouncementAudience(settings.announcementAudience, viewer);
  if (!audOk) return { visible: false, reason: 'audience-mismatch', remainingMs: sched.remainingMs };

  return { visible: true, reason: 'live', remainingMs: sched.remainingMs };
}

/**
 * Tạo khóa dismiss duy nhất theo nội dung + ảnh + phiên bản phát sóng (`announcementVersion`).
 */
export function getAnnouncementDismissKey(settings = {}) {
  const ver = Number(settings?.announcementVersion) || 1;
  const disp = String(settings?.announcementDisplay || 'banner');
  const text = String(settings?.announcementText || '').trim();
  const img = String(settings?.announcementImage || '').trim();
  const imgSig = img ? `${img.length}:${img.slice(-16)}` : '';
  return `v${ver}::${disp}::${text}::${imgSig}`;
}
