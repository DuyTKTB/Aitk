/* ============================================================================
   StudyTogetherRoom.jsx — Phòng Bàn Học Tập Trung (Đồng bộ 100% với cái gốc)
   ----------------------------------------------------------------------------
   - Tái sử dụng y nguyên ngôn ngữ thiết kế Phòng Bàn Học của FocusStudioPage:
     + Hero Card "BÀN HỌC CỦA BẠN" kèm StudyDeskIllustration (đèn bật sáng khi học)
     + Đồng hồ HH:MM:SS nhảy live từng giây + nút Bắt đầu / Tạm dừng / Kết thúc
     + Thanh trạng thái thời gian thực + Tìm bạn học / Lọc "Chỉ đang học"
     + Lưới bàn học isometric 100% học sinh thật từ Firestore (subscribeRealFocusUsers)
     + Thẻ "Mời bạn ngồi cùng bàn" + Đồng bộ 2 chiều với #pomodoro (focusSession)
   ============================================================================ */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { getUserProfile } from '../../lib/userProfileService.js';
import { getUserAspirationsState } from '../../lib/aspirationService.js';
import {
  focusSession,
  useFocusSession,
  FOCUS_MASCOTS,
  getTodayKey,
} from '../../lib/focusSessionStore.js';
import {
  publishFocusPresence,
  subscribeRealFocusUsers,
} from '../../lib/focusLiveService.js';
import { saveStudyTogetherHandoff } from '../../lib/socialWall.js';
import StudyDeskIllustration from '../StudyDeskIllustration.jsx';
import '../../styles/focus-studio-pro.css';

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

