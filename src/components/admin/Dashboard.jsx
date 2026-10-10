import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import {
  IconExam, IconQuestion, IconTrophy, IconUsers, IconTrendUp, IconPlus,
  IconClock, IconBook, IconWarning, IconRefresh, IconEdit,
  IconKey, IconCrown, IconHourglass, IconExtend,
} from './AdminIcons.jsx';
import ApiUsagePanel from './ApiUsagePanel.jsx';
import AdminShell, { Topbar, Donut } from './AdminShell.jsx';
import { isProActive, daysLeft } from '../../lib/proKeyApi.js';
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - WEEK_MS).toISOString();

      const [exams, questions, attempts, users, examsWeek, questionsWeek, attemptsWeek, usersWeek] =
        await Promise.all([
          safeCount(countOf('exams')),
          safeCount(countOf('questions')),
          safeCount(countOf('exam_attempts')),
          safeCount(countOf('profiles')),
          safeCount(countOf('exams').gte('created_at', since)),
          safeCount(countOf('questions').gte('created_at', since)),
          safeCount(countOf('exam_attempts').gte('started_at', since)),
          safeCount(countOf('profiles').gte('created_at', since)),
        ]);

      const [topRes, recentRes, emptyRes] = await Promise.all([
        supabase
          .from('exams')
          .select('id, title, attempt_count, grade:grades(name), subject:subjects(name)')
          .order('attempt_count', { ascending: false, nullsFirst: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, title, attempt_count, created_at, grade:grades(name), subject:subjects(name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, title, is_published, questions(count)')
          .eq('is_published', true)
          .limit(300),
      ]);

      if (topRes.error && recentRes.error) throw topRes.error;

      setPartial(
        [exams, questions, attempts, users].some((v) => v === null)
        || !!topRes.error || !!recentRes.error || !!emptyRes.error,
      );

      setData({
        stats: { exams, questions, attempts, users },
        week: { exams: examsWeek, questions: questionsWeek, attempts: attemptsWeek, users: usersWeek },
        top: topRes.data || [],
        recent: recentRes.data || [],
        emptyExams: (emptyRes.data || []).filter((e) => !e.questions?.[0]?.count).slice(0, 5),
      });

      /* ---- load key stats ---- */
      await loadKeyStats();
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKeyStats = async () => {
    try {
      const [keysRes, proRes] = await Promise.all([
        supabase.from('pro_keys').select('id, code, used_by, revoked, created_at, used_at, duration_days'),
        supabase.from('pro_users').select('user_id, key_code, expiry, activated_at, duration_days'),
      ]);

      const keys = keysRes.data || [];
      const proUsers = proRes.data || [];

      const now = Date.now();
      const unused = keys.filter((k) => !k.used_by && !k.revoked).length;
      const active = keys.filter((k) => k.used_by && !k.revoked).length;
      const revoked = keys.filter((k) => k.revoked).length;

      const proActive = proUsers.filter((u) => isProActive(u.expiry));
      const proExpired = proUsers.filter((u) => !isProActive(u.expiry));
      const soon = proActive
        .filter((u) => daysLeft(u.expiry) <= 7)
        .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
        .slice(0, 5);

      // load profiles cho proUsers đang active
      const activeIds = proActive.slice(0, 30).map((u) => u.user_id).filter(Boolean);
      let profilesMap = {};
      if (activeIds.length) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url')
          .in('id', activeIds);
        if (profilesData) {
          profilesMap = Object.fromEntries(profilesData.map((p) => [p.id, p]));
        }
      }

      setKeyStats({
        total: keys.length,
        unused,
        active,
        revoked,
        proActive: proActive.length,
        proExpired: proExpired.length,
        soon: soon.map((u) => ({
          ...u,
          name: profilesMap[u.user_id]?.display_name || 'Chưa đặt tên',
          email: profilesMap[u.user_id]?.email || '—',
          left: daysLeft(u.expiry),
        })),
      });
    } catch (e) {
      console.warn('[Dashboard] load key stats lỗi:', e.message);
      setKeyStats(null);
    }
  };

  useEffect(() => { load(); }, [load]);

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

  const { stats, week, top, recent, emptyExams } = data;

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
        title="Tổng quan"
        subtitle="Số liệu hệ thống và tình trạng key PRO"
      />

      {partial && (
        <div className="vt-card soft" style={{ borderLeft: '4px solid var(--vt-amber)' }}>
          <p className="vt-muted">
            Một số số liệu không tải được (thiếu quyền hoặc bảng chưa có cột <code>created_at</code>).
            Phần còn lại vẫn hiển thị bình thường.
          </p>
        </div>
      )}

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Tổng lượt làm bài</span>
            <div className="vt-hero-num">
              <b>{(stats.attempts ?? 0).toLocaleString('vi-VN')}</b>
              <span>lượt</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Đề thi</dt><dd>{stats.exams ?? '—'}</dd></div>
              <div><dt>Câu hỏi</dt><dd>{stats.questions ?? '—'}</dd></div>
              <div><dt>Người dùng</dt><dd>{stats.users ?? '—'}</dd></div>
            </dl>
            <div className="vt-hero-btns">
              <button type="button" className="vt-hero-btn" onClick={() => onNavigate('create')}>
                <IconPlus size={14} /> Tạo đề mới
              </button>
            </div>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Tăng trưởng 7 ngày</b>
            </div>
            <ul className="vt-rank" style={{ marginTop: '.4rem' }}>
              <li><span className="vt-rank-n r1">+</span><b>Đề thi mới</b><span className="vt-rank-score">{week.exams ?? 0}</span></li>
              <li><span className="vt-rank-n r2">+</span><b>Câu hỏi mới</b><span className="vt-rank-score">{week.questions ?? 0}</span></li>
              <li><span className="vt-rank-n r3">+</span><b>Lượt làm mới</b><span className="vt-rank-score">{week.attempts ?? 0}</span></li>
              <li><span className="vt-rank-n">+</span><b>Người dùng mới</b><span className="vt-rank-score">{week.users ?? 0}</span></li>
            </ul>
          </div>
        </div>

        <div className="vt-card vt-ring-card">
          <header>
            <b>Key PRO</b>
            <small>Tổng: {keyStats?.total ?? 0}</small>
          </header>
          <Donut
            value={keyStats?.unused ?? 0}
            max={Math.max(keyStats?.total ?? 1, 1)}
            size={138}
            stroke={13}
          >
            <strong>{keyStats?.unused ?? 0}</strong>
            <small>chưa dùng</small>
          </Donut>
          <footer>
            <span>Đang hoạt động</span>
            <b>{keyStats?.proActive ?? 0}</b>
          </footer>
        </div>
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="vt-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <StatCard
          Icon={IconExam}
          label="Đề thi"
          value={stats.exams}
          delta={week.exams}
          onClick={() => onNavigate('exams')}
        />
        <StatCard
          Icon={IconQuestion}
          label="Câu hỏi"
          value={stats.questions}
          delta={week.questions}
          onClick={() => onNavigate('questions')}
        />
        <StatCard
          Icon={IconKey}
          label="Key PRO"
          value={keyStats?.total}
          sub={`${keyStats?.unused ?? 0} chưa dùng`}
          onClick={() => onNavigate('keys')}
        />
        <StatCard
          Icon={IconCrown}
          label="Giáo viên PRO"
          value={keyStats?.proActive}
          sub={keyStats?.soon?.length ? `${keyStats.soon.length} sắp hết` : 'tất cả còn hạn'}
          onClick={() => onNavigate('pro-users')}
          danger={keyStats?.soon?.length > 0}
        />
      </div>

      {/* ===== KEY SẮP HẾT HẠN ===== */}
      {keyStats?.soon?.length > 0 && (
        <div className="vt-card" style={{ borderLeft: '4px solid var(--vt-amber)' }}>
          <header className="vt-card-head">
            <h3 className="vt-card-title">
              <IconHourglass size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Key sắp hết hạn (≤7 ngày)
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
                  <small>{u.email} · key {u.key_code} · còn <b>{u.left}</b> ngày</small>
                </div>
                <button
                  type="button"
                  className="vt-btn sm primary"
                  onClick={() => onNavigate('pro-users')}
                >
                  Gia hạn
                </button>
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
              <IconWarning size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Đề đang hiện nhưng chưa có câu hỏi
            </h3>
          </header>
          <ul className="vt-list">
            {emptyExams.map((e) => (
              <li key={e.id}>
                <span className="vt-list-ico"><IconExam size={18} /></span>
                <div className="vt-list-main">
                  <b>{e.title}</b>
                  <small>Học sinh sẽ thấy đề trống</small>
                </div>
                <button
                  type="button"
                  className="vt-btn sm"
                  onClick={() => onNavigate('exams', { editId: e.id })}
                >
                  <IconEdit size={13} /> Thêm câu hỏi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== API USAGE ===== */}
      <ApiUsagePanel />

      {/* ===== TOP + RECENT ===== */}
      <div className="vt-cols">
        <div className="vt-col">
          <ExamListPanel
            title="Đề được làm nhiều nhất"
            Icon={IconTrophy}
            exams={top}
            ranked
            onAll={() => onNavigate('exams')}
          />
        </div>
        <aside className="vt-col side">
          <header className="vt-group-head">
            <h2>Đề mới tạo</h2>
            <button type="button" className="vt-link" onClick={() => onNavigate('exams')}>
              Tất cả
            </button>
          </header>
          {recent.length === 0 ? (
            <p className="vt-muted">Chưa có đề nào.</p>
          ) : (
            <ul className="vt-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <span className="vt-list-ico"><IconClock size={16} /></span>
                  <div className="vt-list-main">
                    <b style={{ fontSize: '.88rem' }}>{e.title}</b>
                    <small>{[e.subject?.name, e.grade?.name, formatDate(e.created_at)].filter(Boolean).join(' · ')}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="vt-card soft">
        <header className="vt-card-head">
          <h3 className="vt-card-title">Việc thường làm</h3>
          <button type="button" className="vt-icon-btn" onClick={load} title="Làm mới">
            <IconRefresh size={16} />
          </button>
        </header>
        <div className="vt-quick">
          <QuickAction Icon={IconExam} title="Tạo đề mới" sub="Thủ công hoặc AI" onClick={() => onNavigate('create')} />
          <QuickAction Icon={IconKey} title="Tạo key PRO" sub="Cấp cho giáo viên" onClick={() => onNavigate('keys')} />
          <QuickAction Icon={IconCrown} title="Giáo viên PRO" sub="Xem hạn sử dụng" onClick={() => onNavigate('pro-users')} />
          <QuickAction Icon={IconBook} title="Hướng dẫn" sub="Quy trình từng bước" onClick={() => onNavigate('guide')} />
        </div>
      </div>
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
      className={'vt-card' + (danger ? ' soft' : '')}
      onClick={onClick}
      style={{
        textAlign: 'left',
        display: 'flex',
        gap: '.9rem',
        alignItems: 'center',
        cursor: 'pointer',
        border: 0,
        boxShadow: danger ? '0 0 0 2px color-mix(in srgb, var(--vt-red) 45%, transparent)' : undefined,
      }}
    >
      <span
        className="vt-list-ico"
        style={{
          width: 46,
          height: 46,
          background: danger
            ? 'linear-gradient(135deg, #f87171, #ef4444)'
            : 'var(--vt-hero)',
        }}
      >
        <Icon size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <small style={{ color: 'var(--mut)', fontSize: '.72rem' }}>{label}</small>
        <div style={{ font: '800 1.4rem var(--sans)', letterSpacing: '-.03em' }}>
          {value == null ? '—' : value.toLocaleString('vi-VN')}
        </div>
        {delta != null && delta > 0 && (
          <small style={{ color: '#16a34a', fontSize: '.7rem' }}>
            <IconTrendUp size={11} style={{ verticalAlign: '-1px' }} /> +{delta} trong 7 ngày
          </small>
        )}
        {sub && (
          <small style={{ color: 'var(--mut)', fontSize: '.7rem', display: 'block' }}>{sub}</small>
        )}
      </div>
    </button>
  );
}

function ExamListPanel({ title, Icon, exams, ranked, onAll }) {
  return (
    <div className="vt-card">
      <header className="vt-card-head">
        <h3 className="vt-card-title"><Icon size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />{title}</h3>
        <button type="button" className="vt-link" onClick={onAll}>Xem tất cả</button>
      </header>
      {exams.length === 0 ? (
        <p className="vt-muted">Chưa có dữ liệu.</p>
      ) : (
        <ol className="vt-rank">
          {exams.map((e, i) => (
            <li key={e.id}>
              {ranked && <span className={'vt-rank-n' + (i < 3 ? ' r' + (i + 1) : '')}>{i + 1}</span>}
              <b>{e.title}</b>
              <small>{[e.subject?.name, e.grade?.name].filter(Boolean).join(' · ')}</small>
              <span className="vt-rank-score">{(e.attempt_count || 0).toLocaleString('vi-VN')}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function QuickAction({ Icon, title, sub, onClick }) {
  return (
    <button type="button" className="vt-qa" onClick={onClick}>
      <span><Icon size={22} /></span>
      <small><b>{title}</b><br />{sub}</small>
    </button>
  );
}