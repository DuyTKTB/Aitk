
/**
 * Danh sách thành tích.
 * Mỗi achievement có hàm `check(stats)` trả về true/false.
 * Stats object có cấu trúc:
 * {
 *   totalCorrect: number,     // tổng số câu đúng
 *   totalWrong: number,       // tổng số câu sai
 *   maxStreak: number,        // streak cao nhất
 *   mastered: number,         // số nguyên tố đã thành thạo
 *   streak: number,           // chuỗi ngày học liên tiếp
 *   dailyCount: number,       // số lần hoàn thành Daily Challenge
 *   bestTimeAttack: {         // điểm Time Attack tốt nhất (hoặc null)
 *     score: number,
 *     total: number,
 *     date: number
 *   } | null
 * }
 */
export const ACHIEVEMENTS = [
  {
    id: 'first-step',
    icon: '👣',
    title: 'Bước đầu tiên',
    desc: 'Trả lời đúng câu hỏi đầu tiên',
    check: (s) => s.totalCorrect >= 1,
  },
  {
    id: 'apprentice',
    icon: '📖',
    title: 'Học trò chăm chỉ',
    desc: 'Trả lời đúng 50 câu',
    check: (s) => s.totalCorrect >= 50,
  },
  {
    id: 'scholar',
    icon: '🎓',
    title: 'Học giả',
    desc: 'Trả lời đúng 200 câu',
    check: (s) => s.totalCorrect >= 200,
  },
  {
    id: 'master',
    icon: '🏆',
    title: 'Bậc thầy',
    desc: 'Trả lời đúng 500 câu',
    check: (s) => s.totalCorrect >= 500,
  },
  {
    id: 'perfect-10',
    icon: '💯',
    title: 'Hoàn hảo',
    desc: 'Đúng 10 câu liên tiếp',
    check: (s) => s.maxStreak >= 10,
  },
  {
    id: 'perfect-25',
    icon: '🔥',
    title: 'Không thể cản',
    desc: 'Đúng 25 câu liên tiếp',
    check: (s) => s.maxStreak >= 25,
  },
  {
    id: 'perfect-50',
    icon: '⚡',
    title: 'Siêu sao hóa học',
    desc: 'Đúng 50 câu liên tiếp',
    check: (s) => s.maxStreak >= 50,
  },
  {
    id: 'streak-3',
    icon: '📅',
    title: 'Đều đặn',
    desc: 'Học 3 ngày liên tiếp',
    check: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    icon: '🗓',
    title: 'Tuần lễ vàng',
    desc: 'Học 7 ngày liên tiếp',
    check: (s) => s.streak >= 7,
  },
  {
    id: 'streak-30',
    icon: '💎',
    title: 'Kiên trì',
    desc: 'Học 30 ngày liên tiếp',
    check: (s) => s.streak >= 30,
  },
  {
    id: 'mastery-10',
    icon: '🌟',
    title: 'Khởi đầu tốt',
    desc: 'Thành thạo 10 nguyên tố',
    check: (s) => s.mastered >= 10,
  },
  {
    id: 'mastery-30',
    icon: '💫',
    title: 'Bảng tuần hoàn thu nhỏ',
    desc: 'Thành thạo 30 nguyên tố',
    check: (s) => s.mastered >= 30,
  },
  {
    id: 'mastery-60',
    icon: '✨',
    title: 'Chuyên gia hóa học',
    desc: 'Thành thạo 60 nguyên tố',
    check: (s) => s.mastered >= 60,
  },
  {
    id: 'mastery-all',
    icon: '👑',
    title: 'Vua bảng tuần hoàn',
    desc: 'Thành thạo tất cả nguyên tố',
    check: (s) => s.mastered >= 118,
  },
  {
    id: 'speed-demon',
    icon: '⚡',
    title: 'Thần tốc',
    desc: 'Time Attack: đúng 20 câu trong 90 giây',
    check: (s) => s.bestTimeAttack && s.bestTimeAttack.score >= 20,
  },
  {
    id: 'time-lord',
    icon: '⏱',
    title: 'Chúa tể thời gian',
    desc: 'Time Attack: đúng 35 câu trong 90 giây',
    check: (s) => s.bestTimeAttack && s.bestTimeAttack.score >= 35,
  },
  {
    id: 'daily-7',
    icon: '🌅',
    title: 'Bền bỉ',
    desc: 'Hoàn thành 7 Daily Challenge',
    check: (s) => s.dailyCount >= 7,
  },
  {
    id: 'daily-30',
    icon: '🌄',
    title: 'Không bỏ cuộc',
    desc: 'Hoàn thành 30 Daily Challenge',
    check: (s) => s.dailyCount >= 30,
  },
];

/* ============================================================
   LEVEL SYSTEM
   ============================================================ */

/**
 * Danh sách 10 cấp độ.
 * Mỗi level có:
 * - lvl: số cấp
 * - xp: XP tối thiểu để đạt cấp này
 * - title: tên cấp
 * - icon: emoji hiển thị
 */
export const LEVELS = [
  { lvl: 1,  xp: 0,     title: 'Nhập môn',      icon: '🌱' },
  { lvl: 2,  xp: 100,   title: 'Tân binh',      icon: '🌿' },
  { lvl: 3,  xp: 250,   title: 'Học viên',      icon: '📗' },
  { lvl: 4,  xp: 500,   title: 'Chiến binh',    icon: '⚔️' },
  { lvl: 5,  xp: 900,   title: 'Hiệp sĩ',       icon: '🛡️' },
  { lvl: 6,  xp: 1500,  title: 'Chuyên gia',    icon: '🔬' },
  { lvl: 7,  xp: 2400,  title: 'Bậc thầy',      icon: '🧪' },
  { lvl: 8,  xp: 3800,  title: 'Đại sư',        icon: '⚗️' },
  { lvl: 9,  xp: 6000,  title: 'Huyền thoại',   icon: '🌟' },
  { lvl: 10, xp: 10000, title: 'Thần hóa học',  icon: '👑' },
];

/**
 * Tính cấp độ hiện tại từ XP.
 * @param {number} xp - tổng XP
 * @returns {{
 *   current: { lvl, xp, title, icon },
 *   next: { lvl, xp, title, icon } | null,
 *   progress: number   // 0-100% tiến độ đến cấp tiếp theo
 * }}
 */
export function getLevel(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1] || null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  const progress = next
    ? Math.min(100, ((xp - current.xp) / (next.xp - current.xp)) * 100)
    : 100;

  return { current, next, progress };
}

/**
 * Kiểm tra các achievement mới được mở khóa.
 * @param {Object} stats - stats object (xem ACHIEVEMENTS ở trên)
 * @param {string[]} unlockedIds - danh sách id đã mở khóa
 * @returns {Array} danh sách achievement mới (object đầy đủ)
 */
export function checkNewAchievements(stats, unlockedIds) {
  return ACHIEVEMENTS.filter(
    (a) => !unlockedIds.includes(a.id) && a.check(stats)
  );
}