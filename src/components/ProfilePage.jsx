import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { translateAuthError } from '../lib/firebase.js';
import VerifiedBadge from './VerifiedBadge.jsx';
import Glyph, { pwStrength, STRENGTH_LABELS } from './AuthKit.jsx';
import ProfileStats from './ProfileStats.jsx';
import ProfileAchievements from './ProfileAchievements.jsx';
import TeacherProPanel from './TeacherProPanel.jsx';
import PaymentPanel from './PaymentPanel.jsx';
import CreditTopUp from './CreditTopUp.jsx';
import { getCredits, grantActivationCredits } from '../lib/creditService.js';
import { useTeacherPro } from '../hooks/useTeacherPro.js';
import { getStreakData, liveStreak, dayKey } from '../hooks.js';
import { getClassesByStudent } from '../lib/classroom.js';
import { listenFriends } from '../lib/social.js';
import { IcoCamera, IcoSpinner } from './ProfileIcons.jsx';
import {
  VIRTUAL_EXAMS,
  POINTS_PER_CODE_ENTRY,
  getFavoriteExamIds,
  toggleFavoriteExamId,
  getVirtualExamHistory,
  getSubscriptionAndQuota,
  redeemActivationCode,
  getUserReports,
  addUserReport,
} from '../data/virtualExamsBank.js';
import { readStore } from '../lib/roadmapStore.js';
import './ProfileFB.css';
import '../styles/profile-modern-mobile.css';

const AVATAR_COLORS = ['#ff4d1a', '#a7c4f2', '#b7dc9a', '#ffc46b', '#f2b6c6', '#c1b4f0', '#8fd6c4', '#ff9b85'];
const hashStr = (s = '') => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const autoColor = (name) => AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
const rankFor = (tier) => (tier?.key === 'vip' ? 'Nhà Hóa học cấp cao' : 'Nhà Hóa học tập sự');
const ls = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

