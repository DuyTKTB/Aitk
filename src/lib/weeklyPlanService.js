/* ============================================================
   weeklyPlanService.js — Quản lý Kế hoạch học tập 7 ngày thông minh
   Chuẩn 9Study Bento RPG: Chọn mục tiêu, phân chia 7 ngày,
   Focus Pomodoro, nhắc nhở nhiệm vụ hàng ngày qua Trợ lý ELEC AI.
   ============================================================ */

const STORAGE_PREFIX = 'elec_weekly_plan_v1_';

export const WEEKDAYS = [
  { key: 'mon', label: 'T2', name: 'Thứ hai' },
  { key: 'tue', label: 'T3', name: 'Thứ ba' },
  { key: 'wed', label: 'T4', name: 'Thứ tư' },
  { key: 'thu', label: 'T5', name: 'Thứ năm' },
  { key: 'fri', label: 'T6', name: 'Thứ sáu' },
  { key: 'sat', label: 'T7', name: 'Thứ bảy' },
  { key: 'sun', label: 'CN', name: 'Chủ nhật' },
];

/**
 * Lấy chỉ số ngày trong tuần (0: T2 ... 6: CN)
 */
export function getCurrentDayIndex() {
  const d = new Date().getDay(); // 0 is Sunday, 1 is Monday
  return d === 0 ? 6 : d - 1;
}

/**
 * Sinh danh sách ngày thực tế trong tuần hiện tại
 */
export function getWeekDates() {
  const now = new Date();
  const currentDay = getCurrentDayIndex(); // 0: Mon ... 6: Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDay);
  monday.setHours(0, 0, 0, 0);

  return WEEKDAYS.map((w, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return {
      ...w,
      dateNum: d.getDate(),
      monthNum: d.getMonth() + 1,
      isToday: idx === currentDay,
      isoDate: d.toISOString().split('T')[0],
    };
  });
}

/**
 * Tải kế hoạch tuần của người dùng
 */
export function getWeeklyPlan(uid = 'guest') {
  if (typeof window === 'undefined') return { tasks: [], focusMinutes: 25 };
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tasks)) return parsed;
    }
  } catch (err) {
    console.warn('[WeeklyPlan] Failed to parse local plan:', err);
  }

  // Khởi tạo mặc định
  return {
    targetAspirationId: null,
    focusMinutes: 25,
    tasks: [],
  };
}

/**
 * Lưu kế hoạch tuần
 */
export function saveWeeklyPlan(uid = 'guest', plan) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(plan));
    window.dispatchEvent(new CustomEvent('elec-weekly-plan-changed', { detail: plan }));
  } catch (err) {
    console.warn('[WeeklyPlan] Failed to save plan:', err);
  }
}

/**
 * Thêm công việc mới vào ngày cụ thể
 */
export function addWeeklyTask(uid = 'guest', dayIndex, text, subject = 'Hóa học', durationMin = 15) {
  const current = getWeeklyPlan(uid);
  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dayIndex: Math.max(0, Math.min(6, dayIndex)),
    text: String(text).trim(),
    subject: subject || 'Hóa học',
    durationMin: Number(durationMin) || 15,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const nextTasks = [...current.tasks, newTask];
  const nextPlan = { ...current, tasks: nextTasks };
  saveWeeklyPlan(uid, nextPlan);
  return newTask;
}

/**
 * Chuyển đổi trạng thái hoàn thành công việc
 */
export function toggleWeeklyTask(uid = 'guest', taskId) {
  const current = getWeeklyPlan(uid);
  const nextTasks = current.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  const nextPlan = { ...current, tasks: nextTasks };
  saveWeeklyPlan(uid, nextPlan);
  return nextPlan;
}

/**
 * Xóa công việc
 */
export function deleteWeeklyTask(uid = 'guest', taskId) {
  const current = getWeeklyPlan(uid);
  const nextTasks = current.tasks.filter((t) => t.id !== taskId);
  const nextPlan = { ...current, tasks: nextTasks };
  saveWeeklyPlan(uid, nextPlan);
  return nextPlan;
}

/**
 * Lấy các việc cần làm hôm nay (chưa hoàn thành) để nhắc nhở
 */
export function getTodayPendingTasks(uid = 'guest') {
  const todayIdx = getCurrentDayIndex();
  const current = getWeeklyPlan(uid);
  return current.tasks.filter((t) => t.dayIndex === todayIdx && !t.completed);
}

/**
 * Tự động tạo kế hoạch 7 ngày mẫu theo mục tiêu tuyển sinh
 */
export function generateAiWeeklyPlan(uid = 'guest', targetLabel = 'Mục tiêu Đại học') {
  const current = getWeeklyPlan(uid);
  const templateTasks = [
    { dayIndex: 0, text: 'Ôn tập Este - Lipit & cấu trúc phân tử', subject: 'Hóa học', durationMin: 15 },
    { dayIndex: 1, text: 'Giải đề thi trắc nghiệm Đúng/Sai 4 ý môn Hóa', subject: 'Hóa học', durationMin: 25 },
    { dayIndex: 2, text: 'Rà soát 5 câu sai trong Sổ lỗi sai', subject: 'KHTN', durationMin: 15 },
    { dayIndex: 3, text: 'Luyện phương pháp bảo toàn electron & khối lượng', subject: 'Hóa học', durationMin: 20 },
    { dayIndex: 4, text: 'Luyện tập câu hỏi trả lời ngắn Phần III', subject: 'Toán', durationMin: 25 },
    { dayIndex: 5, text: 'Thi thử 1 đề bấm giờ 50 phút Phòng thi ảo', subject: 'Thi thử', durationMin: 50 },
    { dayIndex: 6, text: 'Tổng kết tuần & xem dự đoán điểm Elo', subject: 'Tổng kết', durationMin: 15 },
  ];

  const now = Date.now();
  const newTasks = templateTasks.map((tpl, i) => ({
    id: `task_ai_${now}_${i}`,
    dayIndex: tpl.dayIndex,
    text: tpl.text,
    subject: tpl.subject,
    durationMin: tpl.durationMin,
    completed: false,
    createdAt: new Date().toISOString(),
  }));

  const nextPlan = {
    ...current,
    targetAspirationId: targetLabel,
    tasks: newTasks,
  };
  saveWeeklyPlan(uid, nextPlan);
  return nextPlan;
}
