import React, { Suspense, lazy, useMemo, useState } from 'react';
import {
  computeStudentAbilityRadar,
  computeRealPredictedScore30,
  getStudentElo,
  computeEloUpdate,
  getStudentCombatPower,
  loadTargetUniversity,
} from '../lib/studentAnalytics.js';
import { getWrongQuestions } from '../lib/wrongQuestionService.js';
import { readStore } from '../lib/roadmapStore.js';

const Heart3DViewer = lazy(() => import('./Heart3DViewer.jsx'));

/**
 * Định dạng rút gọn số lớn cho KPI (vd: 100000000 -> 100M, 12500 -> 12.5k).
 */
export function formatCompactAtlasNumber(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0';
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (num >= 10_000) {
    const k = num / 1_000;
    return `${k >= 100 || k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return num.toLocaleString('vi-VN');
}

function safeFormatDayMonth(value) {
  if (!value) return '--.--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--.--';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}`;
}

function readLocalSafe(uid) {
  let roadmapSessions = [];
  let pomodoroHistory = {};
  let wrongPending = 0;
  let wrongTotal = 0;
  try {
    roadmapSessions = readStore(uid)?.sessions || [];
  } catch { /* ignore */ }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      pomodoroHistory = JSON.parse(window.localStorage.getItem('cs-pomo-history') || '{}') || {};
      const wrongItems = getWrongQuestions(uid);
      const pendingFromService = wrongItems.filter((w) => !w?.mastered).length;
      const wrongBank = JSON.parse(window.localStorage.getItem('cs-wrong-bank') || '[]');
      const bankLen = Array.isArray(wrongBank) ? wrongBank.length : 0;
      wrongPending = pendingFromService + bankLen;
      wrongTotal = wrongItems.length + bankLen;
    }
  } catch { /* ignore */ }
  return { roadmapSessions, pomodoroHistory, wrongPending, wrongTotal };
}

/**
 * Hàm thuần tổng hợp toàn bộ chỉ số cho Profile Atlas Dashboard từ dữ liệu thật của tài khoản.
 * Khi học sinh chưa có bất kỳ bài thi / phiên luyện / chuỗi / pomodoro nào, giữ trung thực mức 0/100.
 */
export function buildAtlasMetrics({
  uid = 'guest',
  examHistory = [],
  classes = [],
  friends = [],
  favIds = [],
  streakDays = 0,
  credits = 0,
  isPro = false,
  tierLabel = 'Cơ bản',
  heartsCount = 0,
  maxHeartsCount = 5,
  isTeacher = false,
  createdAt = null,
  roadmapSessionsOverride = null,
  pomodoroHistoryOverride = null,
  wrongPendingOverride = null,
} = {}) {
  const local = readLocalSafe(uid);
  const roadmapSessions = Array.isArray(roadmapSessionsOverride)
    ? roadmapSessionsOverride
    : local.roadmapSessions;
  const pomodoroHistory = pomodoroHistoryOverride || local.pomodoroHistory;
  const wrongPending =
    typeof wrongPendingOverride === 'number' ? wrongPendingOverride : local.wrongPending;

  const history = Array.isArray(examHistory) ? examHistory : [];
  const pomoMinutes = Object.values(pomodoroHistory || {}).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );
  const hasRealActivity =
    history.length > 0 ||
    roadmapSessions.length > 0 ||
    Number(streakDays) > 0 ||
    pomoMinutes > 0 ||
    wrongPending > 0;

  const eloState = getStudentElo(uid);
  const eloRank = computeEloUpdate({ currentElo: eloState.elo, pct: 60 }).rank;
  const powerState = getStudentCombatPower(uid);
  const nv1 = loadTargetUniversity(uid);
  const pred30 = computeRealPredictedScore30({ virtualHistory: history });

  const radar = computeStudentAbilityRadar({
    virtualHistory: history,
    roadmapSessions,
    pomodoroHistory,
    streakDays: Number(streakDays) || 0,
    wrongCount: wrongPending,
    elo: eloState.elo,
  });

  const sortedAxes = hasRealActivity
    ? [...radar.axes].sort((a, b) => b.score - a.score)
    : radar.axes.map((a) => ({ ...a, score: 0 }));

  const overallReadiness = hasRealActivity ? radar.overall : 0;

  const latestExam = history[0] || null;
  const latestExamScoreText = latestExam
    ? typeof latestExam.score === 'number'
      ? `${latestExam.score}/${latestExam.totalPoints || 10} điểm`
      : 'Đã hoàn thành'
    : 'Chưa có bài thi';

  const now = new Date();
  const currentMonthLabel = `Tháng ${now.getMonth() + 1}`;
  const currentYear = now.getFullYear();
  const joinedYear = createdAt && !Number.isNaN(new Date(createdAt).getTime())
    ? new Date(createdAt).getFullYear()
    : currentYear;

  const nv1Cutoff = Number(nv1?.s2025 || nv1?.s2024 || 0);

  return {
    hasRealActivity,
    currentMonthLabel,
    currentYear,
    joinedYear,
    overallReadiness,
    axes: sortedAxes,
    elo: eloState.elo,
    eloRank,
    power: powerState.power,
    powerTier: powerState.tier,
    pred30,
    nv1,
    nv1Cutoff,
    wrongPending,
    roadmapCount: roadmapSessions.length,
    examCount: history.length,
    latestExam,
    latestExamDate: latestExam
      ? safeFormatDayMonth(latestExam.completedAt || latestExam.submittedAt || latestExam.date)
      : '--.--',
    latestExamScoreText,
    classCount: Array.isArray(classes) ? classes.length : 0,
    friendCount: Array.isArray(friends) ? friends.length : 0,
    favCount: Array.isArray(favIds) ? favIds.length : 0,
    streakDays: Math.max(0, Number(streakDays) || 0),
    credits: Math.max(0, Number(credits) || 0),
    isPro: Boolean(isPro),
    tierLabel: tierLabel || (isPro ? 'ELEC VIP' : 'Miễn phí'),
    heartsCount: Math.max(0, Number(heartsCount) || 0),
    maxHeartsCount: Math.max(1, Number(maxHeartsCount) || 5),
    isTeacher: Boolean(isTeacher),
  };
}

