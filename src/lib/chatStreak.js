/* ============================================================
   chatStreak.js — Logic Chuỗi Chat Cá nhân, Bạn bè & Lớp học
   - Giờ Việt Nam (UTC+7)
   - Kiểm tra tin nhắn hợp lệ
   - Tính toán chuỗi bạn bè & chuỗi lớp
   - Giới hạn tần suất nhắc bạn / nhắc lớp
   ============================================================ */

const VN_OFFSET_MS = 7 * 3600 * 1000;

/**
 * Lấy khóa ngày YYYY-MM-DD theo giờ Việt Nam (UTC+7)
 */
export function getVietnamDateKey(ts = Date.now()) {
  const d = new Date(ts + VN_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Lấy số giờ còn lại trong ngày hôm nay theo giờ Việt Nam (UTC+7)
 */
export function getVietnamHoursRemaining(ts = Date.now()) {
  const d = new Date(ts + VN_OFFSET_MS);
  const hour = d.getUTCHours();
  const min = d.getUTCMinutes();
  const sec = d.getUTCSeconds();
  const msToday = (hour * 3600 + min * 60 + sec) * 1000;
  const msTotalInDay = 24 * 3600 * 1000;
  const msRemaining = Math.max(0, msTotalInDay - msToday);
  return msRemaining / (3600 * 1000);
}

/**
 * Kiểm tra xem có đang ở trong khung giờ khẩn cấp (< 3 giờ trước nửa đêm UTC+7) không
 */
export function isUrgentCountdown(ts = Date.now()) {
  return getVietnamHoursRemaining(ts) < 3;
}

/**
 * Định dạng thời gian đếm ngược còn lại: ví dụ "2h 45m" hoặc "45m"
 */
export function formatHoursRemaining(ts = Date.now()) {
  const hrs = getVietnamHoursRemaining(ts);
  const totalMin = Math.floor(hrs * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Kiểm tra tin nhắn có đủ điều kiện tính chuỗi không:
 * - Tối thiểu 3 ký tự (không tính khoảng trắng thừa)
 * - Không trùng tin nhắn liền trước
 * - Không phải chỉ toàn sticker (:smile:, :laugh:,...) hoặc ảnh thuần túy
 */
export function isValidStreakMessage(text, lastText = '') {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  if (lastText && trimmed.toLowerCase() === String(lastText).trim().toLowerCase()) return false;

  // Kiểm tra nếu tin chỉ chứa sticker định dạng :abc:
  const isOnlyStickers = /^(:[a-z0-9_-]+:\s*)+$/i.test(trimmed);
  if (isOnlyStickers) return false;

  return true;
}

/* ============================================================
   CHUỖI BẠN BÈ (1-1 FRIEND STREAK)
   ============================================================ */

/**
 * Khởi tạo hoặc cập nhật trạng thái chuỗi bạn bè
 * @param {Object} streakData - { count, record, lastDate, bothCompletedDate, todayParticipants: { [uid]: boolean } }
 * @param {string} senderUid
 * @param {string} peerUid
 * @param {number} ts
 */
export function processFriendStreakUpdate(streakData = null, senderUid, peerUid, ts = Date.now()) {
  const today = getVietnamDateKey(ts);
  const yesterday = getVietnamDateKey(ts - 864e5);

  const prev = streakData && typeof streakData === 'object' ? streakData : {
    count: 0,
    record: 0,
    lastDate: '',
    bothCompletedDate: '',
    todayParticipants: {},
  };

  const currentDay = prev.lastDate;
  let count = Number(prev.count) || 0;
  let record = Number(prev.record) || count;
  let participants = { ...(prev.todayParticipants || {}) };
  let bothCompletedDate = prev.bothCompletedDate || '';

  // Nếu đã sang ngày mới
  if (currentDay !== today) {
    // Nếu ngày cũ trước hôm qua -> chuỗi bị đứt
    if (currentDay && currentDay !== yesterday) {
      count = 0;
    }
    participants = {};
  }

  // Đánh dấu người này đã gửi tin hợp lệ hôm nay
  participants[senderUid] = true;

  // Kiểm tra nếu cả hai người đều đã nhắn hôm nay
  const bothActive = !!(participants[senderUid] && participants[peerUid]);
  let updatedCount = count;

  // Nếu cả 2 đều nhắn và ngày hôm nay chưa được chốt cộng điểm chuỗi
  if (bothActive && bothCompletedDate !== today) {
    updatedCount = count + 1;
    bothCompletedDate = today;
    if (updatedCount > record) record = updatedCount;
  }

  return {
    count: updatedCount,
    record,
    lastDate: today,
    bothCompletedDate,
    todayParticipants: participants,
    bothActive,
  };
}

/**
 * Trả về thông tin trạng thái chuỗi bạn bè hiển thị trên UI
 */
export function getFriendStreakStatus(streakData, myUid, peerUid, peerName = 'Bạn') {
  const today = getVietnamDateKey();
  const yesterday = getVietnamDateKey(Date.now() - 864e5);
  const data = streakData || { count: 0, record: 0, lastDate: '', todayParticipants: {} };

  const isToday = data.lastDate === today;
  const isYesterday = data.lastDate === yesterday;
  const participants = isToday ? (data.todayParticipants || {}) : {};

  const myDone = !!participants[myUid];
  const peerDone = !!participants[peerUid];
  const bothDone = myDone && peerDone;

  const count = (isToday || isYesterday) ? (Number(data.count) || 0) : 0;
  const record = Math.max(Number(data.record) || 0, count);
  const urgent = isUrgentCountdown() && !bothDone;
  const remainingTimeStr = formatHoursRemaining();

  let statusText = '';
  if (bothDone) {
    statusText = 'Cả hai đã giữ chuỗi hôm nay 🔥';
  } else if (myDone && !peerDone) {
    statusText = `Bạn đã nhắn · Chờ ${peerName} nhắn`;
  } else if (!myDone && peerDone) {
    statusText = `${peerName} đã nhắn · Chờ bạn nhắn`;
  } else {
    statusText = 'Cả hai chưa nhắn hôm nay';
  }

  return {
    count,
    record,
    myDone,
    peerDone,
    bothDone,
    urgent,
    remainingTimeStr,
    statusText,
  };
}

const memStorage = new Map();

export function clearNudgeStorageForTesting() {
  memStorage.clear();
  try {
    if (typeof localStorage !== 'undefined') localStorage.clear();
  } catch { /* ignore */ }
}
const safeGetItem = (k) => {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(k);
  } catch { /* ignore */ }
  return memStorage.get(k) || null;
};
const safeSetItem = (k, v) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(k, v);
      return;
    }
  } catch { /* ignore */ }
  memStorage.set(k, String(v));
};

