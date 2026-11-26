/* ============================================================================
   LeaderboardPage.jsx — Bảng Xếp Hạng Chuẩn Thực Tế & Thời Gian Thực ELEC AI
   ----------------------------------------------------------------------------
   - Đồng bộ thời gian thực (Firestore onSnapshot) cho Lớp học & Học sinh
   - Xếp hạng công bằng, minh bạch bằng globalLeaderboardEngine.js:
     + Chuỗi Lớp Học: kiểm tra hạn ngày UTC+7 + tổng hợp hoạt động thành viên
     + Học Sinh Xuất Sắc: Điểm thành tích thực tế (XP + Focus + Chuỗi + Chính xác)
     + Kỷ Lục Chuỗi Cá Nhân: đồng bộ trực tiếp ngọn lửa thực tế
     + Quân đoàn NV1: 100% tổng hợp từ sĩ tử thật đã chọn nguyện vọng (không hash ảo)
   - 100% Vector SVG Icons, tìm kiếm nhanh & công thức xếp hạng minh bạch
   ============================================================================ */
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLiveStreak } from '../hooks.js';
import { db } from '../lib/firebase.js';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import ProfileCard from './social/ProfileCard.jsx';
import VerifiedBadge from './VerifiedBadge.jsx';
import StudentAvatar from './StudentAvatar.jsx';
import SpeedDuelModal from './SpeedDuelModal.jsx';
import SquadStudyRoomModal from './SquadStudyRoomModal.jsx';
import RewardShopModal from './RewardShopModal.jsx';
import { CUTOFF_DATA } from '../data/uniCutoffs.js';
import { getUserAspirationsState } from '../lib/aspirationService.js';
import {
  loadTargetUniversity,
  getStudentElo,
  getStudentCombatPower,
} from '../lib/studentAnalytics.js';
import {
  normalizeUserForLeaderboard,
  rankClassesRealistic,
  rankStudentsRealistic,
  rankPersonalStreaksRealistic,
  rankSquadsRealistic,
} from '../lib/globalLeaderboardEngine.js';
import '../styles/leaderboard-page.css';
import '../styles/student-v9-upgrades.css';

/* ── 100% VECTOR SVG ICONS ── */
const Svg = ({ d, size = 16, sw = 1.9, fill = 'none' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={fill === 'none' ? 'currentColor' : 'none'}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'inline-block' }}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H7M14 14.66V17c0 .55.45 1 1 1h2M18 2H6v7a6 6 0 0 0 12 0V2z',
  fire: 'M12 2.5c1.6 3.2 5.5 4.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3 1.8-5.1 3.2-7.2.2 2 1.2 3 2.3 3.2-.2-2-.1-3.9 0-6z',
  crown: 'M3 17h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 17zM5 20h14',
  medal: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0 0v7l-3-2-3 2v-7',
  search: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.2-4.2',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

const CLASS_GRADIENTS = [
  'linear-gradient(135deg, #0071e3 0%, #2563eb 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
  'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
];

function classCrestBg(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CLASS_GRADIENTS[h % CLASS_GRADIENTS.length];
}

function ClassCrest({ monogram, seed, size = 36 }) {
  return (
    <div
      className="lb-class-crest"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: Math.max(11, Math.round(size * 0.34)),
        background: classCrestBg(seed || monogram),
      }}
    >
      {monogram}
    </div>
  );
}

