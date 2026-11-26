/* ============================================================================
   SocialFeedPanel.jsx — Cộng đồng ELEC (Ranking Xu Hướng · Q&A · Kiểm duyệt · SEO)
   ----------------------------------------------------------------------------
   - Thuật toán xếp hạng Xu hướng (Gravity Time-Decay + Cold-Start + Diversity)
   - Phân loại bài viết có cấu trúc: Thảo luận · Hỏi bài KHTN · Mẹo học hay · Học chung
   - Nền màu thương hiệu ELEC hoạt động chuẩn 100% khi soạn & khi hiển thị
   - Lời giải chuẩn (Best Answer -> Schema QAPage SEO), Báo cáo vi phạm,
     và bộ công cụ Quản trị nhanh cho Admin (Đẩy Xu Hướng · Ghim Toàn Cộng Đồng · Ẩn/Xóa)
   ============================================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { isAdmin } from '../../lib/isAdmin.js';
import { openDm, sendDmMessage } from '../../lib/social.js';
import {
  POST_BACKGROUNDS,
  POST_CATEGORIES,
  POST_MOODS,
  WALL_REACTIONS,
  TRENDING_HASHTAGS,
  rankCommunityPosts,
  evaluateSeoQuality,
  subscribeCommunityFeed,
  createWallPost,
  deleteWallPost,
  togglePinWallPost,
  toggleSavePost,
  toggleWallPostReaction,
  addWallPostComment,
  reportWallPost,
  markBestReply,
  adminToggleFeaturePost,
  adminToggleGlobalPinPost,
  adminToggleHidePost,
  saveStudyTogetherHandoff,
} from '../../lib/socialWall.js';
import {
  hasEveryoneMention,
  MENTION_SPLIT_RE,
  checkEveryoneCooldown,
  markEveryoneCooldown,
  broadcastEveryoneMention,
} from '../../lib/mentionPush.js';
import VerifiedBadge from '../VerifiedBadge.jsx';
import StudentAvatar from '../StudentAvatar.jsx';
import ProfileCard from './ProfileCard.jsx';
import StudyTogetherRoom from './StudyTogetherRoom.jsx';

/* ── 100% VECTOR SVG ICONS (ZERO UNICODE EMOJI) ── */
function ThIcon({ name, size = 18, filled = false, sw = 1.8 }) {
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
    case 'search':
      return <svg {...props}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
    case 'users':
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="3.5" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" /></svg>;
    case 'play':
      return <svg {...props} fill="currentColor" stroke="none"><path d="M7 5.2v13.6a1 1 0 0 0 1.52.85l10.6-6.8a1 1 0 0 0 0-1.7L8.52 4.35A1 1 0 0 0 7 5.2z" /></svg>;
    case 'pin':
      return <svg {...props}><path d="M12 17v5M9 4h6l1 6 3 2v2H5v-2l3-2 1-6z" /></svg>;
    case 'trash':
      return <svg {...props}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
    case 'back':
      return <svg {...props}><path d="M15 18l-6-6 6-6" /></svg>;
    case 'x':
      return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'flag':
      return <svg {...props}><path d="M4 21V4" /><path d="M4 5h12l-2 4 2 4H4" /></svg>;
    case 'eyeOff':
      return <svg {...props}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M1 1l22 22" /></svg>;
    case 'check':
      return <svg {...props}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case 'zap':
      return <svg {...props}><path d="M13 2 4 14h7l-1 8 10-12h-7l0-8z" /></svg>;
    case 'globe':
      return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" /></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 3l7 3v5c0 5-3.2 8.8-7 10-3.8-1.2-7-5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'bell':
      return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case 'at':
      return <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" /></svg>;
    default:
      return null;
  }
}

function ReactionSvg({ type, size = 16, filled = true }) {
  const map = { like: 'like', love: 'heart', fire: 'flame', star: 'star' };
  return <ThIcon name={map[type] || 'heart'} size={size} filled={filled} />;
}

