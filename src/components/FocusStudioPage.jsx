/* ============================================================
   FocusStudioPage.jsx — Phòng Tập Trung Pomodoro & Flowmodoro Full-Bleed Pro
   ------------------------------------------------------------
   - FULL NỀN 100vw × 100dvh tràn viền (tối ưu 60fps cho Video nền YouTube)
   - 100% DỮ LIỆU THỰC TẾ qua Firebase Firestore (0 số liệu giả / 0 bot ảo)
   - Thanh tìm kiếm YouTube kiểu Spotlight (phím tắt "/" + tìm tức thì)
   - Đồng bộ 2 chiều thời gian thực với Con Chat 3 cột (PetWidget) & Mini Timer
   - 3 kiểu đồng hồ (Vòng tròn Gradient / Đồng hồ số / Flip Clock) + Pomodoro & Flowmodoro
   - Bộ trộn 12 âm thanh nền đa lớp Web Audio API (phát song song với YouTube)
   - Chế độ Zen Cinema (Ẩn HUD để ngắm nền & MV toàn màn hình)
   ============================================================ */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { getUserProfile } from '../lib/userProfileService.js';
import { getUserAspirationsState } from '../lib/aspirationService.js';
import {
  getWeeklyPlan,
  addWeeklyTask,
  toggleWeeklyTask,
  deleteWeeklyTask,
  getCurrentDayIndex,
} from '../lib/weeklyPlanService.js';
import {
  focusSession,
  useFocusSession,
  FOCUS_THEMES,
  FOCUS_MASCOTS,
  FOCUS_CHIMES,
  formatFocusClock,
  playFocusChime,
  getTodayKey,
} from '../lib/focusSessionStore.js';
import {
  youtubeMusic,
  useYouTubeMusic,
  CURATED_YOUTUBE_MUSIC,
  QUICK_SEARCH_CHIPS,
  formatTrackTime,
} from '../lib/youtubeMusicStore.js';
import {
  focusAudio,
  FOCUS_SOUND_TRACKS,
  FOCUS_NOISE_CATEGORIES,
  FOCUS_MIX_PRESETS,
} from '../lib/focusAudioEngine.js';
import {
  publishFocusPresence,
  subscribeRealFocusUsers,
} from '../lib/focusLiveService.js';
import StudyDeskIllustration from './StudyDeskIllustration.jsx';
import '../styles/focus-studio-pro.css';

const NOTE_TAGS = ['Chung', 'Hóa học', 'Vật lí', 'Sinh học', 'Toán', 'Ghi nhớ'];

const MUSIC_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'lofi', label: 'Lofi' },
  { id: 'piano', label: 'Piano & Alpha' },
  { id: 'vpop', label: 'V-Pop Chill' },
  { id: 'swm', label: 'Study With Me' },
];

