/* ============================================================
   focusSessionStore.js — Động cơ Tập Trung Pomodoro & Flowmodoro Toàn Cục
   - Đồng bộ 2 chiều thời gian thực giữa:
     1) Phòng Tập Trung Toàn Cảnh (#pomodoro / #tap-trung)
     2) Con Chat 3 cột (PetWidget - Kế hoạch tuần & Focus còn lại)
     3) Thanh Đồng hồ Mini nổi di chuyển được toàn trang
   - Hỗ trợ đầy đủ tính năng chuẩn 9Study + nâng cấp vượt trội:
     * 2 chế độ đếm: Pomodoro (đếm ngược) & Flowmodoro (đếm tiến tự do)
     * 3 kiểu đồng hồ: Vòng tròn (ring) / Đồng hồ số (digital) / Flip Clock (flip)
     * 8 khung cảnh nền không gian học + Video nền YouTube
     * 5 âm báo hết giờ (Web Audio API sạch, có nghe thử)
     * Lịch sử phút tập trung theo ngày, chuỗi ngày Focus Streak, Ghi chú phiên
   ============================================================ */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'elec_focus_session_v3';

export const FOCUS_THEMES = [
  {
    id: 'aurora-indigo',
    name: 'Đêm Cực Quang',
    tag: '9Study Vibe',
    accent: '#6366f1',
    bg: 'radial-gradient(circle at 18% 20%, rgba(99, 102, 241, 0.42), transparent 46%), radial-gradient(circle at 82% 76%, rgba(56, 189, 248, 0.34), transparent 50%), linear-gradient(145deg, #090b2a 0%, #111648 52%, #1a1752 100%)',
  },
  {
    id: 'tokyo-rain',
    name: 'Mưa Cửa Sổ Tokyo',
    tag: 'Chill Mưa',
    accent: '#38bdf8',
    bg: 'radial-gradient(circle at 25% 15%, rgba(56, 189, 248, 0.34), transparent 45%), radial-gradient(circle at 75% 85%, rgba(14, 165, 233, 0.25), transparent 52%), linear-gradient(160deg, #071324 0%, #0d223c 54%, #102a47 100%)',
  },
  {
    id: 'warm-library',
    name: 'Thư Viện Cổ Điển',
    tag: 'Ấm Áp',
    accent: '#f59e0b',
    bg: 'radial-gradient(circle at 76% 24%, rgba(251, 191, 36, 0.28), transparent 45%), radial-gradient(circle at 20% 80%, rgba(217, 119, 6, 0.24), transparent 52%), linear-gradient(150deg, #1b1109 0%, #2a1a0e 52%, #1d120a 100%)',
  },
  {
    id: 'seoul-cafe',
    name: 'Cà Phê Seoul',
    tag: 'Study Cafe',
    accent: '#fb923c',
    bg: 'radial-gradient(circle at 22% 25%, rgba(251, 146, 60, 0.28), transparent 48%), radial-gradient(circle at 82% 72%, rgba(244, 114, 182, 0.22), transparent 48%), linear-gradient(145deg, #1c1318 0%, #2d1c22 52%, #1f1419 100%)',
  },
  {
    id: 'forest-mist',
    name: 'Rừng Thông Tĩnh Lặng',
    tag: 'Thiên Nhiên',
    accent: '#10b981',
    bg: 'radial-gradient(circle at 20% 18%, rgba(16, 185, 129, 0.34), transparent 46%), radial-gradient(circle at 80% 82%, rgba(52, 211, 153, 0.22), transparent 50%), linear-gradient(155deg, #061b17 0%, #0b2d26 54%, #09211d 100%)',
  },
  {
    id: 'sunset-ocean',
    name: 'Hoàng Hôn Biển Xanh',
    tag: 'Thư Giãn',
    accent: '#f43f5e',
    bg: 'radial-gradient(circle at 50% 24%, rgba(251, 113, 133, 0.34), transparent 48%), radial-gradient(circle at 80% 78%, rgba(99, 102, 241, 0.3), transparent 50%), linear-gradient(155deg, #1f102e 0%, #371b48 48%, #171c45 100%)',
  },
  {
    id: 'dawn-campus',
    name: 'Bình Minh Giảng Đường',
    tag: 'Sáng Tươi',
    accent: '#2563eb',
    isLight: true,
    bg: 'radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.32), transparent 48%), radial-gradient(circle at 84% 78%, rgba(129, 140, 248, 0.26), transparent 50%), linear-gradient(145deg, #eef6ff 0%, #e0edff 50%, #edf2ff 100%)',
  },
  {
    id: 'oled-minimal',
    name: 'Đêm Tối Tối Giản',
    tag: 'Deep Focus',
    accent: '#3b82f6',
    bg: 'radial-gradient(circle at 50% 45%, rgba(37, 99, 235, 0.16), transparent 54%), linear-gradient(180deg, #040711 0%, #090e1c 100%)',
  },
];