function RichThreadText({ text = '', onClickTag }) {
  const mentionChunks = String(text || '').split(MENTION_SPLIT_RE);
  return mentionChunks.map((chunk, mIdx) => {
    if (MENTION_SPLIT_RE.test(chunk)) {
      MENTION_SPLIT_RE.lastIndex = 0;
      return (
        <span key={`m-${mIdx}`} className="elec-mention-pill" title="Nhắc toàn bộ Cộng đồng ELEC">
          {chunk}
        </span>
      );
    }
    const parts = chunk.split(/(#[A-Za-z0-9_\u00C0-\u1EF9]+)/g);
    return parts.map((part, idx) =>
      part.startsWith('#') && part.length > 1 ? (
        <button
          key={`${mIdx}-${idx}`}
          type="button"
          className="th-hashtag"
          onClick={(e) => {
            e.stopPropagation();
            onClickTag?.(part);
          }}
        >
          {part}
        </button>
      ) : (
        <span key={`${mIdx}-${idx}`}>{part}</span>
      )
    );
  });
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

export default function SocialFeedPanel({
  profileTarget,
  onSelectProfile,
  onClearProfile,
  onOpenDm,
  onNavigateAway,
}) {
  const { user } = useAuth();
  const meUid = user?.uid || null;
  const meName = user?.displayName || 'Thành viên ELEC';
  const meIsAdmin = isAdmin(user);

  // 'feed' | 'study' | 'profile'
  const [view, setView] = useState('feed');
  const [sortMode, setSortMode] = useState('trending'); // 'trending' | 'latest'
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'question' | 'tip' | 'study' | 'saved' | 'mine' | 'moderation'
  const [showSearch, setShowSearch] = useState(false);
  const [feedSearch, setFeedSearch] = useState('');
  const [feedData, setFeedData] = useState({
    posts: [],
    messengerNotes: [],
    liveStudiers: [],
    trendingTags: [],
    myPosts: [],
    mySocialProfile: {},
    mySavedPostIds: [],
    myReportedPostIds: [],
    live: false,
  });
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [toastMsg, setToastMsg] = useState('');
  const toastRef = useRef(null);

  // Composer state
  const [capCategory, setCapCategory] = useState('discussion');
  const [capText, setCapText] = useState('');
  const [capBg, setCapBg] = useState('none');
  const [capMood, setCapMood] = useState('');
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [capStudy, setCapStudy] = useState(false);
  const [capStudyMins, setCapStudyMins] = useState(25);
  const [capStudyTopic, setCapStudyTopic] = useState('');
  const [showMentionPop, setShowMentionPop] = useState(false);
  const [posting, setPosting] = useState(false);
  const capTaRef = useRef(null);

  // Replies
  const [openReplies, setOpenReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});

  const showToast = (msg) => {
    clearTimeout(toastRef.current);
    setToastMsg(msg);
    toastRef.current = setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => () => clearTimeout(toastRef.current), []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (profileTarget?.uid) {
      setView('profile');
    }
  }, [profileTarget]);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeCommunityFeed(meUid, (data) => {
      setFeedData(data);
      setLoading(false);
    });
    return () => unsub?.();
  }, [meUid]);

  const savedSet = useMemo(() => new Set(feedData.mySavedPostIds || []), [feedData.mySavedPostIds]);
  const reportedSet = useMemo(() => new Set(feedData.myReportedPostIds || []), [feedData.myReportedPostIds]);
  const studyInvitePosts = useMemo(
    () => feedData.posts.filter((p) => !!p.studyInvite && !p.hiddenByAdmin),
    [feedData.posts]
  );
  const moderationCount = useMemo(
    () => feedData.posts.filter((p) => p.reportCount > 0 || p.hiddenByAdmin).length,
    [feedData.posts]
  );

  const rankedAllPosts = useMemo(
    () =>
      rankCommunityPosts(feedData.posts, sortMode, {
        isAdmin: meIsAdmin,
        mySchool: feedData.mySocialProfile?.school || '',
      }),
    [feedData.posts, sortMode, meIsAdmin, feedData.mySocialProfile?.school]
  );

  const filteredPosts = useMemo(() => {
    let list = rankedAllPosts;
    if (feedFilter === 'moderation') {
      list = feedData.posts.filter((p) => p.reportCount > 0 || p.hiddenByAdmin);
    } else {
      list = list.filter((p) => !p.hiddenByAdmin);
      if (feedFilter === 'question') list = list.filter((p) => p.category === 'question');
      else if (feedFilter === 'tip') list = list.filter((p) => p.category === 'tip');
      else if (feedFilter === 'study') list = list.filter((p) => !!p.studyInvite);
      else if (feedFilter === 'saved') list = list.filter((p) => savedSet.has(p.id));
      else if (feedFilter === 'mine') list = list.filter((p) => p.ownerUid === meUid || p.authorUid === meUid);
    }

    const q = feedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        `${p.text || ''} ${p.authorName || ''} ${p.studyInvite?.topic || ''}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rankedAllPosts, feedData.posts, feedFilter, feedSearch, meUid, savedSet]);

  const activeMoodObj = POST_MOODS.find((m) => m.id && m.id === capMood) || null;
  const activeBgObj = POST_BACKGROUNDS.find((b) => b.id === capBg) || null;
  const isBgActive = Boolean(activeBgObj?.css && !capStudy);
  const composerBgClass = isBgActive ? `has-bg fbp-bg-${capBg}` : '';

  const draftSeoQuality = useMemo(
    () => evaluateSeoQuality({ text: capText, category: capStudy ? 'study_invite' : capCategory }),
    [capText, capCategory, capStudy]
  );

  const trendingTagsList = useMemo(() => {
    if (Array.isArray(feedData.trendingTags) && feedData.trendingTags.length > 0) {
      return feedData.trendingTags;
    }
    return TRENDING_HASHTAGS.map((tag) => ({ tag, count: 0 }));
  }, [feedData.trendingTags]);

  const insertMentionEveryone = () => {
    setCapText((prev) => {
      const cleaned = prev.replace(/@[^\s@]*$/, '');
      const sep = cleaned && !/\s$/.test(cleaned) ? ' ' : '';
      return `${cleaned}${sep}@mọi người `.slice(0, 800);
    });
    setShowMentionPop(false);
    setTimeout(() => capTaRef.current?.focus(), 0);
  };

  const handleCapTextChange = (val) => {
    setCapText(val);
    const match = val.match(/(?:^|\s)@([^\s@]{0,14})$/);
    if (match) {
      const q = match[1].toLowerCase();
      setShowMentionPop(
        !q || 'mọi người'.startsWith(q) || 'moinguoi'.startsWith(q) || 'everyone'.startsWith(q) || 'all'.startsWith(q)
      );
    } else {
      setShowMentionPop(false);
    }
  };

  const handleCreateCap = async (e) => {
    e.preventDefault();
    if (!meUid || posting) return;
    if (!capText.trim() && !capStudy) return;
    const isMentionAll = hasEveryoneMention(capText);
    if (isMentionAll) {
      const cd = checkEveryoneCooldown(meUid, 'feed', meIsAdmin);
      if (!cd.ok) {
        showToast(`Vui lòng đợi ${cd.waitSec} giây nữa trước khi nhắc @mọi người tiếp nhé.`);
        return;
      }
    }
    setPosting(true);
    try {
      const studyInvite = capStudy
        ? {
            durationMin: capStudyMins,
            topic: capStudyTopic.trim() || capText.trim().slice(0, 90) || 'Cùng tập trung ôn thi',
            hostUid: meUid,
            hostName: meName,
          }
        : null;
      await createWallPost(meUid, feedData.myPosts, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        category: capStudy ? 'study_invite' : capCategory,
        text: capText,
        bgId: capStudy ? 'none' : capBg,
        mood: capMood,
        studyInvite,
      });
      if (isMentionAll) {
        markEveryoneCooldown(meUid, 'feed');
        broadcastEveryoneMention({
          channel: 'feed',
          channelName: 'Cộng đồng ELEC',
          authorUid: meUid,
          authorName: meName,
          authorPhoto: user?.photoURL || '',
          text: capText,
        }).catch(() => {});
      }
      setCapText('');
      setCapBg('none');
      setCapMood('');
      setCapCategory('discussion');
      setCapStudy(false);
      setCapStudyTopic('');
      setShowMoodMenu(false);
      setShowBgPicker(false);
      setShowMentionPop(false);
      showToast(
        isMentionAll
          ? 'Đã đăng & gửi thông báo đẩy tới @mọi người!'
          : studyInvite
            ? 'Đã đăng thẻ Rủ học chung!'
            : 'Đã đăng lên Cộng đồng ELEC'
      );
    } catch (err) {
      showToast(err?.message || 'Đăng thất bại');
    } finally {
      setPosting(false);
    }
  };

  const handleRepost = async (post) => {
    if (!meUid) {
      showToast('Đăng nhập để đăng lại');
      return;
    }
    try {
      await createWallPost(meUid, feedData.myPosts, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        category: post.category || 'discussion',
        text: post.text,
        bgId: post.bgId || 'none',
        mood: post.mood || '',
        studyInvite: post.studyInvite || null,
        repostOf: {
          authorUid: post.authorUid || post.ownerUid,
          authorName: post.authorName,
          originalPostId: post.id,
        },
      });
      showToast(`Đã đăng lại bài của ${post.authorName}`);
    } catch (err) {
      showToast(err?.message || 'Không thể đăng lại lúc này');
    }
  };

  const handleJoinStudy = async ({ partnerUid, partnerName, topic, durationMin, notifyDm = false }) => {
    if (notifyDm && user?.uid && partnerUid && partnerUid !== user.uid) {
      try {
        const { id } = await openDm(user, partnerUid, partnerName);
        await sendDmMessage(
          id,
          user,
          `[HỌC CHUNG ELEC] Mình vừa vào học chung cùng ${partnerName} (${durationMin || 25} phút · ${topic || 'Tập trung'}). Cùng giữ chuỗi nhé!`
        );
      } catch { /* ignore */ }
    }
    saveStudyTogetherHandoff({
      partnerUid: partnerUid && partnerUid !== meUid ? partnerUid : null,
      partnerName: partnerUid && partnerUid !== meUid ? partnerName : '',
      topic: topic || 'Cùng tập trung ôn thi',
      durationMin: durationMin || 25,
      openClassroom: true,
    });
    onNavigateAway?.();
    window.location.hash = '#pomodoro';
  };

  const handleStartDm = async (targetUid, targetName) => {
    if (!user?.uid || !targetUid || targetUid === user.uid) return;
    try {
      const { id } = await openDm(user, targetUid, targetName);
      onOpenDm?.(id, targetUid, targetName);
    } catch (err) {
      showToast(err?.message || 'Không thể mở tin nhắn');
    }
  };

  const handleReact = async (post, reactionKey) => {
    if (!meUid) {
      showToast('Đăng nhập để thả tim');
      return;
    }
    try {
      await toggleWallPostReaction(post.ownerUid, null, post.id, meUid, reactionKey);
    } catch {
      showToast('Không thể cập nhật lúc này');
    }
  };

  const handleReply = async (e, post) => {
    e.preventDefault();
    const txt = (replyDrafts[post.id] || '').trim();
    if (!meUid || !txt) return;
    setReplyDrafts((prev) => ({ ...prev, [post.id]: '' }));
    setOpenReplies((prev) => ({ ...prev, [post.id]: true }));
    try {
      await addWallPostComment(post.ownerUid, null, post.id, {
        authorUid: meUid,
        authorName: meName,
        authorPhoto: user?.photoURL || null,
        text: txt,
      });
    } catch {
      showToast('Gửi trả lời thất bại');
    }
  };

  const handleDelete = async (post) => {
    try {
      await deleteWallPost(post.ownerUid, post.ownerUid === meUid ? feedData.myPosts : null, post.id);
      showToast('Đã xóa bài viết');
    } catch {
      showToast('Xóa thất bại');
    }
  };

  const handlePin = async (post) => {
    if (!meUid) return;
    try {
      await togglePinWallPost(post.ownerUid, feedData.myPosts, post.id);
      showToast(post.pinned ? 'Đã bỏ ghim' : 'Đã ghim lên đầu trang cá nhân');
    } catch {
      showToast('Không thể ghim');
    }
  };

  const handleSave = async (post) => {
    if (!meUid) {
      showToast('Đăng nhập để lưu');
      return;
    }
    const wasSaved = savedSet.has(post.id);
    try {
      await toggleSavePost(meUid, post.id);
      showToast(wasSaved ? 'Đã bỏ lưu' : 'Đã lưu bài viết');
    } catch {
      showToast('Lưu thất bại');
    }
  };

  const handleReport = async (post) => {
    if (!meUid) {
      showToast('Đăng nhập để báo cáo');
      return;
    }
    if (reportedSet.has(post.id)) {
      showToast('Bạn đã báo cáo bài này cho Admin');
      return;
    }
    try {
      await reportWallPost(meUid, post.id, 'Người dùng báo cáo nội dung');
      showToast('Đã gửi báo cáo tới hàng đợi kiểm duyệt Admin');
    } catch {
      showToast('Không gửi được báo cáo');
    }
  };

  const handleBestReply = async (post, commentId) => {
    try {
      const updated = await markBestReply(post.ownerUid, post.id, commentId);
      showToast(updated?.bestReplyId ? 'Đã đánh dấu Lời giải chuẩn (chuẩn Q&A SEO)!' : 'Đã bỏ chọn lời giải chuẩn');
    } catch {
      showToast('Không thể cập nhật lời giải chuẩn');
    }
  };

  const handleAdminFeature = async (post) => {
    try {
      const updated = await adminToggleFeaturePost(post.ownerUid, post.id);
      showToast(updated?.featuredByAdmin ? 'Đã Đẩy Xu Hướng bài viết này (+Boost)!' : 'Đã gỡ Đẩy Xu Hướng');
    } catch {
      showToast('Cần quyền Admin để Đẩy Xu Hướng');
    }
  };

  const handleAdminGlobalPin = async (post) => {
    try {
      const updated = await adminToggleGlobalPinPost(post.ownerUid, post.id);
      showToast(updated?.pinnedGlobal ? 'Đã Ghim Toàn Cộng Đồng!' : 'Đã gỡ Ghim Toàn Cộng Đồng');
    } catch {
      showToast('Cần quyền Admin để ghim toàn cộng đồng');
    }
  };

  const handleAdminHide = async (post) => {
    try {
      const updated = await adminToggleHidePost(post.ownerUid, post.id);
      showToast(updated?.hiddenByAdmin ? 'Đã ẩn bài viết vi phạm' : 'Đã khôi phục bài viết');
    } catch {
      showToast('Cần quyền Admin để ẩn bài viết');
    }
  };

  const handleShare = async (post) => {
    const publicUrl = `https://www.elecai.id.vn/cong-dong/${post.slug || post.id}`;
    const txt = post.studyInvite
      ? `${post.authorName} rủ học chung ${post.studyInvite.durationMin} phút trên Cộng đồng ELEC: "${post.studyInvite.topic}"\n${publicUrl}`
      : `${post.authorName} trên Cộng đồng ELEC:\n"${post.text}"\n${publicUrl}`;
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Đã sao chép liên kết SEO bài viết');
    } catch {
      showToast('Đã sao chép');
    }
  };

  const activeProfileUid = profileTarget?.uid || meUid;
  const activeProfileName = profileTarget?.name || meName;
  const viewingOtherProfile = Boolean(profileTarget?.uid && profileTarget.uid !== meUid);

  /* ── RENDER 1 BÀI VIẾT CỘNG ĐỒNG ELEC ── */
  const renderThreadPost = (post) => {
    const bgObj = POST_BACKGROUNDS.find((b) => b.id === post.bgId);
    const moodObj = POST_MOODS.find((m) => m.id && m.id === post.mood);
    const catObj = POST_CATEGORIES.find((c) => c.id === post.category) || null;
    const isColored = !!(bgObj?.css && !post.studyInvite && (post.text || '').length <= 240);

    const reactEntries = WALL_REACTIONS.map((r) => ({
      ...r,
      count: Object.keys(post.reactions?.[r.key] || {}).length,
    })).filter((r) => r.count > 0);
    const totalReacts = reactEntries.reduce((s, r) => s + r.count, 0);
    const myReact = WALL_REACTIONS.find((r) => meUid && post.reactions?.[r.key]?.[meUid]);

    const repliesList = Object.values(post.comments || {}).sort((a, b) => {
      if (post.bestReplyId && a.id === post.bestReplyId) return -1;
      if (post.bestReplyId && b.id === post.bestReplyId) return 1;
      return (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
    });
    const isRepliesOpen = !!openReplies[post.id];
    const hasThreadLine = repliesList.length > 0 || isRepliesOpen;
    const isOwnPost = meUid && (post.ownerUid === meUid || post.authorUid === meUid);
    const isSaved = savedSet.has(post.id);
    const isReported = reportedSet.has(post.id);
    const authorUid = post.authorUid || post.ownerUid;
    const resolvedAuthorPhoto = post.authorPhoto || (authorUid === meUid ? user?.photoURL : null);
    const canMarkBest = Boolean(isOwnPost || meIsAdmin);

    return (
      <article
        key={`${post.ownerUid}_${post.id}`}
        className={`th-post ${post.pinnedGlobal ? 'is-global-pin' : ''} ${post.featuredByAdmin ? 'is-featured' : ''} ${post.hiddenByAdmin ? 'is-hidden-post' : ''}`}
      >
        {(post.pinnedGlobal || post.featuredByAdmin || post.pinned || post.repostOf || post.hiddenByAdmin || hasEveryoneMention(post.text)) && (
          <div className="th-meta-ribbon">
            {post.hiddenByAdmin ? (
              <span className="th-rib-tag is-warn">
                <ThIcon name="eyeOff" size={11} />
                <span>Đã ẩn bởi Admin</span>
              </span>
            ) : post.pinnedGlobal ? (
              <span className="th-rib-tag is-global">
                <ThIcon name="pin" size={11} filled />
                <span>Ghim toàn Cộng đồng ELEC</span>
              </span>
            ) : post.featuredByAdmin ? (
              <span className="th-rib-tag is-hot">
                <ThIcon name="flame" size={11} filled />
                <span>Xu hướng nổi bật · Admin đề xuất</span>
              </span>
            ) : post.pinned ? (
              <span className="th-rib-tag">
                <ThIcon name="pin" size={11} filled />
                <span>Đã ghim</span>
              </span>
            ) : post.repostOf ? (
              <span className="th-rib-tag">
                <ThIcon name="repost" size={11} />
                <span>{post.authorName} đã đăng lại từ {post.repostOf.authorName}</span>
              </span>
            ) : null}
            {hasEveryoneMention(post.text) && (
              <span className="th-rib-tag is-mention">
                <ThIcon name="bell" size={11} />
                <span>Nhắc @mọi người</span>
              </span>
            )}
            {meIsAdmin && post.reportCount > 0 && (
              <span className="th-rib-tag is-warn">{post.reportCount} báo cáo</span>
            )}
          </div>
        )}

        <div className="th-grid">
          <div className="th-rail">
            <button
              type="button"
              className="th-av-btn"
              onClick={() => {
                onSelectProfile?.({ uid: authorUid, name: post.authorName });
                setView('profile');
              }}
            >
              <StudentAvatar
                uid={authorUid}
                name={post.authorName}
                photoURL={resolvedAuthorPhoto}
                size={38}
              />
            </button>
            {hasThreadLine && <span className="th-connector" aria-hidden="true" />}
            {repliesList.length > 0 && !isRepliesOpen && (
              <button
                type="button"
                className="th-rail-mini-av"
                onClick={() => setOpenReplies((p) => ({ ...p, [post.id]: true }))}
                title="Xem các câu trả lời"
              >
                <StudentAvatar
                  uid={repliesList[repliesList.length - 1].authorUid}
                  name={repliesList[repliesList.length - 1].authorName}
                  photoURL={
                    repliesList[repliesList.length - 1].authorPhoto ||
                    (repliesList[repliesList.length - 1].authorUid === meUid ? user?.photoURL : null)
                  }
                  size={20}
                />
              </button>
            )}
          </div>

          <div className="th-body">
            <div className="th-head">
              <div className="th-head-left">
                <button
                  type="button"
                  className="th-author"
                  onClick={() => {
                    onSelectProfile?.({ uid: authorUid, name: post.authorName });
                    setView('profile');
                  }}
                >
                  <b>{post.authorName}</b>
                  <VerifiedBadge uid={authorUid} size={14} />
                </button>
                <span className="th-time">{fmtShortRel(post.createdAt, nowTick)}</span>
                {catObj && catObj.id !== 'discussion' && (
                  <span
                    className="th-cat-badge"
                    style={{ background: `${catObj.color}16`, color: catObj.color }}
                  >
                    {catObj.label}
                  </span>
                )}
                {moodObj && (
                  <span className="th-mood-chip">
                    {moodObj.mascot && <img src={moodObj.mascot} alt="" draggable={false} />}
                    <span>{moodObj.label}</span>
                  </span>
                )}
              </div>

              <div className="th-head-right">
                {meIsAdmin && (
                  <>
                    <button
                      type="button"
                      className={`th-mini-ico ${post.featuredByAdmin ? 'is-hot' : ''}`}
                      onClick={() => handleAdminFeature(post)}
                      title={post.featuredByAdmin ? 'Bỏ Đẩy Xu Hướng' : 'Admin: Đẩy Xu Hướng'}
                    >
                      <ThIcon name="zap" size={14} filled={!!post.featuredByAdmin} />
                    </button>
                    <button
                      type="button"
                      className={`th-mini-ico ${post.pinnedGlobal ? 'is-on' : ''}`}
                      onClick={() => handleAdminGlobalPin(post)}
                      title={post.pinnedGlobal ? 'Bỏ Ghim Toàn Cộng Đồng' : 'Admin: Ghim Toàn Cộng Đồng'}
                    >
                      <ThIcon name="shield" size={14} />
                    </button>
                    <button
                      type="button"
                      className={`th-mini-ico ${post.hiddenByAdmin ? 'is-del' : ''}`}
                      onClick={() => handleAdminHide(post)}
                      title={post.hiddenByAdmin ? 'Hiện lại bài viết' : 'Admin: Ẩn bài vi phạm'}
                    >
                      <ThIcon name="eyeOff" size={14} />
                    </button>
                  </>
                )}

                {isOwnPost ? (
                  <>
                    <button
                      type="button"
                      className={`th-mini-ico ${post.pinned ? 'is-on' : ''}`}
                      onClick={() => handlePin(post)}
                      title={post.pinned ? 'Bỏ ghim' : 'Ghim bài'}
                    >
                      <ThIcon name="pin" size={14} filled={!!post.pinned} />
                    </button>
                    <button
                      type="button"
                      className="th-mini-ico is-del"
                      onClick={() => handleDelete(post)}
                      title="Xóa bài"
                    >
                      <ThIcon name="trash" size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    {meIsAdmin && (
                      <button
                        type="button"
                        className="th-mini-ico is-del"
                        onClick={() => handleDelete(post)}
                        title="Admin: Xóa bài vi phạm"
                      >
                        <ThIcon name="trash" size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="th-dm-chip"
                      onClick={() => handleStartDm(authorUid, post.authorName)}
                    >
                      Nhắn tin
                    </button>
                  </>
                )}
              </div>
            </div>

            {isColored ? (
              <div className={`th-colored-card fbp-bg-${post.bgId}`} style={{ background: bgObj.css }}>
                <span className="th-colored-text">{post.text}</span>
                <span className="th-colored-mark">© ELEC AI</span>
                <img
                  src={moodObj?.mascot || '/img/elec/elec-cool.png'}
                  alt="Bé Elec"
                  className="th-colored-mascot"
                  draggable={false}
                />
              </div>
            ) : (
              post.text && (
                <p className="th-text">
                  <RichThreadText
                    text={post.text}
                    onClickTag={(tag) => {
                      setShowSearch(true);
                      setFeedSearch(tag);
                    }}
                  />
                </p>
              )
            )}

            {post.studyInvite && (
              <div className="th-study-card">
                <img src="/img/elec/elec-fighting.png" alt="Bé Elec" className="th-study-mascot" draggable={false} />
                <div className="th-study-copy">
                  <span className="th-study-kicker">
                    <ThIcon name="users" size={11} />
                    <span>HỌC CHUNG ELEC · {post.studyInvite.durationMin || 25} PHÚT</span>
                  </span>
                  <strong>{post.studyInvite.topic}</strong>
                </div>
                <button
                  type="button"
                  className="th-study-join"
                  onClick={() =>
                    handleJoinStudy({
                      partnerUid: post.studyInvite.hostUid || authorUid,
                      partnerName: post.studyInvite.hostName || post.authorName,
                      topic: post.studyInvite.topic,
                      durationMin: post.studyInvite.durationMin,
                      notifyDm: true,
                    })
                  }
                >
                  <ThIcon name="play" size={11} filled />
                  <span>Vào học</span>
                </button>
              </div>
            )}

            <div className="th-actions">
              <div className="th-react-wrap">
                <div className="th-react-dock" role="toolbar" aria-label="Chọn cảm xúc">
                  <div className="th-react-dock-in">
                    {WALL_REACTIONS.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        className="th-dock-dot"
                        style={{ background: r.color }}
                        title={r.label}
                        onClick={() => handleReact(post, r.key)}
                      >
                        <ReactionSvg type={r.key} size={13} filled />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className={`th-act ${myReact ? 'is-liked' : ''}`}
                  style={myReact ? { color: myReact.key === 'love' ? '#ff3040' : myReact.color } : undefined}
                  onClick={() => handleReact(post, myReact ? myReact.key : 'love')}
                  title="Thích"
                >
                  <ReactionSvg type={myReact ? myReact.key : 'love'} size={18} filled={!!myReact} />
                  {totalReacts > 0 && <span>{totalReacts}</span>}
                </button>
              </div>

              <button
                type="button"
                className="th-act"
                onClick={() => setOpenReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                title="Trả lời"
              >
                <ThIcon name="reply" size={18} />
                {repliesList.length > 0 && <span>{repliesList.length}</span>}
              </button>

              <button
                type="button"
                className="th-act"
                onClick={() => handleRepost(post)}
                title="Đăng lại lên dòng thời gian của bạn"
              >
                <ThIcon name="repost" size={18} />
                {post.repostCount > 0 && <span>{post.repostCount}</span>}
              </button>

              <button
                type="button"
                className={`th-act ${isSaved ? 'is-saved' : ''}`}
                onClick={() => handleSave(post)}
                title={isSaved ? 'Bỏ lưu' : 'Lưu bài'}
              >
                <ThIcon name="bookmark" size={17} filled={isSaved} />
                {post.saveCount > 0 && <span>{post.saveCount}</span>}
              </button>

              <button
                type="button"
                className="th-act"
                onClick={() => handleShare(post)}
                title="Sao chép link SEO bài viết"
              >
                <ThIcon name="share" size={17} />
              </button>

              {!isOwnPost && meUid && (
                <button
                  type="button"
                  className={`th-act th-act-report ${isReported ? 'is-reported' : ''}`}
                  onClick={() => handleReport(post)}
                  title={isReported ? 'Đã báo cáo Admin' : 'Báo cáo bài viết'}
                >
                  <ThIcon name="flag" size={15} />
                </button>
              )}
            </div>

            {repliesList.length > 0 && !isRepliesOpen && (
              <button
                type="button"
                className="th-reply-summary"
                onClick={() => setOpenReplies((p) => ({ ...p, [post.id]: true }))}
              >
                {repliesList.length} câu trả lời
                {post.bestReplyId ? ' · Có lời giải chuẩn ✓' : ''}
                {totalReacts > 0 ? ` · ${totalReacts} lượt thích` : ''}
              </button>
            )}

            {isRepliesOpen && (
              <div className="th-replies">
                {repliesList.map((c) => {
                  const isBest = post.bestReplyId && post.bestReplyId === c.id;
                  return (
                    <div key={c.id} className={`th-reply-item ${isBest ? 'is-best' : ''}`}>
                      <StudentAvatar
                        uid={c.authorUid}
                        name={c.authorName}
                        photoURL={c.authorPhoto || (c.authorUid === meUid ? user?.photoURL : null)}
                        size={26}
                      />
                      <div className="th-reply-content">
                        <div className="th-reply-meta">
                          <b>{c.authorName}</b>
                          <span>{fmtShortRel(c.createdAt, nowTick)}</span>
                          {isBest && (
                            <span className="th-best-badge">
                              <ThIcon name="check" size={11} />
                              <span>Lời giải chuẩn</span>
                            </span>
                          )}
                          {canMarkBest && (post.category === 'question' || meIsAdmin) && (
                            <button
                              type="button"
                              className="th-best-toggle"
                              onClick={() => handleBestReply(post, c.id)}
                            >
                              {isBest ? 'Bỏ chọn' : 'Chọn lời giải chuẩn'}
                            </button>
                          )}
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  );
                })}
                {meUid && (
                  <form className="th-reply-form" onSubmit={(e) => handleReply(e, post)}>
                    <StudentAvatar uid={meUid} name={meName} photoURL={user?.photoURL} size={26} />
                    <input
                      value={replyDrafts[post.id] || ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={`Trả lời ${post.authorName}…`}
                      maxLength={360}
                    />
                    <button type="submit" disabled={!(replyDrafts[post.id] || '').trim()}>
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

  return (
    <section className="th-pane" aria-label="Cộng đồng ELEC">
      {/* TOP BAR CỘNG ĐỒNG ELEC */}
      <header className="th-topbar">
        <div className="th-brand">
          <img src="/img/elec/elec-cool.png" alt="ELEC AI" className="th-brand-mascot" draggable={false} />
          <div className="th-brand-copy">
            <span className="th-brand-name">
              Cộng đồng <em>ELEC</em>
            </span>
            {feedData.live && <span className="th-brand-dot" title="Đang đồng bộ thời gian thực" />}
          </div>
        </div>

        <nav className="th-tabs" role="tablist" aria-label="Mục Cộng đồng ELEC">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'feed'}
            className={`th-tab ${view === 'feed' ? 'is-active' : ''}`}
            onClick={() => {
              setView('feed');
              onClearProfile?.();
            }}
          >
            Dành cho bạn
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'study'}
            className={`th-tab ${view === 'study' ? 'is-active' : ''}`}
            onClick={() => {
              setView('study');
              onClearProfile?.();
            }}
          >
            <span>Học chung</span>
            {feedData.liveStudiers.length > 0 && (
              <span className="th-tab-live">{feedData.liveStudiers.length}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'profile'}
            className={`th-tab ${view === 'profile' ? 'is-active' : ''}`}
            onClick={() => {
              if (meUid) {
                onSelectProfile?.({ uid: meUid, name: meName });
              } else {
                onClearProfile?.();
              }
              setView('profile');
            }}
          >
            Cá nhân
          </button>
        </nav>

        <div className="th-top-right">
          {view === 'feed' && (
            <button
              type="button"
              className={`th-icon-btn ${showSearch ? 'is-active' : ''}`}
              onClick={() => setShowSearch((s) => !s)}
              title="Tìm kiếm bài viết & #hashtag"
              aria-label="Tìm kiếm"
            >
              <ThIcon name="search" size={17} />
            </button>
          )}
        </div>
      </header>

      {/* NỘI DUNG TỪNG TAB */}
      {view === 'profile' ? (
        <div className="th-profile-host">
          {viewingOtherProfile && (
            <div className="th-profile-crumb">
              <button
                type="button"
                className="th-back-link"
                onClick={() => {
                  onClearProfile?.();
                  setView('feed');
                }}
              >
                <ThIcon name="back" size={16} />
                <span>Dành cho bạn</span>
              </button>
              <span className="th-crumb-name">{activeProfileName}</span>
            </div>
          )}

          {activeProfileUid ? (
            <div className="th-profile-embed">
              <ProfileCard
                targetUid={activeProfileUid}
                fallbackName={activeProfileName}
                embedded
                onClose={() => {
                  onClearProfile?.();
                  setView('feed');
                }}
                onOpenDm={(dmId, peerName) => onOpenDm?.(dmId, activeProfileUid, peerName || activeProfileName)}
                onNavigateAway={onNavigateAway}
              />
            </div>
          ) : (
            <div className="th-empty">
              <img src="/img/elec/elec-hello.png" alt="Bé Elec" draggable={false} />
              <b>Đăng nhập để xem Trang cá nhân</b>
            </div>
          )}
        </div>
      ) : view === 'study' ? (
        <div className="th-scroll">
          <StudyTogetherRoom
            onSelectProfile={(target) => {
              onSelectProfile?.(target);
              setView('profile');
            }}
            onNavigateAway={onNavigateAway}
            onPostInvite={
              meUid
                ? async ({ durationMin, topic }) => {
                    try {
                      await createWallPost(meUid, feedData.myPosts, {
                        authorUid: meUid,
                        authorName: meName,
                        authorPhoto: user?.photoURL || null,
                        category: 'study_invite',
                        text: `Vừa mở bàn Học chung ${durationMin} phút — ${topic}. Ai rảnh vào ngồi cùng bàn nhé! #HocCungELEC`,
                        bgId: 'none',
                        mood: 'grind',
                        studyInvite: {
                          durationMin,
                          topic,
                          hostUid: meUid,
                          hostName: meName,
                        },
                      });
                      showToast('Đã đăng thẻ Rủ học chung lên Cộng đồng ELEC!');
                    } catch {
                      showToast('Không thể đăng lời rủ lúc này');
                    }
                  }
                : undefined
            }
            studyInvitePostsNode={
              studyInvitePosts.length > 0 ? (
                <div className="th-study-invites-wrap">
                  <div className="th-section-label">
                    Lời rủ học chung trên Cộng đồng ELEC ({studyInvitePosts.length})
                  </div>
                  <div className="th-stream">{studyInvitePosts.map(renderThreadPost)}</div>
                </div>
              ) : null
            }
          />
        </div>
      ) : (
        /* TAB DÀNH CHO BẠN — BẢNG TIN CỘNG ĐỒNG ELEC CHUẨN MXH LỚN */
        <div className="th-scroll">
          {(showSearch || feedSearch) && (
            <div className="th-search-drawer">
              <div className="th-search-box">
                <ThIcon name="search" size={15} />
                <input
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  placeholder="Tìm kiếm cap, câu hỏi KHTN, #hashtag hoặc tên bạn học…"
                  autoFocus
                  maxLength={60}
                />
                {feedSearch && (
                  <button type="button" className="th-clear-x" onClick={() => setFeedSearch('')}>
                    <ThIcon name="x" size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* KHUNG SOẠN BÀI ĐĂNG TỐI ƯU + CHỌN CHỦ ĐỀ + NỀN MÀU HOẠT ĐỘNG CHUẨN 100% */}
          {meUid && (
            <form className="th-composer" onSubmit={handleCreateCap}>
              <div className="th-grid">
                <div className="th-rail">
                  <button
                    type="button"
                    className="th-av-btn"
                    onClick={() => {
                      onSelectProfile?.({ uid: meUid, name: meName });
                      setView('profile');
                    }}
                  >
                    <StudentAvatar uid={meUid} name={meName} photoURL={user?.photoURL} size={38} />
                  </button>
                </div>

                <div className="th-body">
                  <div className="th-composer-author">
                    <b>{meName}</b>
                    {activeMoodObj && (
                      <span className="th-mood-chip">
                        {activeMoodObj.mascot && <img src={activeMoodObj.mascot} alt="" draggable={false} />}
                        <span>{activeMoodObj.label}</span>
                        <button type="button" onClick={() => setCapMood('')} aria-label="Bỏ linh vật">
                          <ThIcon name="x" size={11} />
                        </button>
                      </span>
                    )}
                    {capText.trim().length > 0 && draftSeoQuality.indexable && (
                      <span className="th-seo-pill" title="Bài viết đủ chất lượng để Google lập chỉ mục SEO / Q&A">
                        <ThIcon name="globe" size={11} />
                        <span>Chuẩn SEO</span>
                      </span>
                    )}
                  </div>

                  {/* CHỌN LOẠI BÀI ĐĂNG (Thảo luận · Hỏi bài KHTN · Mẹo học hay · Học chung) */}
                  <div className="th-cat-picker" role="group" aria-label="Chọn loại bài viết">
                    {POST_CATEGORIES.map((cat) => {
                      const active = cat.id === 'study_invite' ? capStudy : (!capStudy && capCategory === cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`th-cat-opt ${active ? 'is-active' : ''}`}
                          style={active ? { background: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}48` } : undefined}
                          onClick={() => {
                            if (cat.id === 'study_invite') {
                              setCapStudy((prev) => {
                                const next = !prev;
                                if (next) {
                                  setCapBg('none');
                                  setShowBgPicker(false);
                                }
                                return next;
                              });
                            } else {
                              setCapStudy(false);
                              setCapCategory(cat.id);
                            }
                          }}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="th-ta-wrap">
                    <textarea
                      ref={capTaRef}
                      className={`th-ta ${composerBgClass}`}
                      style={isBgActive ? { background: activeBgObj.css } : undefined}
                      rows={isBgActive ? 3 : capText.includes('\n') || capText.length > 68 ? 2 : 1}
                      value={capText}
                      maxLength={800}
                      onChange={(e) => handleCapTextChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (showMentionPop && (e.key === 'Enter' || e.key === 'Tab')) {
                          e.preventDefault();
                          insertMentionEveryone();
                        } else if (showMentionPop && e.key === 'Escape') {
                          setShowMentionPop(false);
                        }
                      }}
                      placeholder={
                        capStudy
                          ? 'Viết lời rủ học chung tới cộng đồng…'
                          : capCategory === 'question'
                            ? 'Đặt câu hỏi Lý, Hóa, Sinh… gõ @mọi người để đẩy thông báo hoặc #hashtag…'
                            : capCategory === 'tip'
                              ? 'Chia sẻ mẹo giải nhanh, công thức hoặc bí kíp ôn thi THPTQG…'
                              : 'Có gì mới? Gõ @mọi người để thông báo đẩy tới cộng đồng…'
                      }
                    />
                    {showMentionPop && (
                      <div className="elec-mention-pop" role="listbox" aria-label="Gợi ý nhắc tên">
                        <button
                          type="button"
                          className="elec-mention-opt"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertMentionEveryone();
                          }}
                        >
                          <span className="elec-mention-ico">
                            <ThIcon name="bell" size={14} />
                          </span>
                          <span className="elec-mention-copy">
                            <b>@mọi người</b>
                            <small>Gửi thông báo đẩy tức thì tới tất cả thành viên Cộng đồng ELEC</small>
                          </span>
                        </button>
                      </div>
                    )}
                    {isBgActive && (
                      <>
                        <span className="th-ta-mark">© ELEC AI</span>
                        <img
                          src={activeMoodObj?.mascot || '/img/elec/elec-cool.png'}
                          alt=""
                          className="th-ta-mascot"
                          draggable={false}
                        />
                      </>
                    )}
                  </div>

                  {capStudy && (
                    <div className="th-inline-study">
                      <div className="th-inline-study-top">
                        <span>Thẻ Rủ học chung</span>
                        <div className="th-inline-mins">
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
                        <button type="button" className="th-clear-x" onClick={() => setCapStudy(false)}>
                          <ThIcon name="x" size={12} />
                        </button>
                      </div>
                      <input
                        className="th-clean-input"
                        maxLength={120}
                        value={capStudyTopic}
                        onChange={(e) => setCapStudyTopic(e.target.value)}
                        placeholder="Chủ đề phiên học (VD: Ôn Este - Lipit, Cày đề Vật lí…)"
                      />
                    </div>
                  )}

                  {showBgPicker && !capStudy && (
                    <div className="th-bg-row">
                      {POST_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          className={`th-bg-dot ${capBg === bg.id ? 'is-active' : ''}`}
                          style={{ background: bg.css || '#ffffff' }}
                          title={bg.label}
                          onClick={() => setCapBg(bg.id)}
                        />
                      ))}
                    </div>
                  )}

                  <div className="th-composer-foot">
                    <div className="th-composer-tools">
                      <button
                        type="button"
                        className={`th-tool ${showBgPicker || capBg !== 'none' ? 'is-active' : ''}`}
                        onClick={() => {
                          setCapStudy(false);
                          setShowBgPicker((v) => !v);
                          setShowMoodMenu(false);
                        }}
                        title="Nền màu ELEC"
                      >
                        <span
                          className="th-color-wheel"
                          style={{
                            background:
                              activeBgObj?.css || 'linear-gradient(135deg, #0058cc, #38bdf8, #8b5cf6)',
                          }}
                        />
                        <span>Nền màu</span>
                      </button>

                      <button
                        type="button"
                        className={`th-tool ${hasEveryoneMention(capText) ? 'is-active' : ''}`}
                        onClick={insertMentionEveryone}
                        title="Nhắc @mọi người (gửi thông báo đẩy tức thì)"
                      >
                        <ThIcon name="at" size={14} />
                        <span>Mọi người</span>
                      </button>

                      <button
                        type="button"
                        className={`th-tool ${showMoodMenu || capMood ? 'is-active' : ''}`}
                        onClick={() => {
                          setShowMoodMenu((p) => !p);
                          setShowBgPicker(false);
                        }}
                      >
                        <img
                          src={activeMoodObj?.mascot || '/img/elec/elec-happy.png'}
                          alt=""
                          className="th-tool-img"
                          draggable={false}
                        />
                        <span>Bé Elec</span>
                      </button>

                      {showMoodMenu && (
                        <div className="th-mood-pop" role="menu">
                          {POST_MOODS.map((m) => (
                            <button
                              key={m.id || 'none'}
                              type="button"
                              className={`th-mood-opt ${capMood === m.id ? 'is-selected' : ''}`}
                              onClick={() => {
                                setCapMood(m.id);
                                setShowMoodMenu(false);
                              }}
                            >
                              {m.mascot ? (
                                <img src={m.mascot} alt="" draggable={false} />
                              ) : (
                                <ThIcon name="x" size={14} />
                              )}
                              <span>{m.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="th-submit-pill"
                      disabled={posting || (!capText.trim() && !capStudy)}
                    >
                      {posting ? 'Đang đăng…' : 'Đăng'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* THANH XẾP HẠNG XU HƯỚNG + BỘ LỌC + HASHTAG THỜI GIAN THỰC */}
          <div className="th-discovery-bar">
            <div className="th-filter-strip">
              <div className="th-sort-seg" role="group" aria-label="Sắp xếp bảng tin">
                <button
                  type="button"
                  className={`th-sort-btn ${sortMode === 'trending' ? 'is-active' : ''}`}
                  onClick={() => setSortMode('trending')}
                >
                  <ThIcon name="flame" size={12} filled={sortMode === 'trending'} />
                  <span>Xu hướng</span>
                </button>
                <button
                  type="button"
                  className={`th-sort-btn ${sortMode === 'latest' ? 'is-active' : ''}`}
                  onClick={() => setSortMode('latest')}
                >
                  <span>Mới nhất</span>
                </button>
              </div>

              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'question', label: 'Hỏi bài' },
                { id: 'tip', label: 'Mẹo học' },
                { id: 'study', label: 'Học chung' },
                ...(meUid ? [{ id: 'saved', label: `Đã lưu (${savedSet.size})` }] : []),
                ...(meIsAdmin && moderationCount > 0 ? [{ id: 'moderation', label: `Kiểm duyệt (${moderationCount})` }] : []),
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`th-filter-chip ${feedFilter === f.id ? 'is-active' : ''} ${f.id === 'moderation' ? 'is-mod' : ''}`}
                  onClick={() => setFeedFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="th-trending-strip" aria-label="Chủ đề đang lên xu hướng">
              <span className="th-trend-label">Xu hướng:</span>
              {trendingTagsList.map((item) => {
                const active = feedSearch.toLowerCase() === item.tag.toLowerCase();
                return (
                  <button
                    key={item.tag}
                    type="button"
                    className={`th-trend-pill ${active ? 'is-active' : ''}`}
                    onClick={() => setFeedSearch((p) => (p.toLowerCase() === item.tag.toLowerCase() ? '' : item.tag))}
                  >
                    <span>{item.tag}</span>
                    {item.count > 0 && <em>{item.count}</em>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LUỒNG BÀI VIẾT CỘNG ĐỒNG ELEC */}
          {loading ? (
            <div className="th-empty">
              <img src="/img/elec/elec-think.png" alt="Bé Elec" draggable={false} />
              <span>Đang đồng bộ thời gian thực…</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="th-empty">
              <img src="/img/elec/elec-hello.png" alt="Bé Elec" draggable={false} />
              <b>Chưa có bài viết nào ở mục này</b>
              <span>Viết dòng đầu tiên vào khung “Có gì mới?” ngay phía trên nhé!</span>
            </div>
          ) : (
            <div className="th-stream">{filteredPosts.map(renderThreadPost)}</div>
          )}

          <footer className="th-footer">
            <img src="/img/elec/elec-cool.png" alt="ELEC AI" draggable={false} />
            <span>© 2026 ELEC Science AI · Cộng đồng học tập chính chủ</span>
          </footer>
        </div>
      )}

      {toastMsg && <div className="th-toast">{toastMsg}</div>}
    </section>
  );
}
