/* ============================================================================
   NavNotificationPopover.jsx — Trung Tâm Thông Báo Thông Minh ELEC Science AI
   ----------------------------------------------------------------------------
   Thay thế nút Chat cũ trên thanh điều hướng trên cùng thành Chuông Thông Báo:
   - Thông báo chính thức từ Admin (useSettings + Firestore notices realtime)
   - Thông báo Chuỗi học tập (nhắc giữ chuỗi + đếm ngược cuối ngày + mốc chuỗi)
   - Thông báo Nhiệm vụ hôm nay (đồng bộ Kế hoạch tuần)
   - Thông báo Học chung & Cộng đồng (ai đang bật bàn học / lời rủ học chung)
   - Đếm ngược THPTQG & Mẹo học KHTN mỗi ngày cùng Bé Elec
   ============================================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { useLiveStreak } from '../hooks.js';
import { subscribeNotices, markNoticeRead, markAllNoticesRead } from '../lib/notices.js';
import { noticeSummary } from '../lib/noticesCore.js';
import { subscribeCommunityFeed } from '../lib/socialWall.js';
import {
  getPushPermission,
  requestPushPermission,
  fireElecPushNotification,
  subscribeEveryoneMentions,
} from '../lib/mentionPush.js';
import { getTodayPendingTasks } from '../lib/weeklyPlanService.js';
import '../styles/nav-notifications.css';

const DAILY_ELEC_TIPS = [
  'Mẹo Hóa 12: Với bài toán Este, ưu tiên viết sơ đồ bảo toàn khối lượng và số mol NaOH trước khi lập hệ!',
  'Mẹo Vật lí 12: Dùng vòng tròn lượng giác giải nhanh bài toán thời gian ngắn nhất trong Dao động điều hòa chỉ mất 10 giây.',
  'Kỹ thuật Pomodoro 25/5: Bật đèn bàn Học chung cùng bạn bè giúp tăng độ tập trung lên gấp đôi.',
  'Chiến thuật phòng thi: Làm chắc câu nhận biết – thông hiểu trong 20 phút đầu để giữ tâm lý vững vàng cho câu vận dụng cao.',
  'Ôn tập ngắt quãng (SRS): Xem lại Sổ lỗi sai 5 phút mỗi tối giúp ghi nhớ lâu gấp 3 lần so với học dồn.',
];

function getTodayKeyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTimeLeftToday() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diffMin = Math.max(1, Math.floor((end.getTime() - now.getTime()) / 60000));
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return h > 0 ? `Còn ${h}g ${m}p hôm nay` : `Còn ${m} phút hôm nay`;
}

function getExamCountdownDays() {
  const target = new Date('2027-06-26T07:30:00+07:00').getTime();
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

function fmtRelTime(ts) {
  const t = Number(ts) || 0;
  if (!t) return 'Hôm nay';
  const mins = Math.floor(Math.max(0, Date.now() - t) / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(t).toLocaleDateString('vi-VN');
}

function NotifIcon({ type, size = 16 }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (type) {
    case 'mention':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
        </svg>
      );
    case 'admin':
      return (
        <svg {...p}>
          <path d="M12 3l7 3v5c0 5-3.2 8.8-7 10-3.8-1.2-7-5-7-10V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'streak':
      return (
        <svg {...p}>
          <path d="M12 2.5c1.7 3.2 5.5 4.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3 1.8-5.1 3.2-7.2.2 2 1.2 3 2.3 3.2-.2-2-.1-3.9 0-6z" />
        </svg>
      );
    case 'task':
      return (
        <svg {...p}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
          <path d="M8.5 12.2l2.3 2.3 4.7-5" />
        </svg>
      );
    case 'study':
      return (
        <svg {...p}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3.5 3.5 0 0 1 0 6.75" />
        </svg>
      );
    case 'exam':
      return (
        <svg {...p}>
          <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6-4.6-1.9 4.6-1.9L12 3z" />
          <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
}

export default function NavNotificationPopover({ compact = false }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { count: streakCount = 0, isToday: hasStreakToday = false } = useLiveStreak() || {};
  const uid = user?.uid || 'guest';

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'admin' | 'streak' | 'community'
  const [dbNotices, setDbNotices] = useState([]);
  const [liveStudiers, setLiveStudiers] = useState([]);
  const [latestStudyInvite, setLatestStudyInvite] = useState(null);
  const [communityNotifs, setCommunityNotifs] = useState([]);
  const [mentionAlerts, setMentionAlerts] = useState([]);
  const [pushPerm, setPushPerm] = useState(() => getPushPermission());
  const [enablingPush, setEnablingPush] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const testTimerRef = useRef(null);

  const todayKey = getTodayKeyLocal();
  const readStorageKey = `elec_notif_read_v1:${uid}:${todayKey}`;

  const [readIds, setReadIds] = useState(() => {
    try {
      const raw = localStorage.getItem(readStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const wrapRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(readStorageKey);
      setReadIds(raw ? JSON.parse(raw) : []);
    } catch {
      setReadIds([]);
    }
  }, [readStorageKey]);

  const persistReadIds = (nextArr) => {
    const dedup = Array.from(new Set(nextArr));
    setReadIds(dedup);
    try {
      localStorage.setItem(readStorageKey, JSON.stringify(dedup));
    } catch { /* ignore */ }
  };

  // Đóng popover khi bấm ngoài / Esc / sự kiện toàn cục
  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const onCloseAll = (e) => {
      if (e?.detail?.except !== 'notifications') setOpen(false);
    };
    window.addEventListener('elec-close-nav-dropdowns', onCloseAll);
    return () => window.removeEventListener('elec-close-nav-dropdowns', onCloseAll);
  }, []);

  // 1. Lắng nghe thông báo Firestore `notices` (Admin / Giáo viên / Lớp học)
  useEffect(() => {
    if (!user?.uid) {
      setDbNotices([]);
      return undefined;
    }
    return subscribeNotices(user.uid, (list) => setDbNotices(list || []), () => {});
  }, [user?.uid]);

  // 2. Lắng nghe hoạt động Học chung & tương tác Cộng đồng ELEC thời gian thực
  useEffect(() => {
    const unsub = subscribeCommunityFeed(user?.uid || null, (data) => {
      const othersFocusing = (data?.liveStudiers || []).filter((s) => s.uid !== user?.uid);
      setLiveStudiers(othersFocusing);
      const invite = (data?.posts || []).find((p) => p.studyInvite && p.authorUid !== user?.uid);
      setLatestStudyInvite(invite || null);
      setCommunityNotifs(Array.isArray(data?.myNotifications) ? data.myNotifications : []);
    });
    return () => unsub?.();
  }, [user?.uid]);

  // 2b. Lắng nghe trực tiếp luồng @mọi người thời gian thực (tự kích hoạt Thông báo đẩy OS + Banner)
  useEffect(() => {
    const unsub = subscribeEveryoneMentions(user?.uid || null, (list) => {
      setMentionAlerts(Array.isArray(list) ? list : []);
    });
    const onPerm = (e) => setPushPerm(e?.detail || getPushPermission());
    window.addEventListener('elec-push-perm-changed', onPerm);
    return () => {
      unsub?.();
      window.removeEventListener('elec-push-perm-changed', onPerm);
    };
  }, [user?.uid]);

  useEffect(() => () => clearTimeout(testTimerRef.current), []);

  const handleTestPush = () => {
    fireElecPushNotification({
      id: `push_test_${Date.now()}`,
      title: 'Thông báo đẩy ELEC AI đang hoạt động!',
      body: 'Khi có ai nhắc @mọi người trên Cộng đồng hoặc Lớp học, thông báo sẽ bật lên ngay lập tức.',
      tag: 'elec-push-test',
      channel: 'community',
      force: true,
    });
    setTestSent(true);
    clearTimeout(testTimerRef.current);
    testTimerRef.current = setTimeout(() => setTestSent(false), 2400);
  };

  const handleEnablePush = async () => {
    if (enablingPush) return;
    setEnablingPush(true);
    try {
      const next = await requestPushPermission();
      setPushPerm(next);
      if (next === 'granted') {
        fireElecPushNotification({
          id: `push_enabled_${Date.now()}`,
          title: 'Đã bật Thông báo đẩy ELEC AI!',
          body: 'Khi có ai nhắc @mọi người hoặc có thông báo mới, Bé Elec sẽ gửi thông báo đẩy tức thì cho bạn.',
          tag: 'elec-push-welcome',
          channel: 'community',
          force: true,
        });
      }
    } finally {
      setEnablingPush(false);
    }
  };

  // 3. Đồng bộ nhiệm vụ hôm nay từ Kế hoạch tuần
  useEffect(() => {
    const refreshTasks = () => {
      try {
        setPendingTasks(getTodayPendingTasks(uid) || []);
      } catch {
        setPendingTasks([]);
      }
    };
    refreshTasks();
    window.addEventListener('elec-weekly-plan-changed', refreshTasks);
    return () => window.removeEventListener('elec-weekly-plan-changed', refreshTasks);
  }, [uid]);

  // Tổng hợp tất cả thông báo (thực tế 100%)
  const items = useMemo(() => {
    const list = [];
    const readSet = new Set(readIds);

    // A0. Thông báo nhắc @mọi người trực tiếp (Cộng đồng / Chat Cộng đồng / Chat Lớp)
    mentionAlerts.slice(0, 10).forEach((m) => {
      const id = `mention_${m.id}`;
      const isClass = m.channel === 'class_chat';
      list.push({
        id,
        category: 'community',
        icon: 'mention',
        tone: 'orange',
        tag: isClass ? '@MỌI NGƯỜI · LỚP' : '@MỌI NGƯỜI',
        title: `${m.authorName || 'Thành viên ELEC'} đã nhắc @mọi người`,
        body: m.text,
        time: fmtRelTime(m.at),
        unread: m.authorUid !== user?.uid && !readSet.has(id),
        action: () =>
          window.dispatchEvent(
            new CustomEvent('elec-open-community-chat', {
              detail: { tab: isClass ? 'class' : m.channel === 'feed' ? 'feed' : 'community' },
            })
          ),
      });
    });

    // A. Thông báo toàn hệ thống từ Admin (Settings)
    const adminText = String(settings?.announcementText || '').trim();
    if (adminText) {
      const id = `admin_banner_v${settings?.announcementVersion || 1}`;
      list.push({
        id,
        category: 'admin',
        icon: 'admin',
        tone: 'blue',
        tag: 'ADMIN ELEC AI',
        title: 'Thông báo từ Quản trị viên',
        body: adminText,
        time: 'Chính thức',
        unread: !readSet.has(id),
        action: () => {
          const link = String(settings?.announcementLink || '').trim();
          if (link.startsWith('#')) window.location.hash = link;
          else if (link.startsWith('http')) window.open(link, '_blank', 'noopener,noreferrer');
        },
      });
    }

    // B. Thông báo cá nhân từ Firestore `notices` (Giáo viên / Lớp học / Giao đề)
    dbNotices.slice(0, 12).forEach((n) => {
      list.push({
        id: `db_${n.id}`,
        dbId: n.id,
        category: 'admin',
        icon: 'admin',
        tone: 'indigo',
        tag: n.type === 'exam_assigned' ? 'ĐỀ MỚI' : 'LỚP HỌC',
        title: n.title || 'Thông báo lớp học ELEC AI',
        body: noticeSummary(n),
        time: fmtRelTime(n.createdAtMs),
        unread: !n.read,
        action: () => {
          window.location.hash = n.type === 'exam_assigned' ? '#virtual-exams' : '#my-classes';
        },
      });
    });

    // C. Thông báo Chuỗi học tập (Streak)
    const nextMilestone = [3, 7, 14, 30, 60, 100].find((m) => m > streakCount) || streakCount + 7;
    if (!hasStreakToday) {
      const id = `streak_remind_${todayKey}`;
      list.push({
        id,
        category: 'streak',
        icon: 'streak',
        tone: 'orange',
        tag: 'CHUỖI HỌC TẬP',
        title:
          streakCount > 0
            ? `Giữ vững chuỗi ${streakCount} ngày hôm nay!`
            : 'Bắt đầu ngọn lửa chuỗi học tập hôm nay',
        body:
          streakCount > 0
            ? `${getTimeLeftToday()} — làm nhanh vài câu Quiz hoặc bật Pomodoro để không bị mất chuỗi nhé.`
            : 'Hoàn thành 1 phiên học ngắn hoặc trả lời câu hỏi cùng Bé Elec để thắp sáng chuỗi ngày đầu tiên!',
        time: getTimeLeftToday(),
        unread: !readSet.has(id),
        action: () => window.dispatchEvent(new CustomEvent('elec-open-streak-modal')),
      });
    } else {
      const id = `streak_ok_${todayKey}_${streakCount}`;
      list.push({
        id,
        category: 'streak',
        icon: 'streak',
        tone: 'emerald',
        tag: 'ĐÃ GIỮ CHUỖI',
        title: `Tuyệt vời! Chuỗi ${streakCount} ngày đang rực sáng`,
        body: `Còn ${Math.max(1, nextMilestone - streakCount)} ngày nữa là em chạm cột mốc huy hiệu ${nextMilestone} ngày liên tiếp!`,
        time: 'Hôm nay',
        unread: !readSet.has(id),
        action: () => window.dispatchEvent(new CustomEvent('elec-open-streak-modal')),
      });
    }

    // D. Thông báo Nhiệm vụ hôm nay
    if (pendingTasks.length > 0) {
      const id = `tasks_${todayKey}_${pendingTasks.length}`;
      const firstTitle = pendingTasks[0]?.title || pendingTasks[0]?.text || 'Hoàn thành mục tiêu hôm nay';
      list.push({
        id,
        category: 'streak',
        icon: 'task',
        tone: 'emerald',
        tag: 'NHIỆM VỤ',
        title: `Còn ${pendingTasks.length} việc cần làm hôm nay`,
        body: `Gần nhất: "${firstTitle}". Bấm để mở Kế hoạch tuần cùng Bé Elec.`,
        time: 'Hôm nay',
        unread: !readSet.has(id),
        action: () => window.dispatchEvent(new CustomEvent('elec-open-companion-modal')),
      });
    }

    // E. Thông báo Cộng đồng Học chung trực tiếp
    if (liveStudiers.length > 0) {
      const first = liveStudiers[0];
      const id = `live_study_${first.uid}_${liveStudiers.length}`;
      list.push({
        id,
        category: 'community',
        icon: 'study',
        tone: 'blue',
        tag: 'HỌC CHUNG LIVE',
        title: `${liveStudiers.length} bạn đang bật đèn bàn học trực tiếp`,
        body: `${first.name} đang tập trung${first.task ? `: "${first.task}"` : ''}. Vào ngồi học cùng bàn ngay!`,
        time: 'Trực tiếp',
        unread: !readSet.has(id),
        action: () => {
          window.location.hash = '#pomodoro';
        },
      });
    }

    if (latestStudyInvite) {
      const id = `invite_${latestStudyInvite.id}`;
      list.push({
        id,
        category: 'community',
        icon: 'study',
        tone: 'violet',
        tag: 'LỜI RỦ HỌC CHUNG',
        title: `${latestStudyInvite.authorName} vừa rủ học chung ${latestStudyInvite.studyInvite?.durationMin || 25} phút`,
        body: latestStudyInvite.studyInvite?.topic || latestStudyInvite.text,
        time: fmtRelTime(latestStudyInvite.createdAt),
        unread: !readSet.has(id),
        action: () => window.dispatchEvent(new CustomEvent('elec-open-community-chat')),
      });
    }

    // E2. Thông báo tương tác Cộng đồng ELEC (trả lời, thả cảm xúc, Admin Đẩy Xu Hướng)
    communityNotifs.slice(0, 8).forEach((cn) => {
      const id = `comm_${cn.id}`;
      const isTrending = cn.type === 'trending';
      const isReply = cn.type === 'reply';
      list.push({
        id,
        category: 'community',
        icon: isTrending ? 'streak' : 'study',
        tone: isTrending ? 'orange' : isReply ? 'blue' : 'violet',
        tag: isTrending ? 'XU HƯỚNG ELEC' : isReply ? 'TRẢ LỜI MỚI' : 'TƯƠNG TÁC',
        title: isTrending
          ? 'Bài viết của bạn đang lên Xu hướng!'
          : isReply
            ? `${cn.actorName || 'Bạn học'} vừa bình luận bài của bạn`
            : 'Bài viết của bạn có lượt yêu thích mới',
        body: cn.text,
        time: fmtRelTime(cn.at),
        unread: !readSet.has(id),
        action: () => window.dispatchEvent(new CustomEvent('elec-open-community-chat')),
      });
    });

    // F. Thông báo Đếm ngược kỳ thi & Mẹo hay mỗi ngày cùng Bé Elec
    const dayIdx = Math.floor(Date.now() / 86400000) % DAILY_ELEC_TIPS.length;
    const examDays = getExamCountdownDays();
    const tipId = `daily_tip_${todayKey}`;
    list.push({
      id: tipId,
      category: 'admin',
      icon: 'exam',
      tone: 'violet',
      tag: `CÒN ${examDays} NGÀY THPTQG`,
      title: 'Bí kíp KHTN hôm nay từ Bé Elec',
      body: DAILY_ELEC_TIPS[dayIdx],
      time: 'Mỗi ngày',
      unread: !readSet.has(tipId),
      action: () => {
        window.location.hash = '#roadmap';
      },
    });

    return list;
  }, [settings, dbNotices, streakCount, hasStreakToday, pendingTasks, liveStudiers, latestStudyInvite, communityNotifs, mentionAlerts, readIds, todayKey, user?.uid]);

  const totalUnread = useMemo(() => items.filter((i) => i.unread).length, [items]);

  const tabUnreadCounts = useMemo(() => {
    const counts = { all: 0, admin: 0, streak: 0, community: 0 };
    items.forEach((i) => {
      if (!i.unread) return;
      counts.all += 1;
      if (counts[i.category] !== undefined) counts[i.category] += 1;
    });
    return counts;
  }, [items]);

  const visibleItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const { unreadItems, readItems } = useMemo(() => {
    const unread = [];
    const read = [];
    visibleItems.forEach((item) => {
      if (item.unread) unread.push(item);
      else read.push(item);
    });
    return { unreadItems: unread, readItems: read };
  }, [visibleItems]);

  const markItemReadOnly = (item) => {
    if (!item?.unread) return;
    if (item.dbId) {
      markNoticeRead(item.dbId).catch(() => {});
    } else {
      persistReadIds([...readIds, item.id]);
    }
  };

  const handleClickItem = async (item) => {
    markItemReadOnly(item);
    setOpen(false);
    item.action?.();
  };

  const handleQuickMarkRead = (e, item) => {
    e.stopPropagation();
    markItemReadOnly(item);
  };

  const handleMarkAllRead = async () => {
    const localIds = items.filter((i) => !i.dbId).map((i) => i.id);
    persistReadIds([...readIds, ...localIds]);
    if (dbNotices.some((n) => !n.read)) {
      markAllNoticesRead(dbNotices).catch(() => {});
    }
  };

  const renderNotifCard = (item) => (
    <div
      key={item.id}
      role="button"
      tabIndex={0}
      className={`enotif-item is-tone-${item.tone} ${item.unread ? 'is-unread' : 'is-read'}`}
      onClick={() => handleClickItem(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClickItem(item);
        }
      }}
    >
      <span className={`enotif-ico is-${item.tone}`}>
        <NotifIcon type={item.icon} size={17} />
      </span>

      <div className="enotif-body">
        <div className="enotif-meta">
          <span className={`enotif-tag is-${item.tone}`}>{item.tag}</span>
          <div className="enotif-meta-right">
            <span className="enotif-time">{item.time}</span>
            {item.unread && <span className="enotif-unread-dot" aria-label="Chưa đọc" />}
          </div>
        </div>
        <strong className="enotif-title">{item.title}</strong>
        <p className="enotif-desc">{item.body}</p>
      </div>

      <div className="enotif-item-actions">
        {item.unread ? (
          <button
            type="button"
            className="enotif-item-check"
            title="Đánh dấu đã đọc"
            aria-label="Đánh dấu đã đọc"
            onClick={(e) => handleQuickMarkRead(e, item)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        ) : (
          <span className="enotif-item-chev" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  const headerSubtitle = liveStudiers.length > 0
    ? `${liveStudiers.length} bạn đang học trực tiếp`
    : totalUnread > 0
      ? 'Lớp học, chuỗi học & Cộng đồng'
      : 'Bạn đã xem hết tất cả tin mới';

  return (
    <div className="enotif-wrap" ref={wrapRef}>
      <button
        type="button"
        className={
          compact
            ? `mhead-btn mhead-icon-circle enotif-trigger ${open ? 'is-open' : ''}`
            : `nav-action-icon-btn enotif-trigger ${open ? 'is-open' : ''}`
        }
        onClick={() => {
          if (!open) {
            window.dispatchEvent(
              new CustomEvent('elec-close-nav-dropdowns', { detail: { except: 'notifications' } })
            );
          }
          setOpen((v) => !v);
        }}
        aria-label="Thông báo ELEC AI"
        aria-expanded={open}
        title={totalUnread > 0 ? `Thông báo (${totalUnread} mới)` : 'Trung tâm Thông báo ELEC AI'}
      >
        <svg
          width={compact ? 16 : 15}
          height={compact ? 16 : 15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`nav-svg-pro enotif-bell ${totalUnread > 0 ? 'has-unread' : ''}`}
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {totalUnread > 0 && (
          <span className="enotif-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>

      {open && (
        <>
          <div
            className="enotif-mobile-backdrop"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className={`enotif-pop ${compact ? 'is-compact' : ''}`} role="dialog" aria-label="Trung tâm Thông báo">
            <div className="enotif-sheet-grip" aria-hidden="true" />

            <div className="enotif-head">
              <div className="enotif-head-left">
                <div className="enotif-mascot-chip">
                  <img
                    src={totalUnread > 0 ? '/img/elec/elec-hello.png' : '/img/elec/elec-happy.png'}
                    alt="Bé Elec"
                    draggable={false}
                  />
                </div>
                <div className="enotif-head-copy">
                  <div className="enotif-head-title-row">
                    <strong>Thông báo</strong>
                    {totalUnread > 0 ? (
                      <span className="enotif-head-cnt">
                        <i aria-hidden="true" />
                        {totalUnread} mới
                      </span>
                    ) : (
                      <span className="enotif-head-done">Đã xem hết</span>
                    )}
                  </div>
                  <span className="enotif-head-sub">{headerSubtitle}</span>
                </div>
              </div>

              <div className="enotif-head-actions">
                {totalUnread > 0 && (
                  <button
                    type="button"
                    className="enotif-mark-all"
                    onClick={handleMarkAllRead}
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6 7 17l-5-5" />
                      <path d="m22 10-7.5 7.5L13 16" />
                    </svg>
                    <span>Đọc tất cả</span>
                  </button>
                )}
                <button
                  type="button"
                  className="enotif-close-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng bảng thông báo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {pushPerm !== 'unsupported' && (
              <div className={`enotif-push-bar ${pushPerm === 'granted' ? 'is-on' : pushPerm === 'denied' ? 'is-denied' : 'is-prompt'}`}>
                {pushPerm === 'granted' ? (
                  <>
                    <div className="enotif-push-inline" title="Tự động báo trên máy khi có người nhắc @mọi người">
                      <span className="enotif-live-dot" aria-hidden="true" />
                      <b>Thông báo đẩy đang bật</b>
                    </div>
                    <button
                      type="button"
                      className={`enotif-push-status is-clickable ${testSent ? 'is-sent' : ''}`}
                      onClick={handleTestPush}
                      title="Bấm để kiểm tra thử thông báo đẩy trên máy"
                    >
                      {testSent ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Đã gửi thử</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                          <span>Gửi thử</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="enotif-push-lead">
                      <span className={`enotif-push-ico ${pushPerm === 'denied' ? 'is-denied' : ''}`} aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </span>
                      <div className="enotif-push-copy">
                        <b>{pushPerm === 'denied' ? 'Trình duyệt đang chặn thông báo' : 'Bật thông báo đẩy @mọi người'}</b>
                        <span>
                          {pushPerm === 'denied'
                            ? 'Bấm biểu tượng ổ khóa trên thanh địa chỉ để cho phép.'
                            : 'Nhận báo tức thì khi có @mọi người, đề mới & học chung.'}
                        </span>
                      </div>
                    </div>
                    {pushPerm === 'default' && (
                      <button
                        type="button"
                        className="enotif-push-btn"
                        onClick={handleEnablePush}
                        disabled={enablingPush}
                      >
                        {enablingPush ? 'Đang bật…' : 'Bật ngay'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="enotif-tabs-wrap">
              <div className="enotif-tabs" role="tablist">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'admin', label: 'Admin' },
                  { id: 'streak', label: 'Chuỗi & Việc' },
                  { id: 'community', label: 'Cộng đồng' },
                ].map((t) => {
                  const cnt = tabUnreadCounts[t.id] || 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={filter === t.id}
                      className={`enotif-tab ${filter === t.id ? 'is-active' : ''}`}
                      onClick={() => setFilter(t.id)}
                    >
                      <span>{t.label}</span>
                      {cnt > 0 && <em className="enotif-tab-cnt">{cnt > 9 ? '9+' : cnt}</em>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="enotif-list">
              {visibleItems.length === 0 ? (
                <div className="enotif-empty">
                  <div className="enotif-empty-halo">
                    <img src="/img/elec/elec-happy.png" alt="Bé Elec" draggable={false} />
                  </div>
                  <b>Chưa có thông báo ở mục này</b>
                  <span>Mọi thông báo từ Admin, Chuỗi học và Cộng đồng sẽ hiện tức thì tại đây.</span>
                  {filter !== 'all' && items.length > 0 && (
                    <button
                      type="button"
                      className="enotif-empty-btn"
                      onClick={() => setFilter('all')}
                    >
                      Xem tất cả ({items.length})
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {unreadItems.length > 0 && (
                    <div className="enotif-group">
                      <div className="enotif-group-head">
                        <span>Mới nhận</span>
                        <span className="enotif-group-pill">{unreadItems.length}</span>
                      </div>
                      <div className="enotif-group-cards">
                        {unreadItems.map(renderNotifCard)}
                      </div>
                    </div>
                  )}

                  {readItems.length > 0 && (
                    <div className="enotif-group">
                      {unreadItems.length > 0 && (
                        <div className="enotif-group-head is-muted">
                          <span>Đã xem gần đây</span>
                        </div>
                      )}
                      <div className="enotif-group-cards">
                        {readItems.map(renderNotifCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="enotif-foot">
              <button
                type="button"
                className="enotif-foot-link"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent('elec-open-community-chat'));
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Mở Cộng đồng ELEC</span>
                <svg className="enotif-foot-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
              <span className="enotif-copy">ELEC AI</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