export const FOCUS_MASCOTS = [
  { id: 'fighting', label: 'Elec Quyết tâm', src: '/img/elec/elec-fighting.png' },
  { id: 'super-saiyan', label: 'Elec Siêu Saiyan', src: '/img/elec/elec-super-saiyan.png' },
  { id: 'cool', label: 'Elec Học Bá', src: '/img/elec/elec-cool.png' },
  { id: 'think', label: 'Elec Đăm chiêu', src: '/img/elec/elec-think.png' },
  { id: 'happy', label: 'Elec Tươi vui', src: '/img/elec/elec-happy.png' },
  { id: 'celebrate', label: 'Elec Thủ khoa', src: '/img/elec/elec-celebrate.png' },
];

export const FOCUS_CHIMES = [
  { id: 'soft_chime', label: 'Chuông nhẹ' },
  { id: 'digital_beep', label: 'Đồng hồ số' },
  { id: 'bell', label: 'Chuông ngân' },
  { id: 'gentle_ding', label: 'Ting nhẹ' },
  { id: 'classic', label: 'Cổ điển 3 nốt' },
];

export const DEFAULT_FOCUS_SETTINGS = {
  clockStyle: 'ring', // 'ring' | 'digital' | 'flip'
  countMode: 'pomodoro', // 'pomodoro' | 'flowmodoro'
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartPomodoro: false,
  soundEnabled: true,
  soundType: 'soft_chime',
  soundVolume: 0.7,
  dailyGoalMinutes: 120,
};

export function getTodayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatFocusClock(secs) {
  const s = Math.max(0, Math.floor(Number(secs) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function playFocusChime(type = 'soft_chime', volume = 0.65) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const vol = Math.max(0.05, Math.min(1, Number(volume) || 0.65)) * 0.4;
    const playTone = (freq, startOffset, dur, wave = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + dur + 0.05);
    };

    if (type === 'digital_beep') {
      playTone(1220, 0, 0.1, 'square');
      playTone(1220, 0.15, 0.1, 'square');
      playTone(1540, 0.3, 0.22, 'square');
    } else if (type === 'bell') {
      playTone(523.25, 0, 1.1, 'triangle');
      playTone(1046.5, 0.02, 0.85, 'sine');
    } else if (type === 'gentle_ding') {
      playTone(880, 0, 0.55, 'sine');
      playTone(1318.5, 0.12, 0.65, 'sine');
    } else if (type === 'classic') {
      playTone(880, 0, 0.18, 'sine');
      playTone(1108.7, 0.2, 0.18, 'sine');
      playTone(1318.5, 0.4, 0.35, 'sine');
    } else {
      // soft_chime
      playTone(659.25, 0, 0.42, 'sine');
      playTone(880, 0.18, 0.52, 'sine');
      playTone(1046.5, 0.38, 0.72, 'sine');
    }
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 1800);
  } catch { /* ignore */ }
}

function readSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function calcStreakDays(minutesByDay) {
  let streak = 0;
  const now = Date.now();
  for (let i = 0; i < 365; i++) {
    const k = getTodayKey(now - i * 86400000);
    if ((minutesByDay[k] || 0) > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

class FocusSessionStore {
  constructor() {
    const saved = readSavedState();
    const settings = { ...DEFAULT_FOCUS_SETTINGS, ...(saved.settings || {}) };
    const mode = saved.mode || 'focus';
    const totalSeconds = this._getModeDuration(mode, settings);

    let status = saved.status || 'idle';
    let secondsLeft = typeof saved.secondsLeft === 'number' ? saved.secondsLeft : totalSeconds;
    let elapsedSeconds = typeof saved.elapsedSeconds === 'number' ? saved.elapsedSeconds : 0;
    let endAt = saved.endAt || null;
    let startedAt = saved.startedAt || null;

    // Khôi phục chính xác thời gian nếu trang vừa reload khi đang chạy
    if (status === 'running') {
      if (settings.countMode === 'flowmodoro' && mode === 'focus' && startedAt) {
        elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      } else if (endAt) {
        const rem = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        secondsLeft = rem;
        if (rem === 0) {
          status = 'idle';
          endAt = null;
        }
      }
    }

    const minutesByDay = saved.minutesByDay && typeof saved.minutesByDay === 'object' ? saved.minutesByDay : {};
    const sessionsByDay = saved.sessionsByDay && typeof saved.sessionsByDay === 'object' ? saved.sessionsByDay : {};

    this.state = {
      status, // 'idle' | 'running' | 'paused'
      mode, // 'focus' | 'short_break' | 'long_break'
      secondsLeft,
      totalSeconds,
      elapsedSeconds,
      endAt,
      startedAt,
      cycle: typeof saved.cycle === 'number' ? saved.cycle : 0,
      settings,
      themeId: saved.themeId || 'aurora-indigo',
      mascotId: saved.mascotId || 'fighting',
      bgDim: typeof saved.bgDim === 'number' ? saved.bgDim : 0.42,
      activeTaskId: saved.activeTaskId || null,
      activeTaskText: saved.activeTaskText || '',
      minutesByDay,
      sessionsByDay,
      notes: Array.isArray(saved.notes) ? saved.notes : [],
      taskPomodoros: saved.taskPomodoros && typeof saved.taskPomodoros === 'object' ? saved.taskPomodoros : {},
      streakDays: calcStreakDays(minutesByDay),
      lastCompletedAt: null,
    };

    this.listeners = new Set();
    this.tickInterval = null;
    this.lastMinuteCommitTs = status === 'running' ? Date.now() : null;

    if (status === 'running') {
      this._startTicker();
    }
  }

  _getModeDuration(mode, settings) {
    if (mode === 'short_break') return Math.max(1, settings.shortBreakMinutes) * 60;
    if (mode === 'long_break') return Math.max(1, settings.longBreakMinutes) * 60;
    return Math.max(1, settings.workMinutes) * 60;
  }

  getState() {
    return this.state;
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  _persist() {
    try {
      const s = this.state;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          status: s.status,
          mode: s.mode,
          secondsLeft: s.secondsLeft,
          elapsedSeconds: s.elapsedSeconds,
          endAt: s.endAt,
          startedAt: s.startedAt,
          cycle: s.cycle,
          settings: s.settings,
          themeId: s.themeId,
          mascotId: s.mascotId,
          bgDim: s.bgDim,
          activeTaskId: s.activeTaskId,
          activeTaskText: s.activeTaskText,
          minutesByDay: s.minutesByDay,
          sessionsByDay: s.sessionsByDay,
          notes: s.notes.slice(0, 40),
          taskPomodoros: s.taskPomodoros,
        })
      );
    } catch { /* ignore */ }
  }

  _emit(persist = true) {
    const snap = { ...this.state };
    this.state = snap;
    if (persist) this._persist();
    this.listeners.forEach((cb) => {
      try { cb(snap); } catch { /* ignore */ }
    });
    // Đồng bộ sự kiện cho các widget cũ trên toàn trang
    try {
      window.dispatchEvent(
        new CustomEvent('elec-focus-sync', {
          detail: {
            running: snap.status === 'running',
            seconds: snap.settings.countMode === 'flowmodoro' && snap.mode === 'focus' ? snap.elapsedSeconds : snap.secondsLeft,
            mode: snap.mode,
            countMode: snap.settings.countMode,
          },
        })
      );
    } catch { /* ignore */ }
  }

  _startTicker() {
    if (this.tickInterval) return;
    this.lastMinuteCommitTs = Date.now();
    this.tickInterval = setInterval(() => this._tick(), 500);
  }

  _stopTicker() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.lastMinuteCommitTs = null;
  }

  _creditFocusedMinutes(mins) {
    if (mins <= 0) return;
    const key = getTodayKey();
    const nextMap = { ...this.state.minutesByDay, [key]: (this.state.minutesByDay[key] || 0) + mins };
    this.state.minutesByDay = nextMap;
    this.state.streakDays = calcStreakDays(nextMap);
  }

  _tick() {
    if (this.state.status !== 'running') {
      this._stopTicker();
      return;
    }

    const now = Date.now();

    // Cộng từng phút tập trung thực tế vào thống kê hôm nay (giống heartbeat 9Study)
    if (this.state.mode === 'focus' && this.lastMinuteCommitTs && now - this.lastMinuteCommitTs >= 60000) {
      const gained = Math.floor((now - this.lastMinuteCommitTs) / 60000);
      this.lastMinuteCommitTs += gained * 60000;
      this._creditFocusedMinutes(gained);
    }

    if (this.state.settings.countMode === 'flowmodoro' && this.state.mode === 'focus') {
      const nextElapsed = Math.max(0, Math.floor((now - (this.state.startedAt || now)) / 1000));
      if (nextElapsed !== this.state.elapsedSeconds) {
        this.state.elapsedSeconds = nextElapsed;
        this._emit(nextElapsed % 15 === 0);
      }
      return;
    }

    const rem = Math.max(0, Math.round(((this.state.endAt || now) - now) / 1000));
    if (rem !== this.state.secondsLeft) {
      this.state.secondsLeft = rem;
      this._emit(rem % 15 === 0 || rem === 0);
    }

    if (rem <= 0) {
      this._handlePhaseComplete();
    }
  }

  _handlePhaseComplete() {
    this._stopTicker();
    const prevMode = this.state.mode;
    const cfg = this.state.settings;

    if (cfg.soundEnabled) {
      playFocusChime(cfg.soundType, cfg.soundVolume);
    }

    if (prevMode === 'focus') {
      const key = getTodayKey();
      const nextSessions = {
        ...this.state.sessionsByDay,
        [key]: (this.state.sessionsByDay[key] || 0) + 1,
      };
      this.state.sessionsByDay = nextSessions;
      this.state.cycle = (this.state.cycle || 0) + 1;
      this.state.lastCompletedAt = Date.now();

      // Cộng +1 pomodoro cho task đang ghim
      if (this.state.activeTaskId) {
        const prevTask = this.state.taskPomodoros[this.state.activeTaskId] || { done: 0, est: 2 };
        this.state.taskPomodoros = {
          ...this.state.taskPomodoros,
          [this.state.activeTaskId]: { ...prevTask, done: (prevTask.done || 0) + 1 },
        };
      }

      // Phát sự kiện hoàn thành để PetWidget khen ngợi
      try {
        window.dispatchEvent(
          new CustomEvent('elec-focus-completed', {
            detail: {
              minutes: cfg.workMinutes,
              cycle: this.state.cycle,
              taskText: this.state.activeTaskText,
            },
          })
        );
      } catch { /* ignore */ }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Hoàn thành phiên Tập trung!', {
            body: `Tuyệt vời! Bạn vừa hoàn thành ${cfg.workMinutes} phút tập trung. Nghỉ ngơi một chút nhé!`,
          });
        } catch { /* ignore */ }
      }

      const nextMode = this.state.cycle % Math.max(1, cfg.longBreakInterval) === 0 ? 'long_break' : 'short_break';
      const nextDur = this._getModeDuration(nextMode, cfg);
      this.state.mode = nextMode;
      this.state.totalSeconds = nextDur;
      this.state.secondsLeft = nextDur;
      this.state.elapsedSeconds = 0;
      this.state.endAt = null;
      this.state.startedAt = null;
      this.state.status = 'idle';
      this._emit(true);

      if (cfg.autoStartBreak) {
        setTimeout(() => this.start(), 800);
      }
    } else {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Hết giờ giải lao!', {
            body: 'Quay lại bàn học cùng Bé Elec cho phiên mới nhé!',
          });
        } catch { /* ignore */ }
      }

      const nextDur = this._getModeDuration('focus', cfg);
      this.state.mode = 'focus';
      this.state.totalSeconds = nextDur;
      this.state.secondsLeft = nextDur;
      this.state.elapsedSeconds = 0;
      this.state.endAt = null;
      this.state.startedAt = null;
      this.state.status = 'idle';
      this._emit(true);

      if (cfg.autoStartPomodoro) {
        setTimeout(() => this.start(), 800);
      }
    }
  }

  start() {
    if (this.state.status === 'running') return;
    const now = Date.now();
    if (this.state.settings.countMode === 'flowmodoro' && this.state.mode === 'focus') {
      this.state.startedAt = now - this.state.elapsedSeconds * 1000;
      this.state.endAt = null;
    } else {
      if (this.state.secondsLeft <= 0) {
        this.state.secondsLeft = this.state.totalSeconds;
      }
      this.state.endAt = now + this.state.secondsLeft * 1000;
      this.state.startedAt = now;
    }
    this.state.status = 'running';
    this._startTicker();
    this._emit(true);
  }

  pause() {
    if (this.state.status !== 'running') return;
    this._tick();
    this._stopTicker();
    this.state.status = 'paused';
    this.state.endAt = null;
    this._emit(true);
  }

  toggle() {
    if (this.state.status === 'running') this.pause();
    else this.start();
  }

  reset() {
    this._stopTicker();
    const dur = this._getModeDuration(this.state.mode, this.state.settings);
    this.state.status = 'idle';
    this.state.totalSeconds = dur;
    this.state.secondsLeft = dur;
    this.state.elapsedSeconds = 0;
    this.state.endAt = null;
    this.state.startedAt = null;
    this._emit(true);
  }

  setMode(nextMode) {
    if (!['focus', 'short_break', 'long_break'].includes(nextMode)) return;
    this._stopTicker();
    const dur = this._getModeDuration(nextMode, this.state.settings);
    this.state.mode = nextMode;
    this.state.status = 'idle';
    this.state.totalSeconds = dur;
    this.state.secondsLeft = dur;
    this.state.elapsedSeconds = 0;
    this.state.endAt = null;
    this.state.startedAt = null;
    this._emit(true);
  }

  /* Flowmodoro: kết thúc phiên tập trung tự do & tự tính thời gian nghỉ = elapsed / 5 (tối thiểu 3 phút) */
  finishFlowAndBreak() {
    if (this.state.mode !== 'focus') {
      this.setMode('focus');
      return;
    }
    this._stopTicker();
    const elapsed = this.state.elapsedSeconds;
    const mins = Math.max(1, Math.round(elapsed / 60));
    if (elapsed >= 60) {
      const key = getTodayKey();
      this.state.sessionsByDay = {
        ...this.state.sessionsByDay,
        [key]: (this.state.sessionsByDay[key] || 0) + 1,
      };
      this.state.cycle = (this.state.cycle || 0) + 1;
    }
    const breakMins = Math.max(3, Math.min(30, Math.round(mins / 5)));
    this.state.mode = 'short_break';
    this.state.totalSeconds = breakMins * 60;
    this.state.secondsLeft = breakMins * 60;
    this.state.elapsedSeconds = 0;
    this.state.status = 'idle';
    this.state.endAt = null;
    this.state.startedAt = null;
    if (this.state.settings.soundEnabled) {
      playFocusChime(this.state.settings.soundType, this.state.settings.soundVolume);
    }
    this._emit(true);
  }

  skipPhase() {
    this._stopTicker();
    if (this.state.mode === 'focus') {
      const next = (this.state.cycle + 1) % Math.max(1, this.state.settings.longBreakInterval) === 0
        ? 'long_break'
        : 'short_break';
      this.setMode(next);
    } else {
      this.setMode('focus');
    }
  }

  applyPreset(workMinutes, shortBreakMinutes, longBreakMinutes) {
    this.updateSettings({
      countMode: 'pomodoro',
      workMinutes,
      shortBreakMinutes,
      longBreakMinutes,
    });
  }

  updateSettings(patch) {
    const nextSettings = { ...this.state.settings, ...patch };
    if (nextSettings.countMode === 'flowmodoro' && nextSettings.clockStyle === 'ring') {
      nextSettings.clockStyle = 'digital';
    }
    this.state.settings = nextSettings;
    if (this.state.status === 'idle') {
      const dur = this._getModeDuration(this.state.mode, nextSettings);
      this.state.totalSeconds = dur;
      this.state.secondsLeft = dur;
      this.state.elapsedSeconds = 0;
    }
    this._emit(true);
  }

  setTheme(themeId) {
    this.state.themeId = themeId;
    this._emit(true);
  }

  setMascot(mascotId) {
    this.state.mascotId = mascotId;
    this._emit(true);
  }

  setBgDim(dim) {
    this.state.bgDim = Math.max(0.1, Math.min(0.85, Number(dim) || 0.42));
    this._emit(true);
  }

  setActiveTask(taskId, taskText = '') {
    this.state.activeTaskId = taskId || null;
    this.state.activeTaskText = taskText || '';
    this._emit(true);
  }

  setTaskEstimate(taskId, est) {
    if (!taskId) return;
    const prev = this.state.taskPomodoros[taskId] || { done: 0, est: 2 };
    this.state.taskPomodoros = {
      ...this.state.taskPomodoros,
      [taskId]: { ...prev, est: Math.max(1, Math.min(12, Number(est) || 1)) },
    };
    this._emit(true);
  }

  addNote(text, tag = 'Chung') {
    const clean = String(text || '').trim();
    if (!clean) return;
    this.state.notes = [
      { id: `fn_${Date.now()}`, text: clean, tag, at: Date.now() },
      ...this.state.notes,
    ].slice(0, 40);
    this._emit(true);
  }

  deleteNote(noteId) {
    this.state.notes = this.state.notes.filter((n) => n.id !== noteId);
    this._emit(true);
  }
}

export const focusSession = new FocusSessionStore();

export function useFocusSession() {
  const [state, setState] = useState(() => focusSession.getState());
  useEffect(() => focusSession.subscribe(setState), []);
  return state;
}
