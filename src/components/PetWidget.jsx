/* ============================================================
   PetWidget.jsx — GIAO DIỆN TOÀN CẢNH 3 CỘT CHUẨN ELEC AI
   ------------------------------------------------------------
   Khớp 100% hình ảnh thực tế của người dùng:
   - Cột 1 (Trái): THỐNG KÊ HỌC TẬP (Đếm ngược THPT 2027, Elo, 3 Nguyện vọng, User RPG)
   - Cột 2 (Giữa): KẾ HOẠCH TUẦN (Mục tiêu, Banner tím, 7 ngày, Focus timer, Checklist, Empty state)
   - Cột 3 (Phải): TRÒ CHUYỆN CÙNG ELEC AI (Persona Dịu dàng, Lời chào, 3 Quick Pills, Chat input)
   
   Hỗ trợ hiển thị 3 cột song song trên Desktop & Tablet, tự động responsive trên Mobile.
   0 EMOJI trong code ✓ — 100% SVG và PNG thuần túy
   ============================================================ */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import { askAI } from '../lib/ai.js';
import { runWithCredit } from '../lib/creditService.js';
import { MarkdownLike } from './ChatMarkdown.jsx';
import { lofiAudio } from '../lib/lofiAudioService.js';
import { sound } from '../lib/gameSound.js';
import { getUserAspirationsState } from '../lib/aspirationService.js';
import { getUserProfile, USER_PROFILE_CHANGE_EVENT } from '../lib/userProfileService.js';
import { getWrongQuestions } from '../lib/wrongQuestionService.js';
import { runScientificTools } from '../lib/scientificTools.js';
import { balanceEquation } from '../lib/chemBalance.js';
import { findAppGuideAnswer } from '../lib/appGuideKnowledge.js';
import {
  getWeeklyPlan,
  addWeeklyTask,
  toggleWeeklyTask,
  deleteWeeklyTask,
  generateAiWeeklyPlan,
  getTodayPendingTasks,
  getWeekDates,
  getCurrentDayIndex,
} from '../lib/weeklyPlanService.js';
import { ELEC_SRC } from './PetSkins.jsx';
import UserAvatar from './UserAvatar.jsx';
import './pet-widget.css';

/* 4 phong cách của ELEC AI */
const PERSONAS = [
  { id: 'gentle', label: 'Dịu dàng', desc: 'Ân cần, khích lệ, từng bước kiên nhẫn' },
  { id: 'strict', label: 'Nghiêm khắc', desc: 'Kỷ luật, thẳng thắn sửa lỗi sai' },
  { id: 'humorous', label: 'Hài hước', desc: 'Vui nhộn, hóm hỉnh với ví von KHTN' },
  { id: 'tactical', label: 'Chiến thần', desc: 'Mẹo giải nhanh, bấm máy tính, tối ưu điểm' },
];

/* 7 Quick Action Pills thông minh liên kết hệ thống */
const QUICK_PILLS = [
  { id: 'qp1', text: 'Gợi ý một việc vừa sức để bắt đầu', dotColor: '#3b82f6' },
  { id: 'qp2', text: 'Giải chậm một bài mình đang vướng', dotColor: '#10b981' },
  { id: 'qp3', text: 'Lập kế hoạch học nhẹ nhàng hôm nay', dotColor: '#f97316' },
  { id: 'qp4', text: 'Phân tích Sổ lỗi sai & Khắc phục', dotColor: '#ef4444' },
  { id: 'qp5', text: 'Cân bằng PTHH & Tính toán khoa học', dotColor: '#8b5cf6' },
  { id: 'qp6', text: 'Hướng dẫn sử dụng website ELEC AI', dotColor: '#0ea5e9' },
  { id: 'qp7', text: 'Tìm phòng thi ảo & cách bấm OMR', dotColor: '#6366f1' },
];

/* 8 lệnh nhanh qua gõ "/" hoặc menu công cụ */
const SLASH_COMMANDS = [
  { cmd: '/huongdan', desc: 'Hướng dẫn sử dụng toàn bộ website', prompt: 'Hướng dẫn sử dụng website ELEC AI' },
  { cmd: '/omr', desc: 'Cách làm bài thi & tô OMR số hóa', prompt: 'Tìm phòng thi ảo và cách bấm phiếu OMR' },
  { cmd: '/giai', desc: 'Giải bài tập Toán, Lý, Hóa, Sinh', prompt: 'Giải chậm một bài tập mình đang vướng' },
  { cmd: '/canbang', desc: 'Cân bằng phương trình hóa học', prompt: 'Cân bằng phương trình: Fe + HNO3 -> Fe(NO3)3 + NO + H2O' },
  { cmd: '/plan', desc: 'Lập kế hoạch 7 ngày theo mục tiêu', prompt: 'Lập kế hoạch 7 ngày mục tiêu cho mình' },
  { cmd: '/soloi', desc: 'Phân tích Sổ lỗi sai & Khắc phục', prompt: 'Phân tích Sổ lỗi sai và các câu sai của mình' },
  { cmd: '/pomodoro', desc: 'Bật 25 phút tập trung Pomodoro', prompt: 'Bật 25 phút tập trung Pomodoro' },
  { cmd: '/dithu', desc: 'Vào phòng thi thử trực tuyến', prompt: 'Vào phòng thi ảo làm đề' },
];