/* ============================================================
   GIỚI HẠN NHẮC BẠN (NUDGE RATE LIMIT)
   ============================================================ */

export function canNudgeFriend(friendUid, ts = Date.now()) {
  if (!friendUid) return false;
  const today = getVietnamDateKey(ts);
  const key = `cs_nudge_friend_${friendUid}_${today}`;
  return !safeGetItem(key);
}

export function recordFriendNudge(friendUid, ts = Date.now()) {
  if (!friendUid) return;
  const today = getVietnamDateKey(ts);
  const key = `cs_nudge_friend_${friendUid}_${today}`;
  safeSetItem(key, String(ts));
}

/* ============================================================
   CHUỖI LỚP HỌC (CLASSROOM STREAK)
   ============================================================ */

/**
 * Tính số thành viên tối thiểu cần hoạt động trong ngày để lớp giữ chuỗi
 */
export function calculateClassTarget(memberCount = 1) {
  const count = Math.max(1, Number(memberCount) || 1);
  if (count <= 2) return count;
  if (count <= 5) return 2;
  // Khoảng 35% sĩ số lớp, tối thiểu 3 bạn
  return Math.max(3, Math.ceil(count * 0.35));
}

/**
 * Kiểm tra xem số ngày chuỗi có phải là mốc đặc biệt cần chúc mừng pháo giấy không
 */
export function isStreakMilestone(days) {
  const n = Number(days);
  return [3, 7, 14, 30, 50, 100, 200, 365].includes(n);
}

/**
 * Trả về thông tin trạng thái chuỗi lớp
 */
export function getClassStreakStatus(classObj, myUid) {
  const today = getVietnamDateKey();
  const yesterday = getVietnamDateKey(Date.now() - 864e5);
  const streak = classObj?.streak || { count: 0, record: 0, lastDate: '', todayActive: [] };

  const isToday = streak.lastDate === today;
  const isYesterday = streak.lastDate === yesterday;

  const count = (isToday || isYesterday) ? (Number(streak.count) || 0) : 0;
  const record = Math.max(Number(streak.record) || 0, count);

  const activeMembers = isToday ? (Array.isArray(streak.todayActive) ? streak.todayActive : []) : [];
  const memberCount = Number(classObj?.memberCount) || 1;
  const target = calculateClassTarget(memberCount);
  const activeCount = activeMembers.length;
  const completedToday = activeCount >= target;
  const remainingNeeded = Math.max(0, target - activeCount);
  const urgent = isUrgentCountdown() && !completedToday;
  const remainingTimeStr = formatHoursRemaining();
  const iAmActive = activeMembers.includes(myUid);

  return {
    count,
    record,
    target,
    activeCount,
    completedToday,
    remainingNeeded,
    urgent,
    remainingTimeStr,
    iAmActive,
    activeMembers,
  };
}

export function canNudgeClassMember(memberUid, classId, ts = Date.now()) {
  if (!memberUid || !classId) return false;
  const today = getVietnamDateKey(ts);
  const key = `cs_nudge_class_${classId}_${memberUid}_${today}`;
  return !safeGetItem(key);
}

export function recordClassMemberNudge(memberUid, classId, ts = Date.now()) {
  if (!memberUid || !classId) return;
  const today = getVietnamDateKey(ts);
  const key = `cs_nudge_class_${classId}_${memberUid}_${today}`;
  safeSetItem(key, String(ts));
}

/**
 * Hiệu ứng pháo giấy nhẹ nhàng khi đạt mốc chuỗi kỷ lục
 */
export function fireStreakConfetti() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '99999';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#f97316', '#ea580c', '#38bdf8', '#34c759', '#eab308', '#ec4899', '#a855f7'];
  const particles = Array.from({ length: 65 }, () => ({
    x: window.innerWidth * (0.3 + Math.random() * 0.4),
    y: window.innerHeight * 0.4,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 0.9) * 14,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    vrot: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));

  const start = performance.now();
  const frame = (now) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rot += p.vrot;
      p.opacity = Math.max(0, 1 - elapsed / 2200);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (elapsed < 2400) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(frame);
}
