/* ============================================================
   UserManager.jsx — Quản lý người dùng (Vitality)
   ============================================================ */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import AdminShell, { Topbar, ConfirmDialog, Avatar, Donut } from './AdminShell.jsx';
import {
  IconUsers, IconSearch, IconRefresh, IconCrown, IconUserCheck,
  IconEdit, IconShield, IconCheckCircle,
} from './AdminIcons.jsx';
import { ROLES } from './adminConstants.js';
import { formatDate, friendlyError } from './adminUtils.js';

const PAGE = 200;

export default function UserManager() {
  const { user } = useAuth();
  const myId = user?.uid || user?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);
  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const reqId = useRef(0);

  const fetchPage = useCallback(async (from) => {
    const { data, error: e } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, role, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (e) throw e;
    return data || [];
  }, []);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPage(0);
      if (my !== reqId.current) return;
      setUsers(rows);
      setHasMore(rows.length === PAGE);
    } catch (e) {
      if (my !== reqId.current) return;
      setError(friendlyError(e));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const rows = await fetchPage(users.length);
      setUsers((u) => [...u, ...rows.filter((r) => !u.some((x) => x.id === r.id))]);
      setHasMore(rows.length === PAGE);
    } catch (e) {
      say('Không tải thêm được: ' + friendlyError(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const counts = useMemo(() => {
    const c = { all: users.length };
    users.forEach((u) => { const r = u.role || 'user'; c[r] = (c[r] || 0) + 1; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) return false;
      if (!q) return true;
      return (u.display_name || '').toLowerCase().includes(q) || String(u.id).toLowerCase().includes(q);
    });
  }, [users, search, roleFilter]);

  const changeRole = (u, role) => {
    if (role === (u.role || 'user')) return;
    if (u.id === myId) {
      say('Bạn không thể tự đổi vai trò của chính mình.');
      return;
    }
    const roleName = ROLES.find((r) => r.id === role)?.name || role;
    setConfirm({
      title: 'Đổi vai trò',
      body: `Đổi "${u.display_name || 'Chưa đặt tên'}" thành ${roleName}?${role === 'admin' ? ' Tài khoản này sẽ có toàn quyền quản trị.' : ''}`,
      okLabel: 'Đổi vai trò',
      danger: role === 'admin',
      onOk: async () => {
        setSavingId(u.id);
        try {
          const { error: e } = await supabase.from('profiles').update({ role }).eq('id', u.id);
          if (e) throw e;
          setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
          say('Đã cập nhật vai trò');
        } catch (e) {
          say('Không đổi được: ' + friendlyError(e));
        } finally {
          setSavingId(null);
        }
      },
    });
  };

  const roleCounts = useMemo(() => ({
    all: counts.all || 0,
    user: counts.user || 0,
    teacher: counts.teacher || 0,
    admin: counts.admin || 0,
  }), [counts]);

  if (loading && users.length === 0) {
    return (
      <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-loading">
          <div className="page-loader-spinner" />
          <p>Đang tải người dùng…</p>
        </div>
      </AdminShell>
    );
  }

  if (error && users.length === 0) {
    return (
      <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
        <div className="vt-empty">
          <span><IconUsers size={30} /></span>
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="vt-btn primary" onClick={load}>Thử lại</button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="users" onChange={(k) => { window.location.hash = `admin/${k}`; }}>
      <Topbar
        title="Người dùng"
        subtitle={`${filtered.length}${hasMore ? '+' : ''} tài khoản`}
        onSearch={setSearch}
        search={search}
        placeholder="Tìm theo tên hoặc ID…"
      />

      {/* ===== HERO ===== */}
      <div className="vt-row-hero">
        <div className="vt-hero">
          <div className="vt-hero-left">
            <span className="vt-hero-label">Tổng người dùng</span>
            <div className="vt-hero-num">
              <b>{counts.all || 0}</b>
              <span>tài khoản</span>
            </div>
            <dl className="vt-hero-facts">
              <div><dt>Học sinh</dt><dd>{roleCounts.user}</dd></div>
              <div><dt>Giáo viên</dt><dd>{roleCounts.teacher}</dd></div>
              <div><dt>Quản trị</dt><dd>{roleCounts.admin}</dd></div>
            </dl>
            <div className="vt-hero-btns">
              <button type="button" className="vt-hero-btn" onClick={load} disabled={loading}>
                <IconRefresh size={14} /> {loading ? 'Đang tải…' : 'Làm mới'}
              </button>
            </div>
          </div>
          <div className="vt-hero-right">
            <div className="vt-hero-chart-head">
              <b>Phân bổ vai trò</b>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginTop: '.5rem' }}>
              <Donut value={roleCounts.user} max={Math.max(counts.all, 1)} size={130} stroke={12}>
                <strong>{counts.all ? Math.round((roleCounts.user / counts.all) * 100) : 0}<sup>%</sup></strong>
                <small>học sinh</small>
              </Donut>
              <ul className="vt-rank" style={{ flex: 1 }}>
                <li>
                  <span className="vt-rank-n">👤</span>
                  <b>Học sinh</b>
                  <span className="vt-rank-score">{roleCounts.user}</span>
                </li>
                <li>
                  <span className="vt-rank-n r2">📚</span>
                  <b>Giáo viên</b>
                  <span className="vt-rank-score">{roleCounts.teacher}</span>
                </li>
                <li>
                  <span className="vt-rank-n r1">👑</span>
                  <b>Quản trị</b>
                  <span className="vt-rank-score">{roleCounts.admin}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTER CHIPS ===== */}
      <div className="vt-card soft">
        <div className="vt-pills" role="group" aria-label="Lọc theo vai trò">
          <button
            type="button"
            className={'vt-pill sm' + (roleFilter === 'all' ? ' on' : '')}
            onClick={() => setRoleFilter('all')}
          >
            Tất cả <b>{roleCounts.all}</b>
          </button>
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={'vt-pill sm' + (roleFilter === r.id ? ' on' : '')}
              onClick={() => setRoleFilter(r.id)}
            >
              {r.name} <b>{roleCounts[r.id] || 0}</b>
            </button>
          ))}
        </div>
      </div>

      {/* ===== LIST ===== */}
      {filtered.length === 0 ? (
        <div className="vt-empty">
          <span><IconUsers size={30} /></span>
          <h3>Không có người dùng nào</h3>
          <p>{search || roleFilter !== 'all' ? 'Thử đổi bộ lọc hoặc từ khóa.' : 'Chưa có tài khoản nào trong hệ thống.'}</p>
        </div>
      ) : (
        <div className="vt-card">
          <div className="vt-table-wrap">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>ID</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isMe = u.id === myId;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Avatar name={u.display_name || 'U'} size={36} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <b style={{ display: 'block', fontSize: '.9rem' }}>
                              {u.display_name || 'Chưa đặt tên'}
                              {isMe && (
                                <span className="vt-chip" style={{ marginLeft: '.4rem', fontSize: '.62rem' }}>Bạn</span>
                              )}
                            </b>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--mut)' }}>
                        {String(u.id).slice(0, 14)}…
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <select
                            value={u.role || 'user'}
                            onChange={(e) => changeRole(u, e.target.value)}
                            disabled={isMe || savingId === u.id}
                            style={{
                              padding: '.35rem .7rem',
                              borderRadius: 999,
                              border: '1px solid var(--soft)',
                              background: isMe ? 'var(--vt-tint)' : 'var(--bg)',
                              color: 'var(--ink)',
                              fontSize: '.82rem',
                              cursor: isMe ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          {savingId === u.id && (
                            <span className="page-loader-spinner" style={{ width: 14, height: 14 }} />
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '.82rem', color: 'var(--mut)' }}>{formatDate(u.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" className="vt-btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Đang tải…' : `Tải thêm ${PAGE} người dùng`}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        okLabel={confirm?.okLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const fn = confirm?.onOk;
          setConfirm(null);
          fn?.();
        }}
      />

      {toast && <div className="vt-toast" role="status">{toast}</div>}
    </AdminShell>
  );
}