export default function PetWidget() {
  const { user } = useAuth();
  const uid = user?.id || user?.uid || 'guest';

  // 1. Đồng bộ Hồ sơ học sinh liên kết Profile
  const [userProfile, setUserProfile] = useState(() => getUserProfile(uid, user));
  useEffect(() => {
    const onProfileUpdate = () => setUserProfile(getUserProfile(uid, user));
    window.addEventListener(USER_PROFILE_CHANGE_EVENT, onProfileUpdate);
    return () => window.removeEventListener(USER_PROFILE_CHANGE_EVENT, onProfileUpdate);
  }, [uid, user]);

  const studentName = userProfile?.fullName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Bạn');
  const userAvatar = user?.photoURL || userProfile?.avatar || userProfile?.photoURL || null;
  const nameParts = studentName.trim().split(/\s+/);
  const userInitial = (nameParts.length >= 2 ? nameParts[1].charAt(0) : studentName.trim().charAt(0)).toUpperCase();

  const { count: liveStreak = 0 } = useLiveStreak() || {};
  const [aspState, setAspState] = useState(() => getUserAspirationsState(uid));
  const [weeklyPlan, setWeeklyPlan] = useState(() => getWeeklyPlan(uid));
  const [wrongQuestions, setWrongQuestions] = useState(() => getWrongQuestions(uid));

  // 2. Lịch sử các đoạn chat (Chat Sessions History)
  const SESSIONS_STORAGE_KEY = `cs-elec-companion-sessions:${uid}`;
  const loadStoredSessions = () => {
    try {
      const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const saveStoredSessions = (list) => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('[ELEC AI] Save sessions error:', err);
    }
  };

  const [sessions, setSessions] = useState(loadStoredSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showChatHistoryDropdown, setShowChatHistoryDropdown] = useState(false);
  const [historyTab, setHistoryTab] = useState('history'); // 'history' | 'persona'

  useEffect(() => {
    setSessions(loadStoredSessions());
    setActiveSessionId(null);
  }, [SESSIONS_STORAGE_KEY]);

  // Modal open state
  const [isOpen, setIsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('plan'); // 'stats' | 'plan' | 'chat'
  const [persona, setPersona] = useState('gentle');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);

  // Đính kèm ảnh đề bài & chụp camera
  const [attachedImage, setAttachedImage] = useState(null); // { dataUrl, mimeType, base64, name }
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Floating reminder note bubble
  const [noteDismissed, setNoteDismissed] = useState(false);

  // Chat conversation
  const [chatLog, setChatLog] = useState([
    {
      id: 'msg_welcome',
      role: 'assistant',
      text: `Chào buổi tối, ${studentName}! Mình cùng chọn một việc vừa sức để bắt đầu thật nhẹ nhàng nhé.`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Weekly plan interaction
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => getCurrentDayIndex());
  const [newTaskInput, setNewTaskInput] = useState('');
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'pending' | 'done'

  // Focus Timer (Pomodoro) & Chế độ tập trung
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusTotalSeconds, setFocusTotalSeconds] = useState(25 * 60);
  const [focusModeType, setFocusModeType] = useState('focus'); // 'focus' | 'short' | 'long'

  // Focus Ambient Music (Lofi / Rain / Lab)
  const [audioState, setAudioState] = useState({ isPlaying: false, mode: 'lofi', volume: 0.35 });
  const [showAudioPopover, setShowAudioPopover] = useState(false);

  // Floating Mini Draggable Timer
  const [showMiniTimer, setShowMiniTimer] = useState(false);
  const [miniPos, setMiniPos] = useState(() => {
    try {
      const saved = localStorage.getItem('elec_mini_pomo_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 270) : 300;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 130) : 500;
    return { x: defaultX, y: defaultY };
  });
  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  const overlayRef = useRef(null);
  const chatScrollRef = useRef(null);
  const mascotBtnRef = useRef(null);

  // Tự động lưu cuộc trò chuyện vào Lịch sử đoạn chat
  useEffect(() => {
    if (chatLog.length <= 1) return;
    const currentId = activeSessionId || `sess_${Date.now()}`;
    if (!activeSessionId) setActiveSessionId(currentId);

    const firstUserMsg = chatLog.find((m) => m.role === 'user');
    const title = firstUserMsg
      ? (firstUserMsg.text ? firstUserMsg.text.slice(0, 32) : 'Đề bài có ảnh đính kèm')
      : 'Đoạn chat mới';

    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === currentId);
      const updated = {
        id: currentId,
        title,
        updatedAt: Date.now(),
        messages: chatLog,
        persona,
      };
      let nextList;
      if (existingIdx >= 0) {
        nextList = [...prev];
        nextList[existingIdx] = updated;
      } else {
        nextList = [updated, ...prev];
      }
      saveStoredSessions(nextList.slice(0, 25));
      return nextList;
    });
  }, [chatLog]);

  // Bắt đầu đoạn chat mới
  const handleStartNewChat = () => {
    setChatLog([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        text: `Chào buổi tối, ${studentName}! Mình cùng chọn một việc vừa sức để bắt đầu thật nhẹ nhàng nhé.`,
      },
    ]);
    setActiveSessionId(null);
    setAttachedImage(null);
    setShowChatHistoryDropdown(false);
  };

  // Mở đoạn chat cũ từ lịch sử
  const handleSelectSession = (s) => {
    if (Array.isArray(s.messages) && s.messages.length > 0) {
      setChatLog(s.messages);
      setActiveSessionId(s.id);
      if (s.persona) setPersona(s.persona);
    }
    setShowChatHistoryDropdown(false);
  };

  // Xóa đoạn chat trong lịch sử
  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSessions((prev) => {
      const nextList = prev.filter((s) => s.id !== sessionId);
      saveStoredSessions(nextList);
      return nextList;
    });
    if (activeSessionId === sessionId) {
      handleStartNewChat();
    }
  };

  // Chọn ảnh bài tập từ máy hoặc chụp từ camera
  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const match = typeof dataUrl === 'string' ? dataUrl.match(/^data:([^;]+);base64,(.+)$/) : null;
      if (match) {
        setAttachedImage({
          dataUrl,
          mimeType: match[1],
          base64: match[2],
          name: file.name,
        });
      }
      setSlashMenuOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  // Sync aspirations state
  useEffect(() => {
    const onAspUpdate = () => setAspState(getUserAspirationsState(uid));
    window.addEventListener('elec-aspirations-updated', onAspUpdate);
    return () => window.removeEventListener('elec-aspirations-updated', onAspUpdate);
  }, [uid]);

  // Sync weekly plan
  useEffect(() => {
    const onPlanUpdate = () => setWeeklyPlan(getWeeklyPlan(uid));
    window.addEventListener('elec-weekly-plan-changed', onPlanUpdate);
    return () => window.removeEventListener('elec-weekly-plan-changed', onPlanUpdate);
  }, [uid]);

  // Sync wrong questions notebook
  useEffect(() => {
    const onWrongUpdate = () => setWrongQuestions(getWrongQuestions(uid));
    window.addEventListener('cs-wrong-questions-update', onWrongUpdate);
    return () => window.removeEventListener('cs-wrong-questions-update', onWrongUpdate);
  }, [uid]);

  // Listen to global open & focus events
  useEffect(() => {
    const onOpenGlobal = () => setIsOpen(true);
    const onOpenMini = () => {
      setShowMiniTimer(true);
      setIsOpen(false);
    };
    const onToggleFocus = () => {
      handleToggleFocusRunning();
    };
    window.addEventListener('elec-open-companion-modal', onOpenGlobal);
    window.addEventListener('elec-open-mini-timer', onOpenMini);
    window.addEventListener('elec-toggle-focus', onToggleFocus);
    return () => {
      window.removeEventListener('elec-open-companion-modal', onOpenGlobal);
      window.removeEventListener('elec-open-mini-timer', onOpenMini);
      window.removeEventListener('elec-toggle-focus', onToggleFocus);
    };
  }, []);

  // Lắng nghe trạng thái Audio từ lofiAudio engine
  useEffect(() => {
    const unsub = lofiAudio.addListener((st) => {
      setAudioState({ ...st });
    });
    return unsub;
  }, []);

  // Pomodoro timer tick & hoàn thành phiên
  useEffect(() => {
    if (focusRunning) {
      setShowMiniTimer(true);
    }
  }, [focusRunning]);

  // Đồng bộ trạng thái Focus cho thanh Focus Bar trên trang chủ
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('elec-focus-sync', {
          detail: { running: focusRunning, seconds: focusSeconds },
        })
      );
    } catch {}
  }, [focusRunning, focusSeconds]);

  useEffect(() => {
    let t = null;
    if (focusRunning && focusSeconds > 0) {
      t = setInterval(() => {
        setFocusSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(t);
  }, [focusRunning, focusSeconds]);

  useEffect(() => {
    if (focusRunning && focusSeconds === 0) {
      setFocusRunning(false);
      setFocusSeconds(focusTotalSeconds);
      try { sound.win(); } catch {}
      lofiAudio.stop();
      alert('Đã hoàn thành phiên tập trung Pomodoro! Bạn hãy nghỉ ngơi một chút nhé.');
    }
  }, [focusRunning, focusSeconds, focusTotalSeconds]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatLog, isAiLoading]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (e.target.classList.contains('ns9-panoramic-overlay-backdrop')) {
        setIsOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const pendingToday = useMemo(() => getTodayPendingTasks(uid), [uid, weeklyPlan]);

  const targetAspiration = useMemo(() => {
    const nv1 = aspState?.aspirations?.[0];
    if (nv1?.school) {
      return `${nv1.school.name || nv1.school.code} — ${nv1.major?.name || 'Ngành mục tiêu'}`;
    }
    return userProfile?.highSchool
      ? `${userProfile.highSchool}${userProfile?.grade ? ` · ${userProfile.grade}` : ''}`
      : 'Chưa đặt nguyện vọng mục tiêu';
  }, [aspState, userProfile]);

  const userSchoolGoal = useMemo(() => {
    const nv1 = aspState?.aspirations?.[0];
    if (nv1?.school?.code) {
      return `${nv1.school.code} · ${nv1.major?.name ? (nv1.major.name.length > 20 ? nv1.major.name.slice(0, 20) + '...' : nv1.major.name) : nv1.block || 'Mục tiêu'}`;
    }
    return userProfile?.highSchool || userProfile?.grade || 'Chưa cập nhật trường';
  }, [aspState, userProfile]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartFocusMode = (modeType = 'focus') => {
    let secs = 25 * 60;
    if (modeType === 'short') secs = 5 * 60;
    if (modeType === 'long') secs = 15 * 60;
    setFocusModeType(modeType);
    setFocusTotalSeconds(secs);
    setFocusSeconds(secs);
    setFocusRunning(true);
  };

  const handleToggleFocusRunning = () => {
    setFocusRunning((prev) => !prev);
  };

  const handleResetFocus = () => {
    setFocusRunning(false);
    setFocusSeconds(focusTotalSeconds);
  };

  const handleToggleAudio = (modeOverride = null) => {
    lofiAudio.toggle(modeOverride);
  };

  const handleChangeVolume = (val) => {
    const num = parseFloat(val);
    lofiAudio.setVolume(num);
  };

  // Dragging handlers cho Đồng hồ nhỏ nổi
  const handleMiniPointerDown = (e) => {
    if (e.target.closest('button, input, .ns9-no-drag')) return;
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - miniPos.x,
      y: e.clientY - miniPos.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleMiniPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const widgetWidth = 240;
    const widgetHeight = 65;
    const maxX = typeof window !== 'undefined' ? window.innerWidth - widgetWidth - 10 : 1000;
    const maxY = typeof window !== 'undefined' ? window.innerHeight - widgetHeight - 10 : 800;
    const newX = Math.max(10, Math.min(maxX, e.clientX - dragStartOffsetRef.current.x));
    const newY = Math.max(10, Math.min(maxY, e.clientY - dragStartOffsetRef.current.y));
    setMiniPos({ x: newX, y: newY });
  };

  const handleMiniPointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      localStorage.setItem('elec_mini_pomo_pos', JSON.stringify(miniPos));
    } catch {}
  };

  // Filter tasks for selected day
  const currentDayTasks = useMemo(() => {
    const allForDay = (weeklyPlan.tasks || []).filter((t) => t.dayIndex === selectedDayIdx);
    if (planFilter === 'pending') return allForDay.filter((t) => !t.completed);
    if (planFilter === 'done') return allForDay.filter((t) => t.completed);
    return allForDay;
  }, [weeklyPlan.tasks, selectedDayIdx, planFilter]);

  // Tasks counts per day
  const dayPendingCounts = useMemo(() => {
    const map = {};
    (weeklyPlan.tasks || []).forEach((t) => {
      if (!t.completed) map[t.dayIndex] = (map[t.dayIndex] || 0) + 1;
    });
    return map;
  }, [weeklyPlan.tasks]);

  // Xử lý các nút hành động tương tác trực tiếp trong bong bóng chat AI
  const handleActionClick = (action, payload) => {
    if (action === 'start_pomodoro') {
      setFocusRunning(true);
      setFocusSeconds(25 * 60);
      setMobileTab('plan');
    } else if (action === 'generate_plan') {
      generateAiWeeklyPlan(uid, targetAspiration);
      setWeeklyPlan(getWeeklyPlan(uid));
      setMobileTab('plan');
    } else if (action === 'wrong_book') {
      handleSendChat('Phân tích Sổ lỗi sai và các câu sai của mình');
    } else if (action === 'open_wrong_page') {
      setIsOpen(false);
      window.location.hash = 'notebook';
    } else if (action === 'virtual_exams') {
      setIsOpen(false);
      window.location.hash = 'virtual-exams';
    } else if (action === 'open_roadmap') {
      setIsOpen(false);
      window.location.hash = 'roadmap';
    } else if (action === 'open_table') {
      setIsOpen(false);
      window.location.hash = 'table';
    } else if (action === 'open_balance') {
      setIsOpen(false);
      window.location.hash = 'balance';
    } else if (action === 'open_leaderboard') {
      setIsOpen(false);
      window.location.hash = 'leaderboard';
    } else if (action === 'open_formulas') {
      setIsOpen(false);
      window.location.hash = 'formulas';
    } else if (action === 'open_admission') {
      setIsOpen(false);
      window.location.hash = 'admission';
    } else if (action === 'open_profile') {
      setIsOpen(false);
      window.location.hash = 'profile';
    } else if (action === 'add_wrong_to_plan') {
      addWeeklyTask(uid, selectedDayIdx, 'Chữa và làm lại 5 câu trong Sổ lỗi sai', 'Ôn tập', 20);
      setWeeklyPlan(getWeeklyPlan(uid));
      setChatLog((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          text: 'ELEC AI đã thêm nhiệm vụ "Chữa và làm lại 5 câu trong Sổ lỗi sai" vào Kế hoạch tuần của bạn!',
          actions: [
            { id: `pomo_${Date.now()}`, label: 'Bật 25p Pomodoro ngay', action: 'start_pomodoro' },
          ],
        },
      ]);
    } else if (action === 'add_to_plan') {
      const taskTitle = payload ? `Ôn tập: ${payload}` : 'Luyện tập chuyên đề cùng ELEC AI';
      addWeeklyTask(uid, selectedDayIdx, taskTitle, 'KHTN', 15);
      setWeeklyPlan(getWeeklyPlan(uid));
      setChatLog((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          text: `ELEC AI đã thêm nhiệm vụ "${taskTitle}" vào Kế hoạch tuần!`,
          actions: [
            { id: `pomo_${Date.now()}`, label: 'Bật 25p Pomodoro', action: 'start_pomodoro' },
          ],
        },
      ]);
    } else if (action === 'task_theory') {
      handleSendChat(`Tóm tắt công thức trọng tâm và mẹo giải nhanh cho bài: "${payload?.text || 'nhiệm vụ này'}"`);
    }
  };

  // Gửi tin nhắn tới AI với nhận diện tác vụ đa môn, đính kèm ảnh và liên kết toàn diện
  const handleSendChat = async (directText, directAction, directPayload) => {
    const text = (directText || chatInput).trim();
    if (!text && !attachedImage && !directAction) return;

    setChatInput('');
    setSlashMenuOpen(false);

    if (directAction) {
      handleActionClick(directAction, directPayload);
      return;
    }

    const currentImg = attachedImage;
    setAttachedImage(null);

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: text || (currentImg ? 'Hãy giải chi tiết từng bước đề bài trong ảnh này giúp mình.' : ''),
      image: currentImg?.dataUrl || null,
      imageMime: currentImg?.mimeType || null,
      imageBase64: currentImg?.base64 || null,
    };

    const nextLog = [...chatLog, userMsg];
    setChatLog(nextLog);
    setIsAiLoading(true);

    const normText = (text || '').toLowerCase();

    // 1. LIÊN KẾT SỔ LỖI SAI (wrongQuestionService)
    if (!currentImg && (normText.includes('lỗi sai') || normText.includes('sổ lỗi') || normText.includes('câu sai') || normText.includes('/soloi'))) {
      const wrongs = getWrongQuestions(uid);
      const aiMsgId = `ai_wrong_${Date.now()}`;
      if (wrongs.length > 0) {
        const bySubj = {};
        wrongs.forEach((w) => {
          const s = w.subject || w.subjectName || (w.examTitle && w.examTitle.toLowerCase().includes('vật lí') ? 'Vật lí' : w.examTitle && w.examTitle.toLowerCase().includes('sinh') ? 'Sinh học' : 'Hóa học');
          bySubj[s] = (bySubj[s] || 0) + 1;
        });
        const subjSummary = Object.entries(bySubj).map(([s, c]) => `${s}: ${c} câu`).join(', ');
        const sampleTopics = wrongs.slice(0, 3).map((w) => w.question?.topic || w.topic || w.examTitle || 'Chuyên đề').join(', ');

        const reply = `ELEC AI đã quét Sổ lỗi sai của bạn: Hiện có ${wrongs.length} câu cần củng cố (${subjSummary}).\nChuyên đề hay nhầm lẫn: ${sampleTopics}.\n\nLời khuyên đồng hành: Dành 15-20 phút giải lại những câu này để tránh lặp lại bẫy đề thi THPT 2027.`;

        setChatLog((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            text: reply,
            actions: [
              { id: 'act_add_wrong', label: 'Vá lỗi sai: Thêm vào Kế hoạch tuần', action: 'add_wrong_to_plan' },
              { id: 'act_open_nb', label: 'Mở Sổ lỗi sai toàn diện', action: 'open_wrong_page' },
            ],
          },
        ]);
        setIsAiLoading(false);
        return;
      } else {
        const reply = `Sổ lỗi sai của bạn hiện tại đang sạch bóng (0 câu sai)! Phong độ kiến thức của bạn rất tuyệt vời.\nĐể phát hiện sớm các bẫy điểm số phân loại 8+ trong đề thi THPT 2027, hãy cùng ELEC AI thử sức với một đề thi thử nhé!`;
        setChatLog((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            text: reply,
            actions: [
              { id: 'act_try_exam', label: 'Vào Phòng thi ảo làm đề', action: 'virtual_exams' },
              { id: 'act_make_plan', label: 'Lập kế hoạch 7 ngày', action: 'generate_plan' },
            ],
          },
        ]);
        setIsAiLoading(false);
        return;
      }
    }

    // 2. LIÊN KẾT TỰ ĐỘNG LẬP KẾ HOẠCH TUẦN (weeklyPlanService)
    if (!currentImg && (normText.includes('lập kế hoạch') || normText.includes('kế hoạch tuần') || normText.includes('lộ trình 7 ngày') || normText.includes('/plan'))) {
      generateAiWeeklyPlan(uid, targetAspiration);
      setWeeklyPlan(getWeeklyPlan(uid));
      const aiMsgId = `ai_plan_${Date.now()}`;
      const reply = `ELEC AI đã phân tích mục tiêu ${targetAspiration} (còn ~234 ngày đến kỳ thi THPT 2027) và đã nạp xong Lộ trình 7 ngày vào Kế hoạch tuần (Cột 2)!\n\nChiến thuật phân bổ tuần này:\n• Thứ 2 - Thứ 3: Củng cố nền tảng chuyên đề then chốt\n• Thứ 4 - Thứ 5: Nâng cao tốc độ giải nhanh & kĩ năng bấm máy\n• Thứ 6 - Thứ 7: Luyện đề tổng hợp bấm giờ chuẩn ma trận\n• Chủ nhật: Rà soát Sổ lỗi sai và phục hồi năng lượng.\n\nHãy bấm bắt đầu nhiệm vụ hôm nay nhé!`;

      setChatLog((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          text: reply,
          actions: [
            { id: 'act_pomo_now', label: 'Bắt đầu 25p Pomodoro', action: 'start_pomodoro' },
            { id: 'act_check_wrong', label: 'Kiểm tra Sổ lỗi sai', action: 'wrong_book' },
          ],
        },
      ]);
      setIsAiLoading(false);
      return;
    }

    // 3. CÂN BẰNG PHƯƠNG TRÌNH HÓA HỌC TẤT ĐỊNH (chemBalance)
    const isChemEquation = (text.includes('->') || text.includes('-->') || text.includes('=') || text.includes('=>')) && text.includes('+');
    if (!currentImg && (isChemEquation || normText.includes('/canbang'))) {
      try {
        const rawEq = text.replace(/\/canbang\s*/i, '').trim();
        const balanced = balanceEquation(rawEq);
        if (balanced && (balanced.pretty || balanced.equation)) {
          const aiMsgId = `ai_chem_${Date.now()}`;
          const leftStr = balanced.left.map((t) => `${t.coef > 1 ? t.coef : ''}${t.formula}`).join(' + ');
          const rightStr = balanced.right.map((t) => `${t.coef > 1 ? t.coef : ''}${t.formula}`).join(' + ');
          const prettyEq = balanced.pretty || `${leftStr} ${balanced.arrow || '→'} ${rightStr}`;
          const reply = `[CÂN BẰNG PHƯƠNG TRÌNH HÓA HỌC]\n\nPhương trình cân bằng:\n${prettyEq}\n\nTỉ lệ hệ số nguyên tối giản:\n${balanced.coeffL.join(' : ')} → ${balanced.coeffR.join(' : ')}\n\nBản chất phản ứng & Nguyên tắc bảo toàn:\nTổng số nguyên tử của từng nguyên tố ở 2 vế hoàn toàn bằng nhau theo định luật bảo toàn khối lượng.`;

          setChatLog((prev) => [
            ...prev,
            {
              id: aiMsgId,
              role: 'assistant',
              text: reply,
              actions: [
                { id: 'act_save_eq', label: 'Thêm vào Kế hoạch tuần', action: 'add_to_plan', payload: `Ôn PTHH: ${prettyEq}` },
                { id: 'act_more_chem', label: 'Luyện thêm bài tập Hóa học', action: 'virtual_exams' },
              ],
            },
          ]);
          setIsAiLoading(false);
          return;
        }
      } catch (err) {
        // Fallback sang AI nếu phương trình phức tạp đặc biệt
      }
    }

    // 3.5. HƯỚNG DẪN SỬ DỤNG WEBSITE & ĐIỀU HƯỚNG TOÀN NĂNG (appGuideKnowledge)
    if (!currentImg) {
      const guideAns = findAppGuideAnswer(text);
      if (guideAns) {
        const aiMsgId = `ai_guide_${Date.now()}`;
        const actions = [
          { id: 'act_g_exam', label: 'Vào Phòng thi ảo', action: 'virtual_exams' },
          { id: 'act_g_road', label: 'Mở Lộ trình học', action: 'open_roadmap' },
          { id: 'act_g_wrong', label: 'Mở Sổ tay lỗi sai', action: 'open_wrong_page' },
          { id: 'act_g_table', label: 'Mở Bảng tuần hoàn', action: 'open_table' },
        ];
        setChatLog((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: 'assistant',
            text: guideAns,
            actions,
          },
        ]);
        setIsAiLoading(false);
        return;
      }
    }

    // 4. GIẢI BÀI TẬP VÀ GIA SƯ ĐỒNG HÀNH BẰNG askAI + scientificTools + Gemini Vision
    try {
      const activeP = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];
      const sciRes = text ? runScientificTools(text) : null;
      const sciContext = sciRes?.summary ? `\n\n[Dữ liệu tính toán khoa học tất định]:\n${sciRes.summary}` : '';

      const wrongs = getWrongQuestions(uid);
      const wrongContext = wrongs.length > 0 ? `\nHọc sinh hiện có ${wrongs.length} câu làm sai trong Sổ lỗi sai.` : '';

      const aiMsgId = `ai_${Date.now()}`;
      let accumulated = '';
      setChatLog((prev) => [...prev, { id: aiMsgId, role: 'assistant', text: '...' }]);

      // Format history cho askAI hỗ trợ cả text lẫn Vision inlineData
      const historyForApi = nextLog.map((m) => {
        const parts = [];
        if (m.imageBase64 && m.imageMime) {
          parts.push({
            inlineData: {
              mimeType: m.imageMime,
              data: m.imageBase64,
            },
          });
        }
        if (m.text) {
          parts.push({ text: m.text });
        } else if (parts.length > 0) {
          parts.push({ text: 'Hãy giải chi tiết từng bước đề bài trong ảnh này giúp mình.' });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

      // Gọi askAI với full options để grounding và tools được kích hoạt chuẩn xác + trừ Credit
      await runWithCredit(
        {
          userId: uid && uid !== 'guest' ? uid : null,
          imageCount: currentImg ? 1 : 0,
          reason: currentImg ? 'Elec đồng hành giải đề ảnh' : 'Hỏi Elec đồng hành AI',
        },
        () => askAI(
          historyForApi,
          (chunk) => {
            accumulated = chunk;
            setChatLog((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? {
                      ...msg,
                      text: accumulated,
                      actions: [
                        { id: `act_add_${Date.now()}`, label: 'Thêm vào Kế hoạch tuần', action: 'add_to_plan', payload: text ? text.slice(0, 35) : 'Bài tập giải theo ảnh' },
                        { id: `act_pomo_${Date.now()}`, label: 'Bật 25p Pomodoro', action: 'start_pomodoro' },
                      ],
                    }
                  : msg
              )
            );
          },
          null,
          {
            uid,
            grade: userProfile?.grade || 'Lớp 12',
            useContext: true,
            useTools: true,
            useKnowledge: true,
            verify: true,
            extra: `Học sinh: ${studentName}.
Mục tiêu trường thi: ${targetAspiration}.
Thời gian thi: THPT 2027 (~234 ngày).
Phong cách giảng giải: ${activeP.label} (${activeP.desc}).${wrongContext}${sciContext}

HƯỚNG DẪN TRẢ LỜI GIẢI BÀI TẬP VÀ ĐỒNG HÀNH:
- Nếu có ảnh đề bài hoặc bài tập (Toán, Vật lý, Hóa học, Sinh học):
  Đọc thật kĩ đề bài, đưa ra kết quả số học và phương trình chính xác 100%, trình bày theo 4 phần:
  ### 1. Tóm tắt đề bài & Dữ kiện
  ### 2. Công thức & Kiến thức cốt lõi
  ### 3. Lời giải chi tiết từng bước (kết quả số phải chính xác tuyệt đối)
  ### 4. Bẫy điểm số & Lưu ý khi đi thi
- QUY TẮC TRÌNH BÀY CÔNG THỨC KHOA HỌC CHUẨN XÁC:
  • Bọc toàn bộ công thức toán học và phương trình khoa học trong LaTeX $...$ (nội dòng) hoặc $$...$$ (dòng riêng).
  • HÓA HỌC: Dùng mhchem $\\ce{...}$ hoặc LaTeX chuẩn, ví dụ: $\\ce{Fe + 2HCl -> FeCl2 + H2 ^}$, $\\ce{Al^3+ + 3OH- -> Al(OH)3 v}$, $\\ce{CaCO3 ->[t^\\circ] CaO + CO2 ^}$, $\\ce{Fe2(SO4)3}$, pH = -lg[H+]. Viết rõ điện tích ion và mũi tên phản ứng, trạng thái bay hơi ↑, kết tủa ↓.
  • VẬT LÝ: Dùng LaTeX chuẩn, ví dụ: $T = 2\\pi\\sqrt{\\frac{m}{k}}$, $x = A\\cos(\\omega t + \\varphi)$, $\\lambda = \\frac{v}{f}$, $i = \\frac{\\lambda D}{a}$, $Z = \\sqrt{R^2 + (Z_L - Z_C)^2}$, $\\varepsilon = hf = \\frac{hc}{\\lambda}$, $E = mc^2$. Viết rõ các chỉ số dưới v₀, x₀, W_đ, W_t, Z_L, Z_C, v_max, a_max, số mũ 10^-3, 10^8 và đơn vị chuẩn m/s², rad/s, Ω, μF.
  • SINH HỌC: Dùng ký hiệu di truyền học chuẩn, ví dụ: $P: \\text{AaBb} \\times \\text{AaBb} \\rightarrow F_1: 9\\text{A-B-} : 3\\text{A-bb} : 3\\text{aaB-} : 1\\text{aabb}$, phép lai dùng dấu ×, alen liên kết giới tính $X^A X^a \\times X^A Y$, nhóm máu $I^A, I^B, I^O$, liên kết gen $\\frac{AB}{ab}$, bộ NST 2n, 2n+1, 2n-1, định luật Hardy-Weinberg $p^2\\text{AA} + 2pq\\text{Aa} + q^2\\text{aa} = 1$, chiều sợi phân tử 5' → 3', 2A + 3G = H, $L = \\frac{N}{2} \\times 3{,}4\\text{ \\AA}$.
- Trả lời súc tích, sư phạm, đồng hành thân thiện, truyền cảm hứng.
- 0 EMOJI trong toàn bộ câu trả lời.`,
          }
        )
      );
    } catch (err) {
      console.warn('[ELEC AI] Companion chat error:', err);
      const fallbackText = err?.code === 'OUT_OF_CREDITS'
        ? err.message
        : `ELEC AI đã ghi nhận câu hỏi của ${studentName}! Hãy xem mục Kế hoạch tuần hoặc Phòng luyện tập để hoàn thành mục tiêu ngày hôm nay nhé!`;
      setChatLog((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: fallbackText,
                actions: [
                  { id: 'act_plan_err', label: 'Xem Kế hoạch tuần', action: 'generate_plan' },
                  { id: 'act_pomo_err', label: 'Bật 25p Pomodoro', action: 'start_pomodoro' },
                ],
              }
            : msg
        )
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Tương tác 2 chiều: Khi học sinh nhờ AI giải task trong Kế hoạch tuần
  const handleAskAiAboutTask = (task) => {
    setMobileTab('chat');
    const prompt = `Hướng dẫn phương pháp và công thức giải nhanh cho bài: "${task.text}" (${task.subject || 'KHTN'})`;
    handleSendChat(prompt);
  };

  // Tương tác 2 chiều: Khi học sinh tick hoàn thành task trong Kế hoạch tuần
  const handleToggleTask = (taskId) => {
    const targetTask = (weeklyPlan.tasks || []).find((t) => t.id === taskId);
    const willBeCompleted = targetTask && !targetTask.completed;
    toggleWeeklyTask(uid, taskId);
    setWeeklyPlan(getWeeklyPlan(uid));

    if (willBeCompleted && targetTask) {
      setChatLog((prev) => [
        ...prev,
        {
          id: `cheer_${Date.now()}`,
          role: 'assistant',
          text: `Chúc mừng ${studentName}! Bạn vừa hoàn thành xuất sắc nhiệm vụ: "${targetTask.text}". Một bước tiến vững chắc hướng tới cánh cổng ${targetAspiration}!`,
          actions: [
            { id: `c_pomo_${Date.now()}`, label: 'Bật 25p Pomodoro cho việc tiếp theo', action: 'start_pomodoro' },
          ],
        },
      ]);
    }
  };

  // Chọn lệnh nhanh từ Slash Command popover
  const handleSelectSlashCmd = (item) => {
    setSlashMenuOpen(false);
    if (item.cmd === '/pomodoro') {
      handleActionClick('start_pomodoro');
    } else if (item.cmd === '/dithu') {
      handleActionClick('virtual_exams');
    } else {
      setChatInput(item.prompt);
    }
  };

  const handleAddTask = (e) => {
    e?.preventDefault();
    if (!newTaskInput.trim()) return;
    addWeeklyTask(uid, selectedDayIdx, newTaskInput.trim());
    setWeeklyPlan(getWeeklyPlan(uid));
    setNewTaskInput('');
  };

  const handleGeneratePlan = () => {
    generateAiWeeklyPlan(uid, targetAspiration);
    setWeeklyPlan(getWeeklyPlan(uid));
    setChatLog((prev) => [
      ...prev,
      {
        id: `plan_${Date.now()}`,
        role: 'assistant',
        text: `ELEC AI đã lập xong Lộ trình 7 ngày mục tiêu ${targetAspiration} cho bạn trong Kế hoạch tuần!\n• 2 ngày đầu: Ôn tập chuyên đề trọng tâm & lý thuyết\n• 2 ngày tiếp: Rèn phương pháp giải nhanh & kĩ năng xử lý câu hỏi 7.5+\n• 2 ngày kế: Bấm giờ làm đề thi chuẩn ma trận THPT 2027\n• Chủ nhật: Rà soát câu sai trong Sổ lỗi sai và nghỉ ngơi nhẹ nhàng.`,
        actions: [
          { id: `act_pomo_${Date.now()}`, label: 'Bật 25p Pomodoro', action: 'start_pomodoro' },
          { id: `act_check_w_${Date.now()}`, label: 'Kiểm tra Sổ lỗi sai', action: 'wrong_book' },
        ],
      },
    ]);
  };

  const displayAspirations = useMemo(() => {
    return Array.isArray(aspState?.aspirations) ? aspState.aspirations : [];
  }, [aspState]);

  return (
    <>
      {/* ============================================================
          1. LINH VẬT NỔI & BONG BÓNG NHẮC NHỞ GÓC MÀN HÌNH
          ============================================================ */}
      <div className="ns9-mascot-fab-wrap" ref={mascotBtnRef}>
        {!noteDismissed && !isOpen && (
          <div className="ns9-fab-note-bubble" onClick={() => setIsOpen(true)}>
            <div className="ns9-fab-note-header">
              <span className="ns9-fab-note-dot" />
              <span className="ns9-fab-note-tag">ELEC AI NOTE</span>
              <button
                type="button"
                className="ns9-fab-note-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteDismissed(true);
                }}
                aria-label="Đóng ghi chú"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="ns9-fab-note-text">
              {pendingToday.length > 0
                ? `Hôm nay em có ${pendingToday.length} việc cần hoàn thành trong Kế hoạch tuần!`
                : 'Lưu hồ sơ ELEC AI để cá nhân hoá lộ trình cho em.'}
            </p>
          </div>
        )}

        <button
          type="button"
          className="ns9-fab-mascot-button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Mở Trợ lý ELEC AI toàn cảnh"
          aria-label="Mở Trợ lý ELEC AI"
        >
          <div className="ns9-fab-mascot-aura" />
          <img
            src={isOpen ? ELEC_SRC.wink : ELEC_SRC.hello}
            alt="Linh vật ELEC AI"
            className="ns9-fab-mascot-image"
            draggable={false}
          />
          {pendingToday.length > 0 && (
            <span className="ns9-fab-badge">{pendingToday.length}</span>
          )}
        </button>
      </div>

      {/* ============================================================
          2. TOÀN CẢNH 3 CỘT (PANORAMIC WORKSPACE OVERLAY)
          Khớp 100% hình ảnh thực tế của người dùng
          ============================================================ */}
      {isOpen && (
        <div className="ns9-panoramic-overlay-backdrop">
          <div className="ns9-panoramic-modal" ref={overlayRef}>
            {/* Mobile Column Switcher (chỉ hiện khi màn hình hẹp < 1024px) */}
            <div className="ns9-mobile-column-tabs">
              <button
                type="button"
                className={`ns9-mob-tab-btn ${mobileTab === 'stats' ? 'is-active' : ''}`}
                onClick={() => setMobileTab('stats')}
              >
                Thống kê học tập
              </button>
              <button
                type="button"
                className={`ns9-mob-tab-btn ${mobileTab === 'plan' ? 'is-active' : ''}`}
                onClick={() => setMobileTab('plan')}
              >
                Kế hoạch tuần
              </button>
              <button
                type="button"
                className={`ns9-mob-tab-btn ${mobileTab === 'chat' ? 'is-active' : ''}`}
                onClick={() => setMobileTab('chat')}
              >
                Trò chuyện AI
              </button>
              <button
                type="button"
                className="ns9-mob-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Khung 3 cột song song chuẩn ELEC AI */}
            <div className={`ns9-panoramic-grid show-${mobileTab}`}>
              {/* ────────────────────────────────────────────────────────
                  CỘT 1 (TRÁI): THỐNG KÊ HỌC TẬP
                  ──────────────────────────────────────────────────────── */}
              <div className="ns9-pcol ns9-pcol-stats">
                <div className="ns9-pcol-head">
                  <h3 className="ns9-pcol-head-title">THỐNG KÊ HỌC TẬP</h3>
                </div>

                <div className="ns9-pcol-scroll">
                  {/* Phím tắt chuyển nhanh chức năng */}
                  <div className="ns9-stat-quick-nav-bar">
                    <button
                      type="button"
                      className="ns9-sq-nav-chip"
                      onClick={() => { setIsOpen(false); window.location.hash = 'roadmap'; }}
                      title="Mở Lộ trình cá nhân hóa"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                      <span>Lộ trình</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-sq-nav-chip"
                      onClick={() => { setIsOpen(false); window.location.hash = 'virtual-exams'; }}
                      title="Vào Phòng thi ảo"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>Phòng thi</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-sq-nav-chip"
                      onClick={() => { setIsOpen(false); window.location.hash = 'notebook'; }}
                      title="Mở Sổ tay lỗi sai"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      <span>Sổ lỗi</span>
                    </button>
                    <button
                      type="button"
                      className="ns9-sq-nav-chip"
                      onClick={() => { setIsOpen(false); window.location.hash = 'leaderboard'; }}
                      title="Mở Bảng xếp hạng"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      <span>Xếp hạng</span>
                    </button>
                  </div>

                  {/* Card 1: Đếm ngược - THPT */}
                  <div className="ns9-stat-countdown-card">
                    <div className="ns9-sc-top">
                      <span className="ns9-sc-pill">ĐẾM NGƯỢC - THPT</span>
                      <div className="ns9-sc-target-date">
                        <span className="ns9-sc-date-txt">-30/06/2027</span>
                        <span className="ns9-sc-weeks">~34 tuần nữa</span>
                      </div>
                    </div>
                    <div className="ns9-sc-main-num">
                      <span className="ns9-sc-days">~234</span>
                      <span className="ns9-sc-unit">ngày</span>
                    </div>
                    <div className="ns9-sc-footer-note">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Luyện thêm đề để mở khoá đường điểm dự đoán</span>
                    </div>
                  </div>

                  {/* Card 2: Điểm Elo Tổng */}
                  <div className="ns9-stat-elo-card">
                    <div className="ns9-se-title-row">
                      <span className="ns9-se-title">ĐIỂM ELO TỔNG:</span>
                      <span className="ns9-se-val">—</span>
                    </div>
                    <div className="ns9-se-box">
                      <p className="ns9-se-desc">
                        Chưa đủ dữ liệu để tính Elo cho chương trình đang chọn — hoàn thành bài test đầu vào hoặc luyện tập để mở khoá.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Tiến độ Nguyện vọng */}
                  <div className="ns9-stat-asp-card">
                    <div className="ns9-sa-header">
                      <span className="ns9-sa-title">TIẾN ĐỘ NGUYỆN VỌNG</span>
                      <div className="ns9-sa-dropdown-btn">
                        <span>{displayAspirations[0]?.school?.code ? `NV1: ${displayAspirations[0].school.code}` : 'Chưa chọn NV'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    <div className="ns9-sa-list">
                      {displayAspirations.length === 0 ? (
                        <div className="ns9-sa-item" style={{ justifyContent: 'center', textAlign: 'center', padding: '10px 8px' }}>
                          <span className="ns9-sa-score-line">
                            Bạn chưa thêm nguyện vọng Đại học. Vào mục <b>Lộ trình</b> để chọn trường mục tiêu nhé!
                          </span>
                        </div>
                      ) : (
                        displayAspirations.map((asp, idx) => (
                          <div key={asp.id || idx} className="ns9-sa-item">
                            <div className="ns9-sa-item-left">
                              <span className="ns9-sa-school-name">
                                {asp.school?.name || asp.school?.code} — {asp.major?.name || ''}
                              </span>
                              <span className="ns9-sa-score-line">
                                {idx === 0
                                  ? `Mục tiêu: ${asp.targetScore || 26}đ · Dự đoán: —`
                                  : `Dự đoán: — / ${asp.targetScore || 23}đ`}
                              </span>
                            </div>
                            <div className="ns9-sa-item-right">
                              <span className={`ns9-sa-dot dot-${idx === 0 ? 'blue' : idx === 1 ? 'orange' : 'red'}`} />
                              <span className="ns9-sa-dash">—</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Card 4 (Dưới cùng): Thông tin học sinh & Lực chiến liên kết Profile */}
                  <div
                    className="ns9-stat-user-card"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.hash = 'profile?tab=info';
                    }}
                    title="Xem & Chỉnh sửa hồ sơ cá nhân"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ns9-su-avatar" style={{ border: 'none', background: 'transparent' }}>
                      <UserAvatar user={user} size={36} variant="dark" title={studentName} />
                    </div>
                    <div className="ns9-su-info">
                      <div className="ns9-su-name-row">
                        <span className="ns9-su-name">{studentName}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ns9-su-chevron">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                      <span className="ns9-su-sub">{userSchoolGoal}</span>
                    </div>
                    <div className="ns9-su-rank-pill">
                      <span className="ns9-su-rank-num">#23.820</span>
                      <span className="ns9-su-rank-total">/29.283</span>
                      <span className="ns9-su-rank-top">Top 81%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CỘT 2 (GIỮA): KẾ HOẠCH TUẦN
                  ──────────────────────────────────────────────────────── */}
              <div className="ns9-pcol ns9-pcol-plan">
                {/* Header Kế hoạch tuần */}
                <div className="ns9-plan-top-nav">
                  <button type="button" className="ns9-nav-arrow" aria-label="Tuần trước">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <div className="ns9-plan-title-block">
                    <h3 className="ns9-plan-main-title">Kế hoạch tuần</h3>
                    <span className="ns9-plan-sub-title">Tuần hiện tại</span>
                  </div>
                  <button type="button" className="ns9-nav-arrow" aria-label="Tuần kế tiếp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>

                <div className="ns9-pcol-scroll">
                  {/* Target dropdown selector */}
                  <div className="ns9-plan-target-select-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                    <span className="ns9-plan-target-label">{targetAspiration}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* Banner Tím: BẮT ĐẦU Ở ĐÂY */}
                  <div className="ns9-hero-purple-banner">
                    <img src={ELEC_SRC.fighting} alt="ELEC AI" className="ns9-hp-mascot" />
                    <div className="ns9-hp-content">
                      <span className="ns9-hp-badge">BẮT ĐẦU Ở ĐÂY</span>
                      <h4 className="ns9-hp-title">Để ELEC AI dựng lộ trình 7 ngày đầu tiên</h4>
                      <p className="ns9-hp-desc">
                        Chỉ khoảng 30 giây để có lịch học theo mục tiêu, môn yếu và nhịp học của bạn.
                      </p>
                      <button
                        type="button"
                        className="ns9-hp-cta-btn"
                        onClick={handleGeneratePlan}
                      >
                        Lập kế hoạch
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Sub-status: Hôm nay & Focus timer */}
                  <div className="ns9-plan-status-bar">
                    <div className="ns9-ps-left">
                      <span className="ns9-ps-circle-dash">—</span>
                      <div>
                        <div className="ns9-ps-day-title">
                          HÔM NAY · {weekDates[selectedDayIdx]?.dateNum}/{weekDates[selectedDayIdx]?.monthNum}
                        </div>
                        <div className="ns9-ps-weekday">{weekDates[selectedDayIdx]?.name}</div>
                        <div className="ns9-ps-subtitle">Chưa có việc nào — thêm việc đầu tiên nhé!</div>
                      </div>
                    </div>
                    <div className="ns9-ps-right">
                      <div className="ns9-ps-focus-top">
                        <span className="ns9-ps-focus-label">Focus còn lại</span>
                        <div className="ns9-ps-tools-row">
                          {/* Nút bật/tắt nhạc tập trung */}
                          <button
                            type="button"
                            className={`ns9-ps-tool-btn ${audioState.isPlaying ? 'is-playing' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAudio();
                            }}
                            title={audioState.isPlaying ? 'Tắt nhạc Lofi' : 'Bật nhạc Lofi tập trung'}
                            aria-label="Bật/Tắt nhạc tập trung"
                          >
                            {audioState.isPlaying ? (
                              <span className="ns9-soundwave-bars">
                                <span className="ns9-sw-bar" />
                                <span className="ns9-sw-bar" />
                                <span className="ns9-sw-bar" />
                              </span>
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" />
                                <circle cx="18" cy="16" r="3" />
                              </svg>
                            )}
                          </button>

                          {/* Nút mở đồng hồ nổi */}
                          <button
                            type="button"
                            className="ns9-ps-tool-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMiniTimer(true);
                              setIsOpen(false);
                            }}
                            title="Thu nhỏ thành đồng hồ nổi di chuyển được trên màn hình"
                            aria-label="Đồng hồ nổi"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                              <rect x="2" y="2" width="20" height="20" rx="3" />
                              <rect x="13" y="13" width="7" height="7" rx="1.5" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`ns9-ps-focus-pill ${focusRunning ? 'is-running' : ''}`}
                        onClick={handleToggleFocusRunning}
                        title={focusRunning ? 'Bấm để Tạm dừng Pomodoro' : 'Bấm để Bắt đầu Pomodoro'}
                        aria-label="Bắt đầu hoặc Tạm dừng Pomodoro"
                      >
                        {focusRunning && <span className="ns9-ps-pulse-dot" />}
                        <span className="ns9-ps-time-text">{formatTimer(focusSeconds)}</span>
                        <span className="ns9-ps-state-icon">
                          {focusRunning ? (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 7 Days Grid Pill Bar */}
                  <div className="ns9-weekdays-bar">
                    {weekDates.map((d, idx) => {
                      const count = dayPendingCounts[idx] || 0;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className={`ns9-wday-pill ${selectedDayIdx === idx ? 'is-active' : ''}`}
                          onClick={() => setSelectedDayIdx(idx)}
                        >
                          <span className="ns9-wday-label">{d.isToday ? 'Nay' : d.label}</span>
                          <span className="ns9-wday-num">{d.dateNum}</span>
                          {count > 0 && <span className="ns9-wday-dot" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add Task Input Bar */}
                  <form className="ns9-task-add-form" onSubmit={handleAddTask}>
                    <span className="ns9-task-add-plus">+</span>
                    <input
                      type="text"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Thêm việc cho hôm nay..."
                      className="ns9-task-add-input"
                    />
                    <button type="submit" className="ns9-task-add-submit" disabled={!newTaskInput.trim()}>
                      Thêm
                    </button>
                  </form>

                  {/* Filter Tabs */}
                  <div className="ns9-filter-segmented">
                    <button
                      type="button"
                      className={`ns9-fseg-btn ${planFilter === 'all' ? 'is-active' : ''}`}
                      onClick={() => setPlanFilter('all')}
                    >
                      <img src={ELEC_SRC.cool} alt="" className="ns9-fseg-mascot" />
                      <span>Tất cả {(weeklyPlan.tasks || []).filter((t) => t.dayIndex === selectedDayIdx).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`ns9-fseg-btn ${planFilter === 'pending' ? 'is-active' : ''}`}
                      onClick={() => setPlanFilter('pending')}
                    >
                      <img src={ELEC_SRC.fighting} alt="" className="ns9-fseg-mascot" />
                      <span>Cần làm {(weeklyPlan.tasks || []).filter((t) => t.dayIndex === selectedDayIdx && !t.completed).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`ns9-fseg-btn ${planFilter === 'done' ? 'is-active' : ''}`}
                      onClick={() => setPlanFilter('done')}
                    >
                      <img src={ELEC_SRC.celebrate} alt="" className="ns9-fseg-mascot" />
                      <span>Đã xong {(weeklyPlan.tasks || []).filter((t) => t.dayIndex === selectedDayIdx && t.completed).length}</span>
                    </button>
                  </div>

                  {/* Task list or Empty state */}
                  {currentDayTasks.length > 0 ? (
                    <div className="ns9-task-items-list">
                      {currentDayTasks.map((task) => (
                        <div key={task.id} className={`ns9-task-row ${task.completed ? 'is-done' : ''}`}>
                          <button
                            type="button"
                            className="ns9-task-check"
                            onClick={() => handleToggleTask(task.id)}
                            aria-label="Đổi trạng thái"
                          >
                            {task.completed && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <div className="ns9-task-title-group">
                            <span className="ns9-task-name">{task.text}</span>
                            <div className="ns9-task-meta-tags">
                              <span className="ns9-task-tag">{task.subject || 'Hóa học'}</span>
                              <span className="ns9-task-duration">{task.durationMin || 15}p</span>
                              <button
                                type="button"
                                className="ns9-task-ai-help-btn"
                                onClick={() => handleAskAiAboutTask(task)}
                                title="Nhờ ELEC AI hướng dẫn bài này"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Cùng AI giải
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ns9-task-remove"
                            onClick={() => deleteWeeklyTask(uid, task.id)}
                            title="Xóa nhiệm vụ"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ns9-plan-empty-center">
                      <img src={ELEC_SRC.wink} alt="Checklist Mascot" className="ns9-pe-mascot" />
                      <h5 className="ns9-pe-title">Ngày trống — lên danh sách thôi!</h5>
                      <p className="ns9-pe-sub">
                        Gõ việc cần làm vào ô phía trên, hoặc để ELEC AI gợi ý kế hoạch sát với mục tiêu của bạn.
                      </p>
                      <button
                        type="button"
                        className="ns9-pe-cta-btn"
                        onClick={handleGeneratePlan}
                      >
                        Nhận bài tập gợi ý
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  CỘT 3 (PHẢI): ĐOẠN CHAT MỚI (TRÒ CHUYỆN CÙNG ELEC AI)
                  ──────────────────────────────────────────────────────── */}
              <div className="ns9-pcol ns9-pcol-chat">
                {/* Header Đoạn chat mới */}
                <div className="ns9-chat-header-bar">
                  <button
                    type="button"
                    className="ns9-chat-action-icon"
                    onClick={() => {
                      setChatLog([
                        {
                          id: `welcome_${Date.now()}`,
                          role: 'assistant',
                          text: `Chào buổi tối, ${studentName}! Mình cùng chọn một việc vừa sức để bắt đầu thật nhẹ nhàng nhé.`,
                        },
                      ]);
                    }}
                    title="Tạo đoạn chat mới"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <div className="ns9-chat-title-dropdown">
                    <button
                      type="button"
                      className="ns9-chat-title-btn"
                      onClick={() => setShowChatHistoryDropdown((p) => !p)}
                    >
                      <span>
                        {sessions.find((s) => s.id === activeSessionId)?.title || 'Đoạn chat mới'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {showChatHistoryDropdown && (
                      <div className="ns9-chat-history-popover">
                        <div className="ns9-history-tabs">
                          <button
                            type="button"
                            className={`ns9-htab-btn ${historyTab === 'history' ? 'is-active' : ''}`}
                            onClick={() => setHistoryTab('history')}
                          >
                            Lịch sử đoạn chat ({sessions.length})
                          </button>
                          <button
                            type="button"
                            className={`ns9-htab-btn ${historyTab === 'persona' ? 'is-active' : ''}`}
                            onClick={() => setHistoryTab('persona')}
                          >
                            Phong cách AI
                          </button>
                        </div>

                        {historyTab === 'history' ? (
                          <>
                            <button
                              type="button"
                              className="ns9-new-chat-action-btn"
                              onClick={handleStartNewChat}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              Tạo đoạn chat mới
                            </button>

                            <div className="ns9-sessions-list">
                              {sessions.length === 0 ? (
                                <div style={{ fontSize: 11.5, color: '#94a3b8', padding: '16px 8px', textAlign: 'center' }}>
                                  Chưa có lịch sử đoạn chat nào.
                                </div>
                              ) : (
                                sessions.map((s) => (
                                  <div
                                    key={s.id}
                                    className={`ns9-session-item ${s.id === activeSessionId ? 'is-current' : ''}`}
                                    onClick={() => handleSelectSession(s)}
                                  >
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div className="ns9-session-title">{s.title || 'Đoạn chat'}</div>
                                      <div className="ns9-session-meta">
                                        {new Date(s.updatedAt).toLocaleDateString('vi-VN')} · {s.messages?.length || 0} tin
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="ns9-session-del"
                                      onClick={(e) => handleDeleteSession(e, s.id)}
                                      title="Xóa đoạn chat này"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="ns9-persona-popover-content">
                            <div className="ns9-popover-title">Chọn tính cách ELEC AI:</div>
                            {PERSONAS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                className={`ns9-persona-pop-item ${persona === p.id ? 'is-selected' : ''}`}
                                onClick={() => {
                                  setPersona(p.id);
                                  setShowChatHistoryDropdown(false);
                                }}
                              >
                                <span className="ns9-pop-label">{p.label}</span>
                                <span className="ns9-pop-desc">{p.desc}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ns9-chat-header-right">
                    <button
                      type="button"
                      className="ns9-chat-action-icon"
                      onClick={() => {
                        window.location.hash = 'ai';
                        setIsOpen(false);
                      }}
                      title="Phóng to toàn màn hình"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="ns9-chat-action-icon ns9-close-x"
                      onClick={() => setIsOpen(false)}
                      title="Đóng"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Vùng tin nhắn chat & Quick Pills */}
                <div className="ns9-chat-scroll-area" ref={chatScrollRef}>
                  {/* Tin nhắn mở đầu chuẩn ảnh mẫu */}
                  <div className="ns9-chat-ai-row">
                    <img src={ELEC_SRC.hello} alt="ELEC AI" className="ns9-c-avatar" />
                    <div className="ns9-c-bubble-group">
                      <div className="ns9-c-persona-badge">
                        <span className="ns9-c-name">ELEC AI</span>
                        <span className="ns9-c-mood-tag">
                          {PERSONAS.find((p) => p.id === persona)?.label || 'Dịu dàng'}
                        </span>
                      </div>
                      <div className="ns9-c-speech-card">
                        <div className="ns9-c-speech-txt">
                          <MarkdownLike text={chatLog[0]?.text || `Chào buổi tối, ${studentName}! Mình cùng chọn một việc vừa sức để bắt đầu thật nhẹ nhàng nhé.`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5 Quick Action Pills */}
                  <div className="ns9-quick-pills-container">
                    {QUICK_PILLS.map((qp) => (
                      <button
                        key={qp.id}
                        type="button"
                        className="ns9-pill-item-btn"
                        onClick={() => handleSendChat(qp.text)}
                      >
                        <span className="ns9-pill-dot" style={{ background: qp.dotColor }} />
                        <span className="ns9-pill-txt">{qp.text}</span>
                      </button>
                    ))}
                  </div>

                  {/* Lịch sử hội thoại tiếp theo */}
                  {chatLog.slice(1).map((msg) => (
                    <div
                      key={msg.id}
                      className={`ns9-msg-line ${msg.role === 'user' ? 'is-user-line' : 'is-ai-line'}`}
                    >
                      {msg.role === 'assistant' && (
                        <img src={ELEC_SRC.default} alt="ELEC" className="ns9-c-avatar-sm" />
                      )}
                      <div className="ns9-msg-bubble">
                        {msg.image && (
                          <img src={msg.image} alt="Đề bài đính kèm" className="ns9-chat-attached-img" />
                        )}
                        {msg.text && (
                          <div className="ns9-msg-text">
                            <MarkdownLike text={msg.text} />
                          </div>
                        )}
                        {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                          <div className="ns9-msg-actions-row">
                            {msg.actions.map((act) => (
                              <button
                                key={act.id}
                                type="button"
                                className={`ns9-msg-action-btn ${act.variant === 'purple' ? 'variant-purple' : ''}`}
                                onClick={() => handleActionClick(act.action, act.payload)}
                              >
                                {act.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <UserAvatar user={user} size={30} title="Bạn" />
                      )}
                    </div>
                  ))}

                  {/* Typing animation */}
                  {isAiLoading && (
                    <div className="ns9-msg-line is-ai-line">
                      <img src={ELEC_SRC.think} alt="ELEC Thinking" className="ns9-c-avatar-sm" />
                      <div className="ns9-msg-bubble is-typing">
                        <span className="ns9-typing-dot" />
                        <span className="ns9-typing-dot" />
                        <span className="ns9-typing-dot" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Input Bar kèm Upload Ảnh & Slash Command Menu */}
                <div style={{ position: 'relative' }}>
                  {/* Input ẩn cho file và camera */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    style={{ display: 'none' }}
                    onChange={handlePickImage}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handlePickImage}
                  />

                  {/* Preview ảnh đính kèm trước khi gửi */}
                  {attachedImage && (
                    <div className="ns9-attached-preview-bar">
                      <div className="ns9-attached-thumb-wrap">
                        <img src={attachedImage.dataUrl} alt="Preview" className="ns9-attached-thumb" />
                        <button
                          type="button"
                          className="ns9-attached-remove-btn"
                          onClick={handleRemoveImage}
                          title="Gỡ ảnh"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="ns9-attached-info">
                        <span className="ns9-attached-name">{attachedImage.name || 'Ảnh đề bài'}</span>
                        <span className="ns9-attached-tip">ELEC AI sẽ nhận diện & giải chi tiết đề bài trong ảnh</span>
                      </div>
                    </div>
                  )}

                  {/* Popover mở rộng khi ấn vào dấu + */}
                  {slashMenuOpen && (
                    <div className="ns9-slash-menu-popover">
                      <div className="ns9-slash-header">Gửi ảnh đề bài & Lệnh nhanh:</div>
                      <button
                        type="button"
                        className="ns9-slash-item"
                        onClick={() => {
                          setSlashMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                      >
                        <span className="ns9-slash-cmd" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          Tải ảnh từ máy
                        </span>
                        <span className="ns9-slash-desc">PNG, JPG, HEIC</span>
                      </button>

                      <button
                        type="button"
                        className="ns9-slash-item"
                        onClick={() => {
                          setSlashMenuOpen(false);
                          cameraInputRef.current?.click();
                        }}
                      >
                        <span className="ns9-slash-cmd" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Chụp ảnh mới
                        </span>
                        <span className="ns9-slash-desc">Mở camera</span>
                      </button>

                      <div style={{ height: 1, background: 'rgba(226, 232, 240, 0.8)', margin: '4px 0' }} />

                      {SLASH_COMMANDS.map((sc) => (
                        <button
                          key={sc.cmd}
                          type="button"
                          className="ns9-slash-item"
                          onClick={() => handleSelectSlashCmd(sc)}
                        >
                          <span className="ns9-slash-cmd">{sc.cmd}</span>
                          <span className="ns9-slash-desc">{sc.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <form
                    className="ns9-chat-footer-bar"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                  >
                    <button
                      type="button"
                      className="ns9-cf-tool-btn"
                      onClick={() => setSlashMenuOpen((prev) => !prev)}
                      title="Gửi ảnh hoặc chọn lệnh"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChatInput(val);
                        if (val.startsWith('/') && !slashMenuOpen) {
                          setSlashMenuOpen(true);
                        } else if (!val.startsWith('/') && slashMenuOpen && !val.includes('/')) {
                          setSlashMenuOpen(false);
                        }
                      }}
                      placeholder={attachedImage ? 'Thêm ghi chú đề bài (hoặc bấm gửi để AI giải ngay)...' : 'Gõ câu hỏi bài tập, hoặc ấn "+" để gửi ảnh...'}
                      className="ns9-cf-input"
                      disabled={isAiLoading}
                    />
                    <button
                      type="submit"
                      className="ns9-cf-send-btn"
                      disabled={(!chatInput.trim() && !attachedImage) || isAiLoading}
                      aria-label="Gửi tin nhắn"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================
          3. ĐỒNG HỒ NHỎ NỔI (DRAGGABLE FLOATING MINI POMODORO)
          Hiện khi tắt overlay (hoặc chuyển trang) nếu đang bật chế độ tập trung
          ============================================================ */}
      {!isOpen && showMiniTimer && (
        <aside
          className={`ns9-floating-mini-pomo ${focusRunning ? 'is-running' : 'is-paused'}`}
          style={{
            transform: `translate3d(${miniPos.x}px, ${miniPos.y}px, 0)`,
          }}
          onPointerDown={handleMiniPointerDown}
          onPointerMove={handleMiniPointerMove}
          onPointerUp={handleMiniPointerUp}
          role="region"
          aria-label="Đồng hồ Pomodoro mini nổi"
        >
          {/* Drag Handle 6 Dots */}
          <div className="ns9-mini-drag-handle" title="Kéo để di chuyển đồng hồ trên màn hình">
            <svg width="9" height="15" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="2" cy="2" r="1.5" />
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="2" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="2" cy="14" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
          </div>

          {/* Status Dot */}
          <span
            className={`ns9-mini-status-dot ${focusRunning ? 'is-pulsing' : ''}`}
            title={focusRunning ? 'Đang tập trung' : 'Đang tạm dừng'}
          />

          {/* Time Display */}
          <button
            type="button"
            className="ns9-mini-time-text"
            onClick={handleToggleFocusRunning}
            title={focusRunning ? 'Bấm để Tạm dừng' : 'Bấm để Tiếp tục'}
          >
            {formatTimer(focusSeconds)}
          </button>

          {/* Controls */}
          <div className="ns9-mini-controls ns9-no-drag">
            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              className={`ns9-mini-btn ns9-mini-btn-play ${focusRunning ? 'is-pause' : 'is-play'}`}
              onClick={handleToggleFocusRunning}
              title={focusRunning ? 'Tạm dừng Pomodoro' : 'Tiếp tục Pomodoro'}
              aria-label={focusRunning ? 'Tạm dừng' : 'Tiếp tục'}
            >
              {focusRunning ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Music Toggle Button with Equalizer bars & popover */}
            <div className="ns9-mini-music-wrap">
              <button
                type="button"
                className={`ns9-mini-btn ns9-mini-btn-music ${audioState.isPlaying ? 'is-playing' : ''}`}
                onClick={() => handleToggleAudio()}
                title={
                  audioState.isPlaying
                    ? `Đang phát: ${audioState.mode.toUpperCase()} (Click để Tắt)`
                    : 'Bật nhạc Lofi tập trung'
                }
                aria-label="Bật/Tắt nhạc tập trung"
              >
                {audioState.isPlaying ? (
                  <span className="ns9-mini-soundwaves">
                    <span className="ns9-msw-bar" />
                    <span className="ns9-msw-bar" />
                    <span className="ns9-msw-bar" />
                  </span>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="ns9-mini-music-caret"
                onClick={() => setShowAudioPopover((prev) => !prev)}
                title="Chọn loại nhạc (Lofi / Mưa / Lab)"
                aria-label="Tùy chọn nhạc"
              >
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Popover chọn nhạc & âm lượng */}
              {showAudioPopover && (
                <div className="ns9-mini-audio-popover ns9-no-drag">
                  <div className="ns9-map-title">Nhạc tập trung</div>
                  <div className="ns9-map-modes">
                    <button
                      type="button"
                      className={`ns9-map-mode-btn ${audioState.mode === 'lofi' && audioState.isPlaying ? 'is-active' : ''}`}
                      onClick={() => {
                        handleToggleAudio('lofi');
                        setShowAudioPopover(false);
                      }}
                    >
                      Lofi
                    </button>
                    <button
                      type="button"
                      className={`ns9-map-mode-btn ${audioState.mode === 'rain' && audioState.isPlaying ? 'is-active' : ''}`}
                      onClick={() => {
                        handleToggleAudio('rain');
                        setShowAudioPopover(false);
                      }}
                    >
                      Mưa rơi
                    </button>
                    <button
                      type="button"
                      className={`ns9-map-mode-btn ${audioState.mode === 'lab' && audioState.isPlaying ? 'is-active' : ''}`}
                      onClick={() => {
                        handleToggleAudio('lab');
                        setShowAudioPopover(false);
                      }}
                    >
                      Lab ASMR
                    </button>
                  </div>
                  <div className="ns9-map-vol-row">
                    <span>Âm lượng</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={audioState.volume}
                      onChange={(e) => handleChangeVolume(e.target.value)}
                      className="ns9-map-slider"
                      aria-label="Thanh trượt âm lượng"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expand / Maximize to full 3-column workspace */}
            <button
              type="button"
              className="ns9-mini-btn ns9-mini-btn-expand"
              onClick={() => {
                setIsOpen(true);
                setShowAudioPopover(false);
              }}
              title="Mở toàn cảnh 3 cột Trợ lý ELEC AI"
              aria-label="Mở toàn cảnh"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>

            {/* Close mini timer */}
            <button
              type="button"
              className="ns9-mini-btn ns9-mini-btn-close"
              onClick={() => {
                setShowMiniTimer(false);
                setShowAudioPopover(false);
              }}
              title="Đóng đồng hồ nổi"
              aria-label="Đóng đồng hồ"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
