import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import { IconUsers, IconSearch, IconRefresh } from './AdminIcons.jsx';
import { EmptyState, ErrorState, PageLoader, Spinner, useConfirm, useToast } from './AdminUI.jsx';
import { ROLES } from './adminConstants.js';
import { formatDate, friendlyError } from './adminUtils.js';

const PAGE = 200;

export default function UserManager() {
  const { user } = useAuth();
  const myId = user?.uid || user?.id;
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);
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
      console.error(e);
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
      toast.error('Không tải thêm được: ' + friendlyError(e));
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

  const changeRole = async (u, role) => {
    if (role === (u.role || 'user')) return;
    if (u.id === myId) {
      toast.error('Bạn không thể tự đổi vai trò của chính mình (tránh tự khóa quyền quản trị).');
      return;
    }
    const roleName = ROLES.find((r) => r.id === role)?.name || role;
    const ok = await confirm({
      title: 'Đổi vai trò',
      message: `Đổi "${u.display_name || 'Chưa đặt tên'}" thành ${roleName}?${role === 'admin' ? ' Tài khoản này sẽ có toàn quyền quản trị.' : ''}`,
      confirmText: 'Đổi vai trò',
      danger: role === 'admin',
    });
    if (!ok) return;
    setSavingId(u.id);
    try {
      const { error: e } = await supabase.from('profiles').update({ role }).eq('id', u.id);
      if (e) throw e;
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success('Đã cập nhật vai trò');
    } catch (e) {
      toast.error('Không đổi được vai trò: ' + friendlyError(e));
    } finally {
      setSavingId(null);
    }
  };

  if (loading && users.length === 0) return <PageLoader text="Đang tải người dùng…" />;
  if (error && users.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="adl-panel">
      <header className="adl-panel-head">
        <h3><IconUsers size={16} /><span>Người dùng ({filtered.length}{hasMore ? '+' : ''})</span></h3>
        <div className="adl-list-actions">
          <label className="adl-search">
            <IconSearch size={14} />
            <input type="search" placeholder="Tìm theo tên hoặc ID…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm người dùng" />
          </label>
          <button type="button" className="adl-btn-icon" onClick={load} disabled={loading} title="Làm mới" aria-label="Làm mới">
            {loading ? <Spinner size={16} /> : <IconRefresh size={16} />}
          </button>
        </div>
      </header>

      <div className="adl-chips" role="group" aria-label="Lọc theo vai trò">
        <button type="button" className={'adl-chip' + (roleFilter === 'all' ? ' on' : '')} onClick={() => setRoleFilter('all')}>Tất cả <b>{counts.all}</b></button>
        {ROLES.map((r) => (
          <button key={r.id} type="button" className={'adl-chip' + (roleFilter === r.id ? ' on' : '')} onClick={() => setRoleFilter(r.id)}>
            {r.name} <b>{counts[r.id] || 0}</b>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState Icon={IconUsers} title={search || roleFilter !== 'all' ? 'Không có người dùng khớp bộ lọc' : 'Chưa có người dùng nào'} />
      ) : (
        <div className="adl-table-wrap">
          <table className="adl-table">
            <thead><tr><th>Người dùng</th><th>ID</th><th>Vai trò</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = u.id === myId;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="adl-table-user">
                        {u.avatar_url ? (
                          <img className="adl-table-avt img" src={u.avatar_url} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <span className="adl-table-avt">{(u.display_name || 'U')[0].toUpperCase()}</span>
                        )}
                        <b>{u.display_name || 'Chưa đặt tên'}{isMe && <em className="adl-tag">Bạn</em>}</b>
                      </div>
                    </td>
                    <td className="adl-table-id" title={String(u.id)}>{String(u.id).slice(0, 12)}…</td>
                    <td>
                      <span className="adl-role-select">
                        <select
                          className={'adl-role ' + (u.role || 'user')}
                          value={u.role || 'user'}
                          onChange={(e) => changeRole(u, e.target.value)}
                          disabled={isMe || savingId === u.id}
                          aria-label={`Vai trò của ${u.display_name || 'người dùng'}`}
                        >
                          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        {savingId === u.id && <Spinner size={13} />}
                      </span>
                    </td>
                    <td className="adl-table-date">{formatDate(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="adl-more">
          <button type="button" className="adl-btn-outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Spinner size={14} /> : null} Tải thêm {PAGE} người dùng
          </button>
        </div>
      )}
    </div>
  );
}
