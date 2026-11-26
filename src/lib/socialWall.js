/* ============================================================================
   socialWall.js — Hệ sinh thái MXH & Cap Messenger ELEC AI (100% Real-time)
   ----------------------------------------------------------------------------
   - Nguồn dữ liệu duy nhất: Cloud Firestore `users/{uid}` qua `onSnapshot`
   - Kiến trúc tương tác chéo 100% CHUẨN QUYỀN FIRESTORE (không bao giờ lỗi permission):
     + Chủ tài khoản ghi: `wallPosts`, `socialProfile` (bio, ảnh bìa, Cap Messenger 24h)
     + Mọi người dùng ghi tương tác trên tài liệu của CHÍNH MÌNH:
       • `socialReactions.{postId}`: thả cảm xúc real-time lên MỌI bài viết
       • `socialComments`: bình luận real-time trên MỌI bài viết
       • `socialPokes.{targetUid}`: cổ vũ real-time cho MỌI thành viên
     + Bộ lắng nghe cộng đồng dùng chung (Shared Singleton Listener) gom & trộn
       dữ liệu tức thì + cập nhật lạc quan (Optimistic UI) 0ms mượt mà!
   ============================================================================ */
import { collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { checkVipFromDoc } from '../services/api.js';

const MAX_WALL_POSTS = 25;
const MAX_MY_COMMENTS = 80;

/* Phân loại bài đăng chuẩn MXH học tập + SEO (QAPage / DiscussionForumPosting) */
export const POST_CATEGORIES = [
  { id: 'discussion',   label: 'Thảo luận',    color: '#0071e3' },
  { id: 'question',     label: 'Hỏi bài KHTN', color: '#7c3aed' },
  { id: 'tip',          label: 'Mẹo học hay',  color: '#059669' },
  { id: 'study_invite', label: 'Học chung',    color: '#ea580c' },
];

const BLOCKED_SPAM_WORDS = ['cá độ', 'nhà cái', 'kubet', 'sunwin', 'xóc đĩa', 'lô đề', 'sex', 'porn'];
const _lastPostAttemptByUid = new Map();

export function buildSeoSlug(text = '', id = '') {
  const base = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 64)
    .replace(/-+$/, '');
  const shortId = String(id || '').replace(/[^a-zA-Z0-9_]/g, '').slice(-8) || 'elec';
  return base ? `${base}-${shortId}` : `bai-viet-${shortId}`;
}

