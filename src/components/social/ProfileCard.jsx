/* ============================================================================
   ProfileCard.jsx — Trang Cá Nhân ELEC Threads (Threads.com × ELEC Science AI)
   ----------------------------------------------------------------------------
   - Giao diện tối giản chuẩn Threads.com: Header bất đối xứng (Tên & Bio trái,
     Avatar thật tròn phải), nút hành động đối xứng toàn chiều rộng, 4 tab gạch chân
   - Đầy đủ chức năng thời gian thực:
     + Cap 24h inline đồng bộ trực tiếp với Messenger Notes
     + Đăng cap chữ (nền màu ELEC + Bé Elec + thẻ Học chung), Ghim bài, Đăng lại,
       Lưu bài (tab Đã lưu), Thả cảm xúc, Luồng trả lời nối dọc, lọc #hashtag
     + Học chung (#pomodoro + gửi lời mời DM 1:1) & Hồ sơ học tập (XP, Chuỗi, Huy hiệu)
   - 100% Vector SVG sắc nét (không emoji) · Light Mode & True OLED Dark Mode
   ============================================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  openDm,
  sendDmMessage,
  listenFriends,
} from '../../lib/social.js';
import {
  COVER_THEMES,
  POST_BACKGROUNDS,
  POST_MOODS,
  NOTE_MASCOTS,
  WALL_REACTIONS,
  getNoteMascotSrc,
  subscribeFullSocialProfile,
  subscribeCommunityFeed,
  subscribeFriendStatus,
  saveExtendedSocialProfile,
  saveMessengerNote,
  createWallPost,
  deleteWallPost,
  togglePinWallPost,
  toggleSavePost,
  toggleWallPostReaction,
  addWallPostComment,
  sendWallPoke,
  saveStudyTogetherHandoff,
} from '../../lib/socialWall.js';
import { TIERS } from '../../lib/tier.js';
import { isAdmin } from '../../lib/isAdmin.js';
import { getCredits } from '../../lib/creditService.js';
import { getClassesByStudent } from '../../lib/classroom.js';
import {
  getVirtualExamHistory,
  getFavoriteExamIds,
  getSubscriptionAndQuota,
} from '../../data/virtualExamsBank.js';
import { useLiveStreak } from '../../hooks.js';
import VerifiedBadge from '../VerifiedBadge.jsx';
import StudentAvatar from '../StudentAvatar.jsx';
import ProfileAtlasDashboard from '../ProfileAtlasDashboard.jsx';
import './social.css';
import '../../styles/profile-atlas.css';
import '../../styles/elec-profile-social.css';

/* ── 100% VECTOR SVG ICON SYSTEM (ZERO UNICODE EMOJI) ── */
function TpIcon({ name, size = 16, filled = false, sw = 1.85 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? 'none' : 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    style: { flexShrink: 0, display: 'inline-block' },
  };

  switch (name) {
    case 'elec':
      return <svg {...props} fill="currentColor" stroke="none"><path d="M13 2 4.5 13.5h6.2L9.6 22 19.5 10.5h-6.2L13 2z" /></svg>;
    case 'crown':
      return <svg {...props}><path d="M3 17h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 17z" /><path d="M5 20h14" /></svg>;
    case 'heart':
      return <svg {...props}><path d="M12 20.5S3.5 15.2 3.5 9.2A4.7 4.7 0 0 1 12 6.8a4.7 4.7 0 0 1 8.5 2.4c0 6-8.5 11.3-8.5 11.3z" /></svg>;
    case 'like':
      return <svg {...props}><path d="M7 10v11M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 7.5A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" /></svg>;
    case 'flame':
      return <svg {...props}><path d="M12 2.5c1.6 3.2 5.5 4.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3 1.8-5.1 3.2-7.2.2 2 1.2 3 2.3 3.2-.2-2-.1-3.9 0-6z" /></svg>;
    case 'star':
      return <svg {...props}><path d="M12 3l2.6 5.4 6 .8-4.4 4.2 1 6-5.2-2.8-5.2 2.8 1-6L3.4 9.2l6-.8L12 3z" /></svg>;
    case 'reply':
      return <svg {...props}><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-4.9A8.5 8.5 0 1 1 21 11.5z" /></svg>;
    case 'repost':
      return <svg {...props}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>;
    case 'bookmark':
      return <svg {...props}><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>;
    case 'share':
      return <svg {...props}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>;
    case 'users':
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.5" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" /></svg>;
    case 'play':
      return <svg {...props} fill="currentColor" stroke="none"><path d="M7 5.2v13.6a1 1 0 0 0 1.52.85l10.6-6.8a1 1 0 0 0 0-1.7L8.52 4.35A1 1 0 0 0 7 5.2z" /></svg>;
    case 'clock':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
    case 'school':
      return <svg {...props}><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2.6 9 2.6 12 0v-5" /></svg>;
    case 'target':
      return <svg {...props}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
    case 'palette':
      return <svg {...props}><circle cx="13.5" cy="6.5" r=".8" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".8" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".8" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".8" fill="currentColor" /><path d="M12 2a10 10 0 0 0 0 20c1.4 0 2.5-1.1 2.5-2.5 0-.6-.2-1.2-.6-1.6-.4-.4-.6-1-.6-1.6 0-1.4 1.1-2.5 2.5-2.5H18a4 4 0 0 0 4-4c0-4.4-4.5-7.8-10-7.8z" /></svg>;
    case 'pin':
      return <svg {...props}><path d="M12 17v5M9 4h6l1 6 3 2v2H5v-2l3-2 1-6z" /></svg>;
    case 'trash':
      return <svg {...props}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
    case 'edit':
      return <svg {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'add':
      return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'check':
      return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case 'x':
      return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'note':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></svg>;
    case 'zap':
      return <svg {...props}><path d="M13 2 4 14h7l-1 8 10-12h-7l0-8z" /></svg>;
    default:
      return null;
  }
}

function ReactionSvg({ type, size = 16, filled = true }) {
  const map = { like: 'like', love: 'heart', fire: 'flame', star: 'star' };
  return <TpIcon name={map[type] || 'heart'} size={size} filled={filled} />;
}

function RichPostText({ text = '', onClickTag }) {
  const parts = String(text || '').split(/(#[A-Za-z0-9_\u00C0-\u1EF9]+)/g);
  return parts.map((part, idx) =>
    part.startsWith('#') && part.length > 1 ? (
      <button
        key={idx}
        type="button"
        className="tp-hashtag"
        onClick={(e) => {
          e.stopPropagation();
          onClickTag?.(part);
        }}
      >
        {part}
      </button>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

function fmtShortRel(ts, nowMs = Date.now()) {
  const t = Number(ts) || 0;
  if (!t) return 'vừa xong';
  const mins = Math.floor(Math.max(0, nowMs - t) / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày`;
  return new Date(t).toLocaleDateString('vi-VN');
}

function fmtJoinDate(raw) {
  if (!raw) return 'Thành viên ELEC AI 2026';
  try {
    const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
    if (Number.isNaN(d.getTime())) return 'Thành viên ELEC AI 2026';
    return `Tham gia tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return 'Thành viên ELEC AI 2026';
  }
}

export default function ProfileCard({
  targetUid,
  fallbackName = '',
  onClose,
  onOpenDm,
  embedded = false,
  onNavigateAway,
}) {
  const { user } = useAuth();
  const meUid = user?.uid || null;
  const meName = user?.displayName || 'Thành viên ELEC';

  const [profile, setProfile] = useState(null);
  const [ext, setExt] = useState(null);
  const [focusLive, setFocusLive] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // 'overview' (đồng bộ #profile Atlas) | 'posts' | 'study' | 'saved' | 'reposts'
  const [activeTab, setActiveTab] = useState(() => (meUid && targetUid === meUid ? 'overview' : 'posts'));
  const [tagFilter, setTagFilter] = useState('');

  // Dữ liệu đồng bộ 100% từ Trang cá nhân gốc (#profile) khi xem hồ sơ của chính mình
  const { count: liveStreakCount = 0 } = useLiveStreak() || {};
  const [atlasCredits, setAtlasCredits] = useState(0);
  const [atlasClasses, setAtlasClasses] = useState([]);
  const [atlasFriends, setAtlasFriends] = useState([]);
  const [atlasExamHistory, setAtlasExamHistory] = useState([]);
  const [atlasFavIds, setAtlasFavIds] = useState([]);
  const [atlasQuota, setAtlasQuota] = useState({ heartsCount: 5, maxHeartsCount: 5 });

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [pokeMap, setPokeMap] = useState({});
  const [pokeCount, setPokeCount] = useState(0);

  // Community hub data (saved posts & my own posts for reposting)
  const [communityData, setCommunityData] = useState({
    posts: [],
    myPosts: [],
    mySavedPostIds: [],
  });

  // Threads inline composer
  const [capText, setCapText] = useState('');
  const [capBg, setCapBg] = useState('none');
  const [capMood, setCapMood] = useState('');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [capStudyEnabled, setCapStudyEnabled] = useState(false);
  const [capStudyMins, setCapStudyMins] = useState(25);
  const [capStudyTopic, setCapStudyTopic] = useState('');
  const [posting, setPosting] = useState(false);

  // Study Together launcher
  const [showStudyPanel, setShowStudyPanel] = useState(false);
  const [studyMins, setStudyMins] = useState(25);
  const [studyTopic, setStudyTopic] = useState('');
  const [studyPostToWall, setStudyPostToWall] = useState(true);
  const [launchingStudy, setLaunchingStudy] = useState(false);

  // Inline replies
  const [openComments, setOpenComments] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  // Quick inline Cap 24h editor
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteMascot, setNoteMascot] = useState('fighting');
  const [savingNote, setSavingNote] = useState(false);

  // Cover & full Profile editor
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    note24h: '',
    school: '',
    grade: '',
    targetUni: '',
    targetScore: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const composerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const editingRef = useRef(false);
  editingRef.current = editing;

  const showToast = (msg) => {
    clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    setActiveTab(meUid && targetUid === meUid ? 'overview' : 'posts');
    setTagFilter('');
    setEditing(false);
    setEditingNote(false);
    setShowStudyPanel(false);
    setShowCoverPicker(false);
  }, [targetUid, meUid]);

  /* Đồng bộ dữ liệu thật từ #profile (Credit, Lớp học, Bạn bè, Lịch sử đề thi, Đề đã lưu) */
  useEffect(() => {
    if (!meUid || targetUid !== meUid) return undefined;
    let alive = true;
    getCredits(meUid)
      .then((c) => {
        if (alive) setAtlasCredits(Number(c?.balance) || 0);
      })
      .catch(() => {});
    getClassesByStudent(meUid)
      .then((cls) => {
        if (alive) setAtlasClasses(Array.isArray(cls) ? cls : []);
      })
      .catch(() => {});
    const unsubFriends = listenFriends(meUid, (fList) => {
      if (alive) setAtlasFriends(Array.isArray(fList) ? fList : []);
    });
    try {
      setAtlasExamHistory(getVirtualExamHistory(meUid) || []);
      setAtlasFavIds(getFavoriteExamIds(meUid) || []);
      const q = getSubscriptionAndQuota(meUid);
      setAtlasQuota({
        heartsCount: q?.hearts ?? q?.remaining ?? 5,
        maxHeartsCount: q?.maxHearts ?? 5,
      });
    } catch { /* ignore */ }
    return () => {
      alive = false;
      unsubFriends?.();
    };
  }, [meUid, targetUid]);

  useEffect(() => {
    if (embedded) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showMoodMenu) setShowMoodMenu(false);
        else if (showCoverPicker) setShowCoverPicker(false);
        else if (editingNote) setEditingNote(false);
        else if (editing) setEditing(false);
        else if (showStudyPanel) setShowStudyPanel(false);
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [embedded, onClose, showMoodMenu, showCoverPicker, editingNote, editing, showStudyPanel]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  /* Đồng bộ hồ sơ thời gian thực */
  useEffect(() => {
    if (!targetUid) return undefined;
    let alive = true;
    setLoadingPosts(true);

    const unsubProfile = subscribeFullSocialProfile(
      targetUid,
      ({ profile: nextProfile, ext: nextExt, posts: nextPosts, pokes, focusLive: nextFocus, live }) => {
        if (!alive) return;
        if (nextProfile) setProfile(nextProfile);
        setExt(nextExt);
        setPosts(nextPosts || []);
        setPokeMap(pokes?.map || {});
        setPokeCount(pokes?.count || 0);
        setFocusLive(nextFocus || null);
        setIsLive(!!live);
        setLoadingPosts(false);

        if (!editingRef.current && nextExt) {
          setEditForm({
            bio: nextExt.bio || '',
            note24h: nextExt.note24h || '',
            school: nextExt.school || '',
            grade: nextExt.grade || '',
            targetUni: nextExt.targetUni || '',
            targetScore: nextExt.targetScore || '',
          });
        }
      },
      meUid
    );

    const unsubFriend = subscribeFriendStatus(meUid, targetUid, (st) => {
      if (alive) setStatus(st);
    });

    const unsubFeed = subscribeCommunityFeed(meUid, (data) => {
      if (alive) {
        setCommunityData({
          posts: data.posts || [],
          myPosts: data.myPosts || [],
          mySavedPostIds: data.mySavedPostIds || [],
        });
      }
    });

    return () => {
      alive = false;
      unsubProfile?.();
      unsubFriend?.();
      unsubFeed?.();
    };
  }, [targetUid, meUid]);

  if (!targetUid) return null;

  const isMe = meUid === targetUid;
  const anonymous = !targetUid || targetUid === 'anonymous';
  const isMeAdmin = isMe && isAdmin(user);
  const isVip = !!profile?.vip || profile?.tier === 'vip' || isMeAdmin;
  const tier = isVip ? TIERS.vip : TIERS.free;
  const name = profile?.name || fallbackName || (isMe ? user?.displayName : '') || 'Thành viên ELEC';
  const avatarPhoto = profile?.photoURL || (isMe ? user?.photoURL : null);
  const roleLabel = profile?.role === 'teacher' || isMeAdmin ? 'Giáo viên' : 'Học sinh';
  const elecCode = `ELECAI-${String(targetUid || 'ELEC').slice(0, 6).toUpperCase()}`;

  const pub = profile?.public || ext?.fallbackStats || null;
  const levelVal = pub?.level ?? 1;
  const xpVal = pub?.xp ?? 0;
  const streakVal = isMe ? Math.max(pub?.streak ?? 0, liveStreakCount) : (pub?.streak ?? 0);
  const accVal = pub?.accuracy;
  const pokedByMe = !!(meUid && pokeMap?.[meUid]);

  const openFullProfileTab = (tabKey = 'overview') => {
    onNavigateAway?.();
    if (!embedded) onClose?.();
    window.location.hash = `#profile?tab=${tabKey}`;
  };

  // Tiến trình XP lên cấp tiếp theo (mỗi 200 XP một cột mốc trực quan)
  const xpCycle = 200;
  const xpInLevel = xpVal % xpCycle;
  const xpPct = Math.min(100, Math.max(8, Math.round((xpInLevel / xpCycle) * 100)));

  const activeCover =
    COVER_THEMES.find((c) => c.id === (ext?.coverTheme || 'cobalt')) || COVER_THEMES[0];

  const note24hActive =
    ext?.note24h && (!ext?.note24hAt || Date.now() - ext.note24hAt < 48 * 3600 * 1000)
      ? ext.note24h
      : '';
  const note24hMascotSrc = getNoteMascotSrc(ext?.note24hMascot) || '/img/elec/elec-happy.png';

  const isFocusActiveNow = !!(focusLive?.lastPingAt && nowTick - focusLive.lastPingAt < 5 * 60 * 1000);

  const savedSet = useMemo(() => new Set(communityData.mySavedPostIds || []), [communityData.mySavedPostIds]);

  const savedPostsList = useMemo(
    () => communityData.posts.filter((p) => savedSet.has(p.id)),
    [communityData.posts, savedSet]
  );

  const studyPosts = useMemo(() => posts.filter((p) => !!p.studyInvite), [posts]);
  const repostedPosts = useMemo(() => posts.filter((p) => !!p.repostOf), [posts]);

  const visiblePosts = useMemo(() => {
    if (!tagFilter) return posts;
    const q = tagFilter.toLowerCase();
    return posts.filter((p) => `${p.text || ''} ${p.studyInvite?.topic || ''}`.toLowerCase().includes(q));
  }, [posts, tagFilter]);

  const totalProfileLikes = useMemo(
    () =>
      posts.reduce((sum, p) => {
        const reactObj = p?.reactions || {};
        return sum + Object.values(reactObj).reduce((s, uMap) => s + Object.keys(uMap || {}).length, 0);
      }, 0),
    [posts]
  );

  const earnedBadges = useMemo(() => {
    const list = [{ mascot: '/img/elec/elec-cool.png', label: 'ELEC AI Member', sub: 'Chính chủ' }];
    if (isVip) list.push({ mascot: '/img/elec/elec-super-saiyan.png', label: 'VIP PRO', sub: 'Đặc quyền AI' });
    if (streakVal >= 2) list.push({ mascot: '/img/elec/elec-fighting.png', label: `Chuỗi ${streakVal} ngày`, sub: 'Bền bỉ' });
    if (xpVal >= 100) list.push({ mascot: '/img/elec/elec-celebrate.png', label: `${Number(xpVal).toLocaleString('vi-VN')} XP`, sub: `Cấp ${levelVal}` });
    if (accVal != null && accVal >= 75) list.push({ mascot: '/img/elec/elec-think.png', label: `${accVal}% chuẩn xác`, sub: 'Học bá' });
    if (posts.length >= 1) list.push({ mascot: '/img/elec/elec-happy.png', label: `${posts.length} bài viết`, sub: 'Cộng đồng ELEC' });
    return list;
  }, [isVip, streakVal, xpVal, levelVal, accVal, posts.length]);

  const activeMoodObj = POST_MOODS.find((m) => m.id && m.id === capMood) || null;
  const activeBgObj = POST_BACKGROUNDS.find((b) => b.id === capBg) || null;
  const isBgActive = Boolean(activeBgObj?.css && !capStudyEnabled);
  const composerBgClass = isBgActive ? `has-bg fbp-bg-${capBg}` : '';

  /* ── ACTIONS ── */
  const handleFriend = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (status === 'friends') {
        await removeFriend(user, targetUid);
        setStatus('none');
        showToast('Đã hủy kết bạn');
      } else if (status === 'incoming') {
        await acceptFriendRequest(user, { uid: targetUid, name });
        setStatus('friends');
        showToast('Đã trở thành bạn bè');
      } else if (status === 'none') {
        const r = await sendFriendRequest(user, targetUid, name);
        setStatus(r === 'accepted' ? 'friends' : 'requested');
        showToast(r === 'accepted' ? 'Đã trở thành bạn bè' : 'Đã gửi lời mời kết bạn');
      }
    } catch (e) {
      showToast(e.message || 'Không thể thực hiện');
    } finally {
      setBusy(false);
    }
  };

  const handleDm = async () => {
    if (!user || busy || isMe) return;
    setBusy(true);
    try {
      const { id } = await openDm(user, targetUid, name);
      onOpenDm?.(id, name);
      if (!embedded) onClose?.();
    } catch (e) {
      showToast(e.message || 'Lỗi mở hội thoại');
    } finally {
      setBusy(false);
    }
  };

  const handlePoke = async () => {
    if (!user || isMe || anonymous) return;
    try {
      const res = await sendWallPoke(targetUid, pokeMap, user.uid, meName);
      setPokeMap(res.map);
      setPokeCount(res.count);
      showToast(`Đã gửi cổ vũ tới ${name}`);
    } catch {
      showToast('Không thể gửi cổ vũ lúc này');
    }
  };

  const handleShareProfile = async () => {
    const lines = [
      `${name} · ${roleLabel} trên ELEC Science AI`,
      ext?.school ? `Trường: ${[ext.grade, ext.school].filter(Boolean).join(' · ')}` : null,
      ext?.targetUni ? `Mục tiêu: ${ext.targetUni}${ext.targetScore ? ` (${ext.targetScore})` : ''}` : null,
      `Thành tích: Lv.${levelVal} · Chuỗi ${streakVal} ngày · ${posts.length} bài viết`,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Đã sao chép thẻ hồ sơ ELEC AI');
    } catch {
      showToast('Đã sao chép hồ sơ');
    }
  };

  const handleCoverChange = async (themeId) => {
    const prevExt = ext;
    setExt((prev) => ({ ...(prev || {}), coverTheme: themeId }));
    setShowCoverPicker(false);
    try {
      await saveExtendedSocialProfile(user.uid, prevExt, { coverTheme: themeId });
      showToast('Đã đổi màu thương hiệu ELEC');
    } catch {
      setExt(prevExt);
      showToast('Đổi màu thất bại');
    }
  };

  const openInlineNoteEditor = () => {
    if (!isMe) return;
    setNoteDraft(note24hActive);
    setNoteMascot(ext?.note24hMascot || 'fighting');
    setEditingNote((v) => !v);
    setEditing(false);
  };

  const handleSaveQuickNote = async (e) => {
    e.preventDefault();
    if (!meUid || savingNote) return;
    setSavingNote(true);
    try {
      await saveMessengerNote(meUid, { note: noteDraft, mascotId: noteMascot });
      setEditingNote(false);
      showToast(noteDraft.trim() ? 'Đã đăng Cap 24h (đồng bộ Messenger)' : 'Đã gỡ Cap 24h');
    } catch {
      showToast('Không lưu được Cap 24h');
    } finally {
      setSavingNote(false);
    }
  };

  const handleClearQuickNote = async () => {
    if (!meUid || savingNote) return;
    setSavingNote(true);
    try {
      await saveMessengerNote(meUid, { note: '', mascotId: '' });
      setNoteDraft('');
      setEditingNote(false);
      showToast('Đã gỡ Cap 24h');
    } catch {
      showToast('Không thể gỡ lúc này');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!meUid || savingEdit) return;
    setSavingEdit(true);
    try {
      const patch = {
        bio: editForm.bio.trim().slice(0, 160),
        note24h: editForm.note24h.trim().slice(0, 60),
        note24hAt: editForm.note24h.trim() ? Date.now() : 0,
        school: editForm.school.trim().slice(0, 80),
        grade: editForm.grade.trim().slice(0, 24),
        targetUni: editForm.targetUni.trim().slice(0, 80),
        targetScore: editForm.targetScore.trim().slice(0, 20),
      };
      await saveExtendedSocialProfile(meUid, ext, patch);
      setEditing(false);
      showToast('Đã cập nhật trang cá nhân');
    } catch {
      showToast('Không lưu được thay đổi');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!meUid || posting) return;
    if (!capText.trim() && !capStudyEnabled) return;
    setPosting(true);
    try {
      const studyInvite = capStudyEnabled
        ? {
            durationMin: capStudyMins,
            topic: capStudyTopic.trim() || capText.trim().slice(0, 90) || 'Cùng tập trung ôn thi',
            hostUid: meUid,
            hostName: meName,
          }
        : null;

      const nextPosts = await createWallPost(targetUid, posts, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        text: capText,
        bgId: capStudyEnabled ? 'none' : capBg,
        mood: capMood,
        studyInvite,
      });
      setPosts(nextPosts);
      setCapText('');
      setCapBg('none');
      setCapMood('');
      setCapStudyEnabled(false);
      setCapStudyTopic('');
      setShowMoodMenu(false);
      setShowBgPicker(false);
      showToast(studyInvite ? 'Đã đăng thẻ Rủ học chung!' : 'Đã đăng lên tường cá nhân');
    } catch (err) {
      showToast(
        err?.code === 'permission-denied'
          ? 'Bạn chỉ có thể đăng trực tiếp trên trang của chính mình'
          : err?.message || 'Đăng bài thất bại'
      );
    } finally {
      setPosting(false);
    }
  };

  const handleLaunchStudyTogether = async (e) => {
    e?.preventDefault?.();
    if (!meUid || launchingStudy) return;
    setLaunchingStudy(true);
    const cleanTopic =
      studyTopic.trim() || (isFocusActiveNow && focusLive?.task ? focusLive.task : 'Cùng tập trung ôn thi');
    try {
      if (isMe) {
        if (studyPostToWall) {
          try {
            const nextPosts = await createWallPost(meUid, posts, {
              authorUid: meUid,
              authorName: meName,
              authorPhoto: user?.photoURL || null,
              text: `Mình vừa mở phòng Học chung ${studyMins} phút — chủ đề: ${cleanTopic}. Ai rảnh vào ngồi học cùng nhé! #HocCungELEC`,
              bgId: 'none',
              mood: 'grind',
              studyInvite: {
                durationMin: studyMins,
                topic: cleanTopic,
                hostUid: meUid,
                hostName: meName,
              },
            });
            setPosts(nextPosts);
          } catch { /* ignore */ }
        }
        saveStudyTogetherHandoff({
          partnerUid: null,
          partnerName: '',
          topic: cleanTopic,
          durationMin: studyMins,
          openClassroom: true,
        });
      } else {
        try {
          const { id } = await openDm(user, targetUid, name);
          await sendDmMessage(
            id,
            user,
            `[HỌC CHUNG ELEC] Mời ${name} học chung ${studyMins} phút — Chủ đề: "${cleanTopic}". Vào Phòng Tập Trung (#pomodoro) cùng mình nhé!`
          );
        } catch { /* ignore */ }

        saveStudyTogetherHandoff({
          partnerUid: targetUid,
          partnerName: name,
          topic: cleanTopic,
          durationMin: studyMins,
          openClassroom: true,
        });
      }

      setShowStudyPanel(false);
      onNavigateAway?.();
      if (!embedded) onClose?.();
      window.location.hash = '#pomodoro';
    } finally {
      setLaunchingStudy(false);
    }
  };

  const handleJoinStudyInvite = (invite) => {
    if (!invite) return;
    saveStudyTogetherHandoff({
      partnerUid: invite.hostUid && invite.hostUid !== meUid ? invite.hostUid : null,
      partnerName: invite.hostUid && invite.hostUid !== meUid ? invite.hostName : '',
      topic: invite.topic || 'Cùng tập trung ôn thi',
      durationMin: invite.durationMin || 25,
      openClassroom: true,
    });
    onNavigateAway?.();
    if (!embedded) onClose?.();
    window.location.hash = '#pomodoro';
  };

  const handlePinPost = async (post) => {
    if (!isMe) return;
    try {
      await togglePinWallPost(targetUid, posts, post.id);
      showToast(post.pinned ? 'Đã bỏ ghim bài viết' : 'Đã ghim lên đầu trang cá nhân');
    } catch {
      showToast('Không thể ghim lúc này');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const nextPosts = await deleteWallPost(targetUid, posts, postId);
      setPosts(nextPosts);
      showToast('Đã xóa bài viết');
    } catch {
      showToast('Xóa bài thất bại');
    }
  };

  const handleRepost = async (post) => {
    if (!meUid) {
      showToast('Đăng nhập để đăng lại');
      return;
    }
    try {
      await createWallPost(meUid, isMe ? posts : communityData.myPosts, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        text: post.text,
        bgId: post.bgId || 'none',
        mood: post.mood || '',
        studyInvite: post.studyInvite || null,
        repostOf: {
          authorUid: post.authorUid || post.ownerUid || targetUid,
          authorName: post.authorName || name,
          originalPostId: post.id,
        },
      });
      showToast(`Đã đăng lại bài của ${post.authorName || name}`);
    } catch {
      showToast('Không thể đăng lại lúc này');
    }
  };

  const handleSavePost = async (post) => {
    if (!meUid) {
      showToast('Đăng nhập để lưu bài');
      return;
    }
    const wasSaved = savedSet.has(post.id);
    try {
      await toggleSavePost(meUid, post.id);
      showToast(wasSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu vào mục Đã lưu');
    } catch {
      showToast('Lưu bài thất bại');
    }
  };

  const handleReactPost = async (post, reactionKey) => {
    if (!meUid) {
      showToast('Đăng nhập để thả tim');
      return;
    }
    try {
      await toggleWallPostReaction(post.ownerUid || targetUid, null, post.id, meUid, reactionKey);
    } catch {
      showToast('Không thể cập nhật cảm xúc');
    }
  };

  const handleSendComment = async (e, post) => {
    e.preventDefault();
    const txt = (commentDrafts[post.id] || '').trim();
    if (!meUid || !txt) return;
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
    setOpenComments((prev) => ({ ...prev, [post.id]: true }));
    try {
      await addWallPostComment(post.ownerUid || targetUid, null, post.id, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        text: txt,
      });
    } catch {
      showToast('Gửi trả lời thất bại');
    }
  };

  const handleSharePost = async (post) => {
    const shareTxt = post.studyInvite
      ? `${post.authorName} rủ học chung ${post.studyInvite.durationMin} phút trên ELEC AI: "${post.studyInvite.topic}"`
      : `${post.authorName} trên Cộng đồng ELEC:\n"${post.text || ''}"`;
    try {
      await navigator.clipboard.writeText(shareTxt);
      showToast('Đã sao chép nội dung bài viết');
    } catch {
      showToast('Đã sao chép');
    }
  };

  /* ── RENDER 1 BÀI VIẾT CHUẨN THREADS.COM ── */
  const renderThreadCard = (post, { fromSaved = false } = {}) => {
    const bgObj = POST_BACKGROUNDS.find((b) => b.id === post.bgId);
    const moodObj = POST_MOODS.find((m) => m.id && m.id === post.mood);
    const isColored = !!(bgObj?.css && !post.studyInvite && (post.text || '').length <= 240);

    const reactEntries = WALL_REACTIONS.map((r) => ({
      ...r,
      count: Object.keys(post.reactions?.[r.key] || {}).length,
    })).filter((r) => r.count > 0);
    const totalReacts = reactEntries.reduce((s, r) => s + r.count, 0);
    const myReact = WALL_REACTIONS.find((r) => meUid && post.reactions?.[r.key]?.[meUid]);

    const replies = Object.values(post.comments || {}).sort(
      (a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0)
    );
    const isOpen = !!openComments[post.id];
    const hasConnector = replies.length > 0 || isOpen;
    const isSaved = savedSet.has(post.id);
    const postAuthorUid = post.authorUid || post.ownerUid || targetUid;
    const postAuthorName = post.authorName || name;
    const canManage = !fromSaved && isMe && (post.ownerUid === meUid || post.authorUid === meUid || targetUid === meUid);

    return (
      <article key={`${post.ownerUid || targetUid}_${post.id}`} className="tp-post">
        {(post.pinned || post.repostOf) && (
          <div className="tp-ribbon">
            <TpIcon name={post.pinned ? 'pin' : 'repost'} size={12} filled={!!post.pinned} />
            <span>
              {post.pinned
                ? 'Đã ghim trên trang cá nhân'
                : `${postAuthorName} đã đăng lại từ ${post.repostOf.authorName}`}
            </span>
          </div>
        )}

        <div className="tp-grid">
          <div className="tp-rail">
            <StudentAvatar
              uid={postAuthorUid}
              name={postAuthorName}
              photoURL={post.authorPhoto || (postAuthorUid === meUid ? user?.photoURL : null)}
              size={38}
            />
            {hasConnector && <span className="tp-connector" aria-hidden="true" />}
            {replies.length > 0 && !isOpen && (
              <button
                type="button"
                className="tp-rail-mini"
                onClick={() => setOpenComments((p) => ({ ...p, [post.id]: true }))}
                title="Xem trả lời"
              >
                <StudentAvatar
                  uid={replies[replies.length - 1].authorUid}
                  name={replies[replies.length - 1].authorName}
                  photoURL={
                    replies[replies.length - 1].authorPhoto ||
                    (replies[replies.length - 1].authorUid === meUid ? user?.photoURL : null)
                  }
                  size={20}
                />
              </button>
            )}
          </div>

          <div className="tp-body">
            <div className="tp-post-head">
              <div className="tp-post-head-left">
                <span className="tp-post-author">
                  <b>{postAuthorName}</b>
                  <VerifiedBadge uid={postAuthorUid} size={14} />
                </span>
                <span className="tp-post-time">{fmtShortRel(post.createdAt, nowTick)}</span>
                {moodObj && (
                  <span className="tp-mood-pill">
                    {moodObj.mascot && <img src={moodObj.mascot} alt="" draggable={false} />}
                    <span>{moodObj.label}</span>
                  </span>
                )}
              </div>

              {canManage && (
                <div className="tp-post-head-right">
                  <button
                    type="button"
                    className={`tp-ico-btn ${post.pinned ? 'is-on' : ''}`}
                    onClick={() => handlePinPost(post)}
                    title={post.pinned ? 'Bỏ ghim' : 'Ghim bài'}
                  >
                    <TpIcon name="pin" size={14} filled={!!post.pinned} />
                  </button>
                  <button
                    type="button"
                    className="tp-ico-btn is-del"
                    onClick={() => handleDeletePost(post.id)}
                    title="Xóa bài"
                  >
                    <TpIcon name="trash" size={14} />
                  </button>
                </div>
              )}
            </div>

            {isColored ? (
              <div className={`tp-colored fbp-bg-${post.bgId}`} style={{ background: bgObj.css }}>
                <span className="tp-colored-txt">{post.text}</span>
                <span className="tp-colored-mark">© ELEC AI</span>
                <img
                  src={moodObj?.mascot || '/img/elec/elec-cool.png'}
                  alt="Bé Elec"
                  className="tp-colored-mascot"
                  draggable={false}
                />
              </div>
            ) : (
              post.text && (
                <p className="tp-text">
                  <RichPostText
                    text={post.text}
                    onClickTag={(tag) => {
                      setActiveTab('posts');
                      setTagFilter((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag));
                    }}
                  />
                </p>
              )
            )}

            {post.studyInvite && (
              <div className="tp-study-card">
                <img src="/img/elec/elec-fighting.png" alt="Bé Elec" className="tp-study-mascot" draggable={false} />
                <div className="tp-study-copy">
                  <span className="tp-study-kicker">
                    <TpIcon name="users" size={11} />
                    <span>HỌC CHUNG ELEC · {post.studyInvite.durationMin || 25} PHÚT</span>
                  </span>
                  <strong>{post.studyInvite.topic}</strong>
                </div>
                <button
                  type="button"
                  className="tp-study-join"
                  onClick={() => handleJoinStudyInvite(post.studyInvite)}
                >
                  <TpIcon name="play" size={11} filled />
                  <span>Vào học</span>
                </button>
              </div>
            )}

            <div className="tp-actions">
              <div className="tp-react-wrap">
                <div className="tp-react-dock" role="toolbar" aria-label="Chọn cảm xúc">
                  <div className="tp-react-dock-in">
                    {WALL_REACTIONS.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        className="tp-dock-dot"
                        style={{ background: r.color }}
                        title={r.label}
                        onClick={() => handleReactPost(post, r.key)}
                      >
                        <ReactionSvg type={r.key} size={13} filled />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`tp-act ${myReact ? 'is-liked' : ''}`}
                  style={myReact ? { color: myReact.key === 'love' ? '#ff3040' : myReact.color } : undefined}
                  onClick={() => handleReactPost(post, myReact ? myReact.key : 'love')}
                  title="Thích"
                >
                  <ReactionSvg type={myReact ? myReact.key : 'love'} size={18} filled={!!myReact} />
                  {totalReacts > 0 && <span>{totalReacts}</span>}
                </button>
              </div>

              <button
                type="button"
                className="tp-act"
                onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                title="Trả lời"
              >
                <TpIcon name="reply" size={18} />
                {replies.length > 0 && <span>{replies.length}</span>}
              </button>

              <button
                type="button"
                className="tp-act"
                onClick={() => handleRepost(post)}
                title="Đăng lại lên dòng thời gian của bạn"
              >
                <TpIcon name="repost" size={18} />
              </button>

              <button
                type="button"
                className={`tp-act ${isSaved ? 'is-saved' : ''}`}
                onClick={() => handleSavePost(post)}
                title={isSaved ? 'Bỏ lưu' : 'Lưu bài'}
              >
                <TpIcon name="bookmark" size={17} filled={isSaved} />
              </button>

              <button
                type="button"
                className="tp-act"
                onClick={() => handleSharePost(post)}
                title="Chia sẻ"
              >
                <TpIcon name="share" size={17} />
              </button>
            </div>

            {replies.length > 0 && !isOpen && (
              <button
                type="button"
                className="tp-reply-summary"
                onClick={() => setOpenComments((p) => ({ ...p, [post.id]: true }))}
              >
                {replies.length} câu trả lời{totalReacts > 0 ? ` · ${totalReacts} lượt thích` : ''}
              </button>
            )}

            {isOpen && (
              <div className="tp-replies">
                {replies.map((c) => (
                  <div key={c.id} className="tp-reply-item">
                    <StudentAvatar
                      uid={c.authorUid}
                      name={c.authorName}
                      photoURL={c.authorPhoto || (c.authorUid === meUid ? user?.photoURL : null)}
                      size={26}
                    />
                    <div className="tp-reply-content">
                      <div className="tp-reply-meta">
                        <b>{c.authorName}</b>
                        <span>{fmtShortRel(c.createdAt, nowTick)}</span>
                      </div>
                      <p>{c.text}</p>
                    </div>
                  </div>
                ))}
                {meUid && (
                  <form className="tp-reply-form" onSubmit={(e) => handleSendComment(e, post)}>
                    <StudentAvatar uid={meUid} name={meName} photoURL={user?.photoURL} size={26} />
                    <input
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={`Trả lời ${postAuthorName}…`}
                      maxLength={360}
                    />
                    <button type="submit" disabled={!(commentDrafts[post.id] || '').trim()}>
                      Đăng
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    );
  };

  /* ── KHUNG MỞ PHÒNG HỌC CHUNG GỌN NHẸ ── */
  const renderStudyLauncher = (inlineInTab = false) => (
    <form
      className={`tp-study-panel ${inlineInTab ? 'is-inline' : ''}`}
      onSubmit={handleLaunchStudyTogether}
    >
      <div className="tp-study-panel-head">
        <div>
          <span className="tp-kicker">PHÒNG HỌC CHUNG ELEC AI</span>
          <h4>{isMe ? 'Mở phòng học chung thời gian thực' : `Rủ ${name} vào học chung`}</h4>
          <p>
            {isMe
              ? 'Tự động đồng bộ đồng hồ Pomodoro tại #pomodoro để bạn bè vào ngồi học cùng.'
              : isFocusActiveNow
                ? `${name} đang tập trung — vào ngồi học chung ngay nhé!`
                : `Gửi thẻ lời mời thẳng qua tin nhắn 1:1 và mở Phòng Tập Trung cùng ${name}.`}
          </p>
        </div>
        {!inlineInTab && (
          <button
            type="button"
            className="tp-ico-btn"
            onClick={() => setShowStudyPanel(false)}
            aria-label="Đóng"
          >
            <TpIcon name="x" size={16} />
          </button>
        )}
      </div>

      <div className="tp-mins-seg">
        {[
          { m: 25, tag: 'Chuẩn' },
          { m: 45, tag: 'Chuyên sâu' },
          { m: 60, tag: 'Cày đề' },
        ].map((opt) => (
          <button
            key={opt.m}
            type="button"
            className={`tp-min-btn ${studyMins === opt.m ? 'is-active' : ''}`}
            onClick={() => setStudyMins(opt.m)}
          >
            <TpIcon name="clock" size={13} />
            <b>{opt.m} phút</b>
            <span>{opt.tag}</span>
          </button>
        ))}
      </div>

      <input
        className="tp-clean-input"
        maxLength={120}
        value={studyTopic}
        onChange={(e) => setStudyTopic(e.target.value)}
        placeholder={
          isFocusActiveNow && focusLive?.task
            ? focusLive.task
            : 'Chủ đề phiên học (VD: Luyện đề Hóa Este - Lipit, Cày đề Vật lí…)'
        }
      />

      <div className="tp-presets-row">
        {['Cày đề THPTQG', 'Ôn Hóa học 12', 'Ôn Vật lí', 'Giải bài tập cùng nhau'].map((preset) => (
          <button
            key={preset}
            type="button"
            className={`tp-preset ${studyTopic === preset ? 'is-active' : ''}`}
            onClick={() => setStudyTopic(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="tp-study-panel-foot">
        {isMe ? (
          <label className="tp-check">
            <input
              type="checkbox"
              checked={studyPostToWall}
              onChange={(e) => setStudyPostToWall(e.target.checked)}
            />
            <span>Đăng thẻ rủ học chung lên bảng tin</span>
          </label>
        ) : (
          <span className="tp-hint-line">
            <TpIcon name="reply" size={13} />
            <span>Tự động nhắn lời mời tới {name}</span>
          </span>
        )}
        <button type="submit" className="tp-primary-pill" disabled={launchingStudy}>
          <TpIcon name="play" size={11} filled />
          <span>{launchingStudy ? 'Đang mở…' : isMe ? 'Bắt đầu học chung' : 'Rủ học chung'}</span>
        </button>
      </div>
    </form>
  );

  const modalBody = (
    <div className={`fbp-modal tp-shell ${embedded ? 'is-embedded' : ''}`} onClick={(e) => e.stopPropagation()}>
      {!embedded && (
        <button type="button" className="tp-modal-close" onClick={onClose} aria-label="Đóng">
          <TpIcon name="x" size={17} sw={2.2} />
        </button>
      )}

      <div className="tp-scroll">
        {/* 1. DẢI ACCENT THƯƠNG HIỆU MẢNH TINH TẾ (KHÔNG CỒNG KỀNH) */}
        <div className="tp-banner" style={{ background: activeCover.css }}>
          <svg className="tp-banner-art" viewBox="0 0 360 120" fill="none" aria-hidden="true">
            <ellipse cx="260" cy="60" rx="115" ry="36" stroke="currentColor" strokeWidth="1.1" transform="rotate(-16 260 60)" />
            <ellipse cx="260" cy="60" rx="115" ry="36" stroke="currentColor" strokeWidth="1.1" transform="rotate(20 260 60)" />
            <circle cx="260" cy="60" r="6" fill="currentColor" opacity="0.45" />
          </svg>

          <span className="tp-banner-mark">
            <TpIcon name="elec" size={11} />
            <span>© ELEC SCIENCE AI</span>
          </span>

          {isMe && (
            <div className="tp-banner-actions">
              <button
                type="button"
                className="tp-banner-btn"
                onClick={() => setShowCoverPicker((p) => !p)}
              >
                <TpIcon name="palette" size={13} />
                <span>Đổi màu</span>
              </button>
              {showCoverPicker && (
                <div className="tp-cover-pop" role="group" aria-label="Chọn màu dải bìa ELEC">
                  {COVER_THEMES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`tp-cover-dot ${activeCover.id === c.id ? 'is-active' : ''}`}
                      style={{ background: c.css }}
                      title={c.name}
                      onClick={() => handleCoverChange(c.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. PHẦN ĐẦU HỒ SƠ CHUẨN THREADS.COM (TÊN & BIO TRÁI · AVATAR PHẢI) */}
        <header className="tp-hero">
          <div className="tp-hero-top">
            <div className="tp-hero-info">
              <div className="tp-name-row">
                <h2 className="tp-name">{name}</h2>
                <VerifiedBadge uid={targetUid} size={17} />
                {isMeAdmin ? (
                  <span className="tp-tier-pill is-admin">
                    <span>ADMIN</span>
                  </span>
                ) : (
                  <span className={`tp-tier-pill ${isVip ? 'is-vip' : ''}`}>
                    <TpIcon name={isVip ? 'crown' : 'elec'} size={10} />
                    <span>{isVip ? 'VIP PRO' : 'ELEC'}</span>
                  </span>
                )}
              </div>

              <div className="tp-submeta">
                <span>{roleLabel}</span>
                {ext?.grade && (
                  <>
                    <span className="tp-dot">·</span>
                    <span>{ext.grade}</span>
                  </>
                )}
                {ext?.school && (
                  <>
                    <span className="tp-dot">·</span>
                    <span>{ext.school}</span>
                  </>
                )}
                {ext?.targetUni && (
                  <>
                    <span className="tp-dot">·</span>
                    <span>
                      Mục tiêu {ext.targetUni}
                      {ext.targetScore ? ` (${ext.targetScore})` : ''}
                    </span>
                  </>
                )}
              </div>

              {/* Chip nhận diện đồng bộ từ Trang cá nhân gốc (#profile) */}
              <div className="tp-profile-tags">
                <span className="tp-profile-tag is-blue">Khoa học Tự nhiên · GDPT 2025</span>
                <span className="tp-profile-tag">{elecCode}</span>
              </div>
            </div>

            <div className={`tp-hero-avatar ${isFocusActiveNow ? 'is-focusing' : ''}`}>
              <StudentAvatar uid={targetUid} name={name} photoURL={avatarPhoto} size={74} />
              {(isLive || isFocusActiveNow) && (
                <span
                  className="tp-av-dot"
                  title={isFocusActiveNow ? 'Đang tập trung trực tiếp' : 'Đang đồng bộ thời gian thực'}
                />
              )}
            </div>
          </div>

          {/* TIỂU SỬ (BIO) */}
          {ext?.bio ? (
            <p className="tp-bio">{ext.bio}</p>
          ) : isMe ? (
            <button
              type="button"
              className="tp-bio-add"
              onClick={() => {
                setEditing(true);
                setEditingNote(false);
                setShowStudyPanel(false);
              }}
            >
              + Thêm tiểu sử để giới thiệu mục tiêu học tập của bạn…
            </button>
          ) : null}

          {/* CAP MESSENGER 24H INLINE (GỌN ĐẸP, ĐỒNG BỘ MESSENGER) */}
          {(note24hActive || isMe) && (
            <div className="tp-note-row">
              <button
                type="button"
                className={`tp-note-pill ${note24hActive ? 'has-note' : 'is-empty'} ${isMe ? 'is-editable' : ''}`}
                onClick={isMe ? openInlineNoteEditor : undefined}
                title={isMe ? 'Bấm để cập nhật Cap Messenger 24h' : note24hActive}
              >
                <img src={note24hMascotSrc} alt="" draggable={false} />
                <span className="tp-note-label">Cap 24h:</span>
                <span className="tp-note-txt">
                  {note24hActive || 'Chia sẻ suy nghĩ 24h lên Messenger…'}
                </span>
                {isMe && <TpIcon name="edit" size={12} />}
              </button>
            </div>
          )}

          {/* FORM SỬA CAP 24H NHANH */}
          {isMe && editingNote && (
            <form className="tp-note-editor" onSubmit={handleSaveQuickNote}>
              <div className="tp-note-mascots">
                {NOTE_MASCOTS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`tp-nm-btn ${noteMascot === m.id ? 'is-active' : ''}`}
                    title={m.label}
                    onClick={() => setNoteMascot(m.id)}
                  >
                    <img src={m.src} alt={m.label} draggable={false} />
                  </button>
                ))}
              </div>
              <div className="tp-note-editor-row">
                <input
                  className="tp-clean-input"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  maxLength={60}
                  autoFocus
                  placeholder="Viết Cap 24h hiển thị trên avatar & Messenger…"
                />
                {note24hActive && (
                  <button
                    type="button"
                    className="tp-ghost-btn"
                    onClick={handleClearQuickNote}
                    disabled={savingNote}
                  >
                    Gỡ
                  </button>
                )}
                <button type="submit" className="tp-primary-pill" disabled={savingNote}>
                  {savingNote ? 'Lưu…' : 'Chia sẻ'}
                </button>
              </div>
            </form>
          )}

          {/* TRẠNG THÁI ĐANG TẬP TRUNG THỜI GIAN THỰC */}
          {isFocusActiveNow && (
            <button
              type="button"
              className="tp-focus-bar"
              onClick={() => {
                setStudyTopic(focusLive?.task || '');
                setShowStudyPanel(true);
                setEditing(false);
              }}
            >
              <span className="tp-focus-dot" />
              <span className="tp-focus-txt">
                Đang tập trung{focusLive.task ? ` · ${focusLive.task}` : ''}
              </span>
              <span className="tp-focus-cta">Học cùng →</span>
            </button>
          )}

          {/* CHỈ SỐ TỐI GIẢN CHUẨN THREADS */}
          <div className="tp-metrics">
            <button type="button" onClick={() => setActiveTab('posts')}>
              <b>{posts.length}</b> bài viết
            </button>
            <span className="tp-dot">·</span>
            <span>
              <b>{totalProfileLikes}</b> lượt thích
            </span>
            <span className="tp-dot">·</span>
            <button type="button" onClick={() => setActiveTab('overview')}>
              <b>{streakVal} ngày</b> chuỗi học
            </button>
            <span className="tp-dot">·</span>
            <span>
              <b>{pokeCount}</b> cổ vũ
            </span>
          </div>

          {/* HÀNG NÚT HÀNH ĐỘNG ĐỐI XỨNG CHUẨN THREADS */}
          {!anonymous && (
            <div className="tp-cta-row">
              {isMe ? (
                <>
                  <button
                    type="button"
                    className={`tp-cta-btn ${editing ? 'is-solid' : ''}`}
                    onClick={() => {
                      setEditing((v) => !v);
                      setShowStudyPanel(false);
                      setEditingNote(false);
                    }}
                  >
                    <TpIcon name="edit" size={14} />
                    <span>{editing ? 'Đóng chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
                  </button>
                  <button
                    type="button"
                    className={`tp-cta-btn is-accent ${showStudyPanel ? 'is-solid' : ''}`}
                    onClick={() => {
                      setShowStudyPanel((v) => !v);
                      setEditing(false);
                      setEditingNote(false);
                    }}
                  >
                    <TpIcon name="users" size={14} />
                    <span>Học chung</span>
                  </button>
                  <button
                    type="button"
                    className="tp-cta-btn is-compact"
                    onClick={() => openFullProfileTab('overview')}
                    title="Mở trang Hồ sơ #profile toàn màn hình"
                  >
                    <TpIcon name="elec" size={13} />
                    <span>Hồ sơ đầy đủ</span>
                  </button>
                  <button
                    type="button"
                    className="tp-cta-btn is-compact"
                    onClick={handleShareProfile}
                    title="Sao chép thẻ hồ sơ"
                  >
                    <TpIcon name="share" size={14} />
                  </button>
                </>
              ) : (
                <>
                  {status === 'friends' ? (
                    <button
                      type="button"
                      className="tp-cta-btn"
                      onClick={handleFriend}
                      disabled={busy}
                      title="Bấm để hủy kết bạn"
                    >
                      <TpIcon name="check" size={14} />
                      <span>Bạn bè</span>
                    </button>
                  ) : status === 'requested' ? (
                    <button type="button" className="tp-cta-btn" disabled>
                      Đã gửi lời mời
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="tp-cta-btn is-solid"
                      onClick={handleFriend}
                      disabled={!user || busy}
                    >
                      <TpIcon name={status === 'incoming' ? 'check' : 'add'} size={14} />
                      <span>{status === 'incoming' ? 'Chấp nhận' : 'Kết bạn'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="tp-cta-btn"
                    onClick={handleDm}
                    disabled={!user || busy}
                  >
                    <TpIcon name="reply" size={14} />
                    <span>Nhắn tin</span>
                  </button>

                  <button
                    type="button"
                    className={`tp-cta-btn is-accent ${showStudyPanel ? 'is-solid' : ''}`}
                    onClick={() => setShowStudyPanel((v) => !v)}
                    disabled={!user}
                  >
                    <TpIcon name="users" size={14} />
                    <span>{isFocusActiveNow ? 'Vào học' : 'Học chung'}</span>
                  </button>

                  <button
                    type="button"
                    className={`tp-cta-btn is-cheer ${pokedByMe ? 'is-cheered' : ''}`}
                    onClick={handlePoke}
                    disabled={!user}
                    title="Gửi cổ vũ học tập"
                  >
                    <TpIcon name="flame" size={14} filled={pokedByMe} />
                    <span>{pokedByMe ? 'Đã cổ vũ' : 'Cổ vũ'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        {/* PANEL MỞ PHÒNG HỌC CHUNG (KHI BẤM NÚT HỌC CHUNG Ở HERO) */}
        {meUid && !anonymous && showStudyPanel && activeTab !== 'study' && renderStudyLauncher(false)}

        {/* FORM CHỈNH SỬA HỒ SƠ TINH GỌN */}
        {isMe && editing && (
          <form className="tp-edit-drawer" onSubmit={handleSaveProfile}>
            <div className="tp-drawer-head">
              <h4>Chỉnh sửa trang cá nhân</h4>
              <button type="button" className="tp-ico-btn" onClick={() => setEditing(false)}>
                <TpIcon name="x" size={15} />
              </button>
            </div>

            <div className="tp-edit-grid">
              <div className="tp-field is-full">
                <label>Tiểu sử ({editForm.bio.length}/160)</label>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Giới thiệu ngắn về bản thân và mục tiêu học tập trên ELEC AI…"
                />
              </div>
              <div className="tp-field is-full">
                <label>Cap Messenger 24h ({editForm.note24h.length}/60)</label>
                <input
                  maxLength={60}
                  value={editForm.note24h}
                  onChange={(e) => setEditForm((f) => ({ ...f, note24h: e.target.value }))}
                  placeholder="VD: Đang luyện đề Este - Lipit, ai học chung không?"
                />
              </div>
              <div className="tp-field">
                <label>Trường học</label>
                <input
                  maxLength={80}
                  value={editForm.school}
                  onChange={(e) => setEditForm((f) => ({ ...f, school: e.target.value }))}
                  placeholder="VD: THPT Đông Thụy Anh"
                />
              </div>
              <div className="tp-field">
                <label>Lớp / Khối</label>
                <input
                  maxLength={24}
                  value={editForm.grade}
                  onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))}
                  placeholder="VD: 12A1"
                />
              </div>
              <div className="tp-field">
                <label>Nguyện vọng Đại học</label>
                <input
                  maxLength={80}
                  value={editForm.targetUni}
                  onChange={(e) => setEditForm((f) => ({ ...f, targetUni: e.target.value }))}
                  placeholder="VD: ĐH Bách Khoa Hà Nội"
                />
              </div>
              <div className="tp-field">
                <label>Mục tiêu điểm</label>
                <input
                  maxLength={20}
                  value={editForm.targetScore}
                  onChange={(e) => setEditForm((f) => ({ ...f, targetScore: e.target.value }))}
                  placeholder="VD: 27.5+"
                />
              </div>
            </div>

            <div className="tp-drawer-foot">
              <button type="button" className="tp-ghost-btn" onClick={() => setEditing(false)}>
                Hủy
              </button>
              <button type="submit" className="tp-primary-pill" disabled={savingEdit}>
                {savingEdit ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}

        {/* 3. THANH 4 TAB ĐỒNG BỘ #PROFILE & CỘNG ĐỒNG ELEC */}
        <nav className="tp-tabs" role="tablist" aria-label="Mục trang cá nhân">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`tp-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'posts'}
            className={`tp-tab ${activeTab === 'posts' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <span>Bài viết</span>
            {posts.length > 0 && <em className="tp-tab-count">{posts.length}</em>}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'study'}
            className={`tp-tab ${activeTab === 'study' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('study')}
          >
            <span>Học chung</span>
            {studyPosts.length > 0 && <em className="tp-tab-count">{studyPosts.length}</em>}
          </button>

          {isMe ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              className={`tp-tab ${activeTab === 'saved' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <span>Đã lưu</span>
              {savedPostsList.length > 0 && <em className="tp-tab-count">{savedPostsList.length}</em>}
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reposts'}
              className={`tp-tab ${activeTab === 'reposts' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reposts')}
            >
              <span>Đăng lại</span>
              {repostedPosts.length > 0 && <em className="tp-tab-count">{repostedPosts.length}</em>}
            </button>
          )}
        </nav>

        {/* 4. NỘI DUNG TỪNG TAB */}
        {activeTab === 'posts' && (
          <div className="tp-feed-section">
            {/* KHUNG ĐĂNG CAP CHỮ KHÔNG VIỀN NGAY ĐẦU TRANG CÁ NHÂN (CHỈ CHỦ TÀI KHOẢN) */}
            {isMe && !anonymous && (
              <form className="tp-composer" onSubmit={handleCreatePost}>
                <div className="tp-grid">
                  <div className="tp-rail">
                    <StudentAvatar uid={meUid} name={meName} photoURL={user?.photoURL} size={38} />
                  </div>
                  <div className="tp-body">
                    <div className="tp-composer-top">
                      <b>{meName}</b>
                      {activeMoodObj && (
                        <span className="tp-mood-pill">
                          {activeMoodObj.mascot && <img src={activeMoodObj.mascot} alt="" draggable={false} />}
                          <span>{activeMoodObj.label}</span>
                          <button type="button" onClick={() => setCapMood('')} aria-label="Bỏ linh vật">
                            <TpIcon name="x" size={11} />
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="tp-ta-wrap">
                      <textarea
                        ref={composerRef}
                        className={`tp-ta ${composerBgClass}`}
                        style={isBgActive ? { background: activeBgObj.css } : undefined}
                        rows={
                          isBgActive
                            ? 3
                            : capText.includes('\n') || capText.length > 68
                              ? 2
                              : 1
                        }
                        value={capText}
                        maxLength={800}
                        onChange={(e) => setCapText(e.target.value)}
                        placeholder={
                          capStudyEnabled
                            ? 'Viết lời rủ học chung lên tường của bạn…'
                            : 'Có gì mới? Chia sẻ mục tiêu học tập hôm nay…'
                        }
                      />
                      {isBgActive && (
                        <img
                          src={activeMoodObj?.mascot || '/img/elec/elec-cool.png'}
                          alt=""
                          className="tp-ta-mascot"
                          draggable={false}
                        />
                      )}
                    </div>

                    {capStudyEnabled && (
                      <div className="tp-inline-study">
                        <div className="tp-inline-study-top">
                          <span>Thẻ Rủ học chung</span>
                          <div className="tp-inline-mins">
                            {[25, 45, 60].map((m) => (
                              <button
                                key={m}
                                type="button"
                                className={capStudyMins === m ? 'is-active' : ''}
                                onClick={() => setCapStudyMins(m)}
                              >
                                {m}p
                              </button>
                            ))}
                          </div>
                          <button type="button" className="tp-ico-btn" onClick={() => setCapStudyEnabled(false)}>
                            <TpIcon name="x" size={12} />
                          </button>
                        </div>
                        <input
                          className="tp-clean-input"
                          maxLength={120}
                          value={capStudyTopic}
                          onChange={(e) => setCapStudyTopic(e.target.value)}
                          placeholder="Chủ đề phiên học (VD: Ôn Este - Lipit, Cày đề Vật lí…)"
                        />
                      </div>
                    )}

                    {showBgPicker && !capStudyEnabled && (
                      <div className="tp-bg-row">
                        {POST_BACKGROUNDS.map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            className={`tp-bg-dot ${capBg === bg.id ? 'is-active' : ''}`}
                            style={{ background: bg.css || '#ffffff' }}
                            title={bg.label}
                            onClick={() => setCapBg(bg.id)}
                          />
                        ))}
                      </div>
                    )}

                    <div className="tp-composer-foot">
                      <div className="tp-composer-tools">
                        <button
                          type="button"
                          className={`tp-tool ${showBgPicker || capBg !== 'none' ? 'is-active' : ''}`}
                          onClick={() => {
                            setShowBgPicker((v) => !v);
                            setShowMoodMenu(false);
                          }}
                        >
                          <span
                            className="tp-color-wheel"
                            style={{
                              background:
                                POST_BACKGROUNDS.find((b) => b.id === capBg)?.css ||
                                'linear-gradient(135deg, #0058cc, #38bdf8, #8b5cf6)',
                            }}
                          />
                          <span>Nền màu</span>
                        </button>

                        <button
                          type="button"
                          className={`tp-tool ${capStudyEnabled ? 'is-active' : ''}`}
                          onClick={() => {
                            setCapStudyEnabled((prev) => {
                              const next = !prev;
                              if (next) {
                                setCapBg('none');
                                setShowBgPicker(false);
                              }
                              return next;
                            });
                          }}
                        >
                          <TpIcon name="users" size={14} />
                          <span>Học chung</span>
                        </button>

                        <button
                          type="button"
                          className={`tp-tool ${showMoodMenu || capMood ? 'is-active' : ''}`}
                          onClick={() => {
                            setShowMoodMenu((p) => !p);
                            setShowBgPicker(false);
                          }}
                        >
                          <img
                            src={activeMoodObj?.mascot || '/img/elec/elec-happy.png'}
                            alt=""
                            className="tp-tool-img"
                            draggable={false}
                          />
                          <span>Bé Elec</span>
                        </button>

                        {showMoodMenu && (
                          <div className="tp-mood-pop" role="menu">
                            {POST_MOODS.map((m) => (
                              <button
                                key={m.id || 'none'}
                                type="button"
                                className={`tp-mood-opt ${capMood === m.id ? 'is-selected' : ''}`}
                                onClick={() => {
                                  setCapMood(m.id);
                                  setShowMoodMenu(false);
                                }}
                              >
                                {m.mascot ? (
                                  <img src={m.mascot} alt="" draggable={false} />
                                ) : (
                                  <TpIcon name="x" size={14} />
                                )}
                                <span>{m.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="tp-primary-pill"
                        disabled={posting || (!capText.trim() && !capStudyEnabled)}
                      >
                        {posting ? 'Đang đăng…' : 'Đăng'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {tagFilter && (
              <div className="tp-filter-banner">
                <span>
                  Đang lọc theo <b>{tagFilter}</b>
                </span>
                <button type="button" onClick={() => setTagFilter('')}>
                  Xóa lọc
                </button>
              </div>
            )}

            {loadingPosts ? (
              <div className="tp-empty">
                <img src="/img/elec/elec-think.png" alt="Bé Elec" draggable={false} />
                <span>Đang đồng bộ dòng thời gian…</span>
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="tp-empty">
                <img src="/img/elec/elec-hello.png" alt="Bé Elec" draggable={false} />
                <b>{tagFilter ? `Không có bài viết nào chứa ${tagFilter}` : 'Chưa có bài viết nào'}</b>
                <span>
                  {isMe
                    ? 'Viết dòng đầu tiên vào ô “Có gì mới?” ngay phía trên để chia sẻ mục tiêu học tập.'
                    : `${name} chưa đăng bài viết nào trên Cộng đồng ELEC.`}
                </span>
              </div>
            ) : (
              <div className="tp-stream">{visiblePosts.map((p) => renderThreadCard(p))}</div>
            )}
          </div>
        )}

        {activeTab === 'study' && (
          <div className="tp-tab-pad">
            {meUid && !anonymous && renderStudyLauncher(true)}

            <div className="tp-section-kicker">
              Lời rủ học chung của {isMe ? 'bạn' : name} ({studyPosts.length})
            </div>

            {studyPosts.length === 0 ? (
              <div className="tp-empty">
                <img src="/img/elec/elec-fighting.png" alt="Bé Elec" draggable={false} />
                <b>Chưa có thẻ Học chung nào</b>
                <span>Mở một phiên Pomodoro phía trên để rủ bạn bè cùng tập trung nhé!</span>
              </div>
            ) : (
              <div className="tp-stream">{studyPosts.map((p) => renderThreadCard(p))}</div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="tp-stats-wrap">
            {/* ĐỒNG BỘ 100% TRANG CÁ NHÂN #PROFILE (SPATIAL PEARL + ROYAL COBALT ATLAS) */}
            {isMe && (
              <div className="tp-atlas-host">
                <ProfileAtlasDashboard
                  uid={meUid || 'guest'}
                  credits={atlasCredits}
                  isPro={isVip}
                  tierLabel={isMeAdmin ? 'ELEC VIP' : tier.name}
                  currentStreak={streakVal}
                  examHistory={atlasExamHistory}
                  classes={atlasClasses}
                  friends={atlasFriends}
                  favIds={atlasFavIds}
                  heartsCount={atlasQuota.heartsCount}
                  maxHeartsCount={atlasQuota.maxHeartsCount}
                  isTeacher={roleLabel === 'Giáo viên'}
                  createdAt={user?.metadata?.creationTime || ext?.createdAt || null}
                  onSelectTab={(tabKey) => openFullProfileTab(tabKey || 'overview')}
                  onOpenCreditTopUp={() => {
                    window.dispatchEvent(new CustomEvent('elec-open-credit-topup'));
                  }}
                  onScrollToAbilityHub={() => openFullProfileTab('achievements')}
                />
              </div>
            )}

            {/* THẺ CẤP ĐỘ & XP CÓ LINH VẬT BÉ ELEC (DÀNH CHO HỒ SƠ BẠN BÈ HOẶC TỔNG HỢP NHANH) */}
            {!isMe && (
              <>
                <div className="tp-level-card">
                  <div className="tp-level-left">
                    <span className="tp-kicker">{tier.name} · {roleLabel}</span>
                    <div className="tp-level-title">
                      <strong>Cấp độ Lv.{levelVal}</strong>
                      <span>{Number(xpVal).toLocaleString('vi-VN')} XP</span>
                    </div>
                    <div className="tp-xp-track" aria-label="Tiến trình XP">
                      <div className="tp-xp-fill" style={{ width: `${xpPct}%` }} />
                    </div>
                    <small>
                      Còn {xpCycle - xpInLevel} XP nữa để chạm mốc tiếp theo · {fmtJoinDate(ext?.createdAt)}
                    </small>
                  </div>
                  <img
                    src={isVip ? '/img/elec/elec-super-saiyan.png' : '/img/elec/elec-cool.png'}
                    alt="Bé Elec"
                    className="tp-level-mascot"
                    draggable={false}
                  />
                </div>

                <div className="tp-kpi-grid">
                  <div className="tp-kpi">
                    <span className="tp-kpi-ico"><TpIcon name="zap" size={16} /></span>
                    <b>Lv.{levelVal}</b>
                    <small>Cấp độ</small>
                  </div>
                  <div className="tp-kpi">
                    <span className="tp-kpi-ico"><TpIcon name="star" size={16} /></span>
                    <b>{Number(xpVal).toLocaleString('vi-VN')}</b>
                    <small>Điểm XP</small>
                  </div>
                  <div className="tp-kpi">
                    <span className="tp-kpi-ico"><TpIcon name="flame" size={16} /></span>
                    <b>{streakVal} ngày</b>
                    <small>Chuỗi học</small>
                  </div>
                  <div className="tp-kpi">
                    <span className="tp-kpi-ico"><TpIcon name="target" size={16} /></span>
                    <b>{accVal != null ? `${accVal}%` : 'Mới'}</b>
                    <small>Độ chính xác</small>
                  </div>
                </div>
              </>
            )}

            {/* HỒ SƠ HỌC VẤN & MỤC TIÊU */}
            <div className="tp-info-block">
              <div className="tp-block-head">
                <h4>Thông tin học tập</h4>
                {isMe && (
                  <button
                    type="button"
                    className="tp-link-btn"
                    onClick={() => {
                      setEditing(true);
                      setActiveTab('posts');
                    }}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
              <div className="tp-info-list">
                <div className="tp-info-row">
                  <TpIcon name="school" size={15} />
                  <span>
                    Trường &amp; Lớp: <b>{[ext?.grade, ext?.school].filter(Boolean).join(' · ') || 'Chưa cập nhật'}</b>
                  </span>
                </div>
                <div className="tp-info-row">
                  <TpIcon name="target" size={15} />
                  <span>
                    Nguyện vọng: <b>{ext?.targetUni ? `${ext.targetUni}${ext.targetScore ? ` (${ext.targetScore})` : ''}` : 'Chưa cập nhật'}</b>
                  </span>
                </div>
                <div className="tp-info-row">
                  <TpIcon name="clock" size={15} />
                  <span>
                    Tham gia: <b>{fmtJoinDate(ext?.createdAt)}</b>
                  </span>
                </div>
              </div>
            </div>

            {/* BỘ SƯU TẬP HUY HIỆU BÉ ELEC */}
            <div className="tp-info-block">
              <div className="tp-block-head">
                <h4>Huy hiệu Bé Elec ({earnedBadges.length})</h4>
              </div>
              <div className="tp-badges-grid">
                {earnedBadges.map((b) => (
                  <div key={b.label} className="tp-badge-card">
                    <img src={b.mascot} alt={b.label} draggable={false} />
                    <div>
                      <b>{b.label}</b>
                      <span>{b.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && isMe && (
          <div className="tp-feed-section">
            {savedPostsList.length === 0 ? (
              <div className="tp-empty">
                <img src="/img/elec/elec-think.png" alt="Bé Elec" draggable={false} />
                <b>Chưa có bài viết đã lưu</b>
                <span>Bấm biểu tượng đánh dấu trên các bài viết ở Dành cho bạn để lưu lại xem sau.</span>
              </div>
            ) : (
              <div className="tp-stream">{savedPostsList.map((p) => renderThreadCard(p, { fromSaved: true }))}</div>
            )}
          </div>
        )}

        {activeTab === 'reposts' && !isMe && (
          <div className="tp-feed-section">
            {repostedPosts.length === 0 ? (
              <div className="tp-empty">
                <img src="/img/elec/elec-hello.png" alt="Bé Elec" draggable={false} />
                <b>Chưa có bài đăng lại nào</b>
                <span>Các bài viết {name} đăng lại trên Cộng đồng ELEC sẽ hiển thị tại đây.</span>
              </div>
            ) : (
              <div className="tp-stream">{repostedPosts.map((p) => renderThreadCard(p))}</div>
            )}
          </div>
        )}

        <footer className="tp-footer">
          <img src="/img/elec/elec-cool.png" alt="ELEC AI" draggable={false} />
          <span>© 2026 ELEC Science AI · Hồ sơ học tập chính chủ</span>
        </footer>
      </div>

      {toastMsg && <div className="tp-toast">{toastMsg}</div>}
    </div>
  );

  if (embedded) return modalBody;

  return (
    <div
      className="fbp-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Trang cá nhân ${name}`}
    >
      {modalBody}
    </div>
  );
}