/* ---- Crisp Inline SVG Icons (0 emoji) ---- */
function SvgDocument({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function SvgAtom({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(35 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-35 12 12)" />
    </svg>
  );
}

function SvgUsers({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SvgArrowOut({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SvgPulse({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function SvgFlame({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2c.7 3.8-2 5.7-2 9a4 4 0 0 0 8 0c0-2.1-.9-4.1-2.3-5.6 2.8 1.4 4.3 4.4 4.3 7.4A8 8 0 1 1 4 13c0-3.2 1.6-6.2 4.3-8C7.6 7 8 9 9.5 10c-.3-2.5.7-5.5 2.5-8Z" />
    </svg>
  );
}

function SvgCompass({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function SvgSparkles({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

function SvgMessage({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SvgTrophy({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

/**
 * Biểu tượng điêu khắc 3D trung tâm (Sculptural Nucleus / KHTN Bio-Atom Coral + Cobalt).
 */
function VolumetricScienceSculpture({ readiness = 0, isPro = false }) {
  return (
    <svg
      width="226"
      height="244"
      viewBox="0 0 226 244"
      fill="none"
      aria-label="Mô hình Năng lực KHTN 3D"
      style={{ filter: 'drop-shadow(0 24px 28px rgba(244, 63, 94, 0.22))', animation: 'pfAtlasFloat 5s ease-in-out infinite' }}
    >
      <defs>
        <radialGradient id="atlasCoreRed" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#ff949f" />
          <stop offset="48%" stopColor="#fb4e61" />
          <stop offset="100%" stopColor="#c81e3f" />
        </radialGradient>
        <radialGradient id="atlasVesselBlue" cx="35%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <linearGradient id="atlasCoralTube" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff8793" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <radialGradient id="atlasHighlight" cx="30%" cy="25%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.68)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Orbital electron rings */}
      <ellipse cx="113" cy="134" rx="92" ry="34" transform="rotate(-24 113 134)" stroke="rgba(26,92,255,0.22)" strokeWidth="2" strokeDasharray="5 5" />
      <ellipse cx="113" cy="134" rx="92" ry="34" transform="rotate(28 113 134)" stroke="rgba(244,63,94,0.2)" strokeWidth="1.6" />

      {/* Upper Cobalt & Coral Sculptural Nodes (echoing the arterial vessels in the reference) */}
      <path d="M98 46 C96 22, 128 18, 134 44 L132 82 L100 84 Z" fill="url(#atlasCoreRed)" />
      <ellipse cx="115" cy="27" rx="14" ry="7" fill="#fca5a5" opacity="0.55" />

      <path d="M72 64 C58 46, 82 32, 95 50 L108 82 L84 92 Z" fill="url(#atlasCoralTube)" />
      <path d="M136 52 C154 34, 174 52, 160 72 L138 96 L124 84 Z" fill="url(#atlasVesselBlue)" />

      {/* Main Volumetric Organic Core */}
      <path
        d="M114 70 C158 70, 182 108, 172 156 C163 198, 134 224, 114 226 C92 224, 62 198, 54 156 C44 108, 70 70, 114 70 Z"
        fill="url(#atlasCoreRed)"
      />
      {/* Volumetric specular highlight & inner anatomical/molecular contour */}
      <ellipse cx="92" cy="112" rx="34" ry="44" transform="rotate(-14 92 112)" fill="url(#atlasHighlight)" />
      <path
        d="M114 92 C136 102, 146 130, 134 162 C128 178, 118 194, 114 204"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M90 132 C104 140, 122 138, 142 126"
        stroke="rgba(136,19,55,0.28)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M84 164 C96 154, 108 166, 118 184"
        stroke="rgba(136,19,55,0.22)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cobalt nucleus medallion inset */}
      <circle cx="114" cy="146" r="27" fill="url(#atlasVesselBlue)" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" />
      <text
        x="114"
        y="148"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="16"
        fontWeight="800"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {readiness}%
      </text>
      <text
        x="114"
        y="163"
        textAnchor="middle"
        fill="rgba(219,234,254,0.9)"
        fontSize="7.5"
        fontWeight="700"
      >
        {isPro ? 'ELEC VIP' : 'KHTN CORE'}
      </text>
    </svg>
  );
}

const BUBBLE_SLOT_CLASSES = [
  'b-hero',
  'b-md-top',
  'b-md-bot',
  'b-sm-1',
  'b-sm-2',
  'b-sm-3',
];

export default function ProfileAtlasDashboard({
  uid = 'guest',
  credits = 0,
  isPro = false,
  tierLabel = 'Cơ bản',
  currentStreak = 0,
  examHistory = [],
  classes = [],
  friends = [],
  favIds = [],
  heartsCount = 0,
  maxHeartsCount = 5,
  isTeacher = false,
  createdAt = null,
  onSelectTab,
  onOpenCreditTopUp,
  onScrollToAbilityHub,
}) {
  const [miniPage, setMiniPage] = useState(0);
  const [centerMode, setCenterMode] = useState(0); // 0: 3D Structure, 1: Mascot, 2: Rank Trophy
  const [activeHotspot, setActiveHotspot] = useState('elo');
  const [selectedBubbleKey, setSelectedBubbleKey] = useState(null);
  const [splitSlide, setSplitSlide] = useState(0); // 0: Readiness /100, 1: ELO, 2: Combat Power
  const [timelineZoomed, setTimelineZoomed] = useState(false);

  const metrics = useMemo(
    () =>
      buildAtlasMetrics({
        uid,
        examHistory,
        classes,
        friends,
        favIds,
        streakDays: currentStreak,
        credits,
        isPro,
        tierLabel,
        heartsCount,
        maxHeartsCount,
        isTeacher,
        createdAt,
      }),
    [
      uid,
      examHistory,
      classes,
      friends,
      favIds,
      currentStreak,
      credits,
      isPro,
      tierLabel,
      heartsCount,
      maxHeartsCount,
      isTeacher,
      createdAt,
    ]
  );

  const miniPages = useMemo(
    () => [
      {
        label: metrics.currentMonthLabel,
        cards: [
          {
            id: 'latest-exam',
            icon: <SvgDocument />,
            date: metrics.latestExamDate,
            title: metrics.latestExam ? (metrics.latestExam.title || 'Đề KHTN đã làm') : 'Bài thi gần nhất',
            foot: metrics.latestExamScoreText,
            action: () => {
              if (metrics.examCount > 0) onSelectTab?.('history');
              else window.location.hash = '#virtual-exams';
            },
          },
          {
            id: 'class-network',
            icon: <SvgUsers />,
            date: `${metrics.classCount} lớp`,
            title: metrics.isTeacher ? 'Quản lý lớp học' : 'Lớp & Bạn bè',
            foot: `${metrics.friendCount} bạn · ${metrics.favCount} đề lưu`,
            action: () => onSelectTab?.('classroom'),
          },
        ],
      },
      {
        label: 'Phân tích',
        cards: [
          {
            id: 'wrong-notebook',
            icon: <SvgAtom />,
            date: `${metrics.wrongPending} câu`,
            title: 'Sổ tay lỗi sai',
            foot: metrics.wrongPending > 0 ? 'Cần vá ngay 5p' : 'Đang sạch bóng',
            action: () => {
              window.location.hash = '#notebook';
            },
          },
          {
            id: 'nv1-target',
            icon: <SvgTrophy />,
            date: metrics.nv1Cutoff ? `${metrics.nv1Cutoff}đ` : 'NV1',
            title: metrics.nv1?.uni ? metrics.nv1.uni : 'Mục tiêu Đại học',
            foot: metrics.nv1?.major || 'Chưa chọn ngành NV1',
            action: () => {
              if (onScrollToAbilityHub) onScrollToAbilityHub();
              else onSelectTab?.('achievements');
            },
          },
        ],
      },
      {
        label: 'Hệ thống',
        cards: [
          {
            id: 'roadmap-progress',
            icon: <SvgCompass size={15} />,
            date: `${metrics.roadmapCount} phiên`,
            title: 'Lộ trình GDPT',
            foot: metrics.pred30 != null ? `Dự kiến ${metrics.pred30}/30đ` : 'Mở bài luyện tập',
            action: () => {
              window.location.hash = '#roadmap';
            },
          },
          {
            id: 'quota-plan',
            icon: <SvgPulse />,
            date: metrics.isPro ? 'VIP' : `${metrics.heartsCount}/${metrics.maxHeartsCount}`,
            title: metrics.tierLabel,
            foot: metrics.isPro ? 'Mở khóa 100% tính năng' : `Còn ${metrics.heartsCount} tim lượt thi`,
            action: () => onSelectTab?.('vip'),
          },
        ],
      },
    ],
    [metrics, onSelectTab, onScrollToAbilityHub]
  );

  const activeMiniGroup = miniPages[miniPage] || miniPages[0];
  const selectedAxis = metrics.axes.find((a) => a.key === selectedBubbleKey) || null;

  const hotspots = useMemo(
    () => [
      {
        id: 'elo',
        badge: `+${Math.max(0, metrics.elo - 1200)}`,
        title: `ELO ${metrics.elo} (${metrics.eloRank.label})`,
        style: { top: '28px', right: '26px' },
        ctaText: 'Xem Radar',
        action: () => (onScrollToAbilityHub ? onScrollToAbilityHub() : onSelectTab?.('achievements')),
      },
      {
        id: 'streak',
        badge: `${metrics.streakDays}d`,
        title:
          metrics.streakDays > 0
            ? `Đang giữ chuỗi ${metrics.streakDays} ngày học liên tiếp`
            : 'Chưa có chuỗi ngày — hoàn thành 1 bài để khởi động',
        style: { top: '86px', left: '14px' },
        ctaText: 'Mở lịch 30 ngày',
        action: () => onSelectTab?.('achievements'),
      },
      {
        id: 'wrong',
        badge: `${metrics.wrongPending}`,
        title:
          metrics.wrongPending > 0
            ? `${metrics.wrongPending} câu sai chờ ôn trong Sổ lỗi sai`
            : 'Không có câu sai tồn đọng trong Sổ tay',
        style: { top: '98px', right: '10px' },
        ctaText: 'Vá lỗi ngay',
        action: () => {
          window.location.hash = '#notebook';
        },
      },
      {
        id: 'exams',
        badge: `${metrics.examCount}`,
        title:
          metrics.examCount > 0
            ? `Đã hoàn thành ${metrics.examCount} đề thi thử THPTQG`
            : 'Chưa làm bài thi ảo nào — vào Phòng thi để chấm ELO',
        style: { bottom: '52px', left: '26px' },
        ctaText: metrics.examCount > 0 ? 'Xem lịch sử' : 'Thi ngay',
        action: () => {
          if (metrics.examCount > 0) onSelectTab?.('history');
          else window.location.hash = '#virtual-exams';
        },
      },
    ],
    [metrics, onScrollToAbilityHub, onSelectTab]
  );

  const activeSpot = hotspots.find((h) => h.id === activeHotspot) || hotspots[0];

  const mascotSrc =
    metrics.streakDays >= 7 || metrics.isPro
      ? '/img/elec/elec-super-saiyan.png'
      : metrics.streakDays > 0 || metrics.examCount > 0
        ? '/img/elec/elec-celebrate.png'
        : '/img/elec/elec-default.png';

  const centerTitles = ['Cấu trúc KHTN 3D', 'Linh vật Học bá', 'Huy hiệu Tài khoản'];

  const splitViews = [
    {
      value: `${metrics.overallReadiness}`,
      unit: '/100',
      sub: metrics.hasRealActivity ? `${metrics.eloRank.label} · ${metrics.examCount} đề` : 'Chưa có dữ liệu thi',
      icon: <SvgCompass size={14} />,
      onClick: () => (onScrollToAbilityHub ? onScrollToAbilityHub() : onSelectTab?.('achievements')),
    },
    {
      value: `${metrics.elo}`,
      unit: 'ELO',
      sub: `Hạng ${metrics.eloRank.label}`,
      icon: <SvgTrophy size={14} />,
      onClick: () => onSelectTab?.('achievements'),
    },
    {
      value: formatCompactAtlasNumber(metrics.power),
      unit: 'LC',
      sub: `${metrics.powerTier.label} · ${metrics.pred30 != null ? `${metrics.pred30}/30đ` : 'Chưa dự báo'}`,
      icon: <SvgSparkles size={14} />,
      onClick: () => (onScrollToAbilityHub ? onScrollToAbilityHub() : onSelectTab?.('achievements')),
    },
  ];
  const currentSplit = splitViews[splitSlide] || splitViews[0];

  const timelineNodes = useMemo(
    () => [
      {
        id: 'join',
        year: `${metrics.joinedYear}`,
        tone: 'on-blue',
        label: 'Gia nhập ELEC',
        dots: 3,
        count: null,
        onClick: () => onSelectTab?.('settings'),
      },
      {
        id: 'roadmap',
        year: 'Lộ trình',
        tone: 'on-blue',
        label: `${metrics.roadmapCount} phiên học`,
        dots: 3,
        count: metrics.roadmapCount > 0 ? `+${metrics.roadmapCount}` : null,
        onClick: () => {
          window.location.hash = '#roadmap';
        },
      },
      {
        id: 'exams',
        year: 'Phòng thi',
        tone: 'on-light',
        label: `${metrics.examCount} đề thi`,
        dots: timelineZoomed ? 4 : 2,
        count: metrics.examCount > 0 ? `+${metrics.examCount}` : null,
        onClick: () => onSelectTab?.('history'),
      },
      {
        id: 'streak',
        year: `${metrics.currentYear}`,
        tone: 'on-light',
        label: `Chuỗi ${metrics.streakDays}d`,
        dots: timelineZoomed ? 3 : 2,
        count: metrics.streakDays > 0 ? `+${metrics.streakDays}` : null,
        onClick: () => onSelectTab?.('achievements'),
      },
      {
        id: 'vip',
        year: metrics.isPro ? 'ELEC VIP' : 'Nâng cấp',
        tone: 'on-light',
        label: metrics.tierLabel,
        dots: 0,
        count: null,
        onClick: () => onSelectTab?.('vip'),
      },
    ],
    [metrics, timelineZoomed, onSelectTab]
  );

  // Waveform path derived from real exam/credit presence
  const wavePath = metrics.hasRealActivity
    ? 'M0 26 L18 26 L26 16 L34 34 L42 12 L52 38 L62 24 L76 24 L84 18 L92 31 L104 8 L114 39 L124 25 L146 25 L154 15 L164 33 L172 26 L200 26'
    : 'M0 26 L56 26 L64 21 L72 30 L80 26 L140 26 L148 22 L156 29 L164 26 L200 26';

  return (
    <div className="pf-atlas-stage-wrap" data-testid="pf-atlas-dashboard">
      <div className="pf-atlas-grid">
        {/* CỘT 1: LỊCH SỬ THẺ NHỎ + THẺ NĂNG LỰC BONG BÓNG ROYAL COBALT */}
        <div className="pf-atlas-col-left">
          <div className="pf-atlas-subcol-stack">
            <div className="pf-atlas-month-lbl">{activeMiniGroup.label}</div>
            {activeMiniGroup.cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="pf-atlas-mini-card"
                onClick={card.action}
              >
                <div className="pf-atlas-mini-top">
                  <span className="pf-atlas-mini-ico">{card.icon}</span>
                  <span className="pf-atlas-mini-date">{card.date}</span>
                </div>
                <div className="pf-atlas-mini-title">{card.title}</div>
                <div className="pf-atlas-mini-foot">
                  <span>{card.foot}</span>
                </div>
              </button>
            ))}

            <div className="pf-atlas-dots-row" role="tablist" aria-label="Trang thẻ tóm tắt">
              {miniPages.map((pg, idx) => (
                <button
                  key={pg.label}
                  type="button"
                  aria-label={`Xem nhóm ${pg.label}`}
                  onClick={() => setMiniPage(idx)}
                  className={`pf-atlas-dot-pill${miniPage === idx ? ' active' : ''}`}
                  style={{ border: 'none', padding: 0, cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>

          <div className="pf-atlas-bubble-card">
            <div className="pf-atlas-bubble-head">
              <div className="pf-atlas-bubble-head-left">
                <SvgAtom size={16} />
                <span>Năng lực KHTN</span>
              </div>
              <span className="pf-atlas-mini-date">
                {metrics.hasRealActivity ? `${metrics.overallReadiness}%` : 'Khởi tạo'}
              </span>
            </div>

            <div className="pf-atlas-avatar-stack">
              <div className="pf-atlas-stack-circles">
                <span className="pf-atlas-stack-pill" style={{ background: '#3b82f6' }}>L</span>
                <span className="pf-atlas-stack-pill" style={{ background: '#0ea5e9' }}>H</span>
                <span className="pf-atlas-stack-pill" style={{ background: '#10b981' }}>S</span>
                <span className="pf-atlas-stack-pill" style={{ background: '#1e293b' }}>AI</span>
              </div>
              <span className="pf-atlas-stack-caption">
                {metrics.nv1?.uni
                  ? `${metrics.nv1.uni}`
                  : `+${metrics.axes.length} trục Lý · Hóa · Sinh`}
              </span>
            </div>

            <div className="pf-atlas-blue-canvas">
              <div className="pf-atlas-bubbles-field">
                {metrics.axes.slice(0, 6).map((axis, i) => {
                  const slotClass = BUBBLE_SLOT_CLASSES[i] || 'b-sm-3';
                  return (
                    <button
                      key={axis.key}
                      type="button"
                      className={`pf-atlas-bubble ${slotClass}`}
                      onClick={() =>
                        setSelectedBubbleKey((prev) => (prev === axis.key ? null : axis.key))
                      }
                      title={`${axis.label}: ${axis.score}/100`}
                    >
                      <strong>
                        {axis.score}
                        <small>/100</small>
                      </strong>
                      <span>{axis.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pf-atlas-blue-footer">
                <div className="pf-atlas-blue-footer-copy">
                  <b>
                    {selectedAxis
                      ? `${selectedAxis.label}: ${selectedAxis.score}/100`
                      : metrics.hasRealActivity
                        ? `Radar 6 trục · ${metrics.overallReadiness}/100`
                        : 'Phân tích 6 trục năng lực'}
                  </b>
                  <small>
                    {selectedAxis
                      ? 'Nhấp mũi tên để xem biểu đồ đầy đủ'
                      : metrics.examCount > 0
                        ? `Tổng hợp từ ${metrics.examCount} bài thi & chuỗi ${metrics.streakDays}d`
                        : 'Làm 1 đề hoặc luyện tập để mở khóa biểu đồ'}
                  </small>
                </div>
                <button
                  type="button"
                  className="pf-atlas-open-sq"
                  aria-label="Mở biểu đồ Radar năng lực 6 trục"
                  onClick={() => {
                    if (onScrollToAbilityHub) onScrollToAbilityHub();
                    else onSelectTab?.('achievements');
                  }}
                >
                  <SvgArrowOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 2: CENTERPIECE VOLUMETRIC 3D + GLASSY HOTSPOTS + < > CONTROLS */}
        <div className="pf-atlas-col-center">
          <div className="pf-atlas-sculpture-stage">
            <div className="pf-atlas-ambient-glow" />

            {centerMode === 0 && (
              <Suspense
                fallback={
                  <VolumetricScienceSculpture
                    readiness={metrics.overallReadiness}
                    isPro={metrics.isPro}
                  />
                }
              >
                <Heart3DViewer
                  readiness={metrics.overallReadiness}
                  isPro={metrics.isPro}
                  fallback={
                    <VolumetricScienceSculpture
                      readiness={metrics.overallReadiness}
                      isPro={metrics.isPro}
                    />
                  }
                />
              </Suspense>
            )}

            {centerMode === 1 && (
              <img
                src={mascotSrc}
                alt="Linh vật Bé ELEC Học bá"
                className="pf-atlas-mascot-hero"
              />
            )}

            {centerMode === 2 && (
              <div
                style={{
                  width: 210,
                  height: 210,
                  borderRadius: '32px',
                  background: 'linear-gradient(155deg, #2563eb 0%, #1d4ed8 55%, #0f172a 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: 18,
                  textAlign: 'center',
                  boxShadow: '0 24px 36px -12px rgba(26, 92, 255, 0.45)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <SvgTrophy size={34} />
                <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {metrics.powerTier.label}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                  {metrics.elo} ELO
                </div>
                <div style={{ fontSize: '0.76rem', opacity: 0.9 }}>
                  {metrics.eloRank.label} · {formatCompactAtlasNumber(metrics.power)} LC
                </div>
              </div>
            )}

            {hotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                aria-label={spot.title}
                onClick={() => setActiveHotspot(spot.id)}
                className={`pf-atlas-hotspot${activeHotspot === spot.id ? ' is-active' : ''}`}
                style={spot.style}
              >
                <span className="pf-atlas-hotspot-badge">{spot.badge}</span>
              </button>
            ))}
          </div>

          <div className="pf-atlas-hotspot-readout">
            <span>{activeSpot.title}</span>
            <button
              type="button"
              onClick={activeSpot.action}
              style={{
                border: 'none',
                background: 'rgba(26, 92, 255, 0.1)',
                color: '#1a5cff',
                borderRadius: '999px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              {activeSpot.ctaText}
            </button>
          </div>

          <div className="pf-atlas-carousel-pill" aria-label="Chuyển mô hình trung tâm">
            <button
              type="button"
              aria-label="Mô hình trước"
              onClick={() => setCenterMode((m) => (m + 2) % 3)}
            >
              ‹
            </button>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', padding: '0 4px' }}>
              {centerTitles[centerMode]}
            </span>
            <button
              type="button"
              aria-label="Mô hình tiếp"
              onClick={() => setCenterMode((m) => (m + 1) % 3)}
            >
              ›
            </button>
          </div>

          <div className="pf-atlas-right-rail-btns" aria-label="Phím tắt trung tâm">
            <button
              type="button"
              className={`pf-atlas-rail-circle${centerMode === 1 ? ' on' : ''}`}
              title="Xem Linh vật Bé ELEC"
              onClick={() => setCenterMode((m) => (m === 1 ? 0 : 1))}
            >
              <SvgSparkles />
            </button>
            <button
              type="button"
              className={`pf-atlas-rail-circle${centerMode === 0 ? ' on' : ''}`}
              title="Biểu đồ Radar & Năng lực 3D"
              onClick={() => {
                setCenterMode(0);
                onScrollToAbilityHub?.();
              }}
            >
              <SvgCompass />
            </button>
            <button
              type="button"
              className="pf-atlas-rail-circle"
              title="Mở Gia sư ELEC AI"
              onClick={() => {
                window.location.hash = '#ai';
              }}
            >
              <SvgMessage />
            </button>
          </div>
        </div>

        {/* CỘT 3: TELEMETRY STACKED CARDS (AI CREDIT WAVE + STREAK & READINESS COBALT BLOCK) */}
        <div className="pf-atlas-col-right">
          <button
            type="button"
            className="pf-atlas-metric-card"
            onClick={() => {
              if (onOpenCreditTopUp) onOpenCreditTopUp();
              else onSelectTab?.('vip');
            }}
          >
            <div className="pf-atlas-metric-top">
              <span className="pf-atlas-mini-ico" style={{ color: '#1a5cff' }}>
                <SvgPulse size={15} />
              </span>
              <div className="pf-atlas-metric-val-wrap">
                <span className="pf-atlas-metric-big">
                  {formatCompactAtlasNumber(metrics.credits)}
                </span>
                <span className="pf-atlas-metric-unit">cr</span>
                <span className="pf-atlas-metric-lbl">ELEC AI Credit</span>
              </div>
            </div>

            <div className="pf-atlas-wave-box">
              <span className="pf-atlas-now-badge">
                {metrics.isPro ? 'VIP' : 'Hôm nay'}
              </span>
              <svg width="100%" height="44" viewBox="0 0 200 44" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="atlasWaveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(26, 92, 255, 0.16)" />
                    <stop offset="100%" stopColor="rgba(26, 92, 255, 0)" />
                  </linearGradient>
                </defs>
                <path d={`${wavePath} L200 44 L0 44 Z`} fill="url(#atlasWaveFill)" />
                <path
                  d={wavePath}
                  fill="none"
                  stroke="#1a5cff"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          <div className="pf-atlas-split-card">
            <div className="pf-atlas-split-top">
              <span className="pf-atlas-mini-ico" style={{ color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)' }}>
                <SvgFlame size={15} />
              </span>
              <div className="pf-atlas-metric-val-wrap">
                <span className="pf-atlas-metric-big">{metrics.streakDays}</span>
                <span className="pf-atlas-metric-unit">ngày</span>
                <span className="pf-atlas-metric-lbl">Chuỗi học tập</span>
              </div>
            </div>

            <div
              className="pf-atlas-split-blue"
              role="button"
              tabIndex={0}
              onClick={currentSplit.onClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  currentSplit.onClick?.();
                }
              }}
            >
              <div className="pf-atlas-split-blue-ico">{currentSplit.icon}</div>
              <div className="pf-atlas-split-blue-score">
                {currentSplit.value}
                <small> {currentSplit.unit}</small>
              </div>
              <div className="pf-atlas-split-blue-sub">{currentSplit.sub}</div>

              <div
                className="pf-atlas-split-dots"
                onClick={(e) => e.stopPropagation()}
                role="tablist"
                aria-label="Chuyển chỉ số tổng hợp"
              >
                {splitViews.map((_, idx) => (
                  <span
                    key={idx}
                    role="tab"
                    aria-selected={splitSlide === idx}
                    tabIndex={0}
                    className={splitSlide === idx ? 'on' : ''}
                    onClick={() => setSplitSlide(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSplitSlide(idx);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM INTERACTIVE CHRONOLOGICAL TIMELINE BAR */}
      <div className="pf-atlas-timeline-dock">
        <div className="pf-atlas-zoom-pair">
          <button
            type="button"
            className="pf-atlas-zoom-btn"
            aria-label="Mở rộng thanh tiến trình"
            onClick={() => setTimelineZoomed(true)}
          >
            +
          </button>
          <button
            type="button"
            className="pf-atlas-zoom-btn"
            aria-label="Thu gọn thanh tiến trình"
            onClick={() => setTimelineZoomed(false)}
          >
            −
          </button>
        </div>

        <div className="pf-atlas-timeline-track" role="navigation" aria-label="Dòng thời gian học tập">
          {timelineNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={node.onClick}
              className={`pf-atlas-tl-node ${node.tone}`}
              title={node.label}
            >
              <span className="pf-atlas-tl-yr">{node.year}</span>
              <span className="pf-atlas-tl-orb">
                <SvgAtom size={13} />
              </span>
              {node.dots > 0 && (
                <span className="pf-atlas-tl-dots" aria-hidden="true">
                  {Array.from({ length: node.dots }).map((_, idx) => (
                    <i key={idx} />
                  ))}
                </span>
              )}
              {node.count && <span className="pf-atlas-tl-count">{node.count}</span>}
              {timelineZoomed && (
                <span style={{ fontSize: '0.7rem', opacity: 0.88 }}>{node.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
