import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconExam, IconQuestion, IconTrophy, IconUsers, IconTrendUp, IconPlus,
  IconClock, IconBook, IconWarning, IconRefresh, IconEdit,
  IconKey, IconCrown, IconHourglass, IconExtend, IconCheckCircle, IconShield,
} from './AdminIcons.jsx';
import ApiUsagePanel from './ApiUsagePanel.jsx';
import AdminShell, { Topbar, Donut, setGlobalAdminBadges } from './AdminShell.jsx';
import { isProActive, daysLeft, adminExtendProUser } from '../../lib/proKeyApi.js';
import { friendlyError, formatDate } from './adminUtils.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function safeCount(query) {
  try {
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  } catch (e) {
    console.warn('[Dashboard] count lỗi:', e.message);
    return null;
  }
}

const countOf = (table) => supabase.from(table).select('*', { count: 'exact', head: true });

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partial, setPartial] = useState(false);
  const [keyStats, setKeyStats] = useState(null);
  const [extendingId, setExtendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadKeyStats = useCallback(async () => {
    try {
      const [keysRes, proRes, creditsRes] = await Promise.all([
        supabase.from('pro_keys').select('id, code, used_by, revoked, created_at, used_at, duration_days'),
        supabase.from('pro_users').select('user_id, key_code, expiry, activated_at, duration_days'),
        supabase.from('user_credits').select('balance'),
      ]);

      const keys = keysRes.data || [];
      const proUsers = proRes.data || [];
      const creditsData = creditsRes.data || [];
      const totalCredits = creditsData.reduce((acc, c) => acc + (Number(c.balance) || 0), 0);
      const userWithCredits = creditsData.filter((c) => (Number(c.balance) || 0) > 0).length;

      const unused = keys.filter((k) => !k.used_by && !k.revoked).length;
      const active = keys.filter((k) => k.used_by && !k.revoked).length;
      const revoked = keys.filter((k) => k.revoked).length;

      const proActive = proUsers.filter((u) => isProActive(u.expiry));
      const proExpired = proUsers.filter((u) => !isProActive(u.expiry));
      const soon = proActive
        .filter((u) => daysLeft(u.expiry) <= 7)
        .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        .slice(0, 5);

      const activeIds = proActive.slice(0, 30).map((u) => u.user_id).filter(Boolean);
      let profilesMap = {};
      if (activeIds.length) {
        const { data: profilesData } = await supabase
          .from('profiles').select('id, display_name, email, avatar_url').in('id', activeIds);
        if (profilesData) profilesMap = Object.fromEntries(profilesData.map((p) => [p.id, p]));
      }

      const nextStats = {
        total: keys.length, unused, active, revoked,
        proActive: proActive.length,
        proExpired: proExpired.length,
        totalCredits, userWithCredits,
        soon: soon.map((u) => ({
          ...u,
          name: profilesMap[u.user_id]?.display_name || 'Chưa đặt tên',
          email: profilesMap[u.user_id]?.email || '—',
          left: daysLeft(u.expiry),
        })),
      };
      setKeyStats(nextStats);
      setGlobalAdminBadges({
        key: unused > 0 ? unused : null,
        pro: soon.length > 0 ? soon.length : null,
      });
    } catch (e) {
      console.warn('[Dashboard] load key stats lỗi:', e.message);
      setKeyStats(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - WEEK_MS).toISOString();

      const [
        exams, questions, attempts, users,
        examsWeek, questionsWeek, attemptsWeek, usersWeek,
        noExplainCount,
      ] = await Promise.all([
        safeCount(countOf('exams')),
        safeCount(countOf('questions')),
        safeCount(countOf('exam_attempts')),
        safeCount(countOf('profiles')),
        safeCount(countOf('exams').gte('created_at', since)),
        safeCount(countOf('questions').gte('created_at', since)),
        safeCount(countOf('exam_attempts').gte('started_at', since)),
        safeCount(countOf('profiles').gte('created_at', since)),
        safeCount(countOf('questions').or('explanation.is.null,explanation.eq.')),
      ]);

      const [topRes, recentRes, emptyRes, recentAttemptsRes] = await Promise.all([
        supabase.from('exams').select('id, title, attempt_count, grade:grades(name), subject:subjects(name)')
          .order('attempt_count', { ascending: false, nullsFirst: false }).limit(5),
        supabase.from('exams').select('id, title, attempt_count, created_at, grade:grades(name), subject:subjects(name)')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('exams').select('id, title, is_published, questions(count)')
          .eq('is_published', true).limit(300),
        supabase.from('exam_attempts').select('started_at, score')
          .gte('started_at', since).order('started_at', { ascending: true }).limit(600),
      ]);

      if (topRes.error && recentRes.error) throw topRes.error;

      setPartial(
        [exams, questions, attempts, users].some((v) => v === null)
        || !!topRes.error || !!recentRes.error || !!emptyRes.error,
      );

      // Tính biểu đồ 7 ngày gần nhất từ recentAttemptsRes
      const dayBuckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        dayBuckets.push({ key, label, count: 0 });
      }
      const bucketMap = Object.fromEntries(dayBuckets.map((b) => [b.key, b]));
      (recentAttemptsRes.data || []).forEach((a) => {
        const k = String(a.started_at || '').slice(0, 10);
        if (bucketMap[k]) bucketMap[k].count += 1;
      });

      setData({
        stats: { exams, questions, attempts, users, noExplainCount: noExplainCount ?? 0 },
        week: { exams: examsWeek, questions: questionsWeek, attempts: attemptsWeek, users: usersWeek },
        dailyAttempts: dayBuckets,
        top: topRes.data || [],
        recent: recentRes.data || [],
        emptyExams: (emptyRes.data || []).filter((e) => !e.questions?.[0]?.count).slice(0, 5),
      });

      await loadKeyStats();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [loadKeyStats]);

  useEffect(() => { load(); }, [load]);

  const handleQuickExtend = async (u, days = 30) => {
    setExtendingId(u.user_id);
    try {
      await adminExtendProUser(u.user_id, days);
      say(`Đã gia hạn +${days} ngày cho ${u.name}`);
      await loadKeyStats();
    } catch (e) {
      say('Không gia hạn được: ' + friendlyError(e));
    } finally {
      setExtendingId(null);
    }
  };

  if (loading && !data) {
    return (
      <AdminShell active="dashboard" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải tổng quan…</p>
        </div>
      </AdminShell>
    );
  }

  if (error && !data) {
    return (
      <AdminShell active="dashboard" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-empty">
          <span><IconWarning size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      </AdminShell>
    );
  }

  const { stats, week, dailyAttempts = [], top, recent, emptyExams } = data;
  const maxDaily = Math.max(1, ...dailyAttempts.map((d) => d.count));

  const badges = {
    key: keyStats?.unused > 0 ? keyStats.unused : null,
    pro: keyStats?.soon?.length > 0 ? keyStats.soon.length : null,
  };

  return (
    <AdminShell
      active="dashboard"
      onChange={(k) => { window.location.hash = `admin/${k}`; }}
      badges={badges}
    >
      <Topbar
        title="Tổng quan Quản trị"
        subtitle="Số liệu hệ thống, xu hướng 7 ngày, kiểm định chất lượng đề & hạn mức AI"
        right={
          <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
            <button type="button" className="vt-btn sm primary" onClick={() => onNavigate('create')}>
              <IconPlus size={13} /> Tạo đề mới
            </button>
            <button type="button" className="vt-btn sm" onClick={() => onNavigate('keys')}>
              <IconKey size={13} /> Phát hành Key PRO
            </button>
            <button type="button" className="vt-btn sm" onClick={load} title="Làm mới dữ liệu">
              <IconRefresh size={13} /> Làm mới
            </button>
          </div>
        }
      />

      {partial && (
        <div className="vt-card soft" style={{ borderLeft: '4px solid var(--vt-amber)', padding: '.65rem 1rem' }}>
          <p className="vt-muted" style={{ margin: 0, fontSize: '.82rem' }}>
            Một số số liệu không tải được (thiếu quyền RLS hoặc bảng chưa có cột <code>created_at</code>). Phần còn lại vẫn hiển thị bình thường.
          </p>
        </div>
      )}

      {/* ===== COMPACT KPI STRIP (5 ô gọn trên 1 hàng) ===== */}
      <div className="ad-kpi-strip">
        <StatCard
          Icon={IconTrophy}
          label="Tổng lượt làm bài"
          value={stats.attempts}
          delta={week.attempts}
          onClick={() => onNavigate('activity')}
        />
        <StatCard
          Icon={IconExam}
          label="Đề thi hệ thống"
          value={stats.exams}
          delta={week.exams}
          onClick={() => onNavigate('exams')}
        />
        <StatCard
          Icon={IconQuestion}
          label="Ngân hàng câu hỏi"
          value={stats.questions}
          delta={week.questions}
          onClick={() => onNavigate('questions')}
        />
        <StatCard
          Icon={IconUsers}
          label="Tài khoản người dùng"
          value={stats.users}
          delta={week.users}
          onClick={() => onNavigate('users')}
        />
        <StatCard
          Icon={IconCrown}
          label="Giáo viên PRO"
          value={keyStats?.proActive ?? 0}
          sub={keyStats?.soon?.length ? `${keyStats.soon.length} sắp hết hạn` : `${keyStats?.unused ?? 0} key chưa dùng`}
          onClick={() => onNavigate('pro-users')}
          danger={keyStats?.soon?.length > 0}
        />
      </div>

      {/* ===== HÀNG 2: XU HƯỚNG 7 NGÀY + KIỂM ĐỊNH HỆ THỐNG & KEY PRO ===== */}
      <div className="ad-dash-row2">
        {/* Cột trái: Biểu đồ lượt làm bài 7 ngày + Tăng trưởng tuần */}
        <div className="vt-card ad-trend-card">
          <header className="vt-card-head" style={{ marginBottom: '.6rem' }}>
            <h3 className="vt-card-title">
              <IconTrendUp size={16} className="vt-title-ico" />
              Nhịp độ làm bài 7 ngày qua
            </h3>
            <span className="vt-chip ready">+{week.attempts ?? 0} lượt tuần này</span>
          </header>

          <div className="ad-bar-chart" role="img" aria-label="Biểu đồ lượt làm bài 7 ngày qua">
            {dailyAttempts.map((b) => {
              const hPct = Math.max(8, Math.round((b.count / maxDaily) * 100));
              return (
                <div key={b.key} className="ad-bar-col" title={`${b.label}: ${b.count} lượt làm bài`}>
                  <span className="ad-bar-val">{b.count}</span>
                  <div className="ad-bar-track">
                    <div className="ad-bar-fill" style={{ height: `${hPct}%` }} />
                  </div>
                  <small className="ad-bar-lbl">{b.label}</small>
                </div>
              );
            })}
          </div>

          <div className="ad-week-summary">
            <div><span>Đề mới 7 ngày</span><b>+{week.exams ?? 0}</b></div>
            <div><span>Câu hỏi mới</span><b>+{week.questions ?? 0}</b></div>
            <div><span>Học sinh mới</span><b>+{week.users ?? 0}</b></div>
            <div><span>Key PRO sẵn sàng</span><b>{keyStats?.unused ?? 0}</b></div>
          </div>
        </div>

        {/* Cột phải: Kiểm định chất lượng & Tình trạng Key PRO */}
        <div className="vt-card ad-health-card">
          <header className="vt-card-head" style={{ marginBottom: '.6rem' }}>
            <h3 className="vt-card-title">
              <IconShield size={16} className="vt-title-ico" />
              Kiểm định & Cảnh báo nhanh
            </h3>
            <button type="button" className="vt-link" onClick={() => onNavigate('keys')}>
              Quản lý Key →
            </button>
          </header>

          <div className="ad-health-grid">
            <div className={'ad-health-item' + (emptyExams.length > 0 ? ' warn' : ' ok')}>
              <span className="ad-health-ico" aria-hidden="true">
                {emptyExams.length > 0 ? <IconWarning size={16} /> : <IconCheckCircle size={16} />}
              </span>
              <div className="ad-health-info">
                <b>{emptyExams.length} đề đang hiện bị trống</b>
                <small>{emptyExams.length > 0 ? 'Học sinh vào sẽ không thấy câu hỏi' : 'Mọi đề công khai đều có câu hỏi'}</small>
              </div>
              <button type="button" className="vt-btn sm" onClick={() => onNavigate('exams')}>
                Kiểm tra
              </button>
            </div>

            <div className={'ad-health-item' + (stats.noExplainCount > 0 ? ' warn' : ' ok')}>
              <span className="ad-health-ico" aria-hidden="true">
                {stats.noExplainCount > 0 ? <IconWarning size={16} /> : <IconCheckCircle size={16} />}
              </span>
              <div className="ad-health-info">
                <b>{(stats.noExplainCount || 0).toLocaleString('vi-VN')} câu chưa có lời giải</b>
                <small>{stats.noExplainCount > 0 ? 'Nên bổ sung lời giải để học sinh ôn tập' : '100% câu hỏi đã có lời giải'}</small>
              </div>
              <button type="button" className="vt-btn sm" onClick={() => onNavigate('questions')}>
                Bổ sung
              </button>
            </div>

            <div className={'ad-health-item' + ((keyStats?.soon?.length || 0) > 0 ? ' warn' : ' ok')}>
              <span className="ad-health-ico" aria-hidden="true">
                {(keyStats?.soon?.length || 0) > 0 ? <IconWarning size={16} /> : <IconCrown size={16} />}
              </span>
              <div className="ad-health-info">
                <b>{keyStats?.soon?.length || 0} giáo viên PRO sắp hết hạn (≤7 ngày)</b>
                <small>Đang hoạt động: {keyStats?.proActive ?? 0} · Đã hết hạn: {keyStats?.proExpired ?? 0}</small>
              </div>
              <button type="button" className="vt-btn sm" onClick={() => onNavigate('pro-users')}>
                Xem PRO
              </button>
            </div>

            <div className="ad-health-item ok">
              <span className="ad-health-ico" aria-hidden="true">
                <IconShield size={16} />
              </span>
              <div className="ad-health-info">
                <b>{(keyStats?.totalCredits || 0).toLocaleString('vi-VN')} Credit AI toàn hệ thống</b>
                <small>{keyStats?.userWithCredits || 0} tài khoản đang có số dư · Nạp hoặc điều chỉnh thủ công</small>
              </div>
              <button type="button" className="vt-btn sm" onClick={() => onNavigate('users')}>
                Điểm AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== KEY SẮP HẾT HẠN (Hỗ trợ gia hạn 1 chạm ngay tại chỗ) ===== */}
      {keyStats?.soon?.length > 0 && (
        <div className="vt-card" style={{ borderLeft: '4px solid var(--vt-amber)' }}>
          <header className="vt-card-head">
            <h3 className="vt-card-title">
              <IconHourglass size={16} className="vt-title-ico" />
              Giáo viên PRO sắp hết hạn (≤7 ngày) — Gia hạn nhanh 1 chạm
            </h3>
            <button type="button" className="vt-link" onClick={() => onNavigate('pro-users')}>
              Xem tất cả →
            </button>
          </header>
          <ul className="vt-list">
            {keyStats.soon.map((u) => (
              <li key={u.user_id}>
                <span className="vt-list-ico" style={{ background: u.left <= 3 ? 'var(--vt-red)' : 'var(--vt-amber)' }}>
                  <IconExtend size={18} />
                </span>
                <div className="vt-list-main">
                  <b>{u.name}</b>
                  <small>{u.email} · mã {u.key_code} · còn <b>{u.left}</b> ngày</small>
                </div>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <button
                    type="button"
                    className="vt-btn sm primary"
                    disabled={extendingId === u.user_id}
                    onClick={() => handleQuickExtend(u, 30)}
                  >
                    {extendingId === u.user_id ? 'Đang cộng…' : '+30 ngày'}
                  </button>
                  <button
                    type="button"
                    className="vt-btn sm"
                    disabled={extendingId === u.user_id}
                    onClick={() => handleQuickExtend(u, 90)}
                  >
                    +90 ngày
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== ĐỀ TRỐNG ===== */}
      {emptyExams.length > 0 && (
        <div className="vt-card soft">
          <header className="vt-card-head">
            <h3 className="vt-card-title">
              <IconWarning size={16} className="vt-title-ico" style={{ color: 'var(--vt-amber)' }} />
              Đề đang hiện nhưng chưa có câu hỏi ({emptyExams.length})
            </h3>
          </header>
          <ul className="vt-list">
            {emptyExams.map((e) => (
              <li key={e.id}>
                <span className="vt-list-ico"><IconExam size={18} /></span>
                <div className="vt-list-main">
                  <b>{e.title}</b>
                  <small>Học sinh sẽ thấy đề trống nếu không ẩn hoặc thêm câu hỏi</small>
                </div>
                <button type="button" className="vt-btn sm primary" onClick={() => onNavigate('exams', { editId: e.id })}>
                  <IconEdit size={13} /> Thêm câu hỏi ngay
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== TOP + RECENT ===== */}
      <div className="vt-cols">
        <div className="vt-col">
          <ExamListPanel
            title="Đề được làm nhiều nhất"
            Icon={IconTrophy}
            exams={top}
            ranked
            onAll={() => onNavigate('exams')}
            onEdit={(id) => onNavigate('exams', { editId: id })}
          />
        </div>
        <aside className="vt-col side">
          <div className="vt-card" style={{ height: '100%' }}>
            <header className="vt-card-head">
              <h3 className="vt-card-title">
                <IconClock size={16} className="vt-title-ico" />
                Đề mới tạo gần đây
              </h3>
              <button type="button" className="vt-link" onClick={() => onNavigate('exams')}>
                Tất cả
              </button>
            </header>
            {recent.length === 0 ? (
              <p className="vt-muted">Chưa có đề nào.</p>
            ) : (
              <ul className="vt-list">
                {recent.map((e) => (
                  <li key={e.id} style={{ cursor: 'pointer' }} onClick={() => onNavigate('exams', { editId: e.id })}>
                    <span className="vt-list-ico"><IconExam size={16} /></span>
                    <div className="vt-list-main">
                      <b style={{ fontSize: '.86rem' }}>{e.title}</b>
                      <small>{[e.subject?.name, e.grade?.name, formatDate(e.created_at)].filter(Boolean).join(' · ')}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* ===== API USAGE ===== */}
      <ApiUsagePanel />

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </AdminShell>
  );
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */
function StatCard({ Icon, label, value, delta, sub, onClick, danger }) {
  return (
    <button
      type="button"
      className={'vt-card vt-stat-card ad-kpi-card' + (danger ? ' danger' : '')}
      onClick={onClick}
    >
      <span className={'vt-stat-ico' + (danger ? ' danger' : '')}>
        <Icon size={20} />
      </span>
      <div className="vt-stat-body">
        <small className="vt-stat-label">{label}</small>
        <div className="vt-stat-value">
          {value == null ? '—' : value.toLocaleString('vi-VN')}
        </div>
        {delta != null && delta > 0 ? (
          <small className="vt-stat-delta">
            <IconTrendUp size={11} /> +{delta} tuần này
          </small>
        ) : sub ? (
          <small className="vt-stat-sub">{sub}</small>
        ) : (
          <small className="vt-stat-sub">Ổn định</small>
        )}
      </div>
    </button>
  );
}

function ExamListPanel({ title, Icon, exams, ranked, onAll, onEdit }) {
  return (
    <div className="vt-card" style={{ height: '100%' }}>
      <header className="vt-card-head">
        <h3 className="vt-card-title">
          <Icon size={16} className="vt-title-ico" />
          {title}
        </h3>
        <button type="button" className="vt-link" onClick={onAll}>Xem tất cả</button>
      </header>
      {exams.length === 0 ? (
        <p className="vt-muted">Chưa có dữ liệu.</p>
      ) : (
        <ol className="vt-rank">
          {exams.map((e, i) => (
            <li key={e.id} style={{ cursor: 'pointer' }} onClick={() => onEdit?.(e.id)} title="Bấm để mở trình sửa đề">
              {ranked && <span className={'vt-rank-n' + (i < 3 ? ' r' + (i + 1) : '')}>{i + 1}</span>}
              <b>{e.title}</b>
              <small>{[e.subject?.name, e.grade?.name].filter(Boolean).join(' · ')}</small>
              <span className="vt-rank-score">{(e.attempt_count || 0).toLocaleString('vi-VN')} lượt</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