export function extractHashtags(text = '') {
  const matches = String(text || '').match(/#[A-Za-z0-9_\u00C0-\u1EF9]{2,32}/g) || [];
  return Array.from(new Set(matches.map((t) => t.trim())));
}

export function evaluateSeoQuality(post = {}) {
  const txt = String(post.text || '').trim();
  const repliesCount = Object.keys(post.comments || {}).length;
  const hasKhtnKeyword = /(hóa|hoa|vật lí|vat li|sinh học|sinh hoc|toán|toan|este|lipit|dao động|thpt|đgnl|hsa|tsa|công thức|lời giải|đề thi|#)/i.test(txt);
  const indexable =
    !post.hiddenByAdmin &&
    (txt.length >= 80 ||
      ((post.category === 'question' || post.category === 'tip') && txt.length >= 45) ||
      (repliesCount >= 1 && txt.length >= 40) ||
      (hasKhtnKeyword && txt.length >= 50) ||
      Boolean(post.featuredByAdmin));
  return {
    indexable,
    slug: post.slug || buildSeoSlug(txt, post.id),
    metaTitle: `${txt.slice(0, 68) || 'Thảo luận học tập'} · Cộng đồng ELEC AI`,
    metaDescription: txt.slice(0, 155),
  };
}

export function computePostHotScore(post, nowMs = Date.now(), viewerCtx = {}) {
  if (!post) return 0;
  if (post.hiddenByAdmin) return -9999;
  const createdAt = Number(post.createdAt) || nowMs;
  const ageHours = Math.max(0, (nowMs - createdAt) / 3600000);

  const likes = Object.values(post.reactions || {}).reduce((s, m) => s + Object.keys(m || {}).length, 0);
  const commentsArr = Object.values(post.comments || {});
  const meaningfulComments = commentsArr.filter((c) => String(c?.text || '').trim().length >= 8).length;
  const totalComments = commentsArr.length;
  const reposts = Number(post.repostCount) || 0;
  const saves = Number(post.saveCount) || 0;
  const hasStudy = post.studyInvite ? 1 : 0;

  let qualityBonus = 0;
  if (post.category === 'question' || post.category === 'tip') qualityBonus += 3.5;
  if (extractHashtags(post.text).length > 0) qualityBonus += 2;
  if (String(post.text || '').length >= 80) qualityBonus += 2;
  if (post.authorVip) qualityBonus += 1.5;
  if (post.bestReplyId) qualityBonus += 4;

  // Cold-start boost trong 30 phút đầu để bài mới luôn có cơ hội tiếp cận
  const coldStart = ageHours < 0.5 ? 6 : ageHours < 2 ? 2.5 : 0;
  // Admin boost (Đẩy Xu Hướng 24h+)
  const adminBoost = post.featuredByAdmin ? 28 : 0;
  const globalPinBonus = post.pinnedGlobal ? 1000 : 0;

  const rawEngagement =
    1 * likes +
    3 * meaningfulComments +
    1.2 * Math.max(0, totalComments - meaningfulComments) +
    4 * reposts +
    5 * saves +
    4.5 * hasStudy +
    qualityBonus +
    coldStart +
    adminBoost;

  let score = rawEngagement / Math.pow(ageHours + 2, 1.55);

  // Cá nhân hóa Affinity nhẹ trên client (cùng trường / mục tiêu)
  if (viewerCtx.mySchool && post.authorSchool && post.authorSchool.toLowerCase() === viewerCtx.mySchool.toLowerCase()) {
    score *= 1.25;
  }

  return Number((globalPinBonus + score).toFixed(3));
}

export function rankCommunityPosts(posts = [], sortMode = 'trending', viewerCtx = {}) {
  const nowMs = Date.now();
  const visible = posts.filter((p) => !p.hiddenByAdmin || viewerCtx.isAdmin);
  if (sortMode === 'latest') {
    return [...visible].sort((a, b) => {
      if (Boolean(b.pinnedGlobal) !== Boolean(a.pinnedGlobal)) return Number(Boolean(b.pinnedGlobal)) - Number(Boolean(a.pinnedGlobal));
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    });
  }

  // Tính điểm nóng + áp dụng Author Diversity Penalty (chống 1 người chiếm bảng tin)
  const scored = visible.map((p) => ({
    post: p,
    baseScore: computePostHotScore(p, nowMs, viewerCtx),
  }));
  scored.sort((a, b) => b.baseScore - a.baseScore || (Number(b.post.createdAt) || 0) - (Number(a.post.createdAt) || 0));

  const seenAuthor = new Map();
  const diversified = scored.map((item) => {
    const aUid = item.post.authorUid || item.post.ownerUid || 'anon';
    const prevCount = seenAuthor.get(aUid) || 0;
    seenAuthor.set(aUid, prevCount + 1);
    const penalty = item.post.pinnedGlobal ? 1 : prevCount === 0 ? 1 : prevCount === 1 ? 0.58 : 0.28;
    return {
      ...item.post,
      hotScore: Number((item.baseScore * penalty).toFixed(2)),
    };
  });

  diversified.sort((a, b) => {
    if (Boolean(b.pinnedGlobal) !== Boolean(a.pinnedGlobal)) return Number(Boolean(b.pinnedGlobal)) - Number(Boolean(a.pinnedGlobal));
    return (b.hotScore || 0) - (a.hotScore || 0) || (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
  });
  return diversified;
}

/* Bảng màu ảnh bìa bản quyền ELEC AI (Mặc định: ELEC Cobalt) */
export const COVER_THEMES = [
  {
    id: 'cobalt',
    name: 'ELEC Cobalt (Mặc định)',
    css: 'linear-gradient(128deg, #0b2566 0%, #0066da 48%, #2b8cff 100%)',
  },
  {
    id: 'sapphire',
    name: 'ELEC Midnight',
    css: 'linear-gradient(128deg, #0a1428 0%, #14336b 52%, #1d4ed8 100%)',
  },
  {
    id: 'indigo',
    name: 'ELEC Indigo',
    css: 'linear-gradient(128deg, #1e1b4b 0%, #3730a3 50%, #2563eb 100%)',
  },
  {
    id: 'sky',
    name: 'ELEC Horizon',
    css: 'linear-gradient(128deg, #0369a1 0%, #0284c7 48%, #38bdf8 100%)',
  },
  {
    id: 'slate',
    name: 'ELEC Titanium',
    css: 'linear-gradient(128deg, #111827 0%, #1f2937 52%, #334155 100%)',
  },
  {
    id: 'sunset',
    name: 'ELEC Sunrise',
    css: 'linear-gradient(128deg, #1d4ed8 0%, #6d28d9 52%, #db2777 100%)',
  },
];

export const POST_BACKGROUNDS = [
  { id: 'none',     label: 'Nền trắng',   css: '' },
  { id: 'elec',     label: 'ELEC Cobalt', css: 'linear-gradient(135deg, #004bb5 0%, #0071e3 50%, #38bdf8 100%)' },
  { id: 'indigo',   label: 'ELEC Indigo', css: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 52%, #6366f1 100%)' },
  { id: 'sunset',   label: 'Hoàng hôn',   css: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 52%, #ec4899 100%)' },
  { id: 'ocean',    label: 'Đại dương',   css: 'linear-gradient(135deg, #0369a1 0%, #0284c7 52%, #06b6d4 100%)' },
  { id: 'midnight', label: 'Đêm Focus',   css: 'linear-gradient(135deg, #090f24 0%, #172554 54%, #1e40af 100%)' },
];

/* Trạng thái học tập gắn kèm Linh vật Bé Elec bản quyền ELEC AI */
export const POST_MOODS = [
  { id: '',        label: 'Không gắn linh vật', icon: 'none',   mascot: null },
  { id: 'grind',   label: 'Đang cày đề',        icon: 'flame',  mascot: '/img/elec/elec-fighting.png' },
  { id: 'target',  label: 'Mục tiêu 27+',       icon: 'target', mascot: '/img/elec/elec-cool.png' },
  { id: 'chem',    label: 'Ôn Hóa học',         icon: 'flask',  mascot: '/img/elec/elec-think.png' },
  { id: 'phys',    label: 'Bứt phá Vật lí',     icon: 'zap',    mascot: '/img/elec/elec-super-saiyan.png' },
  { id: 'chill',   label: 'Tập trung học bài',  icon: 'book',   mascot: '/img/elec/elec-happy.png' },
  { id: 'victory', label: 'Vừa phá kỷ lục',     icon: 'trophy', mascot: '/img/elec/elec-celebrate.png' },
];

/* Linh vật mini cho Cap Messenger 24h (giống Facebook Messenger Notes) */
export const NOTE_MASCOTS = [
  { id: 'fighting',  label: 'Quyết tâm', src: '/img/elec/elec-fighting.png' },
  { id: 'love',      label: 'Yêu thương', src: '/img/elec/elec-love.png' },
  { id: 'cool',      label: 'Học bá',    src: '/img/elec/elec-cool.png' },
  { id: 'think',     label: 'Đang nghĩ', src: '/img/elec/elec-think.png' },
  { id: 'celebrate', label: 'Ăn mừng',   src: '/img/elec/elec-celebrate.png' },
  { id: 'sleepy',    label: 'Cày đêm',   src: '/img/elec/elec-sleepy.png' },
];

export function getNoteMascotSrc(mascotId) {
  const found = NOTE_MASCOTS.find((m) => m.id === mascotId);
  return found ? found.src : null;
}

export const WALL_REACTIONS = [
  { key: 'like', label: 'Thích',     color: '#0071e3' },
  { key: 'love', label: 'Yêu thích', color: '#e11d48' },
  { key: 'fire', label: 'Xuất sắc',  color: '#ea580c' },
  { key: 'star', label: 'Ấn tượng',  color: '#d97706' },
];

export const TRENDING_HASHTAGS = [
  '#THPTQG2026',
  '#HocCungELEC',
  '#MucTieu27Plus',
  '#HoaHoc',
  '#VatLi',
  '#GiuChuoi',
];

/* Helper ghi an toàn lên Firestore `users/{uid}` theo đúng firestore.rules */
async function patchUserDoc(uid, fields) {
  const ref = doc(db, 'users', uid);
  try {
    await updateDoc(ref, fields);
    return true;
  } catch (err) {
    if (err?.code === 'not-found') {
      await setDoc(ref, fields, { merge: true });
      return true;
    }
    throw err;
  }
}

/* ============================================================================
   BỘ LẮNG NGHE CỘNG ĐỒNG DÙNG CHUNG (3-STREAM REAL-TIME HUB STORE)
   - Hoạt động chuẩn xác kể cả khi hệ thống có hàng chục nghìn tài khoản:
     1) `doc(db, 'users', meUid)`: Luôn bảo đảm hồ sơ, bài viết & Cap 24h của
        CHÍNH BẠN hiển thị tức thì và KHÔNG BAO GIỜ bị ghi đè mất.
     2) `orderBy('socialUpdatedAt', 'desc'), limit(80)`: 80 thành viên hoạt động
        MXH gần nhất (đăng cap, Cap Messenger 24h, cảm xúc, bình luận, cổ vũ).
     3) `orderBy('focusLive.lastPingAt', 'desc'), limit(30)`: 30 bạn đang học
        tập trung live gần nhất cho chức năng Học chung.
   ============================================================================ */
let _hubUnsubs = [];
let _hubMeUid = null;
let _myDocData = null;
let _socialDocsMap = new Map();
let _focusDocsMap = new Map();
let _hubDocsMap = new Map(); // hợp nhất 3 luồng: uid -> doc data
let _backfilledUid = null;

function rebuildMergedDocsMap() {
  const merged = new Map();
  _focusDocsMap.forEach((d, uid) => merged.set(uid, d));
  _socialDocsMap.forEach((d, uid) => merged.set(uid, d));
  if (_hubMeUid && _myDocData) {
    merged.set(_hubMeUid, _myDocData);
  }
  _hubDocsMap = merged;
}

let _hubSnapshot = {
  posts: [],
  messengerNotes: [],
  liveStudiers: [],
  pokesByTarget: {},
  myPosts: [],
  mySocialProfile: {},
  myComments: [],
  myReactions: {},
  myPokes: {},
  live: false,
};
const _hubListeners = new Set();

function recomputeHubSnapshot() {
  const now = Date.now();
  const meUid = _hubMeUid;

  // 1. Gom tất cả tương tác chéo (reactions, comments, pokes) từ MỌI user
  const crossReactionsByPost = {}; // postId -> { like: { uid: 1 }, ... }
  const crossCommentsByPost = {};  // postId -> { [cid]: commentObj }
  const crossPokesByTarget = {};   // targetUid -> { [fromUid]: { name, at } }

  _hubDocsMap.forEach((d, uid) => {
    const sr = d.socialReactions && typeof d.socialReactions === 'object' ? d.socialReactions : null;
    if (sr) {
      for (const [postId, rKey] of Object.entries(sr)) {
        if (!rKey || typeof rKey !== 'string') continue;
        if (!crossReactionsByPost[postId]) crossReactionsByPost[postId] = {};
        if (!crossReactionsByPost[postId][rKey]) crossReactionsByPost[postId][rKey] = {};
        crossReactionsByPost[postId][rKey][uid] = 1;
      }
    }

    const sc = Array.isArray(d.socialComments) ? d.socialComments : [];
    sc.forEach((c) => {
      if (!c || !c.id || !c.postId || !c.text) return;
      if (!crossCommentsByPost[c.postId]) crossCommentsByPost[c.postId] = {};
      crossCommentsByPost[c.postId][c.id] = c;
    });

    const spk = d.socialPokes && typeof d.socialPokes === 'object' ? d.socialPokes : null;
    if (spk) {
      for (const [targetUid, info] of Object.entries(spk)) {
        if (!info) continue;
        if (!crossPokesByTarget[targetUid]) crossPokesByTarget[targetUid] = {};
        crossPokesByTarget[targetUid][uid] = {
          name: info.name || d.displayName || d.name || 'Bạn học',
          at: Number(info.at) || 0,
        };
      }
    }

    // Gộp cả legacy wallPokes (nếu có)
    const legacyPokes = d.wallPokes && typeof d.wallPokes === 'object' ? d.wallPokes : null;
    if (legacyPokes) {
      if (!crossPokesByTarget[uid]) crossPokesByTarget[uid] = {};
      for (const [fromUid, info] of Object.entries(legacyPokes)) {
        if (!crossPokesByTarget[uid][fromUid]) {
          crossPokesByTarget[uid][fromUid] = info;
        }
      }
    }
  });

  // Gom số lượt lưu, số lượt báo cáo & số lượt đăng lại của từng bài
  const saveCountByPost = {};
  const reportMapByPost = {};
  const repostCountByPost = {};

  _hubDocsMap.forEach((d, uid) => {
    const saved = Array.isArray(d.savedPostIds) ? d.savedPostIds : [];
    saved.forEach((pid) => {
      if (pid) saveCountByPost[pid] = (saveCountByPost[pid] || 0) + 1;
    });
    const reps = d.socialReports && typeof d.socialReports === 'object' ? d.socialReports : null;
    if (reps) {
      for (const [pid, repInfo] of Object.entries(reps)) {
        if (!pid || !repInfo) continue;
        if (!reportMapByPost[pid]) reportMapByPost[pid] = {};
        reportMapByPost[pid][uid] = repInfo;
      }
    }
    const wall = Array.isArray(d.wallPosts) ? d.wallPosts : [];
    wall.forEach((p) => {
      const origId = p?.repostOf?.originalPostId;
      if (origId) repostCountByPost[origId] = (repostCountByPost[origId] || 0) + 1;
    });
  });

  // 2. Gom Posts, Cap Messenger 24h & Live Studiers
  const allPosts = [];
  const messengerNotes = [];
  const liveStudiers = [];
  let myPosts = [];
  let mySocialProfile = {};
  let myComments = [];
  let myReactions = {};
  let myPokes = {};
  let mySavedPostIds = [];
  let myReportedPostIds = [];

  _hubDocsMap.forEach((d, uid) => {
    const displayName = d.displayName || d.name || 'Thành viên ELEC';
    const photoURL = d.photoURL || null;
    const vip = checkVipFromDoc(d);
    const sp = d.socialProfile && typeof d.socialProfile === 'object' ? d.socialProfile : {};
    const school = sp.school || d.school || '';

    const rawWall = Array.isArray(d.wallPosts) ? d.wallPosts.filter((p) => p && p.id) : [];

    if (uid === meUid) {
      myPosts = [...rawWall].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
      mySocialProfile = sp;
      myComments = Array.isArray(d.socialComments) ? d.socialComments : [];
      myReactions = d.socialReactions && typeof d.socialReactions === 'object' ? d.socialReactions : {};
      myPokes = d.socialPokes && typeof d.socialPokes === 'object' ? d.socialPokes : {};
      mySavedPostIds = Array.isArray(d.savedPostIds) ? d.savedPostIds : [];
      myReportedPostIds = d.socialReports && typeof d.socialReports === 'object' ? Object.keys(d.socialReports) : [];
    }

    rawWall.forEach((p) => {
      const txt = String(p.text || '').trim();
      if (!txt && !p.studyInvite) return;

      // Trộn cảm xúc: ưu tiên crossReactionsByPost (để gỡ cảm xúc hoạt động chuẩn), cộng thêm legacy nếu chưa có
      const mergedReactions = {};
      const legacyR = p.reactions && typeof p.reactions === 'object' ? p.reactions : {};
      for (const [rk, uMap] of Object.entries(legacyR)) {
        for (const rUid of Object.keys(uMap || {})) {
          const rUserDoc = _hubDocsMap.get(rUid);
          if (rUserDoc?.socialReactions && Object.prototype.hasOwnProperty.call(rUserDoc.socialReactions, p.id)) {
            continue;
          }
          if (!mergedReactions[rk]) mergedReactions[rk] = {};
          mergedReactions[rk][rUid] = 1;
        }
      }
      const crossR = crossReactionsByPost[p.id] || {};
      for (const [rk, uMap] of Object.entries(crossR)) {
        if (!mergedReactions[rk]) mergedReactions[rk] = {};
        Object.assign(mergedReactions[rk], uMap);
      }

      // Trộn bình luận: legacy + cross-user comments
      const mergedComments = {
        ...(p.comments && typeof p.comments === 'object' ? p.comments : {}),
        ...(crossCommentsByPost[p.id] || {}),
      };

      const category = p.studyInvite
        ? 'study_invite'
        : ['discussion', 'question', 'tip', 'study_invite'].includes(p.category)
          ? p.category
          : 'discussion';
      const reportCount = Object.keys(reportMapByPost[p.id] || {}).length;
      const postObj = {
        ...p,
        category,
        slug: p.slug || buildSeoSlug(txt, p.id),
        ownerUid: p.ownerUid || uid,
        authorName: (!p.authorUid || p.authorUid === uid) ? (displayName || p.authorName) : (p.authorName || displayName),
        authorPhoto: (!p.authorUid || p.authorUid === uid) ? (photoURL || p.authorPhoto) : (p.authorPhoto || photoURL),
        authorVip: vip,
        authorSchool: school,
        text: txt,
        reactions: mergedReactions,
        comments: mergedComments,
        saveCount: saveCountByPost[p.id] || 0,
        repostCount: repostCountByPost[p.id] || 0,
        reportCount,
        needsReview: reportCount >= 3,
      };
      postObj.hotScore = computePostHotScore(postObj, now);
      postObj.seo = evaluateSeoQuality(postObj);
      allPosts.push(postObj);
    });

    const fl = d.focusLive && typeof d.focusLive === 'object' ? d.focusLive : null;
    const isFocusLive = !!(fl?.lastPingAt && now - Number(fl.lastPingAt) < 5 * 60 * 1000);
    if (isFocusLive) {
      liveStudiers.push({
        uid,
        name: fl.name || displayName,
        photoURL: fl.photoURL || photoURL,
        task: fl.task || 'Đang tập trung học bài',
        uni: fl.uni || sp.targetUni || '',
        todayMins: Number(fl.todayMins) || 0,
        lastPingAt: Number(fl.lastPingAt),
        vip,
      });
    }

    const noteTxt = String(sp.note24h || '').trim();
    const noteAt = Number(sp.note24hAt) || 0;
    const noteFresh = noteTxt && (!noteAt || now - noteAt < 24 * 3600 * 1000);
    if (noteFresh || isFocusLive) {
      messengerNotes.push({
        uid,
        name: displayName,
        photoURL,
        note: noteFresh ? noteTxt : '',
        mascotId: sp.note24hMascot || '',
        at: noteFresh ? noteAt : Number(fl?.lastPingAt) || 0,
        isLive: isFocusLive,
        liveTask: isFocusLive ? (fl.task || 'Đang tập trung') : '',
        vip,
      });
    }
  });

  allPosts.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  liveStudiers.sort((a, b) => (b.lastPingAt || 0) - (a.lastPingAt || 0));
  messengerNotes.sort((a, b) => {
    if (a.uid === meUid) return -1;
    if (b.uid === meUid) return 1;
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return (b.at || 0) - (a.at || 0);
  });

  // Tính #Hashtag Xu hướng thực tế theo gia tốc 24h + 7 ngày
  const tagStats = new Map();
  allPosts.forEach((p) => {
    if (p.hiddenByAdmin) return;
    const tags = extractHashtags(p.text);
    const isFresh24h = now - (Number(p.createdAt) || 0) < 24 * 3600 * 1000;
    tags.forEach((rawTag) => {
      const key = rawTag.toLowerCase();
      const prev = tagStats.get(key) || { tag: rawTag, count: 0, velocity: 0 };
      prev.count += 1;
      prev.velocity += isFresh24h ? 2.5 : 1;
      tagStats.set(key, prev);
    });
  });
  const liveTrendingTags = [...tagStats.values()]
    .sort((a, b) => b.velocity - a.velocity || b.count - a.count)
    .slice(0, 8);
  const existingKeys = new Set(liveTrendingTags.map((t) => t.tag.toLowerCase()));
  TRENDING_HASHTAGS.forEach((tag) => {
    if (liveTrendingTags.length < 7 && !existingKeys.has(tag.toLowerCase())) {
      liveTrendingTags.push({ tag, count: 0, velocity: 0 });
    }
  });

  // Tổng hợp thông báo tương tác cộng đồng cho tài khoản hiện tại (dùng cho Chuông Thông Báo!)
  const myNotifications = [];
  if (meUid) {
    allPosts.forEach((p) => {
      if (p.ownerUid !== meUid && p.authorUid !== meUid) return;
      const snippet = String(p.text || p.studyInvite?.topic || '').slice(0, 64);
      Object.values(p.comments || {}).forEach((c) => {
        if (c && c.authorUid && c.authorUid !== meUid) {
          myNotifications.push({
            id: `reply_${p.id}_${c.id}`,
            type: 'reply',
            actorName: c.authorName || 'Bạn học',
            postId: p.id,
            text: `${c.authorName || 'Bạn học'} vừa trả lời bài "${snippet}": "${String(c.text || '').slice(0, 72)}"`,
            at: Number(c.createdAt) || p.createdAt || now,
          });
        }
      });
      const likeUids = Object.values(p.reactions || {}).flatMap((uMap) => Object.keys(uMap || {})).filter((u) => u !== meUid);
      if (likeUids.length > 0) {
        myNotifications.push({
          id: `react_${p.id}_${likeUids.length}`,
          type: 'reaction',
          postId: p.id,
          count: likeUids.length,
          text: `${likeUids.length} bạn học đã thả cảm xúc bài "${snippet}" của bạn`,
          at: Number(p.createdAt) || now,
        });
      }
      if (p.featuredByAdmin) {
        myNotifications.push({
          id: `feat_${p.id}`,
          type: 'trending',
          postId: p.id,
          text: `Bài viết "${snippet}" của bạn vừa được Admin đẩy lên Top Xu hướng Cộng đồng ELEC!`,
          at: Number(p.featuredAt || p.createdAt) || now,
        });
      }
    });
    myNotifications.sort((a, b) => (b.at || 0) - (a.at || 0));
  }

  _hubSnapshot = {
    posts: allPosts.slice(0, 100),
    messengerNotes: messengerNotes.slice(0, 30),
    liveStudiers: liveStudiers.slice(0, 24),
    pokesByTarget: crossPokesByTarget,
    trendingTags: liveTrendingTags,
    myNotifications: myNotifications.slice(0, 12),
    myPosts,
    mySocialProfile,
    myComments,
    myReactions,
    myPokes,
    mySavedPostIds,
    myReportedPostIds,
    live: true,
  };

  _hubListeners.forEach((cb) => {
    try { cb(_hubSnapshot); } catch { /* ignore */ }
  });
}

function applyOptimisticUserPatch(uid, mutator) {
  if (!uid) return;
  const prev = _hubDocsMap.get(uid) || {};
  const next = mutator({ ...prev });
  if (uid === _hubMeUid) {
    _myDocData = next;
  }
  _socialDocsMap.set(uid, next);
  rebuildMergedDocsMap();
  recomputeHubSnapshot();
}

function stopHubStreams() {
  _hubUnsubs.forEach((u) => { try { u(); } catch { /* ignore */ } });
  _hubUnsubs = [];
  _hubMeUid = null;
}

function ensureHubStarted(meUid) {
  if (!meUid || meUid === 'anonymous') return;
  if (_hubUnsubs.length > 0 && _hubMeUid === meUid) return;
  stopHubStreams();
  _hubMeUid = meUid;

  // Luồng 1: Luôn nghe trực tiếp tài liệu của CHÍNH BẠN (bảo đảm 100% thấy bài & Cap của mình tức thì)
  const unsubMe = onSnapshot(
    doc(db, 'users', meUid),
    (snap) => {
      const data = snap.exists() ? (snap.data() || {}) : {};
      _myDocData = data;
      rebuildMergedDocsMap();
      recomputeHubSnapshot();

      // Backfill 1 lần `socialUpdatedAt` nếu bạn đã có bài viết/Cap 24h cũ để cả cộng đồng thấy ngay!
      const hasLegacySocial =
        (Array.isArray(data.wallPosts) && data.wallPosts.length > 0) ||
        Boolean(data.socialProfile?.note24h);
      if (hasLegacySocial && !data.socialUpdatedAt && _backfilledUid !== meUid) {
        _backfilledUid = meUid;
        patchUserDoc(meUid, { socialUpdatedAt: Date.now() }).catch(() => {});
      }
    },
    () => {}
  );

  // Luồng 2: 80 thành viên hoạt động MXH gần nhất (orderBy single-field tự động có index trên Firestore!)
  const qSocial = query(collection(db, 'users'), orderBy('socialUpdatedAt', 'desc'), limit(80));
  const unsubSocial = onSnapshot(
    qSocial,
    (snap) => {
      const nextMap = new Map();
      snap.docs.forEach((docSnap) => {
        nextMap.set(docSnap.id, docSnap.data() || {});
      });
      _socialDocsMap = nextMap;
      rebuildMergedDocsMap();
      recomputeHubSnapshot();
    },
    () => {
      // Vẫn giữ dữ liệu của chính mình hoạt động nếu query bị lỗi mạng
      rebuildMergedDocsMap();
      recomputeHubSnapshot();
    }
  );

  // Luồng 3: 30 thành viên đang tập trung live gần nhất (Học chung)
  const qFocus = query(collection(db, 'users'), orderBy('focusLive.lastPingAt', 'desc'), limit(30));
  const unsubFocus = onSnapshot(
    qFocus,
    (snap) => {
      const nextMap = new Map();
      snap.docs.forEach((docSnap) => {
        nextMap.set(docSnap.id, docSnap.data() || {});
      });
      _focusDocsMap = nextMap;
      rebuildMergedDocsMap();
      recomputeHubSnapshot();
    },
    () => {}
  );

  _hubUnsubs = [unsubMe, unsubSocial, unsubFocus];
}

export function subscribeCommunityFeed(meUid, onUpdate) {
  if (!meUid || meUid === 'anonymous') {
    onUpdate({
      posts: [],
      messengerNotes: [],
      liveStudiers: [],
      pokesByTarget: {},
      myPosts: [],
      mySocialProfile: {},
      myComments: [],
      myReactions: {},
      myPokes: {},
      live: false,
    });
    return () => {};
  }

  _hubListeners.add(onUpdate);
  ensureHubStarted(meUid);
  if (_hubSnapshot.live) {
    onUpdate(_hubSnapshot);
  }

  return () => {
    _hubListeners.delete(onUpdate);
    if (_hubListeners.size === 0) {
      stopHubStreams();
    }
  };
}

/* ── 1. LẮNG NGHE THỜI GIAN THỰC TRANG CÁ NHÂN (TRỘN TƯƠNG TÁC CHÉO REALTIME) ── */
export function subscribeFullSocialProfile(uid, onUpdate, viewerUid = null) {
  if (!uid || uid === 'anonymous') {
    onUpdate({
      profile: null,
      ext: null,
      posts: [],
      pokes: { count: 0, map: {} },
      focusLive: null,
      live: false,
      error: null,
    });
    return () => {};
  }

  let latestDoc = null;
  let latestHub = _hubSnapshot;
  let docLive = false;

  const emitCombined = () => {
    const d = latestDoc || {};
    const vip = checkVipFromDoc(d);
    const sp = d.socialProfile || {};
    const validCover = COVER_THEMES.some((c) => c.id === sp.coverTheme) ? sp.coverTheme : 'cobalt';

    // Nếu hub đang chạy, lấy danh sách bài viết của uid này đã trộn tương tác chéo; ngược lại lấy trực tiếp từ doc
    const hubPostsForUser = (latestHub?.posts || []).filter((p) => p.ownerUid === uid);
    const rawWall = (Array.isArray(d.wallPosts) ? d.wallPosts : [])
      .filter((p) => p && p.id)
      .sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
        return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      })
      .slice(0, MAX_WALL_POSTS);

    const posts = hubPostsForUser.length > 0 || latestHub?.live
      ? rawWall.map((p) => {
          const enriched = hubPostsForUser.find((hp) => hp.id === p.id);
          return enriched || p;
        })
      : rawWall;

    const pokesMap = {
      ...(d.wallPokes && typeof d.wallPokes === 'object' ? d.wallPokes : {}),
      ...(latestHub?.pokesByTarget?.[uid] || {}),
    };
    const focusLive = d.focusLive && typeof d.focusLive === 'object' ? d.focusLive : null;

    onUpdate({
      profile: {
        uid,
        name: d.displayName || d.name || null,
        photoURL: d.photoURL || null,
        vip,
        tier: vip ? 'vip' : String(d.tier || 'free').toLowerCase(),
        role: d.role || 'student',
        public: {
          level: d.public?.level ?? d.level ?? 1,
          xp: d.public?.xp ?? d.xp ?? 0,
          streak: d.public?.streak ?? (typeof d.streak === 'number' ? d.streak : d.streak?.count ?? 0),
          accuracy: d.public?.accuracy ?? d.accuracy ?? null,
          totalAnswers: d.public?.totalAnswers ?? d.totalAnswers ?? 0,
        },
      },
      ext: {
        bio: sp.bio || '',
        coverTheme: validCover,
        note24h: sp.note24h || '',
        note24hAt: sp.note24hAt || 0,
        note24hMascot: sp.note24hMascot || '',
        school: sp.school || d.school || '',
        grade: sp.grade || d.grade || '',
        targetUni: sp.targetUni || d.targetUniversity || d.nv1SchoolName || '',
        targetScore: sp.targetScore || '',
        createdAt: d.createdAt || null,
      },
      posts,
      pokes: { count: Object.keys(pokesMap).length, map: pokesMap },
      focusLive,
      live: docLive,
      error: null,
    });
  };

  const unsubDoc = onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      latestDoc = snap.exists() ? (snap.data() || {}) : {};
      docLive = true;
      emitCombined();
    },
    (err) => {
      onUpdate({
        profile: null,
        ext: null,
        posts: [],
        pokes: { count: 0, map: {} },
        focusLive: null,
        live: false,
        error: err?.code || 'offline',
      });
    }
  );

  let unsubHub = () => {};
  const effectiveViewer = viewerUid || _hubMeUid || uid;
  if (effectiveViewer && effectiveViewer !== 'anonymous') {
    unsubHub = subscribeCommunityFeed(effectiveViewer, (hubData) => {
      latestHub = hubData;
      if (latestDoc) emitCombined();
    });
  }

  return () => {
    unsubDoc?.();
    unsubHub?.();
  };
}

/* Lắng nghe trạng thái kết bạn thời gian thực */
export function subscribeFriendStatus(meUid, otherUid, onChange) {
  if (!meUid || !otherUid || meUid === otherUid || otherUid === 'anonymous') {
    onChange(meUid === otherUid ? 'self' : 'none');
    return () => {};
  }
  const state = { fr: false, incoming: false, requested: false };
  const emit = () => {
    if (state.fr) onChange('friends');
    else if (state.incoming) onChange('incoming');
    else if (state.requested) onChange('requested');
    else onChange('none');
  };

  const u1 = onSnapshot(doc(db, 'users', meUid, 'friends', otherUid), (s) => {
    state.fr = s.exists(); emit();
  }, () => {});
  const u2 = onSnapshot(doc(db, 'users', meUid, 'friendRequests', otherUid), (s) => {
    state.incoming = s.exists(); emit();
  }, () => {});
  const u3 = onSnapshot(doc(db, 'users', otherUid, 'friendRequests', meUid), (s) => {
    state.requested = s.exists(); emit();
  }, () => {});

  return () => { u1(); u2(); u3(); };
}

/* ── 2. LƯU THÔNG TIN HỒ SƠ & CAP MESSENGER 24H (OPTIMISTIC + REALTIME) ── */
export async function saveExtendedSocialProfile(uid, currentExt = {}, patch = {}) {
  if (!uid || uid === 'anonymous') return;
  const merged = {
    bio: currentExt?.bio || '',
    coverTheme: currentExt?.coverTheme || 'cobalt',
    note24h: currentExt?.note24h || '',
    note24hAt: currentExt?.note24hAt || 0,
    note24hMascot: currentExt?.note24hMascot || '',
    school: currentExt?.school || '',
    grade: currentExt?.grade || '',
    targetUni: currentExt?.targetUni || '',
    targetScore: currentExt?.targetScore || '',
    ...patch,
    updatedAt: Date.now(),
  };
  const nowTs = Date.now();
  applyOptimisticUserPatch(uid, (prev) => ({ ...prev, socialProfile: merged, socialUpdatedAt: nowTs }));
  await patchUserDoc(uid, { socialProfile: merged, socialUpdatedAt: nowTs });
}

export async function saveMessengerNote(uid, { note = '', mascotId = '' } = {}) {
  if (!uid || uid === 'anonymous') throw new Error('Cần đăng nhập để đăng Cap Messenger');
  const cleanNote = String(note || '').trim().slice(0, 60);
  const currentSp = _hubDocsMap.get(uid)?.socialProfile || _hubSnapshot.mySocialProfile || {};
  await saveExtendedSocialProfile(uid, currentSp, {
    note24h: cleanNote,
    note24hAt: cleanNote ? Date.now() : 0,
    note24hMascot: cleanNote ? String(mascotId || '') : '',
  });
}

/* ── 3. ĐĂNG CAP CHỮ / XÓA BÀI / CẢM XÚC / BÌNH LUẬN / CỔ VŨ (100% REALTIME MỌI USER) ── */
export async function createWallPost(ownerUid, currentPosts, post) {
  if (!ownerUid || ownerUid === 'anonymous') throw new Error('Cần đăng nhập để đăng bài');
  const cleanText = String(post.text || '').trim().slice(0, 800);
  const studyInvite = post.studyInvite
    ? {
        durationMin: Math.max(15, Math.min(120, Number(post.studyInvite.durationMin) || 25)),
        topic: String(post.studyInvite.topic || '').trim().slice(0, 120) || 'Cùng tập trung ôn thi',
        hostUid: post.studyInvite.hostUid || post.authorUid,
        hostName: String(post.studyInvite.hostName || post.authorName || 'Thành viên ELEC').slice(0, 80),
        createdAt: Date.now(),
      }
    : null;

  if (!cleanText && !studyInvite) {
    throw new Error('Vui lòng nhập nội dung cap chữ');
  }

  // Tầng 1 Kiểm duyệt tức thì: Anti-spam & lọc từ cấm cơ bản
  const lowerTxt = cleanText.toLowerCase();
  if (BLOCKED_SPAM_WORDS.some((w) => lowerTxt.includes(w))) {
    throw new Error('Nội dung chứa từ khóa không phù hợp với cộng đồng học tập ELEC AI');
  }
  const prevAttempt = _lastPostAttemptByUid.get(ownerUid);
  if (prevAttempt && Date.now() - prevAttempt.at < 8000 && prevAttempt.text === cleanText && !post.repostOf) {
    throw new Error('Bạn vừa đăng nội dung này rồi, vui lòng đợi vài giây');
  }
  _lastPostAttemptByUid.set(ownerUid, { at: Date.now(), text: cleanText });

  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const category = studyInvite
    ? 'study_invite'
    : ['discussion', 'question', 'tip', 'study_invite'].includes(post.category)
      ? post.category
      : 'discussion';
  const slug = buildSeoSlug(cleanText || studyInvite?.topic, id);
  const hashtags = extractHashtags(cleanText).map((h) => h.toLowerCase());

  const created = {
    id,
    slug,
    category,
    hashtags,
    ownerUid,
    authorUid: post.authorUid,
    authorName: String(post.authorName || 'Thành viên ELEC').slice(0, 80),
    authorPhoto: post.authorPhoto || null,
    text: cleanText,
    bgId: studyInvite ? 'none' : (post.bgId || 'none'),
    mood: post.mood || '',
    studyInvite,
    repostOf: post.repostOf || null,
    createdAt: Date.now(),
    reactions: {},
    comments: {},
  };

  const baseList = Array.isArray(currentPosts) && currentPosts.length > 0
    ? currentPosts
    : (_hubDocsMap.get(ownerUid)?.wallPosts || []);
  const nextList = [created, ...baseList].slice(0, MAX_WALL_POSTS);
  const nowTs = Date.now();

  const userPatch = { wallPosts: nextList, socialUpdatedAt: nowTs };
  if (post.authorPhoto && post.authorUid === ownerUid) {
    userPatch.photoURL = post.authorPhoto;
  }
  applyOptimisticUserPatch(ownerUid, (prev) => ({ ...prev, ...userPatch }));
  await patchUserDoc(ownerUid, userPatch);

  // Đồng bộ bản sao công khai sang `communityPosts/{id}` phục vụ SEO / AEO / GEO & trang `/cong-dong`
  try {
    const seo = evaluateSeoQuality(created);
    await setDoc(doc(db, 'communityPosts', id), {
      ...created,
      status: 'published',
      featuredByAdmin: false,
      pinnedGlobal: false,
      hiddenByAdmin: false,
      seo,
      hotScore: computePostHotScore(created, nowTs),
      updatedAt: nowTs,
    });
  } catch { /* Không chặn người dùng nếu rule communityPosts chưa được deploy lên prod */ }

  return nextList;
}

export async function deleteWallPost(ownerUid, currentPosts, postId) {
  const baseList = Array.isArray(currentPosts) && currentPosts.length > 0
    ? currentPosts
    : (_hubDocsMap.get(ownerUid)?.wallPosts || []);
  const nextList = baseList.filter((p) => p.id !== postId);
  const nowTs = Date.now();
  applyOptimisticUserPatch(ownerUid, (prev) => ({ ...prev, wallPosts: nextList, socialUpdatedAt: nowTs }));
  await patchUserDoc(ownerUid, { wallPosts: nextList, socialUpdatedAt: nowTs });
  try {
    await deleteDoc(doc(db, 'communityPosts', postId));
  } catch { /* ignore */ }
  return nextList;
}

/* Báo cáo bài viết vi phạm — ghi vào `users/{meUid}.socialReports` (0 lỗi quyền) */
export async function reportWallPost(meUid, postId, reason = 'Nội dung không phù hợp') {
  if (!meUid || !postId || meUid === 'anonymous') return;
  const curDoc = _hubDocsMap.get(meUid) || {};
  const prev = curDoc.socialReports && typeof curDoc.socialReports === 'object' ? curDoc.socialReports : {};
  const next = { ...prev, [postId]: { reason: String(reason).slice(0, 120), at: Date.now() } };
  const nowTs = Date.now();
  applyOptimisticUserPatch(meUid, (p) => ({ ...p, socialReports: next, socialUpdatedAt: nowTs }));
  await patchUserDoc(meUid, { socialReports: next, socialUpdatedAt: nowTs });
}

/* Cập nhật trường kiểm duyệt/đẩy xu hướng/lời giải chuẩn trên 1 bài viết (chủ bài hoặc Admin) */
async function mutateOwnerPost(ownerUid, postId, updater) {
  if (!ownerUid || !postId) return null;
  let baseList = _hubDocsMap.get(ownerUid)?.wallPosts;
  if (!Array.isArray(baseList)) {
    const snap = await getDoc(doc(db, 'users', ownerUid));
    baseList = snap.exists() && Array.isArray(snap.data()?.wallPosts) ? snap.data().wallPosts : [];
  }
  let updatedPost = null;
  const nextList = baseList.map((p) => {
    if (p.id !== postId) return p;
    updatedPost = updater(p);
    return updatedPost;
  });
  if (!updatedPost) return null;
  const nowTs = Date.now();
  applyOptimisticUserPatch(ownerUid, (prev) => ({ ...prev, wallPosts: nextList, socialUpdatedAt: nowTs }));
  await patchUserDoc(ownerUid, { wallPosts: nextList, socialUpdatedAt: nowTs });
  try {
    await setDoc(
      doc(db, 'communityPosts', postId),
      {
        ...updatedPost,
        status: updatedPost.hiddenByAdmin ? 'hidden' : 'published',
        seo: evaluateSeoQuality(updatedPost),
        updatedAt: nowTs,
      },
      { merge: true }
    );
  } catch { /* ignore */ }
  return updatedPost;
}

export async function markBestReply(ownerUid, postId, commentId) {
  return mutateOwnerPost(ownerUid, postId, (p) => ({
    ...p,
    bestReplyId: p.bestReplyId === commentId ? null : commentId,
  }));
}

export async function adminToggleFeaturePost(ownerUid, postId) {
  return mutateOwnerPost(ownerUid, postId, (p) => ({
    ...p,
    featuredByAdmin: !p.featuredByAdmin,
    featuredAt: !p.featuredByAdmin ? Date.now() : 0,
  }));
}

export async function adminToggleGlobalPinPost(ownerUid, postId) {
  return mutateOwnerPost(ownerUid, postId, (p) => ({
    ...p,
    pinnedGlobal: !p.pinnedGlobal,
  }));
}

export async function adminToggleHidePost(ownerUid, postId) {
  return mutateOwnerPost(ownerUid, postId, (p) => ({
    ...p,
    hiddenByAdmin: !p.hiddenByAdmin,
  }));
}

/* Thả cảm xúc trên BẤT KỲ bài viết nào — ghi vào `users/{reactorUid}.socialReactions` nên 100% không lỗi quyền! */
export async function toggleWallPostReaction(_ownerUid, _currentPosts, postId, reactorUid, reactionKey) {
  if (!postId || !reactorUid || reactorUid === 'anonymous') return [];
  const curDoc = _hubDocsMap.get(reactorUid) || {};
  const prevMap = curDoc.socialReactions && typeof curDoc.socialReactions === 'object' ? curDoc.socialReactions : {};
  const nextVal = prevMap[postId] === reactionKey ? null : reactionKey;
  const nextMap = { ...prevMap, [postId]: nextVal };
  const nowTs = Date.now();

  applyOptimisticUserPatch(reactorUid, (prev) => ({ ...prev, socialReactions: nextMap, socialUpdatedAt: nowTs }));
  await patchUserDoc(reactorUid, { socialReactions: nextMap, socialUpdatedAt: nowTs });
  return _hubSnapshot.posts;
}

/* Bình luận trên BẤT KỲ bài viết nào — ghi vào `users/{authorUid}.socialComments` nên 100% không lỗi quyền! */
export async function addWallPostComment(_ownerUid, _currentPosts, postId, { authorUid, authorName, authorPhoto, text }) {
  const cleanText = String(text || '').trim().slice(0, 360);
  if (!postId || !authorUid || authorUid === 'anonymous' || !cleanText) return [];
  const cid = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const commentObj = {
    id: cid,
    postId,
    authorUid,
    authorName: String(authorName || 'Bạn học').slice(0, 80),
    authorPhoto: authorPhoto || null,
    text: cleanText,
    createdAt: Date.now(),
  };
  const curDoc = _hubDocsMap.get(authorUid) || {};
  const prevComments = Array.isArray(curDoc.socialComments) ? curDoc.socialComments : [];
  const nextComments = [commentObj, ...prevComments].slice(0, MAX_MY_COMMENTS);
  const nowTs = Date.now();

  applyOptimisticUserPatch(authorUid, (prev) => ({ ...prev, socialComments: nextComments, socialUpdatedAt: nowTs }));
  await patchUserDoc(authorUid, { socialComments: nextComments, socialUpdatedAt: nowTs });
  return _hubSnapshot.posts;
}

/* Cổ vũ BẤT KỲ thành viên nào — ghi vào `users/{fromUid}.socialPokes` nên 100% không lỗi quyền! */
export async function sendWallPoke(targetUid, _currentPokeMap, fromUid, fromName) {
  if (!targetUid || !fromUid || fromUid === 'anonymous') return { count: 0, map: {} };
  const curDoc = _hubDocsMap.get(fromUid) || {};
  const prevPokes = curDoc.socialPokes && typeof curDoc.socialPokes === 'object' ? curDoc.socialPokes : {};
  const nextPokes = {
    ...prevPokes,
    [targetUid]: { name: String(fromName || 'Bạn học').slice(0, 80), at: Date.now() },
  };
  const nowTs = Date.now();

  applyOptimisticUserPatch(fromUid, (prev) => ({ ...prev, socialPokes: nextPokes, socialUpdatedAt: nowTs }));
  await patchUserDoc(fromUid, { socialPokes: nextPokes, socialUpdatedAt: nowTs });
  const merged = _hubSnapshot.pokesByTarget?.[targetUid] || {};
  return { count: Object.keys(merged).length, map: merged };
}

/* Ghim / Bỏ ghim bài viết lên đầu trang cá nhân (giống Facebook & TikTok) */
export async function togglePinWallPost(ownerUid, currentPosts, postId) {
  if (!ownerUid || !postId) return [];
  const baseList = Array.isArray(currentPosts) && currentPosts.length > 0
    ? currentPosts
    : (_hubDocsMap.get(ownerUid)?.wallPosts || []);
  const target = baseList.find((p) => p.id === postId);
  const willPin = !target?.pinned;
  const nextList = baseList.map((p) => ({
    ...p,
    pinned: p.id === postId ? willPin : false,
  }));
  const nowTs = Date.now();
  applyOptimisticUserPatch(ownerUid, (prev) => ({ ...prev, wallPosts: nextList, socialUpdatedAt: nowTs }));
  await patchUserDoc(ownerUid, { wallPosts: nextList, socialUpdatedAt: nowTs });
  return nextList;
}

/* Lưu / Bỏ lưu bài viết yêu thích (Bookmark giống Facebook & TikTok) */
export async function toggleSavePost(meUid, postId) {
  if (!meUid || !postId || meUid === 'anonymous') return [];
  const curDoc = _hubDocsMap.get(meUid) || {};
  const prev = Array.isArray(curDoc.savedPostIds) ? curDoc.savedPostIds : [];
  const exists = prev.includes(postId);
  const next = exists ? prev.filter((id) => id !== postId) : [postId, ...prev].slice(0, 60);
  const nowTs = Date.now();
  applyOptimisticUserPatch(meUid, (p) => ({ ...p, savedPostIds: next, socialUpdatedAt: nowTs }));
  await patchUserDoc(meUid, { savedPostIds: next, socialUpdatedAt: nowTs });
  return next;
}

/* ── 4. BÀN GIAO PHIÊN "HỌC CHUNG" SANG PHÒNG TẬP TRUNG (#pomodoro) ── */
const STUDY_HANDOFF_KEY = 'elec_study_together_handoff_v1';

export function saveStudyTogetherHandoff({
  partnerUid = null,
  partnerName = '',
  topic = 'Cùng tập trung ôn thi',
  durationMin = 25,
  openClassroom = false,
} = {}) {
  const payload = {
    partnerUid: partnerUid || null,
    partnerName: String(partnerName || '').trim().slice(0, 48),
    topic: String(topic || 'Cùng tập trung ôn thi').trim().slice(0, 120),
    durationMin: Math.max(15, Math.min(120, Number(durationMin) || 25)),
    openClassroom: Boolean(openClassroom),
    createdAt: Date.now(),
  };
  try {
    sessionStorage.setItem(STUDY_HANDOFF_KEY, JSON.stringify(payload));
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent('elec-study-together-launch', { detail: payload }));
  } catch { /* ignore */ }
  return payload;
}

export function consumeStudyTogetherHandoff() {
  try {
    const raw = sessionStorage.getItem(STUDY_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STUDY_HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - (Number(parsed.createdAt) || 0) > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}