function RankBadge({ rank, isTied }) {
  if (rank === null || rank === undefined) {
    return <span className="lb-rank-unranked">—</span>;
  }
  const label = `${isTied ? '=' : ''}${String(rank).padStart(2, '0')}`;
  if (rank <= 3) {
    return <span className={`lb-rank-medal r-${rank}`}>{label}</span>;
  }
  return <span className="lb-rank-num">{label}</span>;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { count: myStreak } = useLiveStreak();

  const [tab, setTab] = useState('classes'); // 'classes' | 'students' | 'streaks' | 'squads'
  const [classesList, setClassesList] = useState([]);
  const [rawUsersList, setRawUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveSyncedAt, setLiveSyncedAt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeStaff, setIncludeStaff] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  const [profileTarget, setProfileTarget] = useState(null);
  const [duelOpen, setDuelOpen] = useState(false);
  const [duelTick, setDuelTick] = useState(0);
  const [squadRoomOpen, setSquadRoomOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const uid = user?.uid || 'guest';

  const mySquadMetrics = useMemo(() => {
    const eloState = getStudentElo(uid);
    const powerState = getStudentCombatPower(uid);
    const pinned = loadTargetUniversity(uid);
    if (pinned && (pinned.code || pinned.uni)) {
      return {
        code: String(pinned.code || 'NV1').toUpperCase(),
        uni: pinned.uni || 'Trường mục tiêu NV1',
        major: pinned.major || 'Nguyện vọng 1',
        cutoff: pinned.s2025 || pinned.s2024 || null,
        isPinned: true,
        elo: eloState?.elo || 1200,
        power: powerState?.power || 1000,
        tier: powerState?.tier || { label: 'Khởi hành' },
      };
    }
    const aspState = getUserAspirationsState(uid);
    const activeAsp = aspState?.aspirations?.find((a) => a.id === aspState.activeAspirationId) || aspState?.aspirations?.[0];
    if (activeAsp?.school) {
      return {
        code: String(activeAsp.school.code || 'NV1').toUpperCase(),
        uni: activeAsp.school.name || 'Trường mục tiêu NV1',
        major: activeAsp.major?.name || 'Nguyện vọng 1',
        cutoff: activeAsp.cutoffScore || null,
        isPinned: true,
        elo: eloState?.elo || 1200,
        power: powerState?.power || 1000,
        tier: powerState?.tier || { label: 'Khởi hành' },
      };
    }
    return {
      code: '',
      uni: 'Chưa ghim trường NV1',
      major: 'Vào mục Nguyện vọng để chọn trường mục tiêu',
      cutoff: null,
      isPinned: false,
      elo: eloState?.elo || 1200,
      power: powerState?.power || 1000,
      tier: powerState?.tier || { label: 'Khởi hành' },
    };
  }, [uid, duelTick]);

  /* Lắng nghe THỜI GIAN THỰC từ Firestore (classes & users) */
  useEffect(() => {
    let loadedClasses = false;
    let loadedUsers = false;
    const checkDone = () => {
      if (loadedClasses && loadedUsers) {
        setLoading(false);
        setLiveSyncedAt(Date.now());
      }
    };

    const unsubClasses = onSnapshot(
      query(collection(db, 'classes'), limit(300)),
      (snap) => {
        setClassesList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        loadedClasses = true;
        checkDone();
      },
      () => {
        loadedClasses = true;
        checkDone();
      }
    );

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), limit(500)),
      (snap) => {
        setRawUsersList(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        loadedUsers = true;
        checkDone();
      },
      () => {
        loadedUsers = true;
        checkDone();
      }
    );

    return () => {
      unsubClasses();
      unsubUsers();
    };
  }, []);

  /* Chuẩn hóa toàn bộ người dùng thực tế */
  const normalizedUsers = useMemo(
    () =>
      rawUsersList.map((u) =>
        normalizeUserForLeaderboard(u, {
          currentUid: user?.uid || '',
          currentLiveStreak: myStreak || 0,
        })
      ),
    [rawUsersList, user?.uid, myStreak]
  );

  /* 4 Bảng xếp hạng chuẩn thực tế */
  const rankedClasses = useMemo(
    () => rankClassesRealistic(classesList, normalizedUsers),
    [classesList, normalizedUsers]
  );

  const rankedStudents = useMemo(
    () => rankStudentsRealistic(normalizedUsers, { includeStaff }),
    [normalizedUsers, includeStaff]
  );

  const rankedPersonalStreaks = useMemo(
    () => rankPersonalStreaksRealistic(normalizedUsers, { includeStaff }),
    [normalizedUsers, includeStaff]
  );

  const rankedSquads = useMemo(
    () =>
      rankSquadsRealistic(normalizedUsers, CUTOFF_DATA, {
        currentUid: user?.uid || '',
        mySquadMetrics: mySquadMetrics.isPinned ? mySquadMetrics : null,
        myStreak: myStreak || 0,
      }),
    [normalizedUsers, user?.uid, mySquadMetrics, myStreak]
  );

  const mySquadStanding = useMemo(() => {
    if (!mySquadMetrics.code) return null;
    const found = rankedSquads.find((s) => s.code === mySquadMetrics.code);
    return found ? { rank: found.rank, squad: found } : null;
  }, [rankedSquads, mySquadMetrics.code]);

  const rawActiveList =
    tab === 'classes'
      ? rankedClasses
      : tab === 'students'
        ? rankedStudents
        : rankedPersonalStreaks;

  /* Lọc tìm kiếm tức thì mà vẫn giữ nguyên thứ hạng thực tế của từng dòng */
  const filteredActiveList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawActiveList;
    return rawActiveList.filter((item) => {
      const hay = `${item.name || ''} ${item.teacherName || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rawActiveList, searchQuery]);

  /* Chỉ đưa các mục thực sự có hạng (rank !== null) lên Bục Vinh Danh Top 3 */
  const podiumEntries = useMemo(
    () => rawActiveList.filter((item) => item.rank !== null).slice(0, 3),
    [rawActiveList]
  );
  const top1 = podiumEntries[0] || null;
  const top2 = podiumEntries[1] || null;
  const top3 = podiumEntries[2] || null;

  /* Thứ hạng thực tế của người dùng đang đăng nhập */
  const myStanding = useMemo(() => {
    if (tab === 'squads') {
      return mySquadStanding ? { rank: mySquadStanding.rank, label: `Quân đoàn ${mySquadMetrics.code}` } : null;
    }
    if (!user?.uid) return null;
    if (tab === 'classes') {
      const myCls = rankedClasses.find(
        (c) => c.teacherId === user.uid || c.memberIds?.includes(user.uid)
      );
      return myCls ? { rank: myCls.rank, item: myCls } : null;
    }
    const list = tab === 'students' ? rankedStudents : rankedPersonalStreaks;
    const found = list.find((s) => s.uid === user.uid);
    return found ? { rank: found.rank, item: found } : null;
  }, [tab, rankedClasses, rankedStudents, rankedPersonalStreaks, mySquadStanding, mySquadMetrics.code, user?.uid]);

  const syncTimeLabel = liveSyncedAt
    ? new Date(liveSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  return (
    <div className="lb-page">
      <div className="lb-container">
        {/* Header */}
        <header className="lb-header">
          <div className="lb-badge">
            <Svg d={ICONS.trophy} size={14} />
            <span>Bảng Vàng Thi Đua Chuẩn Thực Tế</span>
            {syncTimeLabel && (
              <span className="lb-live-tag">
                <span className="lb-live-dot" />
                Trực tiếp {syncTimeLabel}
              </span>
            )}
          </div>
          <h1 className="lb-title">Bảng Xếp Hạng Chuỗi &amp; Thành Tích</h1>
          <p className="lb-subtitle">
            Tổng hợp 100% từ dữ liệu học tập thực tế trên hệ thống ELEC AI — công bằng, đồng hạng chuẩn Olympic và cập nhật theo thời gian thực.
          </p>

          {/* Tabs */}
          <div className="lb-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'classes'}
              className={`lb-tab-btn ${tab === 'classes' ? 'active' : ''}`}
              onClick={() => setTab('classes')}
            >
              <img src="/img/elec/elec-happy.png" alt="" className="lb-tab-mascot" />
              <span>Chuỗi Lớp Học</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'students'}
              className={`lb-tab-btn ${tab === 'students' ? 'active' : ''}`}
              onClick={() => setTab('students')}
            >
              <img src="/img/elec/elec-cool.png" alt="" className="lb-tab-mascot" />
              <span>Học Sinh Xuất Sắc</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'streaks'}
              className={`lb-tab-btn ${tab === 'streaks' ? 'active' : ''}`}
              onClick={() => setTab('streaks')}
            >
              <img src="/img/elec/elec-celebrate.png" alt="" className="lb-tab-mascot" />
              <span>Kỷ Lục Chuỗi Cá Nhân</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'squads'}
              className={`lb-tab-btn ${tab === 'squads' ? 'active' : ''}`}
              onClick={() => setTab('squads')}
            >
              <img src="/img/elec/elec-hello.png" alt="" className="lb-tab-mascot" />
              <span>Quân đoàn NV1</span>
            </button>
          </div>
        </header>

        {/* Toolbar minh bạch: Tìm kiếm + Lọc GV/Admin + Công thức tính hạng */}
        {tab !== 'squads' && (
          <div className="lb-toolbar">
            <div className="lb-search-box">
              <Svg d={ICONS.search} size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tab === 'classes' ? 'Tìm tên lớp hoặc giáo viên…' : 'Tìm tên học sinh…'}
              />
            </div>

            <div className="lb-toolbar-right">
              {tab !== 'classes' && (
                <button
                  type="button"
                  className={`lb-filter-chip ${includeStaff ? 'is-on' : ''}`}
                  onClick={() => setIncludeStaff((v) => !v)}
                >
                  <Svg d={ICONS.users} size={14} />
                  <span>{includeStaff ? 'Đang hiện cả GV / Admin' : 'Chỉ xếp hạng Học sinh'}</span>
                </button>
              )}

              <button
                type="button"
                className={`lb-filter-chip ${showFormula ? 'is-on' : ''}`}
                onClick={() => setShowFormula((v) => !v)}
              >
                <Svg d={ICONS.info} size={14} />
                <span>Cách tính hạng</span>
              </button>
            </div>
          </div>
        )}

        {showFormula && tab !== 'squads' && (
          <div className="lb-formula-card">
            {tab === 'classes' ? (
              <p>
                <b>Xếp hạng Lớp Học chuẩn thực tế:</b> Ưu tiên <b>Chuỗi lớp đang duy trì (theo giờ VN UTC+7)</b> → <b>Kỷ lục chuỗi</b> → <b>Điểm thi đua lớp</b> (tổng hợp chuỗi thật, XP, phút Focus &amp; lượt học hôm nay của các thành viên trong lớp) → <b>Sĩ số thật</b>. Lớp 1 thành viên chưa có hoạt động sẽ không được xếp Quán Quân.
              </p>
            ) : tab === 'students' ? (
              <p>
                <b>Điểm Thành Tích thực tế</b> = <code>XP</code> + <code>5 × Phút Focus</code> + <code>25 × Chuỗi ngày</code> + thưởng độ chính xác (khi làm ≥ 5 câu). Đồng hạng theo chuẩn Olympic (<code>1, 2, =2, 4</code>) và chỉ vinh danh người có hoạt động thực tế.
              </p>
            ) : (
              <p>
                <b>Kỷ Lục Chuỗi Cá Nhân:</b> Xếp theo <b>Số ngày liên tiếp thực tế</b> → <b>Phút tập trung</b> → <b>Tổng XP</b>. Chỉ các tài khoản có chuỗi ≥ 1 ngày mới lên Bục Vinh Danh.
              </p>
            )}
          </div>
        )}

        {/* Tab Quân đoàn NV1 (100% Dữ liệu thật, không hash ảo) */}
        {tab === 'squads' && (
          <section className="s9-lb-squad-wrap" aria-label="Quân đoàn Nguyện vọng 1">
            <div className="s9-lb-squad-hero">
              <div className="s9-lb-squad-hero-main">
                <div className="s9-lb-squad-code">{mySquadMetrics.code || 'NV1'}</div>
                <div className="s9-lb-squad-info">
                  <span className="s9-lb-squad-eyebrow">
                    {mySquadMetrics.isPinned ? 'QUÂN ĐOÀN NV1 CỦA BẠN · 100% DỮ LIỆU THẬT' : 'CHƯA GHIM NV1 · HÃY CHỌN TRƯỜNG MỤC TIÊU'}
                  </span>
                  <h2>{mySquadMetrics.uni}</h2>
                  <p>
                    Ngành mục tiêu: <b>{mySquadMetrics.major}</b>
                    {mySquadMetrics.cutoff ? ` · Điểm chuẩn tham khảo ${mySquadMetrics.cutoff}` : ''}
                  </p>
                </div>
              </div>

              <div className="s9-lb-squad-stats">
                <div className="s9-lb-squad-stat">
                  <span>Hạng Quân đoàn</span>
                  <b>{mySquadStanding?.rank ? `#${mySquadStanding.rank}` : '—'}</b>
                </div>
                <div className="s9-lb-squad-stat">
                  <span>ELO đóng góp</span>
                  <b>{mySquadMetrics.elo.toLocaleString('vi-VN')}</b>
                </div>
                <div className="s9-lb-squad-stat">
                  <span>Lực chiến cá nhân</span>
                  <b>{mySquadMetrics.power.toLocaleString('vi-VN')}</b>
                </div>
                <div className="s9-lb-squad-stat">
                  <span>Chuỗi ngày</span>
                  <b>{myStreak} ngày</b>
                </div>
              </div>

              {mySquadStanding?.squad && (
                <div className="s9-lb-squad-campaign">
                  <div className="s9-lb-squad-campaign-top">
                    <span>
                      Chiến dịch Quân đoàn ({mySquadStanding.squad.members} sĩ tử thật đã ghim {mySquadMetrics.code})
                    </span>
                    <b>
                      {mySquadStanding.squad.totalPower.toLocaleString('vi-VN')} /{' '}
                      {mySquadStanding.squad.campaignGoal.toLocaleString('vi-VN')} Lực chiến
                    </b>
                  </div>
                  <div className="s9-lb-squad-bar">
                    <i style={{ width: `${mySquadStanding.squad.campaignPct}%` }} />
                  </div>
                </div>
              )}

              <div className="s9-lb-squad-actions">
                <button type="button" className="s9-lb-squad-btn primary" onClick={() => setSquadRoomOpen(true)}>
                  Phòng tự học (Chat &amp; Poll)
                </button>
                <button type="button" className="s9-lb-squad-btn ghost" onClick={() => setDuelOpen(true)}>
                  Đấu 1v1 kiếm Lực chiến
                </button>
                <button type="button" className="s9-lb-squad-btn ghost" onClick={() => setShopOpen(true)}>
                  Cửa hàng Học Bá
                </button>
                <a href="#admission" className="s9-lb-squad-btn ghost">
                  {mySquadMetrics.isPinned ? 'Đổi NV1' : 'Ghim NV1 ngay'}
                </a>
              </div>
            </div>

            {rankedSquads.length === 0 ? (
              <div className="lb-table-card lb-empty-state">
                Chưa có sĩ tử nào ghim Nguyện vọng 1. Hãy vào mục <b>Ghim NV1 ngay</b> để thành lập Quân đoàn đầu tiên!
              </div>
            ) : (
              <div className="s9-lb-squad-list">
                {rankedSquads.map((sq) => (
                  <article key={sq.code} className={`s9-lb-squad-row ${sq.isMine ? 'is-mine' : ''}`}>
                    <div className={`s9-lb-squad-rank r-${sq.rank && sq.rank <= 3 ? sq.rank : 'other'}`}>
                      {sq.isTied ? '=' : ''}#{sq.rank}
                    </div>
                    <div className="s9-lb-squad-badge">{sq.code}</div>
                    <div className="s9-lb-squad-meta">
                      <div className="s9-lb-squad-title-row">
                        <h3>{sq.uni}</h3>
                        {sq.isMine && <span className="s9-lb-squad-mine-tag">Quân đoàn của bạn</span>}
                      </div>
                      <p>
                        {sq.group} · {sq.city} · <b>{sq.members} sĩ tử thật</b> · {sq.totalStreak} tổng chuỗi
                      </p>
                    </div>
                    <div className="s9-lb-squad-score">
                      <b>{sq.totalPower.toLocaleString('vi-VN')}</b>
                      <span>Tổng Lực chiến</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Podium Top 3 (chỉ hiển thị các mục thực sự có hạng hợp lệ!) */}
        {tab !== 'squads' && !loading && podiumEntries.length > 0 && (
          <section
            className={`lb-podium ${podiumEntries.length < 3 ? 'is-compact' : ''}`}
            aria-label="Bục vinh danh Top 3"
          >
            {/* Hạng 2 - Bạc */}
            {top2 && (
              <div
                className="lb-podium-card rank-2"
                onClick={() => tab !== 'classes' && setProfileTarget({ uid: top2.uid, name: top2.name })}
                style={{ cursor: tab !== 'classes' ? 'pointer' : 'default' }}
              >
                <div className="lb-card-meta" style={{ marginBottom: 8, color: '#64748b', fontWeight: 800 }}>
                  <Svg d={ICONS.medal} size={15} /> HẠNG {top2.rank} (BẠC)
                </div>
                <div className="lb-avatar-wrap" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  {tab === 'classes' ? (
                    <ClassCrest monogram={top2.monogram} seed={top2.id} size={64} />
                  ) : (
                    <StudentAvatar uid={top2.uid} name={top2.name} photoURL={top2.photoURL} size={64} />
                  )}
                </div>
                <h3 className="lb-card-name" title={top2.name}>{top2.name}</h3>
                <div className="lb-streak-pill">
                  <Svg d={tab === 'students' ? ICONS.trophy : ICONS.fire} size={14} />
                  {tab === 'students'
                    ? `${top2.meritScore.toLocaleString('vi-VN')} điểm`
                    : tab === 'classes'
                      ? `${top2.streak} ngày · ${top2.classScore.toLocaleString('vi-VN')} đ`
                      : `${top2.streak} ngày`}
                </div>
                <div className="lb-card-meta">
                  {tab === 'classes'
                    ? `${top2.memberCount} thành viên · Tổng chuỗi ${top2.sumMemberStreaks}`
                    : `Lv.${top2.level} · ${top2.xp.toLocaleString('vi-VN')} XP`}
                </div>
              </div>
            )}

            {/* Hạng 1 - Quán Quân Vàng */}
            {top1 && (
              <div
                className="lb-podium-card rank-1"
                onClick={() => tab !== 'classes' && setProfileTarget({ uid: top1.uid, name: top1.name })}
                style={{ cursor: tab !== 'classes' ? 'pointer' : 'default' }}
              >
                <div className="lb-crown-icon" title="Quán quân">
                  <Svg d={ICONS.crown} size={26} fill="#f59e0b" />
                </div>
                <div className="lb-card-meta" style={{ marginBottom: 8, color: '#d97706', fontWeight: 800 }}>
                  <Svg d={ICONS.trophy} size={15} /> QUÁN QUÂN (HẠNG {top1.rank})
                </div>
                <div className="lb-avatar-wrap" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  {tab === 'classes' ? (
                    <ClassCrest monogram={top1.monogram} seed={top1.id} size={76} />
                  ) : (
                    <StudentAvatar uid={top1.uid} name={top1.name} photoURL={top1.photoURL} size={76} />
                  )}
                </div>
                <h3 className="lb-card-name" title={top1.name} style={{ fontSize: '1.15rem' }}>{top1.name}</h3>
                <div className="lb-streak-pill" style={{ padding: '0.28rem 0.85rem', fontSize: '0.92rem' }}>
                  <Svg d={tab === 'students' ? ICONS.trophy : ICONS.fire} size={15} />
                  {tab === 'students'
                    ? `${top1.meritScore.toLocaleString('vi-VN')} điểm`
                    : tab === 'classes'
                      ? `${top1.streak} ngày · ${top1.classScore.toLocaleString('vi-VN')} đ`
                      : `${top1.streak} ngày`}
                </div>
                <div className="lb-card-meta">
                  {tab === 'classes'
                    ? `${top1.memberCount} thành viên · Kỷ lục ${top1.record} ngày`
                    : `Lv.${top1.level} · ${top1.xp.toLocaleString('vi-VN')} XP · ${top1.focusMins}p Focus`}
                </div>
              </div>
            )}

            {/* Hạng 3 - Đồng */}
            {top3 && (
              <div
                className="lb-podium-card rank-3"
                onClick={() => tab !== 'classes' && setProfileTarget({ uid: top3.uid, name: top3.name })}
                style={{ cursor: tab !== 'classes' ? 'pointer' : 'default' }}
              >
                <div className="lb-card-meta" style={{ marginBottom: 8, color: '#b45309', fontWeight: 800 }}>
                  <Svg d={ICONS.medal} size={15} /> HẠNG {top3.rank} (ĐỒNG)
                </div>
                <div className="lb-avatar-wrap" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                  {tab === 'classes' ? (
                    <ClassCrest monogram={top3.monogram} seed={top3.id} size={60} />
                  ) : (
                    <StudentAvatar uid={top3.uid} name={top3.name} photoURL={top3.photoURL} size={60} />
                  )}
                </div>
                <h3 className="lb-card-name" title={top3.name}>{top3.name}</h3>
                <div className="lb-streak-pill">
                  <Svg d={tab === 'students' ? ICONS.trophy : ICONS.fire} size={14} />
                  {tab === 'students'
                    ? `${top3.meritScore.toLocaleString('vi-VN')} điểm`
                    : tab === 'classes'
                      ? `${top3.streak} ngày · ${top3.classScore.toLocaleString('vi-VN')} đ`
                      : `${top3.streak} ngày`}
                </div>
                <div className="lb-card-meta">
                  {tab === 'classes'
                    ? `${top3.memberCount} thành viên · Tổng chuỗi ${top3.sumMemberStreaks}`
                    : `Lv.${top3.level} · ${top3.xp.toLocaleString('vi-VN')} XP`}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Full Table */}
        {tab !== 'squads' && (
          <div className="lb-table-card">
            {loading ? (
              <div className="lb-empty-state">Đang tải dữ liệu bảng xếp hạng thời gian thực…</div>
            ) : filteredActiveList.length === 0 ? (
              <div className="lb-empty-state">
                {!user
                  ? 'Vui lòng đăng nhập để xem Bảng Xếp Hạng thời gian thực toàn hệ thống ELEC AI.'
                  : searchQuery.trim()
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có dữ liệu xếp hạng trong mục này.'}
              </div>
            ) : (
              <table className="lb-table">
                <thead>
                  <tr>
                    <th style={{ width: 68, textAlign: 'center' }}>Hạng</th>
                    <th>{tab === 'classes' ? 'Tên Lớp' : 'Học Sinh'}</th>
                    {tab === 'classes' ? (
                      <>
                        <th>Giáo viên</th>
                        <th style={{ textAlign: 'center' }}>Sĩ số</th>
                        <th style={{ textAlign: 'right' }}>Chuỗi lớp</th>
                        <th style={{ textAlign: 'right' }}>Điểm thi đua</th>
                        <th style={{ textAlign: 'right' }}>Kỷ lục</th>
                      </>
                    ) : (
                      <>
                        <th style={{ textAlign: 'center' }}>Cấp độ</th>
                        <th style={{ textAlign: 'right' }}>Chuỗi ngày</th>
                        <th style={{ textAlign: 'right' }}>Focus</th>
                        <th style={{ textAlign: 'right' }}>Tổng XP</th>
                        <th style={{ textAlign: 'right' }}>Điểm thành tích</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveList.map((item, idx) => {
                    const isMe =
                      user?.uid &&
                      (tab === 'classes'
                        ? item.teacherId === user.uid || item.memberIds?.includes(user.uid)
                        : item.uid === user.uid);

                    return (
                      <tr
                        key={item.id || item.uid || idx}
                        className={[isMe ? 'is-me' : '', item.rank === null ? 'is-unranked' : ''].filter(Boolean).join(' ')}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <RankBadge rank={item.rank} isTied={item.isTied} />
                        </td>
                        <td>
                          <div className="lb-name-cell">
                            {tab === 'classes' ? (
                              <>
                                <ClassCrest monogram={item.monogram} seed={item.id} size={34} />
                                <div className="lb-name-stack">
                                  <span style={{ fontWeight: 700 }}>{item.name}</span>
                                  {item.sumMemberStreaks > 0 && (
                                    <small>Tổng chuỗi thành viên: {item.sumMemberStreaks} ngày</small>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <StudentAvatar uid={item.uid} name={item.name} photoURL={item.photoURL} size={32} />
                                <button
                                  type="button"
                                  className="lb-name-btn"
                                  onClick={() => setProfileTarget({ uid: item.uid, name: item.name })}
                                >
                                  <span>{item.name}</span>
                                  {item.vip && <VerifiedBadge uid={item.uid} size={13} />}
                                  {isMe && <span className="lb-me-tag">Bạn</span>}
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {tab === 'classes' ? (
                          <>
                            <td style={{ color: 'var(--ink-sub, #64748b)' }}>{item.teacherName}</td>
                            <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{item.memberCount} bạn</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: item.streak > 0 ? '#ea580c' : 'var(--ink-sub, #64748b)' }}>
                              <span className="lb-metric-inline">
                                <Svg d={ICONS.fire} size={14} />
                                {item.streak} ngày
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 750, color: '#0071e3', fontVariantNumeric: 'tabular-nums' }}>
                              {item.classScore.toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--ink-sub, #64748b)', fontVariantNumeric: 'tabular-nums' }}>
                              {item.record} ngày
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>Lv.{item.level}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: item.streak > 0 ? '#ea580c' : 'var(--ink-sub, #64748b)' }}>
                              <span className="lb-metric-inline">
                                <Svg d={ICONS.fire} size={14} />
                                {item.streak} ngày
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--ink-sub, #64748b)', fontVariantNumeric: 'tabular-nums' }}>
                              <span className="lb-metric-inline">
                                <Svg d={ICONS.clock} size={13} />
                                {item.focusMins}p
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                              {item.xp.toLocaleString('vi-VN')} XP
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0071e3', fontVariantNumeric: 'tabular-nums' }}>
                              {item.meritScore.toLocaleString('vi-VN')} đ
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Sticky User Standing Bar */}
        {user && (
          <aside className="lb-sticky-bar" aria-label="Thứ hạng của bạn">
            <div className="lb-sticky-info">
              <span className="lb-sticky-rank">
                {myStanding?.rank
                  ? tab === 'squads'
                    ? `${myStanding.label} #${myStanding.rank}`
                    : `Hạng #${myStanding.rank}`
                  : 'Chưa xếp hạng'}
              </span>
              <span className="lb-sticky-text">
                {tab === 'squads' ? (
                  <>
                    Lực chiến: <b>{mySquadMetrics.power.toLocaleString('vi-VN')}</b> · ELO <b>{mySquadMetrics.elo}</b>
                  </>
                ) : tab === 'classes' && myStanding?.item ? (
                  <>
                    Lớp của bạn: <b>{myStanding.item.name}</b> ({myStanding.item.memberCount} bạn · {myStanding.item.classScore.toLocaleString('vi-VN')} đ)
                  </>
                ) : (
                  <>
                    Ngọn lửa của bạn: <b>{myStreak} ngày liên tiếp</b>
                  </>
                )}
              </span>
            </div>
            <a
              href={tab === 'squads' ? '#virtual-exams' : '#roadmap'}
              className="lb-sticky-cta"
            >
              <span>{tab === 'squads' ? 'Cày Lực chiến ngay' : 'Học tiếp để tăng hạng'}</span>
              <Svg d={ICONS.arrow} size={14} />
            </a>
          </aside>
        )}
      </div>

      {/* Profile Modal */}
      {profileTarget && (
        <ProfileCard
          targetUid={profileTarget.uid}
          fallbackName={profileTarget.name}
          onClose={() => setProfileTarget(null)}
          onOpenDm={(dmId) => {
            const target = profileTarget;
            setProfileTarget(null);
            window.dispatchEvent(
              new CustomEvent('elec-open-dm', {
                detail: { dmId, peerUid: target.uid, peerName: target.name },
              })
            );
          }}
        />
      )}

      <SpeedDuelModal
        open={duelOpen}
        uid={uid}
        onClose={() => {
          setDuelOpen(false);
          setDuelTick((t) => t + 1);
        }}
      />

      <SquadStudyRoomModal
        open={squadRoomOpen}
        onClose={() => setSquadRoomOpen(false)}
        squadCode={mySquadMetrics.code || 'ELEC'}
        squadUni={mySquadMetrics.uni}
        memberCount={mySquadStanding?.squad?.members || 1}
        userName={user?.displayName || 'Bạn'}
      />

      <RewardShopModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        uid={uid}
        displayName={user?.displayName || 'Học sinh ELEC AI'}
      />
    </div>
  );
}