export default function StudyTogetherRoom({
  onSelectProfile,
  onNavigateAway,
  onPostInvite,
  studyInvitePostsNode = null,
}) {
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

  // Đồng bộ 2 chiều thời gian thực với FocusStudioPage (#pomodoro)
  const focus = useFocusSession();
  const [deskGroup, setDeskGroup] = useState('all'); // 'all' | 'my_group'
  const [deskFilter, setDeskFilter] = useState('all'); // 'all' | 'online'
  const [peerSearch, setPeerSearch] = useState('');
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [postingInvite, setPostingInvite] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const livePayloadRef = useRef(null);

  const todayKey = getTodayKey();
  const todayMinutes = focus.minutesByDay[todayKey] || 0;
  const todaySessions = focus.sessionsByDay[todayKey] || 0;

  const myTotalMins = useMemo(
    () => Object.values(focus.minutesByDay || {}).reduce((acc, v) => acc + (Number(v) || 0), 0),
    [focus.minutesByDay]
  );

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

  const activeRunningFocusSecs = useMemo(() => {
    if (focus.mode !== 'focus' || focus.status === 'idle') return 0;
    if (focus.settings.countMode === 'flowmodoro') return focus.elapsedSeconds % 60;
    const elapsed = Math.max(0, (focus.totalSeconds || 0) - (focus.secondsLeft || 0));
    return elapsed % 60;
  }, [focus.mode, focus.status, focus.settings.countMode, focus.elapsedSeconds, focus.totalSeconds, focus.secondsLeft]);

  const myLiveTodaySecs = todayMinutes * 60 + activeRunningFocusSecs;

  const activeMascot = useMemo(
    () => FOCUS_MASCOTS.find((m) => m.id === focus.mascotId) || FOCUS_MASCOTS[0],
    [focus.mascotId]
  );

  // Lắng nghe 100% học sinh thật từ Firestore giống FocusStudioPage
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

  // Nhịp 1 giây để đồng hồ các bạn đang online cũng nhảy mượt từng giây
  useEffect(() => {
    const hasOtherOnline = liveUsers.some((u) => u.id !== uid && u.online);
    if (!hasOtherOnline) return undefined;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [liveUsers, uid]);

  // Phát tín hiệu hiện diện (heartbeat) khi bật đồng hồ ngay trong tab Học chung
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

  useEffect(() => {
    if (!isSignedIn || focus.status !== 'running') return undefined;
    const sendPing = () => {
      publishFocusPresence(uid, { ...(livePayloadRef.current || {}), active: true });
    };
    sendPing();
    const interval = setInterval(sendPing, 25000);
    return () => clearInterval(interval);
  }, [isSignedIn, uid, focus.status, focus.mode, focus.activeTaskText, focus.mascotId]);

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
    focus.streakDays,
    activeMascot.src,
    liveUsers,
  ]);

  const rankedStudents = useMemo(() => {
    return [...allRealStudents]
      .sort(
        (a, b) =>
          (b.todaySecs || b.todayMins * 60) - (a.todaySecs || a.todayMins * 60) ||
          Number(b.online) - Number(a.online)
      )
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

  const myRankRow = rankedStudents.find((r) => r.isMe);
  const realOnlineCount = allRealStudents.filter((s) => s.online).length;

  const handleCycleMascot = () => {
    const idx = FOCUS_MASCOTS.findIndex((m) => m.id === focus.mascotId);
    const next = FOCUS_MASCOTS[(idx + 1) % FOCUS_MASCOTS.length];
    if (next) focusSession.setMascot(next.id);
  };

  const handleCopyInviteLink = () => {
    try {
      const url = `${window.location.origin}/#pomodoro`;
      navigator.clipboard?.writeText(url);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const handleOpenFullFocusRoom = (partner = null) => {
    if (partner && !partner.isMe) {
      saveStudyTogetherHandoff({
        partnerUid: partner.id,
        partnerName: partner.name,
        topic: partner.task || 'Cùng tập trung ôn thi',
        durationMin: focus.settings.workMinutes || 25,
        openClassroom: true,
      });
    }
    onNavigateAway?.();
    window.location.hash = '#pomodoro';
  };

  const handleQuickPostInvite = async () => {
    if (!onPostInvite || postingInvite) return;
    setPostingInvite(true);
    try {
      await onPostInvite({
        durationMin: focus.settings.workMinutes || 25,
        topic: focus.activeTaskText || `Học chung tại lớp ${studentUniName}`,
      });
    } finally {
      setPostingInvite(false);
    }
  };

  return (
    <div className="fs9-room-embedded" aria-label="Phòng Bàn Học Tập Trung">
      <div className="fs9-room-shell is-embedded">
        {/* THANH CÔNG CỤ PHỤ GIỐNG BẢN GỐC: Lớp mục tiêu | Cộng đồng ELEC + Chọn mascot & Phòng lớn */}
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
              onClick={handleCycleMascot}
              title={`Đổi linh vật Bé Elec (${activeMascot.label})`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                <path d="M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1z" />
              </svg>
              <span>Đổi mascot</span>
            </button>
            <button
              type="button"
              className="fs9-room-pill-btn"
              onClick={() => handleOpenFullFocusRoom(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>Phòng lớn</span>
            </button>
          </div>
        </div>

        {/* HERO CARD: BÀN HỌC CỦA BẠN (Y NGUYÊN BẢN GỐC) */}
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
                <span className="fs9-my-desk-meta-pill">
                  Chuỗi {Math.max(focus.streakDays, todayMinutes > 0 ? 1 : 0)} ngày
                </span>
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

              <div
                className={`fs9-my-desk-status ${
                  focus.status === 'running' ? 'is-live' : focus.status === 'paused' ? 'is-paused' : ''
                }`}
              >
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
                <button type="button" className="fs9-room-mini-btn" onClick={handleCopyInviteLink}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>{inviteCopied ? 'Đã chép link mời!' : 'Mời bạn học chung'}</span>
                </button>

                {isSignedIn && onPostInvite && (
                  <button
                    type="button"
                    className="fs9-room-mini-btn"
                    onClick={handleQuickPostInvite}
                    disabled={postingInvite}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M22 2 11 13" />
                      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                    </svg>
                    <span>{postingInvite ? 'Đang đăng…' : 'Rủ lên Cộng đồng'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="fs9-room-mini-btn"
                  onClick={() => handleOpenFullFocusRoom(null)}
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
            </div>
          </div>
        </div>

        {/* THANH TRẠNG THÁI LỚP HỌC + TÌM KIẾM & LỌC */}
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
            Bạn đang xem chế độ khách — đăng nhập ELEC AI để đồng bộ bàn học trực tiếp cùng bạn bè thật!
          </div>
        )}

        {/* LƯỚI BÀN HỌC ISOMETRIC (100% HỌC SINH THẬT) */}
        <div className="fs9-desks-grid is-embedded-grid">
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
                className={`fs9-study-card ${p.online ? 'is-online' : 'is-away'} ${p.isMe ? 'is-me' : ''} is-clickable`}
                onClick={() => {
                  if (p.id && p.id !== 'guest') {
                    onSelectProfile?.({ uid: p.id, name: p.name });
                  }
                }}
                title={p.isMe ? 'Bàn học của bạn' : `Xem trang cá nhân ${p.name}`}
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
                  <div className={`fs9-sc-hms ${p.online ? 'is-online' : ''}`}>{formatHMS(deskSecs)}</div>
                </div>
              </article>
            );
          })}

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
                <button type="button" className="fs9-invite-desk-btn" onClick={handleCopyInviteLink}>
                  {inviteCopied ? 'Đã chép link!' : 'Chép link mời bạn'}
                </button>
              </div>
            </article>
          )}
        </div>
      </div>

      {studyInvitePostsNode}
    </div>
  );
}
