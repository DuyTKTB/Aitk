import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { IconUsers, IconSearch } from './AdminIcons.jsx';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, role, created_at')
          .order('created_at', { ascending: false })
          .limit(200);

        setUsers(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search.trim()
    ? users.filter((u) =>
        (u.display_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading) return <div className="adl-loading">Đang tải người dùng…</div>;

  return (
    <div className="adl-panel">
      <header className="adl-panel-head">
        <h3>
          <IconUsers size={16} />
          <span>Người dùng ({filtered.length})</span>
        </h3>
        <label className="adl-search">
          <IconSearch size={14} />
          <input
            type="search"
            placeholder="Tìm theo tên…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </header>

      {filtered.length === 0 ? (
        <p className="adl-empty">Chưa có người dùng nào</p>
      ) : (
        <table className="adl-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>ID</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="adl-table-user">
                    <span className="adl-table-avt">
                      {(u.display_name || 'U')[0].toUpperCase()}
                    </span>
                    <b>{u.display_name || 'Chưa đặt tên'}</b>
                  </div>
                </td>
                <td className="adl-table-id" title={u.id}>
                  {u.id.slice(0, 12)}…
                </td>
                <td>
                  <span className={'adl-role ' + (u.role || 'user')}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td className="adl-table-date">
                  {new Date(u.created_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}