function formatMinutesVi(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}g ${rem}p` : `${h} giờ`;
}

function formatTotalStudyVi(mins) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `Đã học ${h} giờ ${rem} phút` : `Đã học ${h} giờ`;
  }
  return `Đã học ${m} phút`;
}

function formatHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function FocusStudioPage({ onOpenUtilities }) {
  const { user } = useAuth();
  const uid = user?.uid || user?.id || 'guest';
  const isSignedIn = Boolean(user && uid !== 'guest');

  const userProfile = useMemo(() => getUserProfile(uid, user), [uid, user]);
  const aspState = useMemo(() => getUserAspirationsState(uid), [uid]);

  const studentName =
    userProfile?.fullName ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Bạn');
  const firstAspSchool = aspState?.aspirations?.[0]?.school || null;
  const studentUni = firstAspSchool?.code || 'ELEC';
  const studentUniName = firstAspSchool?.name || 'ELEC Science AI';
  const studentHighSchool = userProfile?.school || userProfile?.highSchool || '';

  // Global synced stores
  const focus = useFocusSession();
  const yt = useYouTubeMusic();
  const [noiseSnap, setNoiseSnap] = useState(() => focusAudio.getSnapshot());

  // 2 TAB CHÍNH: 'focus' (Phòng Pomodoro) | 'classroom' (Lớp học Bàn học)
  const [mainTab, setMainTab] = useState('focus');
  const [deskGroup, setDeskGroup] = useState('all'); // 'all' | 'my_group'
  const [deskFilter, setDeskFilter] = useState('all'); // 'all' | 'online'

  // 100% REAL Firestore Classroom & Leaderboard state
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const livePayloadRef = useRef(null);

  // Weekly plan synced 2-way with PetWidget
  const todayIdx = useMemo(() => getCurrentDayIndex(), []);
  const [weeklyPlan, setWeeklyPlan] = useState(() => getWeeklyPlan(uid));
  const [newTaskText, setNewTaskText] = useState('');

  // Active drawer panel + Zen Cinema HUD hide + Fullscreen
  const [activePanel, setActivePanel] = useState(null);
  const [zenHud, setZenHud] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Music & Noise panel states
  const [soundTab, setSoundTab] = useState('music'); // 'music' | 'noise'
  const [musicSubTab, setMusicSubTab] = useState('search'); // 'search' | 'curated' | 'favorites' | 'history'
  const [musicCat, setMusicCat] = useState('all');
  const [ytQuery, setYtQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytSearchMsg, setYtSearchMsg] = useState('');
  const [noiseCat, setNoiseCat] = useState('all');

  // Classroom & Leaderboard filters
  const [peerSearch, setPeerSearch] = useState('');
  const [lbMode, setLbMode] = useState('time'); // 'time' | 'streak'
  const [lbScope, setLbScope] = useState('today'); // 'today' | 'week' | 'month'

  // Notes & Settings draft
  const [noteInput, setNoteInput] = useState('');
  const [noteTag, setNoteTag] = useState('Chung');
  const [draftSettings, setDraftSettings] = useState(() => ({ ...focus.settings }));

  const stageRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const todayKey = getTodayKey();
  const todayMinutes = focus.minutesByDay[todayKey] || 0;
  const todaySessions = focus.sessionsByDay[todayKey] || 0;

  // Tổng số phút đã học toàn bộ các ngày lưu trên máy
  const myTotalMins = useMemo(() => {
    const vals = Object.values(focus.minutesByDay || {});
    return vals.reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [focus.minutesByDay]);

  // Giây tập trung hôm nay (cộng thêm số giây đang chạy của phiên Tập trung hiện tại để HH:MM:SS nhảy mượt từng giây)
  const activeRunningFocusSecs = useMemo(() => {
    if (focus.mode !== 'focus' || focus.status === 'idle') return 0;
    if (focus.settings.countMode === 'flowmodoro') return focus.elapsedSeconds % 60;
    const elapsed = Math.max(0, (focus.totalSeconds || 0) - (focus.secondsLeft || 0));
    return elapsed % 60;
  }, [focus.mode, focus.status, focus.settings.countMode, focus.elapsedSeconds, focus.totalSeconds, focus.secondsLeft]);

  const myLiveTodaySecs = todayMinutes * 60 + activeRunningFocusSecs;

  const myWeekMins = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += focus.minutesByDay[getTodayKey(Date.now() - i * 86400000)] || 0;
    return sum;
  }, [focus.minutesByDay]);

  const myMonthMins = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 30; i++) sum += focus.minutesByDay[getTodayKey(Date.now() - i * 86400000)] || 0;
    return sum;
  }, [focus.minutesByDay]);

  // Subscribe to Web Audio noise engine
  useEffect(() => focusAudio.subscribe(setNoiseSnap), []);

  // Preload YouTube IFrame API sớm + kích hoạt nền video khi ở trong Focus Studio
  useEffect(() => {
    youtubeMusic.preloadAPI();
    youtubeMusic.setInFocusStage(true);
    return () => {
      youtubeMusic.setInFocusStage(false);
    };
  }, []);

  // Sync weekly plan 2-way with PetWidget
  useEffect(() => {
    const sync = () => setWeeklyPlan(getWeeklyPlan(uid));
    window.addEventListener('elec-weekly-plan-changed', sync);
    return () => window.removeEventListener('elec-weekly-plan-changed', sync);
  }, [uid]);

  // ── REAL FIRESTORE LIVE SUBSCRIPTION (0 FAKE DATA) ──
  useEffect(() => {
    if (!isSignedIn) {
      setLiveUsers([]);
      setLiveConnected(false);
      return undefined;
    }
    return subscribeRealFocusUsers(uid, ({ users, isLiveConnected }) => {
      setLiveUsers(users || []);
      setLiveConnected(Boolean(isLiveConnected));
    });
  }, [uid, isSignedIn]);

  // Nhịp 1 giây trên Tab Lớp học để đồng hồ của các bạn học khác đang online cũng nhảy live từng giây
  useEffect(() => {
    if (mainTab !== 'classroom') return undefined;
    const hasOtherOnline = liveUsers.some((u) => u.id !== uid && u.online);
    if (!hasOtherOnline) return undefined;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mainTab, liveUsers, uid]);

  // Luôn giữ payload mới nhất trong ref để heartbeat 25s gửi đúng giây hiện tại mà không spam Firestore
  livePayloadRef.current = {
    mode: focus.mode,
    name: studentName,
    email: user?.email || '',
    photoURL: user?.photoURL || '',
    task: focus.activeTaskText || (focus.status === 'running' ? 'Đang tập trung học bài' : ''),
    uni: studentUni,
    uniName: studentUniName,
    highSchool: studentHighSchool,
    mascotId: focus.mascotId,
    todayMins: todayMinutes,
    todaySecs: myLiveTodaySecs,
    totalMins: myTotalMins,
    weekMins: myWeekMins,
    monthMins: myMonthMins,
    streakDays: Math.max(focus.streakDays, todayMinutes > 0 ? 1 : 0),
  };

  // ── REAL FIRESTORE HEARTBEAT (Cập nhật tức thì + định kỳ 25 giây + khi quay lại tab) ──
  useEffect(() => {
    if (!isSignedIn) return undefined;
    const isFocusingNow = focus.status === 'running';
    const sendPing = (activeFlag) => {
      publishFocusPresence(uid, {
        ...(livePayloadRef.current || {}),
        active: activeFlag,
      });
    };

    sendPing(isFocusingNow);
    const interval = isFocusingNow ? setInterval(() => sendPing(true), 25000) : null;
    const onVisible = () => {
      if (document.visibilityState === 'visible') sendPing(isFocusingNow);
    };
    const onUnload = () => sendPing(false);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pagehide', onUnload);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [
    isSignedIn,
    uid,
    focus.status,
    focus.mode,
    focus.activeTaskText,
    focus.mascotId,
    studentName,
    studentUni,
    studentUniName,
    todayMinutes,
    myTotalMins,
    myWeekMins,
    myMonthMins,
    focus.streakDays,
  ]);

  // Update browser tab title
  useEffect(() => {
    if (focus.status === 'running') {
      const secs =
        focus.settings.countMode === 'flowmodoro' && focus.mode === 'focus'
          ? focus.elapsedSeconds
          : focus.secondsLeft;
      const lbl =
        focus.mode === 'focus'
          ? 'Tập trung'
          : focus.mode === 'short_break'
            ? 'Nghỉ ngắn'
            : 'Nghỉ dài';
      document.title = `${formatFocusClock(secs)} · ${lbl} — ELEC AI`;
    } else {
      document.title = 'Phòng Tập Trung Pomodoro — ELEC AI';
    }
    return () => {
      document.title = 'ELEC AI';
    };
  }, [focus.status, focus.secondsLeft, focus.elapsedSeconds, focus.mode, focus.settings.countMode]);

  // Fullscreen & Keyboard shortcuts ("/" mở tìm nhạc YouTube, "Esc" đóng bảng / thoát Zen HUD)
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      if (e.key === 'Escape') {
        if (activePanel) setActivePanel(null);
        else if (zenHud) setZenHud(false);
      } else if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setSoundTab('music');
        setActivePanel('sounds');
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('keydown', onKey);
    };
  }, [activePanel, zenHud]);

  // Sync settings draft
  useEffect(() => {
    if (activePanel === 'settings') {
      setDraftSettings({ ...focus.settings });
    }
  }, [activePanel, focus.settings]);

  // Debounced live YouTube search khi gõ >= 3 ký tự
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const trimmed = ytQuery.trim();
    if (activePanel !== 'sounds' || soundTab !== 'music' || trimmed.length < 3) return undefined;
    // Không auto-search nếu là link đang gõ dở
    if (trimmed.startsWith('http') && trimmed.length < 24) return undefined;

    debounceTimerRef.current = setTimeout(() => {
      handleYouTubeSearch(trimmed, true);
    }, 520);
    return () => clearTimeout(debounceTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytQuery]);

  const activeTheme = useMemo(
    () => FOCUS_THEMES.find((t) => t.id === focus.themeId) || FOCUS_THEMES[0],
    [focus.themeId]
  );

  const activeMascot = useMemo(
    () => FOCUS_MASCOTS.find((m) => m.id === focus.mascotId) || FOCUS_MASCOTS[0],
    [focus.mascotId]
  );

  const todayTasks = useMemo(
    () => (weeklyPlan.tasks || []).filter((t) => t.dayIndex === todayIdx),
    [weeklyPlan.tasks, todayIdx]
  );
  const pendingTasksCount = todayTasks.filter((t) => !t.completed).length;

  const isFlowFocus = focus.settings.countMode === 'flowmodoro' && focus.mode === 'focus';
  const displaySeconds = isFlowFocus ? focus.elapsedSeconds : focus.secondsLeft;
  const formattedClock = formatFocusClock(displaySeconds);
  const [clockPartA, clockPartB, clockPartC] = formattedClock.split(':');

  const ringProgress = useMemo(() => {
    if (isFlowFocus) return Math.min(1, (focus.elapsedSeconds % 3600) / 3600);
    if (!focus.totalSeconds) return 0;
    return Math.max(0, Math.min(1, (focus.totalSeconds - focus.secondsLeft) / focus.totalSeconds));
  }, [isFlowFocus, focus.elapsedSeconds, focus.totalSeconds, focus.secondsLeft]);

  const phaseMeta = useMemo(() => {
    if (focus.mode === 'short_break') {
      return { label: 'Nghỉ ngắn', color: '#10b981', gradStart: '#34d399', gradEnd: '#059669' };
    }
    if (focus.mode === 'long_break') {
      return { label: 'Nghỉ dài', color: '#a855f7', gradStart: '#c084fc', gradEnd: '#7c3aed' };
    }
    return {
      label: isFlowFocus ? 'Flowmodoro Tự do' : 'Tập trung',
      color: activeTheme.accent || '#6366f1',
      gradStart: '#38bdf8',
      gradEnd: '#6366f1',
    };
  }, [focus.mode, isFlowFocus, activeTheme.accent]);

  const earnedFlowBreakMins = Math.max(3, Math.min(30, Math.round(Math.max(1, focus.elapsedSeconds / 60) / 5)));

  // ── MERGE REAL FIRESTORE USERS + CURRENT USER (0 FAKE DATA!) ──
  const allRealStudents = useMemo(() => {
    const me = {
      id: uid,
      isMe: true,
      name: studentName,
      photoURL: user?.photoURL || null,
      uni: studentUni,
      uniName: studentUniName,
      highSchool: studentHighSchool,
      task:
        focus.activeTaskText ||
        (focus.status === 'running' ? 'Đang tập trung cao độ' : 'Sẵn sàng vào phiên'),
      todayMins: todayMinutes,
      todaySecs: myLiveTodaySecs,
      totalMins: myTotalMins,
      weekMins: myWeekMins,
      monthMins: myMonthMins,
      streak: Math.max(focus.streakDays, todayMinutes > 0 ? 1 : 0),
      online: focus.status === 'running',
      mode: focus.mode,
      mascot: activeMascot.src,
    };

    const others = liveUsers.filter((u) => u.id !== uid);
    return [me, ...others];
  }, [
    uid,
    studentName,
    user?.photoURL,
    studentUni,
    studentUniName,
    studentHighSchool,
    focus.activeTaskText,
    focus.status,
    focus.mode,
    todayMinutes,
    myLiveTodaySecs,
    myTotalMins,
    myWeekMins,
    myMonthMins,
    focus.streakDays,
    activeMascot.src,
    liveUsers,
  ]);

  const rankedStudents = useMemo(() => {
    return [...allRealStudents]
      .sort((a, b) => (b.todaySecs || b.todayMins * 60) - (a.todaySecs || a.todayMins * 60) || Number(b.online) - Number(a.online))
      .map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [allRealStudents]);

  const filteredClassroom = useMemo(() => {
    const q = peerSearch.trim().toLowerCase();
    let list = [...rankedStudents];
    if (deskGroup === 'my_group') {
      list = list.filter((s) => s.isMe || (studentUni && s.uni === studentUni));
    }
    if (deskFilter === 'online') {
      list = list.filter((s) => s.online);
    }
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.uni || '').toLowerCase().includes(q) ||
          (s.uniName || '').toLowerCase().includes(q) ||
          (s.highSchool || '').toLowerCase().includes(q) ||
          (s.task || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => Number(b.online) - Number(a.online) || a.rank - b.rank);
  }, [rankedStudents, peerSearch, deskGroup, deskFilter, studentUni]);

  const leaderboardRows = useMemo(() => {
    const list = [...allRealStudents];
    if (lbMode === 'streak') {
      list.sort((a, b) => b.streak - a.streak || b.todayMins - a.todayMins);
    } else {
      const key = lbScope === 'month' ? 'monthMins' : lbScope === 'week' ? 'weekMins' : 'todayMins';
      list.sort((a, b) => b[key] - a[key]);
    }
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [allRealStudents, lbMode, lbScope]);

  const myRankRow = leaderboardRows.find((r) => r.isMe);
  const realOnlineCount = allRealStudents.filter((s) => s.online).length;

  // Handlers
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (stageRef.current || document.documentElement).requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch { /* ignore */ }
  };

  const handleYouTubeSearch = async (queryOverride, silent = false) => {
    const q = String(queryOverride !== undefined ? queryOverride : ytQuery).trim();
    if (!q) return;
    if (queryOverride !== undefined) setYtQuery(q);
    setMusicSubTab('search');
    setYtSearching(true);
    if (!silent) setYtSearchMsg('');
    const res = await youtubeMusic.searchYouTube(q);
    setYtSearching(false);
    setYtResults(res.results || []);
    if (res.direct && res.results?.[0]) {
      youtubeMusic.playTrack(res.results[0], res.results);
      setYtSearchMsg('Đã mở trực tiếp video từ đường dẫn YouTube của bạn!');
    } else if (!res.ok) {
      setYtSearchMsg(res.error || 'Đang hiển thị kho nhạc học bài sẵn có.');
    } else if (!res.results?.length) {
      setYtSearchMsg('Không tìm thấy bài hát phù hợp — thử từ khóa khác nhé!');
    } else {
      setYtSearchMsg('');
    }
  };

  const handleCopyInviteLink = () => {
    try {
      const url = `${window.location.origin}/#tap-trung`;
      navigator.clipboard?.writeText(url);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const handleAddFocusTask = (e) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;
    addWeeklyTask(uid, todayIdx, newTaskText.trim());
    setWeeklyPlan(getWeeklyPlan(uid));
    setNewTaskText('');
  };

  const handleToggleFocusTask = (taskId) => {
    toggleWeeklyTask(uid, taskId);
    setWeeklyPlan(getWeeklyPlan(uid));
  };

  const handleDeleteFocusTask = (taskId) => {
    deleteWeeklyTask(uid, taskId);
    setWeeklyPlan(getWeeklyPlan(uid));
    if (focus.activeTaskId === taskId) {
      focusSession.setActiveTask(null, '');
    }
  };

  const handleSaveSettings = () => {
    focusSession.updateSettings(draftSettings);
    setActivePanel(null);
  };

  const handleAddNote = (e) => {
    e?.preventDefault();
    if (!noteInput.trim()) return;
    focusSession.addNote(noteInput.trim(), noteTag);
    setNoteInput('');
  };

  const handleCycleMascot = () => {
    const idx = FOCUS_MASCOTS.findIndex((m) => m.id === focus.mascotId);
    const next = FOCUS_MASCOTS[(idx + 1) % FOCUS_MASCOTS.length];
    focusSession.setMascot(next.id);
  };

  const filteredCurated = useMemo(() => {
    if (musicCat === 'all') return CURATED_YOUTUBE_MUSIC;
    return CURATED_YOUTUBE_MUSIC.filter((t) => t.category === musicCat);
  }, [musicCat]);

  const filteredNoiseTracks = useMemo(() => {
    const list = FOCUS_SOUND_TRACKS.filter((t) => t.id !== 'none');
    if (noiseCat === 'all') return list;
    return list.filter((t) => t.category === noiseCat);
  }, [noiseCat]);

  const isVideoBgActive = yt.videoBgEnabled && Boolean(yt.currentTrack?.videoId);
  const isLightScene = Boolean(activeTheme.isLight) && !isVideoBgActive;

  const R = 136;
  const C = 2 * Math.PI * R;
  const tipAngle = (ringProgress * 360 - 90) * (Math.PI / 180);
  const tipX = 160 + R * Math.cos(tipAngle);
  const tipY = 160 + R * Math.sin(tipAngle);

  return (
    <div
      ref={stageRef}
      className={`fs9-stage is-fullbleed ${isLightScene ? 'is-light-scene' : ''} ${isVideoBgActive ? 'has-video-bg' : ''} ${focus.status === 'running' ? 'is-running' : ''} ${zenHud ? 'is-zen-hud' : ''}`}
      style={{
        '--fs9-accent': phaseMeta.color,
        background: isVideoBgActive ? 'transparent' : activeTheme.bg,
      }}
    >
      {/* Lớp không gian bầu trời & ánh sáng chiều sâu (chỉ hiện khi không bật Video nền YouTube) */}
      {!isVideoBgActive && (
        <div className="fs9-atmosphere-layer" aria-hidden="true">
          <div className="fs9-atmo-dome dome-a" />
          <div className="fs9-atmo-dome dome-b" />
          {!isLightScene && (
            <svg className="fs9-star-canvas" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
              <circle cx="160" cy="140" r="1.4" fill="#fff" opacity="0.6" />
              <circle cx="310" cy="240" r="1" fill="#93c5fd" opacity="0.5" />
              <circle cx="520" cy="110" r="1.6" fill="#fff" opacity="0.7" />
              <circle cx="880" cy="95" r="1.2" fill="#e0e7ff" opacity="0.55" />
              <circle cx="1140" cy="180" r="1.7" fill="#fff" opacity="0.65" />
              <circle cx="1310" cy="120" r="1.1" fill="#bae6fd" opacity="0.5" />
              <circle cx="210" cy="640" r="1.2" fill="#fff" opacity="0.45" />
              <circle cx="1220" cy="610" r="1.5" fill="#fff" opacity="0.55" />
              <circle cx="1030" cy="760" r="1.1" fill="#c7d2fe" opacity="0.45" />
              <circle cx="420" cy="750" r="1.3" fill="#fff" opacity="0.4" />
            </svg>
          )}
        </div>
      )}

      {/* Lớp phủ cinema vignette dịu mắt, tối ưu độ tương phản chữ mà không gây giật 60fps video */}
      <div
        className="fs9-dim-layer"
        style={{
          opacity: isVideoBgActive ? focus.bgDim : isLightScene ? 0 : 0.22,
        }}
        aria-hidden="true"
      />

      {/* Nút khôi phục HUD khi đang ở chế độ Zen Cinema */}
      {zenHud && (
        <button
          type="button"
          className="fs9-zen-restore-btn"
          onClick={() => setZenHud(false)}
          title="Hiện lại thanh điều khiển (hoặc nhấn Esc)"
        >
          Hiện điều khiển (Esc)
        </button>
      )}

      {/* ── 1. TOP HUD BAR (GỌN GÀNG VỚI 2 TAB CHÍNH: TẬP TRUNG & LỚP HỌC) ── */}
      {!zenHud && (
        <header className="fs9-topbar">
          <div className="fs9-topbar-left">
            <a
              href="#home"
              className="fs9-home-back-btn"
              title="Quay về Trang chủ ELEC AI (đồng hồ & nhạc vẫn tiếp tục chạy ngầm)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Trang chủ</span>
            </a>

            <div className="fs9-brand-pill">
              <img src="/img/elec/elec-cool.png" alt="ELEC" className="fs9-brand-mascot" draggable={false} />
              <div className="fs9-brand-copy">
                <strong>ELEC Focus</strong>
                <span>{focus.settings.countMode === 'flowmodoro' ? 'Flowmodoro' : 'Pomodoro Studio'}</span>
              </div>
            </div>
          </div>

          {/* 2 TAB CHÍNH GIỮA THANH TRÊN: Tập trung | Lớp học Bàn học */}
          <div className="fs9-main-tabs" role="tablist" aria-label="Chuyển giữa Tập trung và Lớp học">
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'focus'}
              className={`fs9-main-tab ${mainTab === 'focus' ? 'is-active' : ''}`}
              onClick={() => setMainTab('focus')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
              <span>Tập trung</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === 'classroom'}
              className={`fs9-main-tab ${mainTab === 'classroom' ? 'is-active' : ''}`}
              onClick={() => {
                setMainTab('classroom');
                setZenHud(false);
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 12h18" />
                <path d="M5 12v7" />
                <path d="M19 12v7" />
                <circle cx="12" cy="7" r="2.8" />
              </svg>
              <span>Lớp học</span>
              <span className={`fs9-tab-live-pill ${realOnlineCount > 0 ? 'is-live' : ''}`}>
                <i className={`fs9-live-dot ${realOnlineCount > 0 ? 'is-live' : 'is-idle'}`} />
                {realOnlineCount}
              </span>
            </button>
          </div>

          <div className="fs9-topbar-right">
            <button
              type="button"
              className="fs9-stat-pill"
              onClick={() => setActivePanel(activePanel === 'leaderboard' ? null : 'leaderboard')}
              title="Xem BXH Thời gian tập trung thực tế"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatMinutesVi(todayMinutes)} hôm nay</span>
            </button>

            {mainTab === 'focus' && (
              <button
                type="button"
                className="fs9-top-icon-btn"
                onClick={() => setZenHud(true)}
                title="Chế độ Zen Cinema (Ẩn thanh công cụ để ngắm nền toàn màn hình)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}

            <button
              type="button"
              className="fs9-top-icon-btn"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Phóng toàn màn hình (F11)'}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </header>
      )}

      {/* ── 2. NỘI DUNG THEO 2 TAB: TAB 1 (TẬP TRUNG) | TAB 2 (LỚP HỌC BÀN HỌC) ── */}
      {mainTab === 'focus' ? (
        <main className="fs9-center-stage">
          {/* Thanh chọn nhanh phiên Pomodoro / Nghỉ ngắn / Nghỉ dài gọn gàng */}
          {!zenHud && (
            <div className="fs9-phase-switcher is-compact" role="tablist" aria-label="Chế độ phiên tập trung">
              {focus.settings.countMode === 'flowmodoro' ? (
                <>
                  <button
                    type="button"
                    className={`fs9-phase-btn ${focus.mode === 'focus' ? 'is-active' : ''}`}
                    onClick={() => focusSession.setMode('focus')}
                  >
                    <span>Flowmodoro</span>
                    <em>Tự do</em>
                  </button>
                  <button
                    type="button"
                    className={`fs9-phase-btn ${focus.mode !== 'focus' ? 'is-active' : ''}`}
                    onClick={() => focusSession.setMode('short_break')}
                  >
                    <span>Giải lao</span>
                    <em>{focus.settings.shortBreakMinutes}p</em>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`fs9-phase-btn ${focus.mode === 'focus' ? 'is-active' : ''}`}
                    onClick={() => focusSession.setMode('focus')}
                  >
                    <span>Tập trung</span>
                    <em>{focus.settings.workMinutes}p</em>
                  </button>
                  <button
                    type="button"
                    className={`fs9-phase-btn ${focus.mode === 'short_break' ? 'is-active' : ''}`}
                    onClick={() => focusSession.setMode('short_break')}
                  >
                    <span>Nghỉ ngắn</span>
                    <em>{focus.settings.shortBreakMinutes}p</em>
                  </button>
                  <button
                    type="button"
                    className={`fs9-phase-btn ${focus.mode === 'long_break' ? 'is-active' : ''}`}
                    onClick={() => focusSession.setMode('long_break')}
                  >
                    <span>Nghỉ dài</span>
                    <em>{focus.settings.longBreakMinutes}p</em>
                  </button>
                </>
              )}
            </div>
          )}

          {!zenHud && (
            <div className="fs9-companion-row">
              <button
                type="button"
                className="fs9-companion-mascot-btn"
                onClick={handleCycleMascot}
                title="Bấm để đổi biểu cảm Bé Elec"
              >
                <img
                  src={activeMascot.src}
                  alt={activeMascot.label}
                  className={`fs9-companion-img ${focus.status === 'running' ? 'is-bobbing' : ''}`}
                  draggable={false}
                />
              </button>
              <div className="fs9-companion-speech">
                <span className={`fs9-status-dot ${focus.status === 'running' ? 'is-live' : ''}`} />
                <span>
                  {focus.status === 'running'
                    ? focus.mode === 'focus'
                      ? `${activeMascot.label} đang tập trung cùng ${studentName} — giữ vững nhịp nhé!`
                      : 'Giờ giải lao thư giãn — uống ngụm nước và thả lỏng vai nào!'
                    : focus.status === 'paused'
                      ? 'Đang tạm dừng — bấm Tiếp tục học để chạy tiếp nhé!'
                      : `${activeMascot.label} sẵn sàng đồng hành cùng bạn!`}
                </span>
              </div>
            </div>
          )}

          {/* Đồng hồ trung tâm theo 3 kiểu: Gradient Ring / Digital / Flip */}
          <div className={`fs9-clock-showcase style-${focus.settings.clockStyle}`}>
            {focus.settings.clockStyle === 'ring' && !isFlowFocus ? (
              <div className="fs9-ring-wrap">
                <div className="fs9-ring-disc" aria-hidden="true" />
                <svg viewBox="0 0 320 320" className="fs9-ring-svg">
                  <defs>
                    <linearGradient id="fs9RingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={phaseMeta.gradStart} />
                      <stop offset="100%" stopColor={phaseMeta.gradEnd} />
                    </linearGradient>
                  </defs>
                  <circle cx="160" cy="160" r={R + 12} className="fs9-ring-outer" />
                  <circle cx="160" cy="160" r={R - 14} className="fs9-ring-ticks" />
                  <circle cx="160" cy="160" r={R} className="fs9-ring-track" />
                  <circle
                    cx="160"
                    cy="160"
                    r={R}
                    className="fs9-ring-fill"
                    style={{
                      stroke: 'url(#fs9RingGrad)',
                      strokeDasharray: C,
                      strokeDashoffset: C * (1 - ringProgress),
                      transform: 'rotate(-90deg)',
                      transformOrigin: '160px 160px',
                    }}
                  />
                  {ringProgress > 0.002 && (
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r="6"
                      className="fs9-ring-tip-dot"
                      fill="#ffffff"
                      stroke={phaseMeta.gradStart}
                      strokeWidth="3"
                    />
                  )}
                </svg>
                <div className="fs9-ring-center">
                  <span className="fs9-clock-phase-badge">{phaseMeta.label}</span>
                  <div className="fs9-clock-digits">{formattedClock}</div>
                  <div className="fs9-cycle-dots">
                    {Array.from({ length: Math.max(2, Math.min(8, focus.settings.longBreakInterval)) }).map((_, i) => (
                      <span
                        key={i}
                        className={`fs9-cycle-dot ${i < (focus.cycle % focus.settings.longBreakInterval) ? 'is-done' : ''}`}
                      />
                    ))}
                    <small>Phiên {todaySessions} hôm nay</small>
                  </div>
                </div>
              </div>
            ) : focus.settings.clockStyle === 'flip' ? (
              <div className="fs9-flip-wrap">
                <span className="fs9-clock-phase-badge">{phaseMeta.label}</span>
                <div className="fs9-flip-cards">
                  <div className="fs9-flip-card">
                    <span>{clockPartA}</span>
                    <i className="fs9-flip-hinge" aria-hidden="true" />
                  </div>
                  <span className="fs9-flip-colon">:</span>
                  <div className="fs9-flip-card">
                    <span>{clockPartB}</span>
                    <i className="fs9-flip-hinge" aria-hidden="true" />
                  </div>
                  {clockPartC && (
                    <>
                      <span className="fs9-flip-colon">:</span>
                      <div className="fs9-flip-card">
                        <span>{clockPartC}</span>
                        <i className="fs9-flip-hinge" aria-hidden="true" />
                      </div>
                    </>
                  )}
                </div>
                <div className="fs9-cycle-dots">
                  <small>
                    {isFlowFocus
                      ? `Nghỉ tích lũy: +${earnedFlowBreakMins} phút`
                      : `Chu kỳ ${(focus.cycle % focus.settings.longBreakInterval)}/${focus.settings.longBreakInterval} · ${todaySessions} phiên hôm nay`}
                  </small>
                </div>
              </div>
            ) : (
              <div className="fs9-digital-wrap">
                <span className="fs9-clock-phase-badge">{phaseMeta.label}</span>
                <div className="fs9-digital-digits">{formattedClock}</div>
                <div className="fs9-digital-progress">
                  <span style={{ width: `${Math.round(ringProgress * 100)}%`, background: `linear-gradient(90deg, ${phaseMeta.gradStart}, ${phaseMeta.gradEnd})` }} />
                </div>
                <div className="fs9-cycle-dots">
                  <small>
                    {isFlowFocus
                      ? `Đếm tiến tự do · Nghỉ tích lũy: +${earnedFlowBreakMins} phút`
                      : `Chu kỳ ${(focus.cycle % focus.settings.longBreakInterval)}/${focus.settings.longBreakInterval} · ${todaySessions} phiên hôm nay`}
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Active Task Target Pill */}
          {!zenHud && (
            <button
              type="button"
              className="fs9-active-task-pill"
              onClick={() => setActivePanel('tasks')}
              title="Chọn hoặc thêm nhiệm vụ đang tập trung (đồng bộ Kế hoạch tuần)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span className="fs9-atp-text">
                {focus.activeTaskText ? `Đang tập trung: ${focus.activeTaskText}` : 'Chọn nhiệm vụ cho phiên học này...'}
              </span>
              {focus.activeTaskId && (
                <span className="fs9-atp-pomo">
                  {(focus.taskPomodoros[focus.activeTaskId]?.done || 0)}/{(focus.taskPomodoros[focus.activeTaskId]?.est || 2)} phiên
                </span>
              )}
            </button>
          )}

          {/* Primary Action Controls */}
          <div className="fs9-controls-row">
            <button
              type="button"
              className="fs9-ctrl-circle"
              onClick={() => focusSession.reset()}
              title="Đặt lại đồng hồ"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <button
              type="button"
              className={`fs9-ctrl-primary ${focus.status === 'running' ? 'is-pause' : ''}`}
              onClick={() => focusSession.toggle()}
            >
              {focus.status === 'running' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1.2" />
                    <rect x="14" y="4" width="4" height="16" rx="1.2" />
                  </svg>
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                  <span>{focus.status === 'paused' ? 'Tiếp tục học' : 'Bắt đầu học'}</span>
                </>
              )}
            </button>

            {isFlowFocus && focus.elapsedSeconds >= 30 ? (
              <button
                type="button"
                className="fs9-ctrl-break-btn"
                onClick={() => focusSession.finishFlowAndBreak()}
                title="Kết thúc phiên Flowmodoro & nhận thời gian nghỉ tương ứng"
              >
                Nghỉ +{earnedFlowBreakMins}p
              </button>
            ) : (
              <button
                type="button"
                className="fs9-ctrl-circle"
                onClick={() => focusSession.skipPhase()}
                title="Bỏ qua sang phiên tiếp theo"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            )}
          </div>

          {/* Dynamic Island YouTube Player + Spotlight Search Trigger */}
          {!zenHud && (
            <div className={`fs9-yt-player-bar ${yt.currentTrack ? 'has-track' : ''}`}>
              {yt.currentTrack ? (
                <>
                  <div className="fs9-yt-thumb-box">
                    <img
                      src={yt.currentTrack.thumbnail}
                      alt={yt.currentTrack.title}
                      className="fs9-yt-thumb"
                    />
                    {yt.isPlaying && (
                      <span className="fs9-yt-eq" aria-hidden="true">
                        <i /><i /><i />
                      </span>
                    )}
                  </div>

                  <div className="fs9-yt-meta">
                    <div className="fs9-yt-title-line">
                      <span className="fs9-yt-title" title={yt.currentTrack.title}>{yt.currentTrack.title}</span>
                      {yt.isBuffering && <span className="fs9-yt-tag">Đang nạp...</span>}
                      {yt.currentTrack.isLive && <span className="fs9-yt-tag is-live">LIVE</span>}
                    </div>
                    <div className="fs9-yt-sub-row">
                      <span className="fs9-yt-channel">{yt.currentTrack.channel}</span>
                      {yt.duration > 0 && !yt.currentTrack.isLive && (
                        <span className="fs9-yt-times">
                          {formatTrackTime(yt.currentTime)} / {formatTrackTime(yt.duration)}
                        </span>
                      )}
                    </div>
                    {yt.duration > 0 && !yt.currentTrack.isLive && (
                      <div
                        className="fs9-yt-seek"
                        role="slider"
                        aria-label="Tua nhạc"
                        aria-valuemin={0}
                        aria-valuemax={Math.round(yt.duration)}
                        aria-valuenow={Math.round(yt.currentTime)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          youtubeMusic.seek(ratio * yt.duration);
                        }}
                      >
                        <span style={{ width: `${Math.min(100, (yt.currentTime / yt.duration) * 100)}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="fs9-yt-actions">
                    <button type="button" className="fs9-yt-btn" onClick={() => youtubeMusic.prev()} title="Bài trước">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="19 20 9 12 19 4 19 20" />
                        <rect x="5" y="5" width="2.5" height="14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="fs9-yt-btn is-main"
                      onClick={() => youtubeMusic.togglePlay()}
                      title={yt.isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc'}
                    >
                      {yt.isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                      )}
                    </button>
                    <button type="button" className="fs9-yt-btn" onClick={() => youtubeMusic.next()} title="Bài tiếp theo">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 4 15 12 5 20 5 4" />
                        <rect x="16.5" y="5" width="2.5" height="14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={`fs9-yt-btn ${yt.videoBgEnabled ? 'is-on' : ''}`}
                      onClick={() => youtubeMusic.setVideoBgEnabled(!yt.videoBgEnabled)}
                      title={yt.videoBgEnabled ? 'Tắt Video nền YouTube' : 'Bật Video nền toàn màn hình'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <rect x="2" y="4" width="20" height="16" rx="2.5" />
                        <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="fs9-yt-search-trigger"
                      onClick={() => {
                        setSoundTab('music');
                        setActivePanel('sounds');
                        setTimeout(() => searchInputRef.current?.focus(), 60);
                      }}
                      title="Tìm bài hát YouTube khác (phím /)"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span>Tìm bài</span>
                      <kbd>/</kbd>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="fs9-yt-empty-trigger"
                  onClick={() => {
                    setSoundTab('music');
                    setActivePanel('sounds');
                    setTimeout(() => searchInputRef.current?.focus(), 60);
                  }}
                >
                  <span className="fs9-yt-red-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="8 5 19 12 8 19 8 5" />
                    </svg>
                  </span>
                  <span className="fs9-yt-empty-copy">
                    Tìm &amp; phát bất kỳ bài nhạc YouTube nào (Lofi, HIEUTHUHAI, Sơn Tùng, Ghibli...)
                  </span>
                  <span className="fs9-yt-cta">
                    Tìm nhạc <kbd>/</kbd>
                  </span>
                </button>
              )}
            </div>
          )}
        </main>
      ) : (
        /* ── TAB 2: PHÒNG BÀN HỌC TẬP TRUNG (CHUẨN 9STUDY + 100% DỮ LIỆU THỰC TẾ) ── */
        <section className="fs9-room-view" aria-label="Lớp học Bàn học Tập trung">
          <div className="fs9-room-shell">
            {/* Thanh công cụ phụ: Lớp mục tiêu | Cộng đồng ELEC + BXH & Chọn mascot */}
            <div className="fs9-room-top-row">
              <div className="fs9-room-subtabs">
                <button
                  type="button"
                  className={`fs9-room-subtab ${deskGroup === 'my_group' ? 'is-active' : ''}`}
                  onClick={() => setDeskGroup('my_group')}
                >
                  Lớp mục tiêu ({studentUni})
                </button>
                <button
                  type="button"
                  className={`fs9-room-subtab ${deskGroup === 'all' ? 'is-active' : ''}`}
                  onClick={() => setDeskGroup('all')}
                >
                  Cộng đồng ELEC
                </button>
              </div>

              <div className="fs9-room-top-actions">
                <button
                  type="button"
                  className="fs9-room-pill-btn"
                  onClick={() => setActivePanel('leaderboard')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                  </svg>
                  <span>BXH Focus</span>
                </button>
                <button
                  type="button"
                  className="fs9-room-pill-btn"
                  onClick={() => setActivePanel('themes')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                    <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" />
                  </svg>
                  <span>Chọn mascot</span>
                </button>
              </div>
            </div>

            {/* HERO CARD: BÀN HỌC CỦA BẠN */}
            <div className={`fs9-my-desk-hero ${focus.status === 'running' ? 'is-running' : ''}`}>
              <div className="fs9-my-desk-left">
                <StudyDeskIllustration
                  isActive={focus.status === 'running'}
                  mascotSrc={activeMascot.src}
                  preferMascot={true}
                  name={studentName}
                  size="lg"
                />

                <div className="fs9-my-desk-info">
                  <div className="fs9-my-desk-meta-chips">
                    <span className="fs9-my-desk-tag">BÀN HỌC CỦA BẠN</span>
                    <span className="fs9-my-desk-meta-pill">{todaySessions} phiên hôm nay</span>
                    <span className="fs9-my-desk-meta-pill">Chuỗi {Math.max(focus.streakDays, todayMinutes > 0 ? 1 : 0)} ngày</span>
                  </div>
                  <div className="fs9-my-desk-name-row">
                    <h2>{studentName}</h2>
                    <span className="fs9-my-desk-rank">#{myRankRow?.rank || 1}</span>
                  </div>
                  <p className="fs9-my-desk-uni">{studentUniName}</p>
                  <p className="fs9-my-desk-total">
                    {formatTotalStudyVi(myTotalMins)}
                    {focus.activeTaskText ? ` · Đang ôn: ${focus.activeTaskText}` : ''}
                  </p>

                  <div className={`fs9-my-desk-status ${focus.status === 'running' ? 'is-live' : focus.status === 'paused' ? 'is-paused' : ''}`}>
                    <i className={`fs9-live-dot ${focus.status === 'running' ? 'is-live' : 'is-idle'}`} />
                    <span>
                      {focus.status === 'running'
                        ? 'Đang học — đồng hồ đang chạy'
                        : focus.status === 'paused'
                          ? 'Đang tạm dừng phiên học'
                          : 'Chưa bật đồng hồ — sẵn sàng vào phiên'}
                    </span>
                  </div>

                  <div className="fs9-my-desk-links">
                    <button
                      type="button"
                      className="fs9-room-mini-btn"
                      onClick={handleCopyInviteLink}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span>{inviteCopied ? 'Đã chép link mời!' : 'Mời bạn học chung'}</span>
                    </button>
                    <button
                      type="button"
                      className="fs9-room-mini-btn"
                      onClick={() => setMainTab('focus')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15.5 14" />
                      </svg>
                      <span>Phòng đồng hồ lớn</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="fs9-my-desk-right">
                <span className="fs9-my-desk-timer-lbl">Thời gian tập trung hôm nay</span>
                <div className={`fs9-my-desk-hms ${focus.status === 'running' ? 'is-live' : ''}`}>
                  {formatHMS(myLiveTodaySecs)}
                </div>
                <div className="fs9-my-desk-controls">
                  <button
                    type="button"
                    className={`fs9-desk-btn ${focus.status === 'running' ? 'is-pause' : 'is-start'}`}
                    onClick={() => focusSession.toggle()}
                  >
                    {focus.status === 'running' ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        <span>Tạm dừng</span>
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                        <span>{focus.status === 'paused' ? 'Tiếp tục' : 'Bắt đầu'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="fs9-desk-btn is-stop"
                    onClick={() => focusSession.reset()}
                    title="Đặt lại đồng hồ phiên hiện tại"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="5" y="5" width="14" height="14" rx="2.5" />
                    </svg>
                    <span>Kết thúc</span>
                  </button>

                  <button
                    type="button"
                    className="fs9-desk-btn is-icon"
                    onClick={() => setMainTab('focus')}
                    title="Mở đồng hồ tập trung toàn màn hình"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* THANH TRẠNG THÁI TỐI NGANG GIỐNG ẢNH + TÌM KIẾM GỌN */}
            <div className="fs9-room-status-bar">
              <div className="fs9-rsb-left">
                <i className={`fs9-live-dot ${realOnlineCount > 0 ? 'is-live' : 'is-idle'}`} />
                <strong>
                  {realOnlineCount > 0
                    ? `${realOnlineCount} bạn đang học trong lớp`
                    : 'Chưa có bạn nào bật đèn bàn học — bấm Bắt đầu để mở bàn đầu tiên!'}
                </strong>
              </div>
              <div className="fs9-rsb-right">
                <input
                  type="text"
                  className="fs9-rsb-search"
                  value={peerSearch}
                  onChange={(e) => setPeerSearch(e.target.value)}
                  placeholder="Tìm bạn học, trường..."
                />
                <button
                  type="button"
                  className={`fs9-rsb-filter ${deskFilter === 'online' ? 'is-active' : ''}`}
                  onClick={() => setDeskFilter((f) => (f === 'online' ? 'all' : 'online'))}
                >
                  {deskFilter === 'online' ? 'Chỉ đang học' : 'Tất cả'}
                </button>
              </div>
            </div>

            {!isSignedIn && (
              <div className="fs9-room-guest-banner">
                Bạn đang xem chế độ khách — dữ liệu hiển thị là thời gian thực trên máy bạn. Đăng nhập ELEC AI để đồng bộ bàn học trực tiếp cùng bạn bè thật!
              </div>
            )}

            {/* LƯỚI BÀN HỌC 4 CỘT (100% HỌC SINH THẬT) */}
            <div className="fs9-desks-grid">
              {filteredClassroom.map((p) => {
                const baseSecs = p.todaySecs ?? (p.todayMins || 0) * 60;
                const liveOffset =
                  !p.isMe && p.online && p.lastPingAt
                    ? Math.max(0, Math.min(300, Math.floor((nowTick - p.lastPingAt) / 1000)))
                    : 0;
                const deskSecs = baseSecs + liveOffset;
                return (
                  <article
                    key={p.id}
                    className={`fs9-study-card ${p.online ? 'is-online' : 'is-away'} ${p.isMe ? 'is-me' : ''}`}
                  >
                    <div className="fs9-sc-top">
                      <span className={`fs9-sc-status ${p.online ? 'is-online' : ''}`}>
                        <i className={`fs9-sc-dot ${p.online ? 'is-online' : ''}`} />
                        {p.online ? 'Đang học' : 'Vắng'}
                      </span>

                      {p.rank <= 3 ? (
                        <span className={`fs9-sc-medal rank-${p.rank}`} title={`Hạng #${p.rank}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="fs9-sc-rank">#{p.rank}</span>
                      )}
                    </div>

                    <StudyDeskIllustration
                      isActive={p.online}
                      mascotSrc={p.mascot}
                      photoURL={p.photoURL}
                      preferMascot={p.isMe || !p.photoURL}
                      name={p.name}
                      size="md"
                    />

                    <div className="fs9-sc-body">
                      <strong className="fs9-sc-name">
                        {p.name} {p.isMe && p.name !== 'Bạn' && <em>(Bạn)</em>}
                      </strong>
                      {p.highSchool && <span className="fs9-sc-hs">{p.highSchool}</span>}
                      <span className="fs9-sc-uni">{p.uniName || p.uni}</span>
                      {p.online && p.task && <span className="fs9-sc-task">{p.task}</span>}
                      <span className="fs9-sc-total">{formatTotalStudyVi(p.totalMins ?? p.todayMins)}</span>
                      <div className={`fs9-sc-hms ${p.online ? 'is-online' : ''}`}>
                        {formatHMS(deskSecs)}
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Thẻ mời bạn vào bàn trống — luôn trung thực 0 bot ảo */}
              {filteredClassroom.length < 4 && (
                <article className="fs9-study-card is-invite">
                  <div className="fs9-sc-top">
                    <span className="fs9-sc-status">
                      <i className="fs9-sc-dot" />
                      Bàn trống
                    </span>
                    <span className="fs9-sc-rank">+</span>
                  </div>
                  <div className="fs9-invite-desk-body">
                    <StudyDeskIllustration
                      isActive={false}
                      mascotSrc="/img/elec/elec-hello.png"
                      preferMascot={true}
                      name="Mời bạn"
                      size="md"
                    />
                    <strong className="fs9-sc-name">Mời bạn ngồi cùng bàn</strong>
                    <span className="fs9-sc-total">
                      {isSignedIn && liveConnected
                        ? 'Gửi link để bạn bè vào học trực tiếp cùng bạn'
                        : 'Chia sẻ phòng học Pomodoro ELEC AI'}
                    </span>
                    <button
                      type="button"
                      className="fs9-invite-desk-btn"
                      onClick={handleCopyInviteLink}
                    >
                      {inviteCopied ? 'Đã chép link!' : 'Chép link mời bạn'}
                    </button>
                  </div>
                </article>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. BOTTOM FLOATING GLASS DOCK (TINH GỌN 5 NÚT SẠCH SẼ) ── */}
      {!zenHud && mainTab === 'focus' && (
        <nav className="fs9-bottom-dock" aria-label="Thanh công cụ Phòng Tập Trung">
          <button
            type="button"
            className={`fs9-dock-btn ${activePanel === 'sounds' ? 'is-active' : ''}`}
            onClick={() => {
              setActivePanel(activePanel === 'sounds' ? null : 'sounds');
              setTimeout(() => searchInputRef.current?.focus(), 60);
            }}
          >
            <span className="fs9-dock-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              {(yt.isPlaying || noiseSnap.activeCount > 0) && <i className="fs9-dock-dot" />}
            </span>
            <span>Nhạc &amp; Noise</span>
          </button>

          <button
            type="button"
            className={`fs9-dock-btn ${activePanel === 'tasks' ? 'is-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'tasks' ? null : 'tasks')}
          >
            <span className="fs9-dock-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {pendingTasksCount > 0 && <em className="fs9-dock-badge">{pendingTasksCount}</em>}
            </span>
            <span>Nhiệm vụ</span>
          </button>

          <button
            type="button"
            className={`fs9-dock-btn ${activePanel === 'notes' ? 'is-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'notes' ? null : 'notes')}
          >
            <span className="fs9-dock-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </span>
            <span>Ghi chú</span>
          </button>

          <button
            type="button"
            className={`fs9-dock-btn ${activePanel === 'themes' ? 'is-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'themes' ? null : 'themes')}
          >
            <span className="fs9-dock-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <span>Không gian</span>
          </button>

          <button
            type="button"
            className={`fs9-dock-btn ${activePanel === 'settings' ? 'is-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
          >
            <span className="fs9-dock-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span>Cài đặt</span>
          </button>
        </nav>
      )}

      {/* ── 4. FLOATING SPOTLIGHT & STUDIO PANELS ── */}
      {activePanel && (
        <div
          className="fs9-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActivePanel(null);
          }}
        >
          {/* PANEL 1: SPOTLIGHT YOUTUBE SEARCH & NOISE MIXER */}
          {activePanel === 'sounds' && (
            <div className="fs9-panel fs9-panel-spotlight" role="dialog" aria-modal="true" aria-label="Nhạc YouTube và Âm thanh nền">
              <div className="fs9-panel-head">
                <div className="fs9-panel-tabs">
                  <button
                    type="button"
                    className={`fs9-ptab ${soundTab === 'music' ? 'is-active' : ''}`}
                    onClick={() => setSoundTab('music')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="8 5 19 12 8 19 8 5" />
                    </svg>
                    <span>YouTube Music</span>
                  </button>
                  <button
                    type="button"
                    className={`fs9-ptab ${soundTab === 'noise' ? 'is-active' : ''}`}
                    onClick={() => setSoundTab('noise')}
                  >
                    <span>Tiếng ồn nền ({noiseSnap.activeCount})</span>
                  </button>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {soundTab === 'music' ? (
                <>
                  <div className="fs9-panel-body">
                    {/* Spotlight Search Bar */}
                    <form
                      className="fs9-spotlight-search"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleYouTubeSearch();
                      }}
                    >
                      <span className="fs9-sp-yt-ico" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="8 5 19 12 8 19 8 5" />
                        </svg>
                      </span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={ytQuery}
                        onChange={(e) => setYtQuery(e.target.value)}
                        placeholder="Gõ tên bất kỳ bài hát, ca sĩ, Lofi... hoặc dán link YouTube"
                        autoFocus
                      />
                      {ytQuery && (
                        <button
                          type="button"
                          className="fs9-yt-clear"
                          onClick={() => {
                            setYtQuery('');
                            setYtResults([]);
                            setYtSearchMsg('');
                            searchInputRef.current?.focus();
                          }}
                          title="Xóa từ khóa"
                        >
                          ✕
                        </button>
                      )}
                      <button type="submit" className="fs9-sp-go-btn" disabled={ytSearching || !ytQuery.trim()}>
                        {ytSearching ? (
                          <span className="fs9-spinner" />
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span>Tìm</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Quick Search Chips */}
                    <div className="fs9-chip-row">
                      {QUICK_SEARCH_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          className={`fs9-quick-chip ${ytQuery.toLowerCase() === chip.toLowerCase() ? 'is-selected' : ''}`}
                          onClick={() => handleYouTubeSearch(chip)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Sub-tabs */}
                    <div className="fs9-subtab-row">
                      <button
                        type="button"
                        className={`fs9-subtab ${musicSubTab === 'search' ? 'is-active' : ''}`}
                        onClick={() => setMusicSubTab('search')}
                      >
                        Kết quả {ytResults.length > 0 ? `(${ytResults.length})` : ''}
                      </button>
                      <button
                        type="button"
                        className={`fs9-subtab ${musicSubTab === 'curated' ? 'is-active' : ''}`}
                        onClick={() => setMusicSubTab('curated')}
                      >
                        Kho chọn lọc
                      </button>
                      <button
                        type="button"
                        className={`fs9-subtab ${musicSubTab === 'favorites' ? 'is-active' : ''}`}
                        onClick={() => setMusicSubTab('favorites')}
                      >
                        Yêu thích ({yt.favorites.length})
                      </button>
                      <button
                        type="button"
                        className={`fs9-subtab ${musicSubTab === 'history' ? 'is-active' : ''}`}
                        onClick={() => setMusicSubTab('history')}
                      >
                        Gần đây ({yt.history.length})
                      </button>
                    </div>

                    {yt.error && <div className="fs9-alert-warn">{yt.error}</div>}
                    {ytSearchMsg && <div className="fs9-alert-info">{ytSearchMsg}</div>}

                    {musicSubTab === 'curated' && (
                      <div className="fs9-cat-pills">
                        {MUSIC_CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`fs9-cat-pill ${musicCat === c.id ? 'is-active' : ''}`}
                            onClick={() => setMusicCat(c.id)}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Track list or Shimmer Skeletons */}
                    <div className="fs9-track-list">
                      {ytSearching ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="fs9-skeleton-row">
                            <div className="fs9-sk-thumb" />
                            <div className="fs9-sk-lines">
                              <span style={{ width: '78%' }} />
                              <span style={{ width: '48%' }} />
                            </div>
                          </div>
                        ))
                      ) : (() => {
                        const list =
                          musicSubTab === 'search'
                            ? ytResults.length > 0
                              ? ytResults
                              : CURATED_YOUTUBE_MUSIC
                            : musicSubTab === 'curated'
                              ? filteredCurated
                              : musicSubTab === 'favorites'
                                ? yt.favorites
                                : yt.history;

                        if (!list.length) {
                          return (
                            <div className="fs9-empty-msg">
                              {musicSubTab === 'favorites'
                                ? 'Chưa có bài hát yêu thích nào — bấm hình trái tim trên bài hát để lưu nhé!'
                                : 'Chưa có lịch sử phát gần đây.'}
                            </div>
                          );
                        }

                        return list.map((track) => {
                          const isCurrent = yt.currentTrack?.videoId === track.videoId;
                          const isFav = yt.favorites.some((f) => f.videoId === track.videoId);
                          return (
                            <div
                              key={track.videoId}
                              className={`fs9-track-item ${isCurrent ? 'is-playing' : ''}`}
                              onClick={() => youtubeMusic.playTrack(track, list)}
                            >
                              <div className="fs9-ti-thumb-wrap">
                                <img src={track.thumbnail} alt={track.title} className="fs9-ti-thumb" loading="lazy" />
                                <span className="fs9-ti-hover-play">
                                  {isCurrent && yt.isPlaying ? (
                                    <span className="fs9-yt-eq"><i /><i /><i /></span>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                                      <polygon points="7 4 20 12 7 20 7 4" />
                                    </svg>
                                  )}
                                </span>
                                {track.duration && <span className="fs9-ti-dur">{track.duration}</span>}
                              </div>
                              <div className="fs9-ti-info">
                                <strong className="fs9-ti-title">{track.title}</strong>
                                <span className="fs9-ti-meta">
                                  {track.channel}
                                  {track.views
                                    ? ` · ${/lượt xem|views/i.test(track.views) ? track.views : `${track.views} lượt xem`}`
                                    : ''}
                                </span>
                              </div>
                              <div className="fs9-ti-btns" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className={`fs9-ti-fav ${isFav ? 'is-fav' : ''}`}
                                  onClick={() => youtubeMusic.toggleFavorite(track)}
                                  title={isFav ? 'Bỏ yêu thích' : 'Lưu vào Yêu thích'}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.1">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="fs9-ti-play"
                                  onClick={() => (isCurrent ? youtubeMusic.togglePlay() : youtubeMusic.playTrack(track, list))}
                                  title={isCurrent && yt.isPlaying ? 'Tạm dừng' : 'Phát ngay'}
                                >
                                  {isCurrent && yt.isPlaying ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                      <rect x="6" y="4" width="4" height="16" rx="1" />
                                      <rect x="14" y="4" width="4" height="16" rx="1" />
                                    </svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="6 4 20 12 6 20 6 4" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Sticky Mini Footer Controls */}
                  {yt.currentTrack && (
                    <div className="fs9-panel-player-foot">
                      <div className="fs9-ppf-row">
                        <div className="fs9-ppf-vol">
                          <button type="button" className="fs9-ppf-ico" onClick={() => youtubeMusic.toggleMute()} title="Tắt/Bật tiếng">
                            {yt.muted || yt.volume === 0 ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={yt.muted ? 0 : yt.volume}
                            onChange={(e) => youtubeMusic.setVolume(e.target.value)}
                            aria-label="Âm lượng nhạc YouTube"
                          />
                          <span>{yt.muted ? 0 : yt.volume}%</span>
                        </div>

                        <div className="fs9-ppf-toggles">
                          <button
                            type="button"
                            className={`fs9-ppf-chip ${yt.loop ? 'is-on' : ''}`}
                            onClick={() => youtubeMusic.toggleLoop()}
                          >
                            Lặp lại
                          </button>
                          <button
                            type="button"
                            className={`fs9-ppf-chip ${yt.videoBgEnabled ? 'is-on' : ''}`}
                            onClick={() => youtubeMusic.setVideoBgEnabled(!yt.videoBgEnabled)}
                          >
                            Video nền full
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="fs9-panel-body">
                  <div className="fs9-noise-top">
                    <div className="fs9-cat-pills">
                      {FOCUS_NOISE_CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`fs9-cat-pill ${noiseCat === c.id ? 'is-active' : ''}`}
                          onClick={() => setNoiseCat(c.id)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    {noiseSnap.activeCount > 0 && (
                      <button type="button" className="fs9-noise-stop-all" onClick={() => focusAudio.stop()}>
                        Tắt tất cả
                      </button>
                    )}
                  </div>

                  <div className="fs9-preset-strip">
                    {FOCUS_MIX_PRESETS.map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        className="fs9-mix-preset-btn"
                        onClick={() => focusAudio.applyPreset(pr.id)}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>

                  <p className="fs9-hint-txt">
                    Có thể trộn nhiều tiếng ồn nền cùng lúc và phát song song với nhạc YouTube!
                  </p>

                  <div className="fs9-noise-grid">
                    {filteredNoiseTracks.map((tr) => {
                      const layerVol = noiseSnap.activeLayers[tr.id];
                      const isOn = typeof layerVol === 'number';
                      return (
                        <div key={tr.id} className={`fs9-noise-card ${isOn ? 'is-on' : ''}`}>
                          <button
                            type="button"
                            className="fs9-noise-toggle"
                            onClick={() => focusAudio.toggleLayer(tr.id, 0.45)}
                          >
                            <span className="fs9-noise-name">{tr.label}</span>
                            <span className={`fs9-noise-state ${isOn ? 'is-on' : ''}`}>
                              {isOn ? 'Đang bật' : 'Tắt'}
                            </span>
                          </button>
                          {isOn && (
                            <div className="fs9-noise-slider-row">
                              <input
                                type="range"
                                min={0.05}
                                max={1}
                                step={0.05}
                                value={layerVol}
                                onChange={(e) => focusAudio.setLayerVolume(tr.id, Number(e.target.value))}
                                aria-label={`Âm lượng ${tr.label}`}
                              />
                              <span>{Math.round(layerVol * 100)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL 2: NHIỆM VỤ FOCUS */}
          {activePanel === 'tasks' && (
            <div className="fs9-panel" role="dialog" aria-modal="true" aria-label="Nhiệm vụ tập trung">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src="/img/elec/elec-happy.png" alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>Nhiệm vụ hôm nay</h3>
                    <span>Đồng bộ trực tiếp với Kế hoạch tuần ở Trợ lý ELEC AI</span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <form className="fs9-task-add-row" onSubmit={handleAddFocusTask}>
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Thêm nhiệm vụ mới cho hôm nay..."
                  />
                  <button type="submit" disabled={!newTaskText.trim()}>Thêm</button>
                </form>

                {todayTasks.length === 0 ? (
                  <div className="fs9-empty-msg">
                    Chưa có nhiệm vụ nào hôm nay. Hãy thêm việc đầu tiên ở ô trên nhé!
                  </div>
                ) : (
                  <div className="fs9-task-list">
                    {todayTasks.map((t) => {
                      const isPinned = focus.activeTaskId === t.id;
                      const pomo = focus.taskPomodoros[t.id] || { done: 0, est: 2 };
                      return (
                        <div key={t.id} className={`fs9-task-card ${t.completed ? 'is-done' : ''} ${isPinned ? 'is-pinned' : ''}`}>
                          <button
                            type="button"
                            className={`fs9-t-check ${t.completed ? 'is-done' : ''}`}
                            onClick={() => handleToggleFocusTask(t.id)}
                          >
                            {t.completed && '✓'}
                          </button>
                          <div className="fs9-t-main">
                            <span className="fs9-t-name">{t.text}</span>
                            <div className="fs9-t-meta">
                              <span className="fs9-t-subj">{t.subject || 'Ôn tập'}</span>
                              <span className="fs9-t-pomo-count">
                                {pomo.done || 0}/{pomo.est || 2} phiên
                              </span>
                              <button
                                type="button"
                                className="fs9-t-est-btn"
                                onClick={() => focusSession.setTaskEstimate(t.id, (pomo.est || 2) + 1)}
                                title="Tăng số phiên dự kiến"
                              >
                                +1 phiên
                              </button>
                            </div>
                          </div>
                          <div className="fs9-t-actions">
                            <button
                              type="button"
                              className={`fs9-t-pin ${isPinned ? 'is-pinned' : ''}`}
                              onClick={() => focusSession.setActiveTask(isPinned ? null : t.id, isPinned ? '' : t.text)}
                            >
                              {isPinned ? 'Đang chọn' : 'Tập trung'}
                            </button>
                            <button
                              type="button"
                              className="fs9-t-del"
                              onClick={() => handleDeleteFocusTask(t.id)}
                              title="Xóa"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 3: LỚP HỌC TẬP TRUNG THỰC TẾ (100% REAL FIRESTORE) */}
          {activePanel === 'classroom' && (
            <div className="fs9-panel fs9-panel-lg" role="dialog" aria-modal="true" aria-label="Lớp học tập trung thực tế">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src="/img/elec/elec-fighting.png" alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>Lớp học Tập trung · Dữ liệu thực tế</h3>
                    <span>
                      {isSignedIn
                        ? realOnlineCount > 0
                          ? `${realOnlineCount} học sinh thật đang bật đồng hồ tập trung`
                          : 'Bấm Bắt đầu học để bật đèn bàn học đầu tiên ngay lúc này!'
                        : 'Đăng nhập để đồng bộ trực tiếp với bạn học thật trên ELEC AI'}
                    </span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <div className="fs9-live-bar-row">
                  <div className="fs9-search-line" style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={peerSearch}
                      onChange={(e) => setPeerSearch(e.target.value)}
                      placeholder="Tìm bạn học theo tên hoặc trường mục tiêu..."
                    />
                  </div>
                  <button type="button" className="fs9-invite-btn" onClick={handleCopyInviteLink}>
                    {inviteCopied ? 'Đã chép link!' : 'Mời bạn học chung'}
                  </button>
                </div>

                {!isSignedIn && (
                  <div className="fs9-alert-info">
                    Bạn đang ở chế độ khách — dữ liệu hiển thị hiện tại là thời gian thực trên máy của bạn. Hãy đăng nhập để đồng bộ lên Lớp học trực tuyến cùng cộng đồng ELEC AI!
                  </div>
                )}

                <div className="fs9-classroom-grid">
                  {filteredClassroom.map((p) => (
                    <div key={p.id} className={`fs9-desk-card ${p.isMe ? 'is-me' : ''} ${p.online ? 'is-online' : ''}`}>
                      <div className="fs9-desk-top">
                        <img src={p.mascot} alt="" className="fs9-desk-mascot" draggable={false} />
                        <div className="fs9-desk-meta">
                          <strong>
                            {p.name} {p.isMe && p.name !== 'Bạn' && <em>(Bạn)</em>}
                          </strong>
                          <span className="fs9-desk-uni">{p.uni}</span>
                        </div>
                        <span className={`fs9-desk-badge ${p.online ? 'is-online' : ''}`}>
                          {p.online ? 'Đang học' : 'Chờ phiên'}
                        </span>
                      </div>
                      <p className="fs9-desk-task">{p.task}</p>
                      <div className="fs9-desk-foot">
                        <span>Hôm nay: <b>{formatMinutesVi(p.todayMins)}</b></span>
                        <span>Chuỗi {p.streak} ngày</span>
                      </div>
                    </div>
                  ))}
                </div>

                {isSignedIn && liveConnected && allRealStudents.length <= 1 && (
                  <div className="fs9-real-note">
                    Chưa có thêm bạn học nào đang mở Phòng Tập Trung trong 2 phút vừa qua. Bấm <b>Mời bạn học chung</b> ở trên để gửi link rủ bạn bè vào ngồi bàn cùng nhé!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL 4: BXH THỜI GIAN TẬP TRUNG THỰC TẾ (100% REAL FIRESTORE) */}
          {activePanel === 'leaderboard' && (
            <div className="fs9-panel" role="dialog" aria-modal="true" aria-label="Bảng xếp hạng Focus thực tế">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src="/img/elec/elec-celebrate.png" alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>{lbMode === 'time' ? 'BXH Thời gian tập trung' : 'BXH Chuỗi ngày Focus'}</h3>
                    <span>100% dữ liệu thời gian học thực tế · Cập nhật theo từng phút</span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <div className="fs9-lb-controls">
                  <div className="fs9-subtab-row">
                    <button type="button" className={`fs9-subtab ${lbMode === 'time' ? 'is-active' : ''}`} onClick={() => setLbMode('time')}>
                      Focus Time
                    </button>
                    <button type="button" className={`fs9-subtab ${lbMode === 'streak' ? 'is-active' : ''}`} onClick={() => setLbMode('streak')}>
                      Chuỗi ngày
                    </button>
                  </div>
                  {lbMode === 'time' && (
                    <div className="fs9-cat-pills">
                      <button type="button" className={`fs9-cat-pill ${lbScope === 'today' ? 'is-active' : ''}`} onClick={() => setLbScope('today')}>Hôm nay</button>
                      <button type="button" className={`fs9-cat-pill ${lbScope === 'week' ? 'is-active' : ''}`} onClick={() => setLbScope('week')}>Tuần này</button>
                      <button type="button" className={`fs9-cat-pill ${lbScope === 'month' ? 'is-active' : ''}`} onClick={() => setLbScope('month')}>Tháng này</button>
                    </div>
                  )}
                </div>

                {myRankRow && (
                  <div className="fs9-my-rank-banner">
                    <span>Hạng thực tế của bạn: <b>#{myRankRow.rank}</b> / {leaderboardRows.length}</span>
                    <span>
                      {lbMode === 'streak'
                        ? `${myRankRow.streak} ngày liên tiếp`
                        : formatMinutesVi(lbScope === 'month' ? myRankRow.monthMins : lbScope === 'week' ? myRankRow.weekMins : myRankRow.todayMins)}
                    </span>
                  </div>
                )}

                <div className="fs9-lb-list">
                  {leaderboardRows.map((row) => {
                    const val =
                      lbMode === 'streak'
                        ? `${row.streak} ngày`
                        : formatMinutesVi(lbScope === 'month' ? row.monthMins : lbScope === 'week' ? row.weekMins : row.todayMins);
                    return (
                      <div key={row.id} className={`fs9-lb-row ${row.isMe ? 'is-me' : ''} rank-${row.rank <= 3 ? row.rank : 'other'}`}>
                        <span className="fs9-lb-rank">#{row.rank}</span>
                        <img src={row.mascot} alt="" className="fs9-lb-mascot" draggable={false} />
                        <div className="fs9-lb-info">
                          <strong>{row.name} {row.isMe && row.name !== 'Bạn' && <em>(Bạn)</em>}</strong>
                          <span>{row.uni} · {row.online ? 'Đang tập trung' : 'Đã nghỉ'}</span>
                        </div>
                        <span className="fs9-lb-val">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 5: GHI CHÚ NHANH */}
          {activePanel === 'notes' && (
            <div className="fs9-panel" role="dialog" aria-modal="true" aria-label="Ghi chú tập trung">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src="/img/elec/elec-think.png" alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>Ghi chú nhanh</h3>
                    <span>Lưu lại công thức, ý tưởng hoặc câu cần ôn ngay trong phiên</span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <form className="fs9-note-form" onSubmit={handleAddNote}>
                  <div className="fs9-cat-pills">
                    {NOTE_TAGS.map((tg) => (
                      <button
                        key={tg}
                        type="button"
                        className={`fs9-cat-pill ${noteTag === tg ? 'is-active' : ''}`}
                        onClick={() => setNoteTag(tg)}
                      >
                        {tg}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Ghi nhanh công thức, lỗi sai cần tránh hoặc tổng kết phiên học..."
                  />
                  <button type="submit" className="fs9-save-btn" disabled={!noteInput.trim()}>
                    Lưu ghi chú
                  </button>
                </form>

                <div className="fs9-notes-list">
                  {focus.notes.length === 0 ? (
                    <div className="fs9-empty-msg">Chưa có ghi chú nào.</div>
                  ) : (
                    focus.notes.map((n) => (
                      <div key={n.id} className="fs9-note-item">
                        <div className="fs9-note-head">
                          <span className="fs9-note-tag">{n.tag}</span>
                          <small>{new Date(n.at).toLocaleString('vi-VN')}</small>
                          <button type="button" onClick={() => focusSession.deleteNote(n.id)} title="Xóa">✕</button>
                        </div>
                        <p>{n.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 6: KHÔNG GIAN NỀN & LINH VẬT */}
          {activePanel === 'themes' && (
            <div className="fs9-panel fs9-panel-lg" role="dialog" aria-modal="true" aria-label="Không gian nền">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src={activeMascot.src} alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>Không gian &amp; Linh vật</h3>
                    <span>Chọn khung cảnh full màn hình, Video nền YouTube và Bé Elec đồng hành</span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <div className="fs9-toggle-card">
                  <div>
                    <strong>Dùng Video YouTube đang phát làm nền full màn hình</strong>
                    <span>Phát MV / Lofi / Study With Me tràn viền 100% mượt mà phía sau đồng hồ</span>
                  </div>
                  <button
                    type="button"
                    className={`fs9-switch ${yt.videoBgEnabled ? 'is-on' : ''}`}
                    onClick={() => youtubeMusic.setVideoBgEnabled(!yt.videoBgEnabled)}
                    aria-pressed={yt.videoBgEnabled}
                  >
                    <span />
                  </button>
                </div>

                {yt.videoBgEnabled && (
                  <div className="fs9-dim-slider">
                    <span>Độ tối lớp phủ chữ ({Math.round(focus.bgDim * 100)}%)</span>
                    <input
                      type="range"
                      min={0.12}
                      max={0.8}
                      step={0.04}
                      value={focus.bgDim}
                      onChange={(e) => focusSession.setBgDim(e.target.value)}
                    />
                  </div>
                )}

                <h4 className="fs9-sec-label">Khung cảnh không gian (8 chủ đề)</h4>
                <div className="fs9-themes-grid">
                  {FOCUS_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      className={`fs9-theme-card ${focus.themeId === th.id ? 'is-active' : ''}`}
                      style={{ background: th.bg }}
                      onClick={() => {
                        focusSession.setTheme(th.id);
                        if (yt.videoBgEnabled) youtubeMusic.setVideoBgEnabled(false);
                      }}
                    >
                      <span className={`fs9-tc-tag ${th.isLight ? 'is-dark-txt' : ''}`}>{th.tag}</span>
                      <strong className={th.isLight ? 'is-dark-txt' : ''}>{th.name}</strong>
                    </button>
                  ))}
                </div>

                <h4 className="fs9-sec-label">Chọn Bé Elec học cùng bạn</h4>
                <div className="fs9-mascot-grid">
                  {FOCUS_MASCOTS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`fs9-mascot-opt ${focus.mascotId === m.id ? 'is-active' : ''}`}
                      onClick={() => focusSession.setMascot(m.id)}
                    >
                      <img src={m.src} alt={m.label} draggable={false} />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PANEL 7: CÀI ĐẶT HẸN GIỜ */}
          {activePanel === 'settings' && (
            <div className="fs9-panel" role="dialog" aria-modal="true" aria-label="Cài đặt hẹn giờ">
              <div className="fs9-panel-head">
                <div className="fs9-panel-title-wrap">
                  <img src="/img/elec/elec-cool.png" alt="" className="fs9-panel-mascot" draggable={false} />
                  <div>
                    <h3>Cài đặt hẹn giờ</h3>
                    <span>Tùy biến kiểu đồng hồ, chế độ đếm và âm báo hết giờ</span>
                  </div>
                </div>
                <button type="button" className="fs9-panel-close" onClick={() => setActivePanel(null)} aria-label="Đóng">
                  ✕
                </button>
              </div>
              <div className="fs9-panel-body">
                <h4 className="fs9-sec-label">Kiểu hiển thị đồng hồ</h4>
                <div className="fs9-opt-grid cols-3">
                  {[
                    { id: 'ring', title: 'Vòng tròn', desc: 'Gradient phát sáng' },
                    { id: 'digital', title: 'Đồng hồ số', desc: 'Tối giản siêu nét' },
                    { id: 'flip', title: 'Flip Clock', desc: 'Lật thẻ cổ điển' },
                  ].map((st) => {
                    const disabled = st.id === 'ring' && draftSettings.countMode === 'flowmodoro';
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={disabled}
                        className={`fs9-opt-card ${draftSettings.clockStyle === st.id ? 'is-active' : ''}`}
                        onClick={() => setDraftSettings((s) => ({ ...s, clockStyle: st.id }))}
                      >
                        <strong>{st.title}</strong>
                        <span>{disabled ? 'Chỉ cho Pomodoro' : st.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <h4 className="fs9-sec-label">Chế độ đếm</h4>
                <div className="fs9-opt-grid cols-2">
                  <button
                    type="button"
                    className={`fs9-opt-card ${draftSettings.countMode === 'pomodoro' ? 'is-active' : ''}`}
                    onClick={() => setDraftSettings((s) => ({ ...s, countMode: 'pomodoro' }))}
                  >
                    <strong>Pomodoro</strong>
                    <span>Đếm ngược theo chu kỳ chuẩn</span>
                  </button>
                  <button
                    type="button"
                    className={`fs9-opt-card ${draftSettings.countMode === 'flowmodoro' ? 'is-active' : ''}`}
                    onClick={() =>
                      setDraftSettings((s) => ({
                        ...s,
                        countMode: 'flowmodoro',
                        clockStyle: s.clockStyle === 'ring' ? 'digital' : s.clockStyle,
                      }))
                    }
                  >
                    <strong>Flowmodoro</strong>
                    <span>Đếm tiến tự do, tự tính giờ nghỉ</span>
                  </button>
                </div>

                <h4 className="fs9-sec-label">Preset nhanh &amp; Thời lượng (phút)</h4>
                <div className="fs9-preset-strip">
                  <button type="button" className="fs9-mix-preset-btn" onClick={() => setDraftSettings((s) => ({ ...s, workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 }))}>25 / 5 / 15</button>
                  <button type="button" className="fs9-mix-preset-btn" onClick={() => setDraftSettings((s) => ({ ...s, workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 }))}>50 / 10 / 20</button>
                  <button type="button" className="fs9-mix-preset-btn" onClick={() => setDraftSettings((s) => ({ ...s, workMinutes: 90, shortBreakMinutes: 15, longBreakMinutes: 30 }))}>90 / 15 / 30</button>
                </div>

                <div className="fs9-num-grid">
                  <label>
                    <span>Tập trung</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={draftSettings.workMinutes}
                      onChange={(e) => setDraftSettings((s) => ({ ...s, workMinutes: Math.max(1, Number(e.target.value) || 25) }))}
                    />
                  </label>
                  <label>
                    <span>Nghỉ ngắn</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={draftSettings.shortBreakMinutes}
                      onChange={(e) => setDraftSettings((s) => ({ ...s, shortBreakMinutes: Math.max(1, Number(e.target.value) || 5) }))}
                    />
                  </label>
                  <label>
                    <span>Nghỉ dài</span>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={draftSettings.longBreakMinutes}
                      onChange={(e) => setDraftSettings((s) => ({ ...s, longBreakMinutes: Math.max(1, Number(e.target.value) || 15) }))}
                    />
                  </label>
                  <label>
                    <span>Chu kỳ nghỉ dài</span>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={draftSettings.longBreakInterval}
                      onChange={(e) => setDraftSettings((s) => ({ ...s, longBreakInterval: Math.max(2, Number(e.target.value) || 4) }))}
                    />
                  </label>
                </div>

                <div className="fs9-toggle-list">
                  <div className="fs9-toggle-line">
                    <span>Tự động bắt đầu giờ nghỉ</span>
                    <button
                      type="button"
                      className={`fs9-switch ${draftSettings.autoStartBreak ? 'is-on' : ''}`}
                      onClick={() => setDraftSettings((s) => ({ ...s, autoStartBreak: !s.autoStartBreak }))}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="fs9-toggle-line">
                    <span>Tự động bắt đầu Pomodoro tiếp theo</span>
                    <button
                      type="button"
                      className={`fs9-switch ${draftSettings.autoStartPomodoro ? 'is-on' : ''}`}
                      onClick={() => setDraftSettings((s) => ({ ...s, autoStartPomodoro: !s.autoStartPomodoro }))}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="fs9-toggle-line">
                    <span>Âm thanh thông báo hết giờ</span>
                    <button
                      type="button"
                      className={`fs9-switch ${draftSettings.soundEnabled ? 'is-on' : ''}`}
                      onClick={() => setDraftSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
                    >
                      <span />
                    </button>
                  </div>
                </div>

                {draftSettings.soundEnabled && (
                  <div className="fs9-sound-select-row">
                    <select
                      value={draftSettings.soundType}
                      onChange={(e) => setDraftSettings((s) => ({ ...s, soundType: e.target.value }))}
                    >
                      {FOCUS_CHIMES.map((ch) => (
                        <option key={ch.id} value={ch.id}>{ch.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="fs9-test-chime-btn"
                      onClick={() => playFocusChime(draftSettings.soundType, draftSettings.soundVolume)}
                    >
                      Nghe thử
                    </button>
                  </div>
                )}

                <button type="button" className="fs9-save-btn is-full" onClick={handleSaveSettings}>
                  Lưu cài đặt
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