const PW_RULES = [
  ['Từ 6 ký tự', (p) => p.length >= 6],
  ['Có chữ hoa và chữ thường', (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ['Có chữ số', (p) => /\d/.test(p)],
  ['Có ký tự đặc biệt', (p) => /[^A-Za-z0-9]/.test(p)],
];

/* Đọc ?tab=... từ URL hash (#profile?tab=upgrade) và ánh xạ sang 5 tab chính */
function readTabFromHash() {
  if (typeof window === 'undefined') return 'overview';
  const h = window.location.hash || '';
  const qIdx = h.indexOf('?');
  if (qIdx < 0) return 'overview';
  const params = new URLSearchParams(h.slice(qIdx + 1));
  const raw = params.get('tab');
  if (!raw) return 'overview';
  if (['upgrade', 'guide', 'overview'].includes(raw)) return 'overview';
  if (['achievements', 'stats'].includes(raw)) return 'achievements';
  if (['classroom', 'classes', 'friends', 'teacher'].includes(raw)) return 'classroom';
  if (['history', 'favorites'].includes(raw)) return 'history';
  if (['settings', 'info', 'security', 'referral', 'reports', 'feedback'].includes(raw)) return 'settings';
  return 'overview';
}

function Field({ id, label, hint, locked, right, children }) {
  return (
    <div className="pf-field">
      <label htmlFor={id}>{label}</label>
      <div className={'pf-input' + (locked ? ' locked' : '')}>
        {children}
        {right}
      </div>
      {hint && <span className="pf-hint">{hint}</span>}
    </div>
  );
}

function PwInput({ id, label, value, onChange, show, onToggle, hint, ...rest }) {
  return (
    <Field
      id={id} label={label} hint={hint}
      right={
        <button type="button" className="pf-eye" onClick={onToggle} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          <Glyph name={show ? 'eyeOff' : 'eye'} size={17} />
        </button>
      }
    >
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" {...rest} />
    </Field>
  );
}

/* Bộ icon SVG thuần cho Trang Hồ sơ — 100% không dùng emoji */
const PfSvg = {
  crown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6l4 5 6-7 6 7 4-5-2 13H4L2 6z" />
      <path d="M4 22h16" />
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  bookmark: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  flag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  help: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  gift: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  gradCap: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  doc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  heartFilled: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  sparkleAi: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2f6bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  copy: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  eye: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeOff: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  share: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  flame: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c1.5 3.5 4 5.5 4 9a4 4 0 0 1-8 0c0-1.5.5-3 1.2-4.2C8 8.5 6 11 6 14a6 6 0 0 0 12 0c0-5-3.5-8.5-6-12z" />
    </svg>
  ),
  bolt: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  trophy: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
    </svg>
  ),
  exam: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  target: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  chevronDown: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/* Linh vật ELEC Tutor minh họa */
function ElecSubMascot() {
  return (
    <svg className="ns9-sub-mascot" viewBox="0 0 140 150" fill="none" aria-hidden="true">
      <circle cx="72" cy="78" r="52" fill="rgba(47, 107, 255, 0.1)" />
      <path d="M24 38l4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8z" fill="#fbbf24" />
      <path d="M118 96l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" fill="#fbbf24" />
      <ellipse cx="72" cy="112" rx="30" ry="24" fill="#2f6bff" />
      <ellipse cx="72" cy="114" rx="18" ry="15" fill="#ffffff" />
      <circle cx="72" cy="114" r="9" fill="#2f6bff" />
      <text x="68" y="118" fill="#ffffff" fontSize="11" fontWeight="900">E</text>
      <circle cx="72" cy="68" r="32" fill="#3b82f6" />
      <ellipse cx="72" cy="72" rx="25" ry="21" fill="#ffffff" />
      <path d="M40 58c4-18 20-26 32-26s28 8 32 26H40z" fill="#1d4ed8" />
      <rect x="52" y="38" width="40" height="12" rx="6" fill="#ffffff" />
      <text x="58" y="47" fill="#1d4ed8" fontSize="8.5" fontWeight="900">ELEC</text>
      <circle cx="61" cy="71" r="5.5" fill="#0f172a" />
      <circle cx="83" cy="71" r="5.5" fill="#0f172a" />
      <circle cx="62.5" cy="69" r="2" fill="#ffffff" />
      <circle cx="84.5" cy="69" r="2" fill="#ffffff" />
      <ellipse cx="53" cy="77" rx="4" ry="2.2" fill="#fda4af" />
      <ellipse cx="91" cy="77" rx="4" ry="2.2" fill="#fda4af" />
      <path d="M66 78q6 6 12 0" stroke="#ef4444" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="96" r="9" fill="#60a5fa" />
      <path d="M36 85v-5a3 3 0 0 1 6 0v7" fill="#60a5fa" />
    </svg>
  );
}

export default function ProfilePage({ credits: propCredits }) {
  const {
    user, tier, logout,
    updateDisplayName, changePassword, sendVerifyEmail,
    refreshUser, refreshTier, uploadAvatar,
  } = useAuth();

  const pro = useTeacherPro();
  const uid = user?.uid;

  const [tab, setTab] = useState(() => readTabFromHash());
  const [secTab, setSecTab] = useState('password');
  const [name, setName] = useState(user?.displayName || '');
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [caps, setCaps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [pickedColor, setPickedColor] = useState(() => ls.get('cs-avatar-color', ''));
  const [showPayment, setShowPayment] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [credits, setCredits] = useState(() => (propCredits != null ? propCredits : null));

  /* Accordion mở rộng trong tab Cài đặt */
  const [openSettingsGroup, setOpenSettingsGroup] = useState('profile'); // 'profile' | 'security' | 'feedback'

  /* Lớp học và bạn bè */
  const [classes, setClasses] = useState([]);
  const [friends, setFriends] = useState([]);
  const [nudgedFriends, setNudgedFriends] = useState({});

  useEffect(() => {
    if (propCredits != null) setCredits(propCredits);
  }, [propCredits]);

  /* Dữ liệu Gói dùng, Đề yêu thích, Lịch sử, Báo lỗi & Góp ý */
  const [subQuota, setSubQuota] = useState(() => getSubscriptionAndQuota(uid));
  const [activationInput, setActivationInput] = useState('');
  const [favIds, setFavIds] = useState(() => getFavoriteExamIds(uid));
  const [examHistory, setExamHistory] = useState(() => getVirtualExamHistory(uid));
  const [reports, setReports] = useState(() => getUserReports(uid));
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTopic, setFeedbackTopic] = useState('Góp ý tính năng');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'exam' | 'roadmap' | 'fav'

  const toastTimer = useRef(null);
  const dlg = useRef(null);
  const fileInputRef = useRef(null);

  const email = user?.email || '';
  const display = user?.displayName || '';
  const initial = (display || email || '?').trim().charAt(0).toUpperCase();
  const color = pickedColor || autoColor(display || email);
  const isGoogle = user?.providerData?.some((p) => p.providerId === 'google.com');
  const isVip = tier?.key === 'vip' || subQuota.planName === 'VIP';
  const dirty = name.trim() !== display;

  const created = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  const createdAt = created ? created.toLocaleDateString('vi-VN') : '—';
  const lastLogin = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('vi-VN') : '—';
  const daysJoined = created ? Math.max(1, Math.ceil((Date.now() - created.getTime()) / 864e5)) : 0;
  const identCode = useMemo(() => 'ELECAI-' + hashStr(email || 'guest').toString(16).slice(0, 6).toUpperCase(), [email]);
  const pwScore = pwStrength(newPw);

  /* Email ẩn/hiện an toàn */
  const maskedEmail = useMemo(() => {
    if (!email) return '—';
    if (showEmail) return email;
    const parts = email.split('@');
    if (parts.length < 2) return '••••••';
    const pre = parts[0].slice(0, Math.min(2, parts[0].length));
    return `${pre}••••@${parts[1]}`;
  }, [email, showEmail]);

  /* Chuỗi streak hiện tại */
  const currentStreak = useMemo(() => {
    try {
      const data = getStreakData();
      return liveStreak(data);
    } catch {
      return 0;
    }
  }, []);

  /* Mini Streak Calendar 30 ngày trong tháng */
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Thứ 2 = 0
    const todayDate = now.getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, empty: true });
    }

    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === todayDate;
      const hasStreak = isToday
        ? currentStreak > 0
        : (todayDate - d < currentStreak && todayDate > d);
      days.push({ day: d, isToday, hasStreak, empty: false });
    }
    return days;
  }, [currentStreak]);

  const say = useCallback((type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 7000 : 4000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const ok = (t) => say('ok', t);
  const fail = (t) => say('error', t);
  const err = (e) => fail(e.code ? translateAuthError(e.code) : e.message);

  /* Đồng bộ tab khi URL hash thay đổi */
  useEffect(() => {
    const syncFromHash = () => {
      const nextTab = readTabFromHash();
      if (nextTab) setTab(nextTab);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    ls.set('cs-profile-tab', tab);
  }, [tab]);

  useEffect(() => {
    setSubQuota(getSubscriptionAndQuota(uid));
    setFavIds(getFavoriteExamIds(uid));
    setExamHistory(getVirtualExamHistory(uid));
    setReports(getUserReports(uid));
  }, [uid]);

  /* Tải lớp học và bạn bè */
  useEffect(() => {
    if (!uid) return;
    let unmounted = false;
    getClassesByStudent(uid)
      .then((cls) => {
        if (!unmounted) setClasses(cls || []);
      })
      .catch(() => {});
    return () => { unmounted = true; };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    try {
      const unsub = listenFriends(uid, (fList) => setFriends(fList || []));
      return () => unsub?.();
    } catch {}
  }, [uid]);

  useEffect(() => {
    if (!user?.uid) return;
    getCredits(user.uid).then((c) => setCredits(c.balance)).catch(() => {});
    const onCreditEvt = (e) => {
      if (e.detail?.balance != null) {
        setCredits(e.detail.balance);
      } else if (e.detail?.delta != null) {
        setCredits((prev) => (prev != null ? prev + e.detail.delta : e.detail.delta));
      }
    };
    window.addEventListener('cs-credit-update', onCreditEvt);
    return () => window.removeEventListener('cs-credit-update', onCreditEvt);
  }, [user?.uid]);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (askLogout && !d.open) d.showModal();
    if (!askLogout && d.open) d.close();
  }, [askLogout]);

  const pickColor = (c) => {
    setPickedColor(c);
    ls.set('cs-avatar-color', c);
    ok('Đã chọn màu ảnh đại diện!');
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(identCode);
      setCopied(true);
      ok('Đã sao chép mã giới thiệu!');
      setTimeout(() => setCopied(false), 1600);
    } catch {
      fail('Trình duyệt không cho phép sao chép.');
    }
  };

  /* Chia sẻ hồ sơ với Web Share API */
  const handleShareProfile = async () => {
    const url = window.location.origin + window.location.pathname + '#profile';
    const shareData = {
      title: `Hồ sơ học tập Hóa học — ${display || 'Học sinh ELEC AI'}`,
      text: `Khám phá chuỗi ngày học Hóa và bảng thành tích của ${display || 'mình'} trên ELEC AI!`,
      url,
    };
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        ok('Đã chia sẻ hồ sơ!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyId();
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        ok('Đã sao chép liên kết hồ sơ vào khay nhớ tạm!');
      } catch {
        ok('Liên kết: ' + url);
      }
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      ok('Đã cập nhật ảnh đại diện!');
      setAvatarMenuOpen(false);
    } catch (x) {
      err(x);
    } finally {
      setUploading(false);
    }
  };

  const saveName = async (e) => {
    e.preventDefault();
    const t = name.trim();
    if (t.length < 2) return fail('Tên phải từ 2 ký tự.');
    if (!dirty) return fail('Tên chưa thay đổi.');
    setLoading(true);
    try {
      await updateDisplayName(t);
      await refreshUser();
      ok('Đã cập nhật tên hiển thị.');
    } catch (x) {
      err(x);
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (isGoogle) return fail('Tài khoản Google không cần đổi mật khẩu.');
    if (newPw.length < 6) return fail('Mật khẩu mới phải từ 6 ký tự.');
    if (newPw !== confirmPw) return fail('Mật khẩu xác nhận không khớp.');
    if (newPw === oldPw) return fail('Mật khẩu mới phải khác mật khẩu cũ.');
    setLoading(true);
    try {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      setConfirmPw('');
      ok('Đã đổi mật khẩu thành công!');
    } catch (x) {
      if (x.code === 'auth/wrong-password' || x.code === 'auth/invalid-credential') fail('Mật khẩu hiện tại không đúng.');
      else err(x);
    } finally {
      setLoading(false);
    }
  };

  const run = (fn, good) => async () => {
    setLoading(true);
    try { const r = await fn(); good(r); } catch (x) { err(x); } finally { setLoading(false); }
  };
  const sendVerify = run(sendVerifyEmail, () => ok('Đã gửi email xác thực. Kiểm tra hộp thư (cả mục Spam).'));
  const checkVerify = run(refreshUser, (u) => (u?.emailVerified ? ok('Email đã được xác thực.') : fail('Email vẫn chưa xác thực.')));

  const handlePaymentSuccess = useCallback(async () => {
    await refreshTier();
    await refreshUser();
    return { isVip: true };
  }, [refreshTier, refreshUser]);

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    const raw = activationInput;
    const res = redeemActivationCode(uid, raw);
    if (!res.ok) {
      fail(res.message);
      return;
    }
    setSubQuota(res.data);
    setActivationInput('');

    const nextPoints = (credits ?? 0) + POINTS_PER_CODE_ENTRY;
    setCredits(nextPoints);
    try {
      window.dispatchEvent(new CustomEvent('cs-credit-update', {
        detail: { balance: nextPoints, delta: POINTS_PER_CODE_ENTRY },
      }));
    } catch { /* */ }

    if (uid) {
      try {
        const creditRes = await grantActivationCredits(uid, POINTS_PER_CODE_ENTRY, raw);
        if (creditRes?.balance != null) {
          setCredits(creditRes.balance);
        }
      } catch (err) {
        console.warn('grantActivationCredits err:', err);
      }
    }
    ok(res.message);
  };

  const handleSubmitReportOrFeedback = (e, kind) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      fail('Vui lòng nhập nội dung chi tiết.');
      return;
    }
    const next = addUserReport(uid, {
      kind,
      category: feedbackTopic,
      content: feedbackText.trim(),
    });
    setReports(next);
    setFeedbackText('');
    ok(kind === 'report' ? 'Đã gửi báo lỗi! Đội ngũ chuyên môn sẽ kiểm tra sớm nhất.' : 'Cảm ơn góp ý quý báu của bạn!');
  };

  const handleNudge = (friend) => {
    const friendId = friend.uid || friend.id;
    if (nudgedFriends[friendId]) {
      say('ok', `Bạn đã gửi lời nhắc ${friend.displayName || 'bạn'} hôm nay rồi!`);
      return;
    }
    setNudgedFriends((prev) => ({ ...prev, [friendId]: true }));
    say('ok', `Đã gửi lời nhắc giữ chuỗi tới ${friend.displayName || 'bạn'}!`);
  };

  const selectTab = (id) => {
    setTab(id);
    setToast(null);
    window.history.replaceState(null, '', `#profile?tab=${id}`);
  };

  const favExamsList = useMemo(
    () => VIRTUAL_EXAMS.filter((ex) => favIds.includes(ex.id)),
    [favIds]
  );

  const roadmapSessions = useMemo(() => {
    const st = readStore(uid);
    return (st?.sessions || []).slice(0, 15);
  }, [uid, tab]);

  /* Tính điểm trung bình */
  const avgScore = useMemo(() => {
    if (!examHistory || examHistory.length === 0) return '8.5';
    const sum = examHistory.reduce((acc, h) => acc + (parseFloat(h.score10) || 0), 0);
    return (sum / examHistory.length).toFixed(1);
  }, [examHistory]);

  const effectivePlanName = isVip ? 'VIP' : subQuota.planName || 'Free';
  const planDesc = effectivePlanName === 'VIP'
    ? 'Đặc quyền Bộ đề VIP + Gia sư AI không giới hạn'
    : effectivePlanName === 'PRO'
    ? 'Mở khóa toàn bộ Bộ đề PRO & Giải thích AI chi tiết'
    : (subQuota.planDesc || 'Nội dung miễn phí');
  const durationLabel = effectivePlanName === 'VIP'
    ? 'Trọn mùa thi 2027'
    : effectivePlanName === 'PRO'
    ? '12 tháng (2026–2027)'
    : (subQuota.durationLabel || 'Trọn đời');
  const examAccessLabel = effectivePlanName === 'VIP'
    ? 'Mở khóa 100% đề VIP, PRO, FREE mọi kỳ thi'
    : effectivePlanName === 'PRO'
    ? 'Toàn bộ đề FREE + PRO của 6 kỳ thi'
    : (subQuota.examAccessLabel || 'Đề cơ bản của mọi kỳ thi');
  const heartsCount = effectivePlanName === 'VIP' ? 99 : effectivePlanName === 'PRO' ? 10 : (subQuota.hearts || 5);
  const maxHeartsCount = effectivePlanName === 'VIP' ? 99 : effectivePlanName === 'PRO' ? 10 : (subQuota.maxHearts || 5);

  const MAIN_TABS = [
    { id: 'overview', label: 'Tổng quan', icon: PfSvg.crown },
    { id: 'achievements', label: 'Thành tích', icon: PfSvg.star },
    { id: 'classroom', label: 'Lớp & Bạn', icon: PfSvg.users },
    { id: 'history', label: 'Hoạt động', icon: PfSvg.history },
    { id: 'settings', label: 'Cài đặt', icon: PfSvg.settings },
  ];

  return (
    <section className="pf pf-modern-container">
      {/* Toast thông báo */}
      <div className={'pf-toast' + (toast ? ' show ' + toast.type : '')} role="status" aria-live="polite">
        {toast && (
          <>
            <Glyph name={toast.type === 'ok' ? 'check' : 'alert'} size={15} />
            <span>{toast.text}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Đóng">×</button>
          </>
        )}
      </div>

      {/* ============================================================
         1. ĐẦU TRANG (HEADER CARD)
         ============================================================ */}
      <div className="pf-m-header-card">
        <div className="pf-m-header-top">
          <div className="pf-m-avatar-wrap">
            <div className="pf-m-avatar" style={{ '--av': color }}>
              {user?.photoURL ? <img src={user.photoURL} alt={display} /> : <span>{initial}</span>}
              {uploading && (
                <div className="pf-avatar-loading">
                  <IcoSpinner size={24} className="pf-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              className="pf-m-avatar-edit-btn"
              onClick={() => setAvatarMenuOpen(true)}
              aria-label="Đổi ảnh đại diện hoặc màu sắc"
              title="Đổi ảnh đại diện"
            >
              <IcoCamera size={14} />
            </button>
          </div>

          <div className="pf-m-user-info">
            <div className="pf-m-name-row">
              <span className="pf-m-name">{display || 'Học sinh ELEC AI'}</span>
              {(isVip || pro.isPro) && <VerifiedBadge isVip size={18} />}
              <span className={`pf-m-badge-pill ${isVip ? 'vip' : 'free'}`}>
                {pro.isPro ? 'GIÁO VIÊN PRO' : effectivePlanName}
              </span>
            </div>

            <div className="pf-m-school">
              <span>{pro.isPro ? 'Giáo viên — Quản lý lớp học' : rankFor(tier)}</span>
              <span>•</span>
              <span>Tham gia {daysJoined} ngày</span>
            </div>

            <div className="pf-m-email-row">
              <span>{maskedEmail}</span>
              <button
                type="button"
                className="pf-m-eye-btn"
                onClick={() => setShowEmail((s) => !s)}
                aria-label={showEmail ? 'Ẩn email' : 'Hiện email'}
                title={showEmail ? 'Ẩn email' : 'Hiện email'}
              >
                {showEmail ? PfSvg.eyeOff : PfSvg.eye}
              </button>
            </div>
          </div>
        </div>

        <div className="pf-m-header-actions">
          <button
            type="button"
            className="pf-m-btn primary"
            onClick={() => selectTab('settings')}
          >
            {PfSvg.edit}
            <span>Chỉnh sửa hồ sơ</span>
          </button>

          <button
            type="button"
            className="pf-m-btn"
            onClick={handleShareProfile}
          >
            {PfSvg.share}
            <span>Chia sẻ hồ sơ</span>
          </button>
        </div>
      </div>

      {/* ============================================================
         2. HÀNG SỐ LIỆU NHANH (5 QUICK STATS TILES) — 100% SVG NÉT MẢNH
         ============================================================ */}
      <div className="pf-m-quick-stats" role="region" aria-label="Số liệu học tập nhanh">
        <a href="#leaderboard" className="pf-m-stat-tile" title="Chuỗi học tập liên tiếp — Bấm xem Bảng xếp hạng">
          <span className="pf-m-stat-val fire">
            <span className="pf-m-stat-ico" aria-hidden="true">{PfSvg.flame}</span>
            <span>{currentStreak}</span>
          </span>
          <span className="pf-m-stat-lbl">Chuỗi ngày</span>
        </a>

        <button type="button" className="pf-m-stat-tile" onClick={() => setShowPayment(true)} title="Điểm và Credit AI khả dụng — Bấm nạp điểm">
          <span className="pf-m-stat-val bolt">
            <span className="pf-m-stat-ico" aria-hidden="true">{PfSvg.bolt}</span>
            <span>{credits != null ? credits.toLocaleString('vi-VN') : 0}</span>
          </span>
          <span className="pf-m-stat-lbl">Điểm AI</span>
        </button>

        <a href="#my-classes" className="pf-m-stat-tile" title="Hạng trong lớp học — Bấm vào Lớp học">
          <span className="pf-m-stat-val trophy">
            <span className="pf-m-stat-ico" aria-hidden="true">{PfSvg.trophy}</span>
            <span>#1</span>
          </span>
          <span className="pf-m-stat-lbl">Hạng lớp</span>
        </a>

        <button type="button" className="pf-m-stat-tile" onClick={() => selectTab('history')} title="Số đề đã hoàn thành — Bấm xem Lịch sử">
          <span className="pf-m-stat-val exam">
            <span className="pf-m-stat-ico" aria-hidden="true">{PfSvg.exam}</span>
            <span>{(examHistory?.length || 0) + (roadmapSessions?.length || 0)}</span>
          </span>
          <span className="pf-m-stat-lbl">Bài đã làm</span>
        </button>

        <button type="button" className="pf-m-stat-tile" onClick={() => selectTab('history')} title="Điểm trung bình các bài thi">
          <span className="pf-m-stat-val target">
            <span className="pf-m-stat-ico" aria-hidden="true">{PfSvg.target}</span>
            <span>{avgScore}</span>
          </span>
          <span className="pf-m-stat-lbl">Điểm TB</span>
        </button>
      </div>

      {/* ============================================================
         3. THANH TAB DÍNH KHI CUỘN (5 STICKY TABS)
         ============================================================ */}
      <div className="pf-m-tabs-wrap">
        <nav className="pf-m-tabs" role="tablist" aria-label="Danh mục hồ sơ">
          {MAIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`pf-m-tab-btn ${tab === t.id ? 'on' : ''}`}
              onClick={() => selectTab(t.id)}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ============================================================
         4. TAB 1: TỔNG QUAN (OVERVIEW)
         ============================================================ */}
      {tab === 'overview' && (
        <div className="ns9-sub-bento-grid">
          {/* Thẻ 1: Gói đang sử dụng */}
          <article className="ns9-sub-card ns9-sub-current">
            <div className="ns9-sub-current-left">
              <h2 className="ns9-sub-card-title">Gói đang sử dụng</h2>

              <div className="ns9-sub-plan-hero">
                <span className="ns9-sub-sprout-ico" aria-hidden="true">
                  {effectivePlanName === 'Free' ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 20h10" />
                      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
                      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
                      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
                    </svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6l4 5 6-7 6 7 4-5-2 13H4L2 6z" />
                      <path d="M4 22h16" />
                    </svg>
                  )}
                </span>

                <div className="ns9-sub-plan-meta">
                  <div className="ns9-sub-plan-name-row">
                    <strong>{effectivePlanName}</strong>
                    <span className="ns9-sub-active-pill">• Đang sử dụng</span>
                  </div>
                  <small>{planDesc}</small>
                </div>
              </div>

              <div className="ns9-sub-specs">
                <div className="ns9-sub-spec-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {PfSvg.history} Thời hạn
                  </span>
                  <b>{durationLabel}</b>
                </div>
                <div className="ns9-sub-spec-row">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {PfSvg.doc} Kỳ thi
                  </span>
                  <b>{examAccessLabel}</b>
                </div>
              </div>

              <button
                type="button"
                className="ns9-sub-upgrade-btn"
                onClick={() => setShowPayment(true)}
              >
                Nâng cấp gói <span>→</span>
              </button>
            </div>

            <div className="ns9-sub-current-right">
              <ElecSubMascot />
            </div>
          </article>

          {/* Thẻ 2: Hạn mức sử dụng */}
          <article className="ns9-sub-card ns9-sub-quota">
            <h2 className="ns9-sub-card-title">Hạn mức sử dụng</h2>

            <div className="ns9-hearts-box">
              <div className="ns9-hearts-top">
                <span className="ns9-hearts-label">
                  <i className="ns9-heart-dot" aria-hidden="true">{PfSvg.heartFilled}</i>
                  <b>Mạng luyện tập</b>
                </span>
                <span className="ns9-hearts-full-pill">Đã đầy</span>
              </div>

              <div className="ns9-hearts-main">
                <div className="ns9-hearts-num">
                  <strong>{heartsCount}</strong>
                  <span>/{maxHeartsCount}</span>
                </div>
                <div className="ns9-hearts-icons" aria-label={`${heartsCount} mạng luyện tập`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className="ns9-heart-svg" aria-hidden="true">{PfSvg.heartFilled}</span>
                  ))}
                </div>
              </div>

              <small className="ns9-hearts-sub">mạng luyện tập còn lại</small>
              <div className="ns9-hearts-bar">
                <i style={{ width: '100%' }} />
              </div>
            </div>

            <div className="ns9-credit-quota-box">
              <div className="ns9-credit-quota-top">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {PfSvg.sparkleAi} Điểm &amp; Credit AI khả dụng
                </span>
                <b>{credits != null ? credits.toLocaleString('vi-VN') : 0} điểm</b>
              </div>
              <div className="ns9-credit-quota-bar">
                <i style={{ width: credits != null && credits > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </article>

          {/* Thẻ 3: Lịch chuỗi 30 ngày (Mini Streak Calendar) */}
          <article className="pf-m-card">
            <div className="pf-m-cal-head">
              <span className="pf-m-cal-title">Lịch duy trì chuỗi học tập</span>
              <span className="pf-m-cal-streak-tag">
                <span className="pf-m-cal-fire-ico" aria-hidden="true">{PfSvg.flame}</span>
                <span>{currentStreak} ngày liên tiếp</span>
              </span>
            </div>

            <div className="pf-m-cal-weekdays">
              <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
            </div>

            <div className="pf-m-cal-grid">
              {calendarDays.map((c, i) => (
                <div
                  key={i}
                  className={`pf-m-cal-day ${c.empty ? 'empty' : ''} ${c.hasStreak ? 'has-streak' : ''} ${c.isToday ? 'is-today' : ''}`}
                >
                  {c.day && <span>{c.day}</span>}
                  {c.hasStreak && (
                    <span className="pf-m-cal-fire-dot" aria-hidden="true">
                      {PfSvg.flame}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </article>

          {/* Thẻ 4: Nhập mã kích hoạt (+15 điểm / lượt) */}
          <article className="ns9-sub-card ns9-sub-code">
            <h2 className="ns9-sub-card-title">Mã kích hoạt</h2>
            <p className="ns9-sub-code-sub">
              Mỗi lượt nhập mã tặng ngay <b>+{POINTS_PER_CODE_ENTRY} điểm</b> (Thử <b>ELEC15</b>, <b>ELECPRO</b>, <b>ELECVIP</b>)
            </p>

            <form className="ns9-sub-code-form" onSubmit={handleRedeemCode}>
              <input
                type="text"
                value={activationInput}
                onChange={(e) => setActivationInput(e.target.value)}
                placeholder="Nhập mã kích hoạt (+15 điểm)"
                aria-label="Nhập mã kích hoạt"
              />
              <button type="submit">Kiểm tra</button>
            </form>
          </article>
        </div>
      )}

      {/* ============================================================
         5. TAB 2: THÀNH TÍCH (ACHIEVEMENTS)
         ============================================================ */}
      {tab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProfileAchievements />
          <ProfileStats />
        </div>
      )}

      {/* ============================================================
         6. TAB 3: LỚP HỌC & BẠN BÈ (CLASSROOM)
         ============================================================ */}
      {tab === 'classroom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Lớp học đang tham gia */}
          <div className="pf-m-card">
            <h3 className="pf-m-card-title">
              {PfSvg.gradCap}
              <span>Lớp học của bạn ({classes.length})</span>
            </h3>

            {classes.length === 0 ? (
              <div className="pf-m-empty">
                <p>Bạn chưa tham gia lớp học nào. Hãy dán mã lớp hoặc link mời từ thầy cô tại mục Lớp học!</p>
                <a href="#my-classes" className="pf-m-btn primary" style={{ textDecoration: 'none' }}>
                  Tham gia lớp học ngay →
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {classes.map((cls) => (
                  <div key={cls.id} className="pf-m-class-card">
                    <div className="pf-m-class-info">
                      <b>{cls.name}</b>
                      <small>Giáo viên: {cls.teacherName || 'Thầy cô'} · {cls.studentsCount || 0} học sinh</small>
                    </div>
                    <a href="#my-classes" className="pf-m-btn" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                      Phòng chat lớp →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chuỗi Bạn bè */}
          <div className="pf-m-card">
            <h3 className="pf-m-card-title">
              {PfSvg.users}
              <span>Chuỗi bạn bè học tập ({friends.length})</span>
            </h3>

            {friends.length === 0 ? (
              <div className="pf-m-empty">
                <p>Chưa có bạn bè kết nối. Hãy kết bạn với bạn cùng lớp trong khung chat cộng đồng hoặc phòng chat lớp!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {friends.map((f) => (
                  <div key={f.uid || f.id} className="pf-m-friend-item">
                    <div className="pf-m-friend-left">
                      <div className="pf-m-friend-avatar">
                        {(f.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="pf-m-friend-name">
                        <b>{f.displayName || 'Bạn học'}</b>
                        <small style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {PfSvg.flame} Chuỗi {f.streakCount || 0} ngày
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="pf-m-nudge-btn"
                        onClick={() => handleNudge(f)}
                      >
                        {nudgedFriends[f.uid || f.id] ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {PfSvg.check} Đã nhắc
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {PfSvg.flame} Nhắc bạn
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Giáo viên PRO */}
          {(pro.isPro || user?.role === 'teacher') && (
            <div className="pf-m-card">
              <TeacherProPanel />
            </div>
          )}
        </div>
      )}

      {/* ============================================================
         7. TAB 4: HOẠT ĐỘNG / LỊCH SỬ (HISTORY)
         ============================================================ */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Sub-filter selector */}
          <div className="pf-m-card" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                ['all', 'Tất cả'],
                ['exam', 'Đề thi thử'],
                ['roadmap', 'Lộ trình'],
                ['fav', `Đề yêu thích (${favExamsList.length})`],
              ].map(([fId, fLabel]) => (
                <button
                  key={fId}
                  type="button"
                  className={`pf-m-tab-btn ${historyFilter === fId ? 'on' : ''}`}
                  onClick={() => setHistoryFilter(fId)}
                >
                  {fLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách đề yêu thích */}
          {(historyFilter === 'all' || historyFilter === 'fav') && favExamsList.length > 0 && (
            <div className="pf-m-card">
              <h3 className="pf-m-card-title">
                {PfSvg.bookmark}
                <span>Đề yêu thích đã lưu ({favExamsList.length})</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {favExamsList.map((ex) => (
                  <div key={ex.id} className="pf-m-exam-item">
                    <div className="pf-m-exam-title">
                      <b>{ex.title}</b>
                      <small>{ex.examType} · {ex.questionCount} câu · {ex.durationMinutes} phút</small>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href="#quiz" className="pf-m-exam-cta">Làm đề</a>
                      <button
                        type="button"
                        className="pf-m-btn"
                        style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                        onClick={() => setFavIds(toggleFavoriteExamId(uid, ex.id))}
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lịch sử đề thi thử Phòng thi ảo */}
          {(historyFilter === 'all' || historyFilter === 'exam') && (
            <div className="pf-m-card">
              <h3 className="pf-m-card-title">
                {PfSvg.history}
                <span>Lịch sử đề thi Phòng thi ảo ({examHistory.length})</span>
              </h3>

              {examHistory.length === 0 ? (
                <div className="pf-m-empty">
                  <p>Bạn chưa thi thử đề nào. Hãy vào Phòng thi ảo làm bài để ghi nhận điểm số!</p>
                  <a href="#quiz" className="pf-m-btn primary" style={{ textDecoration: 'none' }}>
                    Vào Phòng thi ảo →
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {examHistory.map((h) => (
                    <div key={h.id} className="pf-m-exam-item">
                      <div className="pf-m-exam-title">
                        <b>{h.examTitle}</b>
                        <small>Đúng {h.correct}/{h.total} câu · {new Date(h.at).toLocaleDateString('vi-VN')}</small>
                      </div>
                      <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{h.score10}đ</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lịch sử lộ trình chuyên đề */}
          {(historyFilter === 'all' || historyFilter === 'roadmap') && (
            <div className="pf-m-card">
              <h3 className="pf-m-card-title">
                {PfSvg.doc}
                <span>Phiên ôn luyện Chuyên đề ({roadmapSessions.length})</span>
              </h3>

              {roadmapSessions.length === 0 ? (
                <div className="pf-m-empty">
                  <p>Chưa có phiên luyện chuyên đề. Khám phá Lộ trình để ôn luyện theo chương!</p>
                  <a href="#roadmap" className="pf-m-btn primary" style={{ textDecoration: 'none' }}>
                    Mở Lộ trình học tập →
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {roadmapSessions.map((s) => (
                    <div key={s.id} className="pf-m-exam-item">
                      <div className="pf-m-exam-title">
                        <b>Chuyên đề: {s.topicId}</b>
                        <small>Đúng {s.correct}/{s.total} câu · {new Date(s.at).toLocaleDateString('vi-VN')}</small>
                      </div>
                      <strong style={{ fontSize: '1rem', color: '#2f6bff' }}>
                        {Math.round(((s.correct || 0) / Math.max(1, s.total || 1)) * 100)}%
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
         8. TAB 5: CÀI ĐẶT (SETTINGS - ACCORDION GROUPS)
         ============================================================ */}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pf-m-settings-group">
            {/* Nhóm 1: Hồ sơ cá nhân */}
            <button
              type="button"
              className="pf-m-setting-row"
              onClick={() => setOpenSettingsGroup((prev) => (prev === 'profile' ? null : 'profile'))}
            >
              <div className="pf-m-setting-left">
                <span className="pf-m-setting-ico">{PfSvg.edit}</span>
                <span>Thông tin cá nhân &amp; Mã giới thiệu</span>
              </div>
              <span className="pf-m-setting-arrow">{PfSvg.chevronDown}</span>
            </button>

            {openSettingsGroup === 'profile' && (
              <div className="pf-m-accordion-body">
                <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="pf-m-field">
                    <label htmlFor="pf-m-name-in">Tên hiển thị</label>
                    <input
                      id="pf-m-name-in"
                      type="text"
                      className="pf-m-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      placeholder="Nguyễn Duy TK"
                    />
                  </div>

                  <div className="pf-m-field">
                    <label>Email tài khoản</label>
                    <input
                      type="text"
                      className="pf-m-input"
                      value={email}
                      disabled
                      readOnly
                      style={{ opacity: 0.7 }}
                    />
                  </div>

                  <div className="pf-m-field">
                    <label>Mã giới thiệu của bạn (+{POINTS_PER_CODE_ENTRY} điểm/lượt)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="pf-m-input"
                        value={identCode}
                        readOnly
                        style={{ fontWeight: 800, color: '#2f6bff' }}
                      />
                      <button type="button" className="pf-m-btn primary" onClick={copyId}>
                        {copied ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button type="submit" className="pf-m-btn primary" disabled={loading || !dirty}>
                      {loading ? 'Đang lưu…' : 'Lưu tên mới'}
                    </button>
                    {dirty && (
                      <button type="button" className="pf-m-btn" onClick={() => setName(display)}>
                        Hoàn tác
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Nhóm 2: Bảo mật & Đổi mật khẩu */}
            <button
              type="button"
              className="pf-m-setting-row"
              onClick={() => setOpenSettingsGroup((prev) => (prev === 'security' ? null : 'security'))}
            >
              <div className="pf-m-setting-left">
                <span className="pf-m-setting-ico">{PfSvg.lock}</span>
                <span>Đổi mật khẩu &amp; Xác thực email</span>
              </div>
              <span className="pf-m-setting-arrow">{PfSvg.chevronDown}</span>
            </button>

            {openSettingsGroup === 'security' && (
              <div className="pf-m-accordion-body">
                {isGoogle ? (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--mut)' }}>
                    Tài khoản đăng nhập qua Google — mật khẩu do Google bảo vệ, không cần đổi tại đây.
                  </p>
                ) : (
                  <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="pf-m-field">
                      <label htmlFor="pf-old-pw">Mật khẩu hiện tại</label>
                      <input
                        id="pf-old-pw"
                        type={showOld ? 'text' : 'password'}
                        className="pf-m-input"
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="pf-m-field">
                      <label htmlFor="pf-new-pw">Mật khẩu mới</label>
                      <input
                        id="pf-new-pw"
                        type={showNew ? 'text' : 'password'}
                        className="pf-m-input"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                        onKeyUp={(e) => setCaps(!!e.getModifierState?.('CapsLock'))}
                        onBlur={() => setCaps(false)}
                      />
                      {caps && <small style={{ color: '#ea580c' }}>Caps Lock đang bật</small>}
                    </div>

                    <div className="pf-m-field">
                      <label htmlFor="pf-conf-pw">Xác nhận mật khẩu mới</label>
                      <input
                        id="pf-conf-pw"
                        type={showNew ? 'text' : 'password'}
                        className="pf-m-input"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      className="pf-m-btn primary"
                      disabled={loading || !oldPw || !newPw || !confirmPw}
                      style={{ marginTop: 4 }}
                    >
                      {loading ? 'Đang đổi…' : 'Đổi mật khẩu'}
                    </button>
                  </form>
                )}

                <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: 10, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {user?.emailVerified ? (
                        <>Email đã xác thực <span style={{ color: '#10b981' }}>{PfSvg.check}</span></>
                      ) : (
                        'Email chưa xác thực'
                      )}
                    </span>
                    {!user?.emailVerified && (
                      <button type="button" className="pf-m-btn" onClick={sendVerify} disabled={loading}>
                        Gửi link xác thực
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nhóm 3: Báo lỗi & Góp ý */}
            <button
              type="button"
              className="pf-m-setting-row"
              onClick={() => setOpenSettingsGroup((prev) => (prev === 'feedback' ? null : 'feedback'))}
            >
              <div className="pf-m-setting-left">
                <span className="pf-m-setting-ico">{PfSvg.flag}</span>
                <span>Báo lỗi câu hỏi &amp; Góp ý tính năng</span>
              </div>
              <span className="pf-m-setting-arrow">{PfSvg.chevronDown}</span>
            </button>

            {openSettingsGroup === 'feedback' && (
              <div className="pf-m-accordion-body">
                <form onSubmit={(e) => handleSubmitReportOrFeedback(e, 'feedback')} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="pf-m-field">
                    <label>Chủ đề góp ý</label>
                    <select
                      className="pf-m-input"
                      value={feedbackTopic}
                      onChange={(e) => setFeedbackTopic(e.target.value)}
                    >
                      <option value="Nội dung câu hỏi / Đáp án">Nội dung câu hỏi / Đáp án Hóa học</option>
                      <option value="Giao diện Phòng thi ảo / Lộ trình">Giao diện Phòng thi ảo / Lộ trình</option>
                      <option value="Góp ý tính năng AI">Góp ý tính năng Gia sư AI</option>
                    </select>
                  </div>

                  <div className="pf-m-field">
                    <label>Nội dung chi tiết</label>
                    <textarea
                      className="pf-m-input"
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Mô tả ý tưởng hoặc câu hỏi bạn phát hiện lỗi..."
                    />
                  </div>

                  <button type="submit" className="pf-m-btn primary">
                    Gửi góp ý
                  </button>
                </form>
              </div>
            )}

            {/* Hàng Đăng xuất */}
            <button
              type="button"
              className="pf-m-setting-row pf-m-logout-row"
              onClick={() => setAskLogout(true)}
            >
              <div className="pf-m-setting-left">
                <span className="pf-m-setting-ico">{PfSvg.logout}</span>
                <span>Đăng xuất khỏi thiết bị này</span>
              </div>
              <span className="pf-m-setting-arrow">→</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
         MODAL / ACTION SHEET ĐỔI ẢNH ĐẠI DIỆN
         ============================================================ */}
      {avatarMenuOpen && (
        <div className="pf-m-modal-backdrop" onClick={() => setAvatarMenuOpen(false)}>
          <div className="pf-m-avatar-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pf-m-sheet-head">
              <h3>Đổi ảnh đại diện</h3>
              <button
                type="button"
                className="pf-m-sheet-close"
                onClick={() => setAvatarMenuOpen(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="pf-m-btn primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <IcoCamera size={16} />
                <span>{uploading ? 'Đang tải ảnh lên…' : 'Chọn ảnh từ thư viện thiết bị'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) handleUpload(f);
                }}
              />

              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--mut)' }}>
                  Hoặc chọn màu ảnh đại diện:
                </span>
                <div className="pf-m-swatches">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`pf-m-swatch ${c === color ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => {
                        pickColor(c);
                        setAvatarMenuOpen(false);
                      }}
                      aria-label={`Chọn màu ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
         MODAL NÂNG CẤP GÓI / THANH TOÁN QR
         ============================================================ */}
      {showPayment && (
        <div className="pf-modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="pf-modal-close"
              onClick={() => setShowPayment(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <PaymentPanel
              identCode={identCode}
              onPaymentSuccess={handlePaymentSuccess}
              onClose={() => setShowPayment(false)}
            />
            {user?.uid && (
              <div style={{ marginTop: 14 }}>
                <CreditTopUp
                  userId={user.uid}
                  onCreditUpdate={(newBal) => setCredits(newBal)}
                  onUpgrade={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận Đăng xuất */}
      <dialog ref={dlg} className="pf-dialog" onClose={() => setAskLogout(false)} onClick={(e) => e.target === dlg.current && setAskLogout(false)}>
        <h3>Đăng xuất?</h3>
        <p>Tài khoản <b>{display || email}</b> sẽ thoát khỏi thiết bị này.</p>
        <div className="pf-actions flat">
          <button type="button" className="pf-btn" onClick={() => setAskLogout(false)}>Ở lại</button>
          <button type="button" className="pf-btn danger" onClick={logout}>Đăng xuất</button>
        </div>
      </dialog>
    </section>
  );
}
