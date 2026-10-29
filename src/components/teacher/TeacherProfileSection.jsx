/* ============================================================
   TeacherProfileSection.jsx — D3. Hồ sơ Giáo viên Bộ môn
   ------------------------------------------------------------
   Bao gồm 6 phân khu chuyên sâu cho Giáo viên bộ môn:
     1. Thông tin Hồ sơ Giáo viên bộ môn (Header Card + chỉnh sửa trực tiếp)
     2. Bảng điều khiển theo môn (Subject Dashboard Bento Cards + Mini SVG Trend)
     3. Huy hiệu và Thành tựu nhẹ nhàng (Teacher Achievements)
     4. Mục "Gợi ý hôm nay" từ AI (AI Daily Pedagogical Suggestions)
     5. Cài đặt cá nhân cho Đề thi (Personal Exam Settings + Xem trước đầu trang A4)
     6. Chia sẻ tài nguyên với đồng nghiệp cùng tổ & Quản lý GVBM theo lớp
   ============================================================ */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase.js';
import { SUBJECTS } from '../../lib/subjects.js';
import SubjectTeacherPanel from './SubjectTeacherPanel.jsx';
import '../../styles/teacher-profile-section.css';

/* ============ CONSTANTS & DEFAULTS ============ */
const GRADE_OPTIONS = ['Khối 10', 'Khối 11', 'Khối 12', 'Ôn thi THPT QG', 'Bồi dưỡng HSG'];

const DEPARTMENT_SUGGESTIONS = [
  'Tổ Toán - Tin',
  'Tổ Vật lí - Công nghệ',
  'Tổ Hóa - Sinh',
  'Tổ Khoa học Tự nhiên',
  'Tổ Ngữ văn',
  'Tổ Ngoại ngữ',
  'Tổ Lịch sử - Địa lí - GDKT&PL',
];

const DEFAULT_PROFILE = {
  displayName: '',
  avatarUrl: '',
  school: 'THPT Chuyên',
  department: 'Tổ Khoa học Tự nhiên',
  mainSubject: 'Hóa học',
  subSubjects: ['Khoa học tự nhiên'],
  grades: ['Khối 10', 'Khối 11', 'Khối 12'],
  bio: 'Giáo viên bộ môn tâm huyết với phương pháp kiểm tra đánh giá năng lực và cá nhân hóa lộ trình học tập.',
};

const DEFAULT_EXAM_PREFS = {
  defaultSubject: 'Hóa học',
  gradingScale: '10', // '10' | '100'
  headerDeptName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
  headerSchoolName: 'TRƯỜNG THPT CHUYÊN',
  headerSubjectGroup: 'TỔ KHOA HỌC TỰ NHIÊN',
  headerExamMotto: 'ĐỀ KIỂM TRA ĐỊNH KỲ NĂM HỌC 2025 - 2026',
  footerSignature: 'Chúc các em bình tĩnh, tự tin và làm bài đạt kết quả cao nhất!',
  footerTeacherSign: '',
  notifyOnSubmit: true,
  notifyOnRetryRequest: true,
  notifyWeeklyReport: true,
};

/* ============ SVG ICONS (100% STROKE SVG, NO EMOJI) ============ */
const Svg = ({ size = 18, sw = 1.75, className = '', children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IcoUser = (p) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

const IcoEdit = (p) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
);

const IcoCheck = (p) => (
  <Svg {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);

const IcoCrown = (p) => (
  <Svg {...p}>
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </Svg>
);

const IcoSchool = (p) => (
  <Svg {...p}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </Svg>
);

const IcoBook = (p) => (
  <Svg {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const IcoAward = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </Svg>
);

const IcoSparkles = (p) => (
  <Svg {...p}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </Svg>
);

const IcoTrendUp = (p) => (
  <Svg {...p}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </Svg>
);

const IcoTrendDown = (p) => (
  <Svg {...p}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </Svg>
);

const IcoTrendFlat = (p) => (
  <Svg {...p}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="15 7 20 12 15 17" />
  </Svg>
);

const IcoSettings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const IcoShare = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);

const IcoUndo = (p) => (
  <Svg {...p}>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </Svg>
);

const IcoCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

const IcoCamera = (p) => (
  <Svg {...p}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
);

const IcoShield = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const IcoArrowRight = (p) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Svg>
);

const IcoUsers = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

/* Subject specific SVG icon */
const SubjectIcon = ({ subjectName, size = 20 }) => {
  const s = String(subjectName || '').toLowerCase();
  if (s.includes('hóa') || s.includes('hoa') || s.includes('khtn') || s.includes('khoa học')) {
    return (
      <Svg size={size}>
        <path d="M10 2v7.31L4.72 18.55A2 2 0 0 0 6.46 21.5h11.08a2 2 0 0 0 1.74-2.95L14 9.31V2" />
        <path d="M8.5 2h7" />
        <path d="M7 15h10" />
      </Svg>
    );
  }
  if (s.includes('toán') || s.includes('toan')) {
    return (
      <Svg size={size}>
        <line x1="19" y1="5" x2="5" y2="19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </Svg>
    );
  }
  if (s.includes('lí') || s.includes('lý') || s.includes('ly')) {
    return (
      <Svg size={size}>
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" />
      </Svg>
    );
  }
  if (s.includes('sinh')) {
    return (
      <Svg size={size}>
        <path d="M2 15c6.667-6 13.333 0 20-6" />
        <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
        <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      </Svg>
    );
  }
  if (s.includes('anh') || s.includes('ngoại ngữ')) {
    return (
      <Svg size={size}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </Svg>
    );
  }
  return <IcoBook size={size} />;
};

/* ============ HELPERS ============ */
function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

function safeReadArray(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getScore10(sub) {
  if (!sub) return null;
  if (typeof sub.score10 === 'number' && !Number.isNaN(sub.score10)) return sub.score10;
  if (typeof sub.score === 'number' && typeof sub.total === 'number' && sub.total > 0) {
    return Number(((sub.score / sub.total) * 10).toFixed(2));
  }
  if (typeof sub.percentage === 'number') {
    return Number((sub.percentage / 10).toFixed(2));
  }
  if (typeof sub.score === 'number' && sub.score <= 10) {
    return Number(sub.score.toFixed(2));
  }
  return null;
}

function toMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  const parsed = Date.parse(val);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateVN(val) {
  const ms = toMs(val);
  if (!ms) return 'Không thời hạn';
  try {
    return new Date(ms).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/* Đọc trạng thái gói VIP / PRO từ user hoặc localStorage */
function resolvePackageStatus(user) {
  try {
    const rawVip = localStorage.getItem('cs-vip-status');
    if (rawVip) {
      const parsed = JSON.parse(rawVip);
      if (parsed && (parsed.isVip || parsed.tier === 'pro' || parsed.tier === 'vip' || parsed.active)) {
        return {
          isPro: true,
          label: parsed.planName || 'Gói PRO Giáo Viên',
          expiresAt: parsed.expiresAt || parsed.expiryDate || null,
        };
      }
    }
  } catch {
    /* ignore */
  }
  if (user?.isAdmin || user?.claims?.pro || user?.claims?.vip || user?.tier === 'pro') {
    return {
      isPro: true,
      label: user?.isAdmin ? 'Gói PRO (Quản trị viên)' : 'Gói PRO Giáo Viên',
      expiresAt: user?.proExpiresAt || null,
    };
  }
  return {
    isPro: false,
    label: 'Gói Thường (Miễn phí)',
    expiresAt: null,
  };
}

/* Resize ảnh về kích thước gọn trước khi lưu base64 */
function compressAvatarFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 180;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============ MINI SVG TREND CHART (4 EXAMS) ============ */
function MiniSubjectTrendSvg({ points = [] }) {
  const safePoints = points.length > 0 ? points.slice(-4) : [];
  if (safePoints.length === 0) {
    return (
      <div className="tps-trend-empty">
        <span>Chưa có dữ liệu điểm 4 đề gần nhất</span>
      </div>
    );
  }

  const width = 148;
  const height = 42;
  const padX = 12;
  const padY = 7;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = safePoints.map((pt, idx) => {
    const x =
      safePoints.length === 1
        ? width / 2
        : padX + (idx / (safePoints.length - 1)) * innerW;
    const clamped = Math.max(0, Math.min(10, Number(pt.avg) || 0));
    const y = padY + innerH - (clamped / 10) * innerH;
    return { x, y, val: clamped, title: pt.title || `Đề ${idx + 1}` };
  });

  const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const firstVal = coords[0]?.val ?? 0;
  const lastVal = coords[coords.length - 1]?.val ?? 0;
  const diff = Number((lastVal - firstVal).toFixed(2));
  const strokeColor = diff > 0.15 ? '#0f9d76' : diff < -0.15 ? '#dc2626' : '#2563eb';

  return (
    <div className="tps-mini-chart-wrap">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="tps-mini-chart-svg"
        role="img"
        aria-label="Xu hướng 4 đề gần nhất"
      >
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeDasharray="2 2"
        />
        {coords.map((c, idx) => (
          <rect
            key={`bar-${idx}`}
            x={c.x - 5}
            y={c.y}
            width="10"
            height={Math.max(2, height - padY - c.y)}
            rx="3"
            fill={strokeColor}
            fillOpacity="0.16"
          />
        ))}
        {coords.length > 1 && (
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
          />
        )}
        {coords.map((c, idx) => (
          <g key={`dot-${idx}`}>
            <circle cx={c.x} cy={c.y} r="3.2" fill={strokeColor} />
            <title>{`${c.title}: ${c.val.toFixed(1)} điểm`}</title>
          </g>
        ))}
      </svg>
      <div className="tps-mini-chart-points">
        {coords.map((c, i) => (
          <span key={i} title={c.title}>
            {c.val.toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============ MAIN COMPONENT ============ */
export default function TeacherProfileSection({
  user,
  classes = [],
  exams = [],
  submissionsMap = {},
  questionsCount = 0,
  onNavigate,
  onSay,
}) {
  const uid = user?.uid || 'guest';
  const profileStorageKey = `cs-teacher-profile-v1:${uid}`;
  const examPrefsStorageKey = `cs-teacher-exam-prefs-v1:${uid}`;
  const shareStorageKey = `cs-teacher-shared-resources-v1:${uid}`;

  /* ---------- 1. State Hồ sơ Giáo viên ---------- */
  const [profile, setProfile] = useState(() => {
    const saved = safeReadJson(profileStorageKey, DEFAULT_PROFILE);
    return {
      ...saved,
      displayName: saved.displayName || user?.displayName || user?.email?.split('@')[0] || 'Giáo viên Bộ môn',
      avatarUrl: saved.avatarUrl || user?.photoURL || '',
    };
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('overview'); // 'overview' | 'exam-prefs' | 'sharing'
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = safeReadJson(profileStorageKey, DEFAULT_PROFILE);
    const merged = {
      ...saved,
      displayName: saved.displayName || user?.displayName || user?.email?.split('@')[0] || 'Giáo viên Bộ môn',
      avatarUrl: saved.avatarUrl || user?.photoURL || '',
    };
    setProfile(merged);
    setProfileDraft(merged);
  }, [profileStorageKey, user?.displayName, user?.email, user?.photoURL]);

  const pkgStatus = useMemo(() => resolvePackageStatus(user), [user]);

  const notify = useCallback(
    (msg, tone = 'ok', opts) => {
      if (typeof onSay === 'function') {
        onSay(msg, tone, opts);
      }
    },
    [onSay]
  );

  const [bannerMsg, setBannerMsg] = useState(null);
  const showLocalBanner = useCallback((text, tone = 'ok', undoFn = null) => {
    setBannerMsg({ text, tone, undoFn });
  }, []);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    const prevProfile = { ...profile };
    const nextProfile = {
      ...profileDraft,
      displayName: String(profileDraft.displayName || '').trim() || 'Giáo viên Bộ môn',
      school: String(profileDraft.school || '').trim() || 'THPT',
      department: String(profileDraft.department || '').trim() || 'Tổ Chuyên môn',
    };
    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      if (auth.currentUser && nextProfile.displayName !== user?.displayName) {
        try {
          await updateProfile(auth.currentUser, { displayName: nextProfile.displayName });
        } catch {
          /* Không chặn lưu localStorage nếu offline */
        }
      }
      setProfile(nextProfile);
      setEditingProfile(false);
      showLocalBanner('Đã cập nhật hồ sơ giáo viên bộ môn.', 'ok', () => {
        try {
          localStorage.setItem(profileStorageKey, JSON.stringify(prevProfile));
        } catch { /* ignore */ }
        setProfile(prevProfile);
        setProfileDraft(prevProfile);
        showLocalBanner('Đã hoàn tác thông tin hồ sơ trước đó.', 'info');
      });
      notify('Đã lưu hồ sơ giáo viên bộ môn', 'ok');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarFile(file);
      setProfileDraft((prev) => ({ ...prev, avatarUrl: dataUrl }));
    } catch {
      showLocalBanner('Không thể đọc tệp ảnh đại diện. Vui lòng thử ảnh khác.', 'err');
    }
  };

  const toggleSubSubject = (subj) => {
    setProfileDraft((prev) => {
      const exists = prev.subSubjects.includes(subj);
      const next = exists
        ? prev.subSubjects.filter((s) => s !== subj)
        : [...prev.subSubjects, subj];
      return { ...prev, subSubjects: next };
    });
  };

  const toggleGrade = (grade) => {
    setProfileDraft((prev) => {
      const exists = prev.grades.includes(grade);
      const next = exists
        ? prev.grades.filter((g) => g !== grade)
        : [...prev.grades, grade];
      return { ...prev, grades: next };
    });
  };

  /* ---------- 2. Tổng hợp Bảng điều khiển theo môn ---------- */
  const subjectStats = useMemo(() => {
    const teacherSubjects = [
      profile.mainSubject,
      ...(Array.isArray(profile.subSubjects) ? profile.subSubjects : []),
    ].filter(Boolean);

    const examSubjects = exams.map((ex) => ex.subject).filter(Boolean);
    const classSubjects = classes.map((c) => c.subject).filter(Boolean);

    const uniqueSubjects = [
      ...new Set([
        ...teacherSubjects,
        ...examSubjects,
        ...classSubjects,
      ]),
    ];
    if (uniqueSubjects.length === 0) {
      uniqueSubjects.push('Hóa học', 'Khoa học tự nhiên');
    }

    const totalClassStudents = classes.reduce(
      (sum, c) => sum + (Array.isArray(c.members) ? c.members.length : Number(c.studentCount) || 0),
      0
    );

    return uniqueSubjects.map((subjName) => {
      const subjExams = exams
        .filter((ex) => {
          const s = (ex.subject || '').trim().toLowerCase();
          return s === subjName.trim().toLowerCase() || (!s && subjName === profile.mainSubject);
        })
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));

      let qCount = 0;
      let totalSubmissions = 0;
      let expectedSubmissions = 0;
      const allScores = [];
      const trendPoints = [];

      subjExams.forEach((ex) => {
        const qs = Array.isArray(ex.questions)
          ? ex.questions.length
          : Number(ex.questionCount || ex.questionsCount || 0);
        qCount += qs;

        const subs = Array.isArray(submissionsMap[ex.id]) ? submissionsMap[ex.id] : [];
        totalSubmissions += subs.length;

        const targetClass = classes.find((c) => c.id === ex.classId);
        const classSize = Array.isArray(targetClass?.members)
          ? targetClass.members.length
          : totalClassStudents > 0
            ? Math.max(subs.length, Math.round(totalClassStudents / Math.max(1, classes.length)))
            : Math.max(subs.length, 1);
        expectedSubmissions += classSize;

        const examScores = subs.map(getScore10).filter((v) => v !== null);
        allScores.push(...examScores);

        const examAvg =
          examScores.length > 0
            ? Number((examScores.reduce((a, b) => a + b, 0) / examScores.length).toFixed(2))
            : null;
        if (examAvg !== null) {
          trendPoints.push({
            id: ex.id,
            title: ex.title || 'Đề kiểm tra',
            avg: examAvg,
          });
        }
      });

      const avgScore10 =
        allScores.length > 0
          ? Number((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1))
          : null;

      const submitRate =
        expectedSubmissions > 0
          ? Math.min(100, Math.round((totalSubmissions / expectedSubmissions) * 100))
          : subjExams.length > 0 && totalSubmissions > 0
            ? 100
            : 0;

      const last4 = trendPoints.slice(-4);
      let trendDirection = 'flat';
      let trendDelta = 0;
      if (last4.length >= 2) {
        trendDelta = Number((last4[last4.length - 1].avg - last4[0].avg).toFixed(1));
        if (trendDelta >= 0.2) trendDirection = 'up';
        else if (trendDelta <= -0.2) trendDirection = 'down';
      }

      return {
        subject: subjName,
        isMain: subjName === profile.mainSubject,
        examsCount: subjExams.length,
        questionsCount: qCount,
        avgScore10,
        submitRate,
        totalSubmissions,
        last4,
        trendDirection,
        trendDelta,
      };
    });
  }, [profile.mainSubject, profile.subSubjects, exams, classes, submissionsMap]);

  /* ---------- 3. Huy hiệu và Thành tựu nhẹ nhàng ---------- */
  const achievements = useMemo(() => {
    const totalExams = exams.length;
    const totalQuestionsFromExams = exams.reduce(
      (sum, ex) =>
        sum +
        (Array.isArray(ex.questions)
          ? ex.questions.length
          : Number(ex.questionCount || ex.questionsCount || 0)),
      0
    );
    const effectiveQuestionBank = Math.max(Number(questionsCount) || 0, totalQuestionsFromExams);

    /* Kiểm tra lớp có chuỗi tăng điểm 3 đề liền */
    let bestStreak = 0;
    let streakClassName = '';
    classes.forEach((cls) => {
      const clsExams = exams
        .filter((e) => e.classId === cls.id)
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt));
      const avgs = clsExams
        .map((e) => {
          const subs = submissionsMap[e.id] || [];
          const sc = subs.map(getScore10).filter((v) => v !== null);
          return sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null;
        })
        .filter((v) => v !== null);

      let cur = avgs.length > 0 ? 1 : 0;
      for (let i = 1; i < avgs.length; i += 1) {
        if (avgs[i] >= avgs[i - 1]) {
          cur += 1;
          if (cur > bestStreak) {
            bestStreak = cur;
            streakClassName = cls.name || 'Lớp phụ trách';
          }
        } else {
          cur = 1;
        }
      }
      if (cur > bestStreak) {
        bestStreak = cur;
        streakClassName = cls.name || 'Lớp phụ trách';
      }
    });

    /* Nếu đề không gắn classId riêng, tính chuỗi trên toàn bộ đề */
    if (bestStreak < 3) {
      const allAvgs = exams
        .slice()
        .sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))
        .map((e) => {
          const subs = submissionsMap[e.id] || [];
          const sc = subs.map(getScore10).filter((v) => v !== null);
          return sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null;
        })
        .filter((v) => v !== null);
      let cur = allAvgs.length > 0 ? 1 : 0;
      for (let i = 1; i < allAvgs.length; i += 1) {
        if (allAvgs[i] >= allAvgs[i - 1]) {
          cur += 1;
          if (cur > bestStreak) bestStreak = cur;
        } else {
          cur = 1;
        }
      }
    }

    const avgSubmitRate =
      subjectStats.length > 0
        ? Math.round(
            subjectStats.reduce((s, x) => s + x.submitRate, 0) /
              Math.max(1, subjectStats.filter((x) => x.examsCount > 0).length || 1)
          )
        : 0;

    const shuffledOrAntiCheatCount = exams.filter(
      (e) => e.shuffleQuestions || e.shuffleOptions || e.antiCheat || e.variantsCount > 1 || e.isLive
    ).length;

    return [
      {
        id: 'ten-exams',
        title: 'Đã soạn 10 đề',
        desc: 'Xây dựng bộ đề kiểm tra thường xuyên và định kỳ chất lượng.',
        current: Math.min(10, totalExams),
        target: 10,
        unit: 'đề',
        unlocked: totalExams >= 10,
        badgeLabel: `${totalExams}/10 đề`,
      },
      {
        id: 'class-streak-3',
        title: 'Lớp tăng điểm 3 đề liền',
        desc: streakClassName
          ? `Chuỗi tiến bộ liên tiếp tại ${streakClassName}.`
          : 'Theo dõi chuỗi cải thiện điểm trung bình qua 3 kỳ kiểm tra liên tiếp.',
        current: Math.min(3, bestStreak),
        target: 3,
        unit: 'đề liên tiếp',
        unlocked: bestStreak >= 3,
        badgeLabel: `${Math.min(3, bestStreak)}/3 đề liền`,
      },
      {
        id: 'bank-100-questions',
        title: 'Ngân hàng 100 câu hỏi',
        desc: 'Tích lũy kho câu hỏi phân hóa theo 4 mức độ nhận thức.',
        current: Math.min(100, effectiveQuestionBank),
        target: 100,
        unit: 'câu',
        unlocked: effectiveQuestionBank >= 100,
        badgeLabel: `${effectiveQuestionBank}/100 câu`,
      },
      {
        id: 'submit-rate-85',
        title: 'Tỉ lệ nộp bài trên 85%',
        desc: 'Duy trì kỷ luật học tập và tỉ lệ hoàn thành bài tập cao.',
        current: Math.min(85, avgSubmitRate),
        target: 85,
        unit: '%',
        unlocked: avgSubmitRate >= 85,
        badgeLabel: `${avgSubmitRate}% chuyên cần`,
      },
      {
        id: 'anti-cheat-master',
        title: 'Chuyên gia Đảo đề & Chống gian lận',
        desc: 'Ứng dụng công nghệ trộn mã đề A4 và giám sát phòng thi nghiêm túc.',
        current: Math.min(5, Math.max(shuffledOrAntiCheatCount, totalExams > 0 ? 1 : 0)),
        target: 5,
        unit: 'đề bảo mật',
        unlocked: shuffledOrAntiCheatCount >= 5 || totalExams >= 5,
        badgeLabel: `${Math.max(shuffledOrAntiCheatCount, totalExams > 0 ? 1 : 0)}/5 đề`,
      },
    ];
  }, [exams, classes, submissionsMap, questionsCount, subjectStats]);

  /* ---------- 4. Gợi ý hôm nay từ AI (AI Daily Pedagogical Suggestions) ---------- */
  const aiDailySuggestions = useMemo(() => {
    /* 1. Lớp nào cần ôn tập */
    let weakestClass = null;
    classes.forEach((cls) => {
      const clsExams = exams.filter((e) => e.classId === cls.id);
      const scores = [];
      let subsCount = 0;
      clsExams.forEach((e) => {
        const subs = submissionsMap[e.id] || [];
        subsCount += subs.length;
        subs.forEach((s) => {
          const sc = getScore10(s);
          if (sc !== null) scores.push(sc);
        });
      });
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const memberCount = Array.isArray(cls.members) ? cls.members.length : 0;
      const expected = Math.max(1, memberCount * Math.max(1, clsExams.length));
      const rate = memberCount > 0 ? Math.round((subsCount / expected) * 100) : 100;

      if (
        !weakestClass ||
        (avg !== null && (weakestClass.avg === null || avg < weakestClass.avg)) ||
        rate < weakestClass.rate
      ) {
        weakestClass = {
          cls,
          name: cls.name || 'Lớp học',
          subject: cls.subject || profile.mainSubject,
          avg: avg !== null ? Number(avg.toFixed(1)) : null,
          rate: Math.min(100, rate),
        };
      }
    });

    /* 2. Đề nào nên đảo lại / giao lại */
    let candidateExam = null;
    exams.forEach((ex) => {
      const subs = submissionsMap[ex.id] || [];
      const ageDays = Math.max(0, Math.round((Date.now() - toMs(ex.createdAt)) / 86400000));
      const score = subs.length * 2 + ageDays;
      if (!candidateExam || score > candidateExam.priority) {
        candidateExam = {
          exam: ex,
          title: ex.title || 'Đề kiểm tra định kỳ',
          subject: ex.subject || profile.mainSubject,
          subsCount: subs.length,
          ageDays,
          priority: score,
        };
      }
    });

    /* 3. Học sinh nào cần kèm thêm */
    const studentMap = new Map();
    Object.entries(submissionsMap).forEach(([, subs]) => {
      if (!Array.isArray(subs)) return;
      subs.forEach((s) => {
        const sc = getScore10(s);
        if (sc === null) return;
        const key = s.studentId || s.userId || s.email || s.studentName || 'hs';
        const name = s.studentName || s.displayName || s.email || 'Học sinh';
        if (!studentMap.has(key)) {
          studentMap.set(key, { name, scores: [], className: s.className || '' });
        }
        studentMap.get(key).scores.push({ sc, at: toMs(s.submittedAt || s.createdAt) });
      });
    });

    const strugglingStudents = [];
    studentMap.forEach((info) => {
      info.scores.sort((a, b) => a.at - b.at);
      const vals = info.scores.map((x) => x.sc);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const last = vals[vals.length - 1];
      const prev = vals.length >= 2 ? vals[vals.length - 2] : last;
      const dropped = prev - last >= 1.5;
      if (avg < 5.5 || last < 5.0 || dropped) {
        strugglingStudents.push({
          name: info.name,
          avg: Number(avg.toFixed(1)),
          last: Number(last.toFixed(1)),
          reason: last < 5.0 ? `Điểm gần nhất ${last.toFixed(1)}/10` : dropped ? `Giảm ${ (prev - last).toFixed(1) } điểm` : `TB ${avg.toFixed(1)}/10`,
        });
      }
    });

    return {
      reviewClass: weakestClass
        ? {
            title: `Lớp cần củng cố: ${weakestClass.name}`,
            detail:
              weakestClass.avg !== null
                ? `Điểm trung bình hiện tại ${weakestClass.avg}/10 · Tỉ lệ nộp bài ${weakestClass.rate}%. Nên giao 1 đề ôn tập 15 phút tập trung vào các câu hay sai.`
                : `Lớp ${weakestClass.name} (${weakestClass.subject}) chưa có dữ liệu điểm mới. Hãy khởi tạo đề ôn tập nhanh để khảo sát năng lực.`,
            actionLabel: 'Tạo đề ôn tập',
            onAction: () => onNavigate?.('create', { classId: weakestClass.cls?.id, subject: weakestClass.subject }),
          }
        : {
            title: `Khởi tạo đề ôn tập môn ${profile.mainSubject}`,
            detail: 'Tạo đề 15 phút hoặc 45 phút phân hóa theo ma trận đặc tả để đánh giá tiến độ học tập của các lớp phụ trách.',
            actionLabel: 'Tạo đề ôn tập',
            onAction: () => onNavigate?.('create', { subject: profile.mainSubject }),
          },
      shuffleExam: candidateExam
        ? {
            title: `Nên đảo mã mới: ${candidateExam.title}`,
            detail: `Đề môn ${candidateExam.subject} đã có ${candidateExam.subsCount} lượt làm bài${candidateExam.ageDays > 0 ? ` (tạo cách đây ${candidateExam.ageDays} ngày)` : ''}. Hãy trộn lại 4–6 mã đề mới trước khi giao cho lớp tiếp theo.`,
            actionLabel: 'Mở Đảo đề',
            onAction: () => onNavigate?.('simulator', candidateExam.exam),
          }
        : {
            title: 'Trộn mã đề A4 & Xuất phiếu tô trắc nghiệm',
            detail: 'Sử dụng công cụ Đảo đề thông minh để sinh nhiều mã đề độc lập, giữ nguyên nhóm câu hỏi đọc hiểu và công thức.',
            actionLabel: 'Mở Đảo đề',
            onAction: () => onNavigate?.('simulator'),
          },
      supportStudents:
        strugglingStudents.length > 0
          ? {
              title: `${strugglingStudents.length} học sinh cần kèm thêm tuần này`,
              detail: strugglingStudents
                .slice(0, 3)
                .map((s) => `${s.name} (${s.reason})`)
                .join(' · '),
              students: strugglingStudents.slice(0, 4),
              actionLabel: 'Xem số liệu lớp',
              onAction: () => onNavigate?.('analytics'),
            }
          : {
              title: 'Theo dõi học sinh có nguy cơ giảm phong độ',
              detail: 'Hệ thống tự động phát hiện học sinh có điểm dưới 5.0 hoặc giảm điểm liên tiếp qua các bài kiểm tra để nhắc giáo viên hỗ trợ kịp thời.',
              students: [],
              actionLabel: 'Xem số liệu lớp',
              onAction: () => onNavigate?.('analytics'),
            },
    };
  }, [classes, exams, submissionsMap, profile.mainSubject, onNavigate]);

  /* ---------- 5. Cài đặt cá nhân cho Đề thi (Personal Exam Settings) ---------- */
  const [examPrefs, setExamPrefs] = useState(() => {
    const saved = safeReadJson(examPrefsStorageKey, {
      ...DEFAULT_EXAM_PREFS,
      defaultSubject: profile.mainSubject || 'Hóa học',
      headerSchoolName: (profile.school || 'TRƯỜNG THPT CHUYÊN').toUpperCase(),
      headerSubjectGroup: (profile.department || 'TỔ KHOA HỌC TỰ NHIÊN').toUpperCase(),
      footerTeacherSign: profile.displayName || '',
    });
    return saved;
  });

  const handleSaveExamPrefs = (e) => {
    if (e) e.preventDefault();
    const prevPrefs = safeReadJson(examPrefsStorageKey, DEFAULT_EXAM_PREFS);
    try {
      localStorage.setItem(examPrefsStorageKey, JSON.stringify(examPrefs));
    } catch (err) {
      console.warn('TeacherProfileSection save examPrefs error:', err);
    }
    showLocalBanner('Đã lưu cài đặt cá nhân cho Đề thi.', 'ok', () => {
      try {
        localStorage.setItem(examPrefsStorageKey, JSON.stringify(prevPrefs));
      } catch { /* ignore */ }
      setExamPrefs(prevPrefs);
      showLocalBanner('Đã hoàn tác cài đặt đề thi trước đó.', 'info');
    });
    notify('Đã lưu cấu hình mẫu đề thi cá nhân', 'ok');
  };

  const handleResetExamPrefs = () => {
    const prevPrefs = { ...examPrefs };
    const resetVal = {
      ...DEFAULT_EXAM_PREFS,
      defaultSubject: profile.mainSubject || 'Hóa học',
      headerSchoolName: (profile.school || 'TRƯỜNG THPT CHUYÊN').toUpperCase(),
      headerSubjectGroup: (profile.department || 'TỔ KHOA HỌC TỰ NHIÊN').toUpperCase(),
      footerTeacherSign: profile.displayName || '',
    };
    setExamPrefs(resetVal);
    try {
      localStorage.setItem(examPrefsStorageKey, JSON.stringify(resetVal));
    } catch (err) {
      console.warn('TeacherProfileSection reset examPrefs error:', err);
    }
    showLocalBanner('Đã khôi phục cài đặt đề thi về mặc định.', 'info', () => {
      setExamPrefs(prevPrefs);
      try {
        localStorage.setItem(examPrefsStorageKey, JSON.stringify(prevPrefs));
      } catch { /* ignore */ }
      showLocalBanner('Đã hoàn tác khôi phục mặc định.', 'ok');
    });
  };

  /* ---------- 6. Chia sẻ tài nguyên với đồng nghiệp cùng tổ ---------- */
  const [sharedList, setSharedList] = useState(() =>
    safeReadArray(shareStorageKey, [
      {
        id: 'shr-demo-1',
        resourceType: 'exam',
        resourceTitle: exams[0]?.title || `Đề kiểm tra 45 phút ${profile.mainSubject}`,
        subject: profile.mainSubject || 'Hóa học',
        colleagueEmail: 'toborgv@truong.edu.vn',
        colleagueName: 'Nhóm GV cùng tổ bộ môn',
        permission: 'view',
        shareCode: 'ORG-KHTN-2026',
        createdAt: Date.now() - 86400000 * 2,
      },
    ])
  );

  const [shareType, setShareType] = useState('exam'); // 'exam' | 'question_set'
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');
  const [colleagueEmail, setColleagueEmail] = useState('');
  const [colleagueName, setColleagueName] = useState('');
  const [sharePermission, setSharePermission] = useState('view'); // 'view' | 'edit'
  const [copiedShareId, setCopiedShareId] = useState('');
  const [confirmRevokeShare, setConfirmRevokeShare] = useState(null);
  const [selectedClassForGVBM, setSelectedClassForGVBM] = useState(() => classes[0]?.id || '');

  useEffect(() => {
    if (!selectedClassForGVBM && classes.length > 0) {
      setSelectedClassForGVBM(classes[0].id);
    }
  }, [classes, selectedClassForGVBM]);

  const persistShares = useCallback(
    (nextList) => {
      setSharedList(nextList);
      try {
        localStorage.setItem(shareStorageKey, JSON.stringify(nextList));
      } catch {
        /* ignore */
      }
    },
    [shareStorageKey]
  );

  const handleCreateShare = (e) => {
    e.preventDefault();
    if (!colleagueEmail.trim() && !colleagueName.trim()) {
      showLocalBanner('Vui lòng nhập email hoặc tên đồng nghiệp cùng tổ để chia sẻ.', 'err');
      return;
    }

    let resourceTitle = '';
    let resourceSubject = profile.mainSubject || 'Hóa học';
    if (shareType === 'exam') {
      const found = exams.find((x) => x.id === selectedResourceId) || exams[0];
      resourceTitle = found?.title || customTopicName.trim() || `Đề kiểm tra ${resourceSubject}`;
      resourceSubject = found?.subject || resourceSubject;
    } else {
      resourceTitle =
        customTopicName.trim() || `Chuyên đề câu hỏi ${resourceSubject} (${profile.grades[0] || 'Khối 12'})`;
    }

    const codeSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newItem = {
      id: `shr-${Date.now()}`,
      resourceType: shareType,
      resourceTitle,
      subject: resourceSubject,
      colleagueEmail: colleagueEmail.trim(),
      colleagueName: colleagueName.trim() || colleagueEmail.trim().split('@')[0],
      permission: sharePermission,
      shareCode: `TBM-${codeSuffix}`,
      createdAt: Date.now(),
    };

    const next = [newItem, ...sharedList];
    persistShares(next);
    setColleagueEmail('');
    setColleagueName('');
    setCustomTopicName('');
    showLocalBanner(`Đã chia sẻ "${resourceTitle}" cho đồng nghiệp cùng tổ.`, 'ok');
    notify('Đã tạo mã chia sẻ tài nguyên nội bộ tổ bộ môn', 'ok');
  };

  const handleToggleSharePermission = (itemId) => {
    const next = sharedList.map((item) =>
      item.id === itemId
        ? { ...item, permission: item.permission === 'view' ? 'edit' : 'view' }
        : item
    );
    persistShares(next);
    showLocalBanner('Đã cập nhật quyền truy cập tài nguyên chia sẻ.', 'ok');
  };

  const handleRevokeShare = (item) => {
    const prev = [...sharedList];
    const next = sharedList.filter((x) => x.id !== item.id);
    persistShares(next);
    setConfirmRevokeShare(null);
    showLocalBanner(`Đã thu hồi quyền chia sẻ "${item.resourceTitle}".`, 'info', () => {
      persistShares(prev);
      showLocalBanner('Đã hoàn tác thu hồi chia sẻ.', 'ok');
    });
  };

  const copyShareLink = async (item) => {
    const url = `${window.location.origin}/?shareCode=${item.shareCode}&mode=${item.permission}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShareId(item.id);
      setTimeout(() => setCopiedShareId(''), 1800);
    } catch {
      setCopiedShareId('');
    }
  };

  const allSubjectLabels = useMemo(
    () => SUBJECTS.map((s) => s.label),
    []
  );

  const avatarInitial = (profile.displayName || 'G').trim().charAt(0).toUpperCase();
  const activeClassObj = classes.find((c) => c.id === selectedClassForGVBM) || classes[0] || null;

  return (
    <section className="tps-root" aria-label="Hồ sơ giáo viên bộ môn">
      {/* Thanh thông báo trạng thái + Hoàn tác */}
      {bannerMsg && (
        <div className={`tps-banner tone-${bannerMsg.tone}`} role="status">
          <div className="tps-banner-text">
            <IcoCheck size={16} />
            <span>{bannerMsg.text}</span>
          </div>
          <div className="tps-banner-actions">
            {typeof bannerMsg.undoFn === 'function' && (
              <button
                type="button"
                className="tps-btn tps-btn-sm tps-btn-outline"
                onClick={bannerMsg.undoFn}
              >
                <IcoUndo size={14} />
                <span>Hoàn tác</span>
              </button>
            )}
            <button
              type="button"
              className="tps-btn tps-btn-sm tps-btn-ghost"
              onClick={() => setBannerMsg(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
         1. THÔNG TIN HỒ SƠ GIÁO VIÊN BỘ MÔN (HEADER CARD THU GỌN)
         ============================================================ */}
      <div className="tps-bento-card tps-header-card">
        <div className="tps-header-top" style={{ borderBottom: editingProfile ? '1px solid var(--tps-line)' : 'none', paddingBottom: editingProfile ? '0.75rem' : 0 }}>
          <div className="tps-avatar-block">
            <div className="tps-avatar-ring">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="tps-avatar-img"
                />
              ) : (
                <div className="tps-avatar-fallback" aria-hidden="true">
                  {avatarInitial}
                </div>
              )}
              <button
                type="button"
                className="tps-avatar-edit-trigger"
                title="Đổi ảnh đại diện"
                onClick={() => {
                  setEditingProfile(true);
                  setTimeout(() => fileInputRef.current?.click(), 80);
                }}
              >
                <IcoCamera size={13} />
              </button>
            </div>

            <div className="tps-identity">
              <div className="tps-name-row">
                <h2 className="tps-teacher-name">{profile.displayName}</h2>
                <span className={`tps-pkg-badge ${pkgStatus.isPro ? 'is-pro' : 'is-free'}`}>
                  <IcoCrown size={13} />
                  <span>{pkgStatus.label}</span>
                </span>
                <span className="tps-meta-item" style={{ fontSize: '0.76rem', color: 'var(--tps-mut)' }}>
                  <IcoSchool size={14} /> <b>{profile.school}</b> · {profile.department}
                </span>
              </div>

              {/* Dải chip chuyên môn & lớp phụ trách thu gọn trên 1 hàng */}
              <div className="tps-chip-row" style={{ marginTop: '0.25rem' }}>
                <span className="tps-chip tps-chip-primary" title="Môn giảng dạy chính">
                  <SubjectIcon subjectName={profile.mainSubject} size={13} />
                  <b>{profile.mainSubject}</b>
                </span>
                {(profile.subSubjects || []).map((s) => (
                  <span key={s} className="tps-chip tps-chip-soft" title="Môn kiêm nhiệm">
                    {s}
                  </span>
                ))}
                {(profile.grades || []).map((g) => (
                  <span key={g} className="tps-chip tps-chip-grade">
                    {g}
                  </span>
                ))}
                {classes.slice(0, 5).map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    className="tps-chip tps-chip-class-btn"
                    onClick={() => onNavigate?.('classes', cls)}
                    title={`Mở chi tiết lớp ${cls.name}`}
                  >
                    <span>Lớp {cls.name}</span>
                  </button>
                ))}
                {classes.length === 0 && (
                  <button
                    type="button"
                    className="tps-chip tps-chip-class-btn"
                    onClick={() => onNavigate?.('classes')}
                  >
                    <span>+ Tạo lớp</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="tps-header-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="tps-btn tps-btn-sm tps-btn-primary"
              onClick={() => onNavigate?.('create', { subject: profile.mainSubject })}
            >
              <span>+ Soạn đề {profile.mainSubject}</span>
            </button>
            <button
              type="button"
              className="tps-btn tps-btn-sm tps-btn-outline"
              onClick={() => {
                setProfileDraft(profile);
                setEditingProfile((v) => !v);
              }}
            >
              <IcoEdit size={14} />
              <span>{editingProfile ? 'Đóng' : 'Sửa hồ sơ'}</span>
            </button>
          </div>
        </div>

        {/* Form chỉnh sửa trực tiếp */}
        {editingProfile && (
          <form className="tps-edit-drawer" onSubmit={handleSaveProfile}>
            <div className="tps-edit-head">
              <h4>Cập nhật Hồ sơ Chuyên môn Giáo viên</h4>
              <span>Lưu trực tiếp trên thiết bị và đồng bộ tên hiển thị</span>
            </div>

            <div className="tps-form-grid">
              <label className="tps-field">
                <span>Họ và tên giáo viên</span>
                <input
                  type="text"
                  value={profileDraft.displayName}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="VD: ThS. Nguyễn Minh Hoàng"
                  required
                />
              </label>

              <label className="tps-field">
                <span>Trường giảng dạy</span>
                <input
                  type="text"
                  value={profileDraft.school}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, school: e.target.value }))}
                  placeholder="VD: THPT Chuyên Lê Hồng Phong"
                />
              </label>

              <label className="tps-field">
                <span>Tổ bộ môn</span>
                <input
                  type="text"
                  list="tps-dept-suggestions"
                  value={profileDraft.department}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, department: e.target.value }))}
                  placeholder="VD: Tổ Hóa - Sinh"
                />
                <datalist id="tps-dept-suggestions">
                  {DEPARTMENT_SUGGESTIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </label>

              <label className="tps-field">
                <span>Môn dạy chính</span>
                <select
                  value={profileDraft.mainSubject}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, mainSubject: e.target.value }))}
                >
                  {allSubjectLabels.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tps-field tps-field-span2">
                <span>Ảnh đại diện (URL hoặc tải ảnh từ máy)</span>
                <div className="tps-avatar-input-row">
                  <input
                    type="url"
                    value={profileDraft.avatarUrl}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, avatarUrl: e.target.value }))}
                    placeholder="https://... hoặc bấm Tải ảnh lên"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    className="tps-btn tps-btn-outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IcoCamera size={15} />
                    <span>Tải ảnh lên</span>
                  </button>
                  {profileDraft.avatarUrl && (
                    <button
                      type="button"
                      className="tps-btn tps-btn-ghost"
                      onClick={() => setProfileDraft((p) => ({ ...p, avatarUrl: '' }))}
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </label>

              <div className="tps-field tps-field-span2">
                <span>Môn dạy phụ / Liên môn (chọn nhiều)</span>
                <div className="tps-Selectable-pills">
                  {allSubjectLabels
                    .filter((s) => s !== profileDraft.mainSubject)
                    .map((s) => {
                      const active = profileDraft.subSubjects?.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`tps-pill-toggle ${active ? 'is-on' : ''}`}
                          onClick={() => toggleSubSubject(s)}
                        >
                          {s}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="tps-field tps-field-span2">
                <span>Khối lớp phụ trách</span>
                <div className="tps-Selectable-pills">
                  {GRADE_OPTIONS.map((g) => {
                    const active = profileDraft.grades?.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        className={`tps-pill-toggle ${active ? 'is-on' : ''}`}
                        onClick={() => toggleGrade(g)}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="tps-field tps-field-span2">
                <span>Giới thiệu ngắn / Châm ngôn giảng dạy</span>
                <input
                  type="text"
                  value={profileDraft.bio || ''}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={220}
                />
              </label>
            </div>

            <div className="tps-edit-foot">
              <button type="submit" className="tps-btn tps-btn-primary" disabled={savingProfile}>
                <IcoCheck size={15} />
                <span>{savingProfile ? 'Đang lưu…' : 'Lưu hồ sơ giáo viên'}</span>
              </button>
              <button
                type="button"
                className="tps-btn tps-btn-ghost"
                onClick={() => setEditingProfile(false)}
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* THANH CHUYỂN TAB GỌN GÀNG CHO HỒ SƠ GIÁO VIÊN */}
      <div className="tps-subtabs" role="tablist" aria-label="Phân khu hồ sơ giáo viên">
        <button
          type="button"
          role="tab"
          aria-selected={activeProfileTab === 'overview'}
          className={`tps-subtab${activeProfileTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveProfileTab('overview')}
        >
          <IcoBook size={15} />
          <span>Chuyên môn &amp; Gợi ý AI</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeProfileTab === 'exam-prefs'}
          className={`tps-subtab${activeProfileTab === 'exam-prefs' ? ' active' : ''}`}
          onClick={() => setActiveProfileTab('exam-prefs')}
        >
          <IcoSettings size={15} />
          <span>Mẫu Đề A4 &amp; Cài đặt</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeProfileTab === 'sharing'}
          className={`tps-subtab${activeProfileTab === 'sharing' ? ' active' : ''}`}
          onClick={() => setActiveProfileTab('sharing')}
        >
          <IcoShare size={15} />
          <span>Chia sẻ &amp; Tổ bộ môn ({sharedList.length})</span>
        </button>
      </div>

      {/* ============================================================
         TAB 1: BẢNG ĐIỀU KHIỂN THEO MÔN + GỢI Ý AI + HUY HIỆU GỌN
         ============================================================ */}
      {activeProfileTab === 'overview' && (
        <>
          {/* Dải huy hiệu thành tựu thu gọn (Compact Strip) */}
          <div className="tps-achievements-strip" aria-label="Dấu ấn & Thành tựu giảng dạy">
            {achievements.map((ach) => {
              const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));
              return (
                <div
                  key={ach.id}
                  className={`tps-ach-pill ${ach.unlocked ? 'is-unlocked' : ''}`}
                  title={ach.desc}
                >
                  <div className="tps-ach-medal">
                    {ach.id === 'anti-cheat-master' ? (
                      <IcoShield size={16} />
                    ) : ach.id === 'class-streak-3' ? (
                      <IcoTrendUp size={16} />
                    ) : (
                      <IcoAward size={16} />
                    )}
                  </div>
                  <div className="tps-ach-pill-body">
                    <div className="tps-ach-pill-row">
                      <strong>{ach.title}</strong>
                      <span>{ach.badgeLabel}</span>
                    </div>
                    <div className="tps-ach-progress-track">
                      <div className="tps-ach-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lưới 2 cột: Bên trái = Thẻ Môn Dạy | Bên phải = Gợi ý hôm nay từ AI */}
          <div className="tps-overview-two-col">
            <div className="tps-section-block">
              <div className="tps-section-head">
                <h3 className="tps-section-title">
                  <IcoBook size={17} />
                  <span>Bảng điều khiển theo môn ({subjectStats.length})</span>
                </h3>
              </div>

              <div className="tps-subject-grid">
                {subjectStats.map((item) => (
                  <article key={item.subject} className="tps-bento-card tps-subject-card">
                    <div className="tps-subject-card-top">
                      <div className="tps-subject-icon-wrap">
                        <SubjectIcon subjectName={item.subject} size={18} />
                      </div>
                      <div className="tps-subject-title-wrap">
                        <h4>{item.subject}</h4>
                        <span className={`tps-role-tag ${item.isMain ? 'main' : 'sub'}`}>
                          {item.isMain ? 'Môn dạy chính' : 'Môn kiêm nhiệm'}
                        </span>
                      </div>
                      <div className={`tps-trend-pill trend-${item.trendDirection}`}>
                        {item.trendDirection === 'up' && <IcoTrendUp size={13} />}
                        {item.trendDirection === 'down' && <IcoTrendDown size={13} />}
                        {item.trendDirection === 'flat' && <IcoTrendFlat size={13} />}
                        <span>
                          {item.trendDirection === 'up'
                            ? `+${item.trendDelta}`
                            : item.trendDirection === 'down'
                              ? `${item.trendDelta}`
                              : 'Ổn định'}
                        </span>
                      </div>
                    </div>

                    <div className="tps-subject-metrics">
                      <div className="tps-metric-cell">
                        <small>Đề thi</small>
                        <strong>{item.examsCount}</strong>
                      </div>
                      <div className="tps-metric-cell">
                        <small>Câu hỏi</small>
                        <strong>{item.questionsCount}</strong>
                      </div>
                      <div className="tps-metric-cell">
                        <small>Điểm TB</small>
                        <strong className="tps-score-highlight">
                          {item.avgScore10 !== null ? item.avgScore10.toFixed(1) : '—'}
                        </strong>
                      </div>
                      <div className="tps-metric-cell">
                        <small>Tỉ lệ nộp</small>
                        <strong>{item.submitRate}%</strong>
                      </div>
                    </div>

                    <div className="tps-subject-trend-box">
                      <div className="tps-trend-header">
                        <span>Xu hướng 4 đề gần nhất</span>
                        <small>{item.totalSubmissions} bài nộp</small>
                      </div>
                      <MiniSubjectTrendSvg points={item.last4} />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="tps-section-block">
              <div className="tps-section-head">
                <h3 className="tps-section-title">
                  <IcoSparkles size={17} />
                  <span>Gợi ý chuyên môn hôm nay từ AI</span>
                </h3>
              </div>

              <div className="tps-ai-compact-stack">
                <div className="tps-bento-card tps-ai-row tone-amber">
                  <div className="tps-ai-row-info">
                    <span className="tps-ai-tag">Lớp cần củng cố</span>
                    <h4>{aiDailySuggestions.reviewClass.title}</h4>
                    <p>{aiDailySuggestions.reviewClass.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="tps-btn tps-btn-sm tps-btn-primary"
                    onClick={aiDailySuggestions.reviewClass.onAction}
                  >
                    <span>{aiDailySuggestions.reviewClass.actionLabel}</span>
                    <IcoArrowRight size={13} />
                  </button>
                </div>

                <div className="tps-bento-card tps-ai-row tone-blue">
                  <div className="tps-ai-row-info">
                    <span className="tps-ai-tag">Đảo mã đề mới</span>
                    <h4>{aiDailySuggestions.shuffleExam.title}</h4>
                    <p>{aiDailySuggestions.shuffleExam.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="tps-btn tps-btn-sm tps-btn-outline"
                    onClick={aiDailySuggestions.shuffleExam.onAction}
                  >
                    <span>{aiDailySuggestions.shuffleExam.actionLabel}</span>
                    <IcoArrowRight size={13} />
                  </button>
                </div>

                <div className="tps-bento-card tps-ai-row tone-emerald">
                  <div className="tps-ai-row-info">
                    <span className="tps-ai-tag">Học sinh cần kèm</span>
                    <h4>{aiDailySuggestions.supportStudents.title}</h4>
                    <p>{aiDailySuggestions.supportStudents.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="tps-btn tps-btn-sm tps-btn-outline"
                    onClick={aiDailySuggestions.supportStudents.onAction}
                  >
                    <span>{aiDailySuggestions.supportStudents.actionLabel}</span>
                    <IcoArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================
         TAB 2: CÀI ĐẶT CÁ NHÂN CHO ĐỀ THI & MẪU ĐẦU TRANG A4
         ============================================================ */}
      {activeProfileTab === 'exam-prefs' && (
        <div className="tps-section-block">
        <div className="tps-section-head">
          <div>
            <h3 className="tps-section-title">
              <IcoSettings size={19} />
              <span>Cài đặt cá nhân cho Đề thi & Mẫu đầu trang A4</span>
            </h3>
            <p className="tps-section-sub">
              Thiết lập mặc định khi tạo đề mới, tiêu ngữ trường/tổ bộ môn và chữ ký cuối trang in A4
            </p>
          </div>
          <button
            type="button"
            className="tps-btn tps-btn-ghost"
            onClick={handleResetExamPrefs}
          >
            <IcoUndo size={15} />
            <span>Khôi phục mặc định</span>
          </button>
        </div>

        <div className="tps-bento-card tps-exam-settings-layout">
          <form className="tps-exam-settings-form" onSubmit={handleSaveExamPrefs}>
            <div className="tps-form-grid">
              <label className="tps-field">
                <span>Môn mặc định khi tạo đề</span>
                <select
                  value={examPrefs.defaultSubject}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, defaultSubject: e.target.value }))}
                >
                  {allSubjectLabels.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tps-field">
                <span>Thang điểm chấm mặc định</span>
                <select
                  value={examPrefs.gradingScale}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, gradingScale: e.target.value }))}
                >
                  <option value="10">Thang điểm 10 (Chuẩn Bộ GD&ĐT)</option>
                  <option value="100">Thang điểm 100 (Đánh giá năng lực)</option>
                </select>
              </label>

              <label className="tps-field">
                <span>Cơ quan chủ quản (Dòng 1 trái)</span>
                <input
                  type="text"
                  value={examPrefs.headerDeptName}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, headerDeptName: e.target.value }))}
                  placeholder="SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                />
              </label>

              <label className="tps-field">
                <span>Tên Trường (Dòng 2 trái - In đậm)</span>
                <input
                  type="text"
                  value={examPrefs.headerSchoolName}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, headerSchoolName: e.target.value }))}
                  placeholder="TRƯỜNG THPT..."
                />
              </label>

              <label className="tps-field">
                <span>Tổ chuyên môn (Dòng 3 trái)</span>
                <input
                  type="text"
                  value={examPrefs.headerSubjectGroup}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, headerSubjectGroup: e.target.value }))}
                  placeholder="TỔ HÓA - SINH"
                />
              </label>

              <label className="tps-field">
                <span>Tiêu ngữ kỳ kiểm tra (Bên phải)</span>
                <input
                  type="text"
                  value={examPrefs.headerExamMotto}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, headerExamMotto: e.target.value }))}
                  placeholder="ĐỀ KIỂM TRA GIỮA KỲ I..."
                />
              </label>

              <label className="tps-field tps-field-span2">
                <span>Lời chúc / Ghi chú chân trang đề in A4</span>
                <input
                  type="text"
                  value={examPrefs.footerSignature}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, footerSignature: e.target.value }))}
                />
              </label>

              <label className="tps-field tps-field-span2">
                <span>Chữ ký giáo viên ra đề (cuối đề)</span>
                <input
                  type="text"
                  value={examPrefs.footerTeacherSign}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, footerTeacherSign: e.target.value }))}
                  placeholder={`GV ra đề: ${profile.displayName}`}
                />
              </label>
            </div>

            <div className="tps-notify-toggles">
              <span className="tps-spec-label">Thông báo tự động qua Email & Hệ thống</span>
              <label className="tps-check-row">
                <input
                  type="checkbox"
                  checked={Boolean(examPrefs.notifyOnSubmit)}
                  onChange={(e) => setExamPrefs((p) => ({ ...p, notifyOnSubmit: e.target.checked }))}
                />
                <span>Nhận thông báo khi học sinh hoàn thành bài nộp</span>
              </label>
              <label className="tps-check-row">
                <input
                  type="checkbox"
                  checked={Boolean(examPrefs.notifyOnRetryRequest)}
                  onChange={(e) =>
                    setExamPrefs((p) => ({ ...p, notifyOnRetryRequest: e.target.checked }))
                  }
                />
                <span>Nhận thông báo khi học sinh gửi đơn xin thi lại</span>
              </label>
              <label className="tps-check-row">
                <input
                  type="checkbox"
                  checked={Boolean(examPrefs.notifyWeeklyReport)}
                  onChange={(e) =>
                    setExamPrefs((p) => ({ ...p, notifyWeeklyReport: e.target.checked }))
                  }
                />
                <span>Nhận báo cáo phân tích phổ điểm tổng kết tuần</span>
              </label>
            </div>

            <div className="tps-edit-foot">
              <button type="submit" className="tps-btn tps-btn-primary">
                <IcoCheck size={15} />
                <span>Lưu cài đặt đề thi</span>
              </button>
            </div>
          </form>

          {/* Khung xem trước đầu trang & chân trang đề thi A4 trực tiếp */}
          <div className="tps-a4-preview-box" aria-label="Xem trước mẫu đầu trang đề thi A4">
            <div className="tps-a4-preview-label">Bản xem trước mẫu in giấy A4</div>
            <div className="tps-a4-sheet">
              <div className="tps-a4-header-grid">
                <div className="tps-a4-left">
                  <div>{examPrefs.headerDeptName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</div>
                  <strong>{examPrefs.headerSchoolName || 'TRƯỜNG THPT CHUYÊN'}</strong>
                  <div className="tps-a4-sub">{examPrefs.headerSubjectGroup || 'TỔ BỘ MÔN'}</div>
                  <div className="tps-a4-line" />
                  <small>Đề chính thức ( gồm 04 trang )</small>
                </div>
                <div className="tps-a4-right">
                  <strong>{examPrefs.headerExamMotto || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}</strong>
                  <div>
                    <strong>Môn: {examPrefs.defaultSubject || profile.mainSubject}</strong>
                  </div>
                  <div>Thời gian làm bài: 45 phút</div>
                  <span className="tps-a4-code-box">Mã đề: 101</span>
                </div>
              </div>

              <div className="tps-a4-student-bar">
                <span>Họ và tên thí sinh: ....................................................</span>
                <span>Lớp: ............. SBD: .............</span>
              </div>

              <div className="tps-a4-sample-body">
                <p>
                  <b>Câu 1:</b> Nội dung câu hỏi trắc nghiệm khách quan môn{' '}
                  {examPrefs.defaultSubject} (Chấm theo thang điểm {examPrefs.gradingScale})…
                </p>
                <div className="tps-a4-options">
                  <span>A. Phương án A</span>
                  <span>B. Phương án B</span>
                  <span>C. Phương án C</span>
                  <span>D. Phương án D</span>
                </div>
              </div>

              <div className="tps-a4-footer">
                <div>— HẾT —</div>
                <em>{examPrefs.footerSignature}</em>
                <div className="tps-a4-sign">
                  {examPrefs.footerTeacherSign
                    ? `Giáo viên ra đề: ${examPrefs.footerTeacherSign}`
                    : `Giáo viên bộ môn: ${profile.displayName}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ============================================================
         TAB 3: CHIA SẺ TÀI NGUYÊN VỚI ĐỒNG NGHIỆP CÙNG TỔ & QUẢN LÝ GVBM
         ============================================================ */}
      {activeProfileTab === 'sharing' && (
        <>
          <div className="tps-section-block">
        <div className="tps-section-head">
          <div>
            <h3 className="tps-section-title">
              <IcoShare size={19} />
              <span>Chia sẻ tài nguyên chuyên môn cùng Tổ bộ môn</span>
            </h3>
            <p className="tps-section-sub">
              Chia sẻ nhanh đề kiểm tra hoặc bộ câu hỏi theo chuyên đề cho đồng nghiệp trong{' '}
              <b>{profile.department}</b> với phân quyền Chỉ xem hoặc Được sửa
            </p>
          </div>
        </div>

        <div className="tps-bento-card tps-sharing-card">
          <form className="tps-share-form" onSubmit={handleCreateShare}>
            <div className="tps-form-grid">
              <label className="tps-field">
                <span>Loại học liệu chia sẻ</span>
                <select value={shareType} onChange={(e) => setShareType(e.target.value)}>
                  <option value="exam">Đề thi / Đề kiểm tra</option>
                  <option value="question_set">Bộ câu hỏi theo chuyên đề</option>
                </select>
              </label>

              {shareType === 'exam' && exams.length > 0 ? (
                <label className="tps-field">
                  <span>Chọn đề thi từ kho của bạn</span>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} ({ex.subject || profile.mainSubject})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="tps-field">
                  <span>Tên chuyên đề / Bộ câu hỏi</span>
                  <input
                    type="text"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    placeholder={`VD: Chuyên đề vận dụng cao ${profile.mainSubject}`}
                  />
                </label>
              )}

              <label className="tps-field">
                <span>Email đồng nghiệp cùng tổ</span>
                <input
                  type="email"
                  value={colleagueEmail}
                  onChange={(e) => setColleagueEmail(e.target.value)}
                  placeholder="dongnghiep@truong.edu.vn"
                />
              </label>

              <label className="tps-field">
                <span>Tên giáo viên nhận (tuỳ chọn)</span>
                <input
                  type="text"
                  value={colleagueName}
                  onChange={(e) => setColleagueName(e.target.value)}
                  placeholder="VD: Cô Lan (Tổ Hóa - Sinh)"
                />
              </label>

              <label className="tps-field">
                <span>Quyền truy cập</span>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                >
                  <option value="view">Chỉ xem & Tải PDF (View)</option>
                  <option value="edit">Được sửa & Nhân bản đề (Edit)</option>
                </select>
              </label>

              <div className="tps-field tps-field-end">
                <button type="submit" className="tps-btn tps-btn-primary">
                  <IcoShare size={15} />
                  <span>Chia sẻ ngay</span>
                </button>
              </div>
            </div>
          </form>

          {confirmRevokeShare && (
            <div className="st-confirm-banner" role="alertdialog">
              <div className="st-confirm-body">
                <strong>Xác nhận thu hồi chia sẻ "{confirmRevokeShare.resourceTitle}"?</strong>
                <p>
                  Đồng nghiệp ({confirmRevokeShare.colleagueName || confirmRevokeShare.colleagueEmail}) sẽ không
                  còn truy cập được mã chia sẻ {confirmRevokeShare.shareCode}.
                </p>
              </div>
              <div className="st-confirm-actions">
                <button
                  type="button"
                  className="st-btn st-btn-danger"
                  onClick={() => handleRevokeShare(confirmRevokeShare)}
                >
                  Xác nhận thu hồi
                </button>
                <button
                  type="button"
                  className="st-btn ghost"
                  onClick={() => setConfirmRevokeShare(null)}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="tps-shared-list">
            {sharedList.length === 0 ? (
              <p className="tps-muted-text">
                Chưa có học liệu nào đang chia sẻ. Chọn đề hoặc chuyên đề ở trên để chia sẻ với tổ bộ môn.
              </p>
            ) : (
              sharedList.map((item) => (
                <div key={item.id} className="tps-shared-row">
                  <div className="tps-shared-info">
                    <span className="tps-shared-type-badge">
                      {item.resourceType === 'exam' ? 'Đề thi' : 'Chuyên đề'}
                    </span>
                    <strong>{item.resourceTitle}</strong>
                    <small>
                      Môn {item.subject} · Người nhận: <b>{item.colleagueName}</b>
                      {item.colleagueEmail ? ` (${item.colleagueEmail})` : ''} · Mã:{' '}
                      <code>{item.shareCode}</code>
                    </small>
                  </div>

                  <div className="tps-shared-actions">
                    <button
                      type="button"
                      className={`tps-perm-pill perm-${item.permission}`}
                      onClick={() => handleToggleSharePermission(item.id)}
                      title="Bấm để chuyển đổi quyền Chỉ xem / Được sửa"
                    >
                      {item.permission === 'edit' ? 'Quyền: Được sửa' : 'Quyền: Chỉ xem'}
                    </button>

                    <button
                      type="button"
                      className="tps-btn tps-btn-sm tps-btn-outline"
                      onClick={() => copyShareLink(item)}
                    >
                      {copiedShareId === item.id ? <IcoCheck size={14} /> : <IcoCopy size={14} />}
                      <span>{copiedShareId === item.id ? 'Đã copy link' : 'Copy link'}</span>
                    </button>

                    <button
                      type="button"
                      className="tps-btn tps-btn-sm tps-btn-ghost"
                      onClick={() => setConfirmRevokeShare(item)}
                    >
                      Thu hồi
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Khung tích hợp Quản lý Giáo viên bộ môn theo lớp (nếu giáo viên có lớp phụ trách) */}
      {classes.length > 0 && activeClassObj && (
        <div className="tps-section-block">
          <div className="tps-section-head">
            <div>
              <h3 className="tps-section-title">
                <IcoUsers size={19} />
                <span>Phối hợp Giáo viên bộ môn theo lớp</span>
              </h3>
              <p className="tps-section-sub">
                Cấp key liên kết môn học và theo dõi hoạt động giao đề của các giáo viên bộ môn trong lớp
              </p>
            </div>
            <div className="tps-class-selector">
              <label>
                <span>Chọn lớp:</span>
                <select
                  value={activeClassObj.id}
                  onChange={(e) => setSelectedClassForGVBM(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <SubjectTeacherPanel
            classId={activeClassObj.id}
            className={activeClassObj.name}
            exams={exams}
            submissionsMap={submissionsMap}
            teacherId={user?.uid}
            classInfo={activeClassObj}
          />
        </div>
      )}
        </>
      )}
    </section>
  );
